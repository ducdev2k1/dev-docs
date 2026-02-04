# Thêm khóa học mới

1. **Copy folder mẫu**  
   Copy toàn bộ folder `_template` và đổi tên thành slug của khóa (vd: `pwa-vue3`).

2. **Chỉnh `meta.json`**

   - `slug`: trùng với tên folder (dùng trong URL).
   - `title`: tên hiển thị trên card và sidebar.
   - `description`: mô tả ngắn trên card trang chủ.
   - `docOrder`: mảng slug các file doc (không cần `.md`), thứ tự hiển thị trong sidebar.
   - `titleMap`: object `{ "slug-file": "Tên hiển thị sidebar" }` cho từng doc.

3. **Thêm file tài liệu**  
   Thêm file `.md` vào `doc/`. Mỗi file tương ứng một bài trong sidebar.  
   Cập nhật `docOrder` và `titleMap` trong `meta.json` cho đủ và đúng thứ tự.

**Ví dụ cấu trúc:**

```
courses/
  _template/          ← Mẫu (không hiển thị trên web)
  websocket-sse-socketio/
    meta.json
    doc/
      README.md
      00-00-intro-overview.md
      ...
  pwa-vue3/           ← Khóa mới (sau khi copy _template)
    meta.json
    doc/
      README.md
      01-introduction.md
      ...
```

Lưu ý: folder `_template` không được liệt kê trên trang chủ (code bỏ qua slug bắt đầu bằng `_`).
