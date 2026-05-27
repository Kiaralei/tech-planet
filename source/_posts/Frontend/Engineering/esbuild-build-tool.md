---
title: esbuild 详解：为什么它这么快
date: 2026-05-27 16:45:00
categories:
  - Frontend
  - Engineering
tags:
  - esbuild
  - 前端工程化
  - 构建工具
  - 编译器
---

## 前言

esbuild 是一个用 Go 编写的 JavaScript / TypeScript 打包和转换工具。

它最常见的定位是：

> 极快的底层编译能力。

很多现代工具并不是直接让开发者使用 esbuild，而是把它作为底层能力。

比如 Vite 就使用 esbuild 做依赖预构建和开发阶段的快速 transform。

---

## esbuild 能做什么

esbuild 主要能力包括：

- JavaScript 打包
- TypeScript 转 JavaScript
- JSX 转 JavaScript
- 代码压缩
- Sourcemap
- ESM / CJS 格式输出
- 静态资源 loader

简单示例：

```js
const esbuild = require("esbuild");

esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  minify: true,
  sourcemap: true,
  outfile: "dist/index.js",
});
```

命令行也可以直接使用：

```bash
esbuild src/index.ts --bundle --minify --outfile=dist/index.js
```

---

## esbuild 为什么快

esbuild 快主要有几个原因。

第一，它使用 Go 编写。

Go 有较好的原生并发能力，执行效率也比 JavaScript 工具链更接近系统级工具。

第二，它从设计上追求速度。

它的 AST、解析、打印代码等流程都围绕性能优化。

第三，它不追求 Babel 那种极致灵活的插件体系。

Babel 很强，但它的插件机制和完整语义转换能力会带来成本。

esbuild 更像是：

> 覆盖常见编译场景，并把速度做到极致。

---

## esbuild 和 Babel 的区别

| 维度 | esbuild | Babel |
| --- | --- | --- |
| 速度 | 极快 | 相对较慢 |
| 插件生态 | 有限 | 非常丰富 |
| TypeScript | 只擦除类型 | 可配合更多转换 |
| 语法转换 | 常见场景足够 | 更完整、更灵活 |
| 适合场景 | 构建底层、快速转换 | 深度语法转换、兼容老项目 |

esbuild 不是 Babel 的完全替代品。

如果项目需要复杂的 Babel 插件，比如某些实验性语法、宏、特殊框架转换，仍然可能需要 Babel。

---

## esbuild 和 Vite 的关系

Vite 里 esbuild 主要做两件事：

1. 开发阶段的快速源码转换
2. `node_modules` 依赖预构建

比如：

```text
TS / JSX
  ↓
esbuild transform
  ↓
浏览器可执行的 JS
```

以及：

```text
CommonJS 依赖
  ↓
esbuild 预构建
  ↓
ESM 依赖
```

Vite 快不是只因为 esbuild 快，但 esbuild 确实让 Vite 的按需编译体验更好。

---

## esbuild 适合什么

esbuild 适合：

- CLI 工具打包
- Node 工具脚本构建
- 简单库打包
- 开发工具底层 transform
- 对速度要求极高的构建流程

不太适合：

- 需要复杂插件生态的应用构建
- 需要精细 CSS 处理的大型应用
- 需要大量定制编译语义的项目

---

## 总结

esbuild 的一句话理解：

> 用极快的 transform 支撑现代前端工具链。

它非常快，但不是万能。

最常见、最稳妥的用法，是让 Vite、tsup 等上层工具使用它，而不是在复杂应用里直接手写大量 esbuild 配置。
