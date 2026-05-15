# Bài 03b: Xây dựng Component với TSX/JSX (Khuyến nghị cho Library)

## 📖 Mục tiêu bài học

Sau bài học này, bạn sẽ:

- ✅ **Hiểu tại sao TSX/JSX phù hợp hơn cho việc build package**
- ✅ Biết cách cài đặt và cấu hình TSX/JSX cho Vue 3
- ✅ Biết cách viết component với TSX/JSX theo chuẩn inet-component
- ✅ Hiểu cách sử dụng `useRender` hook
- ✅ Biết cách tách styles với SCSS
- ✅ Hiểu cấu trúc component tối ưu cho library

> **🎯 Khuyến nghị:** Bài này là **bắt buộc** nếu bạn muốn build package chuyên nghiệp. TSX/JSX cung cấp TypeScript support tốt hơn, tách biệt code rõ ràng hơn, và phù hợp hơn cho việc build library.

## 🚀 Tại sao TSX/JSX phù hợp cho Library?

### So sánh SFC (.vue) vs TSX (.tsx) cho Library

| Tính năng                | SFC (.vue) | TSX (.tsx) |
| ------------------------ | ---------- | ---------- |
| **TypeScript support**   | Tốt        | **Rất tốt** ⭐ |
| **Tách biệt logic/template** | Khó        | **Dễ** ⭐ |
| **IDE support**          | Tốt        | **Rất tốt** ⭐ |
| **Code splitting**       | Tốt        | **Tốt hơn** ⭐ |
| **Build optimization**    | Tốt        | **Tốt hơn** ⭐ |
| **Phù hợp cho library**  | Tốt        | **Rất tốt** ⭐ |
| **Theo chuẩn inet-component** | ❌ | **✅** ⭐ |

### Lợi ích chính cho Library:

1. **✅ TypeScript support mạnh mẽ hơn**
   - Type checking tốt hơn
   - Auto-complete chính xác hơn
   - Refactoring an toàn hơn

2. **✅ Tách biệt code rõ ràng**
   - Component logic (.tsx)
   - Styles (.scss)
   - Types (.ts)
   - Composables (.ts)

3. **✅ Build optimization tốt hơn**
   - Tree-shaking hiệu quả hơn
   - Bundle size nhỏ hơn
   - Type declarations chính xác hơn

4. **✅ Theo chuẩn industry**
   - Nhiều library lớn sử dụng TSX (inet-component, Element Plus, Ant Design Vue)
   - Dễ maintain và scale

## 🔧 Cài đặt và Cấu hình

### 1. Cài đặt dependencies

```bash
npm install -D @vitejs/plugin-vue-jsx sass
```

**Lưu ý:**
- `@vitejs/plugin-vue-jsx`: Plugin để hỗ trợ JSX/TSX
- `sass`: Để sử dụng SCSS cho styling (khuyến nghị)

### 2. Cấu hình Vite

**vite.config.ts:**

```typescript
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { resolve } from "path";

export default defineConfig({
  plugins: [vue(), vueJsx()], // Thêm vueJsx plugin
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
  // ... rest of config
});
```

### 3. Cấu hình TypeScript

**tsconfig.json:**

```json
{
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "vue",
    // ... rest of config
  }
}
```

**Lưu ý:**
- `"jsx": "preserve"`: Giữ nguyên JSX để Vite xử lý
- `"jsxImportSource": "vue"`: Sử dụng Vue JSX transform

### 4. Tạo useRender hook

**src/utils/useRender.ts:**

```typescript
import type { VNode } from "vue";
import { getCurrentInstance } from "vue";

/**
 * Hook để render JSX/TSX trong Vue component
 * Sử dụng để viết component Vue với cú pháp JSX/TSX
 * 
 * @example
 * ```typescript
 * useRender(() => (
 *   <button onClick={handleClick}>
 *     {slots.default?.()}
 *   </button>
 * ));
 * ```
 */
export function useRender(renderFn: () => VNode | VNode[]): void {
  const instance = getCurrentInstance() as any;

  if (instance) {
    instance.render = renderFn;
  }
}
```

## 🎨 Component Button với TSX

### Cấu trúc thư mục (theo chuẩn inet-component)

```
src/components/Button/
├── Button.tsx          # Component chính
├── Button.scss         # Styles
├── useButton.ts        # Composable (nếu cần)
├── types.ts            # TypeScript types
├── Button.spec.ts      # Tests (nếu có)
├── Doc.md              # Documentation (nếu có)
└── index.ts            # Export
```

### Component Button

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

**src/components/Button/types.ts:**

```typescript
export interface ButtonProps {
  variant?: "primary" | "secondary" | "outline";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
}
```

**src/components/Button/index.ts:**

```typescript
export { default } from "./Button.tsx";
export type { ButtonProps } from "./types";
```

## 📥 Component Input với TSX

**src/components/Input/Input.tsx:**

```typescript
import { defineComponent } from "vue";
import { useRender } from "@/utils/useRender";
import type { InputProps } from "./types";

import "./Input.scss";

export default defineComponent({
  name: "Input",
  props: {
    modelValue: {
      type: String,
      default: "",
    },
    type: {
      type: String as () => "text" | "email" | "password" | "number",
      default: "text",
    },
    label: {
      type: String,
      default: undefined,
    },
    placeholder: {
      type: String,
      default: undefined,
    },
    error: {
      type: String,
      default: undefined,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue", "blur", "focus"],
  setup(props, { emit }) {
    const inputClass = [
      "input",
      {
        "input--error": !!props.error,
        "input--disabled": props.disabled,
      },
    ];

    const handleInput = (event: Event) => {
      const target = event.target as HTMLInputElement;
      emit("update:modelValue", target.value);
    };

    const handleBlur = (event: FocusEvent) => {
      emit("blur", event);
    };

    const handleFocus = (event: FocusEvent) => {
      emit("focus", event);
    };

    useRender(() => (
      <div class="input-wrapper">
        {props.label && <label class="input-label">{props.label}</label>}
        <input
          type={props.type}
          value={props.modelValue}
          placeholder={props.placeholder}
          disabled={props.disabled}
          class={inputClass}
          onInput={handleInput}
          onBlur={handleBlur}
          onFocus={handleFocus}
        />
        {props.error && <span class="input-error">{props.error}</span>}
      </div>
    ));

    return {};
  },
});
```

**src/components/Input/Input.scss:**

```scss
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #42b983;
  }

  &--error {
    border-color: #f56565;
  }

  &--disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }
}

.input-error {
  font-size: 12px;
  color: #f56565;
}
```

## 🎭 Slots với TSX

### Default Slot

```typescript
useRender(() => (
  <div class="card">
    {slots.default?.()}
  </div>
));
```

### Named Slots

```typescript
useRender(() => (
  <div class="card">
    {slots.header && (
      <header class="card-header">
        {slots.header()}
      </header>
    )}
    <main class="card-body">
      {slots.default?.()}
    </main>
    {slots.footer && (
      <footer class="card-footer">
        {slots.footer()}
      </footer>
    )}
  </div>
));
```

### Scoped Slots

```typescript
useRender(() => (
  <ul class="list">
    {props.items.map((item, index) => (
      <li key={item.id}>
        {slots.default?.({ item, index })}
      </li>
    ))}
  </ul>
));
```

## 🔧 Composables với TSX

**src/components/Button/useButton.ts:**

```typescript
import { computed } from "vue";
import type { ButtonProps } from "./types";

export function useButton(props: ButtonProps) {
  const buttonClass = computed(() => [
    "btn",
    `btn--${props.variant}`,
    `btn--${props.size}`,
    {
      "btn--disabled": props.disabled,
    },
  ]);

  return {
    buttonClass,
  };
}
```

**Sử dụng trong component:**

```typescript
import { useButton } from "./useButton";

setup(props, { emit, slots }) {
  const { buttonClass } = useButton(props);
  
  // ... rest of code
}
```

## 📝 Ví dụ: Card Component hoàn chỉnh

**src/components/Card/Card.tsx:**

```typescript
import { defineComponent, computed } from "vue";
import { useRender } from "@/utils/useRender";
import type { CardProps } from "./types";

import "./Card.scss";

export default defineComponent({
  name: "Card",
  props: {
    shadow: {
      type: String as () => "small" | "medium" | "large",
      default: "medium",
    },
    bordered: {
      type: Boolean,
      default: true,
    },
  },
  setup(props, { slots }) {
    const cardClass = computed(() => [
      "card",
      `card--shadow-${props.shadow}`,
      {
        "card--bordered": props.bordered,
      },
    ]);

    useRender(() => (
      <div class={cardClass.value}>
        {slots.header && (
          <div class="card-header">{slots.header()}</div>
        )}
        <div class="card-body">{slots.default?.()}</div>
        {slots.footer && (
          <div class="card-footer">{slots.footer()}</div>
        )}
      </div>
    ));

    return {};
  },
});
```

## ✅ Best Practices cho TSX Components trong Library

### 1. **Cấu trúc thư mục chuẩn**

```
ComponentName/
├── ComponentName.tsx    # Component chính
├── ComponentName.scss   # Styles
├── useComponentName.ts  # Composables (nếu cần)
├── types.ts             # TypeScript types
├── ComponentName.spec.ts # Tests
├── Doc.md               # Documentation
└── index.ts             # Export
```

### 2. **Tách styles riêng**

- ✅ Import SCSS file riêng
- ✅ Sử dụng SCSS nesting
- ✅ Sử dụng CSS variables cho customization

### 3. **Type-safe props**

- ✅ Sử dụng TypeScript cho props
- ✅ Export types riêng
- ✅ Sử dụng type assertions cho union types

### 4. **Composables**

- ✅ Extract logic vào composables
- ✅ Tái sử dụng logic giữa các components
- ✅ Dễ dàng test

### 5. **Named exports**

- ✅ Export component default
- ✅ Export types riêng
- ✅ Export composables riêng

## 🎯 Lợi ích cho Build Package

### 1. **TypeScript Declarations chính xác**

TSX tạo ra `.d.ts` files chính xác hơn, giúp:
- IDE support tốt hơn
- Type checking tốt hơn
- Auto-complete chính xác hơn

### 2. **Tree-shaking hiệu quả**

TSX giúp:
- Bundle size nhỏ hơn
- Loại bỏ code không sử dụng tốt hơn
- Import chỉ những gì cần thiết

### 3. **Build optimization**

TSX giúp:
- Build nhanh hơn
- Source maps chính xác hơn
- Debug dễ dàng hơn

## 📋 Checklist

- [ ] Đã cài đặt `@vitejs/plugin-vue-jsx` và `sass`
- [ ] Đã cấu hình Vite với `vueJsx()` plugin
- [ ] Đã cấu hình TypeScript với JSX support
- [ ] Đã tạo `useRender` hook
- [ ] Đã tạo component với TSX
- [ ] Đã tách styles riêng với SCSS
- [ ] Đã export types riêng
- [ ] Đã test component

## 🎓 Bài tập thực hành

1. ✅ Cài đặt và cấu hình TSX/JSX
2. ✅ Tạo `useRender` hook
3. ✅ Tạo component Button với TSX
4. ✅ Tạo component Input với TSX
5. ✅ Tạo component Card với TSX và slots
6. ✅ Tạo composable function (ví dụ: useButton, useInput)

## 📚 Tài liệu tham khảo

- [Vue 3 JSX](https://vuejs.org/guide/extras/render-function.html#jsx-tsx)
- [@vitejs/plugin-vue-jsx](https://github.com/vitejs/vite-plugin-vue-jsx)
- [inet-component](https://www.npmjs.com/package/inet-component) - Ví dụ thực tế
- [TypeScript JSX](https://www.typescriptlang.org/docs/handbook/jsx.html)

## ➡️ Bài tiếp theo

Sẵn sàng? Hãy chuyển sang [Bài 04: Cấu hình Build cho Thư viện](./04-cau-hinh-build) để học cách build package với TSX components!

> **Lưu ý:** Nếu bạn muốn xem cách viết component với SFC (.vue), hãy xem [Bài 03a: Xây dựng Component với SFC](./03a-xay-dung-component-sfc).

