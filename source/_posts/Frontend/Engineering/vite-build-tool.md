---
title: Vite 详解：为什么开发启动和 HMR 这么快
date: 2026-05-27 16:40:00
categories:
  - Frontend
  - Engineering
tags:
  - Vite
  - esbuild
  - Rollup
  - HMR
  - 前端工程化
  - 构建工具
---

## 前言

Vite 最大的变化是：

> 开发环境不先打包。

这和传统 Webpack 开发模式有本质区别。

Vite 快不是单纯因为 esbuild 快，而是因为它改变了开发阶段的架构。

---

## Webpack 开发模式

传统打包工具开发时通常要先做完整构建。

```text
读取入口
  ↓
分析所有依赖
  ↓
执行编译转换
  ↓
生成开发环境 bundle
  ↓
启动 dev server
  ↓
浏览器加载 bundle
```

项目越大，启动越慢。

因为开发服务器启动之前，需要先理解和处理大量模块。

---

## Vite 开发模式

Vite 利用现代浏览器原生 ESModule。

```js
import Button from "./Button";
```

浏览器看到这个 `import` 后，可以自己发请求获取对应模块。

Vite Dev Server 只需要在浏览器请求某个模块时，把它转换成浏览器能执行的 JavaScript。

```text
浏览器请求模块
  ↓
Vite 按需编译
  ↓
返回 ESM
  ↓
浏览器执行
```

所以 Vite 启动快的关键是：

> 不是打包更快，而是开发时根本不先打包。

---

## esbuild 在 Vite 里做什么

浏览器支持 ESM，但不代表它能直接运行所有工程源码。

浏览器不直接认识：

- TypeScript 类型
- JSX
- Vue SFC 中的脚本转换
- 部分新语法降级
- CommonJS 依赖

所以 Vite 仍然需要编译转换。

esbuild 主要负责：

```text
TS → JS
JSX → JS
CommonJS → ESM
依赖预构建
```

开发阶段的 esbuild 不是在打完整应用包，而是在做高速 transform。

---

## Vite HMR 为什么快

Vite HMR 快的核心是模块粒度更新。

如果只改了一个 `Button.tsx`：

```text
Webpack：改一个文件 → 影响 bundle/chunk → 重新生成更新
Vite：改一个文件 → 浏览器重新请求这个模块
```

其它没有变化的模块不需要重新处理。

所以 Vite HMR 快的本质是：

> 开发时不打包，加上模块级更新。

esbuild 的快让单文件转换更快，但它不是唯一原因。

更准确地说：

> Vite 的快来自架构变化，esbuild 的快放大了这个优势。

---

## node_modules 为什么也快

很多 npm 包不是纯 ESM，可能是 CommonJS，也可能有复杂入口。

Vite 会在首次启动时做依赖预构建：

```text
扫描依赖
  ↓
esbuild 预构建
  ↓
转换为 ESM
  ↓
写入缓存
```

后续如果依赖没有变化，就可以直接复用缓存。

这能避免开发过程中反复分析庞大的 `node_modules`。

---

## 生产构建为什么还是 Rollup

开发环境追求启动快、HMR 快。

生产环境追求：

- Tree Shaking
- Code Splitting
- 资源压缩
- 长缓存文件名
- 产物稳定
- 浏览器兼容

所以 Vite 开发时利用 ESM 和 esbuild，生产构建默认交给 Rollup。

```text
开发环境：Vite Dev Server + esbuild
生产环境：Rollup
```

这就是 Vite 的组合拳。

---

## Vite 适合什么

Vite 适合：

- React / Vue / Svelte 新项目
- 中后台应用
- 文档站点
- 组件库开发环境
- 原型项目
- 大部分现代 Web 应用

不一定适合：

- 强依赖 Webpack 插件生态的老项目
- 深度使用 Module Federation 的项目
- 有大量非标准构建流程的存量工程

---

## 总结

Vite 的一句话理解：

> 既然浏览器已经支持 ESM，那开发时为什么还要先打包？

Vite 快的关键不是“打包更快”，而是“开发时不打包”。

esbuild 负责让每次按需转换足够快，Rollup 负责生产构建质量。
