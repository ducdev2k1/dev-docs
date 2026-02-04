## 4. Lập trình với WebSocket (raw) – Node.js

> Phần này giúp bạn hiểu **“đáy” của Socket.IO**. Nắm rõ WebSocket thuần giúp bạn debug tốt hơn khi dùng thư viện cao hơn.

- **4.1. Thư viện phổ biến**

  - Node.js:
    - `ws`: thư viện WebSocket đơn giản, phổ biến nhất.
    - `uWebSockets.js`: hiệu năng rất cao (khó dùng hơn).
  - Browser:
    - `WebSocket` API native: `new WebSocket(url)`.

- **4.2. Server WebSocket cơ bản với `ws`**

  - Kiến thức cần nắm:
    - Tạo WebSocket server.
    - Lắng nghe event `connection`, `message`, `close`, `error`.
    - Broadcast message tới nhiều client.
    - Giữ danh sách clients đang kết nối.

- **4.3. Các pattern thường gặp khi dùng raw WebSocket**

  - **Topic / Channel / Room tự cài**:
    - Map client → list rooms.
    - Room → list clients.
  - **Protocol trên WebSocket**:
    - Định nghĩa format JSON:
      - Ví dụ: `{ type: "join_room", room: "room1" }`.
      - `{ type: "message", room: "room1", content: "Hello" }`.
  - **Heartbeat / Keepalive**:
    - Ping/pong ở tầng application để biết client còn sống.
  - **Error handling & reconnect**:
    - Client tự retry với backoff (1s, 2s, 4s…).

- **4.4. Ưu/nhược điểm WebSocket thuần**
  - **Ưu**:
    - Kiểm soát rất chi tiết protocol.
    - Ít overhead nếu triển khai tốt.
  - **Nhược**:
    - Tự xử lý: reconnect, fallback, rooms/namespaces, message format, versioning, auth, scaling…
    - Nhiều việc lặp lại giữa project → khó maintain.
