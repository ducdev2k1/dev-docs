# Bài 06: Xuất bản lên Npm

## 📖 Mục tiêu bài học

Sau bài học này, bạn sẽ:

- Biết cách đăng ký và cấu hình tài khoản npm
- Hiểu về semantic versioning
- Biết cách publish package lên npm public
- Biết cách publish package lên npm private (GitHub Packages, etc.)
- Biết cách update và maintain package

## 🔐 Đăng ký Tài khoản Npm

### 1. Tạo tài khoản

1. Truy cập: https://www.npmjs.com/signup
2. Điền thông tin:
   - Username
   - Email
   - Password
3. Verify email
4. Đăng nhập

### 2. Đăng nhập từ CLI

```bash
npm login
```

Nhập:

- Username
- Password
- Email
- OTP (nếu bật 2FA)

### 3. Kiểm tra đăng nhập

```bash
npm whoami
```

### 4. Cấu hình npm

```bash
# Set registry (mặc định là public npm)
npm config set registry https://registry.npmjs.org/

# Set scope (nếu dùng scoped package)
npm config set @yourusername:registry https://registry.npmjs.org/
```

## 📝 Semantic Versioning

### Version Format

```
MAJOR.MINOR.PATCH
```

- **MAJOR**: Breaking changes (1.0.0 → 2.0.0)
- **MINOR**: New features, backward compatible (1.0.0 → 1.1.0)
- **PATCH**: Bug fixes, backward compatible (1.0.0 → 1.0.1)

### Pre-release Versions

- **alpha**: 1.0.0-alpha.1
- **beta**: 1.0.0-beta.1
- **rc**: 1.0.0-rc.1

### Update Version

```bash
# Patch (1.0.0 → 1.0.1)
npm version patch

# Minor (1.0.0 → 1.1.0)
npm version minor

# Major (1.0.0 → 2.0.0)
npm version major

# Pre-release
npm version prerelease --preid=alpha
```

### Manual Version

Sửa trực tiếp trong `package.json`:

```json
{
  "version": "1.0.0"
}
```

## 🚀 Publish lên Npm Public

### 1. Kiểm tra package name

```bash
npm view my-vue-library
```

Nếu package name đã tồn tại, bạn cần:

- Đổi tên package
- Hoặc sử dụng scoped package: `@yourusername/my-vue-library`

### 2. Scoped Package (khuyến nghị)

**package.json:**

```json
{
  "name": "@yourusername/my-vue-library",
  "publishConfig": {
    "access": "public"
  }
}
```

### 3. Build package

```bash
npm run build
```

### 4. Kiểm tra files sẽ publish

```bash
npm pack --dry-run
```

Hoặc xem file `.tgz`:

```bash
npm pack
tar -tzf my-vue-library-0.1.0.tgz
```

### 5. Publish

```bash
# Publish lần đầu
npm publish

# Publish scoped package (public)
npm publish --access public

# Publish với tag
npm publish --tag beta
```

### 6. Verify publish

```bash
# Xem package trên npm
npm view @yourusername/my-vue-library

# Hoặc truy cập
# https://www.npmjs.com/package/@yourusername/my-vue-library
```

## 🔒 Publish lên Npm Private

### Option 1: Npm Private Registry (trả phí)

```bash
npm publish --access restricted
```

### Option 2: GitHub Packages

#### 1. Cấu hình package.json

```json
{
  "name": "@yourusername/my-vue-library",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/my-vue-library.git"
  }
}
```

#### 2. Tạo GitHub Personal Access Token

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token với quyền `write:packages`, `read:packages`
3. Copy token

#### 3. Đăng nhập GitHub Packages

```bash
npm login --registry=https://npm.pkg.github.com
```

- Username: GitHub username
- Password: Personal Access Token
- Email: GitHub email

#### 4. Publish

```bash
npm publish
```

#### 5. Install từ GitHub Packages

```bash
npm install @yourusername/my-vue-library --registry=https://npm.pkg.github.com
```

Hoặc tạo `.npmrc`:

```
@yourusername:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_TOKEN
```

### Option 3: Private Npm Registry (Verdaccio, etc.)

```bash
npm config set registry http://your-registry-url
npm publish
```

## 🔄 Update Package

### 1. Update version

```bash
npm version patch  # hoặc minor, major
```

Lệnh này sẽ:

- Update version trong package.json
- Tạo git tag
- Commit changes

### 2. Push changes

```bash
git push
git push --tags
```

### 3. Publish new version

```bash
npm publish
```

### 4. Publish với tag

```bash
# Latest (mặc định)
npm publish --tag latest

# Beta
npm publish --tag beta

# Alpha
npm publish --tag alpha
```

## 📋 .npmignore

Tạo file `.npmignore` để exclude files không cần publish:

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

# Documentation (optional - có thể include)
# docs/

# Coverage
coverage/
.nyc_output/

# Misc
node_modules/
dist/stats.html
```

## 🔍 Kiểm tra trước khi Publish

### Checklist

- [ ] Package name chưa tồn tại (hoặc bạn là owner)
- [ ] Version đã được update
- [ ] Build thành công
- [ ] Tests pass (nếu có)
- [ ] README.md đầy đủ
- [ ] LICENSE file có
- [ ] .npmignore đã cấu hình
- [ ] package.json đầy đủ thông tin
- [ ] Exports và entry points đúng

### Dry run

```bash
# Xem files sẽ publish
npm pack --dry-run

# Test install local
npm pack
npm install ./my-vue-library-0.1.0.tgz
```

## 🎯 Best Practices

### 1. Sử dụng Scoped Packages

```json
{
  "name": "@yourusername/my-vue-library"
}
```

### 2. Luôn build trước khi publish

```json
{
  "scripts": {
    "prepublishOnly": "npm run clean && npm run build"
  }
}
```

### 3. Sử dụng Semantic Versioning

- Patch: Bug fixes
- Minor: New features (backward compatible)
- Major: Breaking changes

### 4. Viết CHANGELOG.md

```markdown
# Changelog

## [1.1.0] - 2024-01-15

### Added

- New Button component
- Input component with validation

### Changed

- Updated styling for Card component

### Fixed

- Fixed Button click event issue

## [1.0.0] - 2024-01-01

### Added

- Initial release
- Button component
- Input component
```

### 5. Tag releases trên Git

```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

## 🐛 Troubleshooting

### Lỗi: Package name đã tồn tại

**Giải pháp:**

- Đổi tên package
- Sử dụng scoped package: `@yourusername/package-name`

### Lỗi: Unauthorized

**Giải pháp:**

```bash
npm login
npm whoami  # Kiểm tra đã login chưa
```

### Lỗi: Package version đã tồn tại

**Giải pháp:**

```bash
npm version patch  # Update version
npm publish
```

### Lỗi: Files quá lớn

**Giải pháp:**

- Kiểm tra .npmignore
- Loại bỏ files không cần thiết
- Optimize bundle size

## 📋 Checklist

- [ ] Đã đăng ký tài khoản npm
- [ ] Đã đăng nhập từ CLI
- [ ] Đã cấu hình package.json
- [ ] Đã build package
- [ ] Đã kiểm tra files sẽ publish
- [ ] Đã publish thành công
- [ ] Đã test install package

## 🎓 Bài tập thực hành

1. Tạo tài khoản npm (nếu chưa có)
2. Đăng nhập từ CLI
3. Cấu hình package.json với scoped name
4. Build và publish package
5. Test install package từ npm
6. Update version và publish lại

## 📚 Tài liệu tham khảo

- [npm Documentation](https://docs.npmjs.com/)
- [Semantic Versioning](https://semver.org/)
- [GitHub Packages](https://docs.github.com/en/packages)
- [npm publish](https://docs.npmjs.com/cli/v9/commands/npm-publish)

## ➡️ Bài tiếp theo

Sẵn sàng? Hãy chuyển sang [Bài 07: Tài liệu và Demo](./07-tai-lieu-demo)

Sau đó, bạn có thể chọn:
- [Bài 08a: CI/CD với GitHub Actions](./08a-github-actions) - Nếu bạn sử dụng GitHub
- [Bài 08b: CI/CD với GitLab CI](./08b-gitlab-ci) - Nếu bạn sử dụng GitLab
