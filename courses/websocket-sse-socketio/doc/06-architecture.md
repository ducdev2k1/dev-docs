## 8. Thiết kế kiến trúc ứng dụng realtime

- **8.1. Xác định yêu cầu**

  - Bao nhiêu user đồng thời?
  - Kiểu tương tác:
    - One-to-one (chat riêng)?
    - One-to-many (live stream)?
    - Many-to-many (group chat, game nhiều người)?
  - Có cần:
    - Lưu lịch sử message?
    - Guarantee delivery?
    - Ordering strict?

- **8.2. Pattern cơ bản**

  - **Pub/Sub**:
    - Client subscribe vào topic.
    - Server publish message lên topic → client nhận.
  - **Request/Response qua WebSocket**:
    - Định nghĩa message type `request`, `response`.
  - **Command & Event**:
    - Client gửi **Command** (VD: `join_room`) → server xử lý → phát **Event** (VD: `user_joined`).

- **8.3. Lưu trữ & đồng bộ state**

  - State tạm thời (ai online, user đang ở room nào) có thể lưu:
    - In-memory trên mỗi node.
    - Redis (để share giữa node).
  - State lâu dài (message history, profile):
    - DB (PostgreSQL, MongoDB, …).
  - Cần thiết kế:
    - Event sourcing hoặc log-based nếu hệ thống rất lớn.

- **8.4. Bảo mật & phân quyền**
  - Auth:
    - JWT / session cookie.
    - Được verify trong handshake (WebSocket) hoặc middleware (Socket.IO).
  - Authorization:
    - Kiểm tra user có quyền join room / nhận event đó không.
  - Rate limiting:
    - Giới hạn số message/s per client.
    - Giảm nguy cơ spam, DDoS.
