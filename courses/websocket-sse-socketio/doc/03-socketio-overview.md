## 5. Socket.IO: Abstraction & tiện ích trên WebSocket

- **5.1. Socket.IO là gì?**

  - Một **thư viện** (không phải chỉ là WebSocket wrapper) cung cấp:
    - Kết nối realtime **đa transport**:
      - WebSocket (ưu tiên).
      - Fallback: long polling (tùy cấu hình).
    - **Protocol riêng** trên WebSocket (hoặc HTTP long-polling).
    - **Tính năng cao cấp**:
      - Rooms, namespaces.
      - Auto-reconnect, exponential backoff.
      - Acknowledgement cho event (giống callback).
      - Middleware cho auth.
      - Adapter để scale ngang (Redis, message brokers…).

- **5.2. Kiến trúc tổng quan**

  - Thành phần:
    - **Socket.IO server** (Node.js, NestJS, Adonis, hoặc framework khác có integration).
    - **Socket.IO client** (JS browser, Node.js client, mobile client).
  - Luồng:
    1. Client connect tới endpoint (VD `/socket.io`).
    2. Negotiation chọn transport (WebSocket, polling).
    3. Khi đã ổn định, sử dụng WebSocket nếu có thể.
    4. Trao đổi message dạng **event-based**:
       - `socket.emit("eventName", data)` trên client/server.

- **5.3. Namespaces & Rooms**

  - **Namespace** (`io.of("/admin")`):
    - Giúp chia logical channel trên cùng server.
    - Ví dụ: `/` (default), `/chat`, `/admin`.
  - **Room**:
    - Một tập con socket trong 1 namespace.
    - Dùng cho broadcast theo nhóm:
      - `socket.join("room1")`
      - `io.to("room1").emit("message", data)`

- **5.4. Event & Acknowledgement**

  - Gửi event:
    - Client: `socket.emit("chat_message", { text: "Hi" })`.
    - Server: `io.emit("chat_message", { text: "Hi" })`.
  - Acknowledgement:
    - Client gửi kèm callback:
      - `socket.emit("create_room", payload, (response) => { ... })`.
    - Server xử lý và gọi callback đó để báo kết quả (success/error).

- **5.5. Auto-reconnect & error handling**

  - Socket.IO client tự:
    - Thử reconnect nếu mất kết nối mạng.
    - Áp dụng backoff (tăng dần thời gian chờ).
    - Cho phép giới hạn số lần thử reconnect.
  - Dev cần:
    - Lắng nghe event `connect`, `disconnect`, `reconnect`, `connect_error`… để hiển thị UI phù hợp.

- **5.6. Auth trong Socket.IO**

  - Thường dùng:
    - JWT truyền qua:
      - Query param khi connect.
      - Hoặc `auth` field trong options trên client.
    - Trên server, dùng **middleware**:
      - Kiểm tra token → reject/accept.
  - Lưu ý:
    - Token dễ bị lộ nếu để ở query string (log, URL).
    - Nên dùng HTTPS/WSS, thời gian sống token ngắn, rotate…

- **5.7. Scaling Socket.IO**
  - Vấn đề:
    - Nhiều instance Socket.IO server chạy sau load balancer.
    - Client A kết nối vào instance 1, client B vào instance 2.
    - Nếu A gửi message tới room `room1`, mà user ở room đó đang nằm trên instance khác, message phải được **phát tán qua tất cả instance**.
  - Giải pháp:
    - **Redis adapter**:
      - Mỗi instance Socket.IO kết nối tới Redis làm Pub/Sub.
      - Khi emit tới một room, instance publish message lên Redis.
      - Tất cả instance khác subscribe và gửi tiếp tới clients cục bộ.
    - Các adapter khác: Kafka, NATS, in-house broker…
