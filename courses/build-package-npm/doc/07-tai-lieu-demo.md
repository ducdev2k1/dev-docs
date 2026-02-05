# Bài 07: Tài liệu và Demo

## 📖 Mục tiêu bài học

Sau bài học này, bạn sẽ:

- Biết cách tạo README.md chi tiết và chuyên nghiệp
- Biết cách sử dụng Storybook cho component demos
- Hiểu cách viết JSDoc và TypeScript types
- Biết cách tạo ví dụ sử dụng
- Biết cách quản lý Changelog và versioning

## 📝 Tạo README.md Chuyên nghiệp

### Cấu trúc README.md

```markdown
# My Vue Library

[![npm version](https://img.shields.io/npm/v/@yourusername/my-vue-library.svg)](https://www.npmjs.com/package/@yourusername/my-vue-library)
[![npm downloads](https://img.shields.io/npm/dm/@yourusername/my-vue-library.svg)](https://www.npmjs.com/package/@yourusername/my-vue-library)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> A Vue 3 component library for building modern web applications

## ✨ Features

- 🎨 Beautiful and customizable components
- 📦 Tree-shakeable (ESM support)
- 🔒 TypeScript support
- 🎯 Fully typed with TypeScript
- 📱 Responsive design
- ♿ Accessible components
- 🚀 Zero dependencies (except Vue)

## 📦 Installation

\`\`\`bash
npm install @yourusername/my-vue-library

# hoặc

yarn add @yourusername/my-vue-library

# hoặc

pnpm add @yourusername/my-vue-library
\`\`\`

## 🚀 Quick Start

\`\`\`vue
<template>
<Button variant="primary" @click="handleClick">
Click me
</Button>
</template>

<script setup>
import { Button } from '@yourusername/my-vue-library'
import '@yourusername/my-vue-library/style.css'

const handleClick = () => {
  console.log('Button clicked!')
}
</script>

\`\`\`

## 📚 Documentation

### Components

#### Button

A versatile button component with multiple variants.

**Props:**

| Prop     | Type                                    | Default     | Description          |
| -------- | --------------------------------------- | ----------- | -------------------- |
| variant  | `'primary' \| 'secondary' \| 'outline'` | `'primary'` | Button style variant |
| size     | `'small' \| 'medium' \| 'large'`        | `'medium'`  | Button size          |
| disabled | `boolean`                               | `false`     | Disable button       |

**Events:**

| Event | Payload      | Description                    |
| ----- | ------------ | ------------------------------ |
| click | `MouseEvent` | Emitted when button is clicked |

**Example:**

\`\`\`vue
<template>
<Button variant="primary" size="large" @click="handleClick">
Primary Button
</Button>
<Button variant="secondary" @click="handleClick">
Secondary Button
</Button>
<Button variant="outline" @click="handleClick">
Outline Button
</Button>
</template>

<script setup>
import { Button } from '@yourusername/my-vue-library'

const handleClick = () => {
  console.log('Clicked!')
}
</script>

\`\`\`

#### Input

A form input component with validation support.

**Props:**

| Prop        | Type                                          | Default     | Description           |
| ----------- | --------------------------------------------- | ----------- | --------------------- |
| modelValue  | `string`                                      | `''`        | Input value (v-model) |
| type        | `'text' \| 'email' \| 'password' \| 'number'` | `'text'`    | Input type            |
| label       | `string`                                      | `undefined` | Input label           |
| placeholder | `string`                                      | `undefined` | Input placeholder     |
| error       | `string`                                      | `undefined` | Error message         |
| disabled    | `boolean`                                     | `false`     | Disable input         |

**Example:**

\`\`\`vue
<template>
<Input
    v-model="email"
    type="email"
    label="Email"
    placeholder="Enter your email"
    :error="emailError"
  />
</template>

<script setup>
import { ref } from 'vue'
import { Input } from '@yourusername/my-vue-library'

const email = ref('')
const emailError = ref('')
</script>

\`\`\`

## 🎨 Styling

### CSS Variables

You can customize components using CSS variables:

\`\`\`css
:root {
--btn-primary-color: #42b983;
--btn-padding: 8px 16px;
--input-border-color: #ddd;
}
\`\`\`

### Import Styles

\`\`\`javascript
import '@yourusername/my-vue-library/style.css'
\`\`\`

## 🔧 TypeScript

Full TypeScript support with type definitions:

\`\`\`typescript
import { Button, type ButtonProps } from '@yourusername/my-vue-library'

const props: ButtonProps = {
variant: 'primary',
size: 'medium',
}
\`\`\`

## 📖 Examples

See [examples](./examples) folder for more examples.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) first.

## 📄 License

MIT © [Your Name](https://github.com/yourusername)

## 🙏 Acknowledgments

- [Vue.js](https://vuejs.org/)
- [Vite](https://vitejs.dev/)
```

## 📚 Storybook

### Cài đặt Storybook

```bash
npx storybook@latest init
```

Chọn:

- Framework: Vue 3
- Builder: Vite
- TypeScript: Yes

### Cấu trúc Storybook

```
.storybook/
├── main.ts
└── preview.ts

stories/
├── Button.stories.ts
└── Input.stories.ts
```

### Ví dụ: Button Story

**stories/Button.stories.ts:**

```typescript
import type { Meta, StoryObj } from "@storybook/vue3";
import Button from "../src/components/Button/Button.vue";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "outline"],
    },
    size: {
      control: "select",
      options: ["small", "medium", "large"],
    },
    disabled: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Primary Button",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary Button",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Outline Button",
  },
};

export const Small: Story = {
  args: {
    size: "small",
    children: "Small Button",
  },
};

export const Large: Story = {
  args: {
    size: "large",
    children: "Large Button",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: "Disabled Button",
  },
};
```

### Chạy Storybook

```bash
npm run storybook
```

### Build Storybook

```bash
npm run build-storybook
```

### package.json scripts

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

## 📝 JSDoc và TypeScript Types

### JSDoc Comments

**src/components/Button/Button.vue:**

````vue
<script setup lang="ts">
/**
 * Button component with multiple variants
 *
 * @example
 * ```vue
 * <Button variant="primary" @click="handleClick">
 *   Click me
 * </Button>
 * ```
 */
import type { ButtonProps } from "./types";

const props = defineProps<ButtonProps>();
</script>
````

### TypeScript Types

**src/components/Button/types.ts:**

```typescript
/**
 * Button component props
 */
export interface ButtonProps {
  /**
   * Button style variant
   * @default 'primary'
   */
  variant?: "primary" | "secondary" | "outline";

  /**
   * Button size
   * @default 'medium'
   */
  size?: "small" | "medium" | "large";

  /**
   * Disable button
   * @default false
   */
  disabled?: boolean;
}
```

### Composable Documentation

**src/composables/useToggle.ts:**

````typescript
/**
 * Toggle boolean value
 *
 * @param initialValue - Initial value
 * @returns Object with value and toggle functions
 *
 * @example
 * ```typescript
 * const { value, toggle } = useToggle(false)
 * toggle() // value becomes true
 * ```
 */
export function useToggle(initialValue = false) {
  const value = ref(initialValue);

  const toggle = () => {
    value.value = !value.value;
  };

  return {
    value,
    toggle,
  };
}
````

## 🎯 Ví dụ Sử dụng

### Tạo thư mục examples

```
examples/
├── basic/
│   └── App.vue
├── advanced/
│   └── App.vue
└── vite.config.ts
```

### Ví dụ Basic

**examples/basic/App.vue:**

```vue
<template>
  <div class="app">
    <h1>Basic Example</h1>

    <div class="section">
      <h2>Buttons</h2>
      <Button variant="primary" @click="handleClick"> Primary </Button>
      <Button variant="secondary" @click="handleClick"> Secondary </Button>
      <Button variant="outline" @click="handleClick"> Outline </Button>
    </div>

    <div class="section">
      <h2>Input</h2>
      <Input
        v-model="email"
        type="email"
        label="Email"
        placeholder="Enter your email"
      />
      <p>Value: {{ email }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { Button, Input } from "@yourusername/my-vue-library";
import "@yourusername/my-vue-library/style.css";

const email = ref("");

const handleClick = () => {
  console.log("Button clicked!");
};
</script>

<style scoped>
.app {
  padding: 20px;
}

.section {
  margin-bottom: 30px;
}

.section h2 {
  margin-bottom: 10px;
}
</style>
```

### Cấu hình Vite cho examples

**examples/vite.config.ts:**

```typescript
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@yourusername/my-vue-library": resolve(__dirname, "../src"),
    },
  },
});
```

## 📋 Changelog

### CHANGELOG.md

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2024-01-15

### Added

- New Card component
- Input component with validation
- useToggle composable

### Changed

- Updated Button styling
- Improved TypeScript types

### Fixed

- Fixed Button click event issue
- Fixed Input v-model binding

## [1.0.0] - 2024-01-01

### Added

- Initial release
- Button component
- Input component
- TypeScript support
- Storybook documentation
```

### Tự động tạo Changelog

Sử dụng `standard-version`:

```bash
npm install -D standard-version
```

**package.json:**

```json
{
  "scripts": {
    "release": "standard-version",
    "release:minor": "standard-version --release-as minor",
    "release:major": "standard-version --release-as major"
  }
}
```

```bash
npm run release
```

## 📊 Badges

Thêm badges vào README:

```markdown
[![npm version](https://img.shields.io/npm/v/@yourusername/my-vue-library.svg)](https://www.npmjs.com/package/@yourusername/my-vue-library)
[![npm downloads](https://img.shields.io/npm/dm/@yourusername/my-vue-library.svg)](https://www.npmjs.com/package/@yourusername/my-vue-library)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vue 3](https://img.shields.io/badge/Vue-3-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org/)
```

## 📋 Checklist

- [ ] Đã tạo README.md chi tiết
- [ ] Đã setup Storybook (nếu cần)
- [ ] Đã viết JSDoc comments
- [ ] Đã tạo TypeScript types đầy đủ
- [ ] Đã tạo ví dụ sử dụng
- [ ] Đã tạo CHANGELOG.md
- [ ] Đã thêm badges

## 🎓 Bài tập thực hành

1. Tạo README.md chuyên nghiệp cho library của bạn
2. Setup Storybook và tạo stories cho components
3. Viết JSDoc comments cho tất cả components
4. Tạo ví dụ sử dụng
5. Tạo CHANGELOG.md và maintain nó

## 📚 Tài liệu tham khảo

- [Storybook Documentation](https://storybook.js.org/)
- [JSDoc](https://jsdoc.app/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Shields.io](https://shields.io/)

## ➡️ Bài tiếp theo

Sẵn sàng? Hãy chọn một trong hai:
- [Bài 08a: CI/CD với GitHub Actions](./08a-github-actions.md) - Nếu bạn sử dụng GitHub
- [Bài 08b: CI/CD với GitLab CI](./08b-gitlab-ci.md) - Nếu bạn sử dụng GitLab
