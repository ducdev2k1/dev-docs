# 06 — Chiến lược Offline & Cache

Trong bài này, chúng ta sẽ đi sâu vào các chiến lược để giúp ứng dụng hoạt động offline và tối ưu hóa trải nghiệm người dùng khi mạng yếu.

## Assets vs Data

Khi cache, chúng ta cần phân biệt rõ hai loại resources: **Assets** (tài nguyên tĩnh) và **Data** (dữ liệu động).

### 1. Assets (JS, CSS, Images, Fonts)

Đây là những file ít thay đổi, nên ưu tiên cache để load nhanh nhất có thể.

- **Chiến lược**: `CacheFirst` hoặc `StaleWhileRevalidate`
- **Lý do**: Assets thường có version trong tên file (ví dụ `index.a1b2c.js`), nên khi có build mới, tên file thay đổi, ta không lo user dùng file cũ.

**Cấu hình trong VitePWA**:

```typescript
// vite.config.ts
runtimeCaching: [
  {
    urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
    handler: "CacheFirst",
    options: {
      cacheName: "images",
      expiration: {
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 ngày
      },
    },
  },
];
```

### 2. API Data

Dữ liệu từ API thay đổi thường xuyên, cần đảm bảo tính tươi mới.

- **Chiến lược**: `NetworkFirst` (ưu tiên mạng, rớt mạng mới dùng cache)
- **Lý do**: User luôn muốn thấy dữ liệu mới nhất. Cache chỉ là fallback khi không có mạng.

**Cấu hình**:

```typescript
runtimeCaching: [
  {
    urlPattern: /^https:\/\/api\.myapp\.com\/.*/i,
    handler: "NetworkFirst",
    options: {
      cacheName: "api-data",
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 60 * 60, // 1 giờ
      },
    },
  },
];
```

## Offline Fallback Page

Khi user offline và truy cập vào một trang chưa được cache, thay vì hiện con khủng long của Chrome, ta nên hiện một trang thông báo đẹp mắt.

### Bước 1: Tạo file `offline.html`

Tạo file `public/offline.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Offline</title>
    <style>
      body {
        font-family: sans-serif;
        text-align: center;
        padding: 50px;
      }
      h1 {
        color: #333;
      }
    </style>
  </head>
  <body>
    <h1>Oops! Bạn đang offline</h1>
    <p>Vui lòng kiểm tra kết nối mạng để tiếp tục.</p>
    <button onclick="window.location.reload()">Thử lại</button>
  </body>
</html>
```

### Bước 2: Cấu hình Service Worker

Thêm vào `vite.config.ts` để precache file này và xử lý navigation request:

```typescript
// vite.config.ts
VitePWA({
  includeAssets: ["offline.html"], // Precache file này
  workbox: {
    // ...
  },
});
```

Nếu bạn dùng custom SW (`src-sw.js`), thêm đoạn code sau:

```javascript
import { setCatchHandler } from "workbox-routing";

// Khi một route bị lỗi (do offline), trả về offline.html
setCatchHandler(async ({ event }) => {
  if (event.request.destination === "document") {
    return caches.match("/offline.html");
  }
  return Response.error();
});
```

## Optimize cho LCP (Largest Contentful Paint)

LCP là chỉ số đo lường tốc độ load của phần tử lớn nhất trên màn hình. PWA có thể giúp cải thiện LCP đáng kể.

### 1. Precache Critical Assets

Đảm bảo các file quan trọng nhất (CSS chính, font, logo) được tải ngay khi app khởi động.

```typescript
// vite.config.ts
VitePWA({
  workbox: {
    globPatterns: ["**/*.{js,css,html}", "assets/logo-*.png"],
  },
});
```

### 2. Lazy Load Images

Chỉ load ảnh khi user cuộn tới.

```html
<img src="image.jpg" loading="lazy" alt="Description" />
```

### 3. Font Display Swap

Hiển thị text ngay lập tức bằng font mặc định trong khi chờ font xịn tải xong.

```css
/* style.css */
@font-face {
  font-family: "MyFont";
  src: url("/fonts/my-font.woff2") format("woff2");
  font-display: swap; /* Quan trọng! */
}
```

## Storage Options cho Data Offline

Khi app hoạt động offline, bạn cần nơi để lưu dữ liệu user tạo ra (ví dụ: bài viết nháp, todo item).

### 1. LocalStorage

- **Dung lượng**: ~5MB
- **Dữ liệu**: String only (phải `JSON.stringify`)
- **Use case**: Settings, user preferences, token đơn giản.
- **Đồng bộ**: Synchronous (có thể block main thread).

```javascript
// Lưu
localStorage.setItem("theme", "dark");
// Đọc
const theme = localStorage.getItem("theme");
```

### 2. IndexedDB (Khuyến nghị)

- **Dung lượng**: Lớn (vài trăm MB đến GB)
- **Dữ liệu**: Object, File, Blob...
- **Use case**: Danh sách sản phẩm, bài viết, ảnh offline.
- **Đồng bộ**: Asynchronous (không block UI).

Nên dùng thư viện `idb` để code gọn hơn:

```bash
pnpm add idb
```

```javascript
import { openDB } from "idb";

const dbPromise = openDB("my-db", 1, {
  upgrade(db) {
    db.createObjectStore("articles", { keyPath: "id" });
  },
});

// Lưu bài viết
async function saveArticle(article) {
  const db = await dbPromise;
  await db.put("articles", article);
}

// Lấy tất cả bài viết
async function getArticles() {
  const db = await dbPromise;
  return await db.getAll("articles");
}
```

## Background Sync

Khi user thực hiện hành động offline (ví dụ: gửi comment), ta cần lưu request đó lại và tự động gửi khi có mạng. Workbox hỗ trợ việc này rất tốt.

```typescript
// vite.config.ts
import { BackgroundSyncPlugin } from "workbox-background-sync";

runtimeCaching: [
  {
    urlPattern: /^https:\/\/api\.myapp\.com\/comments/i,
    method: "POST",
    handler: "NetworkOnly",
    options: {
      backgroundSync: {
        name: "comment-queue",
        options: {
          maxRetentionTime: 24 * 60, // Retry trong 24h
        },
      },
    },
  },
];
```

---

> 💡 **Tóm tắt**:
>
> - Dùng **CacheFirst** cho ảnh, font, JS, CSS.
> - Dùng **NetworkFirst** cho API data.
> - Tạo **offline.html** để trải nghiệm tốt hơn khi mất mạng.
> - Dùng **IndexedDB** để lưu dữ liệu phức tạp offline.

## Bước tiếp theo

Hiểu về chiến lược offline rồi, giờ hãy tìm hiểu cách để người dùng cài đặt app của bạn trong bài [07 - Add to Home Screen](/add-to-home-screen)!
