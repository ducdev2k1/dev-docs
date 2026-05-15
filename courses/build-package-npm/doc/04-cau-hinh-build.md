# Bài 04: Cấu hình Build cho Thư viện

## 📖 Mục tiêu bài học

Sau bài học này, bạn sẽ:
- Hiểu cách cấu hình Vite cho library mode
- Biết cách build multiple entry points
- Biết cách generate TypeScript declarations
- Hiểu về tree-shaking và optimization
- Biết các format output: ESM, CJS, UMD

## ⚙️ Cấu hình Vite cho Library Mode

### vite.config.ts hoàn chỉnh

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { readFileSync } from 'fs'

// Đọc package.json để lấy tên package
const packageJson = JSON.parse(
  readFileSync(resolve(__dirname, 'package.json'), 'utf-8')
)

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      // Entry point
      entry: resolve(__dirname, 'src/index.ts'),
      // Tên của library (sẽ được expose ra global nếu dùng UMD)
      name: 'MyVueLibrary',
      // Tên file output
      fileName: (format) => `my-vue-library.${format}.js`,
      // Các format muốn build
      formats: ['es', 'cjs', 'umd'],
    },
    rollupOptions: {
      // Externalize dependencies (không bundle vào output)
      external: ['vue'],
      output: {
        // Global variables cho UMD build
        globals: {
          vue: 'Vue',
        },
        // Asset file names
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') {
            return 'my-vue-library.css'
          }
          return assetInfo.name || 'asset'
        },
      },
    },
    // Tối ưu hóa build
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // Source maps cho debugging
    sourcemap: true,
    // Empty outDir trước khi build
    emptyOutDir: true,
  },
})
```

## 📦 Multiple Entry Points

Nếu bạn muốn export nhiều entry points (ví dụ: components riêng lẻ):

### Cấu hình multiple entries

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: {
        // Main entry
        index: resolve(__dirname, 'src/index.ts'),
        // Individual components
        Button: resolve(__dirname, 'src/components/Button/index.ts'),
        Input: resolve(__dirname, 'src/components/Input/index.ts'),
        Card: resolve(__dirname, 'src/components/Card/index.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        if (entryName === 'index') {
          return `my-vue-library.${format}.js`
        }
        return `${entryName}.${format}.js`
      },
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
})
```

## 📝 TypeScript Declarations

### Cấu hình tsconfig.json cho build

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": false,
    "declaration": true,
    "declarationMap": true,
    "emitDeclarationOnly": true,
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### Script build với TypeScript declarations

**package.json:**
```json
{
  "scripts": {
    "build": "npm run build:types && npm run build:lib",
    "build:types": "vue-tsc --declaration --emitDeclarationOnly",
    "build:lib": "vite build",
    "type-check": "vue-tsc --noEmit"
  }
}
```

### Vue SFC TypeScript declarations

Để generate .d.ts cho .vue files, cần cấu hình:

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  plugins: [
    vue({
      script: {
        defineModel: true,
        propsDestructure: true,
      },
    }),
    vueJsx(),
  ],
  // ... rest of config
})
```

## 🎯 Output Formats

### ESM (ES Modules) - Khuyến nghị

```typescript
formats: ['es']
```

**Output:** `my-vue-library.es.js`

**Sử dụng:**
```javascript
import { Button } from 'my-vue-library'
```

### CJS (CommonJS)

```typescript
formats: ['cjs']
```

**Output:** `my-vue-library.cjs.js`

**Sử dụng:**
```javascript
const { Button } = require('my-vue-library')
```

### UMD (Universal Module Definition)

```typescript
formats: ['umd']
```

**Output:** `my-vue-library.umd.js`

**Sử dụng:**
```html
<script src="https://unpkg.com/my-vue-library/dist/my-vue-library.umd.js"></script>
<script>
  const { Button } = MyVueLibrary
</script>
```

### Build tất cả formats

```typescript
formats: ['es', 'cjs', 'umd']
```

## 🌳 Tree-shaking

Tree-shaking cho phép loại bỏ code không sử dụng. Để enable:

### 1. Sử dụng named exports

**src/index.ts:**
```typescript
// ✅ Good - Tree-shakeable
export { Button } from './components/Button'
export { Input } from './components/Input'

// ❌ Bad - Không tree-shakeable
export default {
  Button,
  Input,
}
```

### 2. Side-effect free

**package.json:**
```json
{
  "sideEffects": false
}
```

Hoặc nếu có side effects:
```json
{
  "sideEffects": [
    "*.css",
    "*.scss"
  ]
}
```

### 3. ESM format

ESM format hỗ trợ tree-shaking tốt hơn CJS.

## 🚀 Optimization

### Code splitting

```typescript
rollupOptions: {
  output: {
    manualChunks: (id) => {
      // Chunk node_modules riêng
      if (id.includes('node_modules')) {
        return 'vendor'
      }
    },
  },
}
```

### Minification

```typescript
build: {
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true,
      drop_debugger: true,
      pure_funcs: ['console.log'],
    },
  },
}
```

### CSS extraction

Vite tự động extract CSS. Để tùy chỉnh:

```typescript
build: {
  cssCodeSplit: true, // Split CSS per component
  // hoặc
  cssCodeSplit: false, // Single CSS file
}
```

## 📦 Build Scripts

### package.json scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "npm run build:types && npm run build:lib",
    "build:types": "vue-tsc --declaration --emitDeclarationOnly --outDir dist",
    "build:lib": "vite build",
    "build:watch": "vite build --watch",
    "preview": "vite preview",
    "type-check": "vue-tsc --noEmit",
    "clean": "rm -rf dist"
  }
}
```

### Build commands

```bash
# Build production
npm run build

# Build và watch changes
npm run build:watch

# Type check only
npm run type-check

# Clean build folder
npm run clean
```

## 📁 Output Structure

Sau khi build, cấu trúc sẽ như sau:

```
dist/
├── my-vue-library.es.js          # ESM format
├── my-vue-library.es.js.map      # Source map
├── my-vue-library.cjs.js          # CommonJS format
├── my-vue-library.cjs.js.map     # Source map
├── my-vue-library.umd.js         # UMD format
├── my-vue-library.umd.js.map     # Source map
├── my-vue-library.css            # Extracted CSS
├── index.d.ts                    # TypeScript declarations
├── components/
│   ├── Button.d.ts
│   └── Input.d.ts
└── types/
    └── index.d.ts
```

## 🧪 Test Build

### Kiểm tra build output

```bash
npm run build
```

Kiểm tra:
- [ ] Files được tạo trong `dist/`
- [ ] TypeScript declarations (.d.ts) được generate
- [ ] CSS được extract
- [ ] Source maps được tạo
- [ ] Bundle size hợp lý

### Test import

Tạo file test:

**test-import.mjs:**
```javascript
import { Button } from './dist/my-vue-library.es.js'
console.log('Import successful!', Button)
```

```bash
node test-import.mjs
```

## 📋 Checklist

- [ ] Đã cấu hình Vite cho library mode
- [ ] Đã setup TypeScript declarations
- [ ] Đã chọn output formats phù hợp
- [ ] Đã cấu hình tree-shaking
- [ ] Đã optimize build
- [ ] Đã test build thành công

## 🎓 Bài tập thực hành

1. Cấu hình Vite cho library mode
2. Setup TypeScript declarations
3. Build với các formats: ESM, CJS, UMD
4. Test import từ dist folder
5. Kiểm tra bundle size

## 📚 Tài liệu tham khảo

- [Vite Library Mode](https://vitejs.dev/guide/build.html#library-mode)
- [Rollup Configuration](https://rollupjs.org/configuration-options/)
- [TypeScript Declaration Files](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)
- [Tree Shaking](https://webpack.js.org/guides/tree-shaking/)

## ➡️ Bài tiếp theo

Sẵn sàng? Hãy chuyển sang [Bài 05: Đóng gói và Bundle](./05-dong-goi-bundle)

