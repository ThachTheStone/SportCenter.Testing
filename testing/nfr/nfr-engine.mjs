import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

export function assertLab(config) {
  const target = new URL(config.baseUrl);
  assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname), 'NFR tests require localhost');
  assert.equal(String(config.nfrLabOnly), 'true', 'Confirm isolated seeded lab with nfrLabOnly=true');
  assert.ok(!target.username && !target.password, 'URL must not embed credentials');
  assert.ok(Number(config.timeoutMs) > 0 && Number(config.timeoutMs) <= 5000, 'Timeout must be 1..5000ms');
}
export function distribution(samples, elapsedMs) {
  const latencies = samples.map(s => s.ms).sort((a, b) => a - b);
  const rank = p => latencies[Math.max(0, Math.ceil(latencies.length * p) - 1)] ?? 0;
  const errors = samples.filter(s => s.error || s.status !== 200 || !s.valid).length;
  return { requests: samples.length, errors, errorRate: samples.length ? errors / samples.length : 1,
    p50Ms: rank(.5), p95Ms: rank(.95), p99Ms: rank(.99), maxMs: latencies.at(-1) ?? 0,
    elapsedMs: Math.round(elapsedMs), throughputRps: Number((samples.length / Math.max(elapsedMs / 1000, .001)).toFixed(2)) };
}
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
function payloadValid(route, data) {
  if (route.path === '/me') return data.role === route.role && Boolean(data.profile?.id);
  if (route.path === '/admin/clients') return Array.isArray(data.data) && data.per_page === 10;
  if (route.path === '/coach/clients') return Array.isArray(data);
  if (route.path === '/client/paiements') return Array.isArray(data.echeances) &&
    Math.abs(Number(data.total_paye) + Number(data.total_restant) - Number(data.montant_annuel)) < .01;
  return ['total_encaisse', 'total_en_attente', 'total_en_retard'].every(k => data[k] != null && Number.isFinite(Number(data[k])) && Number(data[k]) >= 0) && Array.isArray(data.par_methode);
}
export async function runNfrCase(tc, config) {
  assertLab(config);
  const started = performance.now(), records = [], cleanupErrors = [], tokens = {}, allTokens = new Set(), clients = new Set();
  const email = 'nfr-' + randomUUID() + '@test.local', today = new Date().toISOString().slice(0, 10);
  let setupDone = false, error = null, metrics = null, observations = {};
  async function http(method, route, body = null, token = null, phase = 'test') {
    const begin = performance.now();
    const row = { phase, method, path: route, status: null, ms: 0 };
    try {
      const response = await fetch(config.baseUrl.replace(/\/$/, '') + route, { method, redirect: 'manual',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
        ...(body == null ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(Number(config.timeoutMs)) });
      const text = await response.text();
      row.status = response.status;
      const data = JSON.parse(text);
      assert.match(response.headers.get('content-type') || '', /application\/json/i, 'Expected JSON response');
      return { status: response.status, data, text, retryAfter: response.headers.get('retry-after'), row };
    } catch (e) { row.error = e.name === 'TimeoutError' ? 'Request timeout' : 'Transport/non-JSON response error'; e.nfrRow = row; throw e; }
    finally { row.ms = Number((performance.now() - begin).toFixed(2)); records.push(row); }
  }
  async function login(role, phase = 'setup') {
    if (!tokens[role]) {
      const r = await http('POST', '/login', { email: config[role + 'Email'], password: config[role + 'Password'] }, null, phase);
      assert.equal(r.status, 200, 'Login setup ' + role);
      assert.ok(r.data.token, 'Missing setup token'); tokens[role] = r.data.token; allTokens.add(r.data.token);
    }
    return tokens[role];
  }
  async function newClient(owner = 'coach') {
    const identity = await http('GET', '/me', null, await login(owner), 'setup');
    assert.equal(identity.status, 200); assert.ok(identity.data.profile?.id);
    const r = await http('POST', '/admin/clients', { prenom: 'NFR', nom: 'QA', email, password: 'Password123!',
      coach_id: identity.data.profile.id, montant_annuel: 3600 }, await login('admin'), 'setup');
    assert.equal(r.status, 201); assert.ok(r.data.client?.id); clients.add(r.data.client.id);
    return r.data.client.id;
  }
  function denied(r, statuses = [401]) {
    assert.ok(statuses.includes(r.status), 'Denied HTTP expected ' + statuses.join('/') + ', actual ' + r.status);
    assert.ok(Object.hasOwn(r.data, 'message') && !r.data.user && !r.data.profile && !r.data.token && !r.data.seance && !r.data.bilans_physiques, 'Denied response must not expose protected data');
  }
  function noSecrets(value) {
    if (Array.isArray(value)) return value.forEach(noSecrets);
    if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) {
      assert.ok(!['password', 'password_hash', 'remember_token', 'access_token', 'token'].includes(key.toLowerCase()), 'Secret field leaked: ' + key); noSecrets(child);
    }
  }
  function noDebug(r) {
    assert.ok(!/SQLSTATE|Stack trace|vendor[\\/]|\.php on line/i.test(r.text), 'Error disclosure');
    const walk = value => { if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) {
      assert.ok(!['exception', 'trace', 'file'].includes(k), 'Debug key leaked: ' + k); walk(v);
    } }; walk(r.data);
  }
  async function batch(phase) {
    assert.ok(phase.concurrency >= 1 && phase.concurrency <= 5 && phase.count > 0 && phase.count <= 100, 'Unsafe load size');
    const samples = [], begin = performance.now(); let next = 0;
    await Promise.all(Array.from({ length: phase.concurrency }, async () => {
      while (next < phase.count && (!tc.durationMs || performance.now() - begin < tc.durationMs)) {
        const index = next++, route = tc.routes[index % tc.routes.length], attemptStart = performance.now();
        try { const r = await http('GET', route.path, null, tokens[route.role], phase.name); r.row.valid = payloadValid(route, r.data); samples.push(r.row); }
        catch (e) { samples.push(e.nfrRow || { status: null, ms: Number(config.timeoutMs), error: 'Request failed', valid: false }); }
        if (tc.paceMs) await pause(Math.max(0, tc.paceMs - (performance.now() - attemptStart)));
      }
    }));
    return { phase: phase.name, concurrency: phase.concurrency, ...distribution(samples, performance.now() - begin), samples };
  }
  try {
    if (tc.kind === 'performance') {
      for (const role of new Set(tc.routes.map(r => r.role))) await login(role);
      for (let i = 0; i < tc.warmup; i++) { const route = tc.routes[i % tc.routes.length]; const r = await http('GET', route.path, null, tokens[route.role], 'warmup'); assert.equal(r.status, 200); assert.ok(payloadValid(route, r.data), 'Warmup payload invalid'); }
      setupDone = true;
      const phases = [];
      for (const phase of tc.phases || [{ name: 'measured', count: tc.count, concurrency: tc.concurrency }]) phases.push(await batch(phase));
      metrics = { percentileMethod: 'nearest-rank', phases: phases.map(({ samples, ...summary }) => summary) };
      for (let i = 0; i < phases.length; i++) { const phase = phases[i]; assert.ok(phase.requests >= (tc.minimumSamples || (tc.phases ? tc.phases[i].count : tc.count)), 'Insufficient samples');
        assert.ok(phase.errorRate <= tc.errorRate, 'Unexpected status/payload/transport error rate'); assert.ok(phase.p95Ms <= tc.p95Ms, 'p95 exceeds proposed lab target'); assert.ok(phase.maxMs <= tc.maxMs, 'max latency exceeds proposed lab target'); }
      if (tc.phases) { const [base, , recovery] = phases; const target = Math.max(tc.recoveryFloorMs, base.p95Ms * tc.recoveryFactor); metrics.recoveryLimitMs = target; assert.ok(recovery.p95Ms <= target, 'Recovery p95 degraded'); }
    } else {
      // Fixtures are inside each case; never rely on preceding testcase IDs.
      if (tc.action === 'invalidToken') { setupDone = true; denied(await http('GET', '/me', null, '999999|not-a-real-token')); }
      else if (tc.action === 'tamperedToken') { const token = await login('client'); setupDone = true;
        const modified = token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a'); denied(await http('GET', '/me', null, modified)); assert.equal((await http('GET', '/me', null, token)).status, 200); }
      else if (tc.action === 'revokedToken') { const token = await login('client'); setupDone = true;
        assert.equal((await http('POST', '/logout', null, token)).status, 200); denied(await http('GET', '/me', null, token)); }
      else if (tc.action === 'roleMatrix') { const id = await newClient(); await login('client'); setupDone = true;
        for (const role of ['client', 'coach']) denied(await http('GET', '/admin/clients', null, tokens[role]), [403]);
        denied(await http('PUT', '/admin/clients/' + id, { statut: 'suspendu' }, tokens.client), [403]);
        const r = await http('GET', '/admin/clients/' + id, null, tokens.admin); assert.equal(r.status, 200); assert.equal(r.data.statut, 'actif'); }
      else if (tc.action === 'massAssignment') { await login('admin'); setupDone = true;
        const r = await http('POST', '/register', { name: 'NFR QA', email, password: 'Password123!', password_confirmation: 'Password123!', specialite: 'Musculation', plan: 'mensuel', payment_method: 'cash', role: 'admin', active: true });
        if (r.status === 201 && r.data.token) { allTokens.add(r.data.token); const profile = await http('GET', '/me', null, r.data.token); if (profile.data.profile?.id) clients.add(profile.data.profile.id);
          assert.equal(profile.status, 200); assert.equal(profile.data.role, 'client'); denied(await http('GET', '/admin/clients', null, r.data.token), [403]); }
        else assert.equal(r.status, 422, 'Registration must reject injection or force client role'); }
      else if (tc.action === 'objectRead') { const id = await newClient('otherCoach'); await login('coach'); setupDone = true;
        assert.equal((await http('GET', '/coach/clients/' + id + '/bilans', null, tokens.otherCoach)).status, 200);
        denied(await http('GET', '/coach/clients/' + id + '/bilans', null, tokens.coach), [403, 404]); }
      else if (tc.action === 'objectWrite') { await login('otherCoach'); await login('coach');
        const planningPath = '/coach/planning?mois=' + Number(today.slice(5, 7)) + '&annee=' + today.slice(0, 4);
        const seedPlanning = await http('GET', planningPath, null, tokens.otherCoach, 'setup');
        assert.equal(seedPlanning.status, 200); const existingPlanning = seedPlanning.data.plannings[0]; assert.ok(existingPlanning?.client_id, 'Seed an owner planning first');
        const created = await http('POST', '/coach/planning/seances', { client_id: existingPlanning.client_id, date: today, heure_debut: '10:00', heure_fin: '11:00', lieu: 'NFR QA', notes: email }, tokens.otherCoach, 'setup');
        assert.equal(created.status, 201); const sessionId = created.data.seance?.id; assert.ok(sessionId);
        const findSession = data => data.plannings.flatMap(p => p.seances).find(s => s.id === sessionId);
        const before = await http('GET', planningPath, null, tokens.otherCoach, 'setup'); assert.equal(before.status, 200); assert.equal(findSession(before.data)?.seance_realisee, null);
        setupDone = true;
        const r = await http('POST', '/coach/seances/' + sessionId + '/realiser', { present: true, effort_percu: 5, remarques_coach: 'NFR unauthorized probe' }, tokens.coach);
        const after = await http('GET', planningPath, null, tokens.otherCoach); assert.equal(after.status, 200);
        assert.ok(findSession(after.data), 'QA session missing after request');
        observations = { attemptedStatus: r.status, foreignWritePersisted: findSession(after.data).seance_realisee != null };
        assert.ok([403, 404].includes(r.status) && !observations.foreignWritePersisted, 'BOLA: foreign coach write accepted or persisted; HTTP=' + r.status + ', persisted=' + observations.foreignWritePersisted); }
      else if (tc.action === 'sensitiveData') { const id = await newClient(); setupDone = true;
        for (const route of ['/me', '/admin/clients', '/admin/clients/' + id]) { const r = await http('GET', route, null, tokens.admin); assert.equal(r.status, 200); noSecrets(r.data); } }
      else if (tc.action === 'errorLeak') { await login('admin'); setupDone = true;
        for (const [method, route, body, token, status] of [['POST', '/login', {}, null, 422], ['GET', '/admin/clients/2147483647', null, tokens.admin, 404], ['GET', '/nfr-route-not-found', null, null, 404]]) {
          const r = await http(method, route, body, token); assert.equal(r.status, status); noDebug(r); } }
      else if (tc.action === 'enumeration') { await newClient(); setupDone = true;
        const unknown = await http('POST', '/login', { email: 'absent-' + email, password: 'Wrong123!' });
        const known = await http('POST', '/login', { email, password: 'Wrong123!' });
        observations = { unknownStatus: unknown.status, knownStatus: known.status, unknownMessage: unknown.data.message, knownMessage: known.data.message };
        assert.equal(unknown.status, 401); assert.equal(known.status, 401); assert.equal(unknown.data.message, known.data.message, 'PROPOSED policy: account enumeration via different error messages'); }
      else if (tc.action === 'rateLimit') { setupDone = true; let limited = null;
        assert.ok(tc.attempts <= 25); for (let i = 0; i < tc.attempts; i++) { const r = await http('POST', '/login', { email, password: 'Wrong123!' }); if (r.status === 429) { limited = r; break; } assert.equal(r.status, 401); }
        observations = { attempts: records.filter(r => r.phase === 'test').length, throttled: Boolean(limited), retryAfter: limited?.retryAfter || null };
        assert.ok(limited, 'PROPOSED lab anti-abuse policy: no 429 in bounded 25-request login burst'); assert.ok(Number(limited.retryAfter) > 0, 'Missing positive Retry-After'); }
      else throw new Error('Unknown NFR action');
    }
  } catch (e) { error = e.message; }
  finally {
    for (const id of clients) try { const r = await http('DELETE', '/admin/clients/' + id, null, await login('admin'), 'cleanup'); assert.ok([200, 404].includes(r.status)); } catch { cleanupErrors.push('QA client cleanup failed: ' + id); }
    for (const token of allTokens) try { const r = await http('POST', '/logout', null, token, 'cleanup'); assert.ok([200, 401].includes(r.status)); } catch { cleanupErrors.push('Issued-token cleanup failed'); }
  }
  if (cleanupErrors.length) error = [error, ...cleanupErrors].filter(Boolean).join('; ');
  return { id: tc.id, title: tc.title, suite: tc.suite, category: tc.category, result: error ? (setupDone ? 'Fail' : 'Blocked') : 'Pass',
    error, knownDefect: tc.defect || null, durationMs: Math.round(performance.now() - started), metrics, observations, requests: records, cleanupErrors };
}
