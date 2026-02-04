## 6. Server-Sent Events (SSE)

- **6.1. SSE là gì?**

  - Cơ chế **một chiều**: server → client, dựa trên **HTTP**.
  - Client dùng `EventSource` API.
  - Kết nối được giữ mở, server gửi **dòng text** với format đặc biệt (`text/event-stream`).

- **6.2. Đặc điểm kỹ thuật**

  - **HTTP-based**, không cần handshake đặc biệt như WebSocket.
  - Chỉ hỗ trợ **server push**, không có client → server theo channel đó (client vẫn có thể gọi HTTP POST bình thường).
  - Tự động reconnect (do `EventSource` xử lý).
  - Hỗ trợ:
    - **Event name**.
    - **Event id** (hỗ trợ resume sau disconnect).
    - **Retry** interval.

- **6.3. Định dạng payload SSE**

  - Header response:
    - `Content-Type: text/event-stream`
    - `Cache-Control: no-cache`
  - Mỗi event là một block gồm các dòng:
    - `id: <event-id>`
    - `event: <event-name>`
    - `data: <json hoặc text>`
    - (dòng trống kết thúc event)
  - Ví dụ:
    - `data: {"message": "Hello"}`
      (xuống dòng)
      (dòng trống)

- **6.4. Ưu/nhược điểm SSE**

  - **Ưu**:
    - Dễ cài, không cần custom protocol.
    - Giữ kết nối ít overhead hơn WebSocket trong nhiều case one-way.
    - Hỗ trợ tốt qua proxy/hạ tầng HTTP truyền thống.
  - **Nhược**:
    - Chỉ hỗ trợ từ server → client trên channel này.
    - Không phù hợp chat hai chiều phức tạp, game.
    - Một số environment cũ không hỗ trợ tốt.

- **6.5. Use cases phù hợp SSE**
  - Notification feed.
  - Live logs / metrics stream về dashboard.
  - Live build progress (CI/CD), status update dài.
  - Tất cả trường hợp **client chủ yếu cần lắng nghe dữ liệu mới**, ít gửi lại.
