# 04 — Cấu hình Vite + Manifest

## Tổng quan

Trong bài này, chúng ta sẽ cấu hình Vite để build PWA và tạo Web App Manifest - file JSON định nghĩa metadata của PWA.

## Cấu hình vite-plugin-pwa

### Basic Configuration

Mở `vite.config.ts` và thêm cấu hình PWA:

```typescript
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt", "icons/*.png"],
      manifest: {
        name: "My Vue PWA",
        short_name: "VuePWA",
        description: "Demo Progressive Web App built with Vue 3 and Vite",
        theme_color: "#4f46e5",
        background_color: "#ffffff",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/pwa-32x32.png",
            sizes: "32x32",
            type: "image/png",
          },
          {
            src: "/pwa-96x96.png",
            sizes: "96x96",
            type: "image/png",
          },
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
```

### Giải thích các options

#### registerType

```typescript
registerType: "autoUpdate"; // hoặc 'prompt'
```

- **autoUpdate**: Service Worker tự động update khi có version mới
- **prompt**: Hiện prompt để user chọn update hay không

#### includeAssets

```typescript
includeAssets: ["favicon.ico", "robots.txt", "icons/*.png"];
```

Danh sách assets từ `public/` folder cần được copy vào build output.

#### manifest

Cấu hình Web App Manifest (chi tiết bên dưới).

## Web App Manifest

### Các thuộc tính quan trọng

#### name & short_name

```json
{
  "name": "My Progressive Web Application",
  "short_name": "My PWA"
}
```

- **name**: Tên đầy đủ (hiện khi install)
- **short_name**: Tên ngắn (hiện dưới icon trên home screen)

#### description

```json
{
  "description": "A comprehensive PWA built with Vue 3 and Vite"
}
```

Mô tả app, hiện trong install prompt và app info.

#### theme_color & background_color

```json
{
  "theme_color": "#4f46e5",
  "background_color": "#ffffff"
}
```

- **theme_color**: Màu của browser UI (address bar, status bar)
- **background_color**: Màu nền khi app đang load

#### display

```json
{
  "display": "standalone"
}
```

Các options:

- **fullscreen**: Toàn màn hình, ẩn tất cả browser UI
- **standalone**: Giống native app, ẩn browser UI nhưng giữ status bar
- **minimal-ui**: Giữ một số browser controls tối thiểu
- **browser**: Hiện như tab browser thường

#### scope & start_url

```json
{
  "scope": "/",
  "start_url": "/"
}
```

- **scope**: Phạm vi URLs mà PWA quản lý
- **start_url**: URL khởi động khi mở app

#### orientation

```json
{
  "orientation": "portrait"
}
```

Options: `portrait`, `landscape`, `any`, `portrait-primary`, `landscape-primary`

### Icons Configuration

#### Kích thước cần thiết

PWA cần icons với các sizes sau:

```json
{
  "icons": [
    {
      "src": "/icons/pwa-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/pwa-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/pwa-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/pwa-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/pwa-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/pwa-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/pwa-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/pwa-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Minimum required**: 192x192 và 512x512

#### Maskable Icons

Cho Android adaptive icons:

```json
{
  "src": "/icons/pwa-512x512.png",
  "sizes": "512x512",
  "type": "image/png",
  "purpose": "any maskable"
}
```

**Lưu ý**: Maskable icon cần có safe zone (80% center area)

### Tạo Icons

#### Option 1: Online tools

- [PWA Asset Generator](https://www.pwabuilder.com/)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [Favicon.io](https://favicon.io/)

#### Option 2: Manual với ImageMagick

```bash
# Từ một icon 512x512
convert icon-512.png -resize 192x192 pwa-192x192.png
convert icon-512.png -resize 384x384 pwa-384x384.png
# ... các sizes khác
```

#### Option 3: npm package

```bash
pnpm add -D pwa-asset-generator

# Generate icons
pwa-asset-generator logo.svg ./public/icons
```

## Advanced Configuration

### Workbox Options

Workbox là thư viện của Google giúp quản lý Service Worker và caching strategies. Dưới đây là các options quan trọng:

```typescript
VitePWA({
  workbox: {
    globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts-cache",
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],
  },
});
```

#### globPatterns

```typescript
globPatterns: ["**/*.{js,css,html,ico,png,svg}"];
```

Định nghĩa pattern để **precache** (cache trước) các files khi Service Worker được install.

- `**/*` - Match tất cả files trong mọi thư mục
- `*.{js,css,html}` - Match files với extensions cụ thể
- Files match pattern này sẽ được cache ngay khi user lần đầu visit app

**Ví dụ**:

```typescript
globPatterns: [
  "**/*.{js,css,html}", // Tất cả code files
  "assets/**/*.{png,jpg,svg}", // Images trong assets
  "fonts/**/*.{woff,woff2}", // Font files
];
```

#### runtimeCaching

Cấu hình caching cho resources được fetch **trong lúc runtime** (không phải precache).

Mỗi rule bao gồm:

##### urlPattern

```typescript
urlPattern: /^https:\/\/api\.example\.com\/.*/i;
```

Regex hoặc string để match URLs cần cache.

**Ví dụ**:

```typescript
// Match API calls
urlPattern: /^https:\/\/api\.myapp\.com\/.*/i;

// Match Google Fonts
urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i;

// Match images từ CDN
urlPattern: /^https:\/\/cdn\.example\.com\/images\/.*/i;
```

##### handler

Caching strategy để sử dụng. Có 5 strategies chính:

**1. CacheFirst** (Cache Falling Back to Network)

```typescript
handler: "CacheFirst";
```

- Ưu tiên cache trước
- Nếu không có trong cache → fetch từ network
- **Use case**: Static assets (fonts, images, CSS, JS)

**2. NetworkFirst** (Network Falling Back to Cache)

```typescript
handler: "NetworkFirst";
```

- Ưu tiên network trước
- Nếu network fail → dùng cache
- **Use case**: API calls, dynamic content

**3. NetworkOnly**

```typescript
handler: "NetworkOnly";
```

- Chỉ dùng network, không cache
- **Use case**: Real-time data, analytics

**4. CacheOnly**

```typescript
handler: "CacheOnly";
```

- Chỉ dùng cache, không fetch network
- **Use case**: Precached resources

**5. StaleWhileRevalidate**

```typescript
handler: "StaleWhileRevalidate";
```

- Trả về cache ngay lập tức (nếu có)
- Đồng thời fetch từ network để update cache
- **Use case**: Cần response nhanh nhưng vẫn muốn data mới

##### options

Các options bổ sung cho caching strategy:

**cacheName**

```typescript
cacheName: "google-fonts-cache";
```

Tên của cache storage. Giúp organize và debug dễ dàng.

**Ví dụ**:

```typescript
cacheName: "api-cache-v1";
cacheName: "images-cache";
cacheName: "static-resources";
```

**expiration**

Cấu hình khi nào cache sẽ expire:

```typescript
expiration: {
  maxEntries: 10,        // Tối đa 10 entries trong cache
  maxAgeSeconds: 60 * 60 * 24 * 365  // Cache tối đa 1 năm
}
```

- `maxEntries`: Số lượng entries tối đa. Khi vượt quá, entries cũ nhất sẽ bị xóa (LRU - Least Recently Used)
- `maxAgeSeconds`: Thời gian tối đa (giây) một entry được giữ trong cache

**Ví dụ**:

```typescript
// API cache - 50 entries, 1 ngày
expiration: {
  maxEntries: 50,
  maxAgeSeconds: 60 * 60 * 24
}

// Image cache - 100 entries, 30 ngày
expiration: {
  maxEntries: 100,
  maxAgeSeconds: 60 * 60 * 24 * 30
}
```

**cacheableResponse**

Định nghĩa response nào được phép cache:

```typescript
cacheableResponse: {
  statuses: [0, 200];
}
```

- `statuses`: Array của HTTP status codes được phép cache
- `0`: Opaque responses (cross-origin requests không có CORS)
- `200`: Success responses

**Ví dụ**:

```typescript
// Cache cả 200 và 404 (để tránh re-fetch 404s)
cacheableResponse: {
  statuses: [0, 200, 404];
}

// Chỉ cache success responses
cacheableResponse: {
  statuses: [200];
}
```

#### Ví dụ Runtime Caching hoàn chỉnh

```typescript
VitePWA({
  workbox: {
    runtimeCaching: [
      // Google Fonts
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts-stylesheets",
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
        },
      },
      // Font files
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts-webfonts",
          expiration: {
            maxEntries: 30,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // API calls
      {
        urlPattern: /^https:\/\/api\.myapp\.com\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "api-cache",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60, // 1 hour
          },
          cacheableResponse: {
            statuses: [200],
          },
        },
      },
      // Images từ CDN
      {
        urlPattern: /^https:\/\/cdn\.myapp\.com\/images\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "cdn-images",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],
  },
});
```

### Dev Options

Enable PWA trong development mode:

```typescript
VitePWA({
  devOptions: {
    enabled: true,
    type: "module",
  },
});
```

### Inject Manifest Mode

Nếu cần custom Service Worker:

```typescript
VitePWA({
  strategies: "injectManifest",
  srcDir: "src",
  filename: "sw.ts",
  injectManifest: {
    globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
  },
});
```

## Verify Configuration

### 1. Build project

```bash
pnpm build
```

Check `dist/` folder có:

- `manifest.webmanifest`
- `sw.js` (Service Worker)
- `workbox-*.js` (Workbox runtime)

### 2. Test với Lighthouse

```bash
pnpm preview
```

Mở Chrome DevTools → Lighthouse → Run audit

Check:

- ✅ Web App Manifest
- ✅ Service Worker registered
- ✅ Icons có đủ sizes

### 3. Check manifest trong DevTools

Chrome DevTools → Application → Manifest

Verify:

- Name, short_name hiển thị đúng
- Icons load được
- Theme color đúng
- Display mode đúng

## Common Issues

### Issue: Manifest không load

**Nguyên nhân**: Path icons sai

**Giải pháp**:

```typescript
// Đảm bảo icons trong public/icons/
icons: [
  {
    src: "/icons/pwa-192x192.png", // Leading slash
    sizes: "192x192",
    type: "image/png",
  },
];
```

### Issue: Service Worker không register

**Nguyên nhân**: Chưa import registerSW

**Giải pháp**:

```typescript
// src/main.ts
import { registerSW } from "virtual:pwa-register";

registerSW({ immediate: true });
```

### Issue: Icons bị crop trên Android

**Nguyên nhân**: Không có maskable icon hoặc safe zone không đủ

**Giải pháp**: Tạo maskable icon với safe zone 80%

## Best Practices

1. **Icon quality**: Dùng PNG với transparent background
2. **File size**: Optimize icons (< 50KB mỗi file)
3. **Naming**: Consistent naming convention
4. **Testing**: Test trên nhiều devices và browsers
5. **Fallback**: Luôn có fallback icon nếu một size không load được

## Bước tiếp theo

Manifest đã xong! Giờ đến phần quan trọng nhất: [05 - Service Worker](/service-worker)!

---

> 💡 **Pro tip**: Sử dụng [Maskable.app](https://maskable.app/) để preview maskable icons trước khi deploy!
