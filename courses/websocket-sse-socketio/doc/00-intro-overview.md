## Khóa học chuyên sâu: WebSocket, Socket.IO, Server-Sent Events (SSE)

> Tài liệu này được thiết kế như một khóa học tự học / giảng dạy, đi từ nền tảng tới chuyên sâu. Bạn có thể học lần lượt từng chương hoặc nhảy vào phần công nghệ bạn cần.

- **Đối tượng**: Dev backend/front-end đã biết HTTP/REST cơ bản.
- **Yêu cầu nền tảng**: Biết JS/TS, Node.js ở mức cơ bản, hiểu request/response.
- **Mục tiêu**:
  - Hiểu rõ **bản chất kết nối lâu dài (long-lived connection)** trên web.
  - Nắm chắc **WebSocket** ở mức **protocol** (handshake, frame, ping/pong…).
  - Sử dụng **Socket.IO** để xây dựng ứng dụng realtime thực tế (chat, game, dashboard).
  - Hiểu và áp dụng **SSE (Server-Sent Events)** phù hợp các case one-way streaming.
  - Biết **so sánh, lựa chọn** giữa WebSocket, SSE, long polling… cho từng bài toán.

---

## 1. Tổng quan: Tại sao cần realtime trên web?

- **1.1. Hạn chế của HTTP truyền thống**

  - HTTP/1.1 kiểu classic là **request–response**:
    - Client luôn là bên **chủ động** gửi request.
    - Server **không thể** tự đẩy dữ liệu xuống client nếu client không hỏi.
  - Vấn đề với ứng dụng realtime:
    - Chat, notification, giá chứng khoán, game, tracking vị trí… cần **cập nhật ngay lập tức**.
    - Nếu chỉ dùng HTTP thuần:
      - **Polling**: client gọi API liên tục (ví dụ mỗi 2s) → lãng phí tài nguyên, độ trễ không ổn định.
      - **Long Polling**: client giữ kết nối chờ dữ liệu → cải thiện nhưng vẫn có overhead của HTTP, reconnect liên tục.

- **1.2. Các mô hình “realtime” phổ biến**

  - **Short Polling**: client loop gọi API → dễ cài, tốn tài nguyên.
  - **Long Polling**: giữ request mở lâu, server trả về khi có dữ liệu mới → giả realtime.
  - **WebSocket**: kết nối **hai chiều**, **full-duplex**, lâu dài giữa client–server.
  - **SSE (Server-Sent Events)**: kết nối **một chiều: server → client**, dựa trên HTTP.
  - **Các dịch vụ third-party**: Pusher, Ably, Firebase RTDB, Supabase Realtime…

- **1.3. Khi nào nên dùng mỗi công nghệ? (Overview)**
  - **WebSocket / Socket.IO**:
    - Chat, game nhiều người, sàn giao dịch, collaboration (Google Docs-style), IoT control…
  - **SSE**:
    - Notification, log streaming, price feed đơn giản, progress cập nhật từ server…
  - **Long Polling**:
    - Khi không control được hạ tầng, không bật được WebSocket/SSE, hoặc cần fallback.

---

## 2. Nền tảng kỹ thuật: Kết nối lâu dài trên Web

- **2.1. TCP, HTTP, và “keep-alive”**

  - **TCP**: protocol ở tầng transport đảm bảo truyền dữ liệu tin cậy.
  - **HTTP**:
    - Chạy **trên TCP**.
    - HTTP/1.1 mặc định bật **keep-alive** → một TCP connection có thể dùng cho nhiều request/response nối tiếp.
  - Nhưng: HTTP truyền thống vẫn **request–response**, không có cơ chế đẩy chủ động tự nhiên.

- **2.2. Mô hình concurrency trên server**

  - Khi dùng kết nối lâu dài:
    - Mỗi client giữ kết nối → server phải quản lý rất nhiều socket.
    - Cần chú ý:
      - **Memory usage** trên server.
      - **Event loop** (Node.js), thread (Java, Go), async I/O.
      - **Backpressure**: khi client đọc chậm hơn server gửi.

- **2.3. Scaling realtime**
  - Một server đơn không đủ khi:
    - Hàng chục/hàng trăm nghìn kết nối đồng thời.
    - Cần _broadcast_ tới nhiều client đang kết nối trên **nhiều instance server khác nhau**.
  - Giải pháp phổ biến:
    - **Load balancer** hỗ trợ sticky session hoặc session affinity.
    - **Message broker**: Redis Pub/Sub, Kafka, NATS… để sync message giữa các node.
    - Adapter/scaling layer của Socket.IO (VD: `socket.io-redis`).
