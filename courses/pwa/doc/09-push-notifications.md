# 09 — Push Notifications (Nâng cao)

Push Notifications cho phép bạn gửi thông báo đến thiết bị của người dùng ngay cả khi họ không mở trang web. Đây là tính năng mạnh mẽ để tăng engagement.

## Cơ chế hoạt động

1. **Client**: User cấp quyền nhận thông báo và subscribe với Push Service (của browser).
2. **Push Service**: Trả về một `subscription object` (chứa endpoint URL).
3. **Server**: Bạn lưu `subscription object` này vào database.
4. **Server**: Khi cần gửi thông báo, server dùng thư viện (như `web-push`) gửi payload đến endpoint của Push Service.
5. **Push Service**: Đẩy thông báo xuống browser của user.
6. **Service Worker**: Lắng nghe sự kiện `push` và hiển thị notification.

## Bước 1: Tạo VAPID Keys

VAPID keys dùng để xác thực server của bạn với Push Service.

Cài đặt `web-push` global để tạo key:

```bash
npm install -g web-push
web-push generate-vapid-keys
```

Kết quả:

```
Public Key:
<Your-Public-Key>

Private Key:
<Your-Private-Key>
```

- **Public Key**: Dùng ở Client (để subscribe).
- **Private Key**: Dùng ở Server (để gửi push). **Tuyệt đối giữ bí mật!**

## Bước 2: Client Subscribe

Trong code Vue/JS của bạn:

```javascript
// Hàm chuyển đổi VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const PUBLIC_KEY = "<Your-Public-Key>";

async function subscribeUser() {
  if (!("serviceWorker" in navigator)) return;

  const registration = await navigator.serviceWorker.ready;

  // 1. Xin quyền
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    alert("Bạn cần cấp quyền để nhận thông báo!");
    return;
  }

  // 2. Subscribe
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
  });

  console.log("User Subscribed:", subscription);

  // 3. Gửi subscription object về server để lưu
  await fetch("/api/subscribe", {
    method: "POST",
    body: JSON.stringify(subscription),
    headers: {
      "Content-Type": "application/json",
    },
  });
}
```

## Bước 3: Server Gửi Push (Node.js)

```javascript
const webpush = require("web-push");

const vapidKeys = {
  publicKey: "<Your-Public-Key>",
  privateKey: "<Your-Private-Key>",
};

webpush.setVapidDetails(
  "mailto:admin@example.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Subscription object lấy từ database (đã lưu ở bước 2)
const subscription = {
  endpoint: "https://fcm.googleapis.com/fcm/send/...",
  keys: {
    auth: "...",
    p256dh: "...",
  },
};

const payload = JSON.stringify({
  title: "Hello PWA!",
  body: "Bạn có tin nhắn mới.",
  icon: "/icons/pwa-192x192.png",
});

webpush
  .sendNotification(subscription, payload)
  .then((res) => console.log("Sent successfully", res))
  .catch((err) => console.error("Error sending", err));
```

## Bước 4: Service Worker Xử lý Push

Trong file Service Worker (nếu dùng `vite-plugin-pwa` với `injectManifest` hoặc custom SW):

```javascript
// sw.js
self.addEventListener("push", (event) => {
  const data = event.data.json();

  const options = {
    body: data.body,
    icon: data.icon || "/icons/pwa-192x192.png",
    badge: "/icons/badge-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/", // URL để mở khi click
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Xử lý khi user click vào notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close(); // Đóng thông báo

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      // Nếu tab đã mở, focus vào nó
      for (let client of windowClients) {
        if (client.url === event.notification.data.url && "focus" in client) {
          return client.focus();
        }
      }
      // Nếu chưa mở, mở tab mới
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});
```

---

> 💡 **Lưu ý**:
>
> - Push Notification yêu cầu backend để lưu subscription và trigger gửi tin.
> - Trên iOS (từ 16.4), Push Notification chỉ hoạt động nếu user đã **Add to Home Screen**.
> - Đừng spam user, họ sẽ tắt quyền ngay lập tức!

## Bước tiếp theo

Tính năng đã đầy đủ, giờ là lúc đưa app của bạn ra thế giới! Chuyển sang [10 - Deployment](/deployment) để deploy PWA lên production!
