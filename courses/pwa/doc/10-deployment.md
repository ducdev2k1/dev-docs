# 10 — Deployment

## Tổng quan

Sau khi develop xong PWA, bước cuối cùng là deploy lên production. PWA yêu cầu HTTPS, vì vậy chúng ta cần deploy lên platforms hỗ trợ HTTPS.

## Build for Production

### 1. Optimize trước khi build

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: "esnext",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["vue", "vue-router"],
          workbox: ["workbox-window"],
        },
      },
    },
  },
});
```

### 2. Build command

```bash
pnpm build
```

Output sẽ ở folder `dist/`:

```
dist/
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
├── icons/
├── index.html
├── manifest.webmanifest
├── sw.js
└── workbox-[hash].js
```

### 3. Preview production build

```bash
pnpm preview
```

Test kỹ trước khi deploy:

- ✅ Offline functionality
- ✅ Install prompt
- ✅ Service Worker hoạt động
- ✅ All routes work
- ✅ Assets load correctly

## Deploy lên Vercel

### Setup

1. **Install Vercel CLI**:

```bash
pnpm add -g vercel
```

2. **Login**:

```bash
vercel login
```

3. **Deploy**:

```bash
vercel
```

Follow prompts để setup project.

### vercel.json

Tạo `vercel.json` để config:

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        },
        {
          "key": "Service-Worker-Allowed",
          "value": "/"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Auto-deployment với GitHub

1. Push code lên GitHub
2. Import project vào Vercel từ GitHub
3. Vercel tự động deploy khi có commit mới

## Deploy lên Netlify

### Setup

1. **Install Netlify CLI**:

```bash
pnpm add -g netlify-cli
```

2. **Login**:

```bash
netlify login
```

3. **Deploy**:

```bash
netlify deploy --prod
```

### netlify.toml

```toml
[build]
  command = "pnpm build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
    Service-Worker-Allowed = "/"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
```

## Deploy lên Firebase Hosting

### Setup

1. **Install Firebase CLI**:

```bash
pnpm add -g firebase-tools
```

2. **Login**:

```bash
firebase login
```

3. **Init**:

```bash
firebase init hosting
```

Select:

- Public directory: `dist`
- Single-page app: `Yes`
- GitHub auto-deployment: `Yes` (optional)

### firebase.json

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/sw.js",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache"
          }
        ]
      }
    ]
  }
}
```

4. **Deploy**:

```bash
firebase deploy
```

## CI/CD với GitHub Actions

### .github/workflows/deploy.yml

```yaml
name: Deploy PWA

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm build

      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: "--prod"
```

## Performance Optimization

### 1. Code Splitting

```typescript
// router/index.ts
const routes = [
  {
    path: "/",
    component: () => import("../views/Home.vue"),
  },
  {
    path: "/about",
    component: () => import("../views/About.vue"),
  },
];
```

### 2. Lazy Loading Images

```vue
<template>
  <img :src="imageSrc" loading="lazy" alt="Description" />
</template>
```

### 3. Preload Critical Resources

```html
<!-- index.html -->
<link
  rel="preload"
  href="/fonts/main.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
<link rel="preconnect" href="https://fonts.googleapis.com" />
```

### 4. Compress Assets

```typescript
// vite.config.ts
import viteCompression from "vite-plugin-compression";

export default defineConfig({
  plugins: [
    viteCompression({
      algorithm: "brotliCompress",
      ext: ".br",
    }),
  ],
});
```

## Monitoring

### 1. Google Analytics

```typescript
// src/main.ts
import VueGtag from "vue-gtag";

app.use(VueGtag, {
  config: { id: "G-XXXXXXXXXX" },
});
```

### 2. Sentry Error Tracking

```typescript
import * as Sentry from "@sentry/vue";

Sentry.init({
  app,
  dsn: "YOUR_SENTRY_DSN",
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

### 3. Web Vitals

```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from "web-vitals";

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

## Post-Deployment Checklist

- [ ] PWA installable trên mobile và desktop
- [ ] Offline functionality hoạt động
- [ ] HTTPS enabled
- [ ] Lighthouse PWA score >= 90
- [ ] All routes accessible
- [ ] Service Worker registered
- [ ] Manifest valid
- [ ] Icons hiển thị đúng
- [ ] Performance metrics tốt
- [ ] Error tracking setup
- [ ] Analytics tracking
- [ ] SEO meta tags
- [ ] Social sharing tags

## Troubleshooting

### Issue: SW không update sau deploy

**Giải pháp**: Clear cache và hard reload (Ctrl+Shift+R)

### Issue: Assets 404 sau deploy

**Giải pháp**: Check base path trong vite.config.ts

### Issue: Routing không hoạt động

**Giải pháp**: Configure rewrites/redirects cho SPA

## Bước tiếp theo

Deploy xong! Giờ làm [11 - Bài lab thực hành](/practical-labs) để practice!

---

> 💡 **Pro tip**: Luôn test trên staging environment trước khi deploy production!
