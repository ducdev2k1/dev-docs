# 01 — Giới thiệu PWA

## PWA là gì?

**Progressive Web App (PWA)** là một tập hợp các kỹ thuật và best practices giúp website hoạt động như một ứng dụng native trên mobile và desktop. PWA kết hợp điểm mạnh của web (dễ tiếp cận, không cần cài đặt) với trải nghiệm của native app (offline, push notifications, cài đặt được).

### Đặc điểm chính của PWA

- **Progressive**: Hoạt động với mọi người dùng, bất kể browser nào
- **Responsive**: Tự động điều chỉnh theo mọi kích thước màn hình
- **Connectivity independent**: Hoạt động offline hoặc với mạng yếu
- **App-like**: Trải nghiệm giống native app
- **Fresh**: Luôn cập nhật nhờ service worker
- **Safe**: Chỉ hoạt động qua HTTPS
- **Discoverable**: Có thể tìm kiếm như một website
- **Re-engageable**: Push notifications để tương tác lại với người dùng
- **Installable**: Có thể cài đặt về home screen
- **Linkable**: Dễ dàng chia sẻ qua URL

## Lợi ích chính

### 1. Trải nghiệm người dùng tốt hơn

- **Tốc độ tải nhanh**: Cache assets giúp tải trang nhanh hơn
- **Smooth animations**: Không bị giật lag như web thường
- **Offline access**: Vẫn sử dụng được khi mất mạng
- **Add to Home Screen**: Truy cập nhanh như native app

### 2. Tăng engagement

- **Push Notifications**: Gửi thông báo để người dùng quay lại
- **Background Sync**: Đồng bộ dữ liệu khi có mạng
- **Immersive experience**: Fullscreen mode, không có browser UI

### 3. Tiết kiệm chi phí

- **Không cần develop native app**: Một codebase cho mọi platform
- **Dễ maintain**: Update ngay lập tức, không cần app store review
- **Nhẹ hơn native app**: Tiết kiệm dung lượng thiết bị

### 4. SEO và Discovery

- **Indexable**: Google có thể index như website thường
- **Shareable**: Chia sẻ qua link, không cần app store
- **Progressive enhancement**: Hoạt động tốt trên mọi browser

## Thành phần chính của PWA

### 1. Web App Manifest

File JSON chứa metadata về app:

```json
{
  "name": "My PWA App",
  "short_name": "PWA",
  "description": "A Progressive Web App",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#4f46e5",
  "background_color": "#ffffff",
  "icons": [...]
}
```

**Chức năng**:

- Định nghĩa tên, icon, màu sắc của app
- Cấu hình cách app hiển thị (fullscreen, standalone, minimal-ui)
- Xác định URL khởi động

### 2. Service Worker

JavaScript file chạy ở background, tách biệt khỏi web page:

```javascript
// Intercept network requests
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request)),
  );
});
```

**Chức năng**:

- Intercept và xử lý network requests
- Cache assets và data
- Enable offline functionality
- Background sync và push notifications

### 3. HTTPS

PWA **bắt buộc** phải chạy trên HTTPS (trừ localhost khi dev):

**Lý do**:

- Service Worker có quyền cao (intercept requests)
- Bảo mật dữ liệu người dùng
- Yêu cầu của nhiều PWA APIs (geolocation, camera, etc.)

### 4. Cache Strategies

Các chiến lược lưu cache khác nhau:

- **Cache First**: Ưu tiên cache, fallback network
- **Network First**: Ưu tiên network, fallback cache
- **Stale While Revalidate**: Trả cache nhanh, update background
- **Network Only**: Luôn fetch từ network
- **Cache Only**: Chỉ dùng cache

## So sánh PWA vs Native App vs Web App

| Tính năng          | PWA     | Native App | Web App    |
| ------------------ | ------- | ---------- | ---------- |
| Offline            | ✅      | ✅         | ❌         |
| Installable        | ✅      | ✅         | ❌         |
| Push Notifications | ✅      | ✅         | ❌         |
| App Store          | ❌      | ✅         | ❌         |
| Cross-platform     | ✅      | ❌         | ✅         |
| Update             | Tự động | Qua store  | Tự động    |
| Performance        | Tốt     | Rất tốt    | Trung bình |
| Development Cost   | Thấp    | Cao        | Thấp       |

## Browser Support

PWA được hỗ trợ tốt trên hầu hết browsers hiện đại:

- ✅ **Chrome/Edge**: Hỗ trợ đầy đủ
- ✅ **Firefox**: Hỗ trợ tốt (trừ install prompt)
- ✅ **Safari**: Hỗ trợ cơ bản (iOS 11.3+)
- ⚠️ **IE**: Không hỗ trợ

> 💡 **Lưu ý**: Luôn implement progressive enhancement - app vẫn hoạt động trên browsers không hỗ trợ PWA, chỉ thiếu một số tính năng nâng cao.

## Use Cases phổ biến

PWA phù hợp với:

1. **E-commerce**: Tăng conversion rate, giảm bounce rate
2. **News/Media**: Offline reading, push notifications
3. **Social Networks**: Engagement cao, ít dung lượng
4. **Productivity Tools**: Offline access, sync data
5. **Games**: Installable, fullscreen mode

## Ví dụ PWA thành công

- **Twitter Lite**: Giảm 70% data usage, tăng 75% tweets sent
- **Pinterest**: Tăng 60% engagement, 44% ad revenue
- **Starbucks**: 2x daily active users, works offline
- **Uber**: 50KB vs 25MB native app, works on 2G

## Bước tiếp theo

Bây giờ bạn đã hiểu PWA là gì, hãy chuyển sang [02 - Mục tiêu học tập](/learning-objectives) để xem roadmap chi tiết của khóa học!
