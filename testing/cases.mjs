// Single source of truth: Excel rows, ReadyAPI cases and HTTP runner.
export const defaults = {
  baseUrl: 'http://127.0.0.1:8000/api', slaMs: 2000, timeoutMs: 15000,
  adminEmail: 'admin@sportcenter.ma', adminPassword: 'Admin@1234',
  coachEmail: 'karim@sportcenter.ma', coachPassword: 'Coach@1234',
  otherCoachEmail: 'sara@sportcenter.ma', otherCoachPassword: 'Coach@1234',
  clientEmail: 'yassine.amrani@gmail.com', clientPassword: 'Client@1234'
};
const check = (op, path = '', value) => ({ op, path, ...(value === undefined ? {} : { value }) });
const exists = path => check('exists', path);
const equal = (path, value) => check('eq', path, value);
const arr = path => check('array', path);
const req = (name, method, path, status, role = null, body = null, checks = [], extra = {}) =>
  ({ name, method, path, status, role, body, checks, ...extra });
const loginBody = { email: '{{adminEmail}}', password: '{{adminPassword}}' };
const registerBody = {
  name: 'ReadyAPI QA', email: '{{uniqueEmail}}', password: 'Password123!',
  password_confirmation: 'Password123!', telephone: '0612345678',
  date_naissance: '1990-01-01', specialite: 'Musculation',
  plan: 'mensuel', payment_method: 'card'
};
export const clientBody = {
  prenom: 'ReadyAPI', nom: 'QA', email: '{{uniqueEmail}}', password: 'Password123!',
  coach_id: '{{coachId}}', montant_annuel: 3600
};
export const coachBody = {
  prenom: 'ReadyAPI', nom: 'Coach', email: '{{uniqueEmail}}', password: 'Password123!',
  specialite: 'Musculation'
};
const sessionBody = { client_id: '{{clientId}}', date: '{{today}}', heure_debut: '10:00', heure_fin: '11:00', lieu: 'QA room', exercices_prevus: [], notes: 'ReadyAPI regression' };
const paymentBody = { echeance_id: '{{echeanceId}}', montant: '{{echeanceAmount}}', methode: 'carte', date_paiement: '{{today}}', notes: 'ReadyAPI regression' };
const cases = [];
function add(id, suite, title, type, setup, steps, note = '', defect = '') {
  cases.push({ id, suite, title, type, priority: type.includes('Security') ? 'High' : 'Medium', setup, steps, note, defect });
}
add('TC-AUTH-01', 'Authentication', 'Đăng nhập admin với credential seed', 'Positive', [],
  [req('Login admin', 'POST', '/login', 200, null, loginBody, [exists('token'), equal('user.role', 'admin'), equal('user.email', '{{adminEmail}}')])],
  'Credential: admin@sportcenter.ma / Admin@1234. Token được lấy động; không dùng JWT.');
add('TC-AUTH-02', 'Authentication', 'Email không tồn tại', 'Negative', [],
  [req('Login unknown email', 'POST', '/login', 401, null, { email: '{{uniqueEmail}}', password: 'Wrong123!' }, [exists('message'), check('contains', 'message', 'incorrect')])],
  'Email có UUID được sinh lại cho từng lần chạy.');
add('TC-AUTH-03', 'Authentication', 'Sai password một lần, còn 4 lần thử', 'Negative', ['freshClient'],
  [req('One incorrect password', 'POST', '/login', 401, null, { email: '{{uniqueEmail}}', password: 'Wrong123!' }, [check('contains', 'message', '4 attempt')])],
  'Account QA riêng, không làm tăng failed attempts của account seed.');
add('TC-AUTH-04', 'Authentication', 'Khóa sau 5 lần sai; lần 6 trả 423', 'Boundary/Security', ['freshClient'],
  [...Array.from({ length: 5 }, (_, i) => req('Incorrect attempt ' + (i + 1), 'POST', '/login', 401, null,
    { email: '{{uniqueEmail}}', password: 'Wrong123!' }, [exists('message')])),
    req('Sixth attempt with correct password', 'POST', '/login', 423, null, { email: '{{uniqueEmail}}', password: 'Password123!' }, [check('contains', 'message', 'locked')])],
  'Lần sai thứ 5 vẫn trả 401. Account QA được soft-delete ở cleanup.');
add('TC-AUTH-05', 'Authentication', 'Login thiếu email', 'Negative', [],
  [req('Missing email', 'POST', '/login', 422, null, { password: 'Wrong123!' }, [exists('errors.email')])]);
add('TC-AUTH-06', 'Authentication', 'Đăng ký mensuel/card, tạo client và kỳ đầu đã thanh toán', 'Positive', [],
  [req('Register card client', 'POST', '/register', 201, null, registerBody, [exists('token'), equal('user.role', 'client'), equal('user.email', '{{uniqueEmail}}')],
    { capture: { registeredToken: 'token' }, trackRegistration: true }),
   req('Read new profile', 'GET', '/me', 200, null, null, [exists('profile.id'), exists('profile.coach_id'), equal('role', 'client')], { token: '{{registeredToken}}' }),
   req('Verify first payment', 'GET', '/client/paiements', 200, null, null,
     [equal('echeances.length', 3), equal('echeances.0.statut', 'paye'), equal('total_paye', 1200), equal('total_restant', 2400)],
     { token: '{{registeredToken}}' })],
  'Dùng specialite đúng chữ hoa Musculation. Response register có user/token, không có client.id.');
add('TC-AUTH-07', 'Authentication', 'Register plan không hợp lệ', 'Negative', [],
  [req('Invalid plan', 'POST', '/register', 422, null, { ...registerBody, plan: 'quotidien' }, [exists('errors.plan')])],
  'JSON hoàn chỉnh; các field khác hợp lệ để cô lập lỗi plan.');
add('TC-AUTH-08', 'Authentication', 'Lấy profile client với token hợp lệ', 'Positive', [],
  [req('Read client profile', 'GET', '/me', 200, 'client', null, [exists('id'), exists('profile.id'), equal('role', 'client'), equal('email', '{{clientEmail}}')])]);
add('TC-AUTH-09', 'Authentication', 'Logout và chứng minh token bị thu hồi', 'Positive', [],
  [req('Get a dedicated token', 'POST', '/login', 200, null, { email: '{{clientEmail}}', password: '{{clientPassword}}' },
    [exists('token')], { capture: { logoutToken: 'token' } }),
   req('Logout', 'POST', '/logout', 200, null, null, [exists('message')], { token: '{{logoutToken}}' }),
   req('Reuse revoked token', 'GET', '/me', 401, null, null, [exists('message')], { token: '{{logoutToken}}' })],
  'Token riêng của case; không phụ thuộc token của case trước.');
add('TC-ADMIN-CLIENT-01', 'Admin - Client', 'Danh sách client phân trang 10', 'Positive', [],
  [req('List clients', 'GET', '/admin/clients', 200, 'admin', null, [arr('data'), equal('per_page', 10), exists('current_page'), exists('total')])]);
add('TC-ADMIN-CLIENT-02', 'Admin - Client', 'Search tìm đúng client QA theo email', 'Positive', ['freshClient'],
  [req('Search client', 'GET', '/admin/clients?search={{uniqueEmail}}', 200, 'admin', null,
    [check('nonEmpty', 'data'), check('search', 'data', '{{uniqueEmail}}'), equal('data.0.id', '{{clientId}}')])],
  'Tạo dữ liệu trước; thay Dupont không tồn tại bằng email QA unique.');
add('TC-ADMIN-CLIENT-03', 'Admin - Client', 'Tạo client và xác minh lưu dữ liệu', 'Positive', ['coachIdentity'],
  [req('Create client', 'POST', '/admin/clients', 201, 'admin', clientBody,
    [exists('client.id'), equal('client.user.role', 'client'), equal('client.user.email', '{{uniqueEmail}}'), equal('client.coach_id', '{{coachId}}')],
    { capture: { clientId: 'client.id' }, trackClient: true }),
   req('Read created client', 'GET', '/admin/clients/{{clientId}}', 200, 'admin', null,
     [equal('id', '{{clientId}}'), equal('cotisations.0.echeances.length', 3)])]);
add('TC-ADMIN-CLIENT-04', 'Admin - Client', 'Tạo client với coach không tồn tại', 'Negative', [],
  [req('Invalid coach id', 'POST', '/admin/clients', 422, 'admin', { ...clientBody, coach_id: 2147483647 }, [exists('errors.coach_id')])],
  'ID ngoài dữ liệu seed; body đủ tất cả field bắt buộc.');
add('TC-ADMIN-CLIENT-05', 'Admin - Client', 'Update statut suspendu và đọc lại', 'Positive', ['freshClient'],
  [req('Suspend client', 'PUT', '/admin/clients/{{clientId}}', 200, 'admin', { statut: 'suspendu' }, [equal('client.statut', 'suspendu')]),
   req('Verify persisted status', 'GET', '/admin/clients/{{clientId}}', 200, 'admin', null, [equal('statut', 'suspendu')])],
  'Mỗi case tạo client riêng; không phụ thuộc TC-03.');
add('TC-ADMIN-CLIENT-06', 'Admin - Client', 'Soft-delete client và user; endpoint/token không dùng được', 'Positive', ['freshClient'],
  [req('Client token before delete', 'POST', '/login', 200, null, { email: '{{uniqueEmail}}', password: 'Password123!' },
    [exists('token')], { capture: { deletedUserToken: 'token' } }),
   req('Delete client', 'DELETE', '/admin/clients/{{clientId}}', 200, 'admin', null, [exists('message')]),
   req('Deleted client detail', 'GET', '/admin/clients/{{clientId}}', 404, 'admin', null, [exists('message')]),
   req('Deleted user token', 'GET', '/me', 401, null, null, [exists('message')], { token: '{{deletedUserToken}}' })],
  'Kiểm tra hành vi soft delete qua API; không khẳng định đã xóa vật lý database.');
add('TC-ADMIN-COACH-01', 'Admin - Coach', 'List coach có code và clients_count', 'Positive', [],
  [req('List coaches', 'GET', '/admin/coaches', 200, 'admin', null,
    [arr(''), check('nonEmpty', ''), check('everyKeys', '', ['id', 'code_coach', 'clients_count'])])]);
add('TC-ADMIN-COACH-02', 'Admin - Coach', 'Tạo coach tự sinh COACH-NNN', 'Positive', [],
  [req('Create coach', 'POST', '/admin/coaches', 201, 'admin', coachBody,
    [exists('coach.id'), check('regex', 'coach.code_coach', '^COACH-[0-9]{3}$')],
    { trackCoach: true })],
  'Coach QA được xóa ở cleanup; không có client nên không gặp rule 422.');
add('TC-ADMIN-COACH-03', 'Admin - Coach', 'Email coach trùng bị từ chối', 'Negative', [],
  [req('Duplicate coach email', 'POST', '/admin/coaches', 422, 'admin', { ...coachBody, email: '{{coachEmail}}' }, [exists('errors.email')])],
  'Dùng karim@sportcenter.ma có thật trong seeder.');
add('TC-ADMIN-COACH-04', 'Admin - Coach', 'Không xóa coach còn client', 'Negative/Business', ['freshClient'],
  [req('Delete assigned coach', 'DELETE', '/admin/coaches/{{coachId}}', 422, 'admin', null,
    [check('contains', 'message', 'assigned clients')])],
  'Client QA đảm bảo coach có client; không xóa coach seed.');
add('TC-PAIEMENT-01', 'Payment', 'Lọc kỳ hạn en_attente đã quá hạn', 'Positive', [],
  [req('Overdue installments', 'GET', '/admin/paiements?statut=retard', 200, 'admin', null,
    [equal('per_page', 15), check('nonEmpty', 'data'), check('overdue', 'data')])],
  'Dùng seed có date_inscription từ 1–6 tháng trước; assert date < thời điểm hiện tại, không chỉ < today.');
add('TC-PAIEMENT-02', 'Payment', 'Tạo payment và cập nhật echeance thành paye', 'Positive', ['paymentClient'],
  [req('Record payment', 'POST', '/admin/paiements', 201, 'admin', paymentBody,
    [exists('paiement.id'), equal('paiement.echeance_id', '{{echeanceId}}'), equal('paiement.montant', '{{echeanceAmount}}')]),
   req('Verify paid installment', 'GET', '/admin/clients/{{clientId}}', 200, 'admin', null,
    [equal('cotisations.0.echeances.0.statut', 'paye'), exists('cotisations.0.echeances.0.paiement.id')])],
  'ID/amount lấy động từ client QA. Field đúng là date_paiement.');
add('TC-PAIEMENT-03', 'Payment', 'Từ chối payment lần 2 cùng kỳ hạn', 'Negative/Business', ['paymentClient', 'payInstallment'],
  [req('Duplicate payment', 'POST', '/admin/paiements', 422, 'admin', paymentBody,
    [check('contains', 'message', 'already paid')])],
  'Precondition trả kỳ hạn trước; không phụ thuộc TC-02.');
add('TC-PAIEMENT-04', 'Payment', 'Stats có 4 field và số tiền không âm', 'Positive', [],
  [req('Payment statistics', 'GET', '/admin/paiements/stats', 200, 'admin', null,
    [check('nonNegative', 'total_encaisse'), check('nonNegative', 'total_en_attente'), check('nonNegative', 'total_en_retard'), arr('par_methode')])]);
add('TC-COACH-01', 'Coach - Planning', 'Coach xem planning tháng/năm hiện tại', 'Positive', ['coachIdentity'],
  [req('Coach planning', 'GET', '/coach/planning?mois={{month}}&annee={{year}}', 200, 'coach', null,
    [equal('mois', '{{month}}'), equal('annee', '{{year}}'), arr('plannings'), check('coachOwnership', 'plannings', '{{coachId}}')])]);
add('TC-COACH-02', 'Coach - Planning', 'Tạo session cho client coach khác bị 404', 'Negative/Security', ['foreignClient'],
  [req('Foreign client session', 'POST', '/coach/planning/seances', 404, 'coach', sessionBody, [exists('message')])],
  'Tạo client thuộc Sara, request dùng token Karim; validation exists phải qua trước ownership check.');
add('TC-COACH-03', 'Coach - Planning', 'Giờ kết thúc trước giờ bắt đầu bị 422', 'Boundary', ['freshClient'],
  [req('End before start', 'POST', '/coach/planning/seances', 422, 'coach', { ...sessionBody, heure_fin: '09:00' }, [exists('errors.heure_fin')])],
  'Có client_id/date đầy đủ; client thuộc Karim để cô lập lỗi giờ.');
add('TC-CLIENT-01', 'Client', 'Client dashboard của chính account', 'Positive', [],
  [req('Client dashboard', 'GET', '/client/dashboard', 200, 'client', null,
    [equal('client.nom', 'Yassine Amrani'), exists('cotisation.montant_annuel'), arr('prochaines_seances'), arr('alertes')])]);
add('TC-CLIENT-02', 'Client', 'Client payments trả object kỳ hạn và tổng tiền', 'Positive', [],
  [req('Client installments', 'GET', '/client/paiements', 200, 'client', null,
    [arr('echeances'), exists('montant_annuel'), check('nonNegative', 'total_paye'), check('nonNegative', 'total_restant'), check('balance', '')])],
  'Response không phải array payment ở root; kiểm tra total_paye + total_restant = montant_annuel.');
add('TC-ROLE-01', 'Role', 'Client gọi admin bị 403', 'Negative/Security', [],
  [req('Client accesses admin', 'GET', '/admin/clients', 403, 'client', null, [check('contains', 'message', 'access denied')])]);
add('TC-ROLE-02', 'Role', 'Không token gọi admin bị 401', 'Negative/Security', [],
  [req('No token', 'GET', '/admin/clients', 401, null, null, [exists('message')])]);
add('TC-ROLE-03', 'Role', 'Admin được middleware cho phép xem coach dashboard', 'Positive/Role', [],
  [req('Admin accesses coach dashboard', 'GET', '/coach/dashboard', 200, 'admin', null,
    [exists('coach.id'), exists('total_clients')])],
  'Giữ expected 200 theo role:coach,admin. Code hiện truy vấn Coach theo admin user_id nên trả 404; ghi defect, không đổi expected để che lỗi.',
  'BUG-001');
add('TC-SECURITY-01', 'Security', 'SQL injection trong email bị validation từ chối', 'Security', [],
  [req('Injection-like email', 'POST', '/login', 422, null, { email: "' OR 1=1 --", password: 'Wrong123!' }, [exists('errors.email')])],
  'Laravel email validation trả chính xác 422; luôn assert không có SQLSTATE/trace/file/exception.');
add('TC-SECURITY-02', 'Security', 'Password 7 ký tự bị từ chối', 'Boundary', [],
  [req('Seven-character password', 'POST', '/register', 422, null,
    { ...registerBody, password: '1234567', password_confirmation: '1234567' }, [exists('errors.password')])],
  'Body đầy đủ để assert đúng errors.password.');
export const testCases = cases;
export const defects = [{
  id: 'BUG-001', testId: 'TC-ROLE-03', severity: 'Medium',
  title: 'Admin gọi coach/dashboard bị 404 dù middleware cho phép',
  expected: '200 với dashboard phù hợp hoặc quy tắc truy cập admin được định nghĩa rõ',
  actual: '404: Coach::where(user_id, admin.id)->firstOrFail()',
  file: 'backend/app/Http/Controllers/Coach/DashboardController.php',
  suggestion: 'Làm rõ admin xem coach nào; nếu cho phép thì truyền/chọn coach và kiểm tra quyền, hoặc sửa requirement/role middleware. Chưa sửa application.'
}];

