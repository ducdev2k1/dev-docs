## Khóa học: WebSocket, Socket.IO & Server-Sent Events (SSE)

Chào mừng bạn đến với khóa học **Realtime trên Web**. Tài liệu đi từ nền tảng HTTP, protocol WebSocket, thư viện Socket.IO, đến Server-Sent Events (SSE), kèm ví dụ code Backend và Frontend.

### Bạn sẽ học được gì?

- Hiểu **kết nối lâu dài** và các mô hình realtime (polling, long polling, WebSocket, SSE).
- Nắm **WebSocket** ở mức protocol (handshake, frame, ping/pong) và lập trình với Node.js.
- Sử dụng **Socket.IO** (rooms, namespaces, auth, scaling với Redis).
- Triển khai **SSE**: khởi tạo endpoint Backend và bắt sự kiện trên Frontend.
- So sánh và chọn công nghệ phù hợp; thiết kế kiến trúc và testing.

### Yêu cầu

- Biết **HTTP/REST** cơ bản, **JavaScript/TypeScript**, **Node.js** (cài đặt, chạy script).
- Có thể đọc code Vue/React đơn giản (cho phần ví dụ FE).

### Cấu trúc khóa học

Tài liệu được chia thành các phần sau, nên đọc theo thứ tự:

| #   | Bài                                                                 | File                               |
| --- | ------------------------------------------------------------------- | ---------------------------------- |
| 1   | [Tổng quan & Nền tảng](./00-intro-overview.md)                      | `00-intro-overview.md`             |
| 2   | [WebSocket – Lý thuyết](./01-websocket-theory.md)                   | `01-websocket-theory.md`           |
| 3   | [WebSocket – Lập trình Node.js](./02-websocket-programming-node.md) | `02-websocket-programming-node.md` |
| 4   | [Socket.IO](./03-socketio-overview.md)                              | `03-socketio-overview.md`          |
| 5   | [Server-Sent Events (SSE)](./04-sse.md)                             | `04-sse.md`                        |
| 6   | [So sánh công nghệ](./05-comparison.md)                             | `05-comparison.md`                 |
| 7   | [Thiết kế kiến trúc](./06-architecture.md)                          | `06-architecture.md`               |
| 8   | [Testing & Debugging](./07-testing-debugging.md)                    | `07-testing-debugging.md`          |
| 9   | [Lộ trình học](./08-learning-path.md)                               | `08-learning-path.md`              |

### Bắt đầu

Nên bắt đầu từ **[1. Tổng quan & Nền tảng](./00-intro-overview.md)** để hiểu bối cảnh và hạn chế của HTTP, sau đó lần lượt WebSocket → Socket.IO → SSE.

Nếu bạn đã quen WebSocket, có thể nhảy thẳng tới **[5. Server-Sent Events (SSE)](./04-sse.md)** (có ví dụ BE + FE) hoặc **[4. Socket.IO](./03-socketio-overview.md)**.
