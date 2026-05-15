# Bài 05: Đóng gói và Bundle

## 📖 Mục tiêu bài học

Sau bài học này, bạn sẽ:
- Hiểu cấu trúc package.json cho library
- Biết cách cấu hình exports và entry points
- Hiểu về peer dependencies
- Biết cách tạo build scripts
- Biết cách test build output

## 📦 Cấu trúc package.json cho Library

### package.json hoàn chỉnh

```json
{
  "name": "my-vue-library",
  "version": "0.1.0",
  "description": "A Vue 3 component library",
  "keywords": [
    "vue",
    "vue3",
    "components",
    "ui",
    "library"
  ],
  "author": "Your Name <your.email@example.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/my-vue-library.git"
  },
  "homepage": "https://github.com/yourusername/my-vue-library#readme",
  "bugs": {
    "url": "https://github.com/yourusername/my-vue-library/issues"
  },
  "type": "module",
  "main": "./dist/my-vue-library.cjs.js",
  "module": "./dist/my-vue-library.es.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/my-vue-library.es.js",
      "require": "./dist/my-vue-library.cjs.js",
      "types": "./dist/index.d.ts"
    },
    "./style.css": "./dist/my-vue-library.css"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "sideEffects": [
    "*.css",
    "*.scss"
  ],
  "scripts": {
    "dev": "vite",
    "build": "npm run build:types && npm run build:lib",
    "build:types": "vue-tsc --declaration --emitDeclarationOnly --outDir dist",
    "build:lib": "vite build",
    "build:watch": "vite build --watch",
    "preview": "vite preview",
    "type-check": "vue-tsc --noEmit",
    "clean": "rm -rf dist",
    "prepublishOnly": "npm run clean && npm run build"
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

## 📤 Exports và Entry Points

### Modern Exports (khuyến nghị)

```json
{
  "exports": {
    ".": {
      "import": "./dist/my-vue-library.es.js",
      "require": "./dist/my-vue-library.cjs.js",
      "types": "./dist/index.d.ts"
    },
    "./style.css": "./dist/my-vue-library.css",
    "./components": {
      "import": "./dist/components/index.es.js",
      "require": "./dist/components/index.cjs.js",
      "types": "./dist/components/index.d.ts"
    }
  }
}
```

### Legacy Exports (fallback)

```json
{
  "main": "./dist/my-vue-library.cjs.js",
  "module": "./dist/my-vue-library.es.js",
  "types": "./dist/index.d.ts"
}
```

### Multiple Entry Points

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.es.js",
      "require": "./dist/index.cjs.js",
      "types": "./dist/index.d.ts"
    },
    "./Button": {
      "import": "./dist/Button.es.js",
      "require": "./dist/Button.cjs.js",
      "types": "./dist/Button.d.ts"
    },
    "./Input": {
      "import": "./dist/Input.es.js",
      "require": "./dist/Input.cjs.js",
      "types": "./dist/Input.d.ts"
    }
  }
}
```

## 🔗 Peer Dependencies

### Tại sao cần Peer Dependencies?

Peer dependencies là các package mà library của bạn cần nhưng không muốn bundle vào. Người dùng sẽ tự cài đặt.

**Ví dụ:**
```json
{
  "peerDependencies": {
    "vue": "^3.3.0"
  }
}
```

### Peer Dependencies vs Dependencies

**peerDependencies:**
- Package cần có nhưng không bundle vào
- Người dùng tự cài đặt
- Tránh duplicate dependencies
- Ví dụ: vue, react, angular

**dependencies:**
- Package được bundle vào output
- Tự động cài đặt khi install library
- Ví dụ: lodash, axios

**devDependencies:**
- Chỉ dùng trong development
- Không được bundle
- Ví dụ: vite, typescript, testing tools

### Peer Dependencies Meta

```json
{
  "peerDependencies": {
    "vue": "^3.3.0"
  },
  "peerDependenciesMeta": {
    "vue": {
      "optional": false
    }
  }
}
```

## 📝 Files Field

Chỉ định files nào sẽ được publish lên npm:

```json
{
  "files": [
    "dist",
    "README.md",
    "LICENSE",
    "CHANGELOG.md"
  ]
}
```

### .npmignore

Tạo file `.npmignore` để exclude files:

```
node_modules
src
tests
examples
.vscode
.idea
*.log
.DS_Store
.env
.env.local
coverage
.vitest
```

## 🚀 Build Scripts

### Scripts cơ bản

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

### Pre-publish Scripts

```json
{
  "scripts": {
    "prepublishOnly": "npm run clean && npm run build",
    "prepack": "npm run build",
    "postpublish": "git push && git push --tags"
  }
}
```

### Version Scripts

```json
{
  "scripts": {
    "version:patch": "npm version patch",
    "version:minor": "npm version minor",
    "version:major": "npm version major"
  }
}
```

## 🧪 Test Build Output

### 1. Build package

```bash
npm run build
```

### 2. Kiểm tra dist folder

```bash
ls -la dist/
```

Kiểm tra:
- [ ] ESM file (.es.js)
- [ ] CJS file (.cjs.js)
- [ ] UMD file (.umd.js) (nếu có)
- [ ] TypeScript declarations (.d.ts)
- [ ] CSS file
- [ ] Source maps (.map)

### 3. Test ESM import

**test-esm.mjs:**
```javascript
import { Button } from './dist/my-vue-library.es.js'
console.log('ESM import successful!', Button)
```

```bash
node test-esm.mjs
```

### 4. Test CJS require

**test-cjs.cjs:**
```javascript
const { Button } = require('./dist/my-vue-library.cjs.js')
console.log('CJS require successful!', Button)
```

```bash
node test-cjs.cjs
```

### 5. Test với npm link

```bash
# Trong project library
npm link

# Trong project test
npm link my-vue-library
```

**test-project/src/main.ts:**
```typescript
import { Button } from 'my-vue-library'
import 'my-vue-library/style.css'
```

## 📊 Bundle Analysis

### Sử dụng rollup-plugin-visualizer

```bash
npm install -D rollup-plugin-visualizer
```

**vite.config.ts:**
```typescript
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    vue(),
    visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  // ... rest of config
})
```

Sau khi build, mở `dist/stats.html` để xem bundle analysis.

## 🔍 Kiểm tra Bundle Size

### Sử dụng size-limit

```bash
npm install -D size-limit @size-limit/preset-small-lib
```

**package.json:**
```json
{
  "size-limit": [
    {
      "path": "dist/my-vue-library.es.js",
      "limit": "10 KB"
    },
    {
      "path": "dist/my-vue-library.cjs.js",
      "limit": "10 KB"
    }
  ],
  "scripts": {
    "size": "size-limit"
  }
}
```

```bash
npm run size
```

## 📋 Checklist

- [ ] Đã cấu hình package.json đầy đủ
- [ ] Đã setup exports và entry points
- [ ] Đã cấu hình peer dependencies
- [ ] Đã tạo .npmignore
- [ ] Đã setup build scripts
- [ ] Đã test build output
- [ ] Đã kiểm tra bundle size

## 🎓 Bài tập thực hành

1. Hoàn thiện package.json với tất cả fields cần thiết
2. Cấu hình exports cho ESM, CJS, và types
3. Setup peer dependencies
4. Tạo build scripts
5. Test build output với npm link
6. Phân tích bundle size

## 📚 Tài liệu tham khảo

- [package.json Fields](https://docs.npmjs.com/cli/v9/configuring-npm/package-json)
- [Package Exports](https://nodejs.org/api/packages.html#exports)
- [Peer Dependencies](https://nodejs.org/en/blog/npm/peer-dependencies/)
- [npm link](https://docs.npmjs.com/cli/v9/commands/npm-link)

## ➡️ Bài tiếp theo

Sẵn sàng? Hãy chuyển sang [Bài 06: Xuất bản lên Npm](./06-xuat-ban-npm)

