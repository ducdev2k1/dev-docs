# 03 — Setup môi trường

## Yêu cầu hệ thống

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đáp ứng các yêu cầu sau:

### Phần mềm bắt buộc

- **Node.js**: >= 16.x (khuyến nghị 18.x hoặc 20.x LTS)
- **Package Manager**: pnpm (khuyến nghị), npm, hoặc yarn
- **Git**: Để clone projects và version control
- **Code Editor**: VS Code (khuyến nghị với extensions)

### Browser để test

- **Chrome** hoặc **Edge**: DevTools tốt nhất cho PWA
- **Firefox**: Test compatibility
- **Safari** (nếu có Mac): Test iOS PWA

## Cài đặt Node.js

### Windows

1. Download từ [nodejs.org](https://nodejs.org/)
2. Chọn bản LTS (Long Term Support)
3. Chạy installer và follow hướng dẫn
4. Verify installation:

```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

### macOS

**Option 1: Official installer**

```bash
# Download từ nodejs.org
```

**Option 2: Homebrew** (khuyến nghị)

```bash
brew install node@18
```

### Linux (Ubuntu/Debian)

```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version
```

## Cài đặt pnpm

pnpm nhanh hơn và tiết kiệm disk space hơn npm:

```bash
# Using npm
npm install -g pnpm

# Verify
pnpm --version
```

**Tại sao dùng pnpm?**

- Nhanh hơn npm/yarn 2-3 lần
- Tiết kiệm disk space (hard links)
- Strict dependency resolution
- Monorepo support tốt

## Setup VS Code

### Extensions khuyến nghị

Install các extensions sau để coding hiệu quả hơn:

1. **Vue Language Features (Volar)** - Vue 3 support
2. **TypeScript Vue Plugin (Volar)** - TypeScript trong Vue
3. **ESLint** - Linting JavaScript/TypeScript
4. **Prettier** - Code formatting
5. **PWA Tools** - PWA debugging
6. **Live Server** - Local development server

### VS Code Settings

Thêm vào `settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "volar.takeOverMode.enabled": true
}
```

## Tạo project Vue 3 + Vite

### Option 1: Sử dụng template có sẵn

```bash
# Create project với Vite
pnpm create vite my-pwa-app --template vue-ts

# Navigate vào project
cd my-pwa-app

# Install dependencies
pnpm install
```

### Option 2: Manual setup

```bash
# Create directory
mkdir my-pwa-app
cd my-pwa-app

# Initialize package.json
pnpm init

# Install Vue và Vite
pnpm add vue
pnpm add -D vite @vitejs/plugin-vue typescript vue-tsc
```

## Cài đặt PWA dependencies

```bash
# Install vite-plugin-pwa
pnpm add -D vite-plugin-pwa

# Install workbox (optional, nếu cần custom SW)
pnpm add -D workbox-window workbox-precaching workbox-routing workbox-strategies
```

## Cấu trúc project

Sau khi setup, project structure nên như sau:

```
my-pwa-app/
├── public/
│   ├── favicon.ico
│   ├── pwa-192x192.png      # PWA icon 192x192
│   ├── pwa-512x512.png      # PWA icon 512x512
│   └── robots.txt
├── src/
│   ├── assets/
│   ├── components/
│   ├── App.vue
│   └── main.ts
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts           # Vite + PWA config
└── README.md
```

## Verify setup

### 1. Run dev server

```bash
pnpm dev
```

Mở browser tại `http://localhost:5173` (hoặc port khác nếu 5173 đã dùng)

### 2. Check build

```bash
pnpm build
```

Nếu build thành công, bạn sẽ thấy folder `dist/` được tạo ra.

### 3. Preview production build

```bash
pnpm preview
```

## Troubleshooting

### Issue: Node version quá cũ

**Triệu chứng**:

```
Error: The engine "node" is incompatible with this module
```

**Giải pháp**:

```bash
# Update Node.js lên version mới nhất LTS
# Hoặc sử dụng nvm để quản lý multiple Node versions
```

### Issue: pnpm command not found

**Triệu chứng**:

```
bash: pnpm: command not found
```

**Giải pháp**:

```bash
npm install -g pnpm
# Hoặc restart terminal sau khi install
```

### Issue: Port 5173 already in use

**Triệu chứng**:

```
Port 5173 is in use, trying another one...
```

**Giải pháp**:

- Đóng process đang dùng port 5173
- Hoặc Vite sẽ tự động chọn port khác

### Issue: HTTPS required for PWA

**Triệu chứng**: Service Worker không register được

**Giải pháp**:

- Development: localhost tự động được coi là secure
- Production: Phải deploy lên HTTPS (Vercel, Netlify tự động có HTTPS)

## Environment variables

Tạo file `.env` cho local development:

```env
# .env
VITE_APP_TITLE=My PWA App
VITE_API_URL=http://localhost:3000
```

Sử dụng trong code:

```typescript
const appTitle = import.meta.env.VITE_APP_TITLE;
```

## Git setup

### Initialize Git

```bash
git init
git add .
git commit -m "Initial commit"
```

### .gitignore

Đảm bảo `.gitignore` có:

```
# Dependencies
node_modules/

# Build output
dist/
dist-ssr/

# Environment
.env
.env.local
.env.*.local

# Editor
.vscode/*
!.vscode/extensions.json
.idea/
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# OS
.DS_Store
Thumbs.db
```

## Bước tiếp theo

Setup xong rồi! Giờ chuyển sang [04 - Vite Config & Manifest](/vite-config) để cấu hình PWA!

---

> 💡 **Pro tip**: Tạo một script trong `package.json` để check environment:
>
> ```json
> "scripts": {
>   "check": "node --version && pnpm --version"
> }
> ```
