## 6. Server-Sent Events (SSE)

### 6.1. SSE là gì?

- Cơ chế **một chiều**: server → client, dựa trên **HTTP**.
- Client dùng `EventSource` API.
- Kết nối được giữ mở, server gửi **dòng text** với format đặc biệt (`text/event-stream`).

### 6.2. Đặc điểm kỹ thuật

- **HTTP-based**, không cần handshake đặc biệt như WebSocket.
- Chỉ hỗ trợ **server push**, không có client → server theo channel đó (client vẫn có thể gọi HTTP POST bình thường).
- Tự động reconnect (do `EventSource` xử lý).
- Hỗ trợ:
  - **Event name**.
  - **Event id** (hỗ trợ resume sau disconnect).
  - **Retry** interval.

### 6.3. Định dạng payload SSE

- Header response:
  - `Content-Type: text/event-stream`
  - `Cache-Control: no-cache`
  - `Connection: keep-alive`
- Mỗi event là một block gồm các dòng:
  - `id: <event-id>` (tùy chọn)
  - `event: <event-name>` (tùy chọn, mặc định là `message`)
  - `data: <json hoặc text>` (có thể nhiều dòng `data:`)
  - Dòng trống kết thúc event
- Ví dụ một event:

```text
event: notification
id: 42
data: {"type":"info","message":"Hello"}

```

### 6.4. Ưu/nhược điểm SSE

- **Ưu**:
  - Dễ cài, không cần custom protocol.
  - Giữ kết nối ít overhead hơn WebSocket trong nhiều case one-way.
  - Hỗ trợ tốt qua proxy/hạ tầng HTTP truyền thống.
- **Nhược**:
  - Chỉ hỗ trợ từ server → client trên channel này.
  - Không phù hợp chat hai chiều phức tạp, game.
  - Một số environment cũ không hỗ trợ tốt.

### 6.5. Use cases phù hợp SSE

- Notification feed.
- Live logs / metrics stream về dashboard.
- Live build progress (CI/CD), status update dài.
- Tất cả trường hợp **client chủ yếu cần lắng nghe dữ liệu mới**, ít gửi lại.

---

## 6.6. Backend: Khởi tạo endpoint SSE

Server cần trả về response với đúng header và ghi body theo chuẩn SSE. Ví dụ dưới dùng **Node.js + Express**.

### Cài đặt

```bash
mkdir sse-demo && cd sse-demo
pnpm init
pnpm add express
```

### Server mẫu (Express)

- Set header `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`.
- Không gọi `res.end()` ngay; giữ kết nối và ghi từng event bằng `res.write()` theo format SSE.
- Mỗi event kết thúc bằng **hai ký tự newline** `\n\n`.

```javascript
// server.js
const express = require("express");
const app = express();
const PORT = 3000;

// Middleware: disable nén để stream hoạt động ổn định
app.use((req, res, next) => {
  res.setHeader("X-Accel-Buffering", "no");
  next();
});

// Endpoint SSE
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  let id = 0;

  // Gửi event mỗi 2 giây (heartbeat / notification mẫu)
  const interval = setInterval(() => {
    id += 1;
    const data = { time: new Date().toISOString(), id };
    res.write(`event: message\n`);
    res.write(`id: ${id}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    res.flush?.();
  }, 2000);

  // Khi client đóng kết nối
  req.on("close", () => {
    clearInterval(interval);
    res.end();
  });
});

// Event có tên riêng (ví dụ: notification)
app.get("/events/notifications", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  const send = (eventName, payload) => {
    res.write(`event: ${eventName}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
    res.flush?.();
  };

  send("connected", { message: "Bạn đã kết nối SSE." });

  const t = setInterval(() => {
    send("notification", {
      type: "info",
      title: "Thông báo",
      body: `Server time: ${new Date().toISOString()}`,
    });
  }, 3000);

  req.on("close", () => {
    clearInterval(t);
    res.end();
  });
});

app.listen(PORT, () => console.log(`Server SSE: http://localhost:${PORT}`));
```

Chạy: `node server.js`. Endpoint:

- `GET /events` — stream event mặc định (tên `message`) mỗi 2s.
- `GET /events/notifications` — event `connected` một lần, sau đó event `notification` mỗi 3s.

### Ghi event đúng chuẩn SSE

- Mỗi dòng bắt đầu bằng `event:`, `id:`, `data:` (hoặc `retry:`).
- Một event có thể có nhiều dòng `data:`; client nối lại bằng newline.
- Kết thúc mỗi event bằng `\n\n`.

```javascript
// Ví dụ ghi một event
res.write(`event: log\n`);
res.write(`id: ${id}\n`);
res.write(`data: ${JSON.stringify({ level: "info", msg: "Done" })}\n\n`);
```

---

## 6.7. Frontend: Bắt sự kiện với EventSource

Client dùng **EventSource** (API trình duyệt) để kết nối tới URL SSE và lắng nghe event.

### Kết nối và lắng nghe event mặc định (`message`)

```javascript
const es = new EventSource("http://localhost:3000/events");

es.onmessage = (e) => {
  const data = JSON.parse(e.data);
  console.log("Nhận event:", data);
};

es.onerror = (err) => {
  console.error("SSE error:", err);
  // EventSource tự reconnect theo mặc định
};

es.onopen = () => {
  console.log("Đã kết nối SSE");
};

// Đóng khi không dùng nữa
// es.close();
```

### Lắng nghe event có tên (ví dụ: `notification`)

Khi server gửi `event: notification`, client phải dùng `addEventListener('notification', ...)` thay vì chỉ `onmessage`.

```javascript
const es = new EventSource("http://localhost:3000/events/notifications");

es.addEventListener("connected", (e) => {
  const data = JSON.parse(e.data);
  console.log("Connected:", data.message);
});

es.addEventListener("notification", (e) => {
  const data = JSON.parse(e.data);
  console.log("Notification:", data);
  // Có thể cập nhật DOM, hiển thị toast, v.v.
});

es.onerror = (e) => console.error("SSE error", e);
es.onopen = () => console.log("SSE open");
```

### Ví dụ trong Vue 3 (Composition API)

```javascript
import { onMounted, onUnmounted, ref } from "vue";

export default {
  setup() {
    const notifications = ref([]);
    let es = null;

    onMounted(() => {
      es = new EventSource("http://localhost:3000/events/notifications");

      es.addEventListener("notification", (e) => {
        const data = JSON.parse(e.data);
        notifications.value = [...notifications.value, data];
      });

      es.onerror = () => {};
    });

    onUnmounted(() => {
      es?.close();
    });

    return { notifications };
  },
};
```

### Thuộc tính và hành vi cần nhớ

| Thuộc tính / Sự kiện                | Mô tả                                                 |
| ----------------------------------- | ----------------------------------------------------- |
| `onmessage`                         | Nhận event không có `event:` hoặc event tên `message` |
| `addEventListener('tên-event', cb)` | Nhận event có `event: tên-event`                      |
| `onopen`                            | Kết nối mở (hoặc reconnect thành công)                |
| `onerror`                           | Lỗi; EventSource thường tự thử kết nối lại            |
| `close()`                           | Đóng kết nối, không reconnect                         |
| `e.data`                            | Nội dung phần `data:` của event (string)              |
| `e.lastEventId`                     | Giá trị `id:` của event vừa nhận (nếu có)             |

---

## 6.8. Tóm tắt luồng SSE

1. **Backend**: Tạo route GET, set header `Content-Type: text/event-stream`, giữ connection, ghi từng block event (`event:`, `id:`, `data:` + `\n\n`).
2. **Frontend**: `new EventSource(url)`, dùng `onmessage` hoặc `addEventListener('eventName', handler)` để xử lý, nhớ `close()` khi thoát component/trang.

Sau khi có BE và FE như trên, bạn chỉ cần chạy server và mở trang có đoạn FE để xem event realtime (notification, log, v.v.).
