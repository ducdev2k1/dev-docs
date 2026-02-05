# 📦 Đóng gói Component Vue 3 thành Thư viện và Xuất bản lên Npm

## 🎯 Mục tiêu khóa học

Sau khi hoàn thành khóa học, bạn sẽ:

- ✅ Biết cách đóng gói 1 hoặc nhiều component Vue thành thư viện tái sử dụng
- ✅ Biết cách build, bundle, và publish package lên npm registry (public hoặc private)
- ✅ Hiểu cách tạo tài liệu, demos, auto build, và CI/CD publish
- ✅ Có thể tự tạo hệ sinh thái component UI riêng của bạn

## 📚 Nội dung khóa học

### [Bài 01: Giới thiệu và Tổng quan](./lessons/01-gioi-thieu.md)

- Tổng quan về Vue 3 và Composition API
- Lợi ích của việc tạo thư viện component
- Các công cụ và công nghệ sẽ sử dụng
- Ví dụ thực tế: inet-component

### [Bài 02: Thiết lập Môi trường Phát triển](./lessons/02-thiet-lap-moi-truong.md)

- Cài đặt Node.js và npm
- Tạo dự án Vue 3 với Vite
- Cấu trúc thư mục cho thư viện
- Cài đặt các dependencies cần thiết

### [Bài 03: Xây dựng Component Vue 3](./lessons/03-xay-dung-component.md)

- Tạo component cơ bản với Composition API
- **Viết component bằng TSX/JSX (Khuyến nghị)** - Theo chuẩn inet-component
- Props và Events
- Slots và Scoped Slots
- TypeScript trong Vue 3
- Styling component với SCSS

### [Bài 04: Cấu hình Build cho Thư viện](./lessons/04-cau-hinh-build.md)

- Cấu hình Vite cho library mode
- Build multiple entry points
- TypeScript declarations (.d.ts)
- Tree-shaking và optimization
- Các format output: ESM, CJS, UMD

### [Bài 05: Đóng gói và Bundle](./lessons/05-dong-goi-bundle.md)

- Cấu trúc package.json cho library
- Export và entry points
- Peer dependencies
- Build scripts và commands
- Testing build output

### [Bài 06: Xuất bản lên Npm](./lessons/06-xuat-ban-npm.md)

- Đăng ký tài khoản npm
- Cấu hình .npmignore
- Semantic versioning
- Publish package lên npm public
- Publish package lên npm private (GitHub Packages, etc.)

### [Bài 07: Tài liệu và Demo](./lessons/07-tai-lieu-demo.md)

- Tạo README.md chi tiết
- Sử dụng Storybook cho component demos
- JSDoc và TypeScript types
- Ví dụ sử dụng
- Changelog và versioning

### [Bài 08a: CI/CD với GitHub Actions](./lessons/08a-github-actions.md)

- Thiết lập GitHub Actions
- Auto build và test
- Auto publish khi release (theo chuẩn vue-material-icons)
- Automated versioning
- Quality checks (linting, testing)

### [Bài 08b: CI/CD với GitLab CI](./lessons/08b-gitlab-ci.md)

- Thiết lập GitLab CI (theo chuẩn inet-component)
- Auto build và publish package
- Setup notification qua Telegram
- Cấu hình GitLab CI variables
- Best practices cho GitLab CI

## 🛠️ Yêu cầu

- Kiến thức cơ bản về Vue 3
- Hiểu biết về JavaScript/TypeScript
- Có tài khoản npm (miễn phí)
- Có tài khoản GitHub (để sử dụng GitHub Actions)

## 📦 Package mẫu tham khảo

- [inet-component](https://www.npmjs.com/package/inet-component) - Ví dụ thực tế về Vue 3 component library

## 🚀 Bắt đầu

1. Đọc [Bài 01: Giới thiệu](./lessons/01-gioi-thieu.md)
2. Làm theo từng bài học theo thứ tự
3. Thực hành với các ví dụ trong mỗi bài

## 📝 Cấu trúc dự án mẫu

```
my-vue-library/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx          # Component (TSX - Khuyến nghị)
│   │   │   ├── Button.scss         # Styles
│   │   │   ├── useButton.ts        # Composable (nếu cần)
│   │   │   ├── types.ts            # TypeScript types
│   │   │   ├── Button.spec.ts      # Tests
│   │   │   └── index.ts            # Export
│   │   └── index.ts
│   ├── utils/
│   │   └── useRender.ts            # Hook để render TSX/JSX
│   └── index.ts
├── dist/
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

**Lưu ý:** Khóa học khuyến nghị sử dụng **TSX/JSX** để viết components (theo chuẩn inet-component) thay vì SFC (.vue) để có TypeScript support tốt hơn và phù hợp hơn cho library.

## 📚 Tài liệu tham khảo

- [Vue 3 Documentation](https://vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [npm Documentation](https://docs.npmjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

## 🤝 Đóng góp

Nếu bạn có góp ý hoặc muốn cải thiện khóa học, vui lòng tạo issue hoặc pull request.

## 📄 License

Khóa học này được chia sẻ miễn phí cho mọi người.

---

**Chúc bạn học tốt! 🎉**
