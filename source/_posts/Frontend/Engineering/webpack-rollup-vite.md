---
title: Webpack、Rollup 和 Vite：前端构建工具的三个时代
date: 2026-05-27 16:10:00
categories:
  - Frontend
  - Engineering
tags:
  - Webpack
  - Rollup
  - Vite
  - esbuild
  - 前端工程化
  - 构建工具
---

## 前言

如果只用一句话理解 Webpack、Rollup 和 Vite：

| 工具 | 核心定位 |
| --- | --- |
| Webpack | 万物皆模块 |
| Rollup | 极致打包库 |
| Vite | 利用浏览器 ESM 的新一代开发工具 |

它们不是简单的“谁替代谁”，而是分别代表了前端工程化的几个阶段：

- Webpack 解决的是：前端所有资源如何统一工程化。
- Rollup 解决的是：库代码如何输出得更干净、更适合分发。
- Vite 解决的是：现代浏览器已经支持 ESM，开发时为什么还要先整体打包。

---

## Webpack：前端工程化的统治者

Webpack 真正伟大的地方，不只是能打包 JavaScript，而是它第一次把前端里的各种资源都纳入了统一的模块系统。

在 Webpack 之前，前端资源常常是割裂的：

```text
JS 是 JS
CSS 是 CSS
图片是图片
字体是字体
```

Webpack 之后，所有资源都可以被当成模块处理：

```js
import "./index.css";
import logo from "./logo.png";
```

这在当时是一次很大的变化。

## Webpack 的核心思想

Webpack 会从入口文件开始，递归分析依赖，构建完整的依赖图。

```text
index.js
├── app.js
│   ├── button.js
│   └── modal.js
└── utils.js
```

它会把这些模块全部分析出来，再根据配置输出最终 bundle。

## Loader 和 Plugin

Webpack 的两个核心扩展机制是 Loader 和 Plugin。

Loader 用来处理“不是 JavaScript 的东西”：

| Loader | 作用 |
| --- | --- |
| babel-loader | 编译新版本 JavaScript |
| ts-loader | 编译 TypeScript |
| css-loader | 处理 CSS import |
| sass-loader | 编译 Sass |
| file-loader | 处理图片、字体等资源 |

Plugin 用来介入构建生命周期：

- 压缩代码
- 注入 HTML
- 处理环境变量
- 抽离 CSS
- 实现 HMR
- 分析构建产物

Webpack 强就强在：它几乎能处理所有前端工程问题。

## Webpack 的问题

Webpack 的核心问题也来自它的架构：开发时通常需要先整体分析、整体打包，再启动 dev server。

```text
读取入口
  ↓
构建完整依赖图
  ↓
处理所有模块
  ↓
生成 bundle
  ↓
启动开发服务
```

项目越大，这个过程越重。

尤其当项目里有大量：

- `node_modules`
- TypeScript
- Babel 编译
- CSS 预处理
- 大量业务模块

启动和 HMR 都会变慢。

---

## Rollup：库打包之王

Rollup 的定位和 Webpack 不一样。

Webpack 更像是应用构建工具，它想接管整个前端工程。

Rollup 更像是 ESM 优化器，它更关注一件事：

> 如何生成更干净、更小、更适合发布的库代码。

## 为什么 Rollup Tree Shaking 强

Rollup 从设计上就围绕 ESModule 展开。

ESModule 是静态模块系统，`import` 和 `export` 关系在编译阶段就能确定。

比如：

```js
export const add = () => {};
export const minus = () => {};
```

如果使用方只引入：

```js
import { add } from "my-lib";
```

Rollup 可以更容易判断 `minus` 没有被使用，从而把它删掉。

这就是 Rollup 擅长 Tree Shaking 的根本原因。

## Rollup 适合什么

| 场景 | 是否适合 |
| --- | --- |
| SDK | 适合 |
| npm 工具库 | 适合 |
| UI 组件库 | 适合 |
| 框架源码打包 | 适合 |
| 复杂业务应用 | 不太适合 |

React、Vue、Three.js 等库都使用过 Rollup 或与 Rollup 相关的构建方案，就是因为它的产物更适合分发给别人使用。

## 为什么应用开发不常直接用 Rollup

Rollup 并不是不能打包应用，而是不擅长做复杂应用开发体验。

它的短板主要在：

- Dev Server 能力不是核心优势
- HMR 体验不如 Vite、Webpack
- 复杂资源处理能力不如 Webpack
- 应用级插件生态不如 Webpack 成熟

所以 Rollup 的最佳位置是库构建，而不是大型业务应用的开发服务器。

---

## Vite：新时代的构建工具

Vite 真正革命的地方是：

> 开发环境不打包。

这和 Webpack 的思路完全不同。

## Webpack 怎么启动

Webpack 开发时通常是：

```text
先分析全部依赖
  ↓
全部打包
  ↓
启动 dev server
  ↓
浏览器加载 bundle
```

所以项目越大，启动越慢。

## Vite 怎么启动

Vite 利用浏览器原生 ESModule。

```js
import Button from "./Button";
```

浏览器看到这个 import 后，会自己请求 `Button` 对应的模块。

Vite Dev Server 只需要在浏览器请求某个模块时，按需把它编译成浏览器能执行的 JavaScript。

```text
浏览器请求模块
  ↓
Vite 按需编译
  ↓
返回 ESM
  ↓
浏览器执行
```

这就是 Vite 启动快的核心原因：

> 它不是打包得更快，而是开发时根本不先打包。

---

## Vite 为什么使用 esbuild

浏览器虽然支持 ESM，但并不直接认识所有工程源码。

比如浏览器不认识：

- TypeScript 类型标注
- JSX
- 部分新语法降级
- CommonJS 依赖

所以 Vite 仍然需要编译转换。

这里 esbuild 的作用主要是做高速 transform：

```text
TS → JS
JSX → JS
CommonJS → ESM
依赖预构建
```

注意，开发阶段的 esbuild 主要不是在做完整应用打包，而是在做非常快的单文件转换和依赖预构建。

## esbuild 为什么快

esbuild 快主要有几个原因：

- 使用 Go 编写，原生并发能力强
- AST 和内存模型高度优化
- 内置常见语法转换，不依赖大量 JavaScript 插件链
- 专注快速转换，不追求覆盖 Babel 那样复杂的全部编译场景

所以它非常适合被 Vite 用作底层编译能力。

---

## Vite HMR 为什么特别快

很多人会把 Vite 快简单理解成：

> Vite 快 = esbuild 快。

这个说法只说对了一半。

Vite HMR 快的核心其实是：

> 开发时不打包，加上模块粒度更新。

Webpack 的 HMR 仍然运行在 bundle 体系里。改一个文件后，Webpack 需要重新计算受影响模块、重新生成相关 chunk，再把更新发送给浏览器。

Vite 则更接近源码模块本身。

如果只改了一个 `Button.tsx`：

```text
Webpack：改一个文件 → 影响 bundle/chunk → 重新生成更新
Vite：改一个文件 → 浏览器重新请求这个模块
```

其它没有变化的模块不需要重新处理。

所以 Vite HMR 快，不是因为“重新打包更快”，而是因为“根本不重新打包”。

## node_modules 为什么也变快

传统 Webpack 项目里，`node_modules` 也会参与大量依赖分析。

Vite 会在第一次启动时做依赖预构建：

```text
CommonJS / 多入口依赖
  ↓
esbuild 预构建
  ↓
转换成 ESM
  ↓
缓存起来
```

后续启动或更新时，如果依赖没有变化，就可以直接复用缓存。

这也是 Vite 开发体验好的重要原因。

---

## 开发和生产构建的区别

Vite 开发环境和生产环境底层策略不同。

开发环境：

```text
浏览器原生 ESM
  ↓
Vite Dev Server
  ↓
esbuild 快速 transform
  ↓
按需返回模块
```

生产环境：

```text
源码
  ↓
Rollup 打包
  ↓
代码分割 / Tree Shaking / 压缩
  ↓
输出静态资源
```

也就是说，现代前端常见组合其实是：

```text
Vite 负责开发体验
Rollup 负责生产构建
esbuild 负责高速编译能力
```

---

## 三者现在的真正定位

| 工具 | 真正定位 |
| --- | --- |
| Webpack | 老工程生态王，复杂工程仍然强 |
| Rollup | 库、SDK、组件库构建王 |
| Vite | 现代应用开发首选 |

Webpack 没有死。

它在很多场景仍然很强：

- 企业老项目维护
- 高度定制构建
- 复杂插件体系
- Module Federation
- 微前端架构
- 特殊资源处理流程

只是对于大多数现代新项目来说，Vite 的开发体验更好，配置成本更低。

---

## 一句话总结

Webpack：

> 我来接管整个前端世界。

Rollup：

> 我要生成最干净的 JavaScript。

Vite：

> 既然浏览器已经支持 ESM，那开发时为什么还要先打包？

Vite HMR 快的本质不是“打包更快”，而是“开发时不打包”。esbuild 的价值，是把每一次按需转换做得足够快。
