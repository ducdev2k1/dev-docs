# 02 — Hướng dẫn vào Remote Desktop xem trên VPS

> Trang này hướng dẫn từng bước cách **RDP (Remote Desktop Protocol)** vào VPS Windows để xem trực tiếp `services.msc` và `eventvwr.msc` — đối chiếu với data hiển thị trên Cloud Panel.

## 1. Tại sao cần RDP vào trực tiếp?

Cloud Panel hiển thị data từ VPS qua agent → nhưng đôi khi vẫn cần RDP vào để:

1. **Verify data Cloud Panel khớp với thực tế** (ví dụ: bug report "service Cloud Panel báo running nhưng thực tế stopped")
2. **Action mà Cloud Panel chưa support** (config sâu, install MSI…)
3. **Debug khi agent có vấn đề** (xem agent process còn chạy không, log agent ở đâu)
4. **Demo cho khách** xem "Cloud Panel hiển thị giống y Windows native"

## 2. Cần chuẩn bị gì?

Bạn cần **3 thông tin** từ provider VPS hoặc trang admin Cloud Panel:

| Thông tin | Ví dụ | Lấy ở đâu |
|---|---|---|
| **IP public** | `103.20.151.42` | Email provider gửi lúc tạo VPS, hoặc panel quản lý VPS |
| **Username** | `Administrator` | Mặc định Windows Server. Có thể có user phụ |
| **Password** | `S3cur3P@ssw0rd!` | Email lúc tạo VPS / reset trên panel |

**Port mặc định:** `3389` (TCP). Một số provider đổi sang port khác để tránh brute-force, kiểm tra email.

> ⚠️ **Yêu cầu network:** VPS phải mở port 3389 inbound cho IP của bạn. Nếu firewall block → request provider whitelist.

## 3. RDP từ Windows (đơn giản nhất)

Windows tích hợp sẵn client RDP gọi là **mstsc** (Microsoft Terminal Services Client).

### Bước 1 — Mở mstsc

3 cách:

- **Cách 1:** Bấm `Windows + R` → gõ `mstsc` → Enter
- **Cách 2:** Start menu → gõ "Remote Desktop Connection" → Enter
- **Cách 3:** Bấm `Windows` → gõ "remote" → chọn "Remote Desktop Connection"

### Bước 2 — Nhập thông tin

```
┌──────────────────────────────────────┐
│  Remote Desktop Connection           │
├──────────────────────────────────────┤
│                                      │
│  Computer:  [103.20.151.42       ▼]  │
│                                      │
│  User name: Administrator            │
│                                      │
│  [Show Options]    [Connect]         │
│                                      │
└──────────────────────────────────────┘
```

- **Computer:** nhập `IP:port` (nếu port ≠ 3389) → ví dụ `103.20.151.42:13389`
- **User name:** `Administrator`

Bấm **Connect**.

### Bước 3 — Nhập password

Hộp thoại credential hiện ra → nhập password.

> 💡 Tick "**Remember me**" nếu muốn lần sau không phải gõ lại (lưu trong Windows Credential Manager).

### Bước 4 — Bỏ qua cảnh báo certificate

Lần đầu connect, Windows hỏi:

```
The identity of the remote computer cannot be verified...
```

→ Tick "**Don't ask me again for connections to this computer**" → bấm **Yes**.

### Bước 5 — Đã vào!

Sau 5–10 giây bạn sẽ thấy desktop Windows Server của VPS.

## 4. RDP từ macOS

Microsoft phát hành **Microsoft Remote Desktop** miễn phí trên Mac App Store.

### Bước 1 — Cài app

Mở **App Store** → tìm "**Microsoft Remote Desktop**" → Install.

### Bước 2 — Thêm PC mới

Mở app → bấm nút **`+`** → chọn **Add PC**.

```
┌──────────────────────────────────────┐
│  Add PC                              │
├──────────────────────────────────────┤
│  PC name:    103.20.151.42           │
│  User account: Ask me every time     │
│  Friendly name: VPS-Demo             │
│  Group:      (none)                  │
│  Gateway:    No gateway              │
│                                      │
│  [Cancel]              [Add]         │
└──────────────────────────────────────┘
```

- **PC name:** `IP[:port]`
- **User account:** chọn `Add User Account` → nhập `Administrator` + password → Save
- **Friendly name:** đặt tên dễ nhớ (tùy chọn)

Bấm **Add**.

### Bước 3 — Connect

Tile VPS hiện ra → double-click → kết nối.

> ⚠️ **Cảnh báo cert tương tự Windows:** chọn **Continue**.

## 5. RDP từ Linux (Ubuntu/Debian/Fedora)

Có nhiều lựa chọn. Recommend **Remmina** (GUI, tiện nhất) hoặc **xfreerdp** (CLI, nhẹ).

### Option A — Remmina (GUI)

#### Cài đặt

```bash
# Ubuntu / Debian
sudo apt update
sudo apt install remmina remmina-plugin-rdp -y

# Fedora
sudo dnf install remmina remmina-plugins-rdp -y

# Arch
sudo pacman -S remmina freerdp
```

#### Sử dụng

1. Mở **Remmina** từ menu app.
2. Bấm nút **`+`** (New connection).
3. Điền form:
   - **Protocol:** `RDP - Remote Desktop Protocol`
   - **Server:** `103.20.151.42:3389`
   - **Username:** `Administrator`
   - **Password:** `***`
   - **Resolution:** `Use client resolution` (full màn hình)
   - **Color depth:** `True color (32 bpp)`
4. Bấm **Save and Connect**.

### Option B — xfreerdp (CLI, nhanh)

```bash
# Cài
sudo apt install freerdp2-x11 -y

# Connect
xfreerdp /v:103.20.151.42:3389 /u:Administrator /p:'S3cur3P@ssw0rd!' /size:1920x1080 /cert:ignore
```

Flags hữu ích:

- `/cert:ignore` — bỏ qua cảnh báo cert
- `/size:1920x1080` — kích thước cửa sổ
- `/f` — fullscreen (Ctrl+Alt+Enter để toggle)
- `/dynamic-resolution` — tự resize theo cửa sổ
- `/clipboard` — share clipboard 2 chiều
- `/drive:share,/home/$USER/Downloads` — mount folder local vào VPS

## 6. Khi đã vào desktop — Mở Services Manager

### Cách 1 — services.msc (recommend)

1. Trên desktop VPS, bấm `Windows + R` → hộp **Run** hiện ra.
2. Gõ: `services.msc` → Enter.

Cửa sổ **Services** hiện ra:

```
┌────────────────────────────────────────────────────────────────────────┐
│ File  Action  View  Help                                               │
├────────────────────────────────────────────────────────────────────────┤
│ Services (Local)                                                       │
│                                                                        │
│ Name                  Description           Status   Startup Type      │
│ ─────────────────────────────────────────────────────────────────────  │
│ AppXSvc               AppX Deployment...    Running  Manual            │
│ BITS                  Background Intelli... Running  Automatic (Delayed)│
│ Print Spooler         This service spool... Running  Automatic         │
│ MSSQLSERVER           Provides storage...   Running  Automatic         │
│ W3SVC                 Provides Web conn...  Running  Automatic         │
│ ...                                                                    │
└────────────────────────────────────────────────────────────────────────┘
```

Cột:

- **Name** = Display Name (tên hiển thị)
- **Description** = mô tả
- **Status** = `Running` / `Stopped` / `Paused`
- **Startup Type** = `Automatic` / `Manual` / `Disabled`
- **Log On As** = account chạy service (`Local System`, `Network Service`, `LocalService`, hoặc user cụ thể)

### Action trên service

Right-click 1 service → menu:

- **Start** / **Stop** / **Restart** / **Pause** / **Resume**
- **Properties** → xem chi tiết:
  - Tab **General:** path executable, startup type, current status
  - Tab **Log On:** account chạy
  - Tab **Recovery:** action khi service crash (restart, run program…)
  - Tab **Dependencies:** service nào phụ thuộc / phụ thuộc service nào

> 📌 **Đối chiếu với Cloud Panel:** Mỗi trường ở đây đều có trong Cloud Panel UI. Xem mapping ở [trang 07](./07-data-source-mapping.md).

### Cách 2 — PowerShell (cho dev)

```powershell
# Liệt kê tất cả services
Get-Service

# Filter theo trạng thái
Get-Service | Where-Object {$_.Status -eq 'Stopped'}

# Xem chi tiết
Get-Service -Name Spooler | Format-List *

# Start/Stop
Start-Service -Name Spooler
Stop-Service -Name Spooler
Restart-Service -Name Spooler

# Đổi startup type
Set-Service -Name Spooler -StartupType Automatic
```

### Cách 3 — Command Prompt cũ

```cmd
sc query Spooler
sc start Spooler
sc stop Spooler
sc config Spooler start= auto
```

## 7. Khi đã vào desktop — Mở Event Viewer

### Cách 1 — eventvwr.msc (recommend)

1. `Windows + R` → gõ `eventvwr.msc` → Enter.
2. Cửa sổ **Event Viewer** hiện ra:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Event Viewer                                                           │
├────────────────────────────────────────────────────────────────────────┤
│ ▼ Event Viewer (Local)                                                 │
│   ├─ Custom Views                                                      │
│   ▼ Windows Logs                                                       │
│   │  ├─ Application      ← log từ user app, MSSQL, custom...           │
│   │  ├─ Security         ← login, audit                                │
│   │  ├─ Setup                                                          │
│   │  ├─ System           ← kernel, driver, service                     │
│   │  └─ Forwarded Events                                               │
│   ▼ Applications and Services Logs                                     │
│      ├─ Hardware Events                                                │
│      ├─ Internet Explorer                                              │
│      ├─ Key Management Service                                         │
│      └─ Microsoft  (chứa hàng trăm sub-channel)                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Click vào 1 channel — VD: `Application`

```
┌────────────────────────────────────────────────────────────────────────┐
│ Level         Date and Time              Source        Event ID  Task  │
├────────────────────────────────────────────────────────────────────────┤
│ 🟠 Error      14/05/2026 10:23:11        Application   1000     (101) │
│ 🔵 Info       14/05/2026 10:22:58        MSSQLSERVER   17137    (2)   │
│ 🟡 Warning    14/05/2026 10:20:14        ESENT         642      (6)   │
│ ...                                                                    │
└────────────────────────────────────────────────────────────────────────┘
```

### Xem chi tiết 1 event

Double-click → hộp Event Properties:

```
┌────────────────────────────────────────────────────────────────────┐
│ General | Details                                                  │
├────────────────────────────────────────────────────────────────────┤
│ Faulting application name: chrome.exe, version: 124.0.6367.119     │
│ Faulting module name: ntdll.dll, version: 10.0.17763.5458          │
│ Exception code: 0xc0000005                                         │
│ ...                                                                │
│                                                                    │
│ Log Name:    Application                                           │
│ Source:      Application Error            Logged: 14/05/2026 10:23 │
│ Event ID:    1000                         Task Category: (101)     │
│ Level:       Error                        Keywords: Classic        │
│ User:        N/A                          Computer: WIN-VPS-01     │
│ OpCode:      Info                                                  │
│ More Info:   Event Log Online Help                                 │
└────────────────────────────────────────────────────────────────────┘
```

Tab **Details** → xem XML raw — đây chính là format **Agent Cloud Panel parse** để gửi về backend.

### Filter (tương đương filter Cloud Panel)

1. Right-click `Application` → **Filter Current Log...**
2. Chọn level: tick `Critical`, `Error`, `Warning`
3. Time range: `Last 24 hours`
4. EventID: `1000` (hoặc range `1000-2000`)
5. OK.

> 📌 **Đối chiếu:** Cloud Panel filter bar có hệt các option này — level, EventID, time range, source, text contains. Chi tiết [trang 05](./05-windows-event-log-deep-dive.md).

### Cách 2 — PowerShell Get-WinEvent

```powershell
# Lấy 100 event mới nhất từ Application
Get-WinEvent -LogName Application -MaxEvents 100

# Filter level Error
Get-WinEvent -LogName Application | Where-Object {$_.LevelDisplayName -eq 'Error'}

# Filter theo time
Get-WinEvent -FilterHashtable @{LogName='Application'; StartTime=(Get-Date).AddHours(-1)}

# Xem chi tiết 1 event (XML)
Get-WinEvent -LogName Application -MaxEvents 1 | Format-List *

# Export ra CSV
Get-WinEvent -LogName Application -MaxEvents 1000 |
  Select-Object TimeCreated, Id, LevelDisplayName, ProviderName, Message |
  Export-Csv -Path C:\temp\events.csv -NoTypeInformation
```

### Cách 3 — wevtutil (command cổ điển)

```cmd
:: Liệt kê channel
wevtutil el

:: Query event
wevtutil qe Application /c:10 /f:text /rd:true

:: Export ra file evtx
wevtutil epl Application C:\temp\app-backup.evtx
```

## 8. Vị trí raw log trên VPS

Sau khi vào RDP, bạn có thể mở File Explorer đến:

```
C:\Windows\System32\Winevt\Logs\
```

Sẽ thấy hàng trăm file `.evtx`:

```
Application.evtx                                       ← Channel Application
System.evtx                                            ← Channel System
Security.evtx                                          ← Channel Security (cần quyền admin)
Setup.evtx                                             ← Channel Setup
Microsoft-Windows-Diagnostics-Performance%4Operational.evtx
Microsoft-Windows-PrintService%4Operational.evtx
Microsoft-Windows-TerminalServices-RemoteConnectionManager%4Operational.evtx
...
```

> 💡 `%4` trong tên file = ký tự `/` (URL-encode) — Windows escape vì `/` không hợp lệ trong tên file NTFS.

Kích thước mỗi file thường giới hạn 20 MB (config được trong properties channel), khi đầy → rotate (xóa cũ hoặc archive).

## 9. Vị trí Cloud Panel Agent trên VPS

Khi cần check agent (debug, restart, xem log agent):

| Path | Là gì |
|---|---|
| `C:\Program Files\CloudPanelAgent\` | Folder cài đặt agent (binary, config) |
| `C:\Program Files\CloudPanelAgent\cloud-panel-agent.exe` | Binary agent |
| `C:\Program Files\CloudPanelAgent\.env` | Config (token, backend URL) — **không xóa** |
| `C:\ProgramData\CloudPanelAgent\logs\` | Log file agent ghi ra |

Agent chạy như 1 **Windows Service** tên `CloudPanelAgent`. Có thể start/stop/restart bằng `services.msc` như mọi service khác (hoặc PowerShell):

```powershell
Get-Service CloudPanelAgent
Restart-Service CloudPanelAgent
```

> 📌 Nếu agent dừng → mọi tính năng Cloud Panel cho VPS đó **đều fail** (event log không stream, service control báo `AGENT_OFFLINE`).

## 10. Checklist an toàn khi RDP

| ✅ Nên | ❌ Tránh |
|---|---|
| Logout đúng cách khi xong (Start → user icon → Sign out) | Đóng cửa sổ RDP bằng `X` (session vẫn tồn tại trên VPS) |
| Đổi password mặc định ngay sau lần đầu RDP | Dùng password yếu (123456, admin…) |
| Restrict RDP firewall chỉ IP văn phòng | Mở 3389 cho `0.0.0.0/0` |
| Bật MFA nếu provider hỗ trợ | Tick "Remember credentials" trên máy public |
| Mở file Word/Excel từ Cloud Panel UI, không drag từ máy local | Copy file lạ vào VPS (risk malware) |

> ⚠️ **Logout vs Disconnect:**
> - **Disconnect** (đóng cửa sổ) → session vẫn live, app vẫn chạy. Lần sau RDP lại sẽ resume session cũ.
> - **Sign out / Logout** → đóng session, app trong session dừng.
>
> Trong development thường dùng **Disconnect** để service test giữ nguyên state. Trong production để **Sign out** để giải phóng resource.

## 11. Tóm tắt

| Tác vụ | Lệnh / Tool |
|---|---|
| RDP từ Windows | `mstsc` |
| RDP từ macOS | App Store: Microsoft Remote Desktop |
| RDP từ Linux | `remmina` (GUI) hoặc `xfreerdp` (CLI) |
| Mở Services Manager | `Windows + R` → `services.msc` |
| Mở Event Viewer | `Windows + R` → `eventvwr.msc` |
| Liệt kê service (PowerShell) | `Get-Service` |
| Liệt kê event (PowerShell) | `Get-WinEvent -LogName Application -MaxEvents 100` |
| Folder raw event log | `C:\Windows\System32\Winevt\Logs\` |
| Folder Cloud Panel Agent | `C:\Program Files\CloudPanelAgent\` |

---

**Tiếp theo:** [03 — Kiến trúc tổng thể (FE — BE — Agent) →](./03-architecture-overview.md)
