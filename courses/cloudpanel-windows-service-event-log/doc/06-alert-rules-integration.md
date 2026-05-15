# 06 — Tích hợp Alert Rules (cảnh báo theo Event Log)

> Khi event log có Critical/Error, làm sao **chủ động** thông báo cho admin qua Telegram/email/push thay vì user phải vào UI xem? Đây là vai trò module **Alert Rules**.

## 1. Use case

**Vấn đề:** Cloud Panel có UI xem event log realtime, nhưng admin không thể ngồi nhìn 24/7. Cần:

- Critical event (server crash, lsass die) → ping Telegram ngay
- Failed login burst (EventID 4625 > 10 lần/5 phút) → email cảnh báo brute-force
- Disk space critical (EventID 2013 từ srv) → notification

**Giải pháp:** Cho user tự config **Alert Rule** = "Nếu event match điều kiện X, gửi thông báo qua kênh Y, kèm rule dedup để không spam".

## 2. Alert Rule data model

```typescript
// Collection: event_alert_rule (KHÔNG TTL — rule tồn tại lâu dài)
interface IEventAlertRule {
  _id: ObjectId
  owner: string              // user email
  name: string               // "Critical errors trên VPS production"
  enabled: boolean
  host_ids: string[]         // áp dụng cho host nào (hoặc [] = all hosts)

  conditions: {
    channel: string          // "Security" | "System" | "Application" | ...
    levels: number[]         // [1, 2] = Critical + Error
    event_id_min?: number    // VD: 4625 (filter range)
    event_id_max?: number
    provider_match?: string  // Substring match Provider Name
    message_regex?: string   // Regex match trong Message
  }

  dedup_strategy: 'fingerprint' | 'event_id_only' | 'event_id_plus_source_ip'
  dedup_window_minutes: 1 | 5 | 15 | 60
  cooldown_seconds: 0 | 60 | 300 | 900 | 3600

  channels: ('in_app' | 'email' | 'telegram' | 'push')[]
  last_triggered_at?: Date

  created_by: string
  updated_by: string
  created_at: Date
}
```

### Ví dụ rule

```javascript
{
  name: "Login failed brute-force detection",
  enabled: true,
  host_ids: ["65f3a8b...", "65f3a8c..."],
  conditions: {
    channel: "Security",
    levels: [4],             // Info (login event Windows ở level 4)
    event_id_min: 4625,
    event_id_max: 4625,
  },
  dedup_strategy: "event_id_plus_source_ip",
  dedup_window_minutes: 60,  // Cùng IP fail trong 60 phút → 1 alert
  cooldown_seconds: 300,
  channels: ["telegram", "email"],
}
```

## 3. Alert flow

```
Event arrives via /windows-event-log live stream
   │
   ▼
windows-event-log-subscription.service.ts → onAgentEvent()
   │
   ▼ fire-and-forget (không block stream)
alertEvaluator.evaluate(event, host_id, user_email)
   │
   ├─ 1. Match rules:
   │     SELECT FROM event_alert_rule
   │     WHERE owner = user_email
   │       AND enabled = true
   │       AND host_id IN host_ids (hoặc host_ids = [])
   │       AND condition match (channel, level, event_id, provider, message_regex)
   │
   ├─ 2. Dedup check:
   │     fingerprint = computeFingerprint(rule.dedup_strategy, event)
   │     SELECT FROM event_alert_dedup
   │     WHERE rule_id = rule._id AND fingerprint = ...
   │     → nếu có → SKIP (dedup)
   │
   ├─ 3. Cooldown check (circuit breaker):
   │     SELECT COUNT FROM event_alert_circuit_breaker
   │     WHERE host_id = host_id AND created_at > now - 1h
   │     → nếu > 100 → SKIP + log warning
   │
   ├─ 4. Send notification:
   │     for each channel in rule.channels:
   │       - in_app → push qua /notifications SSE
   │       - email → enqueue email worker
   │       - telegram → call Telegram Bot API
   │       - push → web push subscription
   │
   └─ 5. Record dedup entry:
         INSERT event_alert_dedup {
           rule_id, fingerprint,
           expires_at: now + dedup_window_minutes  ← TTL
         }
         UPDATE event_alert_rule SET last_triggered_at = now
```

## 4. Dedup strategies

3 strategy hỗ trợ, đại diện cho 3 cách "định nghĩa cùng 1 sự kiện":

### Strategy 1 — `event_id_only`

**Fingerprint:** `event_id`

**Use case:** Cùng EventID lặp lại trong khoảng thời gian → coi là cùng 1 incident.

VD: `EventID=1000` (chrome crash) lặp 100 lần trong 5 phút → chỉ alert 1 lần.

### Strategy 2 — `event_id_plus_source_ip`

**Fingerprint:** `event_id:source_ip`

**Use case:** Login fail từ cùng IP → 1 alert. IP khác → alert khác.

VD: `EventID=4625` từ `1.2.3.4` 50 lần → 1 alert. Sau đó `EventID=4625` từ `5.6.7.8` → alert thứ 2.

Source IP lấy từ `EventData.IpAddress` (chỉ áp dụng cho event Security có field này).

### Strategy 3 — `fingerprint`

**Fingerprint:** `event_id : provider : message[0:100]`

**Use case:** Phân biệt theo nội dung message thực tế.

VD: 2 event cùng `EventID=1000` nhưng faulting app khác nhau (`chrome.exe` vs `excel.exe`) → 2 fingerprint khác → 2 alert.

## 5. Cooldown vs Dedup

| Khác biệt | Dedup | Cooldown |
|---|---|---|
| Phạm vi | Theo **fingerprint cụ thể** | Theo **rule** hoặc **host** |
| Mục đích | Tránh spam **cùng 1 incident** | Throttle **tần suất alert** |
| Storage | `event_alert_dedup` (TTL = window) | `event_alert_circuit_breaker` (TTL = 1h) |
| VD | "Chrome crash 100 lần → 1 alert" | "Cùng rule không quá 1 alert/5 phút" |

> 💡 Dedup window và cooldown **độc lập**. 1 alert có thể bị skip do dedup (cùng fingerprint), hoặc do cooldown (rule fire quá nhiều).

## 6. Circuit breaker (rate limit ngoài cùng)

Nếu 1 host bị **storm event** (loop crash) → có thể trigger hàng nghìn alert/giờ. Cloud Panel có circuit breaker:

```
Per host_id:
  COUNT(alert fired in last 1 hour) > 100 → STOP firing alerts cho host này (1 hour)
  → log warning vào MongoDB để admin biết
```

Sau 1 giờ tự reset. User có thể xem trong audit để biết alert bị suppress.

## 7. Notification channels

### in_app

Backend push qua **SSE notifications** namespace (không phải Socket.IO event log!). FE component badge số notification + popup.

```typescript
notificationService.send({
  recipient: user_email,
  title: 'Critical Event Alert',
  body: `Host ${host_name}: ${event.message_short}`,
  data: { host_id, event_id, record_id },
})
```

### email

Enqueue job vào email worker (BullMQ / nodemailer). Template HTML có table chi tiết event.

### telegram

Call Telegram Bot API trực tiếp:

```typescript
const text = `🔴 *Critical Alert*\n` +
             `Host: ${host_name}\n` +
             `Channel: ${event.channel}\n` +
             `EventID: ${event.event_id}\n` +
             `Source: ${event.source}\n` +
             `Time: ${event.time}\n\n` +
             `${event.message_short.substring(0, 500)}`

await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
  chat_id: user.telegram_chat_id,
  text,
  parse_mode: 'Markdown',
})
```

User config `telegram_chat_id` trong account settings (qua flow `/start` với bot).

### push

Web Push API qua VAPID. FE đăng ký subscription, BE lưu, gửi push khi alert fire.

## 8. Code path

### Backend module

```
cloud-panel-backend/src/modules/user/event-alert-rule/
├── route/
│   └── event-alert-rule.router.ts
├── controller/
│   └── event-alert-rule.controller.ts     ← CRUD rule
├── service/
│   ├── event-alert-rule.service.ts        ← CRUD orchestration
│   ├── alert-evaluator.service.ts         ← Match + dedup + send
│   ├── alert-fingerprint.service.ts       ← Compute fingerprint
│   └── alert-channel-dispatcher.service.ts ← Route tới in_app/email/telegram/push
├── repository/
│   ├── event-alert-rule.repository.ts
│   ├── event-alert-dedup.repository.ts    ← TTL collection
│   └── event-alert-circuit-breaker.repository.ts
└── types/
    └── event-alert-rule.types.ts
```

### Alert evaluator (giản lược)

```typescript
// alert-evaluator.service.ts
export async function evaluate(event: IEventLogEvent, host_id: string, user_email: string) {
  // 1. Find matching rules
  const rules = await eventAlertRuleRepo.findMatching({
    owner: user_email,
    enabled: true,
    host_id,
    channel: event.channel,
    level: event.level,
    event_id: event.event_id,
    provider: event.source,
    message: event.message_short,
  })

  if (rules.length === 0) return

  // 2. Circuit breaker per host
  const recentCount = await circuitBreakerRepo.countByHost(host_id, '1h')
  if (recentCount > 100) {
    log.warn('Alert circuit breaker triggered', { host_id })
    return
  }

  for (const rule of rules) {
    // 3. Dedup check
    const fingerprint = computeFingerprint(rule.dedup_strategy, event)
    const exists = await dedupRepo.exists(rule._id, fingerprint)
    if (exists) continue   // Skip dedup

    // 4. Send notification
    for (const channel of rule.channels) {
      await channelDispatcher.send(channel, rule, event, host_id, user_email)
    }

    // 5. Record dedup + update rule
    await dedupRepo.insert({
      rule_id: rule._id,
      fingerprint,
      expires_at: new Date(Date.now() + rule.dedup_window_minutes * 60 * 1000),
    })
    await circuitBreakerRepo.increment(host_id)
    await eventAlertRuleRepo.updateLastTriggered(rule._id)
  }
}
```

## 9. UI cấu hình rule

Page **Alert Rules** trong Cloud Panel:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Alert Rules                                          [+ Tạo rule mới]  │
├────────────────────────────────────────────────────────────────────────┤
│ Name                          Hosts        Last triggered   Status     │
│ ─────────────────────────────────────────────────────────────────────  │
│ Critical errors all VPS       All (12)     5 phút trước     🟢 Enable  │
│ SSH brute-force detection     2 hosts      2 giờ trước      🟢 Enable  │
│ Disk space low                All (12)     Chưa trigger     🟢 Enable  │
│ Windows Update reminder       All (12)     1 ngày trước     ⚪ Disable │
└────────────────────────────────────────────────────────────────────────┘
```

Form tạo rule:

```
Name:          [Critical errors VPS production    ]
Apply to hosts:[ ☑ All hosts  hoặc  ☐ Select... ]

CONDITION:
Channel:       [Application ▼]
Levels:        [☑ Critical  ☑ Error  ☐ Warning  ☐ Info  ☐ Verbose]
Event ID:      [from: 1000  ] [to: 1010]   (optional, để trống = all)
Source:        [_________________]          (optional substring)
Message regex: [_________________]          (optional)

DEDUP:
Strategy:      [event_id_only ▼]
Window:        [5 minutes ▼]
Cooldown:      [5 minutes ▼]

NOTIFICATION:
Channels:      [☑ In-app  ☑ Email  ☑ Telegram  ☐ Push]

                           [Hủy]            [Tạo rule]
```

## 10. Quan hệ với Event Log feature

Alert rules **tích hợp chặt** với module Event Log:

- **Trigger point** = `windows-event-log-subscription.service.ts.onAgentEvent()` (fire-and-forget)
- **Phụ thuộc:** User phải có quyền `user:alert-rule:list` để FE check số rule active (UX guard) — nếu không sẽ silent fallback count=0 (xem `team-knowledge.md` cross-module dependency)
- **Không phụ thuộc** từ Event Log → Alert (alert có hay không không ảnh hưởng việc xem log)

### Lưu ý quan trọng

> ⚠️ **Alert chỉ fire khi event log đang được stream (có subscription active).**
>
> Nếu không ai mở UI event log → không có subscription → agent không poll → không có event đẩy lên → alert không fire.
>
> Đây là **giới hạn cố ý** để giữ kiến trúc đơn giản (KISS):
> - Không có background poll riêng cho alert
> - Tránh tốn agent CPU 24/7 cho mọi VPS
>
> **Workaround:** Tạo subscription "always-on" qua backend job (nếu user có rule active, BE tự subscribe). Hiện chưa triển khai — **defer cho phase sau**.

## 11. Collection MongoDB

| Collection | TTL | Mục đích |
|---|---|---|
| `event_alert_rule` | None | User-defined rules (CRUD) |
| `event_alert_dedup` | = dedup_window_minutes | Fingerprint dedup |
| `event_alert_circuit_breaker` | 1 hour | Per-host alert counter |

## 12. Tóm tắt

| Khái niệm | Một câu |
|---|---|
| **Alert Rule** | Filter event log → fire notification |
| **Match condition** | Channel + Levels + EventID range + Provider substring + Message regex |
| **Dedup** | Tránh spam cùng 1 sự kiện. 3 strategy: by event_id / event_id+IP / fingerprint |
| **Cooldown** | Throttle tần suất alert per rule |
| **Circuit breaker** | Per host > 100 alert/giờ → tạm tắt 1 giờ |
| **Channels** | in_app, email, telegram, push |
| **Trigger point** | Fire-and-forget trong subscription event handler |
| **Giới hạn** | Chỉ fire khi có active subscription (user đang xem UI hoặc keep tab mở) |

---

**Tiếp theo:** [07 — Data lấy từ đâu? File & API mapping →](./07-data-source-mapping)
