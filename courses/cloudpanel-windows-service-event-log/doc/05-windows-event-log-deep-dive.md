# 05 — Xem Windows Event Log (chi tiết)

> Deep dive tính năng xem Windows Event Log: live stream Socket.IO, cursor pagination, XPath filter, export CSV, code path 3 lớp.

## 1. User flow

### Vào trang Event Log

1. Đăng nhập Cloud Panel
2. Hosts → chọn VPS Windows → tab **Event Log**

### UI components

```
┌────────────────────────────────────────────────────────────────────────┐
│ Event Log — VPS-DEMO-01                       [⏺ Live] [Export CSV]   │
├────────────────────────────────────────────────────────────────────────┤
│ Channel: [Application ▼]                                               │
│ Level:   [☑ Critical ☑ Error ☐ Warning ☐ Info ☐ Verbose]              │
│ Time:    [Last 24 hours ▼]    Text: [_____________________]            │
│ Source:  [_______________]    Event ID: [____________]                 │
├────────────────────────────────────────────────────────────────────────┤
│ Stats: 🔴 12 Critical | 🟠 245 Error | 🟡 89 Warning | 🔵 1,234 Info   │
├────────────────────────────────────────────────────────────────────────┤
│ Time            Lv  ID    Source              Message                  │
│ ───────────────────────────────────────────────────────────────────── │
│ 10:23:11.123    🟠  1000  Application Error   Faulting application... │
│ 10:22:58.045    🔵  17137 MSSQLSERVER         Starting up database... │
│ 10:20:14.000    🟡  642   ESENT               svchost (4848) consis...│
│ ...                                                                    │
│                                                       [Load more ▼]    │
└────────────────────────────────────────────────────────────────────────┘
```

| Element | Vai trò |
|---|---|
| Channel dropdown | Chọn channel (Application / System / Security / ...) |
| Level checkboxes | Filter theo level (multi-select) |
| Time range | Last hour / 24h / 7d / custom (max 30 ngày) |
| Text contains | Substring search trong Message |
| Source | Provider name filter (substring) |
| Event ID | Filter ID cụ thể hoặc range (`1000-2000`) |
| Live toggle ⏺ | Bật/tắt live stream |
| Export CSV | Download max 10,000 row |
| Stats bar | Count theo level |
| Load more | Cursor pagination |
| Click row | Mở Detail Drawer |

### Detail Drawer

Click 1 row → drawer mở:

```
┌──────────────────────────────────────────────┐
│ Event Detail               [Close X]         │
├──────────────────────────────────────────────┤
│ Time: 2026-05-14 10:23:11 (UTC+7)            │
│ Channel: Application                         │
│ Level: 🟠 Error                              │
│ Source: Application Error                    │
│ Event ID: 1000                               │
│ Record ID: 4839271                           │
│ Computer: WIN-VPS-01                         │
│                                              │
│ Message:                                     │
│ ────────────────────────────────────────────│
│ Faulting application name: chrome.exe...    │
│                                              │
│ Event Data:                                  │
│ ────────────────────────────────────────────│
│ AppName:        chrome.exe                   │
│ AppVersion:     124.0.6367.119              │
│ FaultModule:    ntdll.dll                   │
│ FaultModuleVer: 10.0.17763.5458             │
│ ExceptionCode:  0xc0000005                  │
│                                              │
│ [Copy as JSON] [Search online: EventID 1000]│
└──────────────────────────────────────────────┘
```

## 2. 2 chế độ — Pull vs Live Stream

### Chế độ Pull (mặc định)

User mở trang → BE gọi API `POST /query` → BE → agent → agent đọc `.evtx` → trả về 1 batch (default 200 events). Khi user scroll xuống → load thêm bằng cursor.

**Khi nào dùng:** Xem log lịch sử, filter cụ thể.

### Chế độ Live Stream

User bật toggle ⏺ Live → FE mở Socket.IO subscription qua `/windows-event-log` → BE forward subscribe tới agent → agent poll Windows event log 2s/lần, push event mới về FE realtime.

**Khi nào dùng:** Debug realtime, monitor trong khi action.

> 📌 Toggle Live mutex với pause/scroll: khi user scroll lên xem log cũ → live tạm pause buffer (giữ trong client, không append vào view) để tránh "scroll jump".

## 3. API Endpoints

Base: `/api/v1/user/hosts/:hostId/windows-event-log`

| Method | Path | Permission | Mô tả |
|---|---|---|---|
| `POST` | `/query` | `list` | Paginated query (cursor) |
| `GET` | `/channels` | `list` | Liệt kê tất cả channel có trên VPS |
| `POST` | `/export` | `export` | Export CSV, max 10,000 row |

### POST /query — Request

```json
{
  "channel": "Application",
  "filter": {
    "levels": [1, 2],
    "event_ids": [1000, 1001, 1002],
    "source": "Application Error",
    "time_range": {
      "from": "2026-05-13T00:00:00Z",
      "to": "2026-05-14T23:59:59Z"
    },
    "text_contains": "chrome"
  },
  "cursor": { "record_id_after": 4839200 },
  "limit": 200
}
```

### POST /query — Response

```json
{
  "values": {
    "events": [
      {
        "time": "2026-05-14T10:23:11.123Z",
        "channel": "Application",
        "level": 2,
        "source": "Application Error",
        "event_id": 1000,
        "computer": "WIN-VPS-01",
        "record_id": 4839271,
        "message_short": "Faulting application name: chrome.exe...",
        "event_data": {
          "AppName": "chrome.exe",
          "FaultModule": "ntdll.dll"
        }
      }
      /* ... */
    ],
    "next_cursor": { "record_id_after": 4839271 },
    "total_in_batch": 200,
    "has_more": true
  }
}
```

### Filter constraints (Zod)

| Field | Constraint |
|---|---|
| `levels` | int[] 1–5, max 5 phần tử |
| `event_ids` | int[] 0–65535, max 50 phần tử |
| `source` | string max 256 chars |
| `time_range` | max 30 ngày span |
| `text_contains` | string max 200, no control chars |
| `record_id_after` | int (resume cursor) |

### Error codes

| Code | HTTP | Khi nào |
|---|---|---|
| `HOST_NOT_WINDOWS` | 400 | Host không phải OS Windows |
| `AGENT_NOT_ACTIVE` | 503 | Agent offline |
| `AGENT_VERSION_OUTDATED` | 503 | Agent < 2.0.0 |
| `TIME_RANGE_TOO_LONG` | 400 | > 30 ngày |
| `EXPORT_TOO_LARGE` | 400 | > 10,000 row |
| `REQUEST_TIMEOUT` | 503 | Agent không trả lời trong 30s |

## 4. Socket.IO — Live Stream

### Namespace `/windows-event-log`

**FE → BE events:**

| Event | Payload | Mô tả |
|---|---|---|
| `subscribe` | `{ host_id, channel, filter? }` | Bắt đầu subscribe |
| `unsubscribe` | `{ subscription_id }` | Dừng subscription |
| `windows_eventlog_ack` | `{ subscription_id, ack_count }` | Báo FE đã xử lý N event (backpressure) |

**BE → FE events:**

| Event | Payload | Mô tả |
|---|---|---|
| `eventlog:subscribed` | `{ subscription_id }` | Subscribe thành công |
| `eventlog:event` | `{ subscription_id, events: [...] }` | Batch event mới |
| `eventlog:dropped` | `{ subscription_id, dropped_count }` | Event bị drop do rate limit |
| `eventlog:closed` | `{ subscription_id, reason }` | Subscription đóng (agent offline...) |
| `eventlog:error` | `{ error_code, message }` | Lỗi |
| `eventlog:unsubscribed` | `{ subscription_id }` | Đã unsub thành công |

### Constraint subscription

- **1 active subscription per (user_email, host_id)** — user không thể subscribe cùng host từ 2 tab
- **Triple index** in-memory registry: `sub_id → entry`, `(user+host) → sub_id`, `fe_socket_id → Set<sub_id>`, `agent_id → Set<sub_id>`
- **Rate limit FE side:** token bucket capacity 200, refill 100/s per FE socket
- **Throttle agent side:** token bucket capacity 500, refill 100/s per subscription. Ack từ BE replenish tokens.

### Auto-reconnect

Khi FE mất kết nối tạm thời:

1. FE lưu `last_record_id` của event cuối cùng đã nhận
2. Reconnect → emit `subscribe` lại với `filter.record_id_after = last_record_id`
3. Agent resume từ point đó → không miss event, không duplicate

## 5. Code path — Backend

### Module path

```
cloud-panel-backend/src/modules/user/windows-event-log/
├── route/
│   └── windows-event-log.router.ts
├── controller/
│   └── windows-event-log.controller.ts
├── service/
│   ├── windows-event-log.service.ts                       ← Orchestrator
│   ├── windows-event-log-export.service.ts                ← CSV builder, 10k cap
│   ├── windows-event-log-bridge.service.ts                ← Emit tới agent
│   ├── windows-event-log-subscription.service.ts          ← Registry + alert eval
│   ├── windows-event-log-host-validator.service.ts        ← Pre-checks
│   ├── filter-validator.service.ts                        ← Zod, 30-day cap
│   ├── windows-event-log-request-tracker.service.ts       ← Promise map 30s
│   ├── windows-event-log-inbound-rate-limiter.service.ts  ← Token bucket FE
│   ├── windows-event-log-mapper.service.ts                ← Agent → API map
│   ├── windows-event-log-audit-helper.service.ts          ← Mongo audit
│   └── csv-exporter.service.ts
├── socket/
│   ├── windows-event-log-namespace.handler.ts
│   └── windows-event-log-event.handler.ts
├── repository/
│   └── (audit) collection: windows_event_log_audit (TTL 90d)
└── types/
    └── windows-event-log.types.ts
```

### Subscription service (registry)

```typescript
// windows-event-log-subscription.service.ts (giản lược)
interface SubEntry {
  subscription_id: string
  user_email: string
  host_id: string
  agent_id: string
  fe_socket_id: string
  channel: string
  filter: IEventLogFilter
  last_record_id: number
  created_at: Date
}

const byId = new Map<string, SubEntry>()
const byUserHost = new Map<string, string>()     // "user|host" → sub_id
const byFeSocket = new Map<string, Set<string>>()
const byAgent = new Map<string, Set<string>>()

export async function subscribe(params) {
  const key = `${params.user_email}|${params.host_id}`
  const existing = byUserHost.get(key)
  if (existing) {
    // Disconnect cái cũ trước
    await unsubscribe(existing)
  }
  /* ... create entry, emit to agent ... */
}

export function onAgentEvent(subscription_id, events) {
  const entry = byId.get(subscription_id)
  if (!entry) return  // Subscription đã đóng

  // Update last_record_id
  entry.last_record_id = events[events.length - 1].record_id

  // Forward về FE
  io.of('/windows-event-log').to(entry.fe_socket_id)
    .emit('eventlog:event', { subscription_id, events })

  // Fire-and-forget alert evaluation
  for (const ev of events) {
    alertEvaluator.evaluate(ev, entry.host_id, entry.user_email)
      .catch(err => log.warn('alert eval failed', err))
  }
}
```

## 6. Code path — Agent (Go)

### Module path

```
cloud-panel-agent/src/modules/windows_eventlog/
├── service/
│   ├── windows_eventlog_service.go    ← Orchestrator
│   ├── wevtapi_syscall.go             ← wevtapi.dll syscall wrapper
│   ├── xpath_builder.go               ← Filter → XPath 1.0
│   ├── event_xml_parser.go            ← XML → EventEntry
│   ├── subscription_manager.go        ← Lifecycle goroutine per subscription
│   ├── stream_throttle.go             ← Token bucket backpressure
│   └── emit_fn.go                     ← Socket.IO emit helper
├── handler/
│   └── windows_eventlog_ws_handler.go ← Dispatcher (switch on Op)
└── types/
    └── eventlog_request.go
```

### Wevtapi syscall wrapper

Agent **không gọi PowerShell** `Get-WinEvent`. Gọi trực tiếp Windows API qua `wevtapi.dll`:

```go
// wevtapi_syscall.go (giản lược)
var (
    wevtapi              = syscall.NewLazyDLL("wevtapi.dll")
    procEvtQuery         = wevtapi.NewProc("EvtQuery")
    procEvtNext          = wevtapi.NewProc("EvtNext")
    procEvtRender        = wevtapi.NewProc("EvtRender")
    procEvtClose         = wevtapi.NewProc("EvtClose")
    procEvtOpenChEnum    = wevtapi.NewProc("EvtOpenChannelEnum")
    procEvtNextChPath    = wevtapi.NewProc("EvtNextChannelPath")
)

func EvtQuery(channel, xpath string, flags uint32) (uintptr, error) {
    chPtr, _ := syscall.UTF16PtrFromString(channel)
    xpPtr, _ := syscall.UTF16PtrFromString(xpath)
    r1, _, err := procEvtQuery.Call(
        0,
        uintptr(unsafe.Pointer(chPtr)),
        uintptr(unsafe.Pointer(xpPtr)),
        uintptr(flags),
    )
    if r1 == 0 {
        return 0, mapWin32Error(err)
    }
    return r1, nil
}
```

> 💡 Cấp tốc Go ↔ Windows API: `syscall.NewLazyDLL` → load DLL → `NewProc("FuncName")` → `Call(args...)` → check return value.

### XPath builder

Windows Event Log filter dùng **XPath 1.0**. Agent convert filter API → XPath:

```go
// xpath_builder.go (giản lược)
func BuildXPath(filter Filter, cursor *Cursor) string {
    var conds []string

    if len(filter.Levels) > 0 {
        levelConds := []string{}
        for _, l := range filter.Levels {
            levelConds = append(levelConds, fmt.Sprintf("Level=%d", l))
        }
        conds = append(conds, "("+strings.Join(levelConds, " or ")+")")
    }

    if len(filter.EventIDs) > 0 {
        idConds := []string{}
        for _, id := range filter.EventIDs {
            idConds = append(idConds, fmt.Sprintf("EventID=%d", id))
        }
        conds = append(conds, "("+strings.Join(idConds, " or ")+")")
    }

    if filter.TimeRange != nil {
        conds = append(conds, fmt.Sprintf(
            "TimeCreated[@SystemTime>='%s' and @SystemTime<='%s']",
            filter.TimeRange.From.Format(time.RFC3339),
            filter.TimeRange.To.Format(time.RFC3339),
        ))
    }

    if cursor != nil && cursor.RecordIDAfter > 0 {
        conds = append(conds, fmt.Sprintf("EventRecordID > %d", cursor.RecordIDAfter))
    }

    if len(conds) == 0 {
        return "*"
    }
    return fmt.Sprintf("*[System[%s]]", strings.Join(conds, " and "))
}
```

Ví dụ XPath sinh ra:

```xml
*[System[(Level=1 or Level=2) and (EventID=1000) and TimeCreated[@SystemTime>='2026-05-13T00:00:00Z' and @SystemTime<='2026-05-14T23:59:59Z'] and EventRecordID > 4839200]]
```

### Query operation

```go
// windows_eventlog_service.go (giản lược)
func Query(ctx context.Context, channel string, filter Filter, cursor *Cursor, limit int) ([]EventEntry, *Cursor, error) {
    xpath := BuildXPath(filter, cursor)
    handle, err := EvtQuery(channel, xpath, EvtQueryChannelPath|EvtQueryForwardDirection)
    if err != nil {
        return nil, nil, err
    }
    defer EvtClose(handle)

    var events []EventEntry
    for len(events) < limit {
        batch, err := EvtNext(handle, min(50, limit-len(events)))
        if err == ErrNoMoreItems {
            break
        }
        if err != nil {
            return nil, nil, err
        }
        for _, evtHandle := range batch {
            xml, _ := EvtRender(evtHandle)
            entry := ParseEventXML(xml)
            events = append(events, entry)
            EvtClose(evtHandle)
        }
    }

    var nextCursor *Cursor
    if len(events) == limit {
        nextCursor = &Cursor{RecordIDAfter: events[len(events)-1].RecordID}
    }
    return events, nextCursor, nil
}
```

### Subscribe operation (goroutine)

```go
// subscription_manager.go (giản lược)
func StartSubscription(ctx context.Context, sub Subscription, emit EmitFn) {
    go func() {
        ticker := time.NewTicker(2 * time.Second)
        defer ticker.Stop()
        lastRecordID := sub.Filter.RecordIDAfter

        throttle := NewTokenBucket(500, 100)

        for {
            select {
            case <-ctx.Done():
                return
            case <-ticker.C:
                cursor := &Cursor{RecordIDAfter: lastRecordID}
                events, _, err := Query(ctx, sub.Channel, sub.Filter, cursor, 200)
                if err != nil {
                    emit("eventlog:error", err)
                    continue
                }
                if len(events) == 0 {
                    continue
                }

                // Honor backpressure
                allowed := throttle.Take(len(events))
                if allowed < len(events) {
                    emit("windows_eventlog_dropped", map[string]int{
                        "dropped_count": len(events) - allowed,
                    })
                    events = events[:allowed]
                }

                emit("windows_eventlog_stream_event", map[string]interface{}{
                    "subscription_id": sub.ID,
                    "events":          events,
                })
                lastRecordID = events[len(events)-1].RecordID
            }
        }
    }()
}
```

### Event XML parse

Windows trả về event ở format XML:

```xml
<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event">
  <System>
    <Provider Name="Application Error"/>
    <EventID>1000</EventID>
    <Level>2</Level>
    <TimeCreated SystemTime="2026-05-14T10:23:11.123Z"/>
    <EventRecordID>4839271</EventRecordID>
    <Computer>WIN-VPS-01</Computer>
  </System>
  <EventData>
    <Data Name="AppName">chrome.exe</Data>
    <Data Name="FaultModule">ntdll.dll</Data>
  </EventData>
</Event>
```

Agent parse thành struct Go:

```go
// event_xml_parser.go (giản lược)
type EventEntry struct {
    Time         string            `json:"time"`
    Channel      string            `json:"channel"`
    Level        int               `json:"level"`
    Source       string            `json:"source"`
    EventID      int               `json:"event_id"`
    Computer     string            `json:"computer"`
    RecordID     int64             `json:"record_id"`
    MessageShort string            `json:"message_short"`  // truncate 512 chars
    EventData    map[string]string `json:"event_data"`
}

func ParseEventXML(xmlStr string) EventEntry {
    /* xml.Unmarshal vào intermediate struct, map sang EventEntry */
}
```

## 7. Code path — Frontend (Vue 3)

### Module path

```
cloud-panel-client/src/modules/windows-event-log/
├── services/
│   └── windows-event-log.service.ts                ← HTTP API
├── composables/
│   ├── useWindowsEventLog.ts                       ← Combined hook
│   ├── useWindowsEventLogStream.ts                 ← Socket live stream
│   ├── useWindowsEventLogPageCoordinator.ts        ← Pull mode infinite scroll
│   ├── useWindowsEventLogFilter.ts                 ← Filter state + Zod
│   ├── useWindowsEventLogExport.ts                 ← CSV download
│   └── useWindowsEventLogLive.ts                   ← Toggle live mode
├── components/
│   ├── WindowsEventLogPage.vue
│   ├── WindowsEventLogTable.vue
│   ├── WindowsEventLogFilterBar.vue
│   ├── WindowsEventLogTimeRangePicker.vue
│   ├── WindowsEventLogDetailDrawer.vue
│   ├── WindowsEventLogLiveToggle.vue
│   ├── WindowsEventLogDropBanner.vue
│   └── WindowsEventLogStatsCards.vue
└── types/
    └── windows-event-log.types.ts
```

### Live stream composable

```typescript
// useWindowsEventLogStream.ts (giản lược)
export function useWindowsEventLogStream(hostId, channel, filter) {
  const socket = io('/windows-event-log', { auth: { token: getJwt() } })
  const subscriptionId = ref<string | null>(null)
  const streamEvents = ref<IEventLogEvent[]>([])
  const droppedCount = ref(0)
  const seenRecordIds = new Set<number>()
  const MAX_BUFFER = 1000
  const MAX_SEEN = 5000

  let pendingAck = 0
  let ackTimer: ReturnType<typeof setTimeout> | null = null

  function subscribe() {
    socket.emit('subscribe', { host_id: hostId.value, channel: channel.value, filter: filter.value })
  }

  function unsubscribe() {
    if (subscriptionId.value) {
      socket.emit('unsubscribe', { subscription_id: subscriptionId.value })
    }
  }

  socket.on('eventlog:subscribed', (data) => {
    subscriptionId.value = data.subscription_id
  })

  socket.on('eventlog:event', (data) => {
    // Dedup
    const fresh = data.events.filter(e => !seenRecordIds.has(e.record_id))
    fresh.forEach(e => seenRecordIds.add(e.record_id))

    // Evict 20% oldest if seenRecordIds too large
    if (seenRecordIds.size > MAX_SEEN) {
      const toRemove = Array.from(seenRecordIds).slice(0, MAX_SEEN * 0.2)
      toRemove.forEach(r => seenRecordIds.delete(r))
    }

    // Prepend (mới ở trên), cap buffer
    streamEvents.value = [...fresh, ...streamEvents.value].slice(0, MAX_BUFFER)

    // Ack batching (every 50 events OR 2s)
    pendingAck += fresh.length
    if (pendingAck >= 50) {
      flushAck()
    } else if (!ackTimer) {
      ackTimer = setTimeout(flushAck, 2000)
    }
  })

  socket.on('eventlog:dropped', (data) => {
    droppedCount.value += data.dropped_count
  })

  function flushAck() {
    if (pendingAck > 0 && subscriptionId.value) {
      socket.emit('windows_eventlog_ack', {
        subscription_id: subscriptionId.value,
        ack_count: pendingAck,
      })
      pendingAck = 0
    }
    if (ackTimer) {
      clearTimeout(ackTimer); ackTimer = null
    }
  }

  onMounted(subscribe)
  onBeforeUnmount(() => {
    unsubscribe()
    socket.disconnect()
  })

  return { subscriptionId, streamEvents, droppedCount }
}
```

### Pull mode composable

```typescript
// useWindowsEventLogPageCoordinator.ts (giản lược)
export function useWindowsEventLogPageCoordinator(hostId, channel, filter) {
  return useInfiniteQuery({
    queryKey: ['windows-event-log', hostId, channel, filter],
    queryFn: ({ pageParam }) =>
      windowsEventLogService.queryEvents(hostId.value, {
        channel: channel.value,
        filter: filter.value,
        cursor: pageParam,
        limit: 200,
      }),
    getNextPageParam: (last) => last?.has_more ? last.next_cursor : undefined,
    initialPageParam: null,
  })
}
```

### Export

```typescript
// useWindowsEventLogExport.ts (giản lược)
export function useWindowsEventLogExport() {
  return useMutation({
    mutationFn: async ({ hostId, channel, filter }) => {
      const blob = await windowsEventLogService.exportEvents(hostId, { channel, filter })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `event-log-${channel}-${Date.now()}.csv`
      a.click()
      URL.revokeObjectURL(url)
    },
  })
}
```

## 8. Tại sao không lưu Event Log vào DB?

| Lý do | Chi tiết |
|---|---|
| **Volume khổng lồ** | 1 VPS dễ sinh 10k–100k event/ngày. Cloud Panel scale ~ hàng trăm VPS/user → tổng có thể tens of millions/ngày |
| **Storage cost** | Lưu vào TimescaleDB sẽ tốn vài chục GB/ngày cho 1 user lớn |
| **Đã có sẵn nguồn** | `.evtx` trên VPS đã là kho lưu trữ chuẩn. Windows tự rotate khi đầy. Không cần duplicate |
| **Privacy** | Customer có thể có log nhạy cảm (security audit). Không lưu = không phải xử lý compliance |
| **Latency on-demand acceptable** | Query qua agent ~2–5s, OK cho UX không phải real-time critical |

**Đánh đổi:**

- ❌ Không query lịch sử event đã rotate (nếu VPS xóa rồi thì mất luôn)
- ❌ Phải agent online mới xem được
- ✅ Storage cost = $0
- ✅ Đơn giản (KISS) — không phải đồng bộ định kỳ
- ✅ Real-time stream qua subscription đủ cho 90% use case

## 9. Performance & Limit

| Operation | Time | Limit |
|---|---|---|
| Query 1 batch (200 events) | ~1–3s | depends agent CPU |
| List channels | ~500ms | |
| Live stream latency | 2s (poll interval) + <100ms (push) | |
| Export CSV (10k rows) | ~10–30s | Hard cap 10,000 |
| Subscribe duration | unlimited | Auto-close khi FE disconnect |
| Time range max | — | 30 ngày |
| Filter levels max | — | 5 phần tử |
| Filter event_ids max | — | 50 phần tử |
| Text contains max | — | 200 chars |

## 10. Audit log

```javascript
// Collection: windows_event_log_audit (TTL 90 ngày)
{
  _id: ObjectId(...),
  host_id: "65f3a8b...",
  owner: "anhtct@inet.vn",
  action: "query",                  // query | export | subscribe | unsubscribe
  channel: "Application",
  filter_summary: "levels=[1,2], event_ids=[1000]",
  result_count: 47,
  status: "success",
  error_code: null,
  created_by: "anhtct@inet.vn",
  created_at: ISODate("2026-05-14T08:23:45Z"),
  expires_at: ISODate("2026-08-12T08:23:45Z"),
}
```

> 📌 **Lưu audit, KHÔNG lưu raw event.** Audit ghi `result_count: 47` chứ không lưu 47 event đó. Khác hoàn toàn với phần Windows Service (lưu result chi tiết).

## 11. Câu hỏi thường gặp

**Q: Tại sao agent poll 2s/lần thay vì subscribe Windows Event Log API (push)?**

→ Windows có `EvtSubscribe` API cho push mode, nhưng:
- Cài lifecycle phức tạp (callback C function, channel buffering)
- Polling 2s đã đủ "real-time feel" cho UX
- Polling đơn giản, dễ kiểm soát rate, dễ recover khi sub bị mất

Trade-off: 2s latency tối đa, đổi lấy code đơn giản hơn nhiều.

**Q: Sao text_contains chỉ tìm trong message_short, không full message?**

→ `message_short` đã truncate 512 chars khi parse. Để search full message phải parse cả XML tại agent (chậm + tốn CPU). Đa số use case 512 chars là đủ.

**Q: Export 10k rows, đủ không?**

→ Đủ cho 90% case (báo cáo 1 ngày/1 tuần). Lớn hơn → khuyến nghị user SSH/RDP vào VPS dùng `wevtutil epl` export file `.evtx` trực tiếp, rồi convert bằng PowerShell.

**Q: Channel `Security` không thấy event nào?**

→ Channel `Security` cần **agent chạy với quyền admin/SYSTEM**. Default Cloud Panel agent cài như SYSTEM service → OK. Nếu agent install sai context → fail với `ACCESS_DENIED`.

---

**Tiếp theo:** [06 — Tích hợp Alert Rules →](./06-alert-rules-integration)
