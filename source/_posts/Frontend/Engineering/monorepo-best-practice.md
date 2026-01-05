---
title: Monorepo 项目搭建最佳实践
date: 2026-01-05 15:21:57
categories:
  - Frontend
  - Engineering
tags:
  - Monorepo
  - 前端工程化
  - pnpm
  - Turborepo
  - Changesets
---

## 🚀 实战：搭建 Monorepo 项目

### 步骤 1：初始化项目

```bash
# 创建项目目录
mkdir my-monorepo && cd my-monorepo

# 初始化
pnpm init
```

### 步骤 2：配置 pnpm workspace

pnpm-workspace.yaml 中的 packages 配置是告诉 pnpm 哪些目录下的子目录是 workspace 的成员包。  
简单说：这个配置定义了 Monorepo 的边界，告诉 pnpm 哪些目录是"包"。

```yaml
# pnpm-workspace.yaml
packages:
  - "packages/*" # packages 目录下的所有一级子目录都是独立的包
  - "apps/*" # apps 目录下的所有一级子目录都是独立的包
```

### 步骤 3：创建目录结构

```bash
mkdir -p packages/shared packages/ui apps/web apps/admin
```

```
my-monorepo/
├── apps/
│   ├── web/              # 主应用，被识别为 @myorg/web
│   └── admin/            # 管理后台，被识别为 @myorg/admin
├── packages/
│   ├── shared/           # 共享工具，被识别为 @myorg/shared
│   └── ui/               # UI 组件，被识别为 @myorg/ui
├── scripts/             ❌ 不在 workspace 中
├── package.json
└── pnpm-workspace.yaml
```

### 步骤 4：初始化子包

**packages/shared/package.json**

```json
{
  "name": "@myorg/shared",
  "version": "1.0.0",
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

**packages/ui/package.json**

```json
{
  "name": "@myorg/ui",
  "version": "1.0.0",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "@myorg/shared": "workspace:*"
  }
}
```

**apps/web/package.json**

```json
{
  "name": "@myorg/web",
  "version": "1.0.0",
  "dependencies": {
    "@myorg/shared": "workspace:*",
    "@myorg/ui": "workspace:*"
  }
}
```

### 步骤 5：安装依赖

```bash
# 安装所有依赖
pnpm install

# 给特定包添加依赖
pnpm add lodash --filter @myorg/shared

# 给所有包添加开发依赖
pnpm add -D typescript -w
```

### 步骤 6：配置 Turborepo

```bash
# 安装 turbo
pnpm add -D turbo -w
```

**turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

**package.json（根目录）**

```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test"
  }
}
```

### 步骤 7：运行命令

```bash
# 开发（所有项目）
pnpm dev

# 构建（所有项目）
pnpm build

# 只构建特定项目
pnpm build --filter @myorg/web

# 构建某个项目及其依赖
pnpm build --filter @myorg/web...
```

---

## 📦 共享代码的最佳实践

### 1. 内部包引用

使用 `workspace:*` 协议引用内部包：

```json
{
  "dependencies": {
    "@myorg/shared": "workspace:*",
    "@myorg/ui": "workspace:^1.0.0"
  }
}
```

### 2. TypeScript 路径映射

主要解决两个问题：

#### 1. 让 IDE 正确识别源码

在开发阶段，内部包还没有构建（没有 dist 目录），但你希望：

```
// apps/web/src/index.ts
import { utils } from '@myorg/shared';  // IDE 能跳转到源码
```

#### 2. 开发时直接引用源码

@myorg/shared 的解析路径：

```
开发时（通过 paths）:
  import '@myorg/shared' → packages/shared/src/index.ts ✅

生产时（通过 package.json）:
  import '@myorg/shared' → packages/shared/dist/index.js ✅
```

**tsconfig.json（根目录）**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@myorg/shared": ["packages/shared/src"],
      "@myorg/ui": ["packages/ui/src"]
    }
  }
}
```

### 3. 共享配置

**统一的 ESLint 配置**：

```
packages/
└── eslint-config/
    ├── package.json
    ├── base.js
    ├── react.js
    └── node.js
```

```javascript
// packages/eslint-config/react.js
module.exports = {
  extends: ["./base.js", "plugin:react/recommended"],
  // ...
};
```

```json
// apps/web/.eslintrc.json
{
  "extends": ["@myorg/eslint-config/react"]
}
```

---

## 🚀 Monorepo 发布指南

Monorepo 中发布包到 npm 需要解决几个核心问题：**版本管理**、**变更追踪**、**依赖更新**。推荐使用 **Changesets** 工具。

### 发布流程概览

```
代码开发 → 记录变更 → 更新版本 → 构建 → 发布 npm
    │          │          │        │        │
    └── PR ────┼── merge ─┼── CI ──┼── CI ──┘
               │          │        │
          changeset   version   build & publish
```

### 1. 安装 Changesets

```bash
# 安装到根目录
pnpm add -D @changesets/cli -w

# 初始化
pnpm changeset init
```

初始化后会创建 `.changeset` 目录：

```
.changeset/
├── config.json          # 配置文件
└── README.md
```

### 2. 配置 Changesets

**.changeset/config.json**

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["@myorg/web", "@myorg/admin"]
}
```

| 配置项                       | 说明                                         |
| ---------------------------- | -------------------------------------------- |
| `access`                     | `public` 发布公开包，`restricted` 发布私有包 |
| `baseBranch`                 | 主分支名称                                   |
| `updateInternalDependencies` | 内部依赖更新时的版本策略                     |
| `ignore`                     | 忽略不需要发布的包（如应用项目）             |
| `fixed`                      | 固定版本的包组（同步升级）                   |
| `linked`                     | 关联版本的包组                               |

### 3. 记录变更（开发者操作）

每次完成功能开发或 bug 修复后，记录变更：

```bash
pnpm changeset
```

交互式选择：

```
🦋  Which packages would you like to include?
   ◯ @myorg/shared
   ◉ @myorg/ui          # 选择修改的包

🦋  Which packages should have a major bump?
   # 选择 major/minor/patch

🦋  Summary:
   # 输入变更描述
```

生成变更文件：

```markdown
## <!-- .changeset/happy-panda-123.md -->

## "@myorg/ui": minor

feat: 新增 DatePicker 组件，支持日期范围选择
```

### 4. 更新版本（CI 或手动）

当变更合并到主分支后，执行版本更新：

```bash
pnpm changeset version
```

这个命令会：

- ✅ 读取所有 changeset 文件
- ✅ 更新相关包的 `package.json` 版本号
- ✅ 更新依赖该包的其他包版本
- ✅ 生成 `CHANGELOG.md`
- ✅ 删除已处理的 changeset 文件

**生成的 CHANGELOG.md**

```markdown
# @myorg/ui

## 1.1.0

### Minor Changes

- feat: 新增 DatePicker 组件，支持日期范围选择
```

### 5. 发布到 npm

```bash
# 先构建
pnpm build

# 发布
pnpm changeset publish
```

### 6. 完整的 package.json 脚本

**根目录 package.json**

```json
{
  "scripts": {
    "changeset": "changeset",
    "version": "changeset version",
    "release": "pnpm build && changeset publish",
    "prepublishOnly": "pnpm build"
  }
}
```

### 7. GitHub Actions 自动发布

**.github/workflows/release.yml**

```yaml
name: Release

on:
  push:
    branches:
      - main

concurrency: ${{ github.workflow }}-${{ github.ref }}

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install

      - name: Create Release Pull Request or Publish
        id: changesets
        uses: changesets/action@v1
        with:
          publish: pnpm release
          version: pnpm version
          title: "chore: version packages"
          commit: "chore: version packages"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 8. 自动化发布流程

```
┌─────────────────────────────────────────────────────────────┐
│                    开发者工作流                              │
├─────────────────────────────────────────────────────────────┤
│  1. 开发功能/修复 bug                                        │
│  2. pnpm changeset  → 记录变更                               │
│  3. git commit & push                                        │
│  4. 创建 PR                                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ merge
┌─────────────────────────────────────────────────────────────┐
│                    CI 自动处理                               │
├─────────────────────────────────────────────────────────────┤
│  5. Changesets Action 检测到 changeset 文件                  │
│  6. 自动创建 "Version Packages" PR                           │
│     - 更新版本号                                             │
│     - 生成 CHANGELOG                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ merge Version PR
┌─────────────────────────────────────────────────────────────┐
│                    自动发布                                  │
├─────────────────────────────────────────────────────────────┤
│  7. CI 执行 pnpm release                                     │
│  8. 构建所有包                                               │
│  9. 发布到 npm                                               │
│  10. 创建 GitHub Release                                     │
└─────────────────────────────────────────────────────────────┘
```

### 9. 私有包发布（内部 npm 仓库）

如果发布到私有仓库：

**.npmrc**

```ini
@myorg:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
```

**package.json**

```json
{
  "publishConfig": {
    "registry": "https://npm.pkg.github.com",
    "access": "restricted"
  }
}
```

### 10. 预发布版本（Beta/Alpha）

```bash
# 进入预发布模式
pnpm changeset pre enter beta

# 正常添加 changeset
pnpm changeset

# 更新版本（会生成 1.0.0-beta.0）
pnpm changeset version

# 发布
pnpm changeset publish --tag beta

# 退出预发布模式
pnpm changeset pre exit
```

### 发布前检查清单

| 检查项       | 说明                           |
| ------------ | ------------------------------ |
| ✅ 构建通过  | `pnpm build` 无错误            |
| ✅ 测试通过  | `pnpm test` 无失败             |
| ✅ Lint 通过 | `pnpm lint` 无错误             |
| ✅ 版本正确  | changeset 选择了正确的版本类型 |
| ✅ CHANGELOG | 变更描述清晰准确               |
| ✅ 依赖更新  | 内部依赖版本同步更新           |

---

## ⚡ 性能优化

### 1. Turborepo 远程缓存

```bash
# 登录 Vercel（Turborepo 官方）
npx turbo login

# 链接项目
npx turbo link

# 构建时会自动使用远程缓存
pnpm build
```

### 2. 增量构建

Turborepo 会自动检测变更，只构建受影响的包：

```bash
# 只构建有变更的包
pnpm build

# 输出示例
# @myorg/shared: cache hit, replaying output
# @myorg/ui: cache miss, executing
# @myorg/web: cache miss, executing
```

### 3. 并行执行

```json
// turbo.json
{
  "pipeline": {
    "lint": {
      "outputs": [] // 无输出的任务可以高度并行
    }
  }
}
```

---

## 📊 目录结构最佳实践

### 推荐结构

```
my-monorepo/
├── apps/                  # 应用项目
│   ├── web/              # Web 应用
│   ├── admin/            # 管理后台
│   └── docs/             # 文档站点
├── packages/              # 共享包
│   ├── ui/               # UI 组件库
│   ├── shared/           # 共享工具
│   ├── config/           # 共享配置
│   │   ├── eslint-config/
│   │   ├── tsconfig/
│   │   └── prettier-config/
│   └── types/            # 共享类型定义
├── .changeset/            # Changesets 配置
├── .github/               # GitHub Actions
│   └── workflows/
├── turbo.json             # Turborepo 配置
├── pnpm-workspace.yaml    # pnpm workspace 配置
├── package.json           # 根 package.json
└── README.md
```

---

## 🔧 常见问题解决

### 1. 依赖提升导致的问题

```yaml
# .npmrc
shamefully-hoist=false      # 禁止依赖提升
strict-peer-dependencies=false
```

### 2. TypeScript 找不到模块

```json
// tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "paths": {
      "@myorg/*": ["packages/*/src"]
    }
  },
  "references": [{ "path": "packages/shared" }, { "path": "packages/ui" }]
}
```

### 3. ESLint 配置不生效

```bash
# 确保在每个包中都引用了共享配置
pnpm add -D @myorg/eslint-config --filter @myorg/web
```
