# 08 — Auto Update & Versioning

Một trong những thách thức lớn nhất của PWA là quản lý cập nhật (update). Khi bạn deploy version mới, làm sao để user nhận được code mới nhất mà không bị cache cũ làm phiền?

## Cơ chế Update của Service Worker

Mặc định, Service Worker (SW) mới sẽ được install ở background, nhưng sẽ **CHƯA** kích hoạt ngay nếu user đang mở app (để tránh làm crash app đang chạy). Nó sẽ ở trạng thái `waiting`.

Chỉ khi user đóng tất cả tabs và mở lại, SW mới kích hoạt. Điều này đôi khi khiến user vẫn dùng bản cũ dù đã có bản mới.

Giải pháp là hiện một thông báo: "Có bản cập nhật mới. Bấm để reload".

## Sử dụng `useRegisterSW` (Vue 3)

`vite-plugin-pwa` cung cấp hook `useRegisterSW` giúp việc này cực kỳ đơn giản.

### 1. Cài đặt

Đảm bảo `vite.config.ts` có `injectRegister: 'auto'`.

### 2. Tạo Component `ReloadPrompt.vue`

Component này sẽ hiện lên khi có bản update mới hoặc khi app đã sẵn sàng offline.

```vue
<script setup lang="ts">
import { useRegisterSW } from "virtual:pwa-register/vue";

const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW();

const close = async () => {
  offlineReady.value = false;
  needRefresh.value = false;
};
</script>

<template>
  <div v-if="offlineReady || needRefresh" class="pwa-toast" role="alert">
    <div class="message">
      <span v-if="offlineReady"> App ready to work offline </span>
      <span v-else>
        New content available, click on reload button to update.
      </span>
    </div>
    <button v-if="needRefresh" @click="updateServiceWorker()">Reload</button>
    <button @click="close">Close</button>
  </div>
</template>

<style scoped>
.pwa-toast {
  position: fixed;
  right: 0;
  bottom: 0;
  margin: 16px;
  padding: 12px;
  border: 1px solid #8885;
  border-radius: 4px;
  z-index: 1;
  text-align: left;
  box-shadow: 3px 4px 5px 0 #8885;
  background-color: white;
}
.pwa-toast .message {
  margin-bottom: 8px;
}
.pwa-toast button {
  border: 1px solid #8885;
  outline: none;
  margin-right: 5px;
  border-radius: 2px;
  padding: 3px 10px;
}
</style>
```

### 3. Giải thích code

- **`offlineReady`**: `true` khi SW đã cache xong assets, app có thể chạy offline.
- **`needRefresh`**: `true` khi có bản SW mới đã được install và đang chờ activate.
- **`updateServiceWorker()`**: Hàm này sẽ gọi `messageSkipWaiting` để SW mới activate ngay lập tức và reload trang.

## Auto Update (Không cần hỏi user)

Nếu bạn muốn app tự động update ngay khi có bản mới (chấp nhận reload trang đột ngột), cấu hình trong `vite.config.ts`:

```typescript
// vite.config.ts
VitePWA({
  registerType: "autoUpdate", // Mặc định là 'prompt'
  // ...
});
```

- **Ưu điểm**: User luôn dùng bản mới nhất.
- **Nhược điểm**: User có thể bị mất dữ liệu đang nhập dở nếu trang tự reload.

## Versioning

Để đảm bảo user nhận được update, bạn nên quản lý version trong `package.json`.

Mỗi khi deploy, hãy tăng version:

```json
// package.json
{
  "name": "my-pwa",
  "version": "1.0.1" // Tăng lên 1.0.2 khi deploy
}
```

Hiển thị version trong app để dễ debug:

```typescript
// vite.config.ts
define: {
  '__APP_VERSION__': JSON.stringify(process.env.npm_package_version),
}

// App.vue
const version = __APP_VERSION__
```

## Kiểm tra Update thủ công

Đôi khi bạn muốn check update định kỳ (ví dụ mỗi 1 tiếng):

```typescript
import { registerSW } from "virtual:pwa-register";

const intervalMS = 60 * 60 * 1000; // 1 hour

const updateSW = registerSW({
  onRegistered(r) {
    r &&
      setInterval(() => {
        r.update();
      }, intervalMS);
  },
});
```

---

> 💡 **Tóm tắt**:
>
> - Dùng `useRegisterSW` để hiện UI thông báo update.
> - `needRefresh` = Có bản mới, cần reload.
> - `offlineReady` = Đã cache xong, sẵn sàng offline.
> - Dùng `autoUpdate` nếu app đơn giản, ít form nhập liệu.

## Bước tiếp theo

Muốn giữ chân người dùng quay lại app? Hãy tìm hiểu về [09 - Push Notifications](/push-notifications)!
