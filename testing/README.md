# SportCenter — 50 test cases ReadyAPI

> Cập nhật 05/10/2026: giữ nguyên **33 functional cases**, bổ sung **17 NFR cases** (6 performance + 11 security). Project XML tổng hiện có **50 cases / 10 suites**. Xem [nfr/README.md](nfr/README.md) để chạy bộ mới; Excel có 4 sheet `NFR ...`. Các kết quả 32 Pass/1 Fail dưới đây chỉ nói về bộ functional cũ, không bao gồm NFR.

Bộ test áp dụng cho https://github.com/ThachTheStone/SportCenter.Testing, commit a0648e3.

33 functional case / 8 functional suites giữ nguyên TC ID của VIPSportCenter_ReadyAPI_TestPlan.xlsx; tổng project hiện có 50 case / 10 suites sau khi thêm NFR. Source functional thống nhất trong cases.mjs; source NFR ở nfr/nfr-cases.mjs.

## File chính

- ../VIPSportCenter_ReadyAPI_TestCases_Corrected.xlsx: Overview, Test Cases, Request Steps, Changes, Results, Defects.
- VIPSportCenter-readyapi-project.xml: import ReadyAPI/SoapUI, gồm 50 Groovy Script TestSteps (33 functional + 17 NFR).
- groovy/*.groovy: source riêng của từng case.
- readyapi-engine.groovy: implementation dùng chung, tự login, setup, HTTP, assert và cleanup.
- cases.mjs: dữ liệu và kịch bản đầy đủ.
- run-tests.mjs: runner Node.js, không cần npm install.
- build-artifacts.mjs: sinh lại Excel/XML/Groovy.
- reports/report.html, results.json, junit.xml: kết quả HTTP integration.
- reports-groovy/: kết quả chạy Groovy từ script trong chính project XML.
- ../../Research.docx: tài liệu đã bổ sung phần 18 (thay đổi, kết quả và BUG-001).

## Kết quả đã kiểm chứng

HTTP integration: 32 Pass / 1 Fail / 0 Blocked.
Groovy script integration: 32 Pass / 1 Fail / 0 Blocked.
XML project: đạt schema SoapUI chính thức.

TC-ROLE-03 expected 200, actual 404: admin được middleware role:coach,admin cho phép, nhưng Coach/DashboardController tìm hồ sơ coach theo user_id của admin. Case giữ expected nghiệp vụ và báo BUG-001. Không sửa application để làm test Pass.

Chưa mở/chạy ReadyAPI Desktop GUI; cột ReadyAPI GUI trong Excel là Not run. Groovy verification dùng Groovy 3.0.24/Java 8 với binding testRunner/context/log giả lập để kiểm tra chính script xuất ra XML; không xác nhận license hay mọi khác biệt runtime của ReadyAPI Desktop.

## 1. Chạy lại ngay bằng HTTP runner

PHP >=8.2, Composer và Node >=22.12 đã có trên máy. Backend/vendor đã cài.

PowerShell:

    cd "D:/Semester 5/SWT301/SWT301 LAB2/SportCenter.Testing/testing"
    node run-tests.mjs --managed

Managed mode:
1. Tạo database SQLite mới trong TEMP.
2. Migrate/seed chỉ database mới.
3. Khởi động PHP server trên port riêng.
4. Chạy 33 case tuần tự.
5. Xuất JSON, HTML và JUnit XML vào reports.
6. Dừng server; giữ database riêng để đọc lại defect.

Không cần tạo .env hay bật MySQL/XAMPP để chạy mode này. APP_KEY/database/cache/session được cấu hình riêng cho process. Log PHP đi stderr; server chỉ nghe 127.0.0.1.

Exit code: 0 = tất cả Pass; 1 = có Fail/Blocked (hiện là BUG-001); 2 = lỗi setup/runner.

Chạy một case:

    node run-tests.mjs --managed --case TC-AUTH-04

Đổi SLA:

    node run-tests.mjs --managed --sla-ms 3000

## 2. Chạy trong ReadyAPI

Khởi động API riêng dành cho lab:

    node run-tests.mjs --managed --serve

Terminal in dòng:

    ReadyAPI baseUrl: http://127.0.0.1:<port>/api

Giữ terminal mở. Copy URL này vào Project Properties > baseUrl trong ReadyAPI.

Các bước:
1. File > Import Project, chọn VIPSportCenter-readyapi-project.xml.
2. Project Properties: đặt baseUrl theo terminal; giữ credential seed mặc định.
3. Mở Functional Tests; thấy 10 suites, 50 cases. Trong đó 8 suite cũ/33 functional, 2 suite `NFR - ...`/17 nonfunctional.
4. Chạy tuần tự các suite functional hoặc từng case. Với NFR, xem nfr/README.md, đặt project property nfrLabOnly=true sau khi xác nhận database lab riêng. Mặc định false để chặn chạy NFR ngoài ý muốn.
5. Mở Groovy step để xem log method/path/status/ms và kết quả assert.
6. TC-ROLE-03 hiện sẽ Fail; ghi BUG-001 trong báo cáo.
7. Cập nhật cột ReadyAPI GUI trong Excel bằng kết quả GUI thực tế.
8. Ctrl+C ở terminal để dừng API riêng.

Mỗi case chứa một Groovy Script TestStep chạy nhiều HTTP request. Script thực hiện assertion tương đương kiểm tra status/JSON field/SLA. Không có REST Request inspector, Property Transfer UI hay DataSource UI tự tạo. Nếu giảng viên yêu cầu demo các tính năng UI đó, dùng sheet Request Steps để tạo REST Request steps tương ứng và chuyển $.token vào project property qua Property Transfer; các script hiện tại có chức năng chuyển token bằng biến nội bộ.

Groovy step là test chức năng API thông thường; hai case Security chỉ kiểm tra input validation/role/leak, không phải một security scan đầy đủ.

## 3. Chạy trên API đã setup sẵn

    node run-tests.mjs --base-url http://127.0.0.1:8000/api

API phải chạy, database đã seed đúng account. Chỉ dùng database lab: suite có tạo/sửa/xóa dữ liệu QA.

Có thể override credential bằng environment:
ADMIN_EMAIL, ADMIN_PASSWORD, COACH_EMAIL, COACH_PASSWORD, OTHER_COACH_EMAIL, OTHER_COACH_PASSWORD, CLIENT_EMAIL, CLIENT_PASSWORD.
ReadyAPI dùng Project Properties có tên adminEmail/adminPassword/... tương ứng.

## Setup, biến và cleanup

- {{uniqueEmail}}: UUID riêng cho mỗi case, tránh unique email collision.
- {{coachId}}/{{clientId}}/{{echeanceId}}: lấy từ API, không dùng ID seed cố định.
- {{today}}/{{month}}/{{year}}: ngày UTC; app mặc định UTC.
- Biến {{...}} là template của engine, được thay bằng giá trị thực trước HTTP request; exact ID/amount được giữ kiểu số.
- Token lấy riêng từng case. Logout chỉ thu hồi token do case tạo.
- Cleanup nằm trong finally, chạy cả khi assert Fail.
- Client/coach QA được soft-delete, không xóa vật lý.
- Payment/cotisation còn lại trong database test, vì API không có DELETE tương ứng.
- Mỗi lần --managed tạo database mới; đây là cách chạy độc lập sạch nhất.
- Một case setup không thành công được ghi Blocked; lỗi assertion hoặc cleanup được ghi Fail.
- SLA chỉ tính request chính, không tính setup/cleanup.
- Mọi response assert JSON Content-Type và không lộ SQLSTATE/exception/trace/file.
- Trường annee của register không fillable nên bị bỏ qua trên code này; register card đã chạy Pass.

## Sinh lại artifact sau khi chỉnh case

    node build-artifacts.mjs

Generator xuất workbook, XML và groovy vào thư mục testing hiện tại. Chuyển workbook mới lên root repo nếu cần. Các report cũ không tự trở thành kết quả của case vừa sửa: chạy lại suite trước khi sinh Excel dùng để báo cáo.

Nếu xuất Research.docx, dùng bản Research trước phần 18 làm input RESEARCH_DOCX. Generator không nối lặp phụ lục vào file đã có phần 18.

## Kiểm tra Groovy độc lập (tùy chọn)

Không cần bước này để chạy ReadyAPI. Dành cho người muốn tái hiện kiểm chứng ở ngoài GUI:
tải groovy-3.0.24.jar và groovy-json-3.0.24.jar từ Maven Central vào thư mục riêng, rồi:

    node run-tests.mjs --managed --groovy-classpath "C:/tools/groovy-3.0.24.jar;C:/tools/groovy-json-3.0.24.jar" --report-dir reports-groovy

Dùng dấu ; cho classpath Windows, dấu : trên Linux/macOS. Harness verify-readyapi.groovy đọc script từ XML và thực thi với binding giả lập.

## Nguồn chính thức

- Groovy samples: https://support.smartbear.com/readyapi/docs/en/test-apis-with-readyapi/scripting/groovy-scripting-samples.html
- Script TestStep: https://www.soapui.org/docs/functional-testing/working-with-teststeps/
- Schema project: https://github.com/SmartBear/soapui/blob/next/soapui/src/main/xsd/soapui/soapui.xsd
