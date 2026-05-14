# 01 — Giới thiệu & khái niệm cơ bản

> Trang này dành cho **người chưa biết gì** về Windows Service / Event Log. Đọc xong sẽ hiểu được 2 thứ này là gì, tại sao quan trọng, và tại sao mình phải build tính năng quản lý từ xa trên Cloud Panel.

## 1. Windows Service là gì?

**Windows Service** = chương trình chạy nền (background) trên Windows, **không có cửa sổ UI**, do hệ điều hành Windows quản lý vòng đời (start/stop/restart).

### So sánh nhanh

| Loại chương trình | Có UI? | Ai chạy? | Khi tắt máy thì sao? |
|---|---|---|---|
| Ứng dụng thường (Word, Chrome) | ✅ Có | User đang login chạy | Tắt theo session |
| **Windows Service** | ❌ Không | **Windows tự chạy lúc boot** | Vẫn chạy kể cả không ai login |

### Ví dụ Windows Service quen thuộc

- **W3SVC** — IIS Web Server (host website trên Windows)
- **MSSQLSERVER** — Microsoft SQL Server database engine
- **Spooler** — Quản lý hàng đợi in (Print Spooler)
- **Themes** — Render giao diện Windows
- **WinDefend** — Windows Defender antivirus
- **wuauserv** — Windows Update

> **📌 Lưu ý:** Mỗi service có 2 tên:
> - **Service Name** (tên ngắn, kỹ thuật) — VD: `Spooler`
> - **Display Name** (tên hiển thị) — VD: `Print Spooler`
> Trong Cloud Panel UI mình hiển thị cả 2 để user dễ tìm.

### Trạng thái của 1 service

```
       ┌─────────┐   Start    ┌──────────┐   Stop    ┌─────────┐
       │ Stopped │ ─────────► │ Running  │ ────────► │ Stopped │
       └─────────┘            └────┬─────┘           └─────────┘
                                   │
                                   │ Pause
                                   ▼
                             ┌──────────┐   Continue
                             │  Paused  │ ──────────► Running
                             └──────────┘
```

5 trạng thái chính:

| State | Ý nghĩa |
|---|---|
| `Running` | Đang chạy |
| `Stopped` | Đã dừng |
| `Paused` | Tạm dừng (chỉ vài service hỗ trợ pause, đa số không) |
| `StartPending` | Đang khởi động (vài giây transition) |
| `StopPending` | Đang tắt (vài giây transition) |

### Startup Type (cách khởi động)

| Startup Type | Hành vi |
|---|---|
| **Automatic** | Tự start lúc Windows boot |
| **Automatic (Delayed Start)** | Tự start nhưng trễ 1–2 phút sau boot (cho service không quan trọng) |
| **Manual** | Chỉ start khi có chương trình khác gọi |
| **Disabled** | Không cho start (kể cả manual cũng fail) |

### Tại sao quan trọng?

Trên VPS Windows host **web/database/game server**, các service như IIS, SQL Server, custom app service… **phải chạy 24/7**. Nếu service chết → website down. Sysadmin cần:

1. Biết **service nào đang chạy / đã dừng**
2. **Start lại** service bị crash mà không cần SSH/RDP vào VPS
3. **Đổi startup type** (VD: tạm disable Windows Update để tránh auto-reboot)
4. **Xem chi tiết** (path executable, account chạy service, dependencies)

→ Đây chính là việc tính năng **Windows Service Management** của Cloud Panel làm.

## 2. Windows Event Log là gì?

**Windows Event Log** = hệ thống ghi log **built-in** của Windows, ghi lại mọi sự kiện quan trọng xảy ra: app crash, login failed, service start/stop, driver lỗi, update, security audit…

### Channel (kênh log)

Windows tổ chức log thành nhiều **channel**. 3 channel chính:

| Channel | Ghi gì? | Ví dụ event |
|---|---|---|
| **Application** | Log từ user app, custom app | App X crash, MSSQL connection fail |
| **System** | Log từ kernel, driver, service | Service "Spooler" started, driver lỗi |
| **Security** | Log đăng nhập, audit quyền | User login success/fail, file access |

Ngoài ra Windows Server có thêm: `Setup`, `Forwarded Events`, và hàng trăm channel "Applications and Services Logs" (cho từng component như Hyper-V, RDP, IIS…).

### Cấu trúc 1 event

Mỗi entry trong event log có các trường:

```
┌──────────────────────────────────────────────────────────────┐
│ Time:      2026-05-14T08:23:11.123Z                          │
│ Level:     Error                                             │
│ Source:    Application Error                                 │
│ EventID:   1000                                              │
│ Computer:  WIN-VPS-01                                        │
│ RecordID:  4839271                                           │
│ Message:   Faulting application name: chrome.exe...          │
│ EventData: {AppName: "chrome.exe", FaultModule: "ntdll.dll"} │
└──────────────────────────────────────────────────────────────┘
```

### Level (mức độ nghiêm trọng)

| Level | Value | Khi nào dùng |
|---|---|---|
| 🔴 **Critical** | 1 | Hệ thống fail nặng, mất data |
| 🟠 **Error** | 2 | Service / function failed |
| 🟡 **Warning** | 3 | Có vấn đề, chưa fail |
| 🔵 **Information** | 4 | Hoạt động bình thường (login OK, service started) |
| ⚪ **Verbose** | 5 | Debug trace chi tiết (mặc định tắt) |

### EventID (mã sự kiện)

Số ID do nhà cung cấp (Microsoft / vendor) định nghĩa, **unique trong scope provider+channel**. Một số EventID nổi tiếng:

| EventID | Channel | Ý nghĩa |
|---|---|---|
| `4624` | Security | Login thành công |
| `4625` | Security | Login thất bại |
| `4634` | Security | Logoff |
| `4720` | Security | Tạo user mới |
| `1074` | System | System shutdown (do user) |
| `6005` / `6006` | System | Event Log service started / stopped (proxy cho boot/shutdown) |
| `7000` | System | Service load failed |
| `1000` | Application | App crash (faulting application) |

> **💡 Mẹo:** Google `"event id 4625"` → ra ngay tài liệu Microsoft giải thích chi tiết.

### Record ID — quan trọng cho phân trang

Mỗi event có 1 `RecordID` **đơn điệu tăng** (start từ 1, tăng dần, không tái sử dụng). Cloud Panel dùng RecordID làm **cursor** để phân trang hiệu quả khi user scroll xem hàng nghìn event mà không bị lệch.

### Vị trí lưu trên VPS

Windows lưu event log dưới dạng file binary `.evtx` tại:

```
C:\Windows\System32\Winevt\Logs\
```

Một số file quan trọng:

- `Application.evtx`
- `System.evtx`
- `Security.evtx`
- `Microsoft-Windows-PrintService%4Operational.evtx` (ký tự `%4` thay cho `/`)

> ⚠️ **Không mở trực tiếp bằng Notepad** — file binary, phải dùng `eventvwr.msc` hoặc PowerShell `Get-WinEvent`.

### Tại sao quan trọng?

Khi VPS có vấn đề (app crash, ai đó brute-force SSH/RDP, service tự nhiên stop, disk lỗi…) → **dấu vết luôn nằm trong Event Log**.

Sysadmin cần:

1. Xem event log realtime → biết ngay khi có lỗi
2. Filter theo level/EventID/source → tìm nhanh root cause
3. Setup alert → có Critical/Error là Telegram/email ngay
4. Export ra CSV để báo cáo

→ Đây chính là tính năng **Windows Event Log Viewer + Alert Rules** của Cloud Panel.

## 3. Tại sao cần Cloud Panel? Không RDP vào trực tiếp được sao?

Được! Nhưng có 3 vấn đề khi sysadmin quản lý **nhiều VPS** (hàng chục đến hàng trăm):

### Vấn đề 1 — Không scale

Quản lý 50 VPS Windows → RDP vào từng cái mở `services.msc` / `eventvwr.msc` mất hàng giờ. Cloud Panel cho phép xem **tất cả VPS từ 1 dashboard**.

### Vấn đề 2 — Không có audit trail

Khi sysadmin RDP vào tự tay stop service → **không ai biết ai đã làm gì lúc nào**. Cloud Panel ghi audit log:
- Ai (`user@inet.vn`) đã action
- Lúc nào (`2026-05-14T10:23Z`)
- Hành động gì (`stop service Spooler`)
- Kết quả (`success` / `error: ACCESS_DENIED`)

### Vấn đề 3 — Không có alert chủ động

RDP là **kéo (pull)** — phải mở Event Viewer mới biết có lỗi. Cloud Panel **đẩy (push)** alert realtime: có Critical event → Telegram/email/push ngay lập tức.

### Vấn đề 4 — Security

Mở port RDP (3389) cho user thường = rủi ro brute-force. Cloud Panel chỉ cần **agent** trên VPS kết nối ra ngoài (outbound), **không mở port inbound** cho user.

## 4. Cloud Panel làm việc đó như thế nào?

Sơ đồ tổng quan (chi tiết ở [trang 03](./03-architecture-overview.md)):

```
┌─────────────┐       HTTP/Socket.IO       ┌──────────────┐    Socket.IO    ┌──────────────┐
│             │ ◄─────────────────────────► │              │ ◄─────────────► │              │
│  Browser    │                             │   Backend    │                 │   Agent (Go) │
│  (Vue 3)    │   API: /api/v1/user/        │   Node.js    │   /agent-ws     │   cài trên   │
│             │       hosts/.../...         │              │                 │   VPS Windows│
└─────────────┘                             └──────┬───────┘                 └──────┬───────┘
   port 8015                                       │                                │
                                                   ▼                                ▼
                                              ┌─────────┐                  ┌──────────────┐
                                              │ MongoDB │                  │ Windows API  │
                                              │ (audit) │                  │ wevtapi.dll  │
                                              └─────────┘                  │ svc/mgr      │
                                                                           └──────────────┘
```

3 thành phần:

1. **Frontend (Vue 3)** — UI user thấy
2. **Backend (Node.js)** — gateway API, auth, ownership check
3. **Agent (Go)** — cài sẵn trên VPS Windows của customer, gọi Windows API trực tiếp

Khi user click "Stop Service Spooler":

```
1. Browser → POST /api/v1/user/hosts/{id}/windows-services/Spooler/stop
2. Backend → check ownership (host này có phải của user không?)
3. Backend → check critical service (Spooler là critical → cần confirm token)
4. Backend → emit qua Socket.IO /agent-ws → Agent trên VPS
5. Agent → gọi Windows API: mgr.OpenService("Spooler").Control(Stop)
6. Agent → poll status đến khi service Stopped (max 60s)
7. Agent → emit response về Backend qua Socket.IO
8. Backend → trả HTTP response cho Browser + emit realtime push qua /windows-services
9. Browser → cập nhật UI (badge "Running" → "Stopped")
```

> Chi tiết flow này ở [trang 04](./04-windows-services-deep-dive.md).

## 5. Tóm tắt

| Khái niệm | Một câu |
|---|---|
| **Windows Service** | Background process do Windows quản lý, chạy 24/7 không cần UI |
| **Service States** | Running / Stopped / Paused / StartPending / StopPending |
| **Startup Type** | Automatic / Auto-Delayed / Manual / Disabled |
| **Event Log** | Hệ thống log built-in của Windows, lưu vào file `.evtx` |
| **Channel** | Application / System / Security + nhiều channel chuyên dụng |
| **Level** | Critical (1) / Error (2) / Warning (3) / Information (4) / Verbose (5) |
| **EventID** | Mã sự kiện do vendor đặt, unique theo Provider+Channel |
| **RecordID** | Cursor đơn điệu tăng, dùng phân trang |
| **Cloud Panel** | Dashboard multi-VPS, gom action + audit + alert vào 1 UI |
| **Agent** | Chương trình Go cài trên VPS Windows, cầu nối FE/BE ↔ Windows API |

---

**Tiếp theo:** [02 — Hướng dẫn vào Remote Desktop xem trên VPS →](./02-remote-desktop-guide.md)
