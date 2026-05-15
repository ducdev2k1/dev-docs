# Bài 08b: CI/CD với GitLab CI

## 📖 Mục tiêu bài học

Sau bài học này, bạn sẽ:

- Biết cách thiết lập GitLab CI
- Hiểu cách auto build và publish package
- Biết cách setup notification qua Telegram
- Biết cách cấu hình GitLab CI variables
- Hiểu cách sử dụng GitLab CI theo chuẩn inet-component

> **Lưu ý:** Bài này hướng dẫn sử dụng GitLab CI. Nếu bạn sử dụng GitHub, hãy xem [Bài 08a: CI/CD với GitHub Actions](./08a-github-actions).

## 🚀 GitLab CI

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

## 📝 Giải thích GitLab CI Configuration

### 1. **Variables**

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
```

- Định nghĩa các biến dùng chung
- `CURL_IMAGE`: Image để gửi notification
- `SUCCESS_MSG` và `FAILURE_MSG`: Thông báo kết quả
- `TELEGRAM_TEXT`: Template thông báo Telegram với thông tin repo, package, commit, pipeline

### 2. **Workflow Rules**

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
- `when: always`: Luôn chạy pipeline (nhưng chỉ publish khi có SHOULD_RELEASE)

### 3. **Stages**

```yaml
stages:
  - publish
  - notify
```

- `publish`: Build và publish package
- `notify`: Gửi thông báo kết quả

### 4. **Publish Job**

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

**Giải thích từng bước:**

- `image: node:22`: Sử dụng Node.js 22
- `corepack enable`: Enable corepack để quản lý pnpm
- `corepack prepare pnpm@latest --activate`: Cài đặt và kích hoạt pnpm
- `pnpm install`: Cài đặt dependencies
- `echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > .npmrc`: Tạo file .npmrc với NPM token
- `pnpm run export-cpnt`: Export components (nếu có script này)
- `pnpm run build-npm`: Build và publish package

### 5. **Notification Jobs**

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
- `needs`: Phụ thuộc vào job `publish`
- `when: on_success`: Chỉ chạy khi publish thành công

## 🔧 Setup GitLab CI Variables

### 1. Truy cập GitLab Project Settings

- Project → Settings → CI/CD → Variables
- Expand "Variables" section

### 2. Thêm các variables

#### NPM_TOKEN (Bắt buộc)

- **Key:** `NPM_TOKEN`
- **Value:** NPM Access Token (tạo tại https://www.npmjs.com/settings/YOUR_USERNAME/tokens)
- **Type:** Variable
- **Protected:** ✅ (nếu muốn chỉ chạy trên protected branches)
- **Masked:** ✅ (khuyến nghị - ẩn giá trị trong logs)
- **Expand variable reference:** ❌

#### TELEGRAM_BOT_TOKEN (Nếu dùng notification)

- **Key:** `TELEGRAM_BOT_TOKEN`
- **Value:** Telegram Bot Token (tạo từ @BotFather)
- **Type:** Variable
- **Protected:** ✅
- **Masked:** ✅
- **Expand variable reference:** ❌

#### TELEGRAM_CHAT_ID (Nếu dùng notification)

- **Key:** `TELEGRAM_CHAT_ID`
- **Value:** Telegram Chat ID (số chat ID của bạn)
- **Type:** Variable
- **Protected:** ✅
- **Masked:** ❌ (có thể để unmasked vì không phải secret)
- **Expand variable reference:** ❌

## 🔄 GitLab CI với npm (thay vì pnpm)

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

## 🔄 GitLab CI với yarn

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

## 🧪 GitLab CI với Testing và Linting

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

## 📦 GitLab CI với Monorepo

Nếu project có cấu trúc monorepo (ví dụ: có thư mục `package/`):

```yaml
publish:
  image: node:22
  stage: publish
  script:
    - corepack enable
    - corepack prepare pnpm@latest --activate
    - cd package
    - pnpm install
    - echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > .npmrc
    - pnpm run build
    - pnpm publish --access public --no-git-checks
  rules:
    - if: $SHOULD_RELEASE == "true"
```

## 🎯 Best Practices

### 1. **Sử dụng rules để kiểm soát khi nào chạy**

```yaml
rules:
  - if: $SHOULD_RELEASE == "true"
```

### 2. **Sử dụng needs để tối ưu pipeline**

```yaml
needs:
  - job: publish
    artifacts: false
```

### 3. **Sử dụng when để xử lý kết quả**

```yaml
when: on_success  # Chỉ chạy khi thành công
when: on_failure  # Chỉ chạy khi thất bại
when: always      # Luôn chạy
```

### 4. **Sử dụng variables để tái sử dụng**

```yaml
variables:
  NODE_VERSION: "22"
  IMAGE: "node:${NODE_VERSION}"
```

## 📋 Checklist

- [ ] Đã tạo file .gitlab-ci.yml
- [ ] Đã setup GitLab CI variables (NPM_TOKEN, etc.)
- [ ] Đã test publish workflow
- [ ] Đã setup notification (nếu cần)
- [ ] Đã test với commit message chứa "release"
- [ ] Đã verify package được publish lên npm

## 🎓 Bài tập thực hành

1. Tạo file .gitlab-ci.yml theo chuẩn inet-component
2. Setup GitLab CI variables (NPM_TOKEN, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID)
3. Test publish workflow với commit message chứa "release"
4. Verify package được publish lên npm
5. Kiểm tra notification qua Telegram (nếu có)

## 📚 Tài liệu tham khảo

- [GitLab CI/CD Documentation](https://docs.gitlab.com/ee/ci/)
- [GitLab CI/CD Variables](https://docs.gitlab.com/ee/ci/variables/)
- [GitLab CI/CD Examples](https://docs.gitlab.com/ee/ci/examples/)
- [GitLab CI/CD YAML Reference](https://docs.gitlab.com/ee/ci/yaml/)

### Ví dụ thực tế

- [inet-component .gitlab-ci.yml](https://gitlabs.inet.vn/ducnd/inet-component) - GitLab CI mẫu theo chuẩn inet-component

## ➡️ Bài tiếp theo

Nếu bạn sử dụng GitHub, hãy xem [Bài 08a: CI/CD với GitHub Actions](./08a-github-actions).

Hoặc bạn đã hoàn thành khóa học! 🎉
