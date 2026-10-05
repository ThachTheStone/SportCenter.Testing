import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes, createHash } from 'node:crypto';
import { nfrCases, nfrDefaults, nfrLimitations } from './nfr-cases.mjs';
import { runNfrCase, assertLab } from './nfr-engine.mjs';

const here = path.dirname(fileURLToPath(import.meta.url)), args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const testing = path.resolve(option('--testing-dir', path.join(here, '..')));
const backend = path.resolve(option('--backend', path.join(testing, '..', 'backend')));
const reportDir = path.resolve(option('--report-dir', path.join(here, 'reports')));
const { defaults } = await import(pathToFileURL(path.join(testing, 'cases.mjs')));
const config = { ...defaults, ...nfrDefaults, timeoutMs: 5000, baseUrl: option('--base-url', defaults.baseUrl), nfrLabOnly: args.includes('--managed') || args.includes('--lab') ? 'true' : 'false' };
for (const key of Object.keys(defaults)) { const envName = key.replace(/[A-Z]/g, c => '_' + c).toUpperCase(); if ((key.endsWith('Email') || key.endsWith('Password')) && process.env[envName]) config[key] = process.env[envName]; }
const selected = nfrCases.filter(tc => (!option('--case', '') || tc.id === option('--case', '')) && (!option('--category', '') || tc.category.toLowerCase() === option('--category', '').toLowerCase()));
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const escape = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
let server, runtime;
for (const signal of ['SIGINT','SIGTERM']) process.once(signal, () => { if (server && server.exitCode == null) server.kill(); process.exit(signal === 'SIGINT' ? 130 : 143); });
try {
  assert.ok(selected.length, 'Unknown case/category');
  if (args.includes('--managed')) {
    assert.ok(!args.includes('--base-url'), '--managed owns the target; do not specify --base-url');
    assert.ok(fs.existsSync(path.join(backend, 'vendor/autoload.php')), 'Run Composer install first');
    assert.ok(!fs.existsSync(path.join(backend, 'bootstrap/cache/config.php')), 'Managed lab requires uncached config');
    runtime = fs.mkdtempSync(path.join(os.tmpdir(), 'sportcenter-nfr-run-'));
    const database = path.join(runtime, 'test.sqlite'); fs.writeFileSync(database, '');
    const env = { ...process.env, APP_ENV: 'testing', APP_DEBUG: 'false', APP_KEY: 'base64:' + randomBytes(32).toString('base64'),
      DB_CONNECTION: 'sqlite', DB_DATABASE: database, DB_URL: '', CACHE_STORE: 'array', SESSION_DRIVER: 'array', QUEUE_CONNECTION: 'sync', MAIL_MAILER: 'log', BCRYPT_ROUNDS: '4', LOG_CHANNEL: 'stderr', APP_CONFIG_CACHE: path.join(runtime, 'unused-config.php') };
    const php = option('--php', process.platform === 'win32' ? 'C:/xampp/php/php.exe' : 'php');
    const migration = spawnSync(php, ['artisan', 'migrate', '--seed', '--force', '--no-ansi'], { cwd: backend, env, windowsHide: true, encoding: 'utf8', timeout: 120000 });
    assert.ok(!migration.error && migration.status === 0, 'Isolated migrate/seed failed');
    const probe = net.createServer(); await new Promise((resolve, reject) => { probe.once('error', reject); probe.listen(0, '127.0.0.1', resolve); });
    const port = probe.address().port; await new Promise(resolve => probe.close(resolve));
    server = spawn(php, ['-S', '127.0.0.1:' + port, '-t', path.join(backend, 'public'), path.join(backend, 'vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php')], { cwd: path.join(backend, 'public'), env, windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
    let serverError; server.once('error', e => { serverError = e; }); server.stderr.on('data', () => {});
    config.baseUrl = 'http://127.0.0.1:' + port + '/api';
    let ready = false; for (let i = 0; i < 80; i++) { if (serverError || server.exitCode != null) throw new Error('Owned PHP server failed');
      try { const r = await fetch('http://127.0.0.1:' + port + '/up', { signal: AbortSignal.timeout(1000) }); await r.text(); if (r.ok) { ready = true; break; } } catch {} await pause(100); }
    assert.ok(ready, 'Owned PHP server did not become ready');
  }
  assertLab(config);
  fs.mkdirSync(reportDir, { recursive: true });
  const classpath = option('--groovy-classpath', ''); let cases;
  if (classpath) {
    assert.ok(selected.length === nfrCases.length, 'Groovy harness runs all NFR cases; filters supported by Node only');
    const raw = path.join(reportDir, 'groovy-raw.json');
    const run = spawnSync('java', ['-cp', classpath, 'groovy.ui.GroovyMain', path.join(here, 'verify-nfr.groovy'), path.join(here, 'VIPSportCenter-nfr-readyapi-project.xml'), config.baseUrl, raw], { windowsHide: true, encoding: 'utf8', timeout: 240000, maxBuffer: 4 * 1024 * 1024 });
    console.log(run.stdout || ''); assert.ok(!run.error && run.status === 0, 'Groovy harness compilation/execution failed: ' + (run.error?.message || run.stderr));
    cases = JSON.parse(fs.readFileSync(raw, 'utf8')); assert.equal(cases.length, nfrCases.length);
  } else { cases = []; for (const tc of selected) { const result = await runNfrCase(tc, config); cases.push(result); console.log(result.result.padEnd(7) + ' ' + tc.id + (result.error ? ' — ' + result.error : '')); } }
  const git = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: backend, windowsHide: true, encoding: 'utf8' });
  const dirty = spawnSync('git', ['status', '--porcelain'], { cwd: backend, windowsHide: true, encoding: 'utf8' });
  const version = spawnSync(option('--php', process.platform === 'win32' ? 'C:/xampp/php/php.exe' : 'php'), ['-r', 'echo PHP_VERSION;'], { windowsHide: true, encoding: 'utf8' });
  const report = { timestamp: new Date().toISOString(), mode: classpath ? 'NFR Groovy script integration (not Desktop)' : 'NFR Node HTTP integration', readyApiGui: 'Not run', commit: git.stdout.trim(), workingTreeModified: Boolean(dirty.stdout.trim()),
    testSourceSha256: Object.fromEntries(['nfr-cases.mjs', 'nfr-engine.mjs', 'nfr-engine.groovy', 'VIPSportCenter-nfr-readyapi-project.xml'].filter(f => fs.existsSync(path.join(here,f))).map(f => [f, createHash('sha256').update(fs.readFileSync(path.join(here,f))).digest('hex')])),
    baseUrl: config.baseUrl, environment: { managed: Boolean(runtime), database: runtime ? 'fresh isolated seeded SQLite' : 'user-confirmed local lab', server: runtime ? 'PHP built-in single-worker development server' : 'configured local API', php: version.stdout.trim(), node: process.version, os: os.platform() + ' ' + os.release(), cpu: os.cpus()[0]?.model, logicalCpus: os.cpus().length, memoryGB: Number((os.totalmem() / 2 ** 30).toFixed(1)), bcryptRounds: runtime ? 4 : 'configured' },
    limitations: nfrLimitations, summary: { total: cases.length, pass: cases.filter(c => c.result === 'Pass').length, fail: cases.filter(c => c.result === 'Fail').length, blocked: cases.filter(c => c.result === 'Blocked').length }, cases };
  fs.writeFileSync(path.join(reportDir, 'results.json'), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(reportDir, 'report.html'), '<!doctype html><html lang="vi"><meta charset="utf-8"><title>SportCenter NFR</title><style>body{font:15px system-ui;margin:30px}table{border-collapse:collapse}td,th{border:1px solid #bbb;padding:8px}pre{white-space:pre-wrap}</style><h1>NFR: ' + report.summary.pass + '/' + report.summary.total + ' Pass</h1><p>' + escape(report.mode + ' | ' + report.timestamp) + '</p><p>ReadyAPI Desktop: Not run. Targets proposed for this lab only.</p><pre>' + escape(JSON.stringify(report.environment, null, 2)) + '</pre><table><tr><th>ID</th><th>Result</th><th>Metric / observations</th><th>Error</th></tr>' + cases.map(c => '<tr><td>' + c.id + '</td><td>' + c.result + '</td><td><pre>' + escape(JSON.stringify(c.metrics || c.observations, null, 2)) + '</pre></td><td>' + escape(c.error) + '</td></tr>').join('') + '</table><h2>Limitations</h2><ul>' + nfrLimitations.map(l => '<li>' + escape(l) + '</li>').join('') + '</ul></html>');
  fs.writeFileSync(path.join(reportDir, 'junit.xml'), '<?xml version="1.0" encoding="UTF-8"?><testsuite name="SportCenter NFR" tests="' + cases.length + '" failures="' + report.summary.fail + '" skipped="' + report.summary.blocked + '">' + cases.map(c => '<testcase classname="' + escape(c.category) + '" name="' + c.id + '" time="' + c.durationMs / 1000 + '">' + (c.result === 'Pass' ? '' : '<' + (c.result === 'Blocked' ? 'skipped' : 'failure') + ' message="' + escape(c.error) + '"/>') + '</testcase>').join('') + '</testsuite>');
  console.log(JSON.stringify(report.summary)); console.log('Reports: ' + reportDir);
  process.exitCode = report.summary.fail || report.summary.blocked ? 1 : 0;
} catch (e) { console.error(e.message); process.exitCode = 2; }
finally { if (server && server.exitCode == null) { server.kill(); await Promise.race([new Promise(resolve => server.once('exit', resolve)), pause(2000)]); } if (runtime) console.log('Retained isolated QA database: ' + runtime); }
