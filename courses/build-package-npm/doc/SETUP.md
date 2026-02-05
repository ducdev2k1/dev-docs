# 🚀 Hướng dẫn Cài đặt và Thiết lập

## Yêu cầu hệ thống

- **Node.js**: v16.0.0 trở lên (khuyến nghị v18+)
- **npm**: v7.0.0 trở lên (hoặc yarn v1.22+, pnpm v7+)
- **Git**: Để quản lý version control
- **Code Editor**: VS Code (khuyến nghị) hoặc bất kỳ editor nào hỗ trợ TypeScript

## Bước 1: Cài đặt Node.js

### Windows/Mac

1. Truy cập: https://nodejs.org/
2. Tải và cài đặt **LTS version**
3. Verify installation:

```bash
node --version
npm --version
```

### Linux

Sử dụng nvm (khuyến nghị):

```bash
# Cài đặt nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell
source ~/.bashrc

# Cài đặt Node.js LTS
nvm install --lts
nvm use --lts

# Verify
node --version
npm --version
```

## Bước 2: Tạo tài khoản npm

1. Truy cập: https://www.npmjs.com/signup
2. Điền thông tin và tạo tài khoản
3. Verify email
4. Đăng nhập từ CLI:

```bash
npm login
```

## Bước 3: Tạo tài khoản GitHub (cho CI/CD)

1. Truy cập: https://github.com/signup
2. Tạo tài khoản
3. Verify email

## Bước 4: Cài đặt Code Editor

### VS Code (khuyến nghị)

1. Tải VS Code: https://code.visualstudio.com/
2. Cài đặt extensions:
   - **Volar** (Vue 3 support)
   - **TypeScript Vue Plugin (Volar)**
   - **ESLint**
   - **Prettier**

## Bước 5: Tạo Project

### Sử dụng Vite

```bash
npm create vue@latest my-vue-library
```

Hoặc:

```bash
npm create vite@latest my-vue-library -- --template vue-ts
```

### Cấu trúc thư mục

```bash
my-vue-library/
├── src/
│   ├── components/
│   ├── composables/
│   ├── utils/
│   ├── types/
│   └── index.ts
├── dist/
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## Bước 6: Cài đặt Dependencies

```bash
cd my-vue-library
npm install
```

### Dependencies cần thiết

```bash
# Runtime
npm install vue@^3.3.0

# Development
npm install -D \
  typescript@^5.0.0 \
  vite@^4.4.0 \
  @vitejs/plugin-vue@^4.3.0 \
  vue-tsc@^1.8.0 \
  @types/node@^20.0.0
```

## Bước 7: Verify Setup

```bash
# Type check
npm run type-check

# Build
npm run build

# Dev server (nếu có)
npm run dev
```

## Troubleshooting

### Lỗi: Command not found

**Giải pháp:**

- Kiểm tra Node.js đã được cài đặt chưa
- Thêm Node.js vào PATH
- Restart terminal

### Lỗi: Permission denied

**Giải pháp (Linux/Mac):**

```bash
sudo npm install -g npm
```

Hoặc sử dụng nvm để tránh cần sudo.

### Lỗi: Version conflict

**Giải pháp:**

```bash
rm -rf node_modules package-lock.json
npm install
```

## Tiếp theo

Sau khi hoàn thành setup, hãy bắt đầu với:

- [Bài 01: Giới thiệu](./lessons/01-gioi-thieu.md)
- [Bài 02: Thiết lập Môi trường Phát triển](./lessons/02-thiet-lap-moi-truong.md)

## Tài liệu tham khảo

- [Node.js Installation](https://nodejs.org/)
- [npm Documentation](https://docs.npmjs.com/)
- [Vite Getting Started](https://vitejs.dev/guide/)
- [Vue 3 Documentation](https://vuejs.org/)
