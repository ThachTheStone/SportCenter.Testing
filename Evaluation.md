# Evaluation — ReadyAPI / VIP Sport Center

Môn: SWT301 — LAB2. Ngày tạo biểu mẫu: 04/10/2026. Nhóm trình bày: [Điền tên nhóm]. Lớp: [Điền lớp]. Ngày trình bày: [Chưa xác định].

Tài liệu đi cùng [Presentation_Script.md](Presentation_Script.md). File này ghi đánh giá chéo, câu hỏi/câu trả lời thực tế và đóng góp. Các bảng chưa có dữ liệu phải điền sau khi hoạt động xảy ra; không xem đáp án gợi ý là bằng chứng nhóm đã trả lời trong lớp.

## 1. Thành viên và vai trò

Phân vai dưới đây là đề xuất cho 3 người, chưa xác nhận tên hay đóng góp thực tế.

| Thành viên | Họ tên / MSSV | Vai trò đề xuất | Phần phải trình bày | Phần demo | Người review phần này |
|---|---|---|---|---|---|
| TV1 | [Điền] | Overview / điều phối | Slide 1–4, 11 | Register, token, logout, role | TV2 |
| TV2 | [Điền] | Architecture / automation | Slide 5–7 | Client và payment | TV3 |
| TV3 | [Điền] | Nghiệp vụ / chất lượng | Slide 8–10 | Defect, regression, report | TV1 |

Nếu nhóm có hơn 3 thành viên, thêm dòng và chia phần có nội dung thực chất. Mỗi thành viên phải có ít nhất một lượt nói; ghi actual ở mục 7.

## 2. Thông tin kiểm thử đã có evidence

Đây là trạng thái artifact lúc tạo file, không phải kết quả buổi trình bày.

| Mục | Kết quả có evidence | Nguồn |
|---|---|---|
| Application | SportCenter.Testing, commit a0648e3 | Repo local / Git |
| Test plan mới | 33 case / 8 suites | [Workbook](VIPSportCenter_ReadyAPI_TestCases_Corrected.xlsx) |
| HTTP integration | 32 Pass, 1 Fail, 0 Blocked | [results.json](testing/reports/results.json) |
| Groovy script integration | 32 Pass, 1 Fail, 0 Blocked | [Groovy results](testing/reports-groovy/results.json) |
| Case Fail | TC-ROLE-03, BUG-001 | Workbook Defects / report |
| Expected / actual | Admin GET /coach/dashboard: 200 / 404 | Route và controller |
| ReadyAPI Desktop GUI | Not run / chưa ghi nhận | Không gán kết quả HTTP cho GUI |
| Frontend testing | Ngoài phạm vi bộ 33 case | Scope REST API |
| Load test / full security scan | Chưa thực hiện | Chỉ có SLA và functional negative cases |

32 / 33 ≈ 96,97% là Pass rate của bộ case đã chạy. Không suy ra endpoint coverage, code coverage hoặc “API an toàn 96,97%”.

## 3. Ghi nhận task của từng người — What / Who / When / How

### 3.1. Task plan

Các task dưới đây chưa tự động được xem là Done. Người nhận phải thực sự thực hiện hoặc review, điền ngày, evidence và kết quả.

| ID | What — Task | Who — Người chính | Người review | When — Hạn đề xuất | How — Tiêu chí hoàn thành | Actual status |
|---|---|---|---|---|---|---|
| T01 | Kiểm chứng overview, tác giả và lịch sử tool | TV1 | TV3 | Trước rehearsal 1 | Nguồn SmartBear/SoapUI; nói được 2005/2014; không nhầm tác giả | Chưa xác nhận |
| T02 | Kiểm tra ReadyAPI/license/import | TV1 | TV2 | Tối trước demo | App mở được; project có 33 case; chụp evidence rehearsal thật | Chưa xác nhận |
| T03 | Review architecture/API/auth | TV2 | TV1 | Trước rehearsal 1 | Giải thích HTTP → middleware → controller → DB; Sanctum đúng | Chưa xác nhận |
| T04 | Review test data/setup/cleanup | TV2 | TV3 | Trước rehearsal 1 | Hiểu UUID, ID động, token riêng và giới hạn soft-delete | Chưa xác nhận |
| T05 | Review case nghiệp vụ payment | TV3 | TV2 | Trước rehearsal 1 | Giải thích en_attente → paye, duplicate 422, số tiền 1200/2400 | Chưa xác nhận |
| T06 | Review workbook và assertion | TV2 | TV3 | Trước rehearsal 1 | Đủ 33 ID, body hợp lệ, expected/actual và GUI tách riêng | Chưa xác nhận |
| T07 | Reproduce BUG-001 | TV3 | TV1 | Trước rehearsal 2 | Có log 404; chỉ route và query; hướng xử lý requirement rõ | Chưa xác nhận |
| T08 | Chạy toàn bộ trong ReadyAPI GUI | TV2 | TV3 | Tối trước demo | Ghi số actual, version, thời gian, evidence; không dùng report Node thay GUI | Chưa xác nhận |
| T09 | Làm slide ngắn từ script | TV1 | TV2 + TV3 | Trước rehearsal 2 | Mỗi slide <=4 ý; không dán nguyên lời nói | Chưa xác nhận |
| T10 | Rehearsal không cầm tài liệu | Cả nhóm | Review chéo | Ít nhất 2 vòng trước buổi | Present 10 phút, demo 15 phút; mọi người đều nói | Chưa xác nhận |
| T11 | Trình bày và demo trực tiếp | Cả nhóm | Nhóm bạn / giảng viên | Ngày trình bày | Ít nhất 2 kịch bản live; ghi expected/actual và số liệu thật | Chưa xác nhận |
| T12 | Ghi Q&A, đánh giá chéo và cải tiến | TV3 điều phối, cả nhóm xác nhận | Cả nhóm | Sau Q&A | Câu hỏi/câu trả lời thật, reviewer, điểm có lý do, action item | Chưa xác nhận |

### 3.2. Actual contribution log

Ghi riêng việc “viết”, “chỉnh”, “review”, “chạy”, “trình bày”. Các file trước đây đã được chuẩn bị với hỗ trợ công cụ; không tự gán toàn bộ code cho một người chỉ vì người đó nói phần code.

| ID / ngày | Thành viên | Việc thực sự đã làm | Loại đóng góp | File / commit / ảnh / run evidence | Người xác nhận | Thời lượng hoặc mức độ |
|---|---|---|---|---|---|---|
| [Điền] | [Điền] | [Điền] | [Viết/Chỉnh/Review/Run/Present] | [Link hoặc đường dẫn] | [Điền] | [Điền] |
| [Điền] | [Điền] | [Điền] | [Điền] | [Điền] | [Điền] | [Điền] |
| [Điền] | [Điền] | [Điền] | [Điền] | [Điền] | [Điền] | [Điền] |
| [Điền] | [Điền] | [Điền] | [Điền] | [Điền] | [Điền] | [Điền] |

### 3.3. Peer review trong nhóm

| Thành viên được review | Người review | Điểm làm tốt có evidence | Nội dung cần sửa | Task tiếp theo | Người được review xác nhận |
|---|---|---|---|---|---|
| TV1 / [Tên] | TV2 / [Tên] | [Chưa ghi] | [Chưa ghi] | [Chưa ghi] | [Chưa xác nhận] |
| TV2 / [Tên] | TV3 / [Tên] | [Chưa ghi] | [Chưa ghi] | [Chưa ghi] | [Chưa xác nhận] |
| TV3 / [Tên] | TV1 / [Tên] | [Chưa ghi] | [Chưa ghi] | [Chưa ghi] | [Chưa xác nhận] |

## 4. Quy trình đã thực hiện

Điền thời gian thực tế và evidence; quy trình đề xuất không đồng nghĩa đã hoàn thành.

| Bước | Đầu vào | Hoạt động | Đầu ra cần có | Ngày / trạng thái thực tế | Evidence |
|---|---|---|---|---|---|
| 1. Xác định phạm vi | Đề lab, repo | Chọn REST API và business rules | Scope, actor, requirement | [Điền] | [Điền] |
| 2. Đọc project | Route/controller/model/seed | Đối chiếu auth, role và data | Architecture + API inventory | [Điền] | [Điền] |
| 3. Thiết kế test | Workbook gốc | Sửa dữ liệu/expected; chuẩn bị negative/boundary | 33 corrected case | [Điền] | [Điền] |
| 4. Automation | Test case và fixture | Viết/review request, assertion, cleanup | XML/Groovy/runner | [Điền] | [Điền] |
| 5. Run và defect | Backend lab | Chạy HTTP/Groovy/GUI, phân biệt nguồn | Report + BUG-001 | [Điền] | [Điền] |
| 6. Rehearsal | Slide/script/app | Chia lượt nói, đo thời gian | Biên bản rehearsal | [Điền] | [Điền] |
| 7. Present/demo | App đang chạy | Ít nhất 2 kịch bản live | Actual GUI / feedback | [Điền] | [Điền] |
| 8. Evaluate/improve | Q&A/đánh giá | Review chéo, xác nhận task mới | Evaluation + action list | [Điền] | [Điền] |

## 5. Rubric đánh giá chéo giữa các team

Đây là thang điểm đề xuất của nhóm, không khẳng định là rubric chính thức của giảng viên. Có thể thay trọng số theo yêu cầu lớp trước khi đánh giá.

| Tiêu chí | Điểm tối đa | Bằng chứng cần quan sát |
|---|---:|---|
| Overview: What/Who/When | 15 | Nêu đúng tool, mục đích, nhà phát triển, lịch sử và đối tượng sử dụng |
| Architecture, điểm mạnh/yếu/điểm sáng | 10 | Giải thích luồng request và giới hạn, không chỉ đọc tên công nghệ |
| Feature và nghiệp vụ | 15 | Nói được quy tắc cụ thể, actor, state và giá trị cần kiểm tra |
| Test design/automation | 20 | Precondition, data, assertion, negative case, cleanup và expected đúng |
| Demo trực tiếp | 20 | Ít nhất 2 kịch bản có hành động live và bằng chứng; không dùng video |
| Q&A | 10 | Câu trả lời đúng, có lý do/evidence và biết thừa nhận chưa xác minh |
| Quy trình/đóng góp/trình bày | 10 | Mọi người đều nói; task thật có evidence; đúng thời gian; slide không bị đọc |
| Tổng | 100 | Không chấm bằng tỷ lệ Pass đơn thuần |

Chấm theo mức đạt của từng tiêu chí, kèm lý do. Một case Fail được giải thích và tái hiện tốt có thể chứng minh năng lực test. Phân biệt lỗi môi trường demo, lỗi application và câu trả lời sai; không gộp chúng thành một lỗi.

### 5.1. Team mình đánh giá team khác

Tạo một bảng cho mỗi team được đánh giá.

- Nhóm được đánh giá: [Điền].
- Tool / project: [Điền].
- Reviewer nhóm mình: [Điền].
- Ngày: [Điền].

| Tiêu chí | Max | Điểm thực tế | Lý do + evidence cụ thể |
|---|---:|---|---|
| Overview | 15 | [Chưa chấm] | [Điền] |
| Architecture | 10 | [Chưa chấm] | [Điền] |
| Features/nghiệp vụ | 15 | [Chưa chấm] | [Điền] |
| Test design/automation | 20 | [Chưa chấm] | [Điền] |
| Demo live | 20 | [Chưa chấm] | [Điền] |
| Q&A | 10 | [Chưa chấm] | [Điền] |
| Quy trình/đóng góp | 10 | [Chưa chấm] | [Điền] |
| Tổng | 100 | [Chưa chấm] | [Điền] |

**Nhận xét cần ghi:** một điểm mạnh, một điểm cần cải thiện và một đề xuất kiểm thử tiếp theo có thể làm được.

### 5.2. Team khác đánh giá team mình

- Nhóm reviewer: [Điền].
- Người reviewer: [Điền].
- Ngày: [Điền].

| Nội dung reviewer phản hồi | Điểm / mức đánh giá | Evidence reviewer chỉ ra | Nhóm mình phản hồi / xác nhận | Action |
|---|---|---|---|---|
| [Chưa ghi] | [Chưa chấm] | [Chưa ghi] | [Chưa ghi] | [Chưa ghi] |
| [Chưa ghi] | [Chưa chấm] | [Chưa ghi] | [Chưa ghi] | [Chưa ghi] |

Nếu không đồng ý với đánh giá, đối chiếu requirement hoặc log cụ thể rồi ghi lý do; không tự sửa lời nhận xét của nhóm khác thành lời nhóm mình.

## 6. Q&A thực tế giữa các team

### 6.1. Team khác hỏi, team mình trả lời

Ghi câu hỏi thật và ý trả lời thật. Không điền trước câu trả lời từ ngân hàng luyện tập.

| Q ID | Team/người hỏi | Câu hỏi thực tế | Thành viên trả lời | Ý trả lời thực tế | Đánh giá: đúng/một phần/chưa trả lời | Evidence / bổ sung sau |
|---|---|---|---|---|---|---|
| Q01 | [Điền] | [Sau buổi] | [Điền] | [Sau buổi] | [Chưa đánh giá] | [Điền] |
| Q02 | [Điền] | [Sau buổi] | [Điền] | [Sau buổi] | [Chưa đánh giá] | [Điền] |
| Q03 | [Điền] | [Sau buổi] | [Điền] | [Sau buổi] | [Chưa đánh giá] | [Điền] |
| Q04 | [Điền] | [Sau buổi] | [Điền] | [Sau buổi] | [Chưa đánh giá] | [Điền] |
| Q05 | [Điền] | [Sau buổi] | [Điền] | [Sau buổi] | [Chưa đánh giá] | [Điền] |

Tổng số câu thực nhận: [Điền]. Trả lời đúng: [Điền]. Một phần: [Điền]. Chưa trả lời: [Điền]. Reviewer xác nhận: [Điền].

### 6.2. Team mình hỏi, team khác trả lời

| Q ID | Team được hỏi | Người nhóm mình hỏi | Câu hỏi thực tế | Người trả lời | Ý trả lời thực tế | Đánh giá + lý do |
|---|---|---|---|---|---|---|
| P01 | [Điền] | [Điền] | [Sau buổi] | [Điền] | [Sau buổi] | [Chưa đánh giá] |
| P02 | [Điền] | [Điền] | [Sau buổi] | [Điền] | [Sau buổi] | [Chưa đánh giá] |
| P03 | [Điền] | [Điền] | [Sau buổi] | [Điền] | [Sau buổi] | [Chưa đánh giá] |

Chỉ hỏi điều team khác có thể biết hoặc giải thích từ scope họ công bố. Nếu feature ngoài phạm vi, đánh giá khả năng nêu giới hạn thay vì buộc họ phải đã triển khai feature đó.

### 6.3. Ngân hàng câu hỏi và đáp án luyện tập cho team mình

Đây là tài liệu luyện trước, **không phải nhật ký Q&A thực tế**.

| Câu hỏi | Đáp án cần đạt | Ai luyện |
|---|---|---|
| Tool kiểm thử gì? | API request/response và quy tắc có assertion; application là SportCenter | TV1 |
| Ai phát triển tool, nguồn gốc? | ReadyAPI: SmartBear; SoapUI: Ole Lensmar, bản 1.0 năm 2005; Ready! API được giới thiệu năm 2014 | TV1 |
| Đối tượng dùng và thời điểm? | QA/developer; integration/regression khi API và expected đã sẵn sàng | TV1 |
| Bất tiện? | License/module, học setup/Groovy, maintenance và test data state | TV1 |
| Bearer token có phải JWT? | Không suy ra JWT từ header; source này dùng Sanctum personal access token | TV2 |
| 401/403 khác nhau? | Chưa/không hợp lệ xác thực so với đã xác thực nhưng thiếu quyền | TV2 |
| Tại sao fixture riêng? | Tránh khóa seed account, unique collision, ID cũ và phụ thuộc thứ tự | TV2 |
| Sau 5 lần sai password? | Lần sai thứ 5: 401, đặt lock; lần 6: 423 | TV2 |
| Payment 201 đủ chưa? | Phải đọc lại paye và payment.id; duplicate 422 | TV2 |
| Groovy thay Property Transfer GUI không? | Là cách khác thực hiện chức năng chuyển token/ID; nhóm chưa dựng step GUI riêng | TV2 |
| SLA 2 giây là load test? | Không; chỉ threshold request local, chưa có tải đồng thời/percentile | TV2 |
| Vì sao 1 Fail? | TC-ROLE-03 expected 200, actual 404 do thiếu Coach profile cho admin | TV3 |
| Expected có thể sai không? | Có; phải xác nhận requirement. Không đổi expected chỉ để test xanh | TV3 |
| 32/33 nói được gì? | Pass rate trong bộ đã chọn, không phải full coverage hoặc security score | TV3 |
| SQL-like email 422 có chứng minh chống injection đầy đủ? | Không; chỉ input đó bị validation và không lộ debug | TV3 |
| Report nguồn nào? | HTTP/Groovy report đã lưu; GUI cần chạy/ghi riêng | TV3 |
| Chưa test gì? | Ví dụ forgot/reset password, resources, alerts/PDF, full load/security; nói theo scope | TV3 |
| Đóng góp thực tế? | Nêu task mình làm, review/run evidence; không gán việc chưa làm | Tất cả |

### 6.4. Gợi ý hỏi team khác

1. “Requirement nào quyết định expected của case này?”
2. “Nếu HTTP status đúng nhưng dữ liệu response sai, assertion nào bắt được?”
3. “Case có tự tạo data hay phụ thuộc case chạy trước?”
4. “Bạn phân biệt lỗi môi trường với lỗi nghiệp vụ bằng evidence nào?”
5. “Có một negative/boundary case nào bảo vệ business rule?”
6. “Khi API đổi field hoặc role, bạn cập nhật test thế nào?”
7. “Report đang hiển thị là run live hay run trước đây?”
8. “Coverage bạn công bố được tính theo requirement, endpoint hay code?”
9. “Khi một case Fail, bạn có quy trình tái hiện và ghi defect không?”
10. “Mỗi thành viên đã phụ trách phần nào, evidence cụ thể?”

## 7. Biên bản rehearsal và trình bày

### 7.1. Rehearsal

| Lần / ngày | Present actual | Demo actual | Mọi người đều nói? | Có cầm/đọc tài liệu? | Hai kịch bản chạy live? | Điểm cần sửa | Người ghi |
|---|---|---|---|---|---|---|---|
| R1 / [Ngày] | [Chưa đo] | [Chưa đo] | [Chưa xác nhận] | [Chưa xác nhận] | [Chưa xác nhận] | [Điền] | [Điền] |
| R2 / [Ngày] | [Chưa đo] | [Chưa đo] | [Chưa xác nhận] | [Chưa xác nhận] | [Chưa xác nhận] | [Điền] | [Điền] |

Mục tiêu: present 10 phút; demo 15 phút; tổng 25 phút, không vượt 26 phút. Q&A riêng 10 phút.

### 7.2. Trình bày thực tế

- Giờ bắt đầu: [Điền].
- Present: [Điền] phút.
- Demo: [Điền] phút.
- Tổng Present + Demo: [Điền] phút.
- Q&A: [Điền] phút.
- Có dùng video: [Có/Không — yêu cầu Không].
- Kịch bản live đã thực hiện: [Điền].
- Số liệu GUI được đọc tại chỗ: [Điền; nếu chưa chạy đủ ghi Partial].
- File/ảnh/log evidence: [Điền].

| Thành viên | Đã nói phần nào? | Đã thao tác/giải thích demo nào? | Đã trả lời câu nào? | Reviewer xác nhận |
|---|---|---|---|---|
| TV1 / [Tên] | [Chưa ghi] | [Chưa ghi] | [Chưa ghi] | [Chưa xác nhận] |
| TV2 / [Tên] | [Chưa ghi] | [Chưa ghi] | [Chưa ghi] | [Chưa xác nhận] |
| TV3 / [Tên] | [Chưa ghi] | [Chưa ghi] | [Chưa ghi] | [Chưa xác nhận] |

### 7.3. ReadyAPI GUI run thực tế

| Run ID / ngày | ReadyAPI version | Commit / database | Scope | Pass | Fail | Blocked / chưa chạy | Tổng actual | Evidence |
|---|---|---|---|---|---|---|---|---|
| [Điền] | [Điền] | [Điền] | [Full/selected cases] | [Chưa chạy] | [Chưa chạy] | [Chưa chạy] | [Chưa chạy] | [Điền] |

Nếu dùng Node dự phòng, ghi engine là Node ở một dòng riêng. Không ghi vào bảng GUI như đã chạy ReadyAPI.

## 8. Đánh giá chất lượng công việc test

| Câu hỏi đánh giá | Hiện trạng có evidence | Việc cần review/bổ sung |
|---|---|---|
| Scope rõ không? | Functional REST, 33 case/8 suites | Map thêm requirement và route để đo coverage phù hợp |
| Expected có căn cứ không? | Đối chiếu code và test plan; BUG-001 giữ expectation để phản ánh khác biệt | Xác nhận admin coach-dashboard requirement với người phụ trách |
| Data có thể chạy lại không? | UUID, ID động, fixture riêng, managed SQLite mới | Kiểm tra GUI rehearsal và các cấu hình khác như MariaDB nếu cần |
| Có business assertion không? | paye, duplicate 422, total balance, lock, role/ownership | Thêm các luồng nghiệp vụ chưa nằm trong bộ 33 |
| Cleanup đủ không? | finally + soft-delete QA và logout token | Payment/cotisation còn trong DB test; không tuyên bố xóa hoàn toàn |
| Evidence có truy vết không? | TC ID khớp Excel/XML/report, có source defect | Ghi version/date/commit cho GUI run và evaluation |
| Negative case có quá rộng không? | Injection email expected chính xác 422 | Không suy ra full security assurance từ một payload |
| SLA có chứng minh performance không? | Request local <=2000ms | Nếu yêu cầu performance, thiết kế load profile/percentile riêng |
| Chỉ số Pass có gây hiểu nhầm không? | 32/33 trong bộ đã chọn | Tách pass rate khỏi code/endpoint/requirement coverage |
| Có review đóng góp thật không? | Đã có biểu mẫu | Điền actual task, người review và evidence; chưa có điểm cá nhân |

## 9. Defect và action sau đánh giá

### BUG-001

- Test case: TC-ROLE-03.
- Expected hiện tại: HTTP 200 theo test plan admin được phép gọi coach dashboard.
- Actual đã kiểm chứng: HTTP 404.
- Evidence source: [Coach DashboardController](backend/app/Http/Controllers/Coach/DashboardController.php), [API routes](backend/routes/api.php).
- Nguyên nhân quan sát được: middleware cho role admin nhưng controller tìm Coach theo user_id admin.
- Severity đề xuất: Medium.
- Cần xác nhận: admin phải xem dashboard của coach nào hoặc xem dashboard tổng hợp?
- Trạng thái: đã ghi nhận; application chưa được sửa; chưa tự xác nhận Closed.
- Người nhận xử lý: [Chưa phân công].
- Người retest: [Chưa phân công].

### Action list

| Action ID | Feedback / vấn đề | Việc sẽ làm | Người chính | Hạn | Tiêu chí hoàn thành | Trạng thái |
|---|---|---|---|---|---|---|
| A01 | BUG-001 chưa thống nhất nghiệp vụ | Xác nhận requirement; lập phương án code/role phù hợp | [Điền] | [Điền] | Requirement rõ, retest có evidence | Open |
| A02 | Chưa ghi ReadyAPI GUI actual | Rehearsal GUI, cập nhật cột/biên bản đúng nguồn | [Điền] | Trước demo | Version/date/report GUI hoặc trạng thái blocked rõ | Open |
| A03 | Scope chưa full coverage | Tạo mapping requirement → case; chọn case thiếu ưu tiên | [Điền] | [Điền] | Bảng mapping + scope bổ sung rõ | Open |
| A04 | Cần xác nhận đóng góp thật | Điền task log và peer review | Cả nhóm | Sau rehearsal/buổi trình bày | Mỗi task actual có người xác nhận/evidence | Open |
| A05 | [Feedback từ team khác] | [Điền] | [Điền] | [Điền] | [Điền] | [Chưa ghi] |

## 10. Xác nhận cuối buổi

- Người tổng hợp Evaluation: [Điền].
- Thành viên đã kiểm tra phần đóng góp của mình: [Điền].
- Nhóm reviewer / người xác nhận đánh giá chéo: [Điền].
- Câu hỏi chưa trả lời cần bổ sung: [Điền].
- Action có owner và deadline: [Điền].
- Ngày cập nhật tiếp theo: [Điền].

Không tự điền điểm, tên, contribution Done hoặc câu trả lời thành công khi chưa có hoạt động thực tế.

## 12. Bổ sung đánh giá Nonfunctional — 05/10/2026

Project đã thêm17 NFR case (6 performance,11 security), tổng50; kết quả33 functional cũ phải ghi riêng. Số liệu NFR thực tế ở [NFR Findings](testing/nfr/NFR_Findings.md), [Node report](testing/nfr/reports/results.json), [Groovy report](testing/nfr/reports-groovy/results.json). Đây chưa phải kết quả Desktop GUI và chưa phải full OWASP/production capacity coverage.

| Task bổ sung | Owner đề xuất | Evidence cần có | Actual / review |
|---|---|---|---|
| Hiểu profile/percentile và limitation single-worker | TV2 | Đọc code, explain p95/RPS/errors; chạy PERF-01/02 | [Điền sau khi thực hiện] |
| Review ownership/session defect | TV3 | SEC-07 HTTP + persisted state; route/controller source | [Điền] |
| Xác nhận policy enumeration/throttle đề xuất | TV1 + cả nhóm | Quyết định lecturer/product owner; giữ expected version | [Điền] |
| Rehearsal ReadyAPI NFR | Cả nhóm | Version/license, localhost isolated DB, log/ảnh run thật | [Điền] |
| Cập nhật Q&A và đánh giá chéo | Cả nhóm | Câu hỏi/đáp thực tế, không chép answer bank thành actual | [Điền] |

**Tiêu chí đánh giá thêm, dùng trong rubric hiện có, không tự tăng tổng100:**

- Requirement/target đo được và nói rõ target LAB đề xuất.
- Chỉ số có sample count, p95/p99/max, throughput và lỗi; warmup/setup không trộn với load.
- Không test production; có giới hạn tải, fixture riêng/token cleanup và scope security rõ.
- Không coi API200 là security Pass nếu unauthorized write thực sự persisted.
- Không đồng nhất Node/Groovy với ReadyAPI GUI hay “mọi API đều an toàn”.

| Câu hỏi NFR dự kiến | Ý trả lời để tập | Người dự kiến |
|---|---|---|
| p95 khác average/max? | Quantile95%; report cả p99/max/errors, không che outlier | TV2 |
| Vì sao không gọi short soak là endurance? | Chỉ20s hoặc80 request; không chạy nhiều giờ | TV2 |
| Case SEC-07 chứng minh gì? | Coach khác gửi write, HTTP200 và đọc lại state có record; BOLA | TV3 |
| Rate limiting có phải requirement gốc? | Chưa; policy đề xuất<=20/min, cần team phê duyệt | TV1 |
| Chứng minh GUI đã chạy chưa? | Chỉ điền actual sau rehearsal Desktop; hiện Not run | Cả nhóm |

Actual câu hỏi/đáp vẫn ghi ở bảng Q&A thực tế phía trên. Đóng góp sinh code/tài liệu có AI hỗ trợ phải khai báo đúng; không tự ghi mọi thành viên đã implement/run/review.
