import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { nfrCases, nfrDefaults, nfrLimitations } from './nfr-cases.mjs';
import { escape, zip, unzip, worksheet } from './office-helpers.mjs';

const here = path.dirname(fileURLToPath(import.meta.url)), args = process.argv.slice(2);
const option = (key, fallback) => args.includes(key) ? args[args.indexOf(key) + 1] : fallback;
const testing = path.resolve(option('--testing-dir', path.join(here, '..'))), repo = path.dirname(testing), lab = path.dirname(repo);
const out = path.resolve(option('--output', here)); fs.mkdirSync(out, { recursive: true });
const originalPlanLocation = fs.existsSync(path.join(repo, 'VIPSportCenter_ReadyAPI_TestPlan.xlsx')) ? repo : lab;
const { defaults } = await import(pathToFileURL(path.join(testing, 'cases.mjs')));
const readReport = folder => { const p = path.join(here, folder, 'results.json'); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null; };
const nodeReport = readReport('reports'), groovyReport = readReport('reports-groovy');
const find = (report, tc) => report?.cases.find(c => c.id === tc.id);
const securityPlans = {
  invalidToken: ['No login required.', 'GET /me; Bearer 999999|not-a-real-token; no body.'],
  tamperedToken: ['Login client seed, retain original token; modify last secret character.', 'POST /login {email:clientEmail,password:clientPassword}; GET /me with changed token; GET /me with original token.'],
  revokedToken: ['Issue dedicated client token; do not reuse other case tokens.', 'POST /login {email:clientEmail,password:clientPassword}; POST /logout with new token; GET /me with same revoked token.'],
  roleMatrix: ['Admin creates UUID QA client assigned to Karim; login admin/coach/client independently.', 'GET /admin/clients as client then coach; PUT /admin/clients/{qaId} as client with {statut:"suspendu"}; GET same client as admin; require statut="actif".'],
  massAssignment: ['UUID email; admin token for cleanup only; register cash avoids payment mutation.', 'POST /register {name:"NFR QA",email:uniqueEmail,password:"Password123!",password_confirmation:"Password123!",specialite:"Musculation",plan:"mensuel",payment_method:"cash",role:"admin",active:true}; GET /me with returned token; GET /admin/clients with same token.'],
  objectRead: ['Admin creates UUID QA client assigned to Sara (otherCoach); login Sara and Karim separately.', 'GET /coach/clients/{qaId}/bilans as Sara (owner control200), then same URL as Karim (403/404).'],
  objectWrite: ['Login Sara/Karim; read current-month planning as Sara; reuse an existing seeded planning/client. Create new QA session, never a seed session.', 'GET /coach/planning?mois={UTCmonth}&annee={UTCyear} as Sara; POST /coach/planning/seances as Sara {client_id:ownerPlanning.client_id,date:UTCtoday,heure_debut:"10:00",heure_fin:"11:00",lieu:"NFR QA",notes:uniqueEmail}; GET planning before; POST /coach/seances/{newSessionId}/realiser as Karim {present:true,effort_percu:5,remarques_coach:"NFR unauthorized probe"}; GET planning as Sara after; compare seance_realisee.'],
  sensitiveData: ['Admin creates UUID QA client; retain admin token for all three reads.', 'GET /me; GET /admin/clients; GET /admin/clients/{qaId}; recursively inspect JSON field names, no raw response persisted.'],
  errorLeak: ['APP_DEBUG=false, admin token only for protected missing-client URL.', 'POST /login {}; GET /admin/clients/2147483647 as admin; GET /nfr-route-not-found without token. Expected422/404/404.'],
  enumeration: ['Admin creates UUID QA client; wrong-password only once, never seed account.', 'POST /login {email:"absent-"+uniqueEmail,password:"Wrong123!"}; POST /login {email:uniqueEmail,password:"Wrong123!"}; compare public status/message.'],
  rateLimit: ['Unique nonexistent QA email. No seeded-account login; max25 sequential requests, stop on first429.', 'Repeat POST /login {email:uniqueEmail,password:"Wrong123!"}; expect429 by request25 and positive Retry-After.']
};
const loadProfile = tc => tc.kind === 'performance' ? JSON.stringify({ routes: tc.routes, warmup: tc.warmup, count: tc.count, concurrency: tc.concurrency, phases: tc.phases, durationMs: tc.durationMs, paceMs: tc.paceMs, minimumSamples: tc.minimumSamples }) : securityPlans[tc.action][0] + (['roleMatrix','objectRead','sensitiveData','enumeration'].includes(tc.action) ? '\nAdmin fixture: GET coach /me -> POST admin/clients {prenom:"NFR",nom:"QA",email:uniqueEmail,password:"Password123!",coach_id:ownerProfileId,montant_annuel:3600}. Tokens/IDs from this case only.' : '');
const expected = tc => tc.kind === 'performance' ? 'HTTP 200 + correct payload; p95 <= ' + tc.p95Ms + 'ms; max <= ' + tc.maxMs + 'ms; errorRate = 0.' + (tc.phases ? ' Recovery p95 <= max(500ms, 3 * baseline p95).' : '') : tc.expected;
const sheets = [
  { name: 'NFR Overview', widths: [30, 115], rows: [
    ['Mục', 'Nội dung'], ['Scope', '33 original functional cases + 17 new NFR cases = 50; NFR includes 6 performance + 11 targeted security cases.'],
    ['Status', 'Requirements/thresholds proposed for LAB. Existing functional cases unchanged. Original sheets are preserved.'],
    ['Node HTTP', nodeReport ? JSON.stringify(nodeReport.summary) + ' | ' + nodeReport.timestamp : 'Not run'],
    ['Groovy scripts', groovyReport ? JSON.stringify(groovyReport.summary) + ' | ' + groovyReport.timestamp : 'Not run'],
    ['ReadyAPI Desktop', 'Not run. XML schema/standalone Groovy evidence is NOT GUI evidence.'],
    ['Environment', nodeReport ? JSON.stringify(nodeReport.environment, null, 2) : 'Run node run-nfr.mjs --managed to record actual environment.'],
    ['Thresholds', 'p95: baseline 500ms; small load/mixed/stats 1000ms; spike 1500ms; short soak 750ms. All max 2000ms, errors 0. Not production SLOs.'],
    ['Measurement', 'Full body latency with monotonic clock. Nearest-rank percentile. Main sample only; login/warmup/cleanup excluded. Throughput includes pacing.'],
    ['NFR variables', 'Descriptions uniqueEmail/qaId/newSessionId/UTCtoday/role credentials are dynamic native script variables, not literal JSON values. Refer script for HTTP wire body. Standard admin fixture text applies only to cases that create a client; other cases follow the setup stated first.'],
    ['Safety', 'localhost only; explicit nfrLabOnly=true; max5 workers, <=100 requests per phase, timeout5s. Login burst <=25, nonexistent QA email only.'],
    ['Isolation', 'Managed mode creates fresh SQLite, migrate/seed, single-worker PHP server, BCRYPT_ROUNDS=4. Retains QA DB for evidence; stops owned server.'],
    ['Code / commands', 'testing/nfr/run-nfr.mjs --managed; --category performance/security; --case TC-NFR-...; reports JSON/HTML/JUnit.'],
    ['ReadyAPI project', 'testing/VIPSportCenter-readyapi-project.xml: 50 cases/10 suites; testing/nfr/VIPSportCenter-nfr-readyapi-project.xml: 17 NFR cases/2 suites. Both use Groovy Script steps, not native Performance/Security Test UI.'],
    ['Manual / future', 'TLS/HSTS staging HTTPS; CORS/CSRF/XSS browser testing; native load UI; approved SLO and larger datasets; CPU/memory; long soak. Not executed here.'],
    ...nfrLimitations.map((l, i) => ['Limitation ' + (i + 1), l]),
    ['OWASP source', 'https://owasp.org/API-Security/editions/2023/en/0x11-t10/'],
    ['SmartBear source', 'https://support.smartbear.com/readyapi/getting-started/performance-testing/customizing-a-performance-test-part-1/']
  ] },
  { name: 'NFR Cases', widths: [27, 18, 50, 85, 24, 100, 80, 100, 65, 35, 16, 16, 18, 20, 100], resultColumns: ['K','L','M'], rows: [
    ['TC ID', 'Category', 'Objective', 'Requirement / proposed policy', 'OWASP mapping', 'Profile / fixtures', 'Method / endpoints', 'Expected / thresholds', 'Assertions', 'Cleanup / scope', 'Node HTTP', 'Groovy script', 'ReadyAPI GUI', 'Candidate defect', 'Actual evidence'],
    ...nfrCases.map(tc => { const n = find(nodeReport, tc), g = find(groovyReport, tc); return [tc.id, tc.category, tc.title, tc.requirement, tc.mapping || 'N/A', loadProfile(tc), tc.routes ? tc.routes.map(r => 'GET ' + r.path + ' (' + r.role + ')').join('\n') : securityPlans[tc.action][1],
      expected(tc), tc.kind === 'performance' ? 'Status + payload for every sample; p50/p95/p99/max/RPS/errors; recovery per phase; min samples.' : 'Exact HTTP/access result + token/role/state/recursive JSON checks. See code action for all requests.',
      'QA client soft delete + logout issued tokens. Only lab DB; sessions/cotisations may remain.', n?.result || 'Not run', g?.result || 'Not run', 'Not run', tc.defect || '', JSON.stringify(n ? { metrics: n.metrics, observations: n.observations, error: n.error } : {}, null, 2)]; })
  ] },
  { name: 'NFR Results', widths: [27, 16, 16, 18, 90, 100, 65, 100], resultColumns: ['B','C','D'], rows: [
    ['TC ID', 'Node HTTP', 'Groovy script', 'ReadyAPI GUI', 'Node metrics / observations', 'Groovy metrics / observations', 'Run timestamps', 'Actual error'],
    ...nfrCases.map(tc => { const n = find(nodeReport, tc), g = find(groovyReport, tc); return [tc.id, n?.result || 'Not run', g?.result || 'Not run', 'Not run', JSON.stringify(n?.metrics || n?.observations || {}, null, 2), JSON.stringify(g?.metrics || g?.observations || {}, null, 2), [nodeReport?.timestamp,groovyReport?.timestamp].filter(Boolean).join('\n'), [n?.error,g?.error].filter(Boolean).join('\n')]; })
  ] },
  { name: 'NFR Defects', widths: [24, 28, 20, 90, 95, 100, 90, 100], rows: [
    ['ID', 'Case', 'Severity', 'Policy / expected', 'Actual evidence', 'Source', 'Recommendation', 'Status / qualification'],
    ...nfrCases.filter(tc => tc.defect).map(tc => { const r = find(nodeReport, tc); const details = { 'objectWrite': ['High', 'Verify session planning coach ownership BEFORE updateOrCreate; reject 403/404.'], 'enumeration': ['Medium', 'Use generic invalid-credential public message; assess timing behavior separately.'], 'rateLimit': ['Medium (proposed)', 'Agree rate-limit policy; add throttle with persistent cache store for deployment, Retry-After and review reset/register routes.'] }[tc.action]; return [tc.defect, tc.id, details[0], tc.requirement + '\n' + expected(tc), r ? JSON.stringify(r.observations) + '\n' + (r.error || r.result) : 'Not run: candidate from code review, not confirmed', tc.source, details[1], (r?.result === 'Fail' ? 'Detected in isolated lab; application NOT changed.' : r?.result || 'Not run') + (['enumeration','rateLimit'].includes(tc.action) ? ' Proposed policy gap; confirm requirements with team.' : '')]; })
  ] }
];

function appendSheets(bytes, plain = false) {
  const parts = unzip(bytes), workbook = parts['xl/workbook.xml'].toString('utf8');
  let book = workbook, rels = parts['xl/_rels/workbook.xml.rels'].toString('utf8'), types = parts['[Content_Types].xml'].toString('utf8');
  let next = Math.max(...[...book.matchAll(/sheetId="(\d+)"/g)].map(m => Number(m[1]))) + 1;
  for (const sheet of sheets) {
    const existing = [...book.matchAll(/<sheet\b[^>]*\/>/g)].find(m => m[0].includes('name="' + sheet.name + '"'));
    let target;
    if (existing) { const rid = existing[0].match(/r:id="([^"]+)"/)[1]; const relationship = [...rels.matchAll(/<Relationship\b[^>]*\/>/g)].find(m => m[0].includes('Id="' + rid + '"')); target = relationship[0].match(/Target="([^"]+)"/)[1].replace(/^\/?xl\//, ''); }
    else { const id = next++, rid = 'rIdNFR' + id; target = 'worksheets/sheet' + id + '.xml';
      book = book.replace('</sheets>', '<sheet name="' + sheet.name + '" sheetId="' + id + '" r:id="' + rid + '"/></sheets>');
      rels = rels.replace('</Relationships>', '<Relationship Id="' + rid + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="' + target + '"/></Relationships>');
      types = types.replace('</Types>', '<Override PartName="/xl/' + target + '" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'); }
    let xml = worksheet(sheet); if (plain) xml = xml.replace(/ s="\d+"/g, ' s="0"'); parts['xl/' + target] = Buffer.from(xml);
  }
  parts['xl/workbook.xml'] = Buffer.from(book); parts['xl/_rels/workbook.xml.rels'] = Buffer.from(rels); parts['[Content_Types].xml'] = Buffer.from(types); return zip(parts);
}
for (const [filename, location, plain] of [['VIPSportCenter_ReadyAPI_TestCases_Corrected.xlsx',repo,false], ['VIPSportCenter_ReadyAPI_TestPlan.xlsx',originalPlanLocation,true]]) {
  const source = path.join(location, filename); if (fs.existsSync(source)) fs.writeFileSync(path.join(out, filename), appendSheets(fs.readFileSync(source), plain));
}
const projectDefaults = { ...defaults, ...nfrDefaults }, engine = fs.readFileSync(path.join(here, 'nfr-engine.groovy'), 'utf8');
const cdata = s => '<![CDATA[' + s.replaceAll(']]>', ']]]]><![CDATA[>') + ']]>';
const scriptPrefix = (name, value) => 'def ' + name + " = new groovy.json.JsonSlurper().parseText(new String(java.util.Base64.decoder.decode('" + Buffer.from(JSON.stringify(value)).toString('base64') + "'), 'UTF-8'))\n";
const stableId = key => { const h = createHash('sha256').update('SportCenter/NFR/' + key).digest('hex').slice(0,32); return h.slice(0,8) + '-' + h.slice(8,12) + '-4' + h.slice(13,16) + '-a' + h.slice(17,20) + '-' + h.slice(20); };
fs.mkdirSync(path.join(out, 'groovy'), { recursive: true });
const groups = [...new Set(nfrCases.map(tc => tc.suite))];
const suites = groups.map(group => '<con:testSuite id="' + stableId(group) + '" name="' + group + '" abortOnError="false" failOnErrors="true"><con:settings/><con:runType>SEQUENTIAL</con:runType>' + nfrCases.filter(tc => tc.suite === group).map(tc => {
  const script = scriptPrefix('scenario',tc) + scriptPrefix('projectDefaults',projectDefaults) + engine;
  fs.writeFileSync(path.join(out, 'groovy', tc.id + '.groovy'), script);
  return '<con:testCase id="' + stableId(tc.id) + '" name="' + tc.id + ' - ' + escape(tc.title) + '" failOnError="true" failTestCaseOnErrors="true" keepSession="false" searchProperties="true"><con:settings/><con:testStep type="groovy" name="Execute ' + tc.id + '" id="' + stableId(tc.id + '/step') + '"><con:settings/><con:config><script>' + cdata(script) + '</script></con:config></con:testStep><con:properties/></con:testCase>';
}).join('') + '<con:properties/></con:testSuite>').join('');
const props = Object.entries(projectDefaults).map(([k,v]) => '<con:property><con:name>' + k + '</con:name><con:value>' + escape(v) + '</con:value></con:property>').join('');
fs.writeFileSync(path.join(out, 'VIPSportCenter-nfr-readyapi-project.xml'), '<?xml version="1.0" encoding="UTF-8"?><con:soapui-project xmlns:con="http://eviware.com/soapui/config" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" id="' + stableId('project') + '" name="SportCenter NFR - 17 cases" soapui-version="5.7.2" activeEnvironment="Default" resourceRoot="" runType="SEQUENTIAL"><con:settings/>' + suites + '<con:properties>' + props + '</con:properties></con:soapui-project>');
let combined = fs.readFileSync(path.join(testing, 'VIPSportCenter-readyapi-project.xml'), 'utf8');
combined = combined.replace(/<con:testSuite\b[^>]*name="NFR - (Performance|Security)"[\s\S]*?<\/con:testSuite>/g, '');
combined = combined.replace(/name="VIP Sport Center API - (33|50) cases"/, 'name="VIP Sport Center API - 50 cases"');
for (const k of Object.keys(nfrDefaults)) combined = combined.replace(new RegExp('<con:property><con:name>' + k + '<\\/con:name><con:value>[\\s\\S]*?<\\/con:value><\\/con:property>', 'g'), '');
const nfrProps = Object.entries(nfrDefaults).map(([k,v]) => '<con:property><con:name>' + k + '</con:name><con:value>' + escape(v) + '</con:value></con:property>').join('');
const rootPropertiesAt = combined.lastIndexOf('<con:properties>');
if (rootPropertiesAt < 0) throw new Error('Missing root project properties');
combined = combined.slice(0, rootPropertiesAt) + suites + combined.slice(rootPropertiesAt).replace('</con:properties>', nfrProps + '</con:properties>');
// Anchor root properties from its final position; nested properties in suites must not receive global settings.
if (!combined.includes('<con:name>nfrLabOnly</con:name>')) throw new Error('Failed to add NFR project properties');
fs.writeFileSync(path.join(out, 'VIPSportCenter-readyapi-project.xml'), combined);

const research = fs.existsSync(path.join(repo, 'Research.docx')) ? path.join(repo, 'Research.docx') : path.join(lab, 'Research.docx');
if (fs.existsSync(research)) {
  const parts = unzip(fs.readFileSync(research)); let doc = parts['word/document.xml'].toString('utf8');
  const marker = '19. Nonfunctional testing';
  if (!doc.includes(marker)) {
    const texts = [marker + ' — Performance và Security (05/10/2026)',
      'Bổ sung 17 NFR cases (6 performance, 11 security), giữ nguyên 33 functional cases. Workbook gốc và bản corrected có thêm NFR Overview, NFR Cases, NFR Results, NFR Defects. Project ReadyAPI tổng 50 cases/10 suites; project NFR riêng 17 cases/2 suites.',
      'Code: testing/nfr/nfr-cases.mjs, nfr-engine.mjs, nfr-engine.groovy, run-nfr.mjs, build-nfr.mjs và groovy/*.groovy. Lệnh node testing/nfr/run-nfr.mjs --managed tạo DB SQLite riêng và server localhost. Không sửa application.',
      'Performance: baseline, small concurrent load, mixed roles, stats, spike/recovery, short soak 20s or 80 requests. Đo p50/p95/p99, max, throughput, error rate sau warmup. Threshold là đề xuất lab, không phải production SLA. PHP single-worker, SQLite seed nhỏ, BCRYPT_ROUNDS=4; không suy ra năng lực production.',
      'Security: token integrity/revocation, role matrix, role injection, object ownership read/write, secret/debug disclosure, login enumeration và login throttling. Hai policy enumeration/rate limit là đề xuất, cần nhóm xác nhận.',
      'Node NFR: ' + (nodeReport ? JSON.stringify(nodeReport.summary) + ' — ' + nodeReport.timestamp : 'Not run') + '. Groovy NFR: ' + (groovyReport ? JSON.stringify(groovyReport.summary) + ' — ' + groovyReport.timestamp : 'Not run') + '. ReadyAPI Desktop GUI: Not run.',
      ...nfrCases.filter(tc => tc.defect).map(tc => { const r = find(nodeReport,tc); return tc.defect + ': ' + tc.title + '. Actual: ' + (r ? JSON.stringify(r.observations) + ' | ' + r.result : 'Not run') + '. Source: ' + tc.source + '. Application chưa sửa.'; }),
      ...nfrLimitations,
      'Nguồn: https://owasp.org/API-Security/editions/2023/en/0x11-t10/ ; https://support.smartbear.com/readyapi/getting-started/performance-testing/customizing-a-performance-test-part-1/ .'];
    const appendix = texts.map((text,i) => '<w:p><w:pPr>' + (i === 0 ? '<w:pStyle w:val="Heading1"/>' : '') + '<w:spacing w:after="100"/></w:pPr><w:r><w:t xml:space="preserve">' + escape(text) + '</w:t></w:r></w:p>').join('');
    if (!doc.includes('<w:sectPr>')) throw new Error('Research Word section anchor missing');
    doc = doc.replace('<w:sectPr>', appendix + '<w:sectPr>'); parts['word/document.xml'] = Buffer.from(doc);
    fs.writeFileSync(path.join(out, 'Research.docx'), zip(parts));
  }
}
console.log('Generated 17 NFR cases; appended NFR plan/results sheets; combined ReadyAPI 50 cases. Desktop remains Not run.');
