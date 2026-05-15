# 04 — Quản lý Windows Service (chi tiết)

> Đi sâu vào tính năng quản lý Windows Service: UI, API endpoints, code path 3 lớp, mutex strategy, critical service guard, error handling.

## 1. User flow — Trên UI Cloud Panel

### Vào trang Services của 1 host

1. Đăng nhập Cloud Panel
2. Menu trái → **Hosts** → chọn 1 VPS Windows
3. Tab **Windows Services**

### UI components

```
┌────────────────────────────────────────────────────────────────────────┐
│ Windows Services — VPS-DEMO-01                              [Refresh]  │
├────────────────────────────────────────────────────────────────────────┤
│ [🔍 Search] [Status: All ▼] [Startup: All ▼]                           │
├────────────────────────────────────────────────────────────────────────┤
│ Name           Display Name          Status     Startup     Actions    │
│ ─────────────────────────────────────────────────────────────────────  │
│ Spooler        Print Spooler         🟢 Running Automatic   [⏹][🔄][⚙] │
│ wuauserv       Windows Update        🔴 Stopped Manual      [▶][⚙]     │
│ W3SVC          IIS Web Server        🟢 Running Automatic   [⏹][🔄][⚙] │
│ MSSQLSERVER    SQL Server            🟢 Running Automatic   [⏹][🔄][⚙] │
│ ...                                                                    │
└────────────────────────────────────────────────────────────────────────┘
```

| Element | Vai trò |
|---|---|
| Search box | Filter theo Name hoặc Display Name (client-side filter) |
| Status filter | All / Running / Stopped / Paused |
| Startup filter | All / Automatic / Manual / Disabled |
| Refresh button | Force refetch (bypass cache) |
| Row action | ▶ Start / ⏹ Stop / 🔄 Restart / ⏸ Pause / ⚙ Detail |

### Detail Drawer

Click ⚙ → drawer mở từ phải hiển thị:

- Path executable
- Account chạy (Log On As)
- Description
- **Dependencies** — service nào phải chạy trước
- **Dependents** — service nào sẽ ảnh hưởng nếu stop service này
- Recovery actions (config khi crash)

### Critical Service Confirm Dialog

Khi user stop **service hệ thống quan trọng** (Explorer, lsass, svchost…), 1 dialog hiện ra:

```
┌────────────────────────────────────────────────────────────────┐
│ ⚠️ Cảnh báo dịch vụ hệ thống                                   │
├────────────────────────────────────────────────────────────────┤
│ "lsass" là dịch vụ critical. Tắt nó có thể khiến VPS không     │
│ hoạt động bình thường, mất kết nối RDP, hoặc cần boot lại.     │
│                                                                │
│ Để xác nhận, gõ chính xác tên service bên dưới:                │
│                                                                │
│  [_________________________________]                           │
│  Phải gõ: lsass                                                │
│                                                                │
│           [Hủy]                  [Tôi hiểu, vẫn tắt]           │
└────────────────────────────────────────────────────────────────┘
```

User phải gõ đúng tên (case-sensitive) → mới enable nút confirm.

## 2. API Endpoints

Base: `/api/v1/user/hosts/:hostId/windows-services`

| Method | Path | CASL | Mô tả |
|---|---|---|---|
| `GET` | `/` | `list` | Liệt kê tất cả services |
| `GET` | `/:serviceName` | `get` | Chi tiết 1 service |
| `POST` | `/:serviceName/start` | `control` | Start service |
| `POST` | `/:serviceName/stop` | `control` | Stop service (cần `confirm_token` nếu critical) |
| `POST` | `/:serviceName/restart` | `control` | Restart (Stop + Start) |
| `POST` | `/:serviceName/pause` | `control` | Pause (chỉ vài service hỗ trợ) |
| `POST` | `/:serviceName/resume` | `control` | Resume từ paused |
| `PATCH` | `/:serviceName/startup` | `set_startup` | Đổi startup type |

### Request body (cho mutation)

```json
{
  "confirm_token": "lsass"
}
```

`confirm_token` chỉ bắt buộc khi service nằm trong blacklist **VÀ** action là `stop` / `restart` / `set_startup`. Giá trị phải = `serviceName` (case-sensitive).

### Response thành công

```json
{
  "values": {
    "service_name": "Spooler",
    "prev_status": "Running",
    "new_status": "Stopped",
    "duration_ms": 1234,
    "completed_at": "2026-05-14T08:23:45.678Z"
  }
}
```

### Error codes

| Agent error | HTTP status | Khi nào |
|---|---|---|
| `SERVICE_NOT_FOUND` | 404 | Tên service không tồn tại |
| `INVALID_SERVICE_NAME` | 404 | Tên không hợp lệ (regex check) |
| `ACTION_IN_PROGRESS` | 409 | Service đang được control bởi request khác |
| `ACCESS_DENIED` | 403 | Agent không đủ quyền (Windows ACL) |
| `DEPENDENTS_RUNNING` | 422 | Stop fail vì có service khác phụ thuộc |
| `SERVICE_NOT_PAUSABLE` | 422 | Service không hỗ trợ pause |
| `INVALID_STARTUP_TYPE` | 422 | Startup type không hợp lệ |
| `ACTION_TIMEOUT` | 503 | Quá 60s vẫn không chuyển state |
| `RESTART_PARTIAL_FAILURE` | 207 | Stop OK nhưng Start fail |
| `CRITICAL_SERVICE_REQUIRES_CONFIRM_TOKEN` | 400 | Thiếu hoặc sai confirm_token |
| `AGENT_OFFLINE` | 503 | Agent disconnect |

## 3. Code path — Backend

### Module path

```
cloud-panel-backend/src/modules/user/windows-services/
├── route/
│   └── windows-services.router.ts                    ← Đăng ký route
├── controller/
│   └── windows-services.controller.ts                ← 8 HTTP handler
├── service/
│   ├── windows-services.service.ts                   ← Orchestrator chính
│   ├── windows-services-bridge.service.ts            ← Emit tới agent qua socket
│   ├── windows-services-critical-guard.service.ts    ← Check blacklist + confirm_token
│   ├── windows-services-request-tracker.service.ts   ← UUID correlation map
│   ├── windows-services-mutex.service.ts             ← Per (host, service) lock
│   ├── windows-services-host-validator.service.ts    ← Check host Windows + agent active
│   └── windows-services-audit-helper.service.ts      ← Insert MongoDB audit
├── repository/
│   └── windows-services-audit.repository.ts          ← Mongoose model + TTL
├── socket/
│   ├── windows-services-namespace.handler.ts         ← Setup /windows-services namespace
│   └── windows-services-socket.handler.ts            ← Handle subscribe/unsubscribe
└── types/
    └── windows-services.types.ts                     ← Interface + Zod schema
```

### Controller (ví dụ)

```typescript
// windows-services.controller.ts (giản lược)
export const stopWindowsServiceController = async (req, res) => {
  try {
    const { hostId, serviceName } = req.params
    const { confirm_token } = req.body
    const auth = req.body.authentication as IAccount

    const result = await windowsServicesService.stop({
      host_id: hostId,
      service_name: serviceName,
      confirm_token,
      user_email: auth.email,
    })

    if ('error' in result) return responseError(result, res)
    return responseSuccess(result, res)
  } catch (e) {
    return responseError(handleObjectError(e), res)
  }
}
```

### Service orchestrator (luồng chính)

```typescript
// windows-services.service.ts (pseudo-code)
async stop({ host_id, service_name, confirm_token, user_email }) {
  // 1. Validate host (Windows OS, agent active)
  const host = await hostValidator.validate(host_id, user_email)
  if ('error' in host) return host

  // 2. Critical guard
  const guardResult = criticalGuard.check(service_name, 'stop', confirm_token)
  if (!guardResult.ok) return guardResult.error

  // 3. Acquire mutex per (host, service)
  const lock = await mutex.tryAcquire(host_id, service_name, 5000)
  if (!lock) return { error: 'ACTION_IN_PROGRESS', status: 409 }

  try {
    // 4. Tạo request ID + register tracker
    const request_id = uuid()
    const promise = requestTracker.register(request_id, 70_000)

    // 5. Emit tới agent qua /agent-ws
    bridge.emitToAgent(host.agent_id, 'windows_services_request', {
      request_id, op: 'stop', service_name,
    })

    // 6. Đợi response
    const response = await promise
    if (!response.ok) return { error: response.error_code, status: mapErrorToStatus(response.error_code) }

    // 7. Audit insert
    await auditHelper.insert({
      host_id, owner: user_email, action: 'stop', service_name,
      status: 'success', result: response.result,
    })

    // 8. Emit realtime push tới FE
    io.of('/windows-services').to(`host:${host_id}`)
      .emit('service_status_changed', response.result)

    return response.result
  } finally {
    lock.release()
  }
}
```

### Critical Guard

```typescript
// windows-services-critical-guard.service.ts (giản lược)
const CRITICAL_SERVICES = new Set([
  'lsass', 'csrss', 'wininit', 'services', 'winlogon',
  'svchost', 'Explorer', 'RpcSs', 'TermService', 'Dnscache',
  'EventLog', 'Schedule', 'WinDefend', 'CryptSvc', /* ... ~20 */
])

const CRITICAL_ACTIONS = new Set(['stop', 'restart', 'set_startup'])

export function check(serviceName: string, action: string, confirmToken?: string) {
  const isCritical = CRITICAL_SERVICES.has(serviceName)
  const needsConfirm = isCritical && CRITICAL_ACTIONS.has(action)

  if (needsConfirm && confirmToken !== serviceName) {
    return {
      ok: false,
      error: {
        error: 'Service hệ thống yêu cầu confirm_token',
        code: 'CRITICAL_SERVICE_REQUIRES_CONFIRM_TOKEN',
        status: 400,
      },
    }
  }
  return { ok: true }
}
```

### Request Tracker (UUID correlation)

Tại sao cần? Vì Socket.IO không có "request-response" pattern như HTTP. Backend emit `windows_services_request` → agent xử lý xong emit `windows_services_response`. BE phải khớp 2 message bằng `request_id`.

```typescript
// windows-services-request-tracker.service.ts (giản lược)
const pending = new Map<string, { resolve, reject, timer }>()

export function register(request_id: string, timeout_ms: number): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(request_id)
      reject({ ok: false, error_code: 'REQUEST_TIMEOUT' })
    }, timeout_ms)
    pending.set(request_id, { resolve, reject, timer })
  })
}

// Khi agent response về:
export function resolve(request_id: string, payload: any) {
  const entry = pending.get(request_id)
  if (!entry) return  // Đã timeout
  clearTimeout(entry.timer)
  pending.delete(request_id)
  entry.resolve(payload)
}
```

## 4. Code path — Agent (Go)

### Module path

```
cloud-panel-agent/src/modules/windows_services/
├── service/
│   ├── windows_services_service.go     ← Execute dispatcher (switch on Op)
│   ├── service_controller.go           ← Start/Stop/Pause/Resume + poll
│   ├── service_lister.go               ← List + parallel fanout
│   ├── service_mutex.go                ← Per-service lock (TryLock 5s)
│   ├── startup_changer.go              ← Set startup type
│   ├── service_config_reader.go        ← Read config (path, account, deps)
│   └── service_action_result.go        ← Result builder
├── handler/
│   └── windows_services_ws_handler.go  ← Receive socket event, dispatch
└── types/
    ├── service_request.go
    └── service_response.go
```

### Windows API wrapper

```go
// service_controller.go (giản lược)
package service

import (
    "golang.org/x/sys/windows/svc"
    "golang.org/x/sys/windows/svc/mgr"
    "time"
)

func StopService(name string, timeout time.Duration) (*ActionResult, error) {
    m, err := mgr.Connect()
    if err != nil {
        return nil, ErrCannotOpenSCM
    }
    defer m.Disconnect()

    s, err := m.OpenService(name)
    if err != nil {
        return nil, ErrServiceNotFound
    }
    defer s.Close()

    prevStatus, _ := s.Query()
    startedAt := time.Now()

    // Gửi STOP control
    _, err = s.Control(svc.Stop)
    if err != nil {
        return nil, mapWin32Error(err)
    }

    // Poll đến khi service Stopped (250ms intervals)
    for time.Since(startedAt) < timeout {
        status, _ := s.Query()
        if status.State == svc.Stopped {
            return &ActionResult{
                PrevStatus:  stateToString(prevStatus.State),
                NewStatus:   "Stopped",
                DurationMs:  time.Since(startedAt).Milliseconds(),
                CompletedAt: time.Now().UTC(),
            }, nil
        }
        time.Sleep(250 * time.Millisecond)
    }
    return nil, ErrActionTimeout
}
```

### List với parallel fanout

List service có thể có 300+ service trên 1 VPS. Nếu sequential → mất ~5s. Agent dùng **semaphore=16** để parallel:

```go
// service_lister.go (giản lược)
func ListServices() ([]ServiceEntry, error) {
    m, _ := mgr.Connect()
    defer m.Disconnect()

    names, _ := m.ListServices()  // Trả về []string

    sem := make(chan struct{}, 16)
    var wg sync.WaitGroup
    results := make([]ServiceEntry, len(names))

    for i, name := range names {
        wg.Add(1)
        sem <- struct{}{}
        go func(idx int, n string) {
            defer wg.Done()
            defer func() { <-sem }()

            s, err := m.OpenService(n)
            if err != nil {
                results[idx] = ServiceEntry{Name: n, Status: "Unknown"}
                return
            }
            defer s.Close()

            status, _ := s.Query()
            config, _ := s.Config()
            results[idx] = ServiceEntry{
                Name:        n,
                DisplayName: config.DisplayName,
                Status:      stateToString(status.State),
                StartupType: startupToString(config.StartType),
                /* ... */
            }
        }(i, name)
    }
    wg.Wait()
    return results, nil
}
```

> 💡 Tại sao 16? Cân bằng giữa tốc độ vs handle exhaustion (Windows hạn chế số handle SCM mở đồng thời).

### Per-service mutex (defense in depth)

```go
// service_mutex.go
var serviceMutex sync.Map  // map[string]*sync.Mutex

func WithLock(serviceName string, timeout time.Duration, fn func() (*ActionResult, error)) (*ActionResult, error) {
    mu, _ := serviceMutex.LoadOrStore(serviceName, &sync.Mutex{})
    mutex := mu.(*sync.Mutex)

    done := make(chan struct{})
    go func() {
        mutex.Lock()
        close(done)
    }()

    select {
    case <-done:
        defer mutex.Unlock()
        return fn()
    case <-time.After(timeout):
        return nil, ErrActionInProgress
    }
}
```

Backend đã có mutex per (host, service) — tại sao agent vẫn cần? **Defense in depth**: nếu backend crash giữa chừng và restart, mutex BE mất. Mutex agent đảm bảo VPS không bị 2 request stop cùng lúc.

## 5. Code path — Frontend (Vue 3)

### Module path

```
cloud-panel-client/src/modules/windows-services/
├── services/
│   └── windows-services.service.ts            ← HTTP API
├── composables/
│   ├── useWindowsServices.ts                  ← TanStack Query (list + detail)
│   ├── useWindowsServiceAction.ts             ← Mutations (start/stop/...)
│   └── useWindowsServiceSocket.ts             ← Socket listener
├── components/
│   ├── WindowsServicesPage.vue                ← Page chính
│   ├── WindowsServicesTable.vue               ← Data table
│   ├── WindowsServicesFilterBar.vue           ← Filter
│   ├── WindowsServiceDetailDrawer.vue         ← Drawer chi tiết
│   ├── WindowsServiceConfirmDialog.vue        ← Dialog critical confirm
│   ├── WindowsServiceStatusBadge.vue          ← Badge "Running"/"Stopped"
│   ├── WindowsServiceStartupBadge.vue
│   ├── WindowsServiceActionMenu.vue           ← Menu Start/Stop/Restart
│   ├── WindowsServiceDependenciesList.vue     ← Tab Dependencies
│   └── WindowsServiceErrorState.vue
└── types/
    └── windows-services.types.ts
```

### Service layer (HTTP)

```typescript
// windows-services.service.ts (giản lược)
export const windowsServicesService = {
  async list(hostId: string): Promise<IWindowsService[] | null> {
    try {
      const res = await apiService.get<IWindowsService[]>(
        `/api/v1/user/hosts/${hostId}/windows-services`
      )
      return extractList<IWindowsService>(res.values)
    } catch {
      return null   // useQuery handle error state
    }
  },

  async stop(hostId: string, serviceName: string, confirmToken?: string) {
    // KHÔNG try/catch — useMutation xử lý
    const res = await apiService.post<IWindowsServiceActionResult>(
      `/api/v1/user/hosts/${hostId}/windows-services/${serviceName}/stop`,
      confirmToken ? { confirm_token: confirmToken } : {}
    )
    return unwrapSingle<IWindowsServiceActionResult>(res.values)
  },
}
```

### TanStack Query composable

```typescript
// useWindowsServices.ts (giản lược)
export function useWindowsServices(hostId: Ref<string>) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['windows-services', hostId],
    queryFn: () => windowsServicesService.list(hostId.value),
    staleTime: 30_000,    // 30s stale before refetch
    enabled: computed(() => !!hostId.value),
  })
  return { data, isLoading, refetch }
}
```

### Mutation với optimistic UI

```typescript
// useWindowsServiceAction.ts (giản lược)
export function useStopService(hostId: Ref<string>) {
  const queryClient = useQueryClient()
  const socketEnabled = useSocketEnabled(hostId)  // Check agent ≥ 2.4.0

  return useMutation({
    mutationFn: ({ name, token }: { name: string, token?: string }) =>
      windowsServicesService.stop(hostId.value, name, token),

    onMutate: ({ name }) => {
      // Optimistic: mark is_pending
      queryClient.setQueryData(['windows-services', hostId.value], (old: IWindowsService[]) =>
        old?.map(s => s.name === name ? { ...s, is_pending: true } : s)
      )
    },

    onSuccess: () => {
      if (!socketEnabled.value) {
        // Agent < 2.4.0: fallback refetch
        queryClient.invalidateQueries({ queryKey: ['windows-services', hostId.value] })
      }
      // Agent ≥ 2.4.0: socket sẽ push update → KHÔNG cần refetch
      // KHÔNG toast.success (per frontend-error-handling rule)
    },

    onError: (err, { name }) => {
      // Rollback optimistic
      queryClient.setQueryData(['windows-services', hostId.value], (old: IWindowsService[]) =>
        old?.map(s => s.name === name ? { ...s, is_pending: false } : s)
      )
      // KHÔNG toast.error — interceptor đã hiện
    },
  })
}
```

### Socket listener

```typescript
// useWindowsServiceSocket.ts (giản lược)
export function useWindowsServiceSocket(hostId: Ref<string>) {
  const queryClient = useQueryClient()
  const socket = io('/windows-services', { auth: { token: getJwt() } })

  onMounted(() => {
    socket.emit('join_room', { host_id: hostId.value })

    socket.on('service_status_changed', (data) => {
      // Update cache trực tiếp (KHÔNG refetch HTTP)
      queryClient.setQueryData(['windows-services', hostId.value], (old: IWindowsService[]) =>
        old?.map(s => s.name === data.service_name
          ? { ...s, status: data.status, is_pending: false }
          : s
        )
      )
    })
  })

  onBeforeUnmount(() => {
    socket.emit('leave_room', { host_id: hostId.value })
    socket.disconnect()
  })
}
```

## 6. Performance

| Operation | Typical time | Note |
|---|---|---|
| List 100 services | ~500ms | Parallel fanout 16 |
| List 300+ services | ~1.5–2s | Semaphore-limited |
| Start service | ~1–3s | Poll 250ms |
| Stop service | ~1–3s | |
| Restart service | ~5–10s | Stop + Start sequential |
| Socket.IO push | <100ms | LAN trong data center |
| Full cycle (FE click → UI update) | ~2–5s start, ~8–15s restart | |

## 7. CASL Permission

Permission chain 5 file ([xem CLAUDE.md](../../../../../iNET-Project/cloud-panel-application/CLAUDE.md)):

1. `route-permission-parser.ts` — map route → `user:windows-service:control`
2. `permission.constants.ts` — add vào group `user_agents`
3. BE `ability.ts` — add Action `control`, Subject `user:windows-service`
4. FE `ability.ts` — mirror BE
5. `translations-permissions.ts` — i18n vi/en

**Default rollout:** Permission ẨN cho user thường đến khi super-admin tick vào role `user-base`. Hành vi này gọi là **"dark launch by permission"** — feature mới ẩn mặc định.

## 8. Audit log

Mỗi action ghi vào MongoDB collection `windows_services_audit`:

```javascript
{
  _id: ObjectId(...),
  host_id: "65f3a8b...",
  owner: "anhtct@inet.vn",
  created_by: "anhtct@inet.vn",
  action: "stop",                    // start | stop | restart | pause | resume | set_startup
  service_name: "Spooler",
  status: "success",                  // success | error
  error_code: null,                   // null hoặc "ACCESS_DENIED" etc.
  result: {
    prev_status: "Running",
    new_status: "Stopped",
    duration_ms: 1234,
  },
  ip_address: "203.0.113.42",
  user_agent: "Mozilla/5.0...",
  created_at: ISODate("2026-05-14T08:23:45.678Z"),
  expires_at: ISODate("2026-06-13T08:23:45.678Z"),    // TTL 30 ngày
}
```

TTL index trên `expires_at` → MongoDB tự xóa sau 30 ngày.

## 9. Tóm tắt code path 1 request

```
FE Vue useStopService.mutate({ name: 'Spooler' })
   │
   ▼ axios POST /api/v1/user/hosts/.../windows-services/Spooler/stop
   │
BE controller stopWindowsServiceController
   │
   ▼
BE service windowsServicesService.stop()
   ├─ hostValidator.validate()             ← Check Windows + agent active
   ├─ criticalGuard.check()                ← Check blacklist
   ├─ mutex.tryAcquire()                   ← Per (host, service) lock
   ├─ requestTracker.register(uuid)        ← Promise map
   ├─ bridge.emitToAgent('windows_services_request', ...)
   │
   ▼ Socket.IO /agent-ws
   │
Agent handler windowsServicesWsHandler
   │
   ▼
Agent service.Execute(req)
   ├─ WithLock(serviceName, 5s)            ← Per-service mutex
   ├─ mgr.Connect() → OpenService('Spooler')
   ├─ s.Control(svc.Stop)
   ├─ pollUntil(svc.Stopped, 60s)
   ├─ Return ActionResult
   │
   ▼ Socket.IO emit 'windows_services_response'
   │
BE requestTracker.resolve(uuid, payload)
   ├─ auditHelper.insert(...)              ← Mongo audit
   ├─ io.of('/windows-services').to('host:...').emit('service_status_changed')
   │
   ▼ HTTP response
   │
FE useMutation.onSuccess
   ├─ socketEnabled? → skip invalidate (socket sẽ update)
   ├─ !socketEnabled → invalidateQueries (fallback)
   │
FE useWindowsServiceSocket socket.on('service_status_changed')
   └─ queryClient.setQueryData → UI re-render
```

## 10. Câu hỏi thường gặp

**Q: Tại sao có service không stop được, báo `DEPENDENTS_RUNNING`?**

→ Windows không cho stop service có service khác đang phụ thuộc. Phải stop các dependent trước. Cloud Panel tạm thời không cascade auto-stop dependents (để tránh side effect không lường) — user phải stop từng cái.

**Q: Sao service `lsass` thì có dialog confirm, mà `xyz` thì không?**

→ Blacklist hard-code ~20 service trong `windows-services-critical-guard.service.ts`. Nếu cần thêm → sửa Set + redeploy BE.

**Q: Có audit khi list services không?**

→ **Không**. Chỉ audit khi có **mutation** (start/stop/restart/pause/resume/set_startup). List/get là read-only, không cần audit.

**Q: Pause/Resume có dùng được không?**

→ Có nhưng **rất ít service hỗ trợ**. Đa số trả `SERVICE_NOT_PAUSABLE` (422). Service nào hỗ trợ → flag `can_pause_continue=true` trong response của detail.

---

**Tiếp theo:** [05 — Xem Windows Event Log (chi tiết) →](./05-windows-event-log-deep-dive)
