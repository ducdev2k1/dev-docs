# Bài 02: Thiết lập Môi trường Phát triển

## 📖 Mục tiêu bài học

Sau bài học này, bạn sẽ:

- Biết cách cài đặt Node.js và npm
- Biết cách tạo dự án Vue 3 với Vite
- Hiểu cấu trúc thư mục cho thư viện component
- Cài đặt và cấu hình các dependencies cần thiết

## 🔧 Cài đặt Node.js và npm

### Kiểm tra phiên bản hiện tại

```bash
node --version
npm --version
```

**Yêu cầu:**

- Node.js: v16.0.0 trở lên (khuyến nghị v18+)
- npm: v7.0.0 trở lên (hoặc yarn v1.22+)

### Cài đặt Node.js

1. **Windows/Mac:**

   - Truy cập: https://nodejs.org/
   - Tải và cài đặt LTS version

2. **Linux:**

   ```bash
   # Sử dụng nvm (khuyến nghị)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install --lts
   nvm use --lts
   ```

3. **Verify installation:**
   ```bash
   node --version
   npm --version
   ```

## 🚀 Tạo dự án Vue 3 với Vite

### Tạo project mới

```bash
npm create vue@latest my-vue-library
```

Hoặc sử dụng Vite trực tiếp:

```bash
npm create vite@latest my-vue-library -- --template vue-ts
```

### Cấu trúc thư mục sau khi tạo

```tree
my-vue-library/
├── node_modules/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── App.vue
│   └── main.ts
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── .gitignore
```

## 📁 Cấu trúc thư mục cho Library

Chúng ta cần tổ chức lại cấu trúc để phù hợp với library:

```
my-vue-library/
├── src/
│   ├── components/          # Các component
│   │   ├── Button/
│   │   │   ├── Button.vue
│   │   │   ├── Button.ts
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   ├── Input/
│   │   │   ├── Input.vue
│   │   │   ├── Input.ts
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   └── index.ts        # Export tất cả components
│   ├── composables/         # Composable functions
│   │   └── index.ts
│   ├── utils/               # Utility functions
│   │   └── index.ts
│   ├── types/               # TypeScript types
│   │   └── index.ts
│   └── index.ts             # Main entry point
├── dist/                    # Build output (sẽ được tạo)
├── examples/                # Demo examples (optional)
│   └── App.vue
├── tests/                   # Tests (optional)
│   └── components/
├── .github/                 # GitHub Actions (sẽ tạo sau)
│   └── workflows/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── .npmignore
├── .gitignore
└── README.md
```

### Tạo cấu trúc thư mục

```bash
mkdir -p src/components/Button
mkdir -p src/components/Input
mkdir -p src/composables
mkdir -p src/utils
mkdir -p src/types
mkdir -p examples
mkdir -p tests/components
```

## 📦 Cài đặt Dependencies

### Dependencies (runtime)

```bash
npm install vue@^3.3.0
```

### DevDependencies (development)

```bash
npm install -D \
  typescript@^5.0.0 \
  vite@^4.4.0 \
  @vitejs/plugin-vue@^4.3.0 \
  @vitejs/plugin-vue-jsx@^5.0.0 \
  vue-tsc@^1.8.0 \
  @types/node@^20.0.0 \
  sass@^1.70.0
```

**Lưu ý:**

- `@vitejs/plugin-vue-jsx`: Plugin để hỗ trợ JSX/TSX (khuyến nghị)
- `sass`: Để sử dụng SCSS cho styling (khuyến nghị)

### Package.json mẫu

```json
{
  "name": "my-vue-library",
  "version": "0.1.0",
  "description": "My Vue 3 Component Library",
  "type": "module",
  "main": "./dist/my-vue-library.umd.cjs",
  "module": "./dist/my-vue-library.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/my-vue-library.js",
      "require": "./dist/my-vue-library.umd.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview",
    "type-check": "vue-tsc --noEmit"
  },
  "peerDependencies": {
    "vue": "^3.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@vitejs/plugin-vue": "^4.3.0",
    "typescript": "^5.0.0",
    "vite": "^4.4.0",
    "vue": "^3.3.0",
    "vue-tsc": "^1.8.0"
  }
}
```

## ⚙️ Cấu hình TypeScript

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "jsxImportSource": "vue",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "declaration": true,
    "declarationMap": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Lưu ý:**

- `"jsx": "preserve"`: Giữ nguyên JSX để Vite xử lý
- `"jsxImportSource": "vue"`: Sử dụng Vue JSX transform

### tsconfig.node.json

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

## ⚙️ Cấu hình Vite (tạm thời cho dev)

### vite.config.ts (cho development)

```typescript
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { resolve } from "path";

export default defineConfig({
  plugins: [vue(), vueJsx()], // Thêm vueJsx plugin cho TSX/JSX support
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ["legacy-js-api"],
      },
    },
  },
  build: {
    // Sẽ cấu hình chi tiết ở bài sau
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "MyVueLibrary",
      fileName: "my-vue-library",
    },
    rollupOptions: {
      external: ["vue"],
      output: {
        globals: {
          vue: "Vue",
        },
      },
    },
  },
});
```

## 📝 Tạo Entry Point

### src/index.ts

```typescript
// Export tất cả components
// Nếu sử dụng .vue files:
export { default as Button } from "./components/Button/Button.vue";
export { default as Input } from "./components/Input/Input.vue";

// Nếu sử dụng .tsx files (khuyến nghị):
// export { default as Button } from "./components/Button/Button.tsx";
// export { default as Input } from "./components/Input/Input.tsx";

// Export types
export type { ButtonProps } from "./components/Button/types";
export type { InputProps } from "./components/Input/types";

// Export composables
export * from "./composables";

// Export utils
export * from "./utils";
```

## 🧪 Test cấu hình

### Tạo component test đơn giản

**Cách 1: Sử dụng SFC (.vue)**

**src/components/Button/Button.vue:**

```vue
<template>
  <button class="btn" @click="$emit('click', $event)">
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
defineEmits<{
  click: [event: MouseEvent];
}>();
</script>

<style scoped>
.btn {
  padding: 8px 16px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
```

**Cách 2: Sử dụng TSX (Khuyến nghị)**

**src/utils/useRender.ts:**

```typescript
import type { VNode } from "vue";
import { getCurrentInstance } from "vue";

export function useRender(renderFn: () => VNode | VNode[]): void {
  const instance = getCurrentInstance() as any;
  if (instance) {
    instance.render = renderFn;
  }
}
```

**src/components/Button/Button.tsx:**

```typescript
import { defineComponent } from "vue";
import { useRender } from "@/utils/useRender";
import "./Button.scss";

export default defineComponent({
  name: "Button",
  props: {
    // Props sẽ được định nghĩa ở đây
  },
  emits: ["click"],
  setup(props, { emit, slots }) {
    useRender(() => (
      <button class="btn" onClick={(e) => emit("click", e)}>
        {slots.default?.()}
      </button>
    ));
    return {};
  },
});
```

**src/components/Button/Button.scss:**

```scss
.btn {
  padding: 8px 16px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
```

**src/components/Button/index.ts:**

```typescript
// Nếu dùng .vue:
// export { default } from "./Button.vue";

// Nếu dùng .tsx:
export { default } from "./Button.tsx";
```

### Test chạy dev server

```bash
npm run dev
```

Nếu không có lỗi, bạn đã setup thành công! 🎉

## 📋 Checklist

- [ ] Đã cài đặt Node.js và npm
- [ ] Đã tạo project Vue 3 với Vite
- [ ] Đã tổ chức cấu trúc thư mục cho library
- [ ] Đã cài đặt dependencies
- [ ] Đã cấu hình TypeScript
- [ ] Đã cấu hình Vite cơ bản
- [ ] Đã tạo entry point
- [ ] Đã test dev server

## 🎓 Bài tập thực hành

1. Tạo project mới với tên của bạn
2. Tổ chức cấu trúc thư mục như hướng dẫn
3. Tạo một component Button đơn giản
4. Test chạy dev server

## 📚 Tài liệu tham khảo

- [Node.js Installation](https://nodejs.org/)
- [Vite Getting Started](https://vitejs.dev/guide/)
- [TypeScript Configuration](https://www.typescriptlang.org/tsconfig)
- [Vue 3 Project Setup](https://vuejs.org/guide/scaling-up/tooling.html)

## ➡️ Bài tiếp theo

Sẵn sàng? Hãy chuyển sang [Bài 03: Xây dựng Component Vue 3](./03-xay-dung-component.md)
