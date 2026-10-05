import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { assertLab, distribution, runNfrCase } from './nfr-engine.mjs';
import { nfrCases } from './nfr-cases.mjs';

test('Safety rejects remote targets, unconfirmed labs and unsafe timeout', () => {
  for (const config of [{ baseUrl: 'https://example.com/api', nfrLabOnly: 'true', timeoutMs: 5000 }, { baseUrl: 'http://127.0.0.1/api', nfrLabOnly: 'false', timeoutMs: 5000 }, { baseUrl: 'http://localhost/api', nfrLabOnly: 'true', timeoutMs: 6000 }]) assert.throws(() => assertLab(config));
  assert.doesNotThrow(() => assertLab({ baseUrl: 'http://127.0.0.1/api', nfrLabOnly: 'true', timeoutMs: 5000 }));
});
test('Nearest-rank percentiles include failures and report empty samples as invalid', () => {
  const samples = Array.from({ length: 20 }, (_, i) => ({ ms: i + 1, status: 200, valid: true }));
  samples[19].status = 500;
  const d = distribution(samples, 1000);
  assert.deepEqual([d.p50Ms, d.p95Ms, d.p99Ms, d.maxMs, d.errors, d.errorRate, d.throughputRps], [10,19,20,20,1,.05,20]);
  assert.equal(distribution([], 1000).errorRate, 1);
});
test('Measurement excludes login, warmup and cleanup; checks payload not just status', async () => {
  let badPayload = false, meCalls = 0, errorAt = 0;
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/api/login') return res.end(JSON.stringify({ token: 'test-fixture-token' }));
    if (req.url === '/api/logout') return res.end(JSON.stringify({ message: 'ok' }));
    meCalls++; if (errorAt && meCalls === errorAt) res.statusCode = 500;
    res.end(JSON.stringify(badPayload ? { role: 'client' } : { role: 'client', profile: { id: 1 } }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const config = { baseUrl: 'http://127.0.0.1:' + server.address().port + '/api', nfrLabOnly: 'true', timeoutMs: 1000, clientEmail: 'qa@test.local', clientPassword: 'test-only' };
    const tc = { ...nfrCases[0], count: 5, warmup: 2 };
    const result = await runNfrCase(tc, config); assert.equal(result.result, 'Pass'); assert.equal(result.metrics.phases[0].requests, 5); assert.equal(result.requests.length, 9);
    badPayload = true; const invalid = await runNfrCase(tc, config); assert.equal(invalid.result, 'Blocked'); assert.match(invalid.error, /Warmup payload invalid/);
    badPayload = false; meCalls = 0; errorAt = 3;
    const failedSample = await runNfrCase(tc, config); assert.equal(failedSample.result, 'Fail'); assert.equal(failedSample.metrics.phases[0].requests, 5); assert.equal(failedSample.metrics.phases[0].errors, 1);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
