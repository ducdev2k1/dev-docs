# 09 — Tài liệu tham khảo

> Tổng hợp link, tool, và document để đào sâu thêm.

## 1. Microsoft official docs

### Windows Service

- [Services overview (Microsoft Learn)](https://learn.microsoft.com/en-us/windows/win32/services/services)
- [Service Control Manager](https://learn.microsoft.com/en-us/windows/win32/services/service-control-manager)
- [Service Configuration Functions](https://learn.microsoft.com/en-us/windows/win32/api/winsvc/)
- [Service Start Types](https://learn.microsoft.com/en-us/dotnet/api/system.serviceprocess.servicestartmode)
- [Manage services with sc.exe](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/sc-config)

### Windows Event Log

- [Windows Event Log API overview](https://learn.microsoft.com/en-us/windows/win32/wes/windows-event-log)
- [`wevtapi.dll` reference](https://learn.microsoft.com/en-us/windows/win32/api/winevt/)
  - `EvtQuery`, `EvtNext`, `EvtRender`, `EvtSubscribe`
- [XPath 1.0 query syntax for events](https://learn.microsoft.com/en-us/windows/win32/wes/consuming-events#querying-for-events)
- [Event level definitions](https://learn.microsoft.com/en-us/windows/win32/wes/eventmanifestschema-leveltype-complextype)
- [`Get-WinEvent` cmdlet](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.diagnostics/get-winevent)
- [`wevtutil` command line](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/wevtutil)

### EventID tra cứu

- [Ultimate Windows Security event encyclopedia](https://www.ultimatewindowssecurity.com/securitylog/encyclopedia/Default.aspx) — free, search EventID nhanh
- [eventid.net](https://www.eventid.net/) — community contributions cho hầu hết EventID

### Remote Desktop

- [Remote Desktop Connection (mstsc)](https://learn.microsoft.com/en-us/windows-server/remote/remote-desktop-services/clients/remote-desktop-clients)
- [Microsoft Remote Desktop for Mac](https://apps.apple.com/app/microsoft-remote-desktop/id1295203466)

## 2. Go libraries

- [`golang.org/x/sys/windows/svc`](https://pkg.go.dev/golang.org/x/sys/windows/svc) — Windows Service API
- [`golang.org/x/sys/windows/svc/mgr`](https://pkg.go.dev/golang.org/x/sys/windows/svc/mgr) — Service manager wrapper
- [`syscall.NewLazyDLL`](https://pkg.go.dev/syscall#NewLazyDLL) — Load Windows DLL từ Go
- [socketio-client-go](https://github.com/zhouhui8915/go-socket.io-client) — Socket.IO client Go (1 option; check repo cloud-panel-agent xem dùng lib nào)

## 3. Frontend libraries

- [Vue 3 docs](https://vuejs.org/)
- [TanStack Vue Query](https://tanstack.com/query/latest/docs/framework/vue/overview)
- [Vuetify 3](https://vuetifyjs.com/)
- [socket.io-client](https://socket.io/docs/v4/client-api/)

## 4. Backend libraries

- [Express](https://expressjs.com/)
- [Socket.IO server](https://socket.io/docs/v4/server-api/)
- [Mongoose](https://mongoosejs.com/docs/)
- [CASL](https://casl.js.org/v6/en/) — Permission framework
- [Zod](https://zod.dev/) — Schema validation

## 5. Internal docs (Cloud Panel repo)

> Path tham chiếu theo gốc monorepo `cloud-panel-application/`.

### Project rules

| File | Nội dung |
|---|---|
| `CLAUDE.md` | Overview repo + commands + architecture |
| `INFRA.md` | Topology server, private network |
| `.claude/rules/team-knowledge.md` | iNET 3S philosophy, CASL chain, agent status reason |
| `.claude/rules/backend-deployment-constraints.md` | Build local + bundle upload pattern |
| `.claude/rules/frontend-design-system.md` | iNET design tokens, mockup workflow |
| `.claude/rules/frontend-ui-components.md` | Vue SFC rules, SCSS BEM |
| `.claude/rules/frontend-error-handling.md` | useMutation toast rules |
| `.claude/rules/backend-error-handling.md` | Express controller pattern |
| `.claude/rules/socketio-conventions.md` | Namespace, rate limit, event naming |
| `.claude/rules/model-ownership-fields.md` | Ownership, audit fields, Zero Trust query |
| `.claude/rules/typescript-compliance.md` | Type/interface/naming conventions |
| `.claude/rules/frontend-i18n.md` | i18n auto-sync, CI gate |

### Module docs

| File | Nội dung |
|---|---|
| `cloud-panel-backend/src/modules/user/windows-services/windows-services.md` | Module Windows Services chi tiết |
| `cloud-panel-backend/src/modules/user/windows-event-log/windows-event-log.md` | Module Event Log chi tiết |
| `cloud-panel-backend/src/modules/user/event-alert-rule/event-alert-rule.md` | Module Alert Rule |
| `cloud-panel-backend/src/modules/user/agents/agents.md` | Agent status taxonomy |

### Plans (lịch sử thiết kế)

| Path | Nội dung |
|---|---|
| `plans/ducnd/.../windows-services-*` | Plan implement Windows Services |
| `plans/ducnd/.../windows-event-log-*` | Plan implement Event Log |
| `plans/ducnd/reports/Explore-260514-1634-windows-services-deep-dive.md` | Báo cáo scan deep dive (961 lines) |
| `plans/ducnd/reports/Explore-*-windows-event-log-*` | Báo cáo scan Event Log |

## 6. Tools hữu ích

### GUI

- [Process Hacker](https://processhacker.sourceforge.io/) — Service/process inspector tốt hơn Task Manager
- [Sysinternals Suite](https://learn.microsoft.com/en-us/sysinternals/) — Bộ công cụ debug Windows huyền thoại
  - `procmon` — Trace API call realtime
  - `procexp` — Process explorer mạnh
  - `psservice` — sc thay thế
- [Event Log Explorer](https://eventlogxp.com/) — Alternative cho `eventvwr.msc`

### CLI

- [PowerShell 7](https://github.com/PowerShell/PowerShell) — Cross-platform, syntax đẹp hơn PS 5
- [Windows Terminal](https://github.com/microsoft/terminal) — Terminal modern
- [mongosh](https://www.mongodb.com/docs/mongodb-shell/) — Mongo CLI
- [pm2](https://pm2.keymetrics.io/) — Process manager Node.js

### Browser DevTools

- Chrome DevTools → Application tab → Service Workers, Storage
- Network tab → filter WS để debug Socket.IO frames

## 7. Cheat sheet 1 trang

```
┌─────────────────────────────────────────────────────────────────────┐
│ CLOUD PANEL — WINDOWS SERVICE & EVENT LOG QUICK REFERENCE          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ RDP vào VPS                                                         │
│   Windows:  mstsc                                                   │
│   macOS:    App Store → Microsoft Remote Desktop                    │
│   Linux:    remmina  hoặc  xfreerdp /v:IP /u:Administrator         │
│                                                                     │
│ Mở UI Windows trên VPS                                              │
│   Services Manager:  Win+R → services.msc                          │
│   Event Viewer:      Win+R → eventvwr.msc                          │
│   Registry:          Win+R → regedit                                │
│                                                                     │
│ PowerShell commands                                                 │
│   Get-Service                                                       │
│   Start-Service -Name <X>                                           │
│   Stop-Service -Name <X>                                            │
│   Restart-Service -Name <X>                                         │
│   Set-Service -Name <X> -StartupType Automatic                      │
│   Get-WinEvent -LogName Application -MaxEvents 100                  │
│                                                                     │
│ Cloud Panel API                                                     │
│   GET    /api/v1/user/hosts/:id/windows-services                    │
│   POST   /api/v1/user/hosts/:id/windows-services/:name/start        │
│   POST   /api/v1/user/hosts/:id/windows-services/:name/stop         │
│   POST   /api/v1/user/hosts/:id/windows-event-log/query             │
│   GET    /api/v1/user/hosts/:id/windows-event-log/channels          │
│   POST   /api/v1/user/hosts/:id/windows-event-log/export            │
│                                                                     │
│ Socket.IO namespaces                                                │
│   /agent-ws            BE ↔ Agent                                   │
│   /windows-services    BE ↔ FE  (push status_changed)               │
│   /windows-event-log   BE ↔ FE  (live event stream)                 │
│                                                                     │
│ Mongo collections                                                   │
│   windows_services_audit         TTL 30 ngày                        │
│   windows_event_log_audit        TTL 90 ngày                        │
│   event_alert_rule               no TTL                             │
│   event_alert_dedup              TTL = dedup_window                 │
│   event_alert_circuit_breaker    TTL 1 giờ                          │
│                                                                     │
│ Agent yêu cầu                                                       │
│   Windows Service realtime push:  ≥ 2.4.0                           │
│   Event Log:                      ≥ 2.0.0                           │
│                                                                     │
│ Event Level                                                         │
│   1 Critical  2 Error  3 Warning  4 Information  5 Verbose          │
│                                                                     │
│ Vị trí file trên VPS                                                │
│   Event Log raw:        C:\Windows\System32\Winevt\Logs\*.evtx     │
│   Service config:       Registry HKLM\SYSTEM\...\Services\          │
│   Cloud Panel Agent:    C:\Program Files\CloudPanelAgent\           │
│   Agent log:            C:\ProgramData\CloudPanelAgent\logs\        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 8. Glossary

| Term | Định nghĩa |
|---|---|
| **Agent** | Chương trình Go cài trên VPS Windows, cầu nối FE/BE ↔ Windows API |
| **CASL** | Permission framework (BE + FE đồng bộ), check `can('action', 'subject')` |
| **Channel** | Phân loại Event Log (Application, System, Security, ...) |
| **CSCM** | Cloud Service Control Manager (joke, ý thực là SCM) |
| **Cursor pagination** | Phân trang bằng RecordID thay vì offset (resume-safe) |
| **Dedup** | Tránh spam alert cùng 1 sự kiện qua fingerprint |
| **Display Name** | Tên hiển thị của service (khác Service Name kỹ thuật) |
| **EventID** | Mã số sự kiện do vendor đặt, unique trong Provider+Channel |
| **`.evtx`** | Định dạng file binary Microsoft cho Event Log từ Vista trở đi |
| **mstsc** | Microsoft Terminal Services Client (Remote Desktop trên Windows) |
| **Namespace** | Socket.IO concept để tách concern (`/windows-services`, ...) |
| **RDP** | Remote Desktop Protocol, port 3389 |
| **RecordID** | Số đơn điệu tăng cho mỗi event, dùng làm cursor |
| **Room** | Socket.IO room, fan-out tới group cụ thể (VD `host:<id>`) |
| **SCM** | Service Control Manager (component Windows quản lý service) |
| **TanStack Query** | Vue Query lib, cache + auto refetch server state |
| **wevtapi.dll** | Windows Event API library |
| **XPath** | Query language Event Log filter (1.0 subset) |
| **Zero Trust** | Mọi endpoint verify ownership trước, không trust dựa vào ID |

## 9. Liên hệ & support

- **Tech lead:** anhtct@inet.vn
- **Repo GitLab:** `gitlabs.inet.vn/server-tools/cloud-panel-application`
- **Issue tracker:** trong GitLab project (tab Issues)
- **Telegram channel:** (internal team)

---

**Đã hết!** Bạn vừa hoàn thành tài liệu Cloud Panel Windows Service & Event Log. Quay về [README](./README) để xem index, hoặc bookmark trang này làm tham chiếu nhanh.
