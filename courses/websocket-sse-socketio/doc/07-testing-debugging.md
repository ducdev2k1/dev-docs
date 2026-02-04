## 9. Testing & Debugging ứng dụng realtime

- **9.1. Testing logic**

  - Unit test:
    - Các hàm xử lý message, validate payload, mapping command → event.
  - Integration test:
    - Dùng client giả (Socket.IO client, WebSocket client) kết nối vào server.
    - Kiểm tra luồng: connect → auth → join room → gửi/nhận event.

- **9.2. Debug**

  - WebSocket:
    - DevTools tab Network → filter WebSocket.
    - Xem từng frame gửi/nhận.
  - Socket.IO:
    - Bật debug log (`localStorage.debug = "socket.io-client:*"` trên browser).
    - Xem log connect/disconnect, error.
  - SSE:
    - Check response stream bằng curl hoặc Postman (với streaming).

- **9.3. Observability**
  - Log:
    - Kết nối/mất kết nối.
    - Lỗi khi auth, join room, gửi message.
  - Metrics:
    - Số connection đang mở.
    - Số event/giây.
    - Độ trễ trung bình message.
