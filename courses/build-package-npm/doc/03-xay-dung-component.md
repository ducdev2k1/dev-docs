# Bài 03: Xây dựng Component Vue 3

## 📖 Mục tiêu bài học

Sau bài học này, bạn sẽ:

- Biết cách tạo component Vue 3 với Composition API
- Hiểu cách sử dụng Props và Events
- Biết cách sử dụng Slots và Scoped Slots
- Biết cách tích hợp TypeScript
- Biết cách styling component

## 🎨 Tạo Component cơ bản

### Component Button đơn giản

**src/components/Button/Button.vue:**

```vue
<template>
  <button :class="buttonClass" :disabled="disabled" @click="handleClick">
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ButtonProps } from "./types";

const props = withDefaults(defineProps<ButtonProps>(), {
  variant: "primary",
  size: "medium",
  disabled: false,
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const buttonClass = computed(() => [
  "btn",
  `btn--${props.variant}`,
  `btn--${props.size}`,
  {
    "btn--disabled": props.disabled,
  },
]);

const handleClick = (event: MouseEvent) => {
  if (!props.disabled) {
    emit("click", event);
  }
};
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

.btn--secondary {
  background-color: #6c757d;
  color: white;
}

.btn--secondary:hover:not(.btn--disabled) {
  background-color: #5a6268;
}

.btn--outline {
  background-color: transparent;
  border: 1px solid #42b983;
  color: #42b983;
}

.btn--outline:hover:not(.btn--disabled) {
  background-color: #42b983;
  color: white;
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
  variant?: "primary" | "secondary" | "outline";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
}
```

**src/components/Button/index.ts:**

```typescript
export { default } from "./Button.vue";
export type { ButtonProps } from "./types";
```

## 🚀 Viết Component bằng TSX/JSX (Khuyến nghị)

### Tại sao nên sử dụng TSX/JSX?

- ✅ **TypeScript support tốt hơn**: Type checking mạnh mẽ hơn
- ✅ **Tách biệt logic và template**: Dễ dàng quản lý code
- ✅ **Tái sử dụng code**: Dễ dàng extract logic
- ✅ **IDE support tốt hơn**: Auto-complete và refactoring tốt hơn
- ✅ **Phù hợp với library**: Nhiều library lớn sử dụng TSX (như inet-component)

### Cài đặt và Cấu hình

#### 1. Cài đặt dependencies

```bash
npm install -D @vitejs/plugin-vue-jsx
```

#### 2. Cấu hình Vite

**vite.config.ts:**

```typescript
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { resolve } from "path";

export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  // ... rest of config
});
```

#### 3. Cấu hình TypeScript

**tsconfig.json:**

```json
{
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "vue"
    // ... rest of config
  }
}
```

#### 4. Tạo useRender hook (tùy chọn)

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

### Component Button với TSX

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

### Component Input với TSX

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

### So sánh SFC (.vue) vs TSX (.tsx)

| Tính năng                | SFC (.vue) | TSX (.tsx) |
| ------------------------ | ---------- | ---------- |
| TypeScript support       | Tốt        | Rất tốt    |
| Tách biệt logic/template | Khó        | Dễ         |
| IDE support              | Tốt        | Rất tốt    |
| Code splitting           | Tốt        | Tốt        |
| Learning curve           | Dễ         | Trung bình |
| Phù hợp cho library      | Tốt        | Rất tốt    |

### Cấu trúc thư mục Component với TSX

```
src/components/
├── Button/
│   ├── Button.tsx          # Component chính
│   ├── Button.scss         # Styles
│   ├── useButton.ts        # Composable (nếu cần)
│   ├── types.ts            # TypeScript types
│   ├── Button.spec.ts      # Tests
│   ├── Doc.md              # Documentation
│   └── index.ts            # Export
```

### Best Practices cho TSX Components

1. **Sử dụng useRender hook**: Để render JSX/TSX
2. **Tách styles riêng**: Import SCSS/CSS file riêng
3. **Type-safe props**: Sử dụng TypeScript cho props
4. **Composables**: Extract logic vào composables
5. **Named exports**: Export types và composables riêng

## 📥 Props và TypeScript

### Định nghĩa Props với TypeScript

Có 2 cách chính:

**Cách 1: Sử dụng interface (khuyến nghị)**

```typescript
interface MyComponentProps {
  title: string;
  count?: number;
  items: string[];
}

const props = defineProps<MyComponentProps>();
```

**Cách 2: Sử dụng withDefaults**

```typescript
interface MyComponentProps {
  title: string;
  count?: number;
}

const props = withDefaults(defineProps<MyComponentProps>(), {
  count: 0,
});
```

### Ví dụ: Input Component

**src/components/Input/Input.vue:**

```vue
<template>
  <div class="input-wrapper">
    <label v-if="label" class="input-label">{{ label }}</label>
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="inputClass"
      @input="handleInput"
      @blur="handleBlur"
      @focus="handleFocus"
    />
    <span v-if="error" class="input-error">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { InputProps } from "./types";

const props = withDefaults(defineProps<InputProps>(), {
  type: "text",
  disabled: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
}>();

const inputClass = computed(() => [
  "input",
  {
    "input--error": !!props.error,
    "input--disabled": props.disabled,
  },
]);

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
</script>

<style scoped>
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
}

.input:focus {
  outline: none;
  border-color: #42b983;
}

.input--error {
  border-color: #f56565;
}

.input--disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.input-error {
  font-size: 12px;
  color: #f56565;
}
</style>
```

**src/components/Input/types.ts:**

```typescript
export interface InputProps {
  modelValue: string;
  type?: "text" | "email" | "password" | "number";
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}
```

## 📤 Events

### Định nghĩa Events với TypeScript

```typescript
// Cách 1: Sử dụng object syntax
const emit = defineEmits<{
  click: [event: MouseEvent];
  change: [value: string];
  update: [id: number, data: object];
}>();

// Cách 2: Sử dụng array syntax (đơn giản hơn nhưng ít type-safe)
const emit = defineEmits(["click", "change"]);
```

### Ví dụ: Emit events

```vue
<script setup lang="ts">
const emit = defineEmits<{
  click: [event: MouseEvent];
  submit: [data: { name: string; email: string }];
}>();

const handleClick = (event: MouseEvent) => {
  emit("click", event);
};

const handleSubmit = () => {
  emit("submit", {
    name: "John",
    email: "john@example.com",
  });
};
</script>
```

## 🎭 Slots

### Default Slot

```vue
<template>
  <div class="card">
    <slot></slot>
  </div>
</template>
```

**Sử dụng:**

```vue
<Card>
  <p>Nội dung trong card</p>
</Card>
```

### Named Slots

```vue
<template>
  <div class="card">
    <header class="card-header">
      <slot name="header"></slot>
    </header>
    <main class="card-body">
      <slot name="body"></slot>
    </main>
    <footer class="card-footer">
      <slot name="footer"></slot>
    </footer>
  </div>
</template>
```

**Sử dụng:**

```vue
<Card>
  <template #header>
    <h2>Tiêu đề</h2>
  </template>
  <template #body>
    <p>Nội dung</p>
  </template>
  <template #footer>
    <button>Action</button>
  </template>
</Card>
```

### Scoped Slots

```vue
<template>
  <ul class="list">
    <li v-for="item in items" :key="item.id">
      <slot :item="item" :index="index"></slot>
    </li>
  </ul>
</template>

<script setup lang="ts">
interface Item {
  id: number;
  name: string;
}

defineProps<{
  items: Item[];
}>();
</script>
```

**Sử dụng:**

```vue
<List :items="items">
  <template #default="{ item, index }">
    <div>{{ index }}: {{ item.name }}</div>
  </template>
</List>
```

## 🎨 Styling Component

### Scoped Styles

```vue
<style scoped>
/* Chỉ áp dụng cho component này */
.button {
  color: red;
}
</style>
```

### CSS Modules

```vue
<template>
  <button :class="$style.button">Click</button>
</template>

<style module>
.button {
  color: red;
}
</style>
```

### Global Styles (không khuyến nghị cho library)

```vue
<style>
/* Áp dụng global - tránh dùng trong library */
</style>
```

### CSS Variables (khuyến nghị)

```vue
<template>
  <button class="btn">Click</button>
</template>

<style scoped>
.btn {
  --btn-primary-color: #42b983;
  --btn-padding: 8px 16px;

  background-color: var(--btn-primary-color);
  padding: var(--btn-padding);
}
</style>
```

## 🔧 Composable Functions

Tạo reusable logic với composables:

**src/composables/useToggle.ts:**

```typescript
import { ref } from "vue";

export function useToggle(initialValue = false) {
  const value = ref(initialValue);

  const toggle = () => {
    value.value = !value.value;
  };

  const setTrue = () => {
    value.value = true;
  };

  const setFalse = () => {
    value.value = false;
  };

  return {
    value,
    toggle,
    setTrue,
    setFalse,
  };
}
```

**Sử dụng trong component:**

```vue
<script setup lang="ts">
import { useToggle } from "@/composables/useToggle";

const { value: isOpen, toggle } = useToggle();
</script>

<template>
  <button @click="toggle">
    {{ isOpen ? "Close" : "Open" }}
  </button>
</template>
```

## 📝 Ví dụ: Card Component hoàn chỉnh

**src/components/Card/Card.vue:**

```vue
<template>
  <div :class="cardClass">
    <div v-if="$slots.header" class="card-header">
      <slot name="header"></slot>
    </div>
    <div class="card-body">
      <slot></slot>
    </div>
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { CardProps } from "./types";

const props = withDefaults(defineProps<CardProps>(), {
  shadow: "medium",
  bordered: true,
});

const cardClass = computed(() => [
  "card",
  `card--shadow-${props.shadow}`,
  {
    "card--bordered": props.bordered,
  },
]);
</script>

<style scoped>
.card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.card--bordered {
  border: 1px solid #e0e0e0;
}

.card--shadow-small {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card--shadow-medium {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.card--shadow-large {
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.card-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.card-body {
  padding: 16px;
}

.card-footer {
  padding: 16px;
  border-top: 1px solid #e0e0e0;
}
</style>
```

**src/components/Card/types.ts:**

```typescript
export interface CardProps {
  shadow?: "small" | "medium" | "large";
  bordered?: boolean;
}
```

## 📋 Checklist

- [ ] Đã tạo component với Composition API
- [ ] Đã định nghĩa Props với TypeScript
- [ ] Đã định nghĩa Events với TypeScript
- [ ] Đã sử dụng Slots và Scoped Slots
- [ ] Đã styling component
- [ ] Đã tạo composable functions (nếu cần)

## 🎓 Bài tập thực hành

1. Tạo component Button với các variants: primary, secondary, outline
2. Tạo component Input với v-model support
3. Tạo component Card với header, body, footer slots
4. Tạo một composable function (ví dụ: useCounter, useToggle)

## 📚 Tài liệu tham khảo

- [Vue 3 Components](https://vuejs.org/guide/components/registration.html)
- [Props](https://vuejs.org/guide/components/props.html)
- [Events](https://vuejs.org/guide/components/events.html)
- [Slots](https://vuejs.org/guide/components/slots.html)
- [Composables](https://vuejs.org/guide/reusability/composables.html)

## ➡️ Bài tiếp theo

Sẵn sàng? Hãy chuyển sang [Bài 04: Cấu hình Build cho Thư viện](./04-cau-hinh-build.md)
