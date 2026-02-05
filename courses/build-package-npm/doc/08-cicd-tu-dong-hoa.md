# Bài 08: CI/CD và Tự động hóa

## 📖 Mục tiêu bài học

Sau bài học này, bạn sẽ:

- Biết cách thiết lập GitHub Actions
- Biết cách thiết lập GitLab CI
- Hiểu cách auto build và test
- Biết cách auto publish khi release
- Biết cách automated versioning
- Biết cách setup quality checks (linting, testing)

## 🎯 Lựa chọn CI/CD Platform

Có 2 lựa chọn chính cho CI/CD:

1. **GitHub Actions** - Miễn phí cho public repos, tích hợp tốt với GitHub
2. **GitLab CI** - Miễn phí cho private repos, tích hợp tốt với GitLab

> **Lưu ý:** Bài này sẽ hướng dẫn cả 2 cách. Bạn có thể chọn một trong hai tùy theo platform bạn sử dụng.

---

## 🚀 Phần 1: GitHub Actions

### Tạo Workflow

Tạo file `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Build
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist-${{ matrix.node-version }}
          path: dist/
          retention-days: 7
```

## 🧪 Testing

### Cài đặt Vitest

```bash
npm install -D vitest @vue/test-utils happy-dom
```

### Cấu hình Vitest

**vitest.config.ts:**

```typescript
import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: "happy-dom",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
```

### Ví dụ Test

**tests/components/Button.test.ts:**

```typescript
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Button from "@/components/Button/Button.vue";

describe("Button", () => {
  it("renders correctly", () => {
    const wrapper = mount(Button, {
      slots: {
        default: "Click me",
      },
    });

    expect(wrapper.text()).toBe("Click me");
  });

  it("emits click event", async () => {
    const wrapper = mount(Button);

    await wrapper.trigger("click");

    expect(wrapper.emitted("click")).toBeTruthy();
  });

  it("applies variant class", () => {
    const wrapper = mount(Button, {
      props: {
        variant: "primary",
      },
    });

    expect(wrapper.classes()).toContain("btn--primary");
  });

  it("disables button when disabled prop is true", () => {
    const wrapper = mount(Button, {
      props: {
        disabled: true,
      },
    });

    expect(wrapper.attributes("disabled")).toBeDefined();
  });
});
```

### package.json scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:run": "vitest run"
  }
}
```

### CI Workflow với Tests

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20.x"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:run

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

## 🔍 Linting

### Cài đặt ESLint

```bash
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-vue
```

### .eslintrc.cjs

```javascript
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:vue/vue3-recommended",
  ],
  parser: "vue-eslint-parser",
  parserOptions: {
    ecmaVersion: "latest",
    parser: "@typescript-eslint/parser",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  rules: {
    // Your rules here
  },
};
```

### package.json scripts

```json
{
  "scripts": {
    "lint": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts --fix",
    "lint:check": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts"
  }
}
```

### CI Workflow với Linting

```yaml
- name: Lint
  run: npm run lint:check
```

## 📦 Auto Publish

### Publish Workflow

Tạo file `.github/workflows/publish.yml`:

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
          node-version: "20.x"
          registry-url: "https://registry.npmjs.org"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Publish to npm
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Setup NPM Token

1. Tạo NPM Access Token:

   - Truy cập: https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - Generate new token (Automation type)
   - Copy token

2. Thêm vào GitHub Secrets:
   - Repository → Settings → Secrets and variables → Actions
   - New repository secret
   - Name: `NPM_TOKEN`
   - Value: Your NPM token

### Auto Version và Publish

**package.json:**

```json
{
  "scripts": {
    "release": "standard-version && git push --follow-tags"
  }
}
```

**Workflow:**

```yaml
name: Release

on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    if: "!contains(github.event.head_commit.message, 'chore(release)')"

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20.x"
          registry-url: "https://registry.npmjs.org"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Run tests
        run: npm run test:run

      - name: Release
        run: |
          npm run release
          npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## 🏷️ Automated Versioning

### Sử dụng standard-version

```bash
npm install -D standard-version
```

**package.json:**

```json
{
  "scripts": {
    "release": "standard-version",
    "release:minor": "standard-version --release-as minor",
    "release:major": "standard-version --release-as major",
    "release:alpha": "standard-version --prerelease alpha",
    "release:beta": "standard-version --prerelease beta"
  }
}
```

### .versionrc.json

```json
{
  "types": [
    { "type": "feat", "section": "Features" },
    { "type": "fix", "section": "Bug Fixes" },
    { "type": "chore", "section": "Chores" },
    { "type": "docs", "section": "Documentation" },
    { "type": "style", "section": "Styles" },
    { "type": "refactor", "section": "Refactoring" },
    { "type": "perf", "section": "Performance" },
    { "type": "test", "section": "Tests" }
  ]
}
```

### Conventional Commits

Sử dụng conventional commits để auto generate changelog:

```bash
# Feature
git commit -m "feat: add Button component"

# Bug fix
git commit -m "fix: fix Button click event"

# Breaking change
git commit -m "feat!: change Button API"
```

## 🔄 Complete CI/CD Workflow

### .github/workflows/ci.yml

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
          node-version: "20.x"
          cache: "npm"

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

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

### .github/workflows/publish.yml

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
          node-version: "20.x"
          registry-url: "https://registry.npmjs.org"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Publish to npm
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## 🚀 Phần 2: GitLab CI

### Tạo GitLab CI Configuration

Tạo file `.gitlab-ci.yml` trong root của project:

**`.gitlab-ci.yml`** (Theo chuẩn inet-component):

```yaml
variables:
  CURL_IMAGE: curlimages/curl:latest
  SUCCESS_MSG: "✅ Publish NPM thành công!%0A"
  FAILURE_MSG: "❌ Publish NPM thất bại!%0A"
  TELEGRAM_TEXT: |
    📂 Repo: <a href='${CI_PROJECT_URL}'>${CI_PROJECT_URL}</a>%0A
    📦 NPM Package: <a href='https://www.npmjs.com/package/${CI_PROJECT_NAME}'>${CI_PROJECT_NAME}</a>%0A
    ✍️ Commit: <a href='${CI_PROJECT_URL}/-/commit/${CI_COMMIT_SHA}'>${CI_COMMIT_SHORT_SHA}</a>%0A
    🚀 Pipeline: <a href='${CI_PIPELINE_URL}'>${CI_PIPELINE_URL}</a>

workflow:
  rules:
    - if: $CI_COMMIT_BRANCH == "main" && ($CI_COMMIT_MESSAGE =~ /release/ || $CI_COMMIT_MESSAGE =~ /Release/ || $CI_COMMIT_MESSAGE =~ /Merge/)
      variables:
        SHOULD_RELEASE: "true"
    - when: always

stages:
  - publish
  - notify

publish:
  image: node:22
  stage: publish
  script:
    - corepack enable
    - corepack prepare pnpm@latest --activate
    - pnpm --version
    - pnpm install
    - echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > .npmrc
    - pnpm run export-cpnt
    - pnpm run build-npm
  rules:
    - if: $SHOULD_RELEASE == "true"

# Notify success
notify_success:
  stage: notify
  image: $CURL_IMAGE
  rules:
    - if: $SHOULD_RELEASE == "true"
  script:
    - MESSAGE="${SUCCESS_MSG}%0A ${TELEGRAM_TEXT}"
    - >
      curl -s -X POST https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage
      -d chat_id=${TELEGRAM_CHAT_ID}
      -d parse_mode=HTML
      -d text="${MESSAGE}"
  needs:
    - job: publish
      artifacts: false
  when: on_success

# Notify failure
notify_failure:
  stage: notify
  image: $CURL_IMAGE
  rules:
    - if: $SHOULD_RELEASE == "true"
  script:
    - MESSAGE="${FAILURE_MSG}%0A ${TELEGRAM_TEXT}"
    - >
      curl -s -X POST https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage
      -d chat_id=${TELEGRAM_CHAT_ID}
      -d parse_mode=HTML
      -d text="${MESSAGE}"
  needs:
    - job: publish
      artifacts: false
  when: on_failure
```

### Giải thích GitLab CI Configuration

#### 1. **Variables**

```yaml
variables:
  CURL_IMAGE: curlimages/curl:latest
  SUCCESS_MSG: "✅ Publish NPM thành công!%0A"
  FAILURE_MSG: "❌ Publish NPM thất bại!%0A"
```

- Định nghĩa các biến dùng chung
- `CURL_IMAGE`: Image để gửi notification
- `SUCCESS_MSG` và `FAILURE_MSG`: Thông báo kết quả

#### 2. **Workflow Rules**

```yaml
workflow:
  rules:
    - if: $CI_COMMIT_BRANCH == "main" && ($CI_COMMIT_MESSAGE =~ /release/ || $CI_COMMIT_MESSAGE =~ /Release/ || $CI_COMMIT_MESSAGE =~ /Merge/)
      variables:
        SHOULD_RELEASE: "true"
    - when: always
```

- Chỉ chạy publish khi commit message chứa "release", "Release", hoặc "Merge" trên branch `main`
- Set biến `SHOULD_RELEASE: 'true'` để trigger publish job

#### 3. **Stages**

```yaml
stages:
  - publish
  - notify
```

- `publish`: Build và publish package
- `notify`: Gửi thông báo kết quả

#### 4. **Publish Job**

```yaml
publish:
  image: node:22
  stage: publish
  script:
    - corepack enable
    - corepack prepare pnpm@latest --activate
    - pnpm --version
    - pnpm install
    - echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > .npmrc
    - pnpm run export-cpnt
    - pnpm run build-npm
  rules:
    - if: $SHOULD_RELEASE == "true"
```

**Giải thích:**

- `image: node:22`: Sử dụng Node.js 22
- `corepack enable`: Enable corepack để quản lý pnpm
- `pnpm install`: Cài đặt dependencies
- `echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > .npmrc`: Tạo file .npmrc với NPM token
- `pnpm run export-cpnt`: Export components (nếu có script này)
- `pnpm run build-npm`: Build và publish package

#### 5. **Notification Jobs**

```yaml
notify_success:
  stage: notify
  image: $CURL_IMAGE
  script:
    - MESSAGE="${SUCCESS_MSG}%0A ${TELEGRAM_TEXT}"
    - >
      curl -s -X POST https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage
      -d chat_id=${TELEGRAM_CHAT_ID}
      -d parse_mode=HTML
      -d text="${MESSAGE}"
  needs:
    - job: publish
      artifacts: false
  when: on_success
```

- Gửi thông báo thành công qua Telegram
- Chạy sau khi `publish` job thành công

### Setup GitLab CI Variables

1. **Truy cập GitLab Project Settings:**

   - Project → Settings → CI/CD → Variables

2. **Thêm các variables:**

   - `NPM_TOKEN`: NPM Access Token

     - Type: Variable
     - Protected: ✅ (nếu muốn)
     - Masked: ✅ (khuyến nghị)

   - `TELEGRAM_BOT_TOKEN`: Telegram Bot Token (nếu dùng notification)

     - Type: Variable
     - Protected: ✅
     - Masked: ✅

   - `TELEGRAM_CHAT_ID`: Telegram Chat ID (nếu dùng notification)
     - Type: Variable
     - Protected: ✅
     - Masked: ❌

### GitLab CI với npm (thay vì pnpm)

Nếu bạn sử dụng npm thay vì pnpm:

```yaml
publish:
  image: node:22
  stage: publish
  script:
    - npm --version
    - npm ci
    - echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > .npmrc
    - npm run build
    - npm publish
  rules:
    - if: $SHOULD_RELEASE == "true"
```

### GitLab CI với yarn

Nếu bạn sử dụng yarn:

```yaml
publish:
  image: node:22
  stage: publish
  script:
    - yarn --version
    - yarn install --frozen-lockfile
    - echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > .npmrc
    - yarn build
    - npm publish
  rules:
    - if: $SHOULD_RELEASE == "true"
```

### GitLab CI với Testing và Linting

Thêm stage `test` và `lint`:

```yaml
stages:
  - test
  - lint
  - publish
  - notify

test:
  image: node:22
  stage: test
  script:
    - npm ci
    - npm run test:run
  rules:
    - if: $CI_COMMIT_BRANCH == "main" || $CI_COMMIT_BRANCH == "develop"

lint:
  image: node:22
  stage: lint
  script:
    - npm ci
    - npm run lint:check
    - npm run type-check
  rules:
    - if: $CI_COMMIT_BRANCH == "main" || $CI_COMMIT_BRANCH == "develop"
```

### So sánh GitHub Actions vs GitLab CI

| Tính năng            | GitHub Actions | GitLab CI                  |
| -------------------- | -------------- | -------------------------- |
| **Miễn phí**         | Public repos   | Public & Private repos     |
| **Minutes miễn phí** | 2,000/month    | 400/month                  |
| **Cấu hình**         | YAML files     | YAML file (.gitlab-ci.yml) |
| **Tích hợp**         | GitHub         | GitLab                     |
| **Notification**     | GitHub Actions | Telegram, Slack, Email     |
| **Artifacts**        | ✅             | ✅                         |
| **Caching**          | ✅             | ✅                         |

## 📊 Quality Checks

### Pre-commit Hooks (Husky)

```bash
npm install -D husky lint-staged
```

**package.json:**

```json
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{ts,vue}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

**Setup:**

```bash
npm run prepare
npx husky add .husky/pre-commit "npx lint-staged"
```

## 📋 Checklist

### GitHub Actions

- [ ] Đã setup GitHub Actions
- [ ] Đã tạo workflow CI
- [ ] Đã tạo workflow Publish
- [ ] Đã setup NPM_TOKEN secret
- [ ] Đã test CI/CD workflow

### GitLab CI

- [ ] Đã tạo file .gitlab-ci.yml
- [ ] Đã setup GitLab CI variables (NPM_TOKEN, etc.)
- [ ] Đã test publish workflow
- [ ] Đã setup notification (nếu cần)

### Chung

- [ ] Đã setup testing với Vitest
- [ ] Đã setup linting với ESLint
- [ ] Đã setup auto publish
- [ ] Đã setup automated versioning
- [ ] Đã setup quality checks

## 🎓 Bài tập thực hành

### GitHub Actions

1. Tạo GitHub Actions workflow cho CI
2. Tạo workflow auto publish
3. Setup NPM_TOKEN secret
4. Test toàn bộ CI/CD pipeline

### GitLab CI

1. Tạo file .gitlab-ci.yml
2. Setup GitLab CI variables
3. Test publish workflow
4. Setup notification (optional)

### Chung

1. Setup testing với Vitest
2. Setup linting với ESLint
3. Setup automated versioning
4. Test toàn bộ CI/CD pipeline

## 📚 Tài liệu tham khảo

### GitHub Actions

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [GitHub Actions Examples](https://github.com/actions/starter-workflows)

### GitLab CI

- [GitLab CI/CD Documentation](https://docs.gitlab.com/ee/ci/)
- [GitLab CI/CD Variables](https://docs.gitlab.com/ee/ci/variables/)
- [GitLab CI/CD Examples](https://docs.gitlab.com/ee/ci/examples/)

### Testing & Quality

- [Vitest](https://vitest.dev/)
- [ESLint](https://eslint.org/)
- [standard-version](https://github.com/conventional-changelog/standard-version)
- [Conventional Commits](https://www.conventionalcommits.org/)

### Ví dụ thực tế

- [inet-component .gitlab-ci.yml](https://gitlabs.inet.vn/ducnd/inet-component) - GitLab CI mẫu

## 🎉 Kết thúc khóa học

Chúc mừng! Bạn đã hoàn thành khóa học "Đóng gói Component Vue 3 thành Thư viện và Xuất bản lên Npm".

Bây giờ bạn có thể:

- ✅ Tạo và đóng gói Vue 3 components thành library
- ✅ Build và bundle package với Vite
- ✅ Publish package lên npm
- ✅ Tạo tài liệu và demos
- ✅ Setup CI/CD cho tự động hóa

Hãy bắt đầu tạo library của riêng bạn! 🚀
