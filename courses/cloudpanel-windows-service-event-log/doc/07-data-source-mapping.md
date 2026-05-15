# 07 — Data lấy từ đâu? Vị trí file & API mapping

> Trang **tham chiếu**. Mỗi data point hiển thị trên UI Cloud Panel → API nào → file code nào → lưu DB / không lưu / lấy từ đâu trên Windows.

## 1. Bản đồ tổng thể

```
                       ┌─────────────────────────────────────┐
                       │      Cloud Panel UI (FE Vue 3)      │
                       └─────────────┬───────────────────────┘
                                     │
                  ┌──────────────────┼────────────────────┐
                  │                  │                    │
                  ▼                  ▼                    ▼
        ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐
        │ HTTP REST    │   │ Socket.IO    │   │ Socket.IO        │
        │  /api/v1/... │   │ /windows-    │   │ /windows-        │
        │              │   │  services    │   │  event-log       │
        └──────┬───────┘   └──────┬───────┘   └──────┬───────────┘
               │                  │                  │
               ▼                  ▼                  ▼
        ┌────────────────────────────────────────────────────┐
        │           Backend (Node.js, port 8003)             │
        │  modules:                                          │
        │   - windows-services        (audit Mongo TTL 30d)  │
        │   - windows-event-log       (audit Mongo TTL 90d)  │
        │   - event-alert-rule        (CRUD + dedup TTL)     │
        └─────────────────────┬──────────────────────────────┘
                              │ Socket.IO /agent-ws
                              ▼
        ┌────────────────────────────────────────────────────┐
        │       Agent (Go, cài trên VPS Windows)             │
        └─────────────────────┬──────────────────────────────┘
                              │ syscall
                              ▼
        ┌────────────────────────────────────────────────────┐
        │            WINDOWS API + FILE SYSTEM               │
        │                                                    │
        │  Services: SCM (Service Control Manager)           │
        │            HKLM\SYSTEM\CurrentControlSet\Services\ │
        │                                                    │
        │  Event Log: wevtapi.dll → .evtx files              │
        │             C:\Windows\System32\Winevt\Logs\       │
        └────────────────────────────────────────────────────┘
```

## 2. Windows Service — Mapping bảng

### Service List

| UI element | API endpoint | BE file | Agent file | Windows source |
|---|---|---|---|---|
| Service table | `GET /api/v1/user/hosts/:id/windows-services` | `controller/windows-services.controller.ts` → `listWindowsServicesController` | `service/service_lister.go` → `ListServices()` | `mgr.ListServices()` → SCM enumerate, per service `OpenService()` + `Query()` + `Config()` |
| Cột `Name` | (same) | — | — | `ServiceName` (key trong registry) |
| Cột `Display Name` | (same) | — | — | `Config.DisplayName` |
| Cột `Status` | (same) | — | — | `Query().State` (Running/Stopped/Paused/...) |
| Cột `Startup Type` | (same) | — | — | `Config.StartType` (Automatic/Manual/Disabled) |
| Search/filter status | client-side filter | `composables/useWindowsServices.ts` | — | Filter trên data đã fetch (KHÔNG gọi lại API) |

### Service Detail

| UI element | API endpoint | Agent source | Windows source |
|---|---|---|---|
| Drawer chi tiết | `GET /:id/windows-services/:serviceName` | `service/service_config_reader.go` → `ReadConfig()` | `OpenService()` + `Config()` + `QueryServiceConfig2()` |
| Path executable | (same) | — | `Config.BinaryPathName` |
| Account chạy | (same) | — | `Config.ServiceStartName` (LocalSystem / NetworkService / user) |
| Description | (same) | — | `QueryServiceConfig2(SERVICE_CONFIG_DESCRIPTION)` |
| Dependencies | (same) | — | `Config.Dependencies` (string slice) |
| Dependents | (same) | `service/service_dependencies.go` | `EnumDependentServices()` |
| Recovery actions | (same) | — | `QueryServiceConfig2(SERVICE_CONFIG_FAILURE_ACTIONS)` |

### Service Action

| UI button | API endpoint | BE file | Agent file | Windows API |
|---|---|---|---|---|
| ▶ Start | `POST /:serviceName/start` | `windows-services.controller.ts` → `startWindowsServiceController` | `service/service_controller.go` → `StartService()` | `s.Start()` + poll |
| ⏹ Stop | `POST /:serviceName/stop` | `stopWindowsServiceController` | `StopService()` | `s.Control(svc.Stop)` + poll |
| 🔄 Restart | `POST /:serviceName/restart` | `restartWindowsServiceController` | `RestartService()` | Stop + Start sequential |
| ⏸ Pause | `POST /:serviceName/pause` | `pauseWindowsServiceController` | `PauseService()` | `s.Control(svc.Pause)` |
| ▶ Resume | `POST /:serviceName/resume` | `resumeWindowsServiceController` | `ResumeService()` | `s.Control(svc.Continue)` |
| ⚙ Set startup | `PATCH /:serviceName/startup` | `setStartupTypeController` | `service/startup_changer.go` | `s.UpdateConfig({StartType: ...})` |

### Realtime push

| Sự kiện | Socket.IO event | BE file | Agent file |
|---|---|---|---|
| Service status changed | `service_status_changed` trên `/windows-services` room `host:<id>` | `socket/windows-services-socket.handler.ts` | `handler/windows_services_ws_handler.go` emit `windows_services_status_changed` |

### Audit (lưu MongoDB)

| Data point | Collection | TTL | Index |
|---|---|---|---|
| Mọi mutation (start/stop/...) | `windows_services_audit` | 30 ngày | `{ host_id: 1, owner: 1, created_at: -1 }` |
| List/Get | **KHÔNG audit** (read-only) | — | — |

## 3. Event Log — Mapping bảng

### Event Query (Pull)

| UI element | API endpoint | BE file | Agent file | Windows source |
|---|---|---|---|---|
| Event table | `POST /api/v1/user/hosts/:id/windows-event-log/query` | `controller/windows-event-log.controller.ts` → `queryController` | `service/windows_eventlog_service.go` → `Query()` | `EvtQuery()` + `EvtNext()` + `EvtRender()` → XML |
| Channel dropdown | `GET /api/v1/user/hosts/:id/windows-event-log/channels` | `getChannelsController` | `service/windows_eventlog_service.go` → `ListChannels()` | `EvtOpenChannelEnum()` + `EvtNextChannelPath()` |
| Cột `Time` | `/query` response field `time` | — | `event_xml_parser.go` extract `System/TimeCreated[@SystemTime]` | XML: `<TimeCreated SystemTime="..."/>` |
| Cột `Level` | response field `level` | — | `event_xml_parser.go` extract `System/Level` | XML: `<Level>2</Level>` |
| Cột `Source` | response field `source` | — | extract `System/Provider[@Name]` | XML: `<Provider Name="..."/>` |
| Cột `Event ID` | response field `event_id` | — | extract `System/EventID` | XML: `<EventID>1000</EventID>` |
| Cột `Message` (truncated) | response field `message_short` | `service/windows-event-log-mapper.service.ts` | `event_xml_parser.go` (truncate 512) | XML: `<Data Name="param1">...</Data>` joined + format string |
| Drawer Detail `EventData` | response field `event_data` (map) | — | extract `EventData/Data` array | XML: `<EventData><Data Name="X">Y</Data></EventData>` |
| Drawer `Record ID` | response field `record_id` | — | extract `System/EventRecordID` | XML: `<EventRecordID>4839271</EventRecordID>` |
| Stats card (count theo level) | client-side aggregate | `composables/useWindowsEventLogStream.ts` | — | Tính trong store/composable, không API riêng |

### Filter ↔ XPath mapping

| FE filter | API field | Agent XPath sinh ra |
|---|---|---|
| Levels checkbox | `filter.levels: [1,2]` | `(Level=1 or Level=2)` |
| EventID range | `filter.event_ids: [4625]` | `(EventID=4625)` |
| Time range | `filter.time_range: {from, to}` | `TimeCreated[@SystemTime>='...' and @SystemTime<='...']` |
| Source contains | `filter.source: "Application"` | `Provider[@Name='...']` (exact, agent filter sau khi parse XML) |
| Text contains | `filter.text_contains: "chrome"` | (KHÔNG có trong XPath, agent grep trong message_short sau parse) |
| Load more | `cursor.record_id_after: 4839200` | `EventRecordID > 4839200` |

> 📌 `text_contains` không nhúng được vào XPath vì Windows Event Log XPath 1.0 không hỗ trợ substring trên `<Data>`. Agent filter sau khi parse XML.

### Live Stream

| UI action | Socket event | BE file | Agent file | Windows mechanism |
|---|---|---|---|---|
| Bật Live toggle | FE emit `subscribe` qua `/windows-event-log` | `socket/windows-event-log-event.handler.ts` | `handler/windows_eventlog_ws_handler.go` start goroutine `subscription_manager.go` | Polling `EvtQuery()` mỗi 2s với cursor `EventRecordID > last_seen` |
| Event mới tới | BE emit `eventlog:event` về FE | `service/windows-event-log-subscription.service.ts` → `onAgentEvent()` | Agent emit `windows_eventlog_stream_event` | (poll discovered) |
| Bị drop | BE emit `eventlog:dropped` | (same) | Agent emit `windows_eventlog_dropped` khi token bucket empty | (rate-limited) |
| Tắt Live | FE emit `unsubscribe` | `subscription_manager.go` cancel context | (goroutine exit) | (stop polling) |

### Export CSV

| UI action | API endpoint | BE file | Agent file | Note |
|---|---|---|---|---|
| Click "Export CSV" | `POST /:id/windows-event-log/export` | `controller/windows-event-log.controller.ts` → `exportController` → `windows-event-log-export.service.ts` → `csv-exporter.service.ts` | `Query()` (loop tới khi đủ 10k hoặc hết) | Hard cap **10,000 row**, vượt → `EXPORT_TOO_LARGE` (400) |

### Audit (lưu MongoDB)

| Data point | Collection | TTL | Lưu gì |
|---|---|---|---|
| `query` action | `windows_event_log_audit` | 90 ngày | host_id, filter_summary, **result_count** (KHÔNG lưu events) |
| `export` action | (same) | 90 ngày | (same) + có thêm `result_count` ≤ 10000 |
| `subscribe` action | (same) | 90 ngày | host_id, channel, filter_summary |
| **Event log raw** | **KHÔNG LƯU** | — | Chỉ pull on-demand từ agent / live stream |

## 4. Alert Rules — Mapping bảng

| UI element | API endpoint | BE file | Storage |
|---|---|---|---|
| Rules list | `GET /api/v1/user/alert-rules` | `controller/event-alert-rule.controller.ts` | Mongo `event_alert_rule` (no TTL) |
| Create/update rule | `POST` / `PUT /api/v1/user/alert-rules/:id` | (same) | (same) |
| Test rule (preview match) | `POST /api/v1/user/alert-rules/:id/test` | `service/alert-evaluator.service.ts` | (no persist) |
| Disable rule | `PATCH /api/v1/user/alert-rules/:id/disable` | (same) | Mongo update `enabled: false` |
| Dedup state | (internal, no API) | `service/alert-fingerprint.service.ts` | Mongo `event_alert_dedup` (TTL = window) |
| Circuit breaker state | (internal) | (internal) | Mongo `event_alert_circuit_breaker` (TTL 1h) |
| Notification dispatch | (no API, fire-and-forget) | `service/alert-channel-dispatcher.service.ts` | Push qua /notifications (in-app), email worker queue, Telegram API, Web Push |

## 5. Vị trí raw data trên VPS Windows

### Service config

Windows lưu service config trong Registry:

```
HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\<ServiceName>
├── ImagePath      ← path executable
├── DisplayName
├── Start          ← startup type (0=Boot, 1=System, 2=Auto, 3=Manual, 4=Disabled)
├── Type           ← service type
├── DependOnService
└── Parameters\   ← config app-specific
```

→ Có thể mở **regedit** trên VPS để xem (PowerShell: `Get-ItemProperty HKLM:\SYSTEM\CurrentControlSet\Services\Spooler`).

Agent **không đọc Registry trực tiếp** mà gọi SCM API. SCM nội bộ đọc registry này.

### Event log files

```
C:\Windows\System32\Winevt\Logs\
├── Application.evtx
├── System.evtx
├── Security.evtx                                                    ← cần admin để đọc
├── Setup.evtx
├── Microsoft-Windows-PrintService%4Operational.evtx
├── Microsoft-Windows-TerminalServices-RemoteConnectionManager%4Operational.evtx
├── Microsoft-Windows-WindowsUpdateClient%4Operational.evtx
└── ... (hàng trăm file)
```

**File format:** Binary, schema riêng của Microsoft. **Không đọc trực tiếp được**, phải qua API (`wevtapi.dll`) hoặc tool (`eventvwr.msc`, `wevtutil`, PowerShell `Get-WinEvent`).

**Size limit:** Mặc định 20 MB/channel (config trong `eventvwr.msc` → channel properties). Đầy → tự rotate.

### Cloud Panel Agent

```
C:\Program Files\CloudPanelAgent\
├── cloud-panel-agent.exe          ← binary Go
├── .env                            ← config (token, backend URL)
└── (some support DLLs)

C:\ProgramData\CloudPanelAgent\
└── logs\
    ├── agent.log                   ← log chính
    ├── error.log
    └── access.log
```

Agent chạy như Windows Service tên **`CloudPanelAgent`** → có thể start/stop bằng `services.msc` hoặc Cloud Panel UI (đệ quy lúc cài đặt!).

## 6. Bảng tóm tắt lưu trữ

| Loại data | Lưu ở đâu? | TTL | Privacy note |
|---|---|---|---|
| Service config (raw) | Windows Registry trên VPS | — | Không rời VPS |
| Service status (current) | Windows SCM (memory) | — | Đọc on-demand qua API |
| Service action audit | Mongo `windows_services_audit` | 30 ngày | Lưu BE |
| Event log raw | `.evtx` file trên VPS | Auto-rotate khi đầy (20MB) | Không lưu BE |
| Event log query audit | Mongo `windows_event_log_audit` | 90 ngày | Lưu BE (filter + count, KHÔNG lưu event) |
| Event log export CSV | Blob trả về FE, FE download | — | Không lưu server-side |
| Alert rule | Mongo `event_alert_rule` | — (no TTL) | User-defined, lưu BE |
| Alert dedup | Mongo `event_alert_dedup` | = dedup_window_minutes | TTL theo rule |
| Alert circuit breaker | Mongo `event_alert_circuit_breaker` | 1 giờ | TTL fixed |
| Notification (email/Telegram đã gửi) | — | — | Bắn fire-and-forget, không lưu lịch sử |

## 7. Câu hỏi thường gặp

**Q: Cloud Panel có lưu event log của tôi không?**

→ **Không**. Event log raw nằm hoàn toàn trên VPS. Cloud Panel chỉ lưu audit (bạn đã query gì, kết quả bao nhiêu event match) trong 90 ngày. Khi bạn đóng tab UI, event log không được lưu lại đâu cả.

**Q: Nếu xóa VPS, có lấy lại được service action audit không?**

→ Có. Audit lưu Mongo của Cloud Panel, không phụ thuộc VPS. TTL 30 ngày kể từ lúc action.

**Q: Alert đã fire có lưu lịch sử không?**

→ Hiện chưa lưu lịch sử alert đầy đủ (chỉ có `last_triggered_at` trên rule). Notification gửi đi xong là xong (fire-and-forget). Lý do: KISS, đa số user xem alert qua Telegram/email là đủ.

**Q: Sao agent đọc data Windows mà không cần password admin?**

→ Agent cài như Windows Service chạy với **LocalSystem account** (mặc định khi install MSI). LocalSystem có quyền đọc hầu hết Windows API gồm SCM + wevtapi. Channel `Security` yêu cầu thêm "SeSecurityPrivilege" — LocalSystem có sẵn.

**Q: Nếu BE restart, subscription Event Log có mất không?**

→ Có. Subscription registry là **in-memory** (xem `windows-event-log-subscription.service.ts`), không persist. FE sẽ tự reconnect và subscribe lại sau khi BE up trở lại.

**Q: Tại sao có audit cho event log query nếu không lưu event?**

→ Để biết:
- User nào đã query gì lúc nào (compliance)
- Pattern usage (channel nào hay xem)
- Debug performance (filter nào trả về nhiều event)
- Forensic khi có incident (ai đã xem log gì)

---

**Tiếp theo:** [08 — Troubleshooting & debug →](./08-troubleshooting)
