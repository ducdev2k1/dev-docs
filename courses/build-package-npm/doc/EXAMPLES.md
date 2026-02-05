# 💡 Ví dụ Code và Templates

## 📦 Package.json Template

```json
{
  "name": "@yourusername/my-vue-library",
  "version": "0.1.0",
  "description": "A Vue 3 component library with TSX/JSX support",
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
    "prepublishOnly": "npm run clean && npm run build",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:run": "vitest run",
    "lint": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts --fix",
    "lint:check": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts",
    "release": "standard-version && git push --follow-tags"
  },
  "peerDependencies": {
    "vue": "^3.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@vitejs/plugin-vue": "^4.3.0",
    "@vitejs/plugin-vue-jsx": "^5.0.0",
    "typescript": "^5.0.0",
    "vite": "^4.4.0",
    "vue": "^3.3.0",
    "vue-tsc": "^1.8.0",
    "sass": "^1.70.0",
    "vitest": "^1.0.0",
    "@vue/test-utils": "^2.4.0",
    "happy-dom": "^12.0.0",
    "eslint": "^8.50.0",
    "@typescript-eslint/parser": "^6.7.0",
    "@typescript-eslint/eslint-plugin": "^6.7.0",
    "eslint-plugin-vue": "^9.17.0",
    "standard-version": "^9.5.0"
  }
}
```

## ⚙️ Vite Config Template

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { resolve } from 'path'
import { readFileSync } from 'fs'

const packageJson = JSON.parse(
  readFileSync(resolve(__dirname, 'package.json'), 'utf-8')
)

export default defineConfig({
  plugins: [vue(), vueJsx()], // Thêm vueJsx cho TSX/JSX support
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['legacy-js-api'],
      },
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MyVueLibrary',
      fileName: (format) => `my-vue-library.${format}.js`,
      formats: ['es', 'cjs', 'umd'],
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') {
            return 'my-vue-library.css'
          }
          return assetInfo.name || 'asset'
        },
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    sourcemap: true,
    emptyOutDir: true,
  },
})
```

## 📝 TypeScript Config Template

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
    "noEmit": false,
    "jsx": "preserve",
    "jsxImportSource": "vue",
    "declaration": true,
    "declarationMap": true,
    "emitDeclarationOnly": true,
    "outDir": "./dist",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**Lưu ý:**
- `"jsx": "preserve"`: Giữ nguyên JSX để Vite xử lý
- `"jsxImportSource": "vue"`: Sử dụng Vue JSX transform

## 🎨 Component Template

### Button Component với TSX (Khuyến nghị)

**src/components/Button/Button.tsx:**

```typescript
import { defineComponent } from "vue";
import { useRender } from "@/utils/useRender";
import type { ButtonProps } from "./types";

// Import style
import "./Button.scss";

export default defineComponent({
  name: "Button",
  props: {
    variant: {
      type: String as () => "primary" | "secondary" | "outline",
      default: "primary",
    },
    size: {
      type: String as () => "small" | "medium" | "large",
      default: "medium",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["click"],
  setup(props, { emit, slots }) {
    const buttonClass = [
      "btn",
      `btn--${props.variant}`,
      `btn--${props.size}`,
      {
        "btn--disabled": props.disabled,
      },
    ];

    const handleClick = (event: MouseEvent) => {
      if (!props.disabled) {
        emit("click", event);
      }
    };

    useRender(() => (
      <button
        class={buttonClass}
        disabled={props.disabled}
        onClick={handleClick}
      >
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;

  &--small {
    padding: 6px 12px;
    font-size: 12px;
  }

  &--medium {
    padding: 8px 16px;
    font-size: 14px;
  }

  &--large {
    padding: 12px 24px;
    font-size: 16px;
  }

  &--primary {
    background-color: #42b983;
    color: white;

    &:hover:not(.btn--disabled) {
      background-color: #35a372;
    }
  }

  &--secondary {
    background-color: #6c757d;
    color: white;

    &:hover:not(.btn--disabled) {
      background-color: #5a6268;
    }
  }

  &--outline {
    background-color: transparent;
    border: 1px solid #42b983;
    color: #42b983;

    &:hover:not(.btn--disabled) {
      background-color: #42b983;
      color: white;
    }
  }

  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
```

**src/utils/useRender.ts:**

```typescript
import type { VNode } from "vue";
import { getCurrentInstance } from "vue";

/**
 * Hook để render JSX/TSX trong Vue component
 * Sử dụng để viết component Vue với cú pháp JSX/TSX
 */
export function useRender(renderFn: () => VNode | VNode[]): void {
  const instance = getCurrentInstance() as any;

  if (instance) {
    instance.render = renderFn;
  }
}
```

### Button Component với SFC (.vue)

**src/components/Button/Button.vue:**
```vue
<template>
  <button 
    :class="buttonClass" 
    :disabled="disabled"
    @click="handleClick"
  >
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ButtonProps } from './types'

const props = withDefaults(defineProps<ButtonProps>(), {
  variant: 'primary',
  size: 'medium',
  disabled: false,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonClass = computed(() => [
  'btn',
  `btn--${props.variant}`,
  `btn--${props.size}`,
  {
    'btn--disabled': props.disabled,
  },
])

const handleClick = (event: MouseEvent) => {
  if (!props.disabled) {
    emit('click', event)
  }
}
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn--small {
  padding: 6px 12px;
  font-size: 12px;
}

.btn--medium {
  padding: 8px 16px;
  font-size: 14px;
}

.btn--large {
  padding: 12px 24px;
  font-size: 16px;
}

.btn--primary {
  background-color: #42b983;
  color: white;
}

.btn--primary:hover:not(.btn--disabled) {
  background-color: #35a372;
}

.btn--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
```

**src/components/Button/types.ts:**
```typescript
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
}
```

**src/components/Button/index.ts:**
```typescript
export { default } from './Button.vue'
export type { ButtonProps } from './types'
```

## 📤 Entry Point Template

**src/index.ts:**
```typescript
// Export components
// Nếu sử dụng .tsx files (khuyến nghị):
export { default as Button } from './components/Button/Button.tsx'
export { default as Input } from './components/Input/Input.tsx'
export { default as Card } from './components/Card/Card.tsx'

// Nếu sử dụng .vue files:
// export { default as Button } from './components/Button/Button.vue'
// export { default as Input } from './components/Input/Input.vue'
// export { default as Card } from './components/Card/Card.vue'

// Export types
export type { ButtonProps } from './components/Button/types'
export type { InputProps } from './components/Input/types'
export type { CardProps } from './components/Card/types'

// Export composables
export * from './composables'

// Export utils
export * from './utils'
```

## 🧪 Test Template

**tests/components/Button.test.ts:**
```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from '@/components/Button/Button.vue'

describe('Button', () => {
  it('renders correctly', () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'Click me',
      },
    })
    
    expect(wrapper.text()).toBe('Click me')
  })

  it('emits click event', async () => {
    const wrapper = mount(Button)
    
    await wrapper.trigger('click')
    
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('applies variant class', () => {
    const wrapper = mount(Button, {
      props: {
        variant: 'primary',
      },
    })
    
    expect(wrapper.classes()).toContain('btn--primary')
  })
})
```

## 🔄 GitHub Actions Template

**.github/workflows/ci.yml:**
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  quality:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint:check

      - name: Type check
        run: npm run type-check

      - name: Build
        run: npm run build

      - name: Test
        run: npm run test:run
```

**.github/workflows/publish.yml:**
```yaml
name: Publish

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          registry-url: 'https://registry.npmjs.org'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Publish to npm
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## 📝 .npmignore Template

```
# Source files
src/
examples/
tests/
*.test.ts
*.spec.ts

# Development files
.vscode/
.idea/
*.log
.DS_Store
.env
.env.local

# Build tools
vite.config.ts
tsconfig.json
tsconfig.node.json

# Git
.git/
.gitignore

# Coverage
coverage/
.nyc_output/

# Misc
node_modules/
dist/stats.html
```

## 📋 .gitignore Template

```
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output

# Production
dist/
build/

# Misc
.DS_Store
*.log
.env
.env.local
.env.*.local

# Editor
.vscode/
.idea/
*.swp
*.swo
*~

# OS
Thumbs.db
```

## 🎯 Composable Template

**src/composables/useToggle.ts:**
```typescript
import { ref } from 'vue'

/**
 * Toggle boolean value
 * 
 * @param initialValue - Initial value
 * @returns Object with value and toggle functions
 */
export function useToggle(initialValue = false) {
  const value = ref(initialValue)
  
  const toggle = () => {
    value.value = !value.value
  }
  
  const setTrue = () => {
    value.value = true
  }
  
  const setFalse = () => {
    value.value = false
  }
  
  return {
    value,
    toggle,
    setTrue,
    setFalse,
  }
}
```

## 📚 README Template

Xem [Bài 07: Tài liệu và Demo](./lessons/07-tai-lieu-demo.md) để có README template đầy đủ.

---

**Sử dụng các templates này để bắt đầu nhanh chóng! 🚀**

