# Cloud Panel — Quản lý Windows Service & Event Log VPS Windows

> Tài liệu chi tiết về 2 tính năng do mình triển khai trong dự án **Cloud Panel** (iNET.vn): quản lý **Windows Service** (start/stop/restart) và xem **Windows Event Log** realtime trên VPS Windows.

## Mục tiêu của tài liệu

Doc này viết để giới thiệu cho **người chưa biết gì** về dự án vẫn có thể hiểu được:

- Windows Service và Event Log là gì? Tại sao cần quản lý chúng từ xa?
- Cách mình lấy data từ VPS Windows về Cloud Panel như thế nào?
- Muốn vào **Remote Desktop** trực tiếp VPS Windows để đối chiếu thì làm sao?
- Code chạy ở đâu? Data lưu ở đâu? Khi debug thì xem chỗ nào?

Sau khi đọc xong, bạn sẽ:

- ✅ Hiểu khái niệm Windows Service, Event Log, Channel, EventID, Level
- ✅ Biết cách dùng UI Cloud Panel để quản lý service / xem event log
- ✅ Biết cách RDP vào VPS Windows mở `services.msc` / `eventvwr.msc` để đối chiếu
- ✅ Nắm kiến trúc 3 lớp: Frontend Vue 3 ↔ Backend Node.js ↔ Agent Go
- ✅ Biết được mỗi tính năng → API nào, file code ở đâu, data lưu Mongo hay không
- ✅ Có checklist debug khi event log không stream / service không control được

## Cấu trúc khóa học

| # | Trang | Nội dung |
|---|---|---|
| 01 | [Giới thiệu & khái niệm cơ bản](./01-introduction) | Windows Service là gì? Event Log là gì? Tại sao cần Cloud Panel? |
| 02 | [Hướng dẫn vào Remote Desktop](./02-remote-desktop-guide) | RDP từ Windows / macOS / Linux. Mở `services.msc`, `eventvwr.msc` |
| 03 | [Kiến trúc tổng thể](./03-architecture-overview) | 3 lớp FE — BE — Agent, Socket.IO namespaces, request flow |
| 04 | [Quản lý Windows Service — chi tiết](./04-windows-services-deep-dive) | UI, API endpoints, code path, mutex, critical service guard |
| 05 | [Xem Windows Event Log — chi tiết](./05-windows-event-log-deep-dive) | UI, live stream, cursor pagination, XPath filter, export CSV |
| 06 | [Tích hợp Alert Rules](./06-alert-rules-integration) | Cảnh báo khi event xuất hiện, dedup, cooldown, notification |
| 07 | [Data lấy từ đâu? File & API mapping](./07-data-source-mapping) | Mỗi data point trên UI → API nào → file code nào → lưu Mongo / TimescaleDB / không lưu |
| 08 | [Troubleshooting & debug](./08-troubleshooting) | Checklist khi service không start, event không stream, agent offline |
| 09 | [Tài liệu tham khảo](./09-resources) | Link Microsoft docs, Cloud Panel repo, internal docs |

## Cách đọc

- **Người mới / sếp / non-tech** → đọc 01 → 02 → ngắm UI là đủ.
- **Người quản trị VPS** → đọc 01 → 02 → 04 → 05 (skip phần code).
- **Dev/QA tham gia dự án** → đọc toàn bộ. Đặc biệt 03 → 07 cho code path.
- **Khi debug bug production** → mở thẳng 08 + 07.

## Stack tóm tắt

| Lớp | Tech | Port | Vai trò |
|---|---|---|---|
| Frontend | Vue 3 + Vite + TanStack Query | 8015 | UI hiển thị, live stream qua Socket.IO |
| Backend | Node.js + Express + TS | 8003 | API gateway, auth, ownership check, audit log |
| Agent (cài trên VPS Windows) | Go | 8080 | Gọi Windows API trực tiếp (`wevtapi.dll`, `golang.org/x/sys/windows/svc/mgr`) |
| MongoDB | — | — | Audit log (TTL 30–90 ngày) |
| Socket.IO | — | — | 3 namespace: `/agent-ws` (BE↔Agent), `/windows-services`, `/windows-event-log` (BE↔FE) |

## Repo & vị trí code

```
cloud-panel-application/                    ← Monorepo
├── cloud-panel-backend/                    ← Node.js API
│   └── src/modules/user/
│       ├── windows-services/               ← Module Windows Service
│       └── windows-event-log/              ← Module Event Log
├── cloud-panel-client/                     ← Vue 3 UI
│   └── src/modules/
│       ├── windows-services/
│       └── windows-event-log/
└── cloud-panel-agent/                      ← Go agent (cài trên VPS)
    └── src/modules/
        ├── windows_services/
        └── windows_eventlog/
```

> Toàn bộ path trong các trang con tham chiếu theo gốc monorepo này.

## Đối tượng & version

- **Customer VPS Windows:** Windows Server 2016 / 2019 / 2022 (Windows 10/11 cũng chạy được nhưng không phải target chính).
- **Agent version yêu cầu:**
  - Windows Service realtime push (Socket.IO): agent **≥ 2.4.0** (cũ hơn fallback polling).
  - Windows Event Log: agent **≥ 2.0.0** (cũ hơn bị từ chối với error `AGENT_VERSION_OUTDATED`).
- **Browser support:** Chrome / Edge / Firefox bản mới (Cloud Panel chỉ test desktop, mobile out-of-scope).

## Quy ước trong doc

- **`teal`** font code cho path file, lệnh terminal, tên API.
- Khối ```code``` block dùng cho snippet code thực từ repo (đã rút gọn).
- Heading có icon (📌 lưu ý, ⚠️ cảnh báo, 💡 mẹo, 🔍 debug) — non-tech có thể skim theo icon.

---

**Bắt đầu từ đây:** [01 — Giới thiệu & khái niệm cơ bản →](./01-introduction)
