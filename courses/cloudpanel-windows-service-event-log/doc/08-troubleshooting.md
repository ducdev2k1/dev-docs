# 08 — Troubleshooting & debug

> Checklist khi gặp vấn đề. Mỗi triệu chứng → nguyên nhân khả thi → cách verify → cách fix.

## 1. Cách tiếp cận chung

1. **Xác định lớp lỗi** — FE / BE / Agent / Windows. Mỗi lớp có cách debug riêng.
2. **Đọc error code** trong response — đa số đã rõ ràng (`AGENT_OFFLINE`, `ACCESS_DENIED`...).
3. **Dùng audit** — Mongo collection lưu lịch sử action có error code → grep theo `host_id`.
4. **RDP đối chiếu** — nếu nghi data sai, RDP vào VPS xem trực tiếp `services.msc` / `eventvwr.msc`.

## 2. Triệu chứng: "Service không start/stop được"

### 🔍 Bước 1 — Đọc error response

Mở DevTools → tab Network → tìm request POST `.../start` hoặc `.../stop`. Xem response:

```json
{ "error": "...", "code": "<CODE>", "status": <int> }
```

### Bảng error → nguyên nhân

| Code | Nguyên nhân | Fix |
|---|---|---|
| `AGENT_OFFLINE` (503) | Agent không online | Check kết nối agent (mục 6 bên dưới) |
| `ACCESS_DENIED` (403) | Agent thiếu quyền Windows (rare, agent chạy LocalSystem mà) | Kiểm tra agent có chạy đúng account không (xem `services.msc` → CloudPanelAgent → Log On) |
| `DEPENDENTS_RUNNING` (422) | Có service khác phụ thuộc | Stop dependent trước → rồi stop service này |
| `SERVICE_NOT_FOUND` (404) | Tên service không tồn tại | Service đã bị uninstall → refetch list |
| `ACTION_IN_PROGRESS` (409) | Đang có request khác chạy | Đợi 5–10s rồi thử lại |
| `ACTION_TIMEOUT` (503) | Service không chuyển state trong 60s | RDP vào VPS check trực tiếp. Có thể bị stuck (rare, cần kill process bằng `taskkill /PID`) |
| `CRITICAL_SERVICE_REQUIRES_CONFIRM_TOKEN` (400) | Stop critical service mà chưa gõ token | Gõ đúng tên service vào dialog confirm |
| `INVALID_STARTUP_TYPE` (422) | Set startup type không hợp lệ | Chỉ accept: `Automatic`, `AutomaticDelayed`, `Manual`, `Disabled` |

### 🔍 Bước 2 — Verify trên VPS

RDP vào VPS:

1. Mở `services.msc`
2. Tìm service đó → right-click Properties
3. Check tab **General**: status hiện gì?
4. Tab **Log On**: account chạy là gì?
5. Tab **Dependencies**: có dependent nào không?
6. Tab **Recovery**: action khi crash là gì?

Đôi khi service đang stuck ở `StartPending` quá lâu — Windows tự gọi là "stalled". Cách fix:

```powershell
# Lấy PID
sc queryex Spooler

# Kill cứng (cẩn thận!)
taskkill /F /PID <PID>

# Sau đó start lại
sc start Spooler
```

## 3. Triệu chứng: "Event Log không hiển thị event nào"

### 🔍 Check 1 — Agent có online?

Xem header trang. Nếu agent offline → badge đỏ. Vào `Agents` tab xem status.

### 🔍 Check 2 — Agent version đủ?

Event Log yêu cầu agent **≥ 2.0.0**. Vào Agents → xem version. Nếu < 2.0.0 → upgrade qua Cloud Panel update endpoint hoặc reinstall.

### 🔍 Check 3 — Filter quá hẹp?

Quên off filter cũ là lỗi rất hay gặp. Click **Clear filters** → xem lại.

### 🔍 Check 4 — Channel có data không trên VPS?

RDP vào → `eventvwr.msc` → chọn channel tương ứng → có event không?

- Nếu **VPS không có event** trong channel → bình thường, Cloud Panel hiển thị 0 row.
- Nếu **VPS có nhưng Cloud Panel không** → bug, check tiếp.

### 🔍 Check 5 — Channel `Security` đặc biệt

Channel `Security` yêu cầu agent có **SeSecurityPrivilege**. LocalSystem có sẵn. Nhưng nếu agent install với account custom (không phải LocalSystem) → fail.

Verify:

```powershell
# Trên VPS, mở PowerShell as Admin
Get-Service CloudPanelAgent | Select-Object Name, StartType, Status
sc qc CloudPanelAgent | findstr SERVICE_START_NAME
```

Nếu `SERVICE_START_NAME` không phải `LocalSystem` → reinstall agent với default settings.

### 🔍 Check 6 — Time range quá xa

Filter time range cũ → có thể event đã rotate (file `.evtx` đầy 20MB → Windows xóa cũ). Chỉ event chưa rotate mới lấy được.

→ Check: `eventvwr.msc` → right-click channel → Properties → "Maximum log size (KB)" + "When maximum event log size is reached".

## 4. Triệu chứng: "Event Log live stream không update"

### 🔍 Check 1 — WebSocket connection

DevTools → tab Network → filter `WS`. Tìm connection `/windows-event-log`:

- Status: phải là **101 Switching Protocols**
- Frames tab: phải có message `eventlog:subscribed` lúc bật toggle

Nếu không connect → check authentication (cookie/JWT có valid không).

### 🔍 Check 2 — Banner "Events dropped"

Nếu có banner đỏ "Bạn đã miss N events do rate limit" → đang storm event, agent throttle. Action:

- Filter hẹp lại (chỉ Critical + Error thay vì all level)
- Tăng cooldown nếu là bug loop

### 🔍 Check 3 — Tab scroll lên đọc cũ

Khi user scroll lên đọc log cũ, FE pause live append (để tránh "scroll jump"). Cuộn xuống cuối → live resume.

### 🔍 Check 4 — Subscription bị BE đóng

Reload page. Hoặc check Network frames có message `eventlog:closed` với reason gì:

| Reason | Nghĩa |
|---|---|
| `agent_disconnect` | Agent mất kết nối → wait reconnect |
| `superseded` | User mở subscription cùng host từ tab khác (1 user 1 host = 1 sub) |
| `rate_limit_exceeded` | FE gửi quá nhiều → BE block |
| `idle` | Không có ack từ FE → BE tự đóng |

## 5. Triệu chứng: "Alert không nhận được Telegram/email"

### 🔍 Check 1 — Rule có enabled?

Page Alert Rules → toggle status. Disable accidentally rất hay xảy ra.

### 🔍 Check 2 — Condition có match không?

Test thủ công: vào trang Event Log → set filter giống condition trong rule → có event nào hiện không? Nếu không → condition sai.

### 🔍 Check 3 — Có active subscription không?

⚠️ **Quan trọng:** Alert chỉ fire khi có **active event log subscription** (xem [trang 06](./06-alert-rules-integration.md) section 10).

→ Nếu user không mở tab Event Log → không có subscription → không có event → không alert.

**Workaround:** Mở tab Event Log + tick Live + để tab background. Hoặc đợi tới khi feature "always-on subscription" được build.

### 🔍 Check 4 — Dedup window quá dài

Nếu vừa fire 5 phút trước, dedup window 60 phút → sẽ skip mọi event cùng fingerprint trong 60 phút.

→ Check `last_triggered_at` của rule, so với current time.

### 🔍 Check 5 — Circuit breaker triggered

Host có > 100 alert/giờ → tự suppress 1 giờ. Check BE log:

```bash
# Trên server BE
pm2 logs CP | grep "circuit breaker triggered"
```

### 🔍 Check 6 — Telegram chat ID có chính xác

Vào Account Settings → check `telegram_chat_id`. Nếu trống → chưa pair với bot. Pair lại: gõ `/start` với bot Cloud Panel trên Telegram.

### 🔍 Check 7 — Email vào spam

Check thư mục Spam/Junk. Add sender Cloud Panel vào contact list.

## 6. Triệu chứng: "Agent offline"

### 🔍 Check 1 — RDP vào VPS xem agent service

```powershell
Get-Service CloudPanelAgent
```

| Status | Action |
|---|---|
| `Running` | Agent chạy → debug network |
| `Stopped` | `Start-Service CloudPanelAgent` |
| `StartPending` | Đợi 30s rồi check lại |
| Not found | Agent chưa cài / đã uninstall → reinstall |

### 🔍 Check 2 — Log agent

```
C:\ProgramData\CloudPanelAgent\logs\agent.log
```

Tìm dòng có `ERROR` hoặc `failed`. Common errors:

| Error log | Nguyên nhân | Fix |
|---|---|---|
| `dial tcp: lookup failed` | DNS không resolve được BE | Check firewall outbound, `nslookup cloudpanel-backend.inet.vn` |
| `TLS handshake failed` | Cert expired hoặc time skew | Sync time `w32tm /resync` |
| `auth failed: 401` | Agent token expired / revoked | Regenerate token, update `.env`, restart agent |
| `connection reset` | BE restart hoặc network flap | Đợi auto-reconnect (vài giây) |

### 🔍 Check 3 — Firewall

Agent connect outbound port 443 (wss). Nếu VPS có firewall corporate:

```powershell
# Test connectivity từ VPS
Test-NetConnection cloudpanel-backend.inet.vn -Port 443
```

Nếu fail → liên hệ infra để whitelist.

### 🔍 Check 4 — Token

```powershell
# Xem token agent đang dùng
Get-Content "C:\Program Files\CloudPanelAgent\.env"
```

Nếu token đã revoke (admin Cloud Panel reset) → agent sẽ fail auth. Regenerate token trên Cloud Panel UI → copy vào `.env` → restart agent.

### 🔍 Check 5 — Restart agent

```powershell
Restart-Service CloudPanelAgent
# Đợi 10s
Get-Service CloudPanelAgent
```

Xem agent.log có dòng `connected to backend` xuất hiện không.

## 7. Tools debug bổ trợ

### Trên BE (SSH vào server BE)

```bash
# Log BE
pm2 logs CP

# Filter cho 1 host
pm2 logs CP | grep "host_id=65f3a8b"

# Mongo query audit
mongosh "mongodb://..." \
  --eval "db.windows_services_audit.find({host_id: '65f3a8b...'}).sort({created_at: -1}).limit(10)"

# Check subscription registry size
# (Cloud Panel có admin debug endpoint internal, hoặc check log)
```

### Trên FE (browser DevTools)

```javascript
// Console: check TanStack cache
window.__TANSTACK_QUERY_CLIENT__.getQueryData(['windows-services', '65f3a8b...'])

// Console: check socket connection
// (cần expose socket instance trong dev mode)
```

### Trên Agent (RDP vào VPS)

```powershell
# Real-time tail log
Get-Content "C:\ProgramData\CloudPanelAgent\logs\agent.log" -Wait -Tail 50

# Check process
Get-Process | Where-Object {$_.ProcessName -eq "cloud-panel-agent"}

# Check connection
netstat -ano | findstr "443" | findstr "ESTABLISHED"

# Test wevtapi
Get-WinEvent -LogName Application -MaxEvents 1

# Test SCM
Get-Service Spooler
```

## 8. Health-check checklist trước khi báo bug

Trước khi tạo ticket bug, đảm bảo đã check:

- [ ] Reload page Cloud Panel (Ctrl+F5)
- [ ] Clear filter / reset view
- [ ] Logout & login lại
- [ ] Check agent online status
- [ ] Check agent version ≥ requirement
- [ ] RDP vào VPS verify thực tế match Cloud Panel hiển thị
- [ ] Mở DevTools → Network tab → screenshot request fail (kèm response body)
- [ ] Mở agent log (`agent.log`) → screenshot vài dòng cuối
- [ ] Check Mongo audit collection có entry liên quan không
- [ ] Note rõ time + host_id + service_name / event filter để reproduce

## 9. Bảng tham chiếu nhanh — Câu lệnh debug

| Câu hỏi | Lệnh |
|---|---|
| Service có chạy không? | `Get-Service <Name>` |
| Account chạy service? | `sc qc <Name>` |
| Service dependents? | `sc enumdepend <Name>` |
| Liệt kê event mới nhất? | `Get-WinEvent -LogName Application -MaxEvents 10` |
| Channel size hiện tại? | `Get-WinEvent -ListLog Application` |
| Agent status? | `Get-Service CloudPanelAgent` |
| Agent log live tail? | `Get-Content "C:\ProgramData\CloudPanelAgent\logs\agent.log" -Wait -Tail 50` |
| Test connection BE? | `Test-NetConnection cloudpanel-backend.inet.vn -Port 443` |
| BE log filter host? | `pm2 logs CP \| grep host_id=...` |
| Mongo audit lookup? | `db.windows_services_audit.find({host_id: '...'}).limit(10)` |

---

**Tiếp theo:** [09 — Tài liệu tham khảo →](./09-resources.md)
