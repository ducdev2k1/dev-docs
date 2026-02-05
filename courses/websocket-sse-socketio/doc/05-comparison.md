## 7. So sánh WebSocket, Socket.IO, SSE, Long Polling

Phần này dùng **bảng** để so sánh trực quan giữa các công nghệ realtime.

---

### 7.1. WebSocket vs SSE

| Tiêu chí | WebSocket | SSE (Server-Sent Events) |
|----------|-----------|---------------------------|
| **Chiều dữ liệu** | **2 chiều** (full-duplex): client ↔ server | **1 chiều**: chỉ server → client |
| **Protocol** | Protocol riêng: handshake HTTP, sau đó dùng WebSocket frames | Thuần HTTP, stream text `text/event-stream` |
| **Hỗ trợ proxy / firewall** | Đôi khi bị chặn nếu LB/proxy không hỗ trợ WebSocket | Thường tương thích tốt với proxy HTTP truyền thống |
| **API phía client** | `WebSocket` API: `new WebSocket(url)` | `EventSource` API: `new EventSource(url)` |
| **Reconnect** | Phải tự implement (retry, backoff) | `EventSource` tự reconnect, hỗ trợ `Last-Event-ID` |
| **Định dạng dữ liệu** | Text hoặc binary (frame) | Chỉ text (thường JSON trong field `data`) |
| **Use case điển hình** | Chat, game, collaboration 2 chiều, sàn giao dịch | Feed, notification, log stream, progress bar từ server |

---

### 7.2. WebSocket vs Socket.IO

| Tiêu chí | WebSocket (raw) | Socket.IO |
|----------|-----------------|-----------|
| **Bản chất** | **Protocol chuẩn** (RFC 6455) | **Thư viện** xây trên WebSocket + fallback |
| **Transport** | Chỉ WebSocket | WebSocket (ưu tiên) + long polling (fallback) |
| **Logic tầng ứng dụng** | Bạn tự xây: rooms, format message, reconnect, auth… | Có sẵn: rooms, namespaces, event, ack, middleware, adapter |
| **Reconnect** | Tự implement (backoff, giới hạn lần thử) | Auto-reconnect + exponential backoff có sẵn |
| **Event / message** | Gửi raw string/binary, tự parse (VD: JSON) | Event-based: `emit("eventName", data)`, `on("eventName", handler)` |
| **Rooms / channels** | Tự thiết kế (map client ↔ room) | Built-in: `socket.join(room)`, `io.to(room).emit(...)` |
| **Scaling nhiều server** | Tự tích hợp Redis/Kafka/NATS… | Adapter chính thức (VD: `socket.io-redis`) |
| **Khi nào dùng** | Cần tối ưu tối đa, kiểm soát chi tiết protocol | Dự án realtime nhanh, nhiều tính năng (chat, dashboard, game nhẹ) |

---

### 7.3. Long Polling trong bối cảnh so sánh

| Tiêu chí | Long Polling |
|----------|--------------|
| **Cách hoạt động** | Client gửi request, server giữ request mở đến khi có dữ liệu mới (hoặc timeout) rồi trả response; client gửi request tiếp theo. |
| **Ưu điểm** | Tương thích rộng; không yêu cầu hạ tầng hỗ trợ WebSocket/SSE. |
| **Nhược điểm** | Overhead HTTP lớn (headers, mở/đóng connection liên tục); dễ gây tải khi số client lớn. |
| **Vai trò với Socket.IO** | Socket.IO dùng long polling làm **fallback** khi không thiết lập được WebSocket (proxy/firewall). |

---

### 7.4. Bảng tổng hợp nhanh: Chọn công nghệ nào?

| Nhu cầu | Gợi ý |
|---------|--------|
| Chat, game, collaboration 2 chiều | WebSocket hoặc **Socket.IO** |
| Chỉ cần server đẩy: notification, feed, log | **SSE** |
| Không control được hạ tầng / cần fallback | Long polling (hoặc Socket.IO với polling) |
| Cần triển khai nhanh, đủ tính năng (room, reconnect, scale) | **Socket.IO** |
| Cần tối ưu performance, kiểm soát protocol từng chi tiết | **WebSocket thuần** (hoặc uWebSockets.js) |
