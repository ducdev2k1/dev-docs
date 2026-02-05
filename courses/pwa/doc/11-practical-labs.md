# 11 — Bài lab thực hành

## Lab 1 — Convert existing Vue 3 project to PWA (30–45 phút)

**Mục tiêu:** từ project Vue, cài `vite-plugin-pwa`, cấu hình manifest, chuẩn bị icons, build và kiểm tra install.

**Các bước:**

1. Cài plugin `vite-plugin-pwa`
2. Thêm cấu hình vào `vite.config.ts` (tham khảo trang 04)
3. Thêm icons vào `public/icons/`
4. Build: `npm run build`
5. Serve bản build (ví dụ dùng `serve`): `npx serve dist`
6. Mở Chrome → DevTools → Application → kiểm tra manifest & service worker
7. Test offline: bật "Offline" trong Network tab

## Lab 2 — Thêm Install button (15 phút)

- Thêm logic `beforeinstallprompt` và UI (nút)
- Demo cài đặt trên Chrome

## Lab 3 — Cache images & API (30 phút)

- Cấu hình cache strategy: images -> CacheFirst, API -> NetworkFirst
- Test: load page lần 1, tắt network, load lại

## Lab 4 — Auto update UI (15 phút)

- Sử dụng `virtual:pwa-register` để hiện toast khi có bản mới
- Test: deploy bản build mới, reload trang, xem UI update

## Bước tiếp theo

Đã thực hành xong? Hãy kiểm tra lại toàn bộ project với [12 - Checklist & QA](/checklist-and-qa) trước khi release!
