## 5. Socket.IO: Abstraction & tiện ích trên WebSocket

### 5.1. Socket.IO là gì?

- Một **thư viện** (không phải chỉ là WebSocket wrapper) cung cấp:
  - Kết nối realtime **đa transport**: WebSocket (ưu tiên), fallback long polling.
  - **Protocol riêng** trên WebSocket hoặc HTTP long-polling.
  - **Tính năng**: Rooms, namespaces, auto-reconnect, acknowledgement (callback), middleware auth, adapter scale (Redis, …).

### 5.2. Kiến trúc tổng quan

- **Server**: Node.js (Express, NestJS, …) + Socket.IO server.
- **Client**: Browser / Node / mobile dùng Socket.IO client.
- Luồng: Client connect → negotiation transport → event-based: `socket.emit("eventName", data)` và `socket.on("eventName", handler)`.

### 5.3. Khởi tạo Server & Client (code mẫu)

**Backend (Node.js + Express):**

```bash
mkdir socketio-demo && cd socketio-demo
pnpm init
pnpm add express socket.io
```

```javascript
// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("Client kết nối:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client ngắt:", socket.id);
  });
});

server.listen(3000, () => console.log("Socket.IO: http://localhost:3000"));
```

**Frontend (browser):**

```javascript
import { io } from "https://cdn.socket.io/iv4/socket.io.esm.min.js";

const socket = io("http://localhost:3000");

socket.on("connect", () => console.log("Đã kết nối"));
socket.on("disconnect", () => console.log("Mất kết nối"));
```

### 5.4. Namespaces & Rooms

- **Namespace** (`io.of("/admin")`): chia kênh logic trên cùng server (vd: `/`, `/chat`, `/admin`).
- **Room**: tập con socket trong một namespace; dùng để broadcast theo nhóm.

**Server:**

```javascript
io.on("connection", (socket) => {
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
  });

  // Gửi cho mọi client trong room
  socket.on("send-chat", (roomId, msg) => {
    io.to(roomId).emit("chat-message", msg);
  });
});
```

**Client:**

```javascript
socket.emit("join-room", "room1");
socket.on("chat-message", (msg) => console.log("Tin nhắn:", msg));
socket.emit("send-chat", "room1", "Hello");
```

### 5.5. Event & Acknowledgement

Client gửi kèm callback; server gọi callback để trả kết quả.

**Server:**

```javascript
socket.on("create-room", (name, callback) => {
  const roomId = generateId();
  rooms.set(roomId, name);
  callback({ ok: true, roomId });
});
```

**Client:**

```javascript
socket.emit("create-room", "My Room", (res) => {
  if (res.ok) console.log("Room ID:", res.roomId);
});
```

### 5.6. Auth (middleware)

**Server:** Kiểm tra token trong handshake, từ chối nếu sai.

```javascript
const io = new Server(server, { cors: { origin: "*" } });

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token || !verifyJWT(token)) {
    return next(new Error("Unauthorized"));
  }
  socket.user = decodeJWT(token);
  next();
});

io.on("connection", (socket) => {
  console.log("User:", socket.user);
});
```

**Client:**

```javascript
const socket = io("http://localhost:3000", {
  auth: { token: "your-jwt-token" },
});
```

### 5.7. Auto-reconnect & error handling

Client tự reconnect với backoff. Nên lắng nghe `connect`, `disconnect`, `reconnect`, `connect_error` để cập nhật UI.

```javascript
socket.on("connect", () => setStatus("Đã kết nối"));
socket.on("disconnect", (reason) => setStatus("Mất kết nối: " + reason));
socket.on("connect_error", (err) => setStatus("Lỗi: " + err.message));
socket.on("reconnect", () => setStatus("Đã kết nối lại"));
```

### 5.8. Scaling với Redis adapter

Nhiều instance Socket.IO cần đồng bộ message qua Redis (hoặc broker khác).

```javascript
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

const pubClient = createClient({ url: "redis://localhost:6379" });
const subClient = pubClient.duplicate();
await Promise.all([pubClient.connect(), subClient.connect()]);
io.adapter(createAdapter(pubClient, subClient));
```

---

## 5.9. Ứng dụng: Terminal SSH vào VPS (Socket.IO)

Ý tưởng: **trình duyệt** hiển thị terminal (xterm.js), mọi input gửi lên server qua Socket.IO; server mở kết nối **SSH** tới VPS và chuyển stdin/stdout qua socket. Như vậy bạn có “terminal trong browser” để SSH vào VPS.

### Kiến trúc

- **Frontend**: Trang web dùng **xterm.js** (terminal ảo) + **Socket.IO client**.
  - Gửi từng ký tự/chuỗi nhập: `socket.emit('input', data)`.
  - Nhận output từ server: `socket.on('output', data)` → ghi vào xterm.
- **Backend**: **Express + Socket.IO** + thư viện **ssh2**.
  - Khi client báo “bắt đầu SSH” (vd: event `start-ssh` kèm host, user, password hoặc key), server tạo kết nối SSH tới VPS.
  - Server lắng nghe `input` từ client → ghi vào SSH stream.
  - Server lắng nghe data từ SSH (stdout/stderr) → `socket.emit('output', data)`.

### Cài đặt

```bash
pnpm add express socket.io ssh2
# Frontend: xterm, xterm-addon-fit, socket.io-client (hoặc CDN)
```

### Backend: Socket.IO + SSH2

Server mỗi socket có thể tạo một kết nối SSH riêng (vd: một tab = một SSH session). Khi client gửi `start-ssh` với thông tin đăng nhập, server dùng `ssh2` để kết nối và chuyển stdin/stdout qua socket.

```javascript
// server-ssh.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { Client } = require("ssh2");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  let conn = null;
  let stream = null;

  socket.on("start-ssh", (config, callback) => {
    if (conn) {
      conn.end();
      conn = null;
    }
    conn = new Client();
    conn
      .on("ready", () => {
        conn.shell((err, s) => {
          if (err) {
            callback({ ok: false, error: err.message });
            return;
          }
          stream = s;
          stream.on("data", (data) => {
            socket.emit("output", data.toString());
          });
          stream.stderr.on("data", (data) => {
            socket.emit("output", data.toString());
          });
          stream.on("close", () => {
            socket.emit("output", "\r\n[Session closed]\r\n");
          });
          callback({ ok: true });
        });
      })
      .on("error", (err) => {
        callback({ ok: false, error: err.message });
      })
      .connect({
        host: config.host,
        port: config.port || 22,
        username: config.username,
        password: config.password || undefined,
        privateKey: config.privateKey || undefined,
      });
  });

  socket.on("input", (data) => {
    if (stream && !stream.writableEnded) {
      stream.write(data);
    }
  });

  socket.on("disconnect", () => {
    if (conn) conn.end();
  });
});

server.listen(3000, () =>
  console.log("Terminal SSH server: http://localhost:3000")
);
```

- `start-ssh`: nhận `config` (host, port, username, password hoặc privateKey); sau khi SSH `ready`, mở shell và gửi stdout/stderr qua event `output`; trả kết quả qua `callback`.
- `input`: client gửi từng buffer/chuỗi (phím bấm); server ghi vào SSH shell.
- Khi client disconnect, server đóng SSH.

### Frontend: xterm.js + Socket.IO client

Trang HTML load xterm và Socket.IO client, kết nối tới server. Mọi ký tự nhập trong terminal gửi lên server qua `input`; mọi `output` từ server ghi vào terminal.

```html
<!DOCTYPE html>
<html>
  <head>
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/xterm@5.3/css/xterm.css"
    />
  </head>
  <body>
    <div id="terminal" style="width:800px;height:400px;"></div>
    <script src="https://cdn.socket.io/iv4/socket.io.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/xterm@5.3/lib/xterm.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.min.js"></script>
    <script>
      const socket = io("http://localhost:3000");
      const term = new Terminal();
      const fitAddon = new FitAddon.FitAddon();
      term.loadAddon(fitAddon);
      term.open(document.getElementById("terminal"));
      fitAddon.fit();

      term.onData((data) => {
        socket.emit("input", data);
      });

      socket.on("output", (data) => {
        term.write(data);
      });

      socket.on("connect", () => {
        term.writeln("Đã kết nối server. Gọi start-ssh từ console hoặc form.");
      });

      // Ví dụ: bắt đầu SSH (trong thực tế nên dùng form + auth)
      window.startSSH = (host, user, password) => {
        socket.emit(
          "start-ssh",
          {
            host: host || "your-vps.com",
            username: user || "root",
            password: password || "",
          },
          (res) => {
            if (res.ok) term.writeln("\r\nSSH session started.");
            else term.writeln("\r\nError: " + res.error);
          }
        );
      };
    </script>
  </body>
</html>
```

- `term.onData`: mỗi lần user gõ (hoặc paste), gửi lên server qua `socket.emit('input', data)`.
- `socket.on('output', data)`: ghi dữ liệu server trả về vào terminal.
- `startSSH(host, user, password)`: gọi từ console hoặc từ form; trong production nên dùng backend tạo session (token, SSH key) thay vì gửi password trực tiếp từ client.

### Bảo mật và lưu ý

- **Không gửi mật khẩu VPS từ browser**: Nên có bước đăng nhập app (JWT), server lấy credential từ biến môi trường hoặc vault, rồi mới tạo SSH. Hoặc dùng SSH key do server nắm giữ.
- **Giới hạn user**: Chỉ user đã xác thực mới được gọi `start-ssh`; có thể giới hạn host/user được phép SSH.
- **Rate limit & timeout**: Giới hạn số kết nối SSH đồng thời, đóng session khi idle.

---

## 5.10. Tóm tắt

| Tính năng       | Cách dùng                                            |
| --------------- | ---------------------------------------------------- |
| Kết nối         | `io(url)`, `io.on('connection', ...)`                |
| Gửi event       | `socket.emit('event', data)`                         |
| Nhận event      | `socket.on('event', handler)`                        |
| Room            | `socket.join(roomId)`, `io.to(roomId).emit(...)`     |
| Acknowledgement | `socket.emit('event', data, callback)`               |
| Auth            | `io.use((socket, next) => { ... next(); })`          |
| Scale           | Redis adapter: `io.adapter(createAdapter(pub, sub))` |

Ứng dụng **terminal SSH vào VPS** minh họa cách dùng Socket.IO để truyền stream hai chiều (input/output) giữa trình duyệt và server, server lại nói chuyện với VPS qua SSH.
