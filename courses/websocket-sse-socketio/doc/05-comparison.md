## 7. So sánh WebSocket, Socket.IO, SSE, Long Polling

- **7.1. WebSocket vs SSE**

  - **Chiều dữ liệu**:
    - WebSocket: **2 chiều**.
    - SSE: **1 chiều (server → client)**.
  - **Protocol**:
    - WebSocket: protocol riêng, handshake qua HTTP, sau đó là frames.
    - SSE: pure HTTP, text stream.
  - **Hỗ trợ proxy, firewall**:
    - SSE thường chơi thân hơn với proxy HTTP truyền thống.
    - WebSocket đôi khi bị chặn nếu LB/proxy không support.
  - **Trường hợp dùng**:
    - WebSocket: chat, game, collaboration 2 chiều.
    - SSE: feed, notification, log stream.

- **7.2. WebSocket vs Socket.IO**

  - WebSocket:
    - **Protocol gốc**.
    - Bạn phải tự cài đặt toàn bộ logic tầng trên.
  - Socket.IO:
    - **Layer cao** xây trên WebSocket + fallback.
    - Có thêm event, rooms, namespaces, auto-reconnect, ack, adapter scaling…
  - Khi nào dùng:
    - Dự án lớn, nhiều feature realtime → Socket.IO giúp tăng tốc dev.
    - Yêu cầu đặc biệt về performance/độ nhẹ → có thể dùng WebSocket thuần (hoặc uWebSockets).

- **7.3. Long Polling**
  - Ưu:
    - Tương thích rộng rãi.
    - Không yêu cầu hạ tầng hỗ trợ WebSocket/SSE.
  - Nhược:
    - Overhead HTTP lớn.
    - Dễ gây tải nếu số lượng client lớn.
  - Fallback:
    - Socket.IO có thể dùng long-polling như fallback khi không tạo được WebSocket.
