import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateRawSync, inflateRawSync } from 'node:zlib';
import { randomUUID } from 'node:crypto';
import { defaults, testCases, defects, clientBody } from './cases.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const output = process.argv[2] ? path.resolve(process.argv[2]) : here;
fs.mkdirSync(output, { recursive: true });
const escape = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
const xml = body => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + body;
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function zip(parts) {
  const records = [];
  const central = [];
  let offset = 0;
  for (const [name, content] of Object.entries(parts)) {
    const file = Buffer.from(name, 'utf8');
    const bytes = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
    const packed = deflateRawSync(bytes);
    const crc = crc32(bytes);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50);
    local.writeUInt16LE(20, 4); local.writeUInt16LE(0x800, 6); local.writeUInt16LE(8, 8); local.writeUInt16LE(33, 12);
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(packed.length, 18); local.writeUInt32LE(bytes.length, 22); local.writeUInt16LE(file.length, 26);
    records.push(local, file, packed);
    const dir = Buffer.alloc(46);
    dir.writeUInt32LE(0x02014b50); dir.writeUInt16LE(20, 4); dir.writeUInt16LE(20, 6); dir.writeUInt16LE(0x800, 8); dir.writeUInt16LE(8, 10); dir.writeUInt16LE(33, 14);
    dir.writeUInt32LE(crc, 16); dir.writeUInt32LE(packed.length, 20); dir.writeUInt32LE(bytes.length, 24); dir.writeUInt16LE(file.length, 28); dir.writeUInt32LE(offset, 42);
    central.push(dir, file);
    offset += local.length + file.length + packed.length;
  }
  const dir = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50); end.writeUInt16LE(Object.keys(parts).length, 8); end.writeUInt16LE(Object.keys(parts).length, 10);
  end.writeUInt32LE(dir.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...records, dir, end]);
}
function unzip(bytes) {
  let end = bytes.length - 22;
  while (end >= 0 && bytes.readUInt32LE(end) !== 0x06054b50) end--;
  if (end < 0) throw new Error('Missing ZIP directory');
  let at = bytes.readUInt32LE(end + 16);
  const count = bytes.readUInt16LE(end + 10);
  const parts = {};
  for (let i = 0; i < count; i++) {
    if (bytes.readUInt32LE(at) !== 0x02014b50) throw new Error('Invalid ZIP directory');
    const method = bytes.readUInt16LE(at + 10);
    const size = bytes.readUInt32LE(at + 20);
    const nameLength = bytes.readUInt16LE(at + 28), extra = bytes.readUInt16LE(at + 30), comment = bytes.readUInt16LE(at + 32);
    const local = bytes.readUInt32LE(at + 42);
    const name = bytes.subarray(at + 46, at + 46 + nameLength).toString('utf8');
    const start = local + 30 + bytes.readUInt16LE(local + 26) + bytes.readUInt16LE(local + 28);
    const data = bytes.subarray(start, start + size);
    parts[name] = method === 8 ? inflateRawSync(data) : data;
    at += 46 + nameLength + extra + comment;
  }
  return parts;
}
let report = null, groovyReport = null;
for (const [filename, setter] of [
  ['reports/results.json', data => { report = data; }],
  ['reports-groovy/results.json', data => { groovyReport = data; }]
]) {
  const file = path.join(here, filename);
  if (fs.existsSync(file)) setter(JSON.parse(fs.readFileSync(file, 'utf8')));
}
const groups = [...new Set(testCases.map(tc => tc.suite))];
const fixtures = {
  coachIdentity: 'Login Karim -> GET /me -> lấy coachId.',
  freshClient: 'Login admin/coach -> GET /me coach -> POST client QA email UUID -> lưu clientId.',
  foreignClient: 'Login Sara -> /me -> POST client QA thuộc Sara; request chính dùng token Karim.',
  paymentClient: 'Tạo client QA -> GET chi tiết -> lấy echeanceId và amount từ kỳ hạn thứ 1.',
  payInstallment: 'POST payment cho kỳ hạn QA, assert 201 trước duplicate test.'
};
const assertions = step => step.checks.map(c => c.op + ' $' + (c.path ? '.' + c.path : '') + (c.value === undefined ? '' : ' = ' + JSON.stringify(c.value))).join('\n');
const caseRows = testCases.map(tc => {
  const result = report?.cases.find(r => r.id === tc.id);
  const groovy = groovyReport?.cases.find(r => r.id === tc.id);
  return [
    tc.id, tc.suite, tc.title, tc.type, tc.priority,
    (tc.setup.map(f => fixtures[f]).join('\n') || 'Seed database; login tự động khi endpoint cần role.') + '\nMỗi case độc lập; email UUID; cleanup QA/token trong finally.',
    tc.steps.map(s => s.method + ' ' + s.path).join('\n'),
    tc.steps.map(s => s.role ? 'Bearer token ' + s.role : s.token ? 'Bearer ' + s.token : 'Không Bearer').join('\n'),
    tc.steps.map(s => s.body ? JSON.stringify(s.body, null, 2) : '(không body)').join('\n\n'),
    tc.steps.map(s => s.name + ': ' + s.status).join('\n'),
    tc.steps.map(assertions).filter(Boolean).join('\n'),
    'Mỗi request chính <= ' + defaults.slaMs + 'ms; JSON Content-Type; không SQLSTATE/debug trace.',
    'Soft-delete client/coach QA qua admin; logout token do case cấp. Payment/cotisation còn trong DB test.',
    tc.note, result?.result || 'Not run', result?.error || '',
    groovy?.result || 'Not run', 'Not run', tc.defect || ''
  ];
});
const stepsRows = testCases.flatMap(tc => tc.steps.map((s, i) => [
  tc.id, i + 1, s.name, s.method, s.path, s.role || (s.token ? s.token : 'none'),
  s.body ? JSON.stringify(s.body, null, 2) : '(không body)', s.status, assertions(s),
  JSON.stringify(s.capture || {}), s.trackClient || s.trackCoach || s.trackRegistration ? 'Track creation -> cleanup' : ''
]));
const changes = [
  ['COUNT', '32 case / 7 nhóm', '33 case / 8 nhóm, giữ nguyên ID gốc', 'Overview/Test Cases'],
  ['CREDENTIAL', 'admin@sportcenter.com/admin123', 'admin@sportcenter.ma/Admin@1234; coach/client đúng seeder', 'AUTH-01'],
  ['LANGUAGE', 'Assert message tiếng Pháp', 'Repo mới có message English; dùng key/status + fragment ổn định', 'AUTH/COACH/PAYMENT/ROLE'],
  ['JSON', 'Body có dấu ... hoặc thiếu field', 'JSON đầy đủ, mọi field khác hợp lệ khi test negative', 'AUTH-07, CLIENT-04, SECURITY-02'],
  ['DATA', 'test5/Dupont/coach email không có seed', 'UUID client fixtures; duplicate dùng Karim seed', 'AUTH-03/04, CLIENT-02, COACH-03'],
  ['LOCK', 'Sau 5 lần sai trả 423 ngay', '5 request sai 401; request thứ 6 trả 423; QA account riêng', 'AUTH-04'],
  ['REGISTER', 'Giả định register response client.id', 'Response user/token; GET /me lấy profile.id; verify payment card', 'AUTH-06'],
  ['PAYMENT', 'Hard-code installment ID / date field', 'Lấy echeanceId/amount động; dùng date_paiement; verify paye', 'PAIEMENT-02/03'],
  ['CLIENT PAYMENT', 'Root array payment', 'Object echeances/montant_annuel/total_paye/total_restant', 'CLIENT-02'],
  ['ROLE DEFECT', 'Admin coach dashboard giả định 200 Pass', 'Giữ expected 200; actual 404; ghi BUG-001', 'ROLE-03'],
  ['DELETE', 'Xóa vật lý client/user', 'Soft delete; verify 404 detail và 401 user token', 'ADMIN-CLIENT-06'],
  ['INJECTION', '401 hoặc 422', 'Email không hợp lệ nên 422; errors.email; no debug leak', 'SECURITY-01'],
  ['ISOLATION', 'Case phụ thuộc thứ tự/token/ID case trước', 'Setup riêng từng case và finally cleanup; database managed riêng', 'Tất cả']
];
const resultRows = testCases.map(tc => {
  const n = report?.cases.find(r => r.id === tc.id), g = groovyReport?.cases.find(r => r.id === tc.id);
  return [tc.id, tc.title, n?.result || 'Not run', n?.durationMs ?? '', n?.error || '',
    g?.result || 'Not run', g?.error || '', 'Not run', n?.requests.filter(r => r.phase === 'test').map(r => r.method + ' ' + r.path + ' -> ' + r.status + ' / ' + r.ms + 'ms').join('\n') || '', tc.defect || ''];
});
const sheets = [
  { name: 'Overview', widths: [30, 115], rows: [
    ['Mục', 'Nội dung'],
    ['Project', 'SportCenter.Testing — English frontend'],
    ['Repository', 'https://github.com/ThachTheStone/SportCenter.Testing'],
    ['Commit', report?.commit || 'a0648e3'],
    ['Ngày tạo', new Date().toISOString()],
    ['Phạm vi', '33 functional REST API cases / 8 suites. Không phải toàn bộ API coverage, load/security scan.'],
    ['Các suite', groups.map(g => g + ': ' + testCases.filter(tc => tc.suite === g).length).join('\n')],
    ['Base URL ReadyAPI', defaults.baseUrl],
    ['HTTP run', report ? JSON.stringify(report.summary) + ' | ' + report.mode + ' | ' + report.timestamp : 'Not run'],
    ['Groovy integration', groovyReport ? JSON.stringify(groovyReport.summary) + ' | chạy script từ project XML, runtime Groovy riêng' : 'Not run'],
    ['ReadyAPI GUI', 'Not run: chưa kiểm tra trên ReadyAPI Desktop; không đồng nhất kết quả HTTP/Groovy với GUI.'],
    ['Properties', JSON.stringify(defaults, null, 2)],
    ['Syntax', '{{variable}} là biến nội bộ của engine, không phải JSON literal gửi tới API. Engine thay ID/date/email/token trước request.'],
    ['Chạy nhanh', 'node run-tests.mjs --managed (từ thư mục testing); tự tạo SQLite mới, migrate/seed và server tạm.'],
    ['Chạy ReadyAPI', 'Import VIPSportCenter-readyapi-project.xml -> Project Properties baseUrl -> Functional Tests -> Run. Backend phải chạy và đã seed.'],
    ['Mã ReadyAPI', '33 Groovy Script TestSteps; mỗi case chứa setup, HTTP JSON requests, assert và cleanup. Không dùng REST Request inspector/DataSource UI.'],
    ['Kết quả Fail', 'TC-ROLE-03/BUG-001 phải Fail trên code hiện tại; không sửa expected để che defect.'],
    ['Cleanup', 'Xóa QA qua API là soft delete; các cotisation/payment vẫn còn. Managed DB riêng giữ trong thư mục TEMP để inspect.'],
    ['Lưu ý', 'Chỉ chạy trên database lab. HTTP runner/ReadyAPI có request tạo/sửa/xóa dữ liệu QA.']
  ] },
  { name: 'Test Cases', widths: [26, 22, 50, 22, 12, 68, 48, 35, 68, 42, 62, 45, 55, 68, 15, 70, 18, 18, 16], rows: [
    ['TC ID', 'Suite', 'Mục đích', 'Loại', 'Priority', 'Preconditions / Setup', 'Method / Endpoint', 'Auth', 'JSON body đầy đủ', 'Expected status', 'Assertions', 'SLA / Chung', 'Cleanup', 'Điều chỉnh / Ghi chú', 'HTTP result', 'Actual / Error', 'Groovy result', 'ReadyAPI GUI', 'Defect'],
    ...caseRows
  ], resultColumns: ['O', 'Q', 'R'] },
  { name: 'Request Steps', widths: [26, 9, 40, 12, 65, 25, 80, 14, 65, 35, 30], rows: [
    ['TC ID', 'Step', 'Tên step', 'Method', 'Endpoint', 'Role / Token', 'JSON body', 'Expected HTTP', 'Assertions', 'Capture', 'Tracking'], ...stepsRows
  ] },
  { name: 'Changes', widths: [25, 55, 105, 42], rows: [['Mục', 'Trước', 'Sau / Cần sửa', 'Case liên quan'], ...changes] },
  { name: 'Results', widths: [26, 60, 16, 15, 90, 18, 85, 20, 85, 16], rows: [
    ['TC ID', 'Mục đích', 'HTTP result', 'Duration ms', 'HTTP error', 'Groovy result', 'Groovy error', 'ReadyAPI GUI', 'Actual HTTP steps', 'Defect'], ...resultRows
  ], resultColumns: ['C', 'F', 'H'] },
  { name: 'Defects', widths: [18, 26, 15, 60, 70, 70, 80, 100], rows: [
    ['Defect ID', 'Test case', 'Severity', 'Mô tả', 'Expected', 'Actual', 'Source', 'Hướng xử lý'], ...defects.map(d => [d.id, d.testId, d.severity, d.title, d.expected, d.actual, d.file, d.suggestion])
  ] }
];
function column(n) {
  let s = '';
  for (n++; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + (n - 1) % 26) + s;
  return s;
}
function worksheet(sheet) {
  const ncols = sheet.rows[0].length;
  const end = column(ncols - 1) + sheet.rows.length;
  const rows = sheet.rows.map((row, i) => {
    const maxLines = Math.max(...row.map(v => String(v ?? '').split('\n').length));
    const height = i === 0 ? 32 : Math.min(150, Math.max(32, maxLines * 15));
    return '<row r="' + (i + 1) + '" ht="' + height + '" customHeight="1">' + row.map((v, j) => {
      const style = i === 0 ? 1 : v === 'Pass' ? 4 : v === 'Fail' ? 5 : v === 'Not run' || v === 'Blocked' ? 6 : i % 2 ? 2 : 3;
      const cell = '<c r="' + column(j) + (i + 1) + '" s="' + style + '"';
      return typeof v === 'number' ? cell + '><v>' + v + '</v></c>' : cell + ' t="inlineStr"><is><t xml:space="preserve">' + escape(v) + '</t></is></c>';
    }).join('') + '</row>';
  }).join('');
  const validation = sheet.resultColumns ? '<dataValidations count="' + sheet.resultColumns.length + '">' + sheet.resultColumns.map(c => '<dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="' + c + '2:' + c + sheet.rows.length + '"><formula1>"Not run,Pass,Fail,Blocked"</formula1></dataValidation>').join('') + '</dataValidations>' : '';
  return xml('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:' + end + '"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="30"/><cols>' + sheet.widths.map((w, i) => '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>').join('') + '</cols><sheetData>' + rows + '</sheetData><autoFilter ref="A1:' + end + '"/>' + validation + '<pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.3" footer="0.3"/><pageSetup orientation="landscape" paperSize="9"/></worksheet>');
}
const spreadsheet = {
  '[Content_Types].xml': xml('<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' + sheets.map((s, i) => '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('') + '</Types>'),
  '_rels/.rels': xml('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'),
  'xl/workbook.xml': xml('<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + sheets.map((s, i) => '<sheet name="' + s.name + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>').join('') + '</sheets></workbook>'),
  'xl/_rels/workbook.xml.rels': xml('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + sheets.map((s, i) => '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>').join('') + '<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'),
  'xl/styles.xml': xml('<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="7"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF17446E"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF0F5FA"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFDCFCE7"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFEE2E2"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFEF3C7"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="7">' + [0, 2, 0, 3, 4, 5, 6].map((fill, i) => '<xf numFmtId="0" fontId="' + (i === 1 ? 1 : 0) + '" fillId="' + fill + '" borderId="0" xfId="0" applyAlignment="1" applyFill="1"><alignment vertical="top" wrapText="1"/></xf>').join('') + '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>')
};
sheets.forEach((s, i) => { spreadsheet['xl/worksheets/sheet' + (i + 1) + '.xml'] = worksheet(s); });
fs.writeFileSync(path.join(output, 'VIPSportCenter_ReadyAPI_TestCases_Corrected.xlsx'), zip(spreadsheet));

// SoapUI/ReadyAPI Groovy script project, fully self-contained: no external files needed to run in the GUI.
const engine = fs.readFileSync(path.join(here, 'readyapi-engine.groovy'), 'utf8');
const scriptsDir = path.join(output, 'groovy');
fs.mkdirSync(scriptsDir, { recursive: true });
const cdata = s => '<![CDATA[' + s.replaceAll(']]>', ']]]]><![CDATA[>') + ']]>';
const propXml = Object.entries(defaults).map(([k, v]) => '<con:property><con:name>' + k + '</con:name><con:value>' + escape(v) + '</con:value></con:property>').join('');
const suitesXml = groups.map(group => '<con:testSuite id="' + randomUUID() + '" name="' + escape(group) + '" abortOnError="false" failOnErrors="true"><con:settings/><con:runType>SEQUENTIAL</con:runType>' + testCases.filter(tc => tc.suite === group).map(tc => {
  // Base64 avoids Groovy's backslash handling changing regex/SQL-like JSON values.
  const encodedScript = "def scenario = new groovy.json.JsonSlurper().parseText(new String(java.util.Base64.decoder.decode('" + Buffer.from(JSON.stringify(tc)).toString('base64') + "'), 'UTF-8'))\n" +
    "def projectDefaults = new groovy.json.JsonSlurper().parseText(new String(java.util.Base64.decoder.decode('" + Buffer.from(JSON.stringify(defaults)).toString('base64') + "'), 'UTF-8'))\n" +
    "def clientTemplate = new groovy.json.JsonSlurper().parseText(new String(java.util.Base64.decoder.decode('" + Buffer.from(JSON.stringify(clientBody)).toString('base64') + "'), 'UTF-8'))\n" + engine;
  fs.writeFileSync(path.join(scriptsDir, tc.id + '.groovy'), encodedScript);
  return '<con:testCase id="' + randomUUID() + '" name="' + tc.id + ' - ' + escape(tc.title) + '" failOnError="true" failTestCaseOnErrors="true" keepSession="false" searchProperties="true"><con:settings/><con:testStep type="groovy" name="Execute ' + tc.id + '" id="' + randomUUID() + '"><con:settings/><con:config><script>' + cdata(encodedScript) + '</script></con:config></con:testStep><con:properties/></con:testCase>';
}).join('') + '<con:properties/></con:testSuite>').join('');
fs.writeFileSync(path.join(output, 'VIPSportCenter-readyapi-project.xml'),
  xml('<con:soapui-project xmlns:con="http://eviware.com/soapui/config" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" id="' + randomUUID() + '" name="VIP Sport Center API - 33 cases" soapui-version="5.7.2" activeEnvironment="Default" resourceRoot="" runType="SEQUENTIAL"><con:settings/>' + suitesXml + '<con:properties>' + propXml + '</con:properties></con:soapui-project>'));

// Preserve the existing Word document and append concrete changes, evidence and known defect.
const docSource = process.env.RESEARCH_DOCX;
if (docSource) {
  const parts = unzip(fs.readFileSync(docSource));
  let document = parts['word/document.xml'].toString('utf8');
  const paragraphs = [
    ['Heading1', '18. Cập nhật bộ test case và mã automation — 04/10/2026'],
    ['', 'Repo áp dụng: https://github.com/ThachTheStone/SportCenter.Testing, commit ' + (report?.commit || 'a0648e3') + '. Bộ mới gồm 33 case / 8 nhóm, giữ mã TC của workbook gốc.'],
    ['', 'File Excel: VIPSportCenter_ReadyAPI_TestCases_Corrected.xlsx. Các sheet: Overview, Test Cases, Request Steps, Changes, Results, Defects.'],
    ['', 'Mã ReadyAPI: testing/VIPSportCenter-readyapi-project.xml và testing/groovy/*.groovy. Mỗi case là Groovy Script TestStep, dùng HTTP JSON, assertion, fixture và finally cleanup.'],
    ['', 'Runner: testing/run-tests.mjs; lệnh node run-tests.mjs --managed tự tạo SQLite và server riêng, không dùng database local của project.'],
    ['', 'Kết quả HTTP: ' + (report ? JSON.stringify(report.summary) : 'Not run') + '.'],
    ['', 'Kết quả Groovy từ chính script trong project XML: ' + (groovyReport ? JSON.stringify(groovyReport.summary) : 'Not run') + '. Đây không phải kết quả chạy ReadyAPI GUI; GUI vẫn Not run.'],
    ['Heading2', 'Hiệu chỉnh kết luận phân quyền trong phần trước'],
    ['', 'Middleware role:coach,admin cho phép admin vượt qua bước phân quyền. Tuy nhiên controller Coach/DashboardController tìm Coach theo user_id của admin, không tìm thấy nên firstOrFail trả 404. Vì vậy không thể kết luận admin gọi mọi coach/client API sẽ nhận 200 chỉ dựa trên middleware.'],
    ['', 'TC-ROLE-03 giữ expected HTTP 200 theo test plan và ghi actual HTTP 404, defect BUG-001. Không sửa application hoặc đổi expected để che lỗi. Nếu yêu cầu nghiệp vụ thay đổi, cần cập nhật requirement và case có phê duyệt nhóm.'],
    ['', 'Register trả user/token, không trả client.id. Lấy profile.id qua GET /me. Field annee không fillable nên bị bỏ qua trong môi trường đã chạy; không phải blocker register của bộ 33 case hiện tại.'],
    ['', 'Frontend tiếng Anh giữ endpoint/field enum tiếng Pháp; một số backend message đã đổi sang English. Assertion mới dùng JSON key/status và message fragment English theo repo này.'],
    ['Heading2', 'Các điểm đã chỉnh trong workbook mới'],
    ...changes.map(c => ['', c[0] + ': ' + c[2] + ' (' + c[3] + ').']),
    ['Heading2', 'Giới hạn và hướng chạy'],
    ['', 'Chạy tuần tự trên database lab đã seed. Fixture có UUID, không hard-code record ID. Cleanup soft-delete client/coach QA và thu hồi token do case tạo. Cotisation/payment vẫn còn; managed database được giữ trong TEMP để đọc defect.'],
    ['', 'SLA 2000ms là ngưỡng mặc định và có thể chỉnh bằng project property slaMs hoặc runner --sla-ms. Setup/cleanup không tính vào SLA request chính.'],
    ['', 'Bộ script dùng Groovy TestStep; không tự tạo các REST Request inspector hoặc DataSource UI. Muốn demo Property Transfer/JSONPath bằng GUI, có thể tách login/request từ kịch bản trong sheet Request Steps.'],
    ['', 'Tài liệu SmartBear: https://support.smartbear.com/readyapi/docs/en/test-apis-with-readyapi/scripting/groovy-scripting-samples.html và https://www.soapui.org/docs/functional-testing/working-with-teststeps/.']
  ];
  const appendix = paragraphs.map(([style, text]) => '<w:p><w:pPr>' + (style ? '<w:pStyle w:val="' + style + '"/>' : '') + '<w:spacing w:after="100"/></w:pPr><w:r><w:t xml:space="preserve">' + escape(text) + '</w:t></w:r></w:p>').join('');
  if (document.includes('18. Cập nhật bộ test case')) throw new Error('Research already has appendix; use original backup as source');
  document = document.replace('<w:sectPr>', appendix + '<w:sectPr>');
  parts['word/document.xml'] = Buffer.from(document);
  fs.writeFileSync(path.join(output, 'Research.docx'), zip(parts));
}
console.log('Generated workbook with ' + testCases.length + ' cases, ' + stepsRows.length + ' request steps and ReadyAPI project.');
