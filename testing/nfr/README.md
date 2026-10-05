# SportCenter — Nonfunctional testing (05/10/2026)

Đã thêm 17 case: **6 Performance + 11 Security**, giữ 33 functional case gốc. Tổng project ReadyAPI: **50 case / 10 suites**. Đây là kiểm tra thuộc tính hiệu năng/bảo mật bằng HTTP và Groovy; security assertions vẫn là các probe API cụ thể, không phải security scan hay pentest toàn diện.

## File và test plan

- `nfr-cases.mjs`: nguồn kịch bản, mục tiêu và policy đề xuất.
- `nfr-engine.mjs`, `run-nfr.mjs`: Node HTTP runner không cần npm install.
- `nfr-engine.groovy`, `groovy/*.groovy`: source tương ứng cho ReadyAPI.
- `VIPSportCenter-nfr-readyapi-project.xml`: chỉ 17 NFR case, self-contained.
- `../VIPSportCenter-readyapi-project.xml`: 33 functional + 17 NFR.
- `../../VIPSportCenter_ReadyAPI_TestCases_Corrected.xlsx`: giữ 6 sheet cũ, thêm `NFR Overview`, `NFR Cases`, `NFR Results`, `NFR Defects`.
- Workbook gốc `../../VIPSportCenter_ReadyAPI_TestPlan.xlsx`: giữ các sheet cũ, thêm cùng 4 sheet NFR. Bản trước chỉnh sửa được backup ở thư mục `Backups` trong lab root.
- `reports/`, `reports-groovy/`: JSON, HTML, JUnit; không lưu token, password hay response chứa secret.
- `NFR_Findings.md`: số liệu và các phát hiện đã chạy thực tế. `../../../Research.docx` có phần 19 cập nhật NFR.

## Chạy

Từ root repo, cần PHP >=8.2, Composer/vendor backend và Node >=22.12 (máy đã chạy kiểm chứng bằng Node24/PHP8.2.12):

```powershell
node testing/nfr/run-nfr.mjs --managed
node testing/nfr/run-nfr.mjs --managed --category performance
node testing/nfr/run-nfr.mjs --managed --category security
node testing/nfr/run-nfr.mjs --managed --case TC-NFR-SEC-07 --report-dir testing/nfr/reports-demo
node --test testing/nfr/nfr-engine.test.mjs
```

Mỗi managed run migrate/seed trên SQLite **mới trong TEMP**, không dùng MySQL/XAMPP hay DB đang làm việc. Server chỉ bind `127.0.0.1`; runner dừng process PHP do nó tạo khi hoàn tất, giữ QA DB để xem defect. Không cần bật React/Vite. Exit 0 = all Pass, 1 = Fail/Blocked, 2 = runner/setup failure. Không sửa expected cho các policy/bug hiện Fail chỉ để có exit0.

`--case` hoặc `--category` ghi report chỉ cho phần đã chọn; dùng `--report-dir` riêng nếu muốn giữ kết quả full suite. Không chạy hai bài performance cùng lúc vì sẽ làm sai số liệu.

Với API lab local tự bật, bắt buộc xác nhận `--lab`:

```powershell
node testing/nfr/run-nfr.mjs --base-url http://127.0.0.1:8000/api --lab --category security
```

Chỉ dùng DB lab đã seed, tuyệt đối không production. NFR từ chối hostname ngoài localhost, URL có embedded credentials, timeout >5s. Bài tải chỉ GET, tối đa5 workers/100 requests mỗi phase. Login burst chỉ tối đa25 request cho email QA không tồn tại. BOLA-write tạo session QA mới trong planning seed; không đánh dấu session seed có sẵn. QA client soft-delete, token riêng logout; session/cotisation còn lại trong DB lab.

## Chạy ReadyAPI

1. Từ thư mục `testing`, chạy `node run-tests.mjs --managed --serve`; giữ terminal mở.
2. Import project tổng hoặc project NFR riêng. Copy `ReadyAPI baseUrl` từ terminal vào project property `baseUrl` (port động, không mặc định8000).
3. Xác nhận đây là SQLite riêng; đặt **`nfrLabOnly=true`**. Mặc địnhfalse để tránh vô tình gọi API thường.
4. `nfrTimeoutMs=5000`. Chạy suite tuần tự; không dùng parallel suite trong lúc đo performance. Mỗi performance case tự chạy 1–5 worker HTTP.
5. Xem Groovy log: result, metrics, observations. Mỗi case lưu `context.caseResult`; report HTTP/Groovy đã lưu **không phải** kết quả GUI.
6. Ghi kết quả GUI thực tế vào Excel sau khi tự chạy; hiện vẫn **Not run**. Ctrl+C ở terminal để dừng server lab.

Code chưa được mở/chạy trong ReadyAPI Desktop. XML validate schema và Groovy harness dùng binding giả lập; không xác nhận license/GUI runtime. Nếu tool/edition không hỗ trợ, không nhận Node report là ReadyAPI report.

## Performance profiles và metric

| Case | Profile (warmup5, không tính setup) | p95 target |
|---|---|---|
| PERF-01 | 30 GET /me, concurrency1 | <=500ms |
| PERF-02 | 50 GET admin/clients, concurrency5 | <=1000ms |
| PERF-03 | 60 mixed read admin/coach/client, concurrency3 | <=1000ms |
| PERF-04 | 30 payment stats, concurrency3 | <=1000ms |
| PERF-05 | baseline20@1 → spike40@5 → recovery20@1 | <=1500ms; recovery <=max(500ms, 3×baseline p95) |
| PERF-06 | short soak up to20s/80 requests, concurrency1, paced250ms | <=750ms; >=20 samples |

Mỗi sample phải HTTP200 **và đúng payload**; error rate0, max<=2000ms. Đo full-body wall latency với monotonic clock, nearest-rank p50/p95/p99, max, throughputRPS, error rate. Lỗi transport/status/payload tính vào mẫu lỗi; không bỏ mẫu chậm để làm đẹp p95. Soak dừng theo thời gian hoặc cap; report ghi duration/count thực tế, không gọi là endurance nhiều giờ. Spike kiểm tra từng phase, không trộn baseline để che spike.

Ngưỡng là **đề xuất của team cho LAB**, không có SLO production trong repo. PHP dev server single-worker nên 5 client workers có thể xếp hàng, không chứng minh backend xử lý song song. SQLite, dataset seed nhỏ, BCRYPT_ROUNDS4 (giảm chi phí hash test) và phần cứng local khiến kết quả không đại diện MySQL/Apache/PHP-FPM production. Không đo CPU/memory backend. PERF-02 có thể Fail sát1000ms; giữ số liệu và lặp cùng môi trường, không tùy tiện tăng threshold.

## Security cases

| Case | Kiểm tra | OWASP 2023 |
|---|---|---|
| SEC-01/02/03 | Fake/modified/revoked token; không replay sau logout | API2 |
| SEC-04 | Role matrix read + PUT, đọc lại state không đổi | API5 |
| SEC-05 | Register role=admin không tăng quyền | API3 |
| SEC-06 | Coach đọc bilans client coach khác bị chặn; owner control200 | API1 |
| SEC-07 | Coach sửa session coach khác bị chặn, kiểm tra persisted state | API1 |
| SEC-08 | Recursive JSON: không password/hash/remember_token/token | API3 |
| SEC-09 | Error422/404: không SQLSTATE/stack/path/exception | API8 |
| SEC-10 | Email tồn tại/không tồn tại có message lỗi giống nhau | API2; policy đề xuất |
| SEC-11 | <=20 wrong-login/min/source; 429 trước/ở request25 + Retry-After | API4; policy lab đề xuất |

Enumeration test chỉ so status/message, không đo timing side channel. Rate-limit policy cần lecturer/product owner xác nhận; Fail là thiếu so với policy đề xuất, không tự nhận đã vi phạm requirement ký kết. `CACHE_STORE=array` không duy trì limiter qua request trong managed lab; nếu triển khai throttle phải dùng persistent cache và chạy lại trên deployment-like config.

Lưu ý precondition SEC-07: tạo planning mới qua API có thể500 vì controller storeSeance dùng statut='actif', trong khi migration enum chỉ cho brouillon/publie/archive. Case sử dụng planning seed đã có (publie), tạo **session QA mới** để test ownership riêng; không sửa application. Đây là phát hiện setup bổ sung, không tính như kết quả chính của SEC-07.

## Nếu cần demo tính năng native Performance/Security của ReadyAPI

Bộ XML đã viết dùng **Groovy Script steps trong Functional Tests**, không giả nhận đã sinh native Load/Security Test model. Muốn trình bày module native, thực hiện rehearsal riêng trên bản/license đã cài:

1. Tạo REST Request GET /me hay admin/clients, cấu hình Bearer token từ login lab; thêm HTTP200 và JSON assertions.
2. Tạo Performance Test từ request/case này, giới hạn1–5 virtual users và run ngắn; cấu hình mục tiêu theo bảng trên, thu response-time/error statistics. Không chạy full suite có fixture CRUD dưới tải chung.
3. Với Security Test, chọn request lab và scan phù hợp (invalid input/auth theo khả năng bản cài), giới hạn số payload; so kết quả với các SEC case. Không scan login real account để tránh lock.
4. Lưu report/ảnh phiên bản, license, profile và thời điểm thực thi thực tế; GUI/native chưa run phải giữ Not run.

Đây là hướng dẫn bổ sung, chưa được xác nhận trên Desktop hiện tại. TLS/HSTS cần HTTPS staging; browser CORS/CSRF/XSS, load/stress lớn, resource exhaustion, real payment gateway và full OWASP coverage còn ngoài phạm vi.

## Build/verify lại

```powershell
node testing/nfr/build-nfr.mjs
# Builder sinh workbook và XML tổng vào nfr; backup và copy đến vị trí tương ứng trước khi verify bản mới.
powershell -ExecutionPolicy Bypass -File testing/verify-artifacts.ps1 -Directory (Resolve-Path testing)
powershell -ExecutionPolicy Bypass -File testing/nfr/verify-nfr-artifacts.ps1 -TestingDirectory (Resolve-Path testing)
```

`build-nfr.mjs` mặc định output là thư mục `nfr`, **không tự ghi đè workbook gốc**. Các output workbook, Research.docx và XML tổng cần copy đến vị trí tương ứng sau khi backup; các file NFR scripts/XML riêng tự ở nfr. Generator giữ các part/sheet cũ khi thêm hoặc thay4 sheet NFR. Không ghi lại cột ReadyAPI GUI từ Node/Groovy.

Nếu dùng `testing/build-artifacts.mjs` để sinh lại33 functional, cần build và cài output NFR **sau cùng**, vì generator functional riêng không thêm17 NFR; không dùng XML33 thay cho XML50. Functional runner và harness vẫn chỉ chạy33 case; NFR runner là lệnh riêng.

Kiểm chứng Groovy độc lập (Java8+/Groovy3 và groovy-json cùng phiên bản; jar không commit):

```powershell
node testing/nfr/run-nfr.mjs --managed --groovy-classpath "D:/tools/groovy-3.0.24.jar;D:/tools/groovy-json-3.0.24.jar" --report-dir testing/nfr/reports-groovy
```

## Nguồn

- [OWASP API Security Top10 2023](https://owasp.org/API-Security/editions/2023/en/0x11-t10/) — mapping các rủi ro; không phải chứng nhận coverage.
- [ReadyAPI: customizing a performance test](https://support.smartbear.com/readyapi/getting-started/performance-testing/customizing-a-performance-test-part-1/) — virtual users và test profile.
- [ReadyAPI support/documentation](https://support.smartbear.com/readyapi/) — functional, security và load testing theo edition/license.
