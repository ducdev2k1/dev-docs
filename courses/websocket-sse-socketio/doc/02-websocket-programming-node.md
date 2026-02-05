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

---

### 4.5. Ví dụ code đầy đủ: Server + Client

Ví dụ dưới đây minh họa một **server WebSocket** (Node.js + `ws`) và **client** (trình duyệt) với protocol JSON đơn giản: client gửi message, server broadcast tới tất cả client khác.

#### Bước 1: Cài đặt

```bash
npm init -y
npm install ws
```

#### Bước 2: Server (Node.js) – `server.js`

```javascript
const { WebSocketServer } = require('ws');

// Cổng chạy server
const PORT = 8080;

// Tạo WebSocket server (có thể gắn vào HTTP server có sẵn)
const wss = new WebSocketServer({ port: PORT });

// Danh sách tất cả client đang kết nối (để broadcast)
const clients = new Set();

wss.on('connection', (ws, req) => {
  // Thêm client mới vào tập hợp
  clients.add(ws);
  console.log('Client kết nối. Tổng số:', clients.size);

  // Gửi message chào mừng ngay khi kết nối
  ws.send(JSON.stringify({
    type: 'system',
    message: 'Bạn đã kết nối. Gửi tin nhắn sẽ được broadcast tới mọi người.',
  }));

  // Nhận message từ client
  ws.on('message', (data) => {
    let payload;
    try {
      payload = JSON.parse(data.toString());
    } catch {
      ws.send(JSON.stringify({ type: 'error', message: 'Payload phải là JSON.' }));
      return;
    }

    // Ví dụ: type "chat" → broadcast tới tất cả client (kể cả người gửi)
    if (payload.type === 'chat' && payload.text) {
      const broadcast = {
        type: 'chat',
        text: payload.text,
        time: new Date().toISOString(),
      };
      clients.forEach((client) => {
        if (client.readyState === 1) { // OPEN
          client.send(JSON.stringify(broadcast));
        }
      });
    }
  });

  // Khi client đóng kết nối → xóa khỏi danh sách
  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client ngắt kết nối. Còn lại:', clients.size);
  });

  ws.on('error', () => {
    clients.delete(ws);
  });
});

console.log('WebSocket server đang chạy tại ws://localhost:' + PORT);
```

**Giải thích nhanh:**

| Phần code | Ý nghĩa |
|-----------|--------|
| `WebSocketServer({ port })` | Tạo server lắng tại cổng `PORT`. |
| `clients = new Set()` | Lưu mọi socket đang mở để broadcast. |
| `ws.on('message', ...)` | Nhận dữ liệu từ client; parse JSON, xử lý theo `type`. |
| `client.readyState === 1` | Trạng thái `OPEN` (sẵn sàng gửi). |
| `ws.on('close')` / `ws.on('error')` | Dọn dẹp: xóa client khỏi `clients`. |

#### Bước 3: Client (trình duyệt) – có thể chạy trong HTML hoặc DevTools

```javascript
const url = 'ws://localhost:8080';
const ws = new WebSocket(url);

// Kết nối thành công
ws.onopen = () => {
  console.log('Đã kết nối tới server.');
  // Gửi tin nhắn đầu tiên
  ws.send(JSON.stringify({ type: 'chat', text: 'Xin chào mọi người!' }));
};

// Nhận message từ server
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Nhận:', data);
  if (data.type === 'chat') {
    console.log('Tin nhắn:', data.text, '–', data.time);
  }
};

// Lỗi hoặc đóng
ws.onerror = (e) => console.error('Lỗi:', e);
ws.onclose = () => console.log('Đã ngắt kết nối.');
```

**Gửi tin nhắn từ client (sau khi đã kết nối):**

```javascript
ws.send(JSON.stringify({ type: 'chat', text: 'Nội dung tin nhắn của bạn' }));
```

**Chạy thử:**

1. Terminal: `node server.js`
2. Mở 2 tab trình duyệt, mỗi tab mở Console (F12) và dán đoạn client vào (sau khi sửa `url` nếu cần).
3. Gửi tin nhắn bằng `ws.send(...)` → tin sẽ hiện ở cả hai tab (broadcast).

Từ ví dụ này bạn có thể mở rộng: thêm **room** (map socket ↔ room), **ping/pong** keepalive, **reconnect** với backoff ở client, hoặc gắn WebSocket server vào HTTP server (Express, Fastify) để dùng chung cổng với API REST.
