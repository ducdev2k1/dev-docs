## 3. WebSocket: Từ lý thuyết đến protocol chi tiết

### 3.1. WebSocket là gì?

- Là một **protocol riêng** (không phải HTTP), nhưng handshake ban đầu đi **qua HTTP/1.1**.
  - Sau khi handshake xong, kết nối **nâng cấp (upgrade)** từ HTTP sang WebSocket.
  - Đặc điểm:
    - **Full-duplex**: client ↔ server đều có thể gửi message bất cứ lúc nào.
    - Một kết nối TCP lâu dài, không phải mở/đóng liên tục.

### 3.2. WebSocket handshake

- Diễn ra qua HTTP/1.1 với header đặc biệt:
  - Request từ client (giản lược):
    - Method: `GET`
    - Header chính:
      - `Upgrade: websocket`
      - `Connection: Upgrade`
      - `Sec-WebSocket-Key: <base64-random>`
      - `Sec-WebSocket-Version: 13`
  - Server phản hồi nếu chấp nhận:
    - Status: `101 Switching Protocols`
    - Header:
      - `Upgrade: websocket`
      - `Connection: Upgrade`
      - `Sec-WebSocket-Accept: <hash từ Sec-WebSocket-Key + GUID>`
  - Sau bước này:
    - Không còn HTTP request/response, thay vào đó là **WebSocket frames** chạy trên cùng TCP connection.

### 3.3. Cấu trúc frame của WebSocket (RFC 6455)

- Mỗi message được chia thành 1 hoặc nhiều **frame**.
  - Các field quan trọng:
    - FIN, RSV1–3, **opcode** (text, binary, close, ping, pong).
    - **Mask** (client → server bắt buộc phải mask), **payload length**, **masking key**, **payload data**.
  - **Text frame**: thường là UTF-8 string (JSON, text).
  - **Binary frame**: buffer/binary (file, blob, protobuf…).

### 3.4. Ping/Pong, close

- **Ping/Pong**:
  - Dùng để kiểm tra health của kết nối, giữ kết nối không bị time-out bởi middlebox.
  - Thường library WebSocket tự quản lý.
  - **Close**:
    - Gửi frame close với mã code (1000, 1001, 1006…) để kết thúc kết nối có trật tự.

### 3.5. Bảo mật

- **WSS (WebSocket Secure)**:
  - WebSocket trên TLS (tương đương `https`).
  - URL dạng `wss://example.com/socket`.
  - Lưu ý:
    - Auth thường không built-in như cookie/session, mà bạn phải **tự thiết kế cách truyền token** (query param, header, subprotocol, handshake payload).
    - Cần chặn truy cập không mong muốn (origin check, token, rate limiting).

### 3.6. Flow tổng quát của một ứng dụng WebSocket

1. Client mở kết nối `ws://` hoặc `wss://`.
2. Server xác thực (nếu cần) trong quá trình handshake.
3. Sau khi kết nối, client/server subscribe các channel/rooms (tự định nghĩa).
4. Gửi/nhận message text/binary theo định dạng riêng (JSON, protobuf…).
5. Khi user rời đi hoặc lỗi mạng → close kết nối / reconnect.
