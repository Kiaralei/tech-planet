---
title: Rollup 详解：为什么它适合打包库
date: 2026-05-27 16:35:00
categories:
  - Frontend
  - Engineering
tags:
  - Rollup
  - Tree Shaking
  - 前端工程化
  - 构建工具
  - 库打包
---

## 前言

Rollup 的定位非常清晰：

> 生成更干净、更小、更适合分发的 JavaScript 库代码。

Webpack 更像应用构建工具，想处理整个前端工程。

Rollup 更像 ESM 优化器，重点是把库代码输出得足够优雅。

---

## Rollup 的核心思想

Rollup 围绕 ESModule 设计。

ESModule 的 `import` / `export` 是静态结构，构建工具可以在编译阶段分析模块之间的关系。

```js
export const add = () => {};
export const minus = () => {};
```

如果使用方只引入：

```js
import { add } from "my-lib";
```

Rollup 可以更容易判断 `minus` 没有被使用，从而把它从最终产物中移除。

这就是 Rollup Tree Shaking 效果好的基础。

---

## 为什么 Rollup 输出更干净

Rollup 的目标不是模拟浏览器运行环境，也不是接管所有资源，而是尽量保留模块语义，并输出简洁的代码。

它常见输出格式包括：

| 格式 | 适用场景 |
| --- | --- |
| ESM | 现代打包工具和浏览器 |
| CJS | Node.js CommonJS 生态 |
| UMD | 兼容浏览器全局变量和 CommonJS |
| IIFE | 直接在浏览器中执行 |

库作者通常会同时输出 ESM 和 CJS：

```json
{
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts"
}
```

这样不同消费方都能使用。

---

## 基础配置

一个简单的 Rollup 配置：

```js
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/index.cjs",
      format: "cjs",
      sourcemap: true,
    },
    {
      file: "dist/index.mjs",
      format: "esm",
      sourcemap: true,
    },
  ],
  external: ["react", "react-dom"],
  plugins: [resolve(), commonjs(), typescript()],
};
```

这里最重要的是 `external`。

对于库来说，React、Vue 这类依赖通常不应该被打进库产物，而应该交给使用方项目安装。

---

## Rollup 适合什么

| 场景 | 是否适合 |
| --- | --- |
| npm 工具库 | 适合 |
| SDK | 适合 |
| UI 组件库 | 适合 |
| 框架源码打包 | 适合 |
| 复杂业务应用 | 不太适合 |

Rollup 特别适合“被别人安装和消费”的代码。

比如：

- 工具函数库
- UI 组件库
- 埋点 SDK
- 请求 SDK
- 框架核心包

---

## 为什么应用不常直接用 Rollup

Rollup 不是不能打包应用，而是应用开发需要的不只是产物干净。

应用开发更关注：

- Dev Server
- HMR
- HTML 处理
- CSS 处理
- 静态资源处理
- 代理
- 环境变量
- 框架插件生态

这些能力 Webpack 和 Vite 更完整。

所以 Rollup 更适合作为生产构建底层，或者库构建工具，而不是直接作为复杂应用的开发工具。

---

## Vite 和 Rollup 的关系

Vite 开发环境利用浏览器原生 ESM，不预打包业务源码。

但生产构建时，Vite 默认使用 Rollup。

```text
开发环境：Vite Dev Server + esbuild
生产构建：Rollup
```

这也是 Vite 能兼顾开发体验和生产产物质量的重要原因。

---

## 总结

Rollup 的一句话理解：

> 我要生成最干净的 JavaScript。

它适合库、SDK、组件库，不是复杂应用开发的首选。

如果你要发布 npm 包，Rollup 仍然是非常稳的选择。
