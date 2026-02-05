# 07 — Add to Home Screen (A2HS)

Tính năng "Add to Home Screen" (A2HS) cho phép người dùng cài đặt PWA của bạn lên thiết bị giống như một ứng dụng native.

## Điều kiện để hiện A2HS

Trình duyệt sẽ chỉ hiển thị prompt cài đặt nếu PWA của bạn đáp ứng các tiêu chí:

1. Có file `manifest.webmanifest` hợp lệ.
2. Có `service worker` đã được register.
3. Được serve qua **HTTPS** (hoặc localhost).
4. Có `icon` kích thước phù hợp (ít nhất 192x192 và 512x512).

## Sự kiện `beforeinstallprompt`

Mặc định, Chrome trên Android sẽ tự hiện một mini-infobar để mời user cài đặt. Tuy nhiên, best practice là bạn nên tự control trải nghiệm này bằng cách lắng nghe sự kiện `beforeinstallprompt`.

### Quy trình xử lý

1. Lắng nghe event `beforeinstallprompt`.
2. Chặn hành vi mặc định (`e.preventDefault()`).
3. Lưu event lại vào biến để dùng sau.
4. Hiển thị nút "Install App" của riêng bạn.
5. Khi user bấm nút, gọi `prompt()` từ event đã lưu.

### Ví dụ Component Vue 3

Tạo component `InstallPrompt.vue`:

```vue
<script setup lang="ts">
import { ref, onMounted } from "vue";

const deferredPrompt = ref<any>(null);
const showInstallBtn = ref(false);

onMounted(() => {
  window.addEventListener("beforeinstallprompt", (e) => {
    // 1. Chặn Chrome tự hiện prompt
    e.preventDefault();
    // 2. Lưu event để dùng sau
    deferredPrompt.value = e;
    // 3. Hiện nút install của mình
    showInstallBtn.value = true;
  });
});

const installApp = async () => {
  if (!deferredPrompt.value) return;

  // 4. Show prompt cài đặt
  deferredPrompt.value.prompt();

  // 5. Chờ user phản hồi
  const { outcome } = await deferredPrompt.value.userChoice;
  console.log(`User response: ${outcome}`);

  // 6. Reset
  deferredPrompt.value = null;
  showInstallBtn.value = false;
};
</script>

<template>
  <button v-if="showInstallBtn" @click="installApp" class="install-btn">
    📲 Cài đặt App
  </button>
</template>

<style scoped>
.install-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 24px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>
```

## Xử lý trên iOS (Safari)

iOS **KHÔNG** hỗ trợ sự kiện `beforeinstallprompt`. Bạn không thể kích hoạt prompt cài đặt bằng code.

Cách duy nhất là hướng dẫn người dùng làm thủ công:

1. Bấm nút **Share** (biểu tượng mũi tên đi lên).
2. Chọn **Add to Home Screen** (Thêm vào màn hình chính).

### Tạo hướng dẫn cho iOS

Bạn nên detect iOS và hiện hướng dẫn riêng:

```vue
<script setup lang="ts">
import { ref, onMounted } from "vue";

const isIOS = ref(false);

onMounted(() => {
  // Check nếu là iOS
  const userAgent = window.navigator.userAgent.toLowerCase();
  isIOS.value = /iphone|ipad|ipod/.test(userAgent);
});
</script>

<template>
  <div v-if="isIOS" class="ios-prompt">
    <p>Để cài đặt ứng dụng trên iOS:</p>
    <ol>
      <li>Bấm nút <strong>Share</strong> <span class="share-icon">⎋</span></li>
      <li>Chọn <strong>Add to Home Screen</strong> <span>➕</span></li>
    </ol>
  </div>
</template>
```

## App Installed Event

Để biết khi nào app đã được cài đặt thành công (để ẩn nút install hoặc tracking analytics):

```javascript
window.addEventListener("appinstalled", (evt) => {
  console.log("App đã được cài đặt thành công!");
  // Gửi analytics event...
});
```

## Kiểm tra Display Mode

Bạn có thể kiểm tra xem app đang chạy trên browser hay đã được cài đặt (standalone mode):

```css
/* CSS: Ẩn nút install khi đã ở trong standalone mode */
@media all and (display-mode: standalone) {
  .install-btn {
    display: none;
  }
}
```

Trong JS:

```javascript
const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
if (isStandalone) {
  console.log("Đang chạy như native app");
}
```

---

> 💡 **Pro tip**:
>
> - Đừng hiện prompt ngay khi user vừa vào web. Hãy đợi họ tương tác một lúc (ví dụ: đọc xong 1 bài viết, hoặc hoàn thành 1 task).
> - Nút Install nên nổi bật nhưng không che mất nội dung chính.

## Bước tiếp theo

Sau khi user đã cài đặt app, làm sao để họ luôn nhận được bản cập nhật mới nhất? Xem ngay [08 - Auto Update](/auto-update)!
