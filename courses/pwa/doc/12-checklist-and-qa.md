# 12 — Checklist & QA (Kiểm tra trước khi release)

## PWA cơ bản

- [ ] HTTPS hoạt động
- [ ] Manifest có `name`, `short_name`, `icons`, `start_url`, `display: 'standalone'`
- [ ] Service Worker đã register
- [ ] Offline fallback hoạt động
- [ ] Installable trên Chrome (A2HS)
- [ ] Lighthouse: PWA score >= 80 (mục tiêu)

## Performance & UX

- [ ] LCP hợp lý (critical assets tối ưu)
- [ ] Hình ảnh lớn đã lazy-load
- [ ] Cache strategy cho images & API đã cấu hình

## DevOps

- [ ] CI build artifact (script build)
- [ ] Cache-busting / versioning
- [ ] Hướng dẫn rollback nếu SW gây lỗi

## Debugging tips

- Force unregister SW via DevTools → Application → Service Workers
- Kiểm tra console logs trong SW (use `console.log` trong SW sẽ hiển thị ở context của SW)

## Bước tiếp theo

Chúc mừng bạn đã hoàn thành khóa học! Đừng quên tham khảo thêm [13 - Resources](/resources) để tiếp tục hành trình PWA của mình.
