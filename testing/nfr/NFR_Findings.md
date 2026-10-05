# Kết quả Nonfunctional — SportCenter, 05/10/2026

Đã thực thi 17 NFR case (6 performance,11 targeted security), trên hai SQLite mới và hai PHP server localhost riêng. Base application commit `1d5a81e`; code NFR mới được nhận dạng bởi `testSourceSha256` trong JSON reports. Không sửa application, không chạy production và chưa chạy ReadyAPI Desktop GUI.

| Nguồn thực thi | Pass | Fail | Blocked | Timestamp UTC |
|---|---:|---:|---:|---|
| Node HTTP integration | 14 | 3 | 0 | 2026-10-05T07:38:22.125Z |
| Groovy từ XML (binding giả lập) | 13 | 4 | 0 | 2026-10-05T07:44:17.498Z |
| ReadyAPI Desktop/native UI | — | — | — | Not run |

Các thời điểm tương ứng14:38 và14:44 UTC+7 ngày05/10/2026. Kết quả33 functional trước đó (32Pass/1Fail) là bộ riêng; không nhận rằng đã chạy nguyên project50 case trong GUI.

Sau khi cài XML50 vào project, đã chạy lại **33 functional Groovy scripts** qua harness lọc NFR: **32Pass/1Fail/0Blocked**, đúng BUG-001 cũ. Bằng chứng ở [regression-functional/results.json](regression-functional/results.json); không ghi đè report functional ban đầu.

## Performance

Môi trường: Windows, PHP8.2.12 built-in single-worker, SQLite seed, BCRYPT_ROUNDS4; Node24.12.0, Java8/Groovy3.0.24, AMD Ryzen7 H255,16 logical CPUs,30.8GB RAM. RAM/CPU này chỉ mô tả máy, **không phải** CPU/memory utilization đo từ backend. Hai engine chạy lần lượt, không cùng lúc.

| Case / phase | Node p95 ms | Groovy p95 ms | Target ms | Node / Groovy |
|---|---:|---:|---:|---|
| PERF-01 baseline /me | 149.25 | 199.39 | 500 | Pass / Pass |
| PERF-02 clients,5 workers | 805.94 | 1049.27 | 1000 | Pass / Fail |
| PERF-03 mixed,3 workers | 485.38 | 616.68 | 1000 | Pass / Pass |
| PERF-04 stats,3 workers | 429.91 | 602.84 | 1000 | Pass / Pass |
| PERF-05 baseline | 169.71 | 207.66 | 1500 | Pass / Pass (case) |
| PERF-05 spike | 804.72 | 1011.43 | 1500 | Pass / Pass (case) |
| PERF-05 recovery | 166.21 | 223.90 | recovery: Node509.13/Groovy622.98 | Pass / Pass (case) |
| PERF-06 short soak | 154.16 | 206.99 | 750 | Pass / Pass |

Mỗi measured response HTTP200 và có payload đúng; error rate0. Full p50/p99/max/RPS/sample count ở [Node JSON](reports/results.json) và [Groovy JSON](reports-groovy/results.json). Warmup5/login/cleanup không tính vào distribution. Short soak mỗi engine có79 request trong khoảng20s; không phải endurance dài.

**PERF-02 giữ Fail ở Groovy:** p95=1049.27ms vượt mục tiêu đề xuất1000ms dù không lỗi HTTP. Không tăng target để làm xanh. Các lần chạy local/client khác nhau có variability và PHP single-worker có hàng đợi; cần lặp nhiều lần cùng profile/environment hoặc đo trên deployment-like setup trước khi kết luận production chậm/đạt capacity. Target là LAB đề xuất, không phải SLO đã phê duyệt.

## Security

Hai engine thống nhất **8Pass/3Fail** trong11 SEC case.

### NFR-BUG-001 — Foreign coach write, High

- Case: `TC-NFR-SEC-07`, thuộc API1:2023 (object-level authorization).
- Setup: login Sara, chọn planning seed của Sara, tạo **session QA mới** (201). Session chưa có seance_realisee. Login Karim riêng.
- Expected: Karim POST `/coach/seances/{qaSessionId}/realiser` bị403/404 và không tạo state hoàn thành.
- Actual ở cả Node/Groovy: **HTTP200**, đọc lại qua token Sara thấy **seance_realisee đã tạo** (`foreignWritePersisted=true`).
- Source: [PlanningController](../../backend/app/Http/Controllers/Coach/PlanningController.php), `marquerRealisee` chỉ lấy coach hiện tại nhưng không so ownership của `$seance->planning` trước `updateOrCreate`.
- Đề nghị: kiểm tra planning.coach_id/current coach trước ghi; thêm policy/authorization phù hợp; chạy lại SEC-07 và owner-positive case. Chưa sửa backend.

Session QA nằm trong DB tạm, không phải session nghiệp vụ của người dùng. Precondition dùng planning seed vì luồng tạo planning mới hiện có thể500: storeSeance gán statut='actif' nhưng enum migration chỉ cho brouillon/publie/archive. Điều này được ghi như phát hiện setup từ quá trình xây test, không bị che bằng đổi code application.

### NFR-BUG-002 — Email enumeration, Medium / policy đề xuất

- Case: `TC-NFR-SEC-10`, API2:2023.
- Expected đề xuất: unknown email và wrong-password có cùng public status/message.
- Actual: cùng401, nhưng unknown=`Incorrect email or password.`; known=`Incorrect password. 4 attempt(s) remaining.`.
- Chỉ thử một lần trên QA account riêng; không lock seed account. Không đo timing side-channel.
- Source: [AuthController](../../backend/app/Http/Controllers/Auth/AuthController.php), `login`.
- Đề nghị: thống nhất generic message và policy với nhóm/giảng viên; kiểm tra lại lock behavior/timing nếu sửa. Đây là thiếu so với **policy đề xuất**, không khẳng định vi phạm requirement gốc đã ký.

### NFR-BUG-003 — No throttling in bounded login burst, Medium / policy đề xuất

- Case: `TC-NFR-SEC-11`, API4:2023.
- Expected LAB đề xuất: <=20 failed login/min/source, có429 và Retry-After trước/ở request25.
- Actual cả hai engine:25 request POST login cho email QA **không tồn tại**, tất cả401; không429, Retry-After không có.
- Source: [routes/api.php](../../backend/routes/api.php): route login chưa gắn throttle middleware.
- Account lock chỉ bảo vệ tài khoản tồn tại, không tự giới hạn toàn bộ request nguồn/IP.
- Đề nghị: phê duyệt limit theo nhu cầu; persistent cache cho rate-limit trong môi trường triển khai; chạy lại trên cấu hình deployment-like. Managed lab CACHE_STORE=array không duy trì state cache qua request, nên không dùng nó để xác nhận throttle sau khi thêm middleware.

### Những case đã Pass trong phạm vi chạy

Fake/tampered/revoked tokens; role matrix read/write (state không đổi); role injection register; foreign assessment read với owner control; recursive secret-field checks; debug/error disclosure. Pass chỉ áp dụng request/data/policy đã test, không chứng minh mọi endpoint không có lỗ hổng.

## Giới hạn và handoff

- Giữ 33 functional cases gốc. Workbook gốc/corrected có thêm4 sheet NFR; code và XML tổng50 case, NFR-only17 case.
- XML dùng Groovy Script steps trong Functional Tests. Chưa sinh/chạy native Performance Test hoặc Security Scan UI; license và Desktop runtime cần rehearsal.
- API localhost chỉ đủ targeted security và small-load lab; không test TLS/HSTS, browser CORS/CSRF/XSS, real bank gateway, production data, CPU/memory resource metrics hoặc stress/DoS.
- Xem [README](README.md) để chạy/rehearsal; [HTML Node](reports/report.html), [HTML Groovy](reports-groovy/report.html), JSON/JUnit là bằng chứng riêng nguồn.
- Không thay expected/threshold chỉ để all Pass; xác nhận requirement/policy trước khi sửa application. Bộ mới được đưa vào branch `Tester` trong commit cập nhật này.

Mapping rủi ro tham chiếu [OWASP API Security Top10 2023](https://owasp.org/API-Security/editions/2023/en/0x11-t10/); đây là tài liệu nhận diện rủi ro, không phải chứng nhận tuân thủ.
