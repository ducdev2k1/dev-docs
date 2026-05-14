# 03 — Kiến trúc tổng thể (FE — BE — Agent)

> Hiểu bức tranh lớn trước khi vào chi tiết từng tính năng. Trang này mô tả 3 lớp + cách chúng nói chuyện với nhau qua HTTP + Socket.IO.

## 1. Sơ đồ tổng quan

```
                        ┌────────────────────────────────────────────────┐
                        │                                                │
   USER BROWSER         │                BACKEND (Node.js, port 8003)    │
   ┌──────────┐         │   ┌────────────────────────────────────────┐   │
   │ Vue 3    │ HTTPS   │   │ Express REST API                       │   │
   │ TanStack │◄───────►│   │  /api/v1/user/hosts/...               │   │
   │ Query    │ Cookie  │   │                                        │   │
   │          │         │   ├────────────────────────────────────────┤   │
   │          │ Socket  │   │ Socket.IO Namespaces                   │   │
   │          │◄───────►│   │  /windows-services    (FE ↔ BE)        │   │
   │          │ /ns     │   │  /windows-event-log   (FE ↔ BE)        │   │
   └──────────┘ wss://  │   │  /agent-ws            (Agent ↔ BE)     │   │
   port 8015            │   ├────────────────────────────────────────┤   │
                        │   │ MongoDB                                │   │
                        │   │  windows_services_audit (TTL 30d)      │   │
                        │   │  windows_event_log_audit (TTL 90d)     │   │
                        │   │  event_alert_rule / event_alert_dedup  │   │
                        │   └────────────────────────────────────────┘   │
                        └─────────────────────┬──────────────────────────┘
                                              │
                                              │ Socket.IO outbound (agent dial out)
                                              │ wss://backend/agent-ws
                                              │
                        ┌─────────────────────▼──────────────────────────┐
                        │      VPS WINDOWS (customer)                    │
                        │   ┌────────────────────────────────────────┐   │
                        │   │ Cloud Panel Agent (Go, port 8080)      │   │
                        │   │  modules:                              │   │
                        │   │   - windows_services                   │   │
                        │   │   - windows_eventlog                   │   │
                        │   │   - (auth, ws-client, ...)             │   │
                        │   ├────────────────────────────────────────┤   │
                        │   │ Windows API (syscall)                  │   │
                        │   │  - golang.org/x/sys/windows/svc/mgr    │   │
                        │   │  - wevtapi.dll (EvtQuery, EvtNext)     │   │
                        │   └────────────────────────────────────────┘   │
                        └────────────────────────────────────────────────┘
```

## 2. Vai trò từng lớp

### Frontend (Vue 3) — `cloud-panel-client/`

| Thành phần | Vai trò |
|---|---|
| **Vue 3 + Vite** | Build & dev server |
| **TanStack Vue Query** | Cache server state, auto refetch, optimistic update |
| **axios** | HTTP request |
| **socket.io-client** | Realtime với BE qua namespace |
| **Vuetify 3 + iNET design tokens** | UI components |

**Không** gọi trực tiếp tới agent. Không biết IP agent, không có credential. Mọi request đi qua backend.

### Backend (Node.js) — `cloud-panel-backend/`

| Thành phần | Vai trò |
|---|---|
| **Express** | HTTP router |
| **Socket.IO server** | 3 namespace cho realtime |
| **Mongoose** | Truy cập MongoDB |
| **CASL** | Permission check |
| **Zod** | Validate input |

Backend là **gateway**:

1. Auth — verify session/token user
2. Ownership check — host này có thuộc user không
3. Validate — Zod check input
4. Routing — forward request tới đúng agent
5. Tracking — UUID correlation cho async response
6. Audit — ghi MongoDB
7. Alert — match event log với rule

### Agent (Go) — `cloud-panel-agent/`

| Thành phần | Vai trò |
|---|---|
| **socket.io-client (Go)** | Outbound connection tới backend `/agent-ws` |
| **`golang.org/x/sys/windows/svc/mgr`** | Service Control Manager (SCM) API |
| **`wevtapi.dll` syscall wrapper** | Event Log API |
| **Mutex/Semaphore** | Concurrency control |

Agent **outbound only** — connect ra backend, không lắng nghe inbound (trừ port 8080 cho local agent UI tùy chọn). Lợi:

- Không cần mở port public trên VPS
- Vượt qua NAT/firewall dễ dàng
- BE biết chính xác agent nào online (qua socket connection)

## 3. 3 Socket.IO Namespace

Cloud Panel dùng **namespace** (không phải multiplex trên root) để tách concern:

| Namespace | Chiều | Mục đích |
|---|---|---|
| `/agent-ws` | Agent ↔ BE | Agent gửi event, BE gửi command. Auth bằng agent token |
| `/windows-services` | FE ↔ BE | BE push realtime service status change cho FE |
| `/windows-event-log` | FE ↔ BE | BE stream live event log cho FE (sau khi FE subscribe) |

> 📌 Khác với HTTP, Socket.IO **duy trì connection** → push được. Backend dùng pattern **room** (`host:<hostId>`) để fan-out chỉ tới FE nào quan tâm host đó.

### Auth flow Socket.IO

| Namespace | Auth |
|---|---|
| `/agent-ws` | Agent gửi token (Resource Access Token) lúc handshake. BE verify với DB |
| `/windows-services` + `/windows-event-log` | FE gửi session cookie / JWT. BE decode + verify SSO |

### Pattern Room

```
io.of('/windows-services')
  .to('host:65f3a8b...')        ← room = host ID
  .emit('service_status_changed', payload)
```

FE join room sau khi check ownership bằng API. Nếu không thuộc owner → BE từ chối join (room_join_error).

## 4. Request Flow chuẩn — "Stop service Spooler"

### Step-by-step

```
┌─────────┐  ① HTTP POST   ┌──────────┐  ② Mongo  ┌──────────┐
│   FE    │ ──────────────►│    BE    │ ─────────►│  MongoDB │
│ (Vue 3) │                │ (Node)   │   audit   │  (audit) │
└────┬────┘                └────┬─────┘           └──────────┘
     │                          │
     │                          │ ③ Socket emit (windows_services_request)
     │                          │    namespace: /agent-ws
     │                          ▼
     │                     ┌──────────┐
     │                     │  Agent   │ ④ Windows API
     │                     │   (Go)   │ ─────────► mgr.OpenService("Spooler").Control(Stop)
     │                     │          │            pollUntil(Stopped, 60s)
     │                     └────┬─────┘
     │                          │ ⑤ Socket emit (windows_services_response)
     │                          ▼
     │                     ┌──────────┐
     │  ⑦ HTTP response    │    BE    │ ⑥ Socket emit (service_status_changed)
     │ ◄───────────────────│          │    namespace: /windows-services
     │                     └──────────┘    room: host:<id>
     │                                        │
     │ ⑧ Socket receive (service_status_changed) ◄────┘
     ▼
   UI cập nhật badge "Running" → "Stopped"
```

### Mô tả chi tiết từng bước

**① FE → BE: HTTP POST**

```
POST /api/v1/user/hosts/65f3a8b.../windows-services/Spooler/stop
Cookie: sid=...
Body: {}    (hoặc { confirm_token: "Spooler" } nếu là critical service)
```

**② BE: Audit + Validate**

- CASL check: `can('control', 'user:windows-service')` ?
- Ownership: host này thuộc `req.user.email` ?
- Critical guard: `Spooler` có trong blacklist ~20 service không? → Cần `confirm_token` ?
- Acquire mutex per (host, service) — chống concurrent stop/start

**③ BE → Agent: Socket emit qua `/agent-ws`**

```javascript
io.of('/agent-ws').to(agentSocketId).emit('windows_services_request', {
  request_id: 'uuid-...',
  op: 'stop',
  service_name: 'Spooler',
})
```

Backend giữ request_id trong **request tracker** (Map<uuid, Promise>), timeout 70s.

**④ Agent: Windows API**

```go
// pseudo-code
withLock(serviceName, func() {
  s, _ := mgr.OpenService("Spooler")
  s.Control(svc.Stop)
  pollUntil(svc.Stopped, 60*time.Second)
  return ActionResult{
    PrevStatus: "Running",
    NewStatus:  "Stopped",
    DurationMs: 1234,
    CompletedAt: time.Now(),
  }
})
```

**⑤ Agent → BE: Response**

```javascript
emit('windows_services_response', {
  request_id: 'uuid-...',
  ok: true,
  result: { prev_status: 'Running', new_status: 'Stopped', ... }
})
```

**⑥ BE → FE (mọi tab đang xem host này): Push realtime**

```javascript
io.of('/windows-services')
  .to(`host:${hostId}`)
  .emit('service_status_changed', { service_name: 'Spooler', status: 'Stopped' })
```

**⑦ BE → FE (tab vừa gửi request): HTTP response**

```json
{
  "values": {
    "service_name": "Spooler",
    "prev_status": "Running",
    "new_status": "Stopped",
    "duration_ms": 1234
  }
}
```

**⑧ FE: Update cache**

```typescript
// useWindowsServiceSocket.ts (giản lược)
socket.on('service_status_changed', (data) => {
  queryClient.setQueryData(['windows-services', hostId], (old) =>
    old.map(s => s.name === data.service_name ? { ...s, status: data.status } : s)
  )
})
```

→ UI re-render. Không cần refetch HTTP.

## 5. Tại sao kiến trúc này?

### Tại sao agent là **outbound only**?

- ✅ Không cần mở firewall inbound trên VPS
- ✅ Vượt qua NAT của customer
- ✅ Backend control authority — biết chính xác agent online
- ❌ Latency thêm 1 hop (FE → BE → Agent thay vì FE → Agent)
- ❌ BE thành single point of failure

### Tại sao không gọi PowerShell / sc.exe ?

Cloud Panel agent gọi **trực tiếp Windows API qua syscall**, không gọi `powershell.exe` / `sc.exe`. Lý do:

- ⚡ **Nhanh hơn 5–10x** — không spawn process mỗi request
- 🔒 **An toàn hơn** — không có command injection (không build string)
- 📊 **Data nguyên gốc** — XML từ wevtapi.dll, không phải text format mà PowerShell xuất ra
- 🎯 **Control chính xác** — set timeout, poll status, error code theo Win32 errno

### Tại sao Socket.IO mà không phải WebSocket thuần?

- ✅ Auto-reconnect
- ✅ Namespace + room (built-in)
- ✅ Ack callback (request-response over socket)
- ✅ Fallback long-polling cho mạng kém
- ✅ Có client library trong cả Go (agent) lẫn TS/JS (FE)

### Tại sao MongoDB cho audit, không log file?

- ✅ Query được — `db.windows_services_audit.find({ host_id, action: 'stop' })`
- ✅ TTL index auto-cleanup (30 ngày)
- ✅ Same stack với phần còn lại của Cloud Panel

### Tại sao **không lưu** event log vào MongoDB/TimescaleDB?

Đây là quyết định quan trọng! Event log:

- **Lượng dữ liệu khổng lồ** — 1 VPS có thể sinh hàng triệu event/ngày
- **Storage cost** quá lớn nếu lưu tất cả
- **Mỗi user quản lý hàng trăm VPS** (xem CLAUDE.md "Scale Assumption")

→ **Cloud Panel KHÔNG lưu event log raw**. Chỉ:

- Query / stream **on-demand** từ agent
- Lưu **audit** (ai query gì lúc nào, kết quả count bao nhiêu) vào `windows_event_log_audit` với TTL 90 ngày
- Lưu **alert đã trigger** vào `event_alert_dedup` (để dedup, TTL = dedup window)

Khi user mở UI → BE gửi request tới agent → agent đọc trực tiếp từ `.evtx` trên VPS → trả về. Event log gốc **không bao giờ rời khỏi VPS** (trừ khi user export CSV thủ công).

> 💡 Đây là khác biệt **rất quan trọng** giữa "Windows Service" (có lưu audit action) và "Event Log" (chỉ lưu audit query, không lưu data).

## 6. Tóm tắt

| Câu hỏi | Trả lời |
|---|---|
| User connect đâu? | `cloudpanel.inet.vn` (FE port 8015) |
| FE gọi gì? | HTTP `/api/v1/user/hosts/.../...` + Socket.IO 2 namespace |
| BE chạy đâu? | Server riêng, port 8003. Gateway cho mọi request |
| Agent ở đâu? | Cài trên VPS Windows của customer |
| Agent dial in hay out? | **Outbound** tới BE qua `/agent-ws` |
| Agent đọc data Windows bằng gì? | **Direct syscall** (`svc/mgr`, `wevtapi.dll`), không qua PowerShell |
| Audit lưu đâu? | MongoDB collection `windows_services_audit` (TTL 30d), `windows_event_log_audit` (TTL 90d) |
| Event log raw có lưu BE không? | **KHÔNG**. Chỉ pull on-demand từ agent. |
| Realtime mechanism? | Socket.IO namespace + room pattern (`host:<id>`) |
| Concurrency control? | Mutex 2 tầng: BE per (host, service) + Agent per service |
| Auth? | FE cookie/JWT, agent token (RAT) lúc handshake socket |
| Version yêu cầu? | Agent ≥ 2.4.0 cho Service realtime push, ≥ 2.0.0 cho Event Log |

---

**Tiếp theo:** [04 — Quản lý Windows Service (chi tiết) →](./04-windows-services-deep-dive.md)
