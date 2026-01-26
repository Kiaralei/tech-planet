---
title: Next.js 完全指南：从入门到实战
date: 2026-01-23 10:00:00
categories:
  - Frontend
  - React
tags:
  - Next.js
  - React
  - SSR
  - SSG
  - 全栈开发
---

## 📚 什么是 Next.js？

**Next.js** 是一个基于 React 的**全栈框架**，由 Vercel 开发维护。它让你用 React 写前端的同时，也能轻松处理后端逻辑。

### 一句话理解

> **React** 是造积木的工具
> **Next.js** 是用这些积木盖好的房子框架

---

## 🎯 为什么选择 Next.js？

| 痛点         | React 原生          | Next.js             |
| ------------ | ------------------- | ------------------- |
| **路由**     | 需要装 react-router | ✅ 内置文件路由     |
| **SEO**      | CSR 不友好          | ✅ SSR/SSG 支持     |
| **首屏加载** | 慢（需要下载 JS）   | ✅ 服务端渲染，秒开 |
| **API 接口** | 需要单独后端        | ✅ 内置 API Routes  |
| **打包优化** | 手动配置            | ✅ 自动优化         |
| **图片优化** | 手动处理            | ✅ 内置 Image 组件  |

---

## 🚀 快速开始

### 创建项目

```bash
# 推荐使用 pnpm
pnpm create next-app@latest my-app

# 或 npm
npx create-next-app@latest my-app

# 或 yarn
yarn create next-app my-app
```

创建时会问你：

```
✔ Would you like to use TypeScript? Yes
✔ Would you like to use ESLint? Yes
✔ Would you like to use Tailwind CSS? Yes
✔ Would you like to use `src/` directory? Yes
✔ Would you like to use App Router? Yes  ← 推荐选 Yes
✔ Would you like to customize the default import alias? No
```

### 启动开发

```bash
cd my-app
pnpm dev
```

访问 `http://localhost:3000` 🎉

---

## 📁 项目结构（App Router）

```
my-app/
├── src/
│   └── app/                    # 核心目录
│       ├── layout.tsx          # 根布局
│       ├── page.tsx            # 首页 /
│       ├── globals.css         # 全局样式
│       ├── about/
│       │   └── page.tsx        # /about
│       ├── blog/
│       │   ├── page.tsx        # /blog
│       │   └── [slug]/
│       │       └── page.tsx    # /blog/xxx（动态路由）
│       └── api/
│           └── hello/
│               └── route.ts    # API: /api/hello
├── public/                     # 静态资源
├── next.config.js              # Next.js 配置
├── tailwind.config.js
└── package.json
```

---

## 🛤️ 路由系统

### 基于文件的路由

**文件路径 = URL 路径**，超级直观！

| 文件路径                      | URL                 |
| ----------------------------- | ------------------- |
| `app/page.tsx`                | `/`                 |
| `app/about/page.tsx`          | `/about`            |
| `app/blog/page.tsx`           | `/blog`             |
| `app/blog/[slug]/page.tsx`    | `/blog/hello-world` |
| `app/shop/[...slug]/page.tsx` | `/shop/a/b/c`       |

### 动态路由

```tsx
// app/blog/[slug]/page.tsx
export default function BlogPost({ params }: { params: { slug: string } }) {
  return <h1>文章: {params.slug}</h1>;
}

// 访问 /blog/my-first-post
// params.slug = "my-first-post"
```

### 路由组（不影响 URL）

```
app/
├── (marketing)/        # 括号表示分组，不出现在 URL
│   ├── about/page.tsx  # /about
│   └── blog/page.tsx   # /blog
└── (shop)/
    └── cart/page.tsx   # /cart
```

### 页面跳转

```tsx
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// 方式 1：Link 组件（推荐）
<Link href="/about">关于我们</Link>
<Link href={`/blog/${slug}`}>查看文章</Link>

// 方式 2：编程式导航
const router = useRouter()
router.push('/dashboard')
router.back()
```

---

## 🎨 布局系统

### 根布局（必须）

```tsx
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <header>导航栏</header>
        <main>{children}</main>
        <footer>页脚</footer>
      </body>
    </html>
  );
}
```

### 嵌套布局

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <aside>侧边栏</aside>
      <main>{children}</main>
    </div>
  );
}
```

布局会自动嵌套：

```
RootLayout
└── DashboardLayout
    └── page.tsx
```

---

## 🔄 渲染模式

Next.js 支持多种渲染方式，这是它的**核心优势**！

### 对比一览

| 模式    | 全称                            | 渲染时机 | 适用场景     |
| ------- | ------------------------------- | -------- | ------------ |
| **SSG** | Static Site Generation          | 构建时   | 博客、文档   |
| **SSR** | Server-Side Rendering           | 请求时   | 个性化页面   |
| **ISR** | Incremental Static Regeneration | 按需更新 | 电商、新闻   |
| **CSR** | Client-Side Rendering           | 浏览器   | 仪表盘、后台 |

### 1️⃣ 服务端组件（默认）

```tsx
// app/posts/page.tsx
// 默认就是服务端组件，直接写 async！
export default async function Posts() {
  const posts = await fetch("https://api.example.com/posts").then((r) =>
    r.json()
  );

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

### 2️⃣ 客户端组件

```tsx
"use client"; // 必须加这行！

import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);

  return <button onClick={() => setCount(count + 1)}>点击: {count}</button>;
}
```

### 3️⃣ 静态生成 (SSG)

```tsx
// 构建时生成，之后不变
export default async function About() {
  const data = await fetch("https://api.example.com/about", {
    cache: "force-cache", // 永久缓存
  });
  return <div>{data}</div>;
}
```

### 4️⃣ 动态渲染 (SSR)

```tsx
// 每次请求都重新获取
export default async function Dashboard() {
  const data = await fetch("https://api.example.com/user", {
    cache: "no-store", // 不缓存
  });
  return <div>{data}</div>;
}
```

### 5️⃣ 增量静态再生 (ISR)

```tsx
// 每 60 秒更新一次
export default async function Products() {
  const products = await fetch("https://api.example.com/products", {
    next: { revalidate: 60 }, // 60 秒后重新验证
  });
  return <div>{products}</div>;
}
```

revalidate: 60 的意思：

- 60 秒内：直接返回缓存的静态页面
- 60 秒后：返回旧页面，同时后台悄悄更新
- 更新完成后：下次访问就是新页面

---

## 📡 数据获取

### 服务端获取（推荐）

```tsx
// app/users/page.tsx
async function getUsers() {
  const res = await fetch("https://api.example.com/users");
  if (!res.ok) throw new Error("获取失败");
  return res.json();
}

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### 客户端获取（交互数据）

```tsx
"use client";

import { useEffect, useState } from "react";

export default function Comments() {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    fetch("/api/comments")
      .then((r) => r.json())
      .then(setComments);
  }, []);

  return <div>{/* 渲染评论 */}</div>;
}
```

### 使用 SWR（推荐）

```tsx
"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function Profile() {
  const { data, error, isLoading } = useSWR("/api/user", fetcher);

  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>加载失败</div>;

  return <div>你好, {data.name}</div>;
}
```

---

## 🔌 API Routes

Next.js 可以直接写后端接口！

### 创建 API

```ts
// app/api/users/route.ts
import { NextResponse } from "next/server";

// GET /api/users
export async function GET() {
  const users = [
    { id: 1, name: "张三" },
    { id: 2, name: "李四" },
  ];
  return NextResponse.json(users);
}

// POST /api/users
export async function POST(request: Request) {
  const body = await request.json();
  // 保存到数据库...
  return NextResponse.json({ success: true, data: body });
}
```

### 动态 API

```ts
// app/api/users/[id]/route.ts
import { NextResponse } from "next/server";

// GET /api/users/123
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUserById(params.id);
  return NextResponse.json(user);
}

// DELETE /api/users/123
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  await deleteUser(params.id);
  return NextResponse.json({ success: true });
}
```

---

## 🖼️ 图片优化

```tsx
import Image from "next/image";

// 本地图片
import heroImage from "@/public/hero.jpg";

export default function Hero() {
  return (
    <>
      {/* 本地图片（自动优化） */}
      <Image
        src={heroImage}
        alt="Hero"
        placeholder="blur" // 模糊占位
      />

      {/* 远程图片 */}
      <Image
        src="https://example.com/photo.jpg"
        alt="Photo"
        width={800}
        height={600}
        priority // 优先加载（LCP 图片用）
      />

      {/* 填充容器 */}
      <div className="relative h-64 w-full">
        <Image src="/banner.jpg" alt="Banner" fill className="object-cover" />
      </div>
    </>
  );
}
```

配置远程图片域名：

```js
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "example.com",
      },
    ],
  },
};
```

---

## 🎭 Loading 和 Error

### 加载状态

```tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent" />
    </div>
  );
}
```

### 错误处理

```tsx
"use client";

// app/dashboard/error.tsx
export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="text-center py-10">
      <h2>出错了！</h2>
      <p>{error.message}</p>
      <button onClick={reset}>重试</button>
    </div>
  );
}
```

### 404 页面

```tsx
// app/not-found.tsx
export default function NotFound() {
  return (
    <div className="text-center py-20">
      <h1 className="text-6xl font-bold">404</h1>
      <p>页面不存在</p>
    </div>
  );
}
```

---

## 🔐 中间件

```ts
// middleware.ts（放在项目根目录）
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // 获取 token
  const token = request.cookies.get("token");

  // 未登录重定向到登录页
  if (!token && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// 配置匹配路径
export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
```

---

## 🌍 元数据和 SEO

### 静态元数据

```tsx
// app/page.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "我的网站",
  description: "这是一个很棒的网站",
  keywords: ["Next.js", "React", "Web开发"],
  openGraph: {
    title: "我的网站",
    description: "这是一个很棒的网站",
    images: ["/og-image.png"],
  },
};

export default function Home() {
  return <div>首页</div>;
}
```

### 动态元数据

```tsx
// app/blog/[slug]/page.tsx
import { Metadata } from "next";

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug);

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      images: [post.coverImage],
    },
  };
}

export default async function BlogPost({ params }: Props) {
  const post = await getPost(params.slug);
  return <article>{post.content}</article>;
}
```

---

## 📦 部署

### Vercel（推荐，免费）

```bash
# 安装 Vercel CLI
pnpm add -g vercel

# 部署
vercel

# 生产部署
vercel --prod
```

或者直接在 [vercel.com](https://vercel.com) 导入 GitHub 仓库，自动部署！

### 自托管（Node.js）

```bash
# 构建
pnpm build

# 启动
pnpm start
```

### Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

```js
// next.config.js
module.exports = {
  output: "standalone", // 启用独立输出
};
```

---

## 🎯 最佳实践

### 1. 服务端 vs 客户端组件

```
服务端组件（默认）：
✅ 数据获取
✅ 访问后端资源
✅ 敏感信息（API Key）
✅ 大型依赖

客户端组件（'use client'）：
✅ 交互（onClick, onChange）
✅ 状态（useState, useEffect）
✅ 浏览器 API（localStorage）
✅ 自定义 hooks
```

### 2. 组件组织

```tsx
// ❌ 不好：整个页面都是客户端
"use client";
export default function Page() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <Header /> {/* 不需要交互 */}
      <Counter /> {/* 需要交互 */}
      <Footer /> {/* 不需要交互 */}
    </div>
  );
}

// ✅ 好：只有交互部分是客户端
export default function Page() {
  return (
    <div>
      <Header /> {/* 服务端 */}
      <Counter /> {/* 客户端 */}
      <Footer /> {/* 服务端 */}
    </div>
  );
}

// components/Counter.tsx
("use client");
export default function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
}
```

### 3. 环境变量

```bash
# .env.local
DATABASE_URL=xxx          # 只在服务端可用
NEXT_PUBLIC_API_URL=xxx   # 客户端也可用（必须 NEXT_PUBLIC_ 前缀）
```

---

## 📊 与其他框架对比

| 特性         | Next.js         | Nuxt.js         | Remix    |
| ------------ | --------------- | --------------- | -------- |
| **基于**     | React           | Vue             | React    |
| **渲染模式** | SSG/SSR/ISR/CSR | SSG/SSR/CSR     | SSR      |
| **路由**     | 文件路由        | 文件路由        | 文件路由 |
| **数据获取** | fetch + cache   | useFetch        | loader   |
| **API**      | API Routes      | Server Routes   | Actions  |
| **部署**     | Vercel / 自托管 | Vercel / 自托管 | 多平台   |

---

## 🎯 总结

### Next.js 核心概念

| 概念            | 说明                   |
| --------------- | ---------------------- |
| **App Router**  | 基于文件的路由系统     |
| **服务端组件**  | 默认，在服务器渲染     |
| **客户端组件**  | `'use client'`，有交互 |
| **SSG/SSR/ISR** | 多种渲染策略           |
| **API Routes**  | 内置后端 API           |
| **Middleware**  | 请求拦截处理           |

### 记忆口诀

> **路由看文件，渲染看场景** > **服务端获取，客户端交互** > **Image 优化图，Metadata 管 SEO**

---

## 📚 学习资源

- [Next.js 官方文档](https://nextjs.org/docs)
- [Next.js 官方教程](https://nextjs.org/learn)
- [Vercel 官方博客](https://vercel.com/blog)
- [Next.js GitHub](https://github.com/vercel/next.js)
