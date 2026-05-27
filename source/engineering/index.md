---
title: 前端工程化专栏
date: 2026-05-27 11:00:00
comments: false
---

# 前端工程化专栏

前端工程化的本质，是让前端项目可以被多人、长期、稳定、高效地开发、维护和发布。

它不是工具清单，而是一套围绕大型前端项目的组织、协作、构建、质量和发布体系。

---

## 阅读路线

### 1. 总览篇

- [前端工程化到底是什么：从模块化、构建工具到 CI/CD](/2026/05/27/Frontend/Engineering/frontend-engineering-overview/)

### 2. 模块化与工程基础

- CommonJS 和 ESModule 的区别
- Node 模块系统与浏览器模块系统
- Tree Shaking 为什么依赖静态模块分析

### 3. 构建工具

- [现代前端打包工具全面对比：Webpack、Vite、Rollup、esbuild](/2026/01/07/Frontend/Engineering/modern-pack-tool/)
- Vite 为什么快
- Webpack 核心概念：Entry、Loader、Plugin、Chunk

### 4. 包管理与 Monorepo

- npm、yarn、pnpm 的区别
- [Monorepo 和 Multirepo 在前端领域的应用](/2026/01/05/Frontend/Engineering/monorepo-multirepo/)
- [Monorepo 项目搭建最佳实践](/2026/01/05/Frontend/Engineering/monorepo-best-practice/)
- pnpm workspace 实战
- Changesets 多包发布实践

### 5. 代码规范与团队协作

- ESLint、Prettier、Stylelint 项目规范化
- Husky 和 lint-staged 提交前检查
- Commitlint 和 Commit Message 规范
- PR Review 和分支工作流

### 6. 自动化与发布

- GitHub Actions 前端 CI 实战
- 前端项目自动构建与部署
- Docker、Nginx、CDN 在前端部署里的位置

### 7. 性能工程化

- Tree Shaking
- Code Splitting
- Lazy Loading
- Bundle Analyzer
- CDN、缓存、gzip、brotli
- 图片和字体优化

---

## 专栏主线

```text
模块化
  ↓
组件化
  ↓
构建与编译
  ↓
包管理
  ↓
代码规范
  ↓
Git 协作
  ↓
CI/CD
  ↓
性能优化
  ↓
Monorepo 和大型项目治理
```

---

## 一句话

前端工程化不是学习某一个工具，而是学会用工具、规范和流程解决大型前端项目的协作与维护问题。
