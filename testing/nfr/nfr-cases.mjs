// Proposed LAB targets, not approved production SLOs. Only synthetic local data.
export const nfrDefaults = { nfrTimeoutMs: 5000, nfrLabOnly: 'false' };
const perf = (id, title, routes, count, concurrency, p95Ms, extra = {}) => ({
  id, suite: 'NFR - Performance', category: 'Performance', title, kind: 'performance',
  requirement: 'LAB target proposed by test team; validate with lecturer/product owner.',
  routes, count, concurrency, warmup: 5, p95Ms, maxMs: 2000, errorRate: 0, ...extra
});
const sec = (number, title, action, requirement, mapping, expected, extra = {}) => ({
  id: 'TC-NFR-SEC-' + String(number).padStart(2, '0'), suite: 'NFR - Security',
  category: 'Security', kind: 'security', title, action, requirement, mapping, expected, ...extra
});
export const nfrCases = [
  perf('TC-NFR-PERF-01', 'Baseline /me: latency distribution', [{ role: 'client', path: '/me' }], 30, 1, 500),
  perf('TC-NFR-PERF-02', 'Small concurrent load: admin client list', [{ role: 'admin', path: '/admin/clients' }], 50, 5, 1000),
  perf('TC-NFR-PERF-03', 'Mixed roles, read-only workload', [{ role: 'admin', path: '/admin/clients' }, { role: 'coach', path: '/coach/clients' }, { role: 'client', path: '/client/paiements' }], 60, 3, 1000),
  perf('TC-NFR-PERF-04', 'Payment stats aggregation at small load', [{ role: 'admin', path: '/admin/paiements/stats' }], 30, 3, 1000),
  perf('TC-NFR-PERF-05', 'Bounded spike and recovery', [{ role: 'admin', path: '/admin/clients' }], 80, 5, 1500,
    { phases: [{ name: 'baseline', count: 20, concurrency: 1 }, { name: 'spike', count: 40, concurrency: 5 }, { name: 'recovery', count: 20, concurrency: 1 }], recoveryFactor: 3, recoveryFloorMs: 500 }),
  perf('TC-NFR-PERF-06', 'Short soak: 20 seconds, bounded requests', [{ role: 'client', path: '/me' }], 80, 1, 750,
    { durationMs: 20000, paceMs: 250, minimumSamples: 20 }),
  sec(1, 'Fabricated Bearer token must be rejected', 'invalidToken', 'Reject unauthenticated API access.', 'OWASP API2:2023', 'GET /me = 401; no user/profile data.'),
  sec(2, 'Altered token must be rejected', 'tamperedToken', 'Token secret integrity must be enforced.', 'OWASP API2:2023', 'One-character changed token -> 401; original token still works.'),
  sec(3, 'Revoked token cannot be replayed', 'revokedToken', 'Logout invalidates this session token.', 'OWASP API2:2023', 'Login 200; logout 200; reused token /me 401.'),
  sec(4, 'Role matrix blocks privileged reads and writes', 'roleMatrix', 'Client/coach cannot act as admin.', 'OWASP API5:2023', 'Client and coach admin reads 403; client PUT 403; QA client state unchanged.'),
  sec(5, 'Registration role injection cannot grant admin', 'massAssignment', 'Public registration always grants client role.', 'OWASP API3:2023', 'Submitted role=admin ignored/rejected; if created: /me role=client and admin access 403.'),
  sec(6, 'Coach cannot read another coach client assessment', 'objectRead', 'Assessments accessible only to assigned coach.', 'OWASP API1:2023', 'Owner read 200; other coach read 403 or 404; no assessment data.'),
  sec(7, 'Coach cannot mark another coach session completed', 'objectWrite', 'Session write must verify planning.coach_id.', 'OWASP API1:2023', 'Reuse owner seed planning; create new QA session 201; foreign coach POST 403/404; seanceRealisee remains null.',
    { defect: 'NFR-BUG-001', source: 'backend/app/Http/Controllers/Coach/PlanningController.php::marquerRealisee' }),
  sec(8, 'No password/hash/remember_token disclosure in JSON', 'sensitiveData', 'Responses must exclude authentication secrets at any nesting level.', 'OWASP API3:2023', 'Recursive key check on /me, admin list and QA detail; no password, password_hash, remember_token, access_token or token.'),
  sec(9, 'Errors do not expose SQL, stack or source paths', 'errorLeak', 'Debug details must be suppressed (APP_DEBUG=false).', 'OWASP API8:2023', 'Invalid login 422, missing client 404 and unknown API 404; JSON with no trace/exception/file/SQLSTATE.'),
  sec(10, 'Login does not reveal email existence', 'enumeration', 'PROPOSED: invalid credentials should have indistinguishable public status/message.', 'OWASP API2:2023', 'Unknown email and wrong password on QA account both 401 with identical message; this is not a timing side-channel test.',
    { defect: 'NFR-BUG-002', source: 'backend/app/Http/Controllers/Auth/AuthController.php::login' }),
  sec(11, 'Bounded login burst is throttled', 'rateLimit', 'PROPOSED LAB policy: <=20 failed login attempts/minute/source; 429 by request 25.', 'OWASP API4:2023', 'At most 25 sequential attempts with nonexistent unique email; at least one 429 and positive Retry-After. No real user lockout.',
    { attempts: 25, defect: 'NFR-BUG-003', source: 'backend/routes/api.php (login has no throttle middleware)' })
];
export const nfrLimitations = [
  'Only localhost and nfrLabOnly=true are accepted. Maximum 5 workers, 100 requests per batch, 5s per request; no external stress/DoS scans.',
  'PHP built-in development server is normally single-worker. Client concurrency is not proof of concurrent application processing; SQLite and seed dataset are small.',
  'Client-observed latency includes full response body; excludes login/setup, warmup and cleanup. Report nearest-rank p50/p95/p99, max, throughput and error rate.',
  'Performance targets and enumeration/throttle policies are proposed LAB requirements, not contractual production SLAs.',
  'This is bounded performance testing and targeted API security regression, not a complete pentest, certification, production capacity benchmark or long endurance test. Object-write probe creates a new QA session on an existing seeded planning; QA sessions remain in the disposable lab DB.',
  'HTTP localhost cannot validate TLS/HSTS. CORS, CSRF browser behavior, frontend XSS rendering, large production datasets, native ReadyAPI Load/Security Test UI and CPU/memory metrics remain untested.'
];
