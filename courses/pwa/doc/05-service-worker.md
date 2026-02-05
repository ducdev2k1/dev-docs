# 05 — Service Worker (chi tiết)

## Service Worker là gì?

**Service Worker** là một JavaScript file chạy tách biệt khỏi main thread của web page. Nó hoạt động như một proxy giữa web app và network, cho phép bạn:

- Intercept và xử lý network requests
- Cache assets và responses
- Enable offline functionality
- Background sync
- Push notifications

## Lifecycle của Service Worker

Service Worker có 3 states chính:

```
Installing → Waiting → Activated
```

### 1. Registration

Đăng ký Service Worker từ main thread:

```typescript
// src/main.ts
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then((registration) => {
      console.log("SW registered:", registration);
    })
    .catch((error) => {
      console.error("SW registration failed:", error);
    });
}
```

Với `vite-plugin-pwa`:

```typescript
import { registerSW } from "virtual:pwa-register";

const updateSW = registerSW({
  onNeedRefresh() {
    // Hiện UI để user refresh
  },
  onOfflineReady() {
    // App ready to work offline
  },
});
```

### 2. Install Event

Xảy ra khi SW được install lần đầu:

```javascript
// sw.js
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");

  // Pre-cache critical assets
  event.waitUntil(
    caches.open("v1").then((cache) => {
      return cache.addAll([
        "/",
        "/index.html",
        "/styles.css",
        "/app.js",
        "/logo.svg",
      ]);
    })
  );

  // Skip waiting to activate immediately
  self.skipWaiting();
});
```

**waitUntil()**: Đảm bảo SW không bị terminated cho đến khi promise resolve

**skipWaiting()**: Activate ngay lập tức thay vì đợi tabs cũ đóng

### 3. Activate Event

Xảy ra sau khi install, khi SW take control:

```javascript
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");

  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== "v1")
          .map((name) => caches.delete(name))
      );
    })
  );

  // Take control of all pages immediately
  return self.clients.claim();
});
```

**clients.claim()**: SW take control của tất cả pages ngay lập tức

### 4. Fetch Event

Intercept mọi network request:

```javascript
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found
      if (response) {
        return response;
      }

      // Otherwise fetch from network
      return fetch(event.request).then((response) => {
        // Cache the new response
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open("v1").then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    })
  );
});
```

## Cache Strategies

### 1. Cache First (Cache Falling Back to Network)

Ưu tiên cache, fallback network nếu không có:

```javascript
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
```

**Use case**: Images, fonts, CSS - assets ít thay đổi

**Pros**: Cực nhanh, works offline
**Cons**: Có thể serve stale content

### 2. Network First (Network Falling Back to Cache)

Ưu tiên network, fallback cache nếu offline:

```javascript
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Update cache
        const responseClone = response.clone();
        caches.open("v1").then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(event.request);
      })
  );
});
```

**Use case**: API calls, dynamic content

**Pros**: Luôn fresh data khi online
**Cons**: Chậm hơn cache first

### 3. Stale-While-Revalidate

Trả cache ngay, update background:

```javascript
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.open("v1").then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });

        return cachedResponse || fetchPromise;
      });
    })
  );
});
```

**Use case**: Avatars, profile data - cần fast response nhưng cũng cần update

**Pros**: Fast + fresh
**Cons**: Dùng nhiều bandwidth

### 4. Network Only

Luôn fetch từ network:

```javascript
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
```

**Use case**: Analytics, real-time data

### 5. Cache Only

Chỉ dùng cache:

```javascript
self.addEventListener("fetch", (event) => {
  event.respondWith(caches.match(event.request));
});
```

**Use case**: Offline-first apps với pre-cached content

## Sử dụng Workbox

Workbox là thư viện của Google giúp implement caching strategies dễ dàng hơn:

### Setup với vite-plugin-pwa

```typescript
// vite.config.ts
VitePWA({
  workbox: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\.example\.com\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "api-cache",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60, // 1 hour
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
        handler: "CacheFirst",
        options: {
          cacheName: "images-cache",
          expiration: {
            maxEntries: 60,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
    ],
  },
});
```

### Custom Service Worker với Workbox

```javascript
// src/sw.ts
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import {
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
} from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

// Precache files
precacheAndRoute(self.__WB_MANIFEST);

// Cache images
registerRoute(
  ({ request }) => request.destination === "image",
  new CacheFirst({
    cacheName: "images",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

// Cache API calls
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkFirst({
    cacheName: "api",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
);
```

## Debugging Service Worker

### Chrome DevTools

1. **Application tab → Service Workers**

   - Xem status (installing, waiting, activated)
   - Unregister SW
   - Update on reload
   - Bypass for network

2. **Application tab → Cache Storage**

   - Xem cached files
   - Delete caches
   - Inspect cache entries

3. **Network tab**
   - Filter by "ServiceWorker"
   - Xem requests served from SW

### Console Logging

```javascript
// sw.js
self.addEventListener("install", (event) => {
  console.log("[SW] Install event");
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Activate event");
});

self.addEventListener("fetch", (event) => {
  console.log("[SW] Fetch:", event.request.url);
});
```

### Common Issues

#### Issue: SW không update

**Nguyên nhân**: Browser cache SW file

**Giải pháp**:

- Enable "Update on reload" trong DevTools
- Hoặc unregister và register lại
- Hoặc dùng `skipWaiting()` và `clients.claim()`

#### Issue: Cached content không update

**Nguyên nhân**: Cache strategy không phù hợp

**Giải pháp**:

- Dùng Network First cho dynamic content
- Implement cache versioning
- Set expiration time hợp lý

#### Issue: SW không hoạt động trên production

**Nguyên nhân**: Không có HTTPS

**Giải pháp**: Deploy lên HTTPS (Vercel, Netlify auto có HTTPS)

## Best Practices

1. **Version your caches**: Dùng version number trong cache name
2. **Clean up old caches**: Trong activate event
3. **Don't cache everything**: Chỉ cache những gì cần thiết
4. **Set expiration**: Tránh cache quá lâu
5. **Handle errors**: Luôn có fallback
6. **Test offline**: Test kỹ offline functionality
7. **Monitor performance**: Track cache hit rate

## Bước tiếp theo

Hiểu Service Worker rồi! Giờ đến [06 - Offline Strategies](/offline-strategies) để học các chiến lược offline chi tiết hơn!

---

> 💡 **Pro tip**: Sử dụng `chrome://serviceworker-internals/` để xem tất cả Service Workers đang chạy trên browser!
