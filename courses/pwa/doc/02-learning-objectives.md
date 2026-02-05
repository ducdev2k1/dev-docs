# 02 — Mục tiêu học tập

## Tổng quan

Khóa học này được thiết kế để đưa bạn từ mức độ hiểu biết cơ bản về PWA đến khả năng xây dựng và triển khai một PWA hoàn chỉnh trong môi trường production.

## Mục tiêu chính

### 1. Hiểu về PWA Architecture

**Bạn sẽ học**:

- Kiến trúc tổng thể của một PWA
- Vai trò của từng component (Manifest, Service Worker, Cache API)
- Lifecycle của Service Worker
- Cách PWA tương tác với browser

**Đánh giá**:

- Vẽ được sơ đồ kiến trúc PWA
- Giải thích được flow từ request đến response
- Hiểu được khi nào dùng cache, khi nào fetch network

### 2. Setup và Configuration

**Bạn sẽ học**:

- Cài đặt và cấu hình Vite cho PWA
- Sử dụng vite-plugin-pwa
- Tạo và cấu hình Web App Manifest
- Generate icons cho PWA

**Đánh giá**:

- Setup được project Vue 3 + Vite + PWA từ đầu
- Cấu hình manifest phù hợp với requirements
- Tạo được icons đúng format và sizes

### 3. Service Worker Implementation

**Bạn sẽ học**:

- Đăng ký và quản lý Service Worker
- Implement các event handlers (install, activate, fetch)
- Sử dụng Workbox cho caching strategies
- Debug Service Worker với DevTools

**Đánh giá**:

- Viết được custom Service Worker
- Implement được các caching strategies
- Debug và fix được SW issues

### 4. Offline Functionality

**Bạn sẽ học**:

- Các chiến lược caching (Cache First, Network First, etc.)
- Pre-caching vs Runtime caching
- Offline fallback pages
- Background Sync API

**Đánh giá**:

- App hoạt động được offline
- Chọn được strategy phù hợp cho từng loại resource
- Implement được offline fallback

### 5. Installation & Add to Home Screen

**Bạn sẽ học**:

- Criteria để PWA có thể install được
- Customize install prompt
- Handle beforeinstallprompt event
- Track installation analytics

**Đánh giá**:

- PWA pass được installability criteria
- Tạo được custom install UI
- Track được install events

### 6. Update Mechanism

**Bạn sẽ học**:

- Auto-update strategies
- Notify users về updates
- Skip waiting và claim clients
- Version management

**Đánh giá**:

- Implement được auto-update
- User được notify khi có update
- Update không làm gián đoạn UX

### 7. Performance Optimization

**Bạn sẽ học**:

- Optimize cache size và strategies
- Lazy loading và code splitting
- Preload critical resources
- Measure performance với Lighthouse

**Đánh giá**:

- Lighthouse PWA score >= 90
- First Contentful Paint < 2s
- Time to Interactive < 3.5s

### 8. Deployment

**Bạn sẽ học**:

- Build PWA for production
- Deploy lên Vercel/Netlify
- Configure HTTPS và domain
- CI/CD cho PWA

**Đánh giá**:

- Deploy được PWA lên production
- App hoạt động đúng trên HTTPS
- Setup được auto-deployment

## Roadmap học tập

### Phase 1: Foundations (2-3 giờ)

```
Week 1
├── Giới thiệu PWA
├── Mục tiêu học tập
├── Setup môi trường
└── Vite Config & Manifest
```

**Mục tiêu**: Hiểu concepts và setup được project

### Phase 2: Core Features (3-4 giờ)

```
Week 2
├── Service Worker basics
├── Offline Strategies
├── Add to Home Screen
└── Auto Update
```

**Mục tiêu**: Implement được core PWA features

### Phase 3: Advanced & Deployment (2-3 giờ)

```
Week 3
├── Push Notifications (optional)
├── Deployment
├── Practical Labs
└── Checklist & QA
```

**Mục tiêu**: Deploy PWA và master advanced features

## Skill Progression

### Beginner → Intermediate

**Bạn bắt đầu với**:

- Hiểu cơ bản về Vue 3
- Biết HTML/CSS/JavaScript
- Chưa biết về PWA

**Sau khóa học**:

- Hiểu rõ PWA architecture
- Implement được Service Worker
- Deploy được PWA production-ready

### Intermediate → Advanced

**Nếu bạn muốn đi sâu hơn**:

- Custom Service Worker strategies
- Advanced caching patterns
- Push Notifications với backend
- Performance optimization nâng cao
- PWA testing strategies

## Đánh giá năng lực

### Checklist tự đánh giá

Sau khóa học, bạn nên có khả năng:

- [ ] Giải thích được PWA là gì và lợi ích
- [ ] Setup Vue 3 + Vite + PWA project
- [ ] Cấu hình Web App Manifest
- [ ] Implement Service Worker
- [ ] Chọn và apply caching strategies
- [ ] Làm app hoạt động offline
- [ ] Implement install prompt
- [ ] Setup auto-update mechanism
- [ ] Debug PWA với DevTools
- [ ] Deploy PWA lên production
- [ ] Pass Lighthouse PWA audit
- [ ] Optimize performance

### Project cuối khóa

**Yêu cầu**: Xây dựng một PWA hoàn chỉnh với:

1. **Core features**:

   - Offline functionality
   - Installable
   - Responsive design
   - Fast loading

2. **Technical requirements**:

   - Lighthouse PWA score >= 90
   - Works offline
   - HTTPS
   - Valid manifest

3. **Bonus points**:
   - Push notifications
   - Background sync
   - Advanced caching
   - Performance optimization

## Resources bổ sung

Để đạt được mục tiêu học tập, bạn nên:

1. **Thực hành thường xuyên**: Code theo từng bài học
2. **Đọc documentation**: MDN, web.dev, Vue docs
3. **Debug nhiều**: Sử dụng Chrome DevTools
4. **Tham khảo examples**: Xem PWA của các công ty lớn
5. **Join community**: PWA Slack, Reddit, Discord

## Bước tiếp theo

Sẵn sàng bắt đầu? Chuyển sang [03 - Setup](/setup) để cài đặt môi trường phát triển!

---

> 💡 **Tip**: Đừng vội vàng! Hãy đảm bảo bạn hiểu rõ từng concept trước khi chuyển sang phần tiếp theo. Quality over speed!
