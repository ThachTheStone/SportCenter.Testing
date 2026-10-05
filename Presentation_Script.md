# Script slide và demo — ReadyAPI / VIP Sport Center

Ngày soạn: 04/10/2026. Môn: SWT301 — LAB2. Project: SportCenter.Testing, commit a0648e3.

> Cập nhật 05/10/2026: đã thêm 17 NFR case (6 performance, 11 security), tổng 50 case. Script 25 phút bên dưới vẫn lấy 33 functional case làm demo chính; xem mục 12 để thay một phần demo bằng NFR, không cộng thêm thời gian ngoài khung. Kết quả functional 32/1 và NFR được ghi riêng, GUI vẫn cần chạy rehearsal.

File này là tài liệu tập nói và chuẩn bị demo. Khi làm slide, chỉ lấy phần **Nội dung chiếu**; phần **Lời nói**, thao tác và câu trả lời dùng để luyện trước. Ngày trình bày không cầm hoặc đọc file này.

## 1. Mục tiêu, phạm vi và quy tắc

Nhóm trình bày ReadyAPI là công cụ kiểm thử API của SmartBear, rồi chứng minh cách dùng công cụ để kiểm tra các quy tắc của trung tâm thể thao: đăng ký, xác thực, phân quyền, payment và chặn thanh toán trùng.

Đối tượng kiểm thử là Laravel REST API của VIP Sport Center. Frontend đã dịch sang tiếng Anh; endpoint và một số trường nghiệp vụ vẫn giữ tiếng Pháp. Test dùng Laravel Sanctum Bearer token.

Project được chọn cho bài lab học kỳ 5. Đây là project mã nguồn mở được nhóm sử dụng làm đối tượng test, chưa có bằng chứng đây là project nhóm tự xây trong học kỳ trước. Nếu nhóm có project từ kỳ 1–5 khác, có thể giới thiệu bổ sung; không nhận source của tác giả thành sản phẩm tự viết.

Các yêu cầu cần tuân thủ:

- Present 10 phút + demo trực tiếp 15 phút = 25 phút; tối đa 26 phút theo yêu cầu lớp.
- Q&A riêng 10 phút; tổng buổi khoảng 35 phút.
- Tất cả thành viên đều nói và thao tác/giải thích một phần demo.
- Không dùng video. Demo gọi API đang chạy và thực thi test tại chỗ.
- Không cầm tài liệu khi trình bày; không đặt speaker script dài lên slide.
- Mỗi slide tối đa 3–4 ý ngắn; dùng sơ đồ, HTTP status và số liệu để gợi nhớ.
- Ghi câu hỏi, câu trả lời thực tế, đánh giá chéo và đóng góp trong [Evaluation.md](Evaluation.md).

## 2. Phân vai — Who

Tạm dùng nhóm 3 người theo kế hoạch nhóm trước đó. Điền tên thật trước khi tập.

| Thành viên | Tên | Phần present | Phần demo | Q&A phụ trách |
|---|---|---|---|---|
| TV1 | [Điền tên] | Mục tiêu, overview, lịch sử, đối tượng sử dụng | Đăng ký, token, logout, role | ReadyAPI là gì, dùng khi nào, lịch sử/giới hạn |
| TV2 | [Điền tên] | Architecture, ưu/nhược, tính năng tool | Client/payment, kỳ hạn và duplicate payment | Request, assertion, dữ liệu, Groovy, cleanup |
| TV3 | [Điền tên] | Nghiệp vụ, test design, kết quả và defect | BUG-001, chạy suite, đọc report | Expected/actual, coverage, defect, đánh giá |

TV1 chuyển slide khi TV2 hoặc TV3 đang nói. Người đến lượt demo điều khiển chuột/bàn phím; người khác không nói chen. Việc ghi nhận câu hỏi thực tế làm sau phần trả lời hoặc bởi người đang không trình bày; không dùng tài liệu để nhắc lời cho người nói.

Nếu nhóm có hơn 3 người, chia thêm phần business feature, assertion hoặc report cho thành viên còn lại trong cùng 25 phút; không để người chỉ đứng trên sân khấu mà không nói.

## 3. Timeline — When

### Present: 00:00–10:00

| Slide | Nội dung | Người | Thời gian | Mốc kết thúc |
|---|---|---|---:|---:|
| 1 | What: bài lab giải quyết vấn đề gì? | TV1 | 40 giây | 00:40 |
| 2 | ReadyAPI là gì và làm gì? | TV1 | 50 giây | 01:30 |
| 3 | Who: nhà phát triển và lịch sử | TV1 | 50 giây | 02:20 |
| 4 | Who/When: dùng cho ai, lúc nào? | TV1 | 50 giây | 03:10 |
| 5 | Architecture | TV2 | 70 giây | 04:20 |
| 6 | Điểm mạnh, yếu và điểm sáng | TV2 | 50 giây | 05:10 |
| 7 | Details: các feature của ReadyAPI | TV2 | 70 giây | 06:20 |
| 8 | Details: nghiệp vụ SportCenter | TV3 | 70 giây | 07:30 |
| 9 | How: thiết kế và viết test | TV3 | 60 giây | 08:30 |
| 10 | Đánh giá kết quả và hạn chế | TV3 | 60 giây | 09:30 |
| 11 | Chuyển sang demo | TV1 | 30 giây | 10:00 |

Thời gian present: TV1 3 phút 40 giây; TV2 3 phút 10 giây; TV3 3 phút 10 giây.

### Demo: 10:00–25:00

| Mốc buổi | Mốc trong demo | Kịch bản | Người |
|---|---|---|---|
| 10:00–14:30 | 00:00–04:30 | 1. Đăng ký, xác thực và phân quyền | TV1 |
| 14:30–20:00 | 04:30–10:00 | 2. Client, payment và chặn trả trùng | TV2 |
| 20:00–22:00 | 10:00–12:00 | 3. Tái hiện BUG-001 | TV3 |
| 22:00–24:00 | 12:00–14:00 | Chạy suite và đọc kết quả live | TV3 |
| 24:00–25:00 | 14:00–15:00 | Đánh giá, đóng góp, chuyển Q&A | TV3 |

Mốc 25:00 dừng demo; 25:00–35:00 hỏi đáp. Một phút vượt cho phép là dự phòng xử lý thao tác, không dùng để thêm slide.

## 4. Nội dung slide và lời nói

### Slide 1 — Chúng em đang kiểm thử điều gì?

**Nội dung chiếu**

- LAB2: API testing với ReadyAPI
- VIP Sport Center
- Đăng ký • Phân quyền • Thanh toán
- 33 test case, 8 nhóm

**Người / thời gian:** TV1, 40 giây.

**Lời nói tập trước**

“Bài lab của nhóm là tìm hiểu ReadyAPI và áp dụng vào một project có API thật. Nhóm dùng VIP Sport Center, một hệ thống quản lý trung tâm thể thao. Chúng em tập trung vào ba câu hỏi: người dùng có đăng ký và đăng nhập đúng không, mỗi role có truy cập đúng phạm vi không, và một khoản thanh toán có được ghi nhận đúng mà không bị trả trùng không. Nhóm đã thiết kế 33 test case và viết automation để kiểm tra các tình huống này.”

**Cần nhấn:** phân biệt tool ReadyAPI và application SportCenter. Nhóm kiểm tra hành vi backend qua request/response.

### Slide 2 — What: ReadyAPI dùng để làm gì?

**Nội dung chiếu**

- Gửi REST/SOAP request
- So sánh actual với expected
- Tự động hóa test lặp lại
- Functional • Performance • Security

**Người / thời gian:** TV1, 50 giây.

**Lời nói tập trước**

“ReadyAPI là bộ công cụ của SmartBear để kiểm thử API. Một request có method, URL, header và body. Công cụ gửi request đến hệ thống, nhận response và dùng assertion để kiểm tra response có đúng yêu cầu không. Ví dụ một login hợp lệ không chỉ cần trả HTTP 200; response còn phải có token và đúng role. ReadyAPI có các khả năng functional, performance, security và virtualization. Trong lab này, phần thực hiện chính là functional REST API testing, có thêm negative case về validation và quyền truy cập.”

**Không nói:** “Chúng em đã làm load test/security scan” khi chỉ mới chạy functional assertions.

Nguồn: [ReadyAPI documentation](https://support.smartbear.com/readyapi/), [ReadyAPI và SoapUI](https://support.smartbear.com/qacomplete/docs/other-tools/readyapi-and-soapui.html).

### Slide 3 — Who: ai phát triển, lịch sử ra sao?

**Nội dung chiếu**

- 2005: SoapUI — Ole Lensmar
- 2014: Ready! API
- SmartBear phát triển ReadyAPI
- SOAP → REST và API quality

**Người / thời gian:** TV1, 50 giây.

**Lời nói tập trước**

“ReadyAPI do SmartBear phát triển và cung cấp. Nguồn gốc của nền tảng gắn với SoapUI, do Ole Lensmar khởi tạo để kiểm thử web service. Theo lịch sử chính thức của SoapUI, bản 1.0 phát hành ngày 16 tháng 10 năm 2005. Đến năm 2014, SmartBear giới thiệu họ công cụ Ready! API, mở rộng từ kiểm thử web service sang nhiều nhu cầu về chất lượng API. Nhóm chỉ dùng các mốc này để giải thích nguồn gốc; không đồng nhất bản SoapUI Open Source với toàn bộ tính năng thương mại của ReadyAPI.”

**Cần nhớ:** Ole Lensmar là người khởi tạo SoapUI; SmartBear là đơn vị phát triển/cung cấp ReadyAPI hiện nay.

Nguồn: [SoapUI release history](https://www.soapui.org/docs/downloads/release-history/), [SmartBear giới thiệu Ready! API năm 2014](https://smartbear.com/blog/api-readiness-do-you-have-what-you-need/).

### Slide 4 — Who/When: dành cho ai và dùng lúc nào?

**Nội dung chiếu**

- QA: kiểm thử nghiệp vụ API
- Developer: kiểm tra integration
- Team: regression trước release
- Cần API, data và expected rõ

**Người / thời gian:** TV1, 50 giây.

**Lời nói tập trước**

“QA dùng ReadyAPI để xây các kịch bản kiểm thử; developer dùng để kiểm tra integration và tái hiện lỗi; nhóm sản phẩm dùng kết quả trước khi release. Có thể bắt đầu test khi API đã có contract và dữ liệu phù hợp, kể cả lúc frontend chưa hoàn tất. Công cụ thuận tiện với luồng nhiều request như login rồi tạo payment. Tuy nhiên, người dùng phải hiểu HTTP, authentication và nghiệp vụ. Nếu expected không rõ hoặc test data không tồn tại, tool không thể tự quyết định hệ thống đúng hay sai.”

**Bất tiện cần nói được:** license/trial theo module; setup và học script; data/token state; bảo trì khi API đổi.

**Chuyển người:** “Tiếp theo, TV2 sẽ giải thích tool kết nối với project như thế nào.”

### Slide 5 — Architecture: request chạy qua đâu?

**Nội dung chiếu**

Dùng sơ đồ này làm phần chính của slide; không đưa thêm source code dài.

~~~mermaid
flowchart LR
    A["ReadyAPI\nTest case / Groovy"] -->|HTTP + Bearer token| B["Laravel API\nRoute / Middleware / Controller"]
    B --> C["Eloquent\nDatabase SQLite lab"]
    C --> B
    B -->|Status + JSON| D["Assertions\nPass / Fail + Report"]
~~~

**Người / thời gian:** TV2, 70 giây.

**Lời nói tập trước**

“Bên trái là ReadyAPI, chứa project, test suite, test case và các step. Khi chạy, nó gửi HTTP request cùng Bearer token đến Laravel. Route xác định controller; middleware kiểm tra token, role và trạng thái khóa tài khoản. Controller validate dữ liệu rồi gọi Eloquent làm việc với database. Response đi ngược lại để assertion quyết định Pass hoặc Fail. Frontend của SportCenter là React 19 và Vite, nhưng các test ở đây gọi trực tiếp API. Để chạy lại độc lập, nhóm dùng runner tạo SQLite riêng, migrate và seed trước mỗi lần. Database này dành cho lab, không phải khẳng định hệ thống production dùng SQLite.”

**Cần nhớ:** Sanctum Bearer token; Laravel 12/PHP 8.2+; SQLite là môi trường test. Đây là sơ đồ triển khai lab, không phải khẳng định toàn bộ kiến trúc nội bộ của ReadyAPI.

### Slide 6 — Điểm mạnh, điểm yếu và điểm sáng

**Nội dung chiếu**

- Mạnh: suite, assertion, script
- Yếu: license, setup, maintenance
- Điểm sáng: test cả quy tắc nghiệp vụ
- Fail giúp tìm defect

**Người / thời gian:** TV2, 50 giây.

**Lời nói tập trước**

“Điểm mạnh của ReadyAPI là gom request thành kịch bản có thể chạy lại, quản lý assertion và mở rộng bằng script. Điểm hạn chế là chi phí license cho các module, thời gian học cấu hình và công sức bảo trì khi API hoặc dữ liệu đổi. Với SportCenter, API đã tách role và có dữ liệu seed nên phù hợp để test. Điểm sáng của bài nhóm là không chỉ kiểm tra status: payment phải chuyển kỳ hạn sang trạng thái đã trả, và payment lần hai phải bị chặn. Một case Fail có thể là kết quả có giá trị vì nó chỉ ra lỗi hoặc điểm chưa thống nhất trong requirement.”

**Nếu bị hỏi ưu/nhược của application:** ưu là API rõ module, có seed và validation; yếu là admin vào coach dashboard không có profile phù hợp, một số quy tắc còn cần làm rõ; 33 case chưa phải full coverage.

License là hạn chế thực tế, không đưa giá cụ thể lên slide vì có thể thay đổi. Nguồn: [SmartBear license types](https://support.smartbear.com/administration/docs/en/smartbear-license-management/about/license-types.html).

### Slide 7 — Details: feature nào giúp test?

**Nội dung chiếu**

- Project → Suite → Case → Step
- Properties, token, test data
- Assertion + Groovy
- Runner + report

**Người / thời gian:** TV2, 70 giây.

**Lời nói tập trước**

“Project chứa toàn bộ bộ test; suite nhóm các case theo module; case mô tả một tình huống; step là từng thao tác. Properties giúp cấu hình URL và credential. Token lấy từ login được dùng cho request sau. Assertions kiểm tra status, field, giá trị và thời gian response. Groovy xử lý dữ liệu động, vòng lặp và điều kiện nghiệp vụ phức tạp. Runner thực hiện nhiều case rồi tạo kết quả. Bản nhóm đã viết gồm 33 Groovy Script TestSteps, có setup, gửi HTTP, assertion và cleanup. Chúng em chưa tự dựng Property Transfer hoặc DataSource dưới dạng step GUI trong project này, dù ReadyAPI có các tính năng đó.”

**Bảng hiểu sâu để trả lời, không chép toàn bộ lên slide**

| Feature | What / When | How trong bài lab | Trạng thái |
|---|---|---|---|
| REST/SOAP testing | Gửi request khi API đã có endpoint | Project này dùng REST + JSON | Đã viết và kiểm chứng script |
| Properties / environment | Đổi URL/credential theo môi trường | Project property baseUrl, account seed, slaMs | Đã cấu hình properties; chưa tạo nhiều environment |
| Property Transfer | Chuyển token/ID giữa request | Script lấy token, profile.id và echeance.id bằng biến | Có chức năng chuyển dữ liệu trong script; chưa dựng step GUI riêng |
| Data-driven testing | Chạy một luồng với nhiều bộ data | UUID tạo email riêng; lock case lặp 5 lần | Dữ liệu động/vòng lặp; chưa có Excel DataSource step |
| HTTP/JSON assertions | Kiểm tra status và nội dung | Role, errors.field, payment state, total balance | Đã thực hiện trong script |
| Groovy | Logic phức tạp, setup/cleanup | finally cleanup; search/overdue/ownership checks | Đã kiểm chứng Groovy độc lập |
| Response SLA | Bắt request chậm quá ngưỡng | <=2000ms cho request chính | Có assertion; không phải load benchmark |
| Runner/report | Regression và lưu bằng chứng | ReadyAPI thực thi case; Node/harness có HTML/JSON/JUnit | Report hiện có là HTTP/Groovy; GUI cập nhật sau demo |
| Performance | Kiểm tra tải với profile/user phù hợp | Ngoài phạm vi demo | Chưa thực hiện |
| Security testing | Kiểm tra các input/scan bảo mật | Hai negative case validation/leak; không phải scan đầy đủ | Chỉ functional negative checks |
| Virtualization | Mô phỏng service phụ thuộc chưa sẵn sàng | Chưa cần vì backend local đã chạy | Chưa thực hiện; phụ thuộc license/module |

Các khả năng performance/virtualization phải đối chiếu license của bản cài. Nguồn: [Groovy samples](https://support.smartbear.com/readyapi/docs/en/test-apis-with-readyapi/scripting/groovy-scripting-samples.html), [TestSteps](https://www.soapui.org/docs/functional-testing/working-with-teststeps/), [ReadyAPI Virtualization/VirtServer](https://support.smartbear.com/virtserver/docs/en/about.html).

**Chuyển người:** “TV3 sẽ nối các feature của tool với quy tắc nghiệp vụ cụ thể.”

### Slide 8 — Details: nghiệp vụ nào cần kiểm tra?

**Nội dung chiếu**

- Admin • Coach • Client
- Register → Profile → Payment
- en_attente → paye
- Duplicate payment → 422

**Người / thời gian:** TV3, 70 giây.

**Lời nói tập trước**

“SportCenter có ba role. Admin quản lý client, coach và payment; coach làm việc với client được phân công và planning; client xem dữ liệu của mình. Khi đăng ký gói mensuel, code hiện tạo cotisation 3600 và ba kỳ hạn, mỗi kỳ 1200. Chọn card sẽ ghi nhận kỳ đầu, nên tổng đã trả là 1200 và còn lại 2400. Khi admin ghi payment cho một kỳ hạn chưa trả, trạng thái phải đổi từ en_attente sang paye. Gửi lại cho cùng kỳ hạn phải bị từ chối. Đây là các business assertion; status 201 một mình chưa chứng minh tiền và trạng thái đúng.”

**Bảng giải thích nghiệp vụ, dùng luyện/Q&A**

| Feature application | Actor | Quy tắc được test | Case tiêu biểu |
|---|---|---|---|
| Register / membership | Client | Email unique, password >=8, plan hợp lệ, card trả kỳ đầu | TC-AUTH-06/07, TC-SECURITY-02 |
| Login / lock | Mọi role | Sai 5 lần: 401; lần 6: 423 | TC-AUTH-03/04 |
| Token / logout | User đã login | Token bị thu hồi sau logout | TC-AUTH-08/09 |
| Client CRUD | Admin | Coach tồn tại; update persist; soft delete | TC-ADMIN-CLIENT-03/04/05/06 |
| Coach management | Admin | Code COACH-NNN; duplicate email; không xóa coach còn client | TC-ADMIN-COACH-02/03/04 |
| Payment | Admin | Lấy đúng kỳ hạn, ghi payment, chuyển paye, chặn duplicate | TC-PAIEMENT-02/03 |
| Coach planning | Coach | Chỉ client được phân công; giờ kết thúc sau bắt đầu | TC-COACH-02/03 |
| Client portal | Client | Profile riêng; payment object và balance đúng | TC-CLIENT-01/02 |
| Role security | Admin/Coach/Client | Không token 401; sai role 403; admin dashboard coach có defect | TC-ROLE-01/02/03 |

Các con số 3600/1200/2400 mô tả code hiện tại, không tự suy ra đây là thanh toán ngân hàng thật. Card trong flow register ghi record nội bộ; bộ test này chưa xác nhận tích hợp payment gateway.

### Slide 9 — How: từ yêu cầu đến code test

**Nội dung chiếu**

- Requirement → Case → Request
- Expected + business assertion
- Fixture riêng, ID lấy động
- Cleanup và report

**Người / thời gian:** TV3, 60 giây.

**Lời nói tập trước**

“Nhóm đọc route, controller, model và seed để đối chiếu test plan. File cũ ghi 32 case nhưng chi tiết có 33; một số credential và body chưa chạy được nên đã chỉnh. Mỗi case mới có precondition, request, expected, assertion và cleanup. Các case dùng UUID cho email, lấy ID từ API và lấy token riêng, nên không cần chạy đúng thứ tự case tạo trước rồi case sửa sau. cases.mjs là nguồn dùng để sinh Excel và script; XML đã được kiểm tra schema, nhưng còn cần import và chạy thử trong ReadyAPI Desktop. Script Groovy và HTTP runner đã được kiểm chứng với database riêng. Điều này giúp nhóm tái hiện lỗi và kiểm tra lại khi code thay đổi.”

**Điểm cần hiểu:** fixture là dữ liệu/điều kiện tạo trước test; cleanup chạy cả khi Fail. Soft delete không xóa vật lý mọi dữ liệu liên quan.

### Slide 10 — Kết quả có ý nghĩa gì?

**Nội dung chiếu**

- 33 case • 8 suites
- HTTP/Groovy: 32 Pass, 1 Fail
- BUG-001: expected 200, actual 404
- GUI / coverage: giới hạn rõ

**Người / thời gian:** TV3, 60 giây.

**Lời nói tập trước**

“Kết quả đã lưu là 32 Pass và 1 Fail ở cả HTTP runner và kiểm chứng Groovy. Case Fail là TC-ROLE-03: test plan mong admin xem coach dashboard được 200, middleware cũng cho phép role admin, nhưng controller tìm coach profile theo user admin và trả 404. Nhóm ghi BUG-001 và giữ expected để thấy sự khác biệt, đồng thời cần thống nhất admin phải xem dashboard của coach nào. Kết quả này chưa phải kết quả chạy ReadyAPI Desktop; phần demo sẽ tạo bằng chứng live. Ngoài ra, tỷ lệ Pass khoảng 97 phần trăm chỉ tính 33 case đã chọn, không có nghĩa hệ thống đã được test đầy đủ hay an toàn toàn diện.”

**Định lượng chính xác:** 32 / 33 ≈ 96,97%. Không tính 33 / 41 là endpoint coverage vì test case và endpoint là hai đơn vị khác nhau.

**Trước hôm trình bày:** nếu rehearsal GUI đã có kết quả, sửa slide thành hai dòng tách nguồn: “HTTP/Groovy: ...” và “ReadyAPI rehearsal: ... ngày ...”. Không ghi GUI 32 Pass/1 Fail chỉ dựa trên report Node.

### Slide 11 — How: xem demo trực tiếp

**Nội dung chiếu**

- 1. Register / token / role
- 2. Payment / duplicate
- 3. Defect / regression report
- Expected → Actual → Evidence

**Người / thời gian:** TV1, 30 giây.

**Lời nói tập trước**

“Nhóm sẽ demo trực tiếp ba kịch bản trên API local. Đầu tiên là đăng ký, token và quyền truy cập. Tiếp theo là ghi nhận payment và chặn trả trùng. Cuối cùng nhóm tái hiện lỗi admin dashboard rồi chạy toàn bộ suite. Với mỗi kịch bản, chúng em sẽ nói expected trước khi chạy, quan sát actual sau khi chạy và chỉ ra bằng chứng assertion hoặc log.”

**Thao tác:** chuyển từ slide sang ReadyAPI đã chuẩn bị sẵn; bắt đầu đồng hồ demo.

## 5. Chuẩn bị trước buổi — What / When / Who / How

### Tối trước hoặc trước buổi ít nhất 30 phút

| What | Who | When | How / điều kiện đạt |
|---|---|---|---|
| Điền tên và phân vai thật | Cả nhóm | Trước rehearsal | Điền bảng mục 2 và task log trong Evaluation |
| Kiểm tra ReadyAPI/license | TV1 | Tối trước | Mở app, activate trial/license hợp lệ, import project; không đợi đến lớp mới activate |
| Chuẩn bị backend | TV2 | Tối trước | backend/vendor đã cài; chạy managed API; /me không token trả 401 |
| Chạy rehearsal GUI | TV2 + TV3 | Tối trước | Chạy case demo và suite; ghi actual GUI vào Excel, không lấy report Node thay kết quả GUI |
| Kiểm tra rule và BUG-001 | TV3 | Tối trước | Xác nhận expected 200/actual 404; mở sẵn route/controller và Defects |
| Đo thời gian | Cả nhóm | Hai vòng rehearsal | Vòng 1 hiểu flow; vòng 2 không cầm script, present <=10 phút, demo <=15 phút |
| Chuẩn bị cửa sổ | TV1 | Trước lượt | Slide, ReadyAPI, terminal API, Excel, editor mở sẵn; phóng chữ đủ lớn |
| Chuẩn bị evaluation | TV3 | Trước lượt | Điền tên nhóm; chưa ghi điểm, câu hỏi hoặc kết quả chưa xảy ra |

Bộ project hiện dùng Groovy steps. Rehearsal phải xác nhận vị trí nút Run và log trên phiên bản ReadyAPI thực tế; giao diện có thể khác nhau giữa phiên bản. Không hứa demo DataSource/Property Transfer GUI nếu chưa dựng và chạy thử.

### File cần mở sẵn

1. testing/VIPSportCenter-readyapi-project.xml trong ReadyAPI.
2. VIPSportCenter_ReadyAPI_TestCases_Corrected.xlsx: Test Cases, Results và Defects.
3. testing/groovy/TC-AUTH-06.groovy hoặc step Groovy tương ứng.
4. backend/routes/api.php.
5. backend/app/Http/Controllers/Coach/DashboardController.php.
6. testing/reports/report.html: bằng chứng HTTP trước đây, chỉ dùng khi giải thích nguồn kết quả.
7. Evaluation.md để ghi sau khi trình bày.

### Khởi động API lab

Mở PowerShell:

~~~powershell
cd "D:\Semester 5\SWT301\SWT301 LAB2\SportCenter.Testing\testing"
node run-tests.mjs --managed --serve
~~~

Terminal in URL dạng:

~~~text
ReadyAPI baseUrl: http://127.0.0.1:<port>/api
~~~

Copy đúng URL được in vào Project Properties > baseUrl trong ReadyAPI. Port được chọn động; không mặc định giữ 8000. Giữ terminal mở suốt demo.

Trong ReadyAPI, import VIPSportCenter-readyapi-project.xml; xác nhận đủ 8 suites và 33 case. Project properties dùng credential seed: admin@sportcenter.ma / Admin@1234; karim@sportcenter.ma / Coach@1234; client yassine.amrani@gmail.com / Client@1234.

Đây là demo API nên không cần chạy React frontend. Frontend Vite hiện proxy sang port 8000; nếu mở frontend với backend ở port động, phải chuẩn bị cấu hình phù hợp trước buổi. Không thêm bước UI chưa chạy thử vào script chính.

## 6. Script demo trực tiếp — How

Nguyên tắc mỗi lần Run: **nói expected → bấm Run → chỉ actual → giải thích assertion**. Không đọc hàng trăm dòng Groovy. Chỉ phóng đúng phần fixture, method/endpoint và assertion cần nói.

### Kịch bản 1 — Client đăng ký, dùng token và bị giới hạn quyền

**What:** kiểm tra hành trình account cùng authentication/authorization.  
**Who:** TV1 thao tác và nói.  
**When:** demo 00:00–04:30.  
**Precondition:** API managed đang chạy, baseUrl đúng, account seed tồn tại.  
**Test case:** TC-AUTH-06, TC-AUTH-08, TC-AUTH-09, TC-ROLE-01, TC-ROLE-02.

| Mốc demo | Thao tác cụ thể | Lời nói / điểm cần chỉ | Expected và bằng chứng |
|---|---|---|---|
| 00:00–00:30 | Chỉ ReadyAPI project, baseUrl và terminal API đang mở | “Đây là request chạy vào API local đang hoạt động.” | Project đúng 33 case; URL trùng terminal |
| 00:30–01:40 | Authentication → TC-AUTH-06 → mở Groovy step → Run case | “Register phải 201, role client, có token. Gói 3600 có 3 kỳ; card trả 1200, còn 2400.” | Case Pass; log POST /register 201, /me 200, /client/paiements 200; chỉ assertion 3/1200/2400 |
| 01:40–02:10 | Run TC-AUTH-08 | “Profile trả về phải là client có token hợp lệ.” | /me 200; role client; profile.id không rỗng |
| 02:10–03:00 | Run TC-AUTH-09 | “Token riêng được cấp, logout thành công rồi dùng lại phải 401.” | Log login 200 → logout 200 → /me 401; case Pass |
| 03:00–03:40 | Role → Run TC-ROLE-01 | “Client đã xác thực nhưng không có quyền admin.” | GET /admin/clients 403; case Pass |
| 03:40–04:10 | Run TC-ROLE-02 | “Không token là chưa xác thực, nên khác với sai role.” | GET /admin/clients 401; case Pass |
| 04:10–04:30 | Chốt và chuyển TV2 | “401 nói về xác thực; 403 nói về quyền. Assertion mới giúp phân biệt đúng.” | Kết thúc trong 4 phút 30 giây |

Mỗi case độc lập. TC-AUTH-08/09 dùng client seed và token riêng; không phải giữ cùng account vừa register ở TC-AUTH-06. Account register QA được cleanup sau case. Khi giải thích flow, nói rõ đây là các tình huống của cùng chức năng, không khẳng định mọi case đang dùng một client liên tục.

**Nếu còn thời gian do chạy nhanh:** giải thích log cleanup; không tự thêm lock case làm lệch timeline.

### Kịch bản 2 — Admin tạo client, ghi payment và chặn thanh toán trùng

**What:** chứng minh quy tắc nghiệp vụ và state, không chỉ request thành công.  
**Who:** TV2 thao tác và nói.  
**When:** demo 04:30–10:00.  
**Precondition:** account admin/coach seed; mỗi case tự tạo client QA riêng.  
**Test case:** TC-ADMIN-CLIENT-03, TC-PAIEMENT-02, TC-PAIEMENT-03, TC-PAIEMENT-04.

| Mốc demo | Thao tác cụ thể | Lời nói / điểm cần chỉ | Expected và bằng chứng |
|---|---|---|---|
| 04:30–05:00 | Mở Excel Request Steps, lọc các ID trên | “Có tạo dữ liệu, ghi payment, đọc lại state và negative case.” | Chỉ 4 case; không cuộn toàn workbook |
| 05:00–06:00 | Admin - Client → Run TC-ADMIN-CLIENT-03 | “Client được gắn coach có thật. ID trả về dùng để đọc lại, không hard-code.” | POST 201, GET detail 200; 3 echeances |
| 06:00–07:40 | Payment → Run TC-PAIEMENT-02; chỉ setup paymentClient và 2 request chính | “Case tạo client QA, lấy echeanceId/amount, ghi payment rồi đọc lại kỳ hạn.” | POST /admin/paiements 201; detail 200; statut paye, paiement.id tồn tại |
| 07:40–08:50 | Run TC-PAIEMENT-03; chỉ fixture payInstallment và request duplicate | “Case này tự trả kỳ hạn trước, rồi thử trả lần hai. Expected là 422.” | Setup payment 201; request chính 422; message already paid; case Pass |
| 08:50–09:25 | Run TC-PAIEMENT-04 | “Stats cần đủ trường số tiền và phân loại phương thức.” | 200; 3 total không âm; par_methode là array |
| 09:25–10:00 | Chỉ cleanup/finally, chuyển TV3 | “Dữ liệu và token được chuẩn bị riêng. Soft delete không xóa mọi payment/cotisation khỏi DB.” | Case không phụ thuộc thứ tự; nói đúng giới hạn cleanup |

TC-PAIEMENT-03 không dùng echeanceId từ TC-PAIEMENT-02; fixture riêng giúp chạy từng case hoặc thay đổi thứ tự. Case thứ ba chứng minh “đã trả thì không trả trùng”, không kiểm thử đồng thời hai request hoặc đối soát ngân hàng.

**Câu chốt:** “Nếu POST trả 201 mà kỳ hạn vẫn en_attente, case payment vẫn phải Fail. Đó là khác biệt giữa kiểm tra HTTP và kiểm tra nghiệp vụ.”

### Kịch bản 3 — Dùng test Fail để tìm điểm không khớp requirement/code

**What:** tái hiện BUG-001 và giải thích expected/actual.  
**Who:** TV3 thao tác và nói.  
**When:** demo 10:00–12:00.  
**Precondition:** admin seed không có Coach profile; chưa sửa application.  
**Test case:** TC-ROLE-03.

| Mốc demo | Thao tác cụ thể | Lời nói / điểm cần chỉ | Expected và bằng chứng |
|---|---|---|---|
| 10:00–10:25 | Mở Excel Defects/TC-ROLE-03 | “Theo test plan, admin được phép gọi coach dashboard; expected 200.” | Expected được nêu trước chạy |
| 10:25–10:55 | ReadyAPI Role → Run TC-ROLE-03 | “Actual là 404, vì vậy case phải Fail.” | Log GET /coach/dashboard 404; assertion expected 200 |
| 10:55–11:35 | Editor: routes/api.php rồi Coach/DashboardController.php | “Role cho phép admin, nhưng controller tìm Coach theo user_id admin và firstOrFail.” | Chỉ 1 dòng middleware và 1 dòng query; không đọc cả file |
| 11:35–12:00 | Quay Defects, chỉ hướng xử lý | “Cần xác định admin xem coach nào rồi sửa code/requirement phù hợp; không đổi expected chỉ để xanh.” | BUG-001, severity Medium; chưa sửa application |

Nêu đây là sự khác biệt với expectation của test plan. Việc admin có thực sự phải nhận dashboard của một coach cụ thể cần xác nhận nghiệp vụ; một middleware cho phép role chưa xác định đầy đủ dữ liệu phải trả.

### Chạy suite và đánh giá live

**Who:** TV3. **When:** demo 12:00–15:00.

1. **12:00–12:20:** chọn project Functional Tests, nhắc đủ 33 case và chạy tuần tự. Chỉ rõ GUI đang thực thi, không mở một report cũ rồi nói vừa chạy.
2. **12:20–13:30:** bấm Run project/test suites. Trong lúc chạy, giải thích case có setup/cleanup; nhắc SLA 2000ms áp dụng từng request chính, không phải thời gian của toàn case.
3. **13:30–14:00:** đọc số liệu thực tế trên GUI. Nếu đúng 32 Pass/1 Fail, nói “kết quả live khớp rehearsal”. Nếu khác, đọc đúng số và chỉ failure; không ép số về kết quả đã lưu.
4. **14:00–14:25:** đối chiếu Excel Results: HTTP/Groovy là các cột kiểm chứng trước đây; ReadyAPI GUI điền bằng kết quả hôm trình bày.
5. **14:25–14:45:** nói phạm vi còn thiếu: chưa cover toàn bộ 41 route, chưa full security scan/load test; ví dụ reset password, resource, PDF chưa nằm trong bộ 33.
6. **14:45–15:00:** “Nhóm đã trình bày cách thiết kế, chạy và đọc kết quả. Phần đóng góp và đánh giá chéo được ghi trong Evaluation. Chúng em xin nhận câu hỏi.”

Trước buổi phải đo việc chạy toàn project có nằm trong 90 giây không. Nếu không, bắt đầu chạy toàn suite ngay sau kịch bản 3 và rút phần đọc report trong khung 2 phút; có thể dùng tối đa 1 phút dự phòng được lớp cho phép. Nếu vẫn không hoàn tất, báo số case đã chạy và nói rõ run chưa hoàn thành, không gọi kết quả partial là full regression.

## 7. Xử lý tình huống khi demo

| Tình huống | Cách xử lý trực tiếp | Cách nói trung thực |
|---|---|---|
| API không kết nối | Kiểm tra terminal API và copy lại đúng baseUrl/port | “Nhóm đang kiểm tra kết nối môi trường trước khi kết luận về API.” |
| Credential/login setup lỗi | Đối chiếu Project Properties với account seed; không login sai admin nhiều lần | “Case bị Blocked ở setup, chưa chứng minh business request Fail.” |
| SLA Fail khi máy chậm | Đọc ms thật, giữ ngưỡng đã công bố; nếu đổi SLA phải nói lý do và ghi lần chạy lại | “Request vượt ngưỡng local; chưa đủ bằng chứng kết luận production chậm.” |
| TC-ROLE-03 Fail | Mở source và defect như kịch bản | “Đây là defect/expectation mismatch cần được ghi nhận.” |
| Case khác Fail | Đọc HTTP status/assertion, ghi actual và xem setup/state | “Kết quả live khác rehearsal; nhóm ghi nhận và sẽ tái hiện.” |
| ReadyAPI license/GUI không chạy | Chỉ dùng phương án dự phòng live bên dưới và nói giới hạn; không xem là hoàn tất demo tool | “Đây là runner kiểm chứng API; phần demo ReadyAPI còn thiếu.” |
| Chậm timeline | Dừng thao tác lặp lại, bỏ mở code dài; giữ hai kịch bản chính và phần defect | “Nhóm chuyển thẳng sang bằng chứng và kết quả.” |

Dự phòng live, không dùng video:

~~~powershell
node run-tests.mjs --managed --case TC-AUTH-06 --report-dir reports-demo-auth
node run-tests.mjs --managed --case TC-PAIEMENT-03 --report-dir reports-demo-payment
node run-tests.mjs --managed --report-dir reports-demo-full
~~~

Dự phòng Node là bằng chứng API thật nhưng không thay thế đầy đủ yêu cầu giới thiệu thao tác ReadyAPI. Nếu GUI không thể chạy, phải ghi phần này trong Evaluation và trao đổi với giảng viên.

## 8. Script Q&A — 10 phút

TV1 điều phối câu hỏi; giao cho người phụ trách câu trả lời đầu. Người khác bổ sung một ý khi cần. Mỗi câu trả lời khoảng 30–60 giây; hỏi lại nếu câu hỏi chưa rõ. Không đọc từ Evaluation khi đang trả lời.

| Câu hỏi dự kiến | Người chính | Câu trả lời ngắn |
|---|---|---|
| ReadyAPI và SportCenter khác nhau thế nào? | TV1 | ReadyAPI là công cụ test; SportCenter là hệ thống có API được test. |
| Ai tạo ra ReadyAPI? | TV1 | SmartBear phát triển/cung cấp ReadyAPI; SoapUI có nguồn gốc từ Ole Lensmar. |
| Khi nào nên dùng? | TV1 | Khi cần kịch bản API có assertion, dữ liệu và regression lặp lại; hữu ích khi UI chưa hoàn tất. |
| Công cụ có miễn phí không? | TV1 | ReadyAPI là sản phẩm thương mại, trial/module tùy license; SoapUI Open Source là lựa chọn khác với tập tính năng khác. |
| Tại sao không chỉ gửi request thủ công? | TV2 | Một request không chứng minh cả flow. Suite kiểm tra token, state và negative case rồi lặp lại có kết quả. |
| 401 khác 403 ra sao? | TV2 | 401 là thiếu/không hợp lệ xác thực; 403 là đã xác thực nhưng role không đủ quyền. |
| Token là JWT đúng không? | TV2 | Code dùng Sanctum personal access token; dùng Bearer header không đồng nghĩa JWT. |
| 5 lần sai password đã trả 423 chưa? | TV2 | Lần sai thứ 5 trả 401 và đặt lock; request thứ 6 trả 423. Test dùng user QA riêng. |
| HTTP 201 payment đã đủ Pass chưa? | TV2 | Chưa. Đọc lại kỳ hạn phải paye và có payment; duplicate phải 422. |
| Case có phụ thuộc thứ tự không? | TV2 | Các fixture tạo riêng, UUID và ID động; token riêng và cleanup finally. |
| Vì sao giữ một case Fail? | TV3 | Để thể hiện expected/actual khác nhau và ghi defect. 100% xanh bằng cách đổi expected không chứng minh chất lượng. |
| Có thể expected 404 mới đúng không? | TV3 | Có thể nếu requirement định nghĩa vậy. Hiện case giữ expected 200 từ test plan; cần thống nhất admin xem dữ liệu nào rồi cập nhật requirement/code. |
| 32/33 chứng minh full coverage không? | TV3 | Không. Chỉ là Pass rate của bộ đã chọn; phải map requirement/endpoint và bổ sung thiếu để đánh giá coverage. |
| SQL injection case 422 có chứng minh DB an toàn không? | TV3 | Không. Chỉ chứng minh payload đó bị email validation chặn và không lộ debug response; chưa full scan. |
| SLA 2 giây có phải load test? | TV2 | Không. Đây là assertion trên request local; chưa tạo tải đồng thời hoặc phân tích percentile. |
| Report có phải của ReadyAPI GUI? | TV3 | Report hiện lưu là HTTP/Groovy. GUI phải đọc run trực tiếp và ghi riêng, không đổi nhãn nguồn evidence. |
| Nhóm có làm DataSource/Property Transfer GUI không? | TV2 | Bản hiện tại chuyển token và tạo data bằng Groovy. Chưa dựng các step GUI riêng; nhóm phân biệt capability của tool và implementation của lab. |
| Đóng góp từng người chứng minh thế nào? | Cả nhóm | Mỗi người nêu task thực tế, file/evidence hoặc rehearsal đã làm; bảng Evaluation ghi planned và actual riêng. |

Sau Q&A, điền câu hỏi thật và câu trả lời thật vào Evaluation. Bảng trên là đáp án luyện tập, không phải bằng chứng nhóm đã trả lời những câu đó trong lớp.

## 9. Ghi nhận công việc và đánh giá chéo

Quy trình nhóm đề xuất:

1. Đọc requirement và source → thống nhất scope.
2. Chỉnh test plan → viết case/automation.
3. Chạy trên DB riêng → lưu actual, log và defect.
4. Peer review testcase, assertion và cleanup.
5. Rehearsal ReadyAPI → đo thời gian và chia lời nói.
6. Trình bày live → hỏi đáp → ghi evaluation.
7. Tổng hợp feedback → xác nhận requirement/defect → lên task tiếp theo.

Ghi công việc bằng task ID, người chính, người review, due date, actual status và bằng chứng. Chỉ ghi Done khi người đó thực sự thực hiện/review và có minh chứng; bộ file đã được chuẩn bị với hỗ trợ công cụ nên không tự gán tác giả toàn bộ code cho một thành viên.

Chi tiết biểu mẫu và rubric nằm ở [Evaluation.md](Evaluation.md).

## 10. Cách tập để không đọc tài liệu

Mỗi người nhớ 3–5 từ khóa cho phần của mình. Ví dụ:

- TV1: “API — SmartBear — 2005/2014 — QA — demo auth”.
- TV2: “HTTP — middleware — fixture — state — payment”.
- TV3: “business — expected/actual — 32/33 — BUG-001 — evaluation”.

Tập theo màn hình app: nhìn tên case, nói expected bằng lời của mình, chạy, rồi giải thích log. Khi quên một câu, quay về câu hỏi “đang test gì, ai làm, khi nào cần và kiểm tra bằng cách nào?”, không đọc nguyên script.

## 11. Nguồn tham khảo và evidence

Nguồn nhà cung cấp dùng cho thông tin tool:

- [SoapUI release history](https://www.soapui.org/docs/downloads/release-history/) — Ole Lensmar và bản 1.0 ngày 16/10/2005.
- [SmartBear Ready! API, năm 2014](https://smartbear.com/blog/api-readiness-do-you-have-what-you-need/) — lịch sử giới thiệu họ công cụ.
- [ReadyAPI documentation](https://support.smartbear.com/readyapi/) — định hướng/tính năng.
- [ReadyAPI/SoapUI integration documentation](https://support.smartbear.com/qacomplete/docs/other-tools/readyapi-and-soapui.html) — API functional/security testing.
- [Groovy scripting samples](https://support.smartbear.com/readyapi/docs/en/test-apis-with-readyapi/scripting/groovy-scripting-samples.html) — scripting.
- [SoapUI TestSteps](https://www.soapui.org/docs/functional-testing/working-with-teststeps/) — các step và script.
- [SmartBear license types](https://support.smartbear.com/administration/docs/en/smartbear-license-management/about/license-types.html) — license/trial.
- [VirtServer / ReadyAPI Virtualization](https://support.smartbear.com/virtserver/docs/en/about.html) — virtualization và license.

Evidence của bài lab:

- [README hướng dẫn chạy](testing/README.md).
- [Excel testcase](VIPSportCenter_ReadyAPI_TestCases_Corrected.xlsx).
- [Project ReadyAPI](testing/VIPSportCenter-readyapi-project.xml).
- [Case definitions](testing/cases.mjs).
- [HTTP results](testing/reports/results.json).
- [Groovy results](testing/reports-groovy/results.json).
- [HTTP report HTML](testing/reports/report.html).
- [Controller liên quan BUG-001](backend/app/Http/Controllers/Coach/DashboardController.php).
- [Evaluation](Evaluation.md).

Số liệu evidence đã kiểm tra lúc soạn: HTTP timestamp 2026-10-03T19:41:32.154Z; Groovy timestamp 2026-10-03T19:55:46.645Z. Cả hai là ngày 04/10/2026 theo giờ Việt Nam/Thái Lan (UTC+7). ReadyAPI GUI chưa có kết quả được ghi nhận.

## 12. Bổ sung Nonfunctional — 05/10/2026

Phần tính năng/chưa thực hiện ở slide 7 nói về demo functional ban đầu. Nay đã có bounded performance và targeted security regression bằng script, nhưng **chưa có kết quả ReadyAPI Desktop/native Performance/Security Test UI**. Cập nhật lời nói khi chọn demo NFR; không nhận đây là full load benchmark/pentest.

**Nội dung chiếu bổ sung (thay slide 9 hoặc 10, không tăng số slide):**

- 33 Functional + 6 Performance + 11 Security
- p95 • throughput • error rate
- Ownership write: kiểm tra cả state
- Lab targets ≠ production SLA

**Lời nói 45–60 giây:** “Nhóm bổ sung baseline, tải đồng thời nhỏ, mixed roles, spike/recovery và short soak. Các chỉ số là latency p50/p95/p99, throughput và lỗi. Đây là mục tiêu đề xuất cho máy lab, không chứng minh năng lực production vì dùng PHP dev server/SQLite. Security test không chỉ kiểm tra HTTP: test coach sửa session coach khác đọc lại dữ liệu để biết thay đổi có lưu hay không. Bộ mới cũng kiểm tra token, role injection, secret leak, enumeration và rate limiting.”

**Lựa chọn demo NFR trong cùng khung 15 phút:**

| Khoảng giờ buổi | Who | How | What cần chứng minh |
|---|---|---|---|
| 10:00–14:30 | TV1 | Giữ kịch bản1 register/token/role | Positive + access denied |
| 14:30–20:00 | TV2 | Giữ kịch bản2 payment/duplicate | Business correctness |
| 20:00–21:15 | TV3 | NFR Performance → PERF-01; chỉ metrics log | Warmup excluded; p95<=500ms; HTTP200 + payload; lab only |
| 21:15–23:15 | TV3 | NFR Security → SEC-07; xem observations và source marquerRealisee | Foreign write expected403/404; actual200, persisted=true; Fail có ý nghĩa |
| 23:15–24:00 | TV1 | SEC-10 hoặc chỉ Findings đã lưu, phân biệt report với live | Message phân biệt email; policy đề xuất |
| 24:00–25:00 | TV2/TV3 | Chốt limitation + contribution + Q&A | Không cộng full suite 50 vào cuối khi không đủ thời gian |

Không thay test bằng video. Nếu dùng report đã lưu, nói rõ “kết quả đã chạy” và vẫn thực thi ít nhất hai scenario live. Native ReadyAPI load/security UI nếu muốn thêm phải tập riêng với license/bản cài; mã hiện tại là Groovy Script step trong Functional Tests.

**Pre-demo:** bật managed API như mục5, import XML50 hoặc NFR-only17, đặt baseUrl động và `nfrLabOnly=true` sau khi xác nhận DB riêng. Đóng Node performance run khác để không gây nhiễu. Chạy PERF-01 và SEC-07 trước ngày trình bày để đo thời gian thực tế; không đổi threshold/expected cho xanh.

**Câu hỏi NFR cần thuộc:**

- “p95 là gì?” → Giá trị nearest-rank mà khoảng95% mẫu không vượt qua; báo cả max/errors, không chỉ average.
- “5 worker là backend5 luồng?” → Không. Đó là concurrency từ client; PHP dev server có thể xếp hàng single-worker.
- “Vì sao rate-limit test Fail?” → Có25 login sai cho email không tồn tại mà chưa429; đây là policy LAB đề xuất, còn cần team xác nhận.
- “Security scan đầy đủ chưa?” → Chưa. Đây là11 targeted probes; TLS/browser/large load/full OWASP/native GUI còn ngoài phạm vi.

File: [NFR README](testing/nfr/README.md), [NFR Findings](testing/nfr/NFR_Findings.md), [NFR case definitions](testing/nfr/nfr-cases.mjs), [NFR Node results](testing/nfr/reports/results.json), [NFR Groovy results](testing/nfr/reports-groovy/results.json).
