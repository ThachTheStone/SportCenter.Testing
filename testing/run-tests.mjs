import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { defaults, testCases, clientBody, coachBody } from './cases.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
function option(name, fallback) {
  const at = args.indexOf(name);
  return at < 0 ? fallback : args[at + 1];
}
const managed = args.includes('--managed');
const serveOnly = args.includes('--serve');
const selected = option('--case', '');
const config = { ...defaults, baseUrl: option('--base-url', process.env.BASE_URL || defaults.baseUrl) };
config.slaMs = Number(option('--sla-ms', config.slaMs));
for (const key of Object.keys(defaults)) {
  if (key.endsWith('Email') || key.endsWith('Password')) {
    const envName = key.replace(/[A-Z]/g, c => '_' + c).toUpperCase();
    if (process.env[envName]) config[key] = process.env[envName];
  }
}
const backend = path.resolve(option('--backend', path.join(here, '..', 'backend')));
const reportDir = path.resolve(option('--report-dir', path.join(here, 'reports')));
const php = option('--php', process.platform === 'win32' ? 'C:\\xampp\\php\\php.exe' : 'php');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function valueAt(data, dotted) {
  return dotted ? dotted.split('.').reduce((value, part) => value == null ? undefined : value[part], data) : data;
}
function resolve(value, vars) {
  if (typeof value === 'string') {
    const exact = value.match(/^\{\{([^}]+)\}\}$/);
    if (exact) {
      assert.notEqual(vars[exact[1]], undefined, 'Missing variable ' + exact[1]);
      return vars[exact[1]];
    }
    return value.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
      assert.notEqual(vars[key], undefined, 'Missing variable ' + key);
      return String(vars[key]);
    });
  }
  if (Array.isArray(value)) return value.map(v => resolve(v, vars));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, resolve(v, vars)]));
  return value;
}
function verify(check, data, vars) {
  const actual = valueAt(data, check.path);
  const expected = resolve(check.value, vars);
  const label = check.op + ' ' + (check.path || '$');
  switch (check.op) {
    case 'exists': assert.ok(actual !== undefined && actual !== null, label); break;
    case 'eq':
      if (typeof expected === 'number') assert.equal(Number(actual), expected, label);
      else assert.deepEqual(actual, expected, label);
      break;
    case 'array': assert.ok(Array.isArray(actual), label); break;
    case 'nonEmpty': assert.ok(Array.isArray(actual) && actual.length > 0, label); break;
    case 'contains': assert.ok(String(actual).toLowerCase().includes(String(expected).toLowerCase()), label); break;
    case 'regex': assert.match(String(actual), new RegExp(expected), label); break;
    case 'nonNegative': assert.ok(actual != null && Number.isFinite(Number(actual)) && Number(actual) >= 0, label); break;
    case 'everyKeys':
      assert.ok(Array.isArray(actual) && actual.length > 0, label);
      for (const row of actual) for (const key of expected) assert.ok(row[key] !== undefined && row[key] !== null, label + '/' + key);
      break;
    case 'search':
      assert.ok(Array.isArray(actual) && actual.length > 0, label);
      for (const row of actual) assert.ok([row.nom, row.prenom, row.user?.email].some(v => String(v || '').toLowerCase().includes(String(expected).toLowerCase())), label);
      break;
    case 'overdue':
      assert.ok(Array.isArray(actual) && actual.length > 0, label);
      for (const row of actual) {
        assert.equal(row.statut, 'en_attente', label);
        assert.ok(Number.isFinite(Date.parse(row.date_echeance)) && Date.parse(row.date_echeance) < Date.now(), label);
      }
      break;
    case 'coachOwnership':
      assert.ok(Array.isArray(actual), label);
      for (const row of actual) assert.equal(Number(row.coach_id), Number(expected), label);
      break;
    case 'balance':
      assert.ok(Math.abs(Number(actual.total_paye) + Number(actual.total_restant) - Number(actual.montant_annuel)) < 0.01, label);
      break;
    default: throw new Error('Unknown assertion: ' + check.op);
  }
}
async function runCase(tc) {
  const started = performance.now();
  const now = new Date();
  const vars = { ...config, uniqueEmail: 'qa-' + randomUUID() + '@test.local', today: now.toISOString().slice(0, 10), month: now.getUTCMonth() + 1, year: now.getUTCFullYear() };
  const tokens = {};
  const clients = new Set();
  const coaches = new Set();
  const requests = [];
  const cleanupErrors = [];
  let error;
  let setupDone = false;
  async function http(method, urlPath, body, token, isMain = false) {
    const begin = performance.now();
    const response = await fetch(config.baseUrl.replace(/\/$/, '') + urlPath, {
      method, redirect: 'manual',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      ...(body == null ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(config.timeoutMs)
    });
    const text = await response.text();
    const ms = Math.round(performance.now() - begin);
    requests.push({ phase: isMain ? 'test' : 'setup/cleanup', method, path: urlPath, expected: null, status: response.status, ms });
    let data;
    try { data = JSON.parse(text); } catch { throw new Error(method + ' ' + urlPath + ' returned non-JSON (HTTP ' + response.status + ')'); }
    assert.match(response.headers.get('content-type') || '', /application\/json/i, 'JSON Content-Type');
    assert.ok(!text.includes('SQLSTATE') && !text.includes('Stack trace'), 'No SQL/stack leak');
    for (const key of ['exception', 'trace', 'file']) assert.ok(!Object.hasOwn(data, key), 'No debug leak: ' + key);
    if (isMain) assert.ok(ms <= config.slaMs, 'Response SLA ' + ms + 'ms > ' + config.slaMs + 'ms');
    return { status: response.status, data };
  }
  async function roleToken(role) {
    if (!tokens[role]) {
      const prefix = role === 'otherCoach' ? 'otherCoach' : role;
      const r = await http('POST', '/login', { email: config[prefix + 'Email'], password: config[prefix + 'Password'] }, null);
      assert.equal(r.status, 200, 'Setup login ' + role);
      assert.ok(r.data.token, 'Setup token ' + role);
      tokens[role] = r.data.token;
    }
    return tokens[role];
  }
  async function identity(role) {
    const r = await http('GET', '/me', null, await roleToken(role));
    assert.equal(r.status, 200, 'Setup /me');
    assert.ok(r.data.profile?.id, 'Setup profile exists for ' + role);
    return r.data.profile.id;
  }
  async function createClient(foreign = false) {
    vars.coachId = await identity('coach');
    const assignedCoachId = foreign ? await identity('otherCoach') : vars.coachId;
    const r = await http('POST', '/admin/clients', { ...resolve(clientBody, vars), coach_id: assignedCoachId }, await roleToken('admin'));
    assert.equal(r.status, 201, 'Setup create client');
    vars.clientId = r.data.client.id;
    clients.add(vars.clientId);
  }
  try {
    for (const fixture of tc.setup) {
      if (fixture === 'coachIdentity') vars.coachId = await identity('coach');
      else if (fixture === 'freshClient') await createClient();
      else if (fixture === 'foreignClient') await createClient(true);
      else if (fixture === 'paymentClient') {
        await createClient();
        const r = await http('GET', '/admin/clients/' + vars.clientId, null, await roleToken('admin'));
        assert.equal(r.status, 200, 'Setup client installment');
        const installment = r.data.cotisations[0].echeances[0];
        vars.echeanceId = installment.id;
        vars.echeanceAmount = Number(installment.montant);
      } else if (fixture === 'payInstallment') {
        const r = await http('POST', '/admin/paiements', { echeance_id: vars.echeanceId, montant: vars.echeanceAmount, methode: 'carte', date_paiement: vars.today }, await roleToken('admin'));
        assert.equal(r.status, 201, 'Setup first payment');
      } else throw new Error('Unknown fixture ' + fixture);
    }
    setupDone = true;
    for (const step of tc.steps) {
      const token = step.token ? resolve(step.token, vars) : step.role ? await roleToken(step.role) : null;
      const r = await http(step.method, resolve(step.path, vars), resolve(step.body, vars), token, true);
      requests.at(-1).expected = step.status;
      // Track successful creations BEFORE assertions so cleanup still runs on a later assertion failure.
      if (step.trackClient && r.status === 201 && r.data.client?.id) clients.add(r.data.client.id);
      if (step.trackCoach && r.status === 201 && r.data.coach?.id) coaches.add(r.data.coach.id);
      if (step.trackRegistration && r.status === 201 && r.data.token) {
        const profile = await http('GET', '/me', null, r.data.token);
        assert.equal(profile.status, 200, 'Registration cleanup identity');
        clients.add(profile.data.profile.id);
      }
      assert.equal(r.status, step.status, step.name + ': HTTP expected ' + step.status + ', actual ' + r.status);
      for (const c of step.checks) verify(c, r.data, vars);
      for (const [key, source] of Object.entries(step.capture || {})) {
        vars[key] = valueAt(r.data, source);
        assert.notEqual(vars[key], undefined, 'Capture ' + source);
      }
    }
  } catch (e) { error = e.message; }
  finally {
    for (const [resource, ids] of [['clients', clients], ['coaches', coaches]]) {
      for (const id of ids) {
        try {
          const r = await http('DELETE', '/admin/' + resource + '/' + id, null, await roleToken('admin'));
          assert.ok([200, 404].includes(r.status), 'Cleanup HTTP ' + r.status);
        } catch (e) { cleanupErrors.push(resource + '/' + id + ': ' + e.message); }
      }
    }
    // Revoke only tokens issued by this case; user accounts and their existing tokens are preserved.
    for (const token of Object.values(tokens)) {
      try {
        const r = await http('POST', '/logout', null, token);
        assert.ok([200, 401].includes(r.status), 'Token cleanup HTTP ' + r.status);
      } catch (e) { cleanupErrors.push('Token cleanup: ' + e.message); }
    }
    for (const key of ['registeredToken', 'logoutToken', 'deletedUserToken']) {
      if (vars[key]) {
        try {
          const r = await http('POST', '/logout', null, vars[key]);
          assert.ok([200, 401].includes(r.status), 'Scenario token cleanup');
        } catch (e) { cleanupErrors.push('Scenario token cleanup: ' + e.message); }
      }
    }
  }
  if (cleanupErrors.length) error = (error ? error + '; ' : '') + cleanupErrors.join('; ');
  return { id: tc.id, suite: tc.suite, title: tc.title, result: error ? (setupDone ? 'Fail' : 'Blocked') : 'Pass',
    knownDefect: tc.defect || null, error: error || null, durationMs: Math.round(performance.now() - started), requests, cleanupErrors };
}
function xmlEscape(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}
function writeReport(report) {
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(path.join(reportDir, 'results.json'), JSON.stringify(report, null, 2));
  const rows = report.cases.map(tc => '<tr><td>' + xmlEscape(tc.id) + '</td><td>' + xmlEscape(tc.title) + '</td><td>' + tc.result + '</td><td>' + tc.durationMs + '</td><td>' + xmlEscape(tc.error) + '</td></tr>').join('');
  fs.writeFileSync(path.join(reportDir, 'report.html'), '<!doctype html><html lang="vi"><meta charset="utf-8"><title>SportCenter API results</title><style>body{font:15px system-ui;margin:32px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:9px;text-align:left}th{background:#17446e;color:white}</style><h1>SportCenter API — ' + report.summary.pass + '/' + report.summary.total + ' Pass</h1><p>' + xmlEscape(report.timestamp) + ' | ' + xmlEscape(report.mode) + ' | Commit ' + xmlEscape(report.commit) + '</p><p>HTTP runner results. ReadyAPI GUI execution is recorded separately.</p><table><tr><th>ID</th><th>Test case</th><th>Result</th><th>ms</th><th>Failure</th></tr>' + rows + '</table></html>');
  const junit = report.cases.map(tc => '<testcase classname="' + xmlEscape(tc.suite) + '" name="' + tc.id + '" time="' + (tc.durationMs / 1000) + '">' +
    (tc.result === 'Pass' ? '' : '<failure message="' + xmlEscape(tc.error) + '">' + xmlEscape(tc.error) + '</failure>') + '</testcase>').join('');
  fs.writeFileSync(path.join(reportDir, 'junit.xml'), '<?xml version="1.0" encoding="UTF-8"?><testsuite name="SportCenter API" tests="' + report.summary.total + '" failures="' + (report.summary.fail + report.summary.blocked) + '">' + junit + '</testsuite>');
}
let server;
let runtimeDir;
let serverOutput = '';
try {
  if (!Number.isFinite(config.slaMs) || config.slaMs <= 0) throw new Error('Invalid --sla-ms');
  const selectedCases = testCases.filter(tc => !selected || tc.id === selected);
  if (!selectedCases.length) throw new Error('Unknown case: ' + selected);
  if (managed) {
    assert.ok(fs.existsSync(path.join(backend, 'vendor', 'autoload.php')), 'Run composer install in backend first');
    assert.ok(!fs.existsSync(path.join(backend, 'bootstrap', 'cache', 'config.php')), 'Managed mode requires uncached Laravel config');
    runtimeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sportcenter-api-run-'));
    const db = path.join(runtimeDir, 'test.sqlite');
    fs.writeFileSync(db, '');
    const env = { ...process.env, APP_ENV: 'testing', APP_DEBUG: 'false', APP_KEY: 'base64:' + randomBytes(32).toString('base64'),
      DB_CONNECTION: 'sqlite', DB_DATABASE: db, DB_URL: '', CACHE_STORE: 'array', SESSION_DRIVER: 'array',
      QUEUE_CONNECTION: 'sync', MAIL_MAILER: 'log', BCRYPT_ROUNDS: '4', LOG_CHANNEL: 'stderr',
      APP_CONFIG_CACHE: path.join(runtimeDir, 'unused-config.php') };
    const migration = spawnSync(php, ['artisan', 'migrate', '--seed', '--force', '--no-ansi'], { cwd: backend, env, encoding: 'utf8', windowsHide: true, timeout: 120000 });
    if (migration.error || migration.status !== 0) throw new Error('Isolated database setup failed: ' + (migration.error?.message || migration.stdout + migration.stderr));
    const probe = net.createServer();
    await new Promise((resolve, reject) => { probe.once('error', reject); probe.listen(0, '127.0.0.1', resolve); });
    const port = probe.address().port;
    await new Promise(resolve => probe.close(resolve));
    // Direct php -S gives us one owned process to stop, without artisan's child-process wrapper.
    server = spawn(php, ['-S', '127.0.0.1:' + port, '-t', path.join(backend, 'public'), path.join(backend, 'vendor', 'laravel', 'framework', 'src', 'Illuminate', 'Foundation', 'resources', 'server.php')],
      { cwd: path.join(backend, 'public'), env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    server.on('error', e => { serverOutput += e.message; });
    server.stdout.on('data', d => { serverOutput += d; });
    server.stderr.on('data', d => { serverOutput += d; });
    config.baseUrl = 'http://127.0.0.1:' + port + '/api';
    let ready = false;
    for (let attempt = 0; attempt < 80; attempt++) {
      if (server.exitCode !== null) throw new Error('API server exited: ' + serverOutput.slice(-3000));
      try {
        const response = await fetch(config.baseUrl + '/me', { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(1000) });
        if (response.status === 401) { ready = true; break; }
      } catch {}
      await sleep(250);
    }
    if (!ready) throw new Error('API readiness failed: ' + serverOutput.slice(-3000));
    console.log('Isolated SQLite API ready; ' + selectedCases.length + ' cases.');
  }
  if (serveOnly) {
    assert.ok(managed, '--serve requires --managed');
    console.log('ReadyAPI baseUrl: ' + config.baseUrl);
    console.log('Keep this terminal open. Press Ctrl+C to stop the isolated API.');
    await new Promise(resolve => { process.once('SIGINT', resolve); process.once('SIGTERM', resolve); });
  } else {
  let results = [];
  const groovyClasspath = option('--groovy-classpath', '');
  if (groovyClasspath) {
    assert.ok(!selected, '--case is supported by the Node runner only');
    fs.mkdirSync(reportDir, { recursive: true });
    const rawResult = path.join(reportDir, 'groovy-raw.json');
    const verification = spawnSync('java', ['-cp', groovyClasspath, 'groovy.ui.GroovyMain', path.join(here, 'verify-readyapi.groovy'), path.join(here, 'VIPSportCenter-readyapi-project.xml'), config.baseUrl, rawResult], { encoding: 'utf8', windowsHide: true, timeout: 240000, maxBuffer: 4 * 1024 * 1024 });
    console.log(verification.stdout || '');
    if (verification.error || verification.status !== 0) throw new Error('Groovy verifier failed: ' + (verification.error?.message || verification.stderr));
    results = JSON.parse(fs.readFileSync(rawResult, 'utf8'));
    assert.equal(results.length, testCases.length, 'Groovy case count');
  } else {
    for (const tc of selectedCases) {
      const result = await runCase(tc);
      results.push(result);
      console.log(result.result.padEnd(7) + ' ' + tc.id + (result.error ? ' — ' + result.error : ''));
    }
  }
  const git = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: backend, encoding: 'utf8', windowsHide: true });
  const report = { timestamp: new Date().toISOString(), mode: (groovyClasspath ? 'ReadyAPI Groovy script integration / ' : 'HTTP integration / ') + (managed ? 'isolated SQLite' : 'configured API'),
    readyApiGui: 'Not run', commit: git.stdout?.trim() || 'unknown', baseUrl: config.baseUrl, slaMs: config.slaMs,
    summary: { total: results.length, pass: results.filter(r => r.result === 'Pass').length, fail: results.filter(r => r.result === 'Fail').length, blocked: results.filter(r => r.result === 'Blocked').length },
    cases: results };
  writeReport(report);
  console.log(JSON.stringify(report.summary));
  console.log('Reports: ' + reportDir);
  process.exitCode = report.summary.fail || report.summary.blocked ? 1 : 0;
  }
} catch (e) {
  console.error(e.stack || e);
  process.exitCode = 2;
} finally {
  if (server && server.exitCode === null) {
    server.kill();
    await Promise.race([new Promise(resolve => server.once('exit', resolve)), sleep(2000)]);
  }
  // Database is intentionally retained for inspecting defects; it contains only this run's QA data.
  if (runtimeDir) console.log('Isolated run database: ' + runtimeDir);
}
