---
title: Webpack 详解：Module、Bundle、Chunk、Loader 和 Plugin
date: 2026-05-27 16:30:00
categories:
  - Frontend
  - Engineering
tags:
  - Webpack
  - 前端工程化
  - 构建工具
  - Bundle
  - Chunk
  - Loader
  - Plugin
---

## 前言

Webpack 的核心价值不是“把 JavaScript 打成一个文件”，而是：

> 把前端项目里的所有资源都纳入模块系统。

JavaScript、CSS、图片、字体、SVG、Sass、TypeScript，都可以通过 `import` 进入同一套依赖图。

```js
import "./index.css";
import logo from "./logo.png";
import { add } from "./utils";
```

这也是 Webpack 在前端工程化里长期占据核心位置的原因。

---

## Webpack 的核心思想

Webpack 会从入口文件开始，递归分析所有依赖，最终构建出一张模块依赖图。

```text
src/index.js
├── app.js
│   ├── button.js
│   └── modal.js
├── style.css
└── logo.png
```

然后 Webpack 会根据配置，把这些模块转换、合并、优化，输出到 `dist`。

```text
源码模块
  ↓
构建依赖图
  ↓
Loader 转换资源
  ↓
Plugin 介入构建流程
  ↓
生成 bundle
```

---

## 先理解几个核心概念

学 Webpack 时最容易混淆的是这几个词：

| 概念 | 含义 |
| --- | --- |
| Module | Webpack 眼里的模块，可能是 JS、CSS、图片、字体等 |
| Dependency Graph | 从入口递归分析出来的模块依赖图 |
| Chunk | 一组模块的集合，是 Webpack 内部组织打包结果的单位 |
| Bundle | 最终输出给浏览器加载的文件，通常由 chunk 生成 |
| Asset | 最终输出到 `dist` 目录的资源文件 |

可以先这样理解：

```text
Module 组成依赖图
  ↓
依赖图被拆成 Chunk
  ↓
Chunk 生成 Bundle / Asset
  ↓
浏览器加载最终产物
```

这些词不是装饰性术语，后面理解代码分割、缓存、性能优化都会用到。

---

## 什么是 Module

Module 是 Webpack 处理项目时的基本单位。

在 Webpack 里，模块不只等于 JavaScript 文件。

这些都可以是 module：

```text
src/index.js
src/App.tsx
src/style.css
src/logo.png
src/icon.svg
```

只要它能被入口文件直接或间接引用，Webpack 就会把它纳入模块系统。

比如：

```js
import App from "./App";
import "./style.css";
import logo from "./logo.png";
```

Webpack 会把 `App`、`style.css`、`logo.png` 都当成模块处理。

这就是“万物皆模块”的实际含义。

---

## 什么是 Dependency Graph

Dependency Graph 就是依赖图。

Webpack 从 `entry` 开始，遇到 `import`、`require` 等引用关系，就继续向下分析。

```text
index.js
├── App.tsx
│   ├── Header.tsx
│   ├── Button.tsx
│   └── app.css
└── utils.ts
```

这张图告诉 Webpack：

- 项目有哪些模块
- 模块之间怎么引用
- 哪些模块会被页面用到
- 哪些模块可以被拆分或优化

构建工具本质上不是“盲目拼文件”，而是基于依赖图做转换和优化。

---

## 什么是 Bundle

Bundle 是最终输出给浏览器加载的打包文件。

比如构建后可能得到：

```text
dist/
├── index.html
├── main.8f3a1.js
└── main.2c91a.css
```

这里的 `main.8f3a1.js` 就可以理解成一个 bundle。

它里面通常包含：

- 业务代码
- 模块包装函数
- Webpack runtime
- 被合并进来的依赖模块

所以“打包成 bundle”的意思是：

> 把依赖图里的模块转换并组合成浏览器可以加载的文件。

---

## 什么是 Chunk

Chunk 是 Webpack 内部组织模块的单位。

一个 chunk 最终通常会生成一个或多个 bundle 文件。

最简单的项目里，可能只有一个入口：

```js
module.exports = {
  entry: "./src/index.js",
};
```

构建结果可能只有一个主要 chunk：

```text
main chunk → main.js
```

但如果有多个入口：

```js
module.exports = {
  entry: {
    main: "./src/index.js",
    admin: "./src/admin.js",
  },
};
```

Webpack 就可能生成多个 chunk：

```text
main chunk  → main.js
admin chunk → admin.js
```

如果使用动态导入：

```js
import("./pages/About");
```

Webpack 还会生成异步 chunk：

```text
main.js
src_pages_About_js.js
```

这就是代码分割的基础。

---

## Chunk 和 Bundle 的区别

两者很容易混在一起，可以这样区分：

| 概念 | 更偏向 | 说明 |
| --- | --- | --- |
| Chunk | 构建过程中的逻辑分组 | Webpack 内部把模块分成几组 |
| Bundle | 构建后的物理文件 | 浏览器最终加载的 JS / CSS 文件 |

简单说：

```text
chunk 是 Webpack 怎么分组
bundle 是最后输出成什么文件
```

大多数情况下，一个 chunk 会生成一个 JS bundle。

但如果使用 CSS 抽离插件，一个 chunk 也可能同时生成：

```text
main chunk
├── main.js
└── main.css
```

所以 chunk 和 bundle 不是完全等价的。

---

## 什么是 Asset

Asset 是最终输出到构建目录里的资源。

比如：

```text
dist/
├── index.html
├── main.js
├── main.css
├── logo.a13f.png
└── fonts/icon.woff2
```

这些最终文件都可以叫 asset。

Webpack 5 内置了 Asset Modules，可以不用 `file-loader` 也能处理图片、字体等资源。

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.(png|jpg|svg)$/i,
        type: "asset/resource",
      },
    ],
  },
};
```

`asset/resource` 的意思是：把资源文件复制到输出目录，并返回最终访问地址。

---

## Entry 和 Output

`entry` 决定从哪里开始分析项目。

```js
module.exports = {
  entry: "./src/index.js",
};
```

`output` 决定打包结果输出到哪里。

```js
const path = require("path");

module.exports = {
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].[contenthash].js",
    clean: true,
  },
};
```

入口和出口解决的是最基础的问题：

> 从哪里开始，最终生成什么。

### 为什么 Webpack 可以有多个 entry

Webpack 的核心模型不是“一个项目只能打一个包”，而是：

> 从一个或多个入口出发，构建依赖图，然后生成一个或多个 bundle。

所以 `entry` 也可以写成对象：

```js
module.exports = {
  entry: {
    home: "./src/home.js",
    admin: "./src/admin.js",
  },
};
```

这表示 Webpack 会从两个入口开始分析：

```text
home  → ./src/home.js  → home 依赖的模块
admin → ./src/admin.js → admin 依赖的模块
```

默认情况下，它们会生成不同的入口产物：

```text
home.js
admin.js
```

多个 entry 常见于多页面应用：

```text
首页 index.html  → home.js
后台 admin.html → admin.js
```

真正要记住的是：

> entry 不是“项目入口”，而是“依赖图的起点”。

一个项目可以有多个业务入口，所以也可以有多个依赖图起点。

### 多个 entry 时，HTML 怎么知道加载谁

`index.html` 本身不会自动识别应该加载哪个 entry。

真正负责把打包产物插入 HTML 的，通常是 `HtmlWebpackPlugin`。

比如：

```js
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: {
    home: "./src/home.js",
    admin: "./src/admin.js",
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: "index.html",
      template: "./public/index.html",
      chunks: ["home"],
    }),
    new HtmlWebpackPlugin({
      filename: "admin.html",
      template: "./public/admin.html",
      chunks: ["admin"],
    }),
  ],
};
```

这里的关键是 `chunks`：

```js
chunks: ["home"]
```

它表示：

> 这个 HTML 只注入 `home` 这个入口相关的资源。

最终关系是：

```text
entry.home
  ↓
home.js
  ↓
index.html 通过 chunks: ["home"] 引入

entry.admin
  ↓
admin.js
  ↓
admin.html 通过 chunks: ["admin"] 引入
```

如果不写 `chunks`，`HtmlWebpackPlugin` 可能会把所有入口资源都注入同一个 HTML。

比如 `index.html` 同时引入：

```html
<script src="home.js"></script>
<script src="admin.js"></script>
```

这在多页面项目里通常不是你想要的。

所以多 entry 项目里一般要明确配置：

```js
chunks: ["当前页面需要的入口名"]
```

一句话总结：

> 多 entry 负责生成多个 bundle，HtmlWebpackPlugin 负责决定每个 HTML 引入哪些 bundle。

### 不用 HtmlWebpackPlugin 可以运行吗

可以。

`HtmlWebpackPlugin` 不是 Webpack 运行的必需品。

Webpack 本身只负责打包：

```js
module.exports = {
  entry: {
    home: "./src/home.js",
  },
  output: {
    filename: "[name].js",
  },
};
```

它会生成：

```text
dist/
  home.js
```

如果你自己写 HTML：

```html
<script src="./home.js"></script>
```

页面也可以正常运行。

但真实项目通常会使用 hash：

```js
output: {
  filename: "[name].[contenthash].js",
}
```

构建结果可能是：

```text
home.a8d31f.js
```

下一次构建又可能变成：

```text
home.b91c2a.js
```

这时如果手写 HTML，就要自己同步文件名。

除此之外，多入口、多公共 chunk、多 runtime chunk、CSS 抽离后，HTML 需要引入的资源可能不止一个：

```text
runtime.a1.js
vendors.b2.js
home.c3.js
home.d4.css
```

所以不用 `HtmlWebpackPlugin` 可以跑，但你需要自己维护 HTML 和构建产物之间的引用关系。

一句话：

> Webpack 负责打包，HtmlWebpackPlugin 负责把打包结果正确挂到 HTML 上。

---

## Loader：处理非 JS 资源

Webpack 原生只理解 JavaScript 和 JSON。

如果要处理 TypeScript、CSS、Sass、图片等资源，就需要 Loader。

| Loader | 作用 |
| --- | --- |
| babel-loader | 转换新版 JavaScript |
| ts-loader | 编译 TypeScript |
| css-loader | 让 CSS 支持 import |
| style-loader | 把 CSS 注入页面 |
| sass-loader | 编译 Sass |

示例：

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.scss$/,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
    ],
  },
};
```

注意 Loader 的执行顺序：

> 从右到左，从下到上。

所以上面的 Sass 处理顺序是：

```text
sass-loader → css-loader → style-loader
```

### Loader 什么时候运行

Loader 是针对“模块文件”的。

当 Webpack 从入口开始分析依赖图，遇到某个被 `import` 或 `require` 的文件时，会根据 `module.rules` 判断这个文件应该交给哪些 Loader 处理。

比如：

```js
import "./style.css";
import App from "./App.tsx";
```

对应配置：

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.tsx$/,
        use: "ts-loader",
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
};
```

运行过程可以理解为：

```text
Webpack 解析模块
  ↓
发现 import / require
  ↓
根据 module.rules 匹配文件
  ↓
执行对应 Loader
  ↓
把转换结果交回 Webpack
```

所以：

```text
App.tsx   → ts-loader
style.css → css-loader → style-loader
```

Loader 的核心职责是：

> 把某种文件转换成 Webpack 能理解的模块。

---

## Plugin：扩展构建生命周期

Loader 负责转换文件，Plugin 负责扩展构建流程。

常见 Plugin：

| Plugin | 作用 |
| --- | --- |
| HtmlWebpackPlugin | 自动生成 HTML 并注入资源 |
| MiniCssExtractPlugin | 抽离 CSS 文件 |
| DefinePlugin | 注入环境变量 |
| CompressionPlugin | 生成 gzip / brotli |
| BundleAnalyzerPlugin | 分析包体积 |

示例：

```js
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
  ],
};
```

Plugin 的强大之处在于它可以介入 Webpack 的各个构建阶段，所以 Webpack 能做非常复杂的工程定制。

### Plugin 什么时候运行

Plugin 是针对“构建流程”的。

Webpack 整个构建过程里有很多生命周期阶段：

```text
初始化 compiler
开始编译
解析模块
生成 chunk
优化资源
生成 asset
输出文件
构建完成
```

Plugin 会先注册到这些生命周期钩子上。

等 Webpack 编译流程走到对应阶段时，Plugin 的逻辑就会被触发。

比如：

```text
HtmlWebpackPlugin
  → 在生成资源阶段创建 HTML，并注入 JS / CSS

MiniCssExtractPlugin
  → 在构建过程中收集 CSS，最后生成独立 CSS 文件

DefinePlugin
  → 在编译阶段替换代码里的常量

CompressionPlugin
  → 在资源生成后压缩成 gzip / brotli
```

完整流程可以这样理解：

```text
Webpack 启动
  ↓
读取配置
  ↓
创建 compiler
  ↓
Plugin 注册生命周期钩子
  ↓
从 entry 开始构建依赖图
  ↓
遇到模块文件
  ↓
匹配并执行 Loader
  ↓
生成 chunk
  ↓
Plugin 参与优化 / 生成资源
  ↓
输出 bundle / asset
  ↓
Plugin 参与完成阶段
```

一句话区分：

> Loader 管“文件怎么变成模块”；Plugin 管“构建流程中还能做什么”。

### Webpack 开发时会执行 Plugin 吗

会。

Plugin 本质上是挂在 Webpack 编译生命周期上的钩子。

只要 Webpack 发生编译，Plugin 就有机会执行。

比如开发时运行：

```bash
webpack serve
```

或者：

```bash
webpack --watch
```

Webpack 都会创建 compiler，然后进入编译流程：

```text
初始化 compiler
  ↓
读取配置
  ↓
执行 plugin 注册的 hooks
  ↓
开始编译
  ↓
生成 chunk / asset
  ↓
输出或交给 dev server
```

所以开发环境里 `HtmlWebpackPlugin`、`DefinePlugin`、`ReactRefreshWebpackPlugin` 等都会执行。

但不是所有 Plugin 都适合开发环境开启。

比如：

```js
new MiniCssExtractPlugin()
new CompressionPlugin()
new BundleAnalyzerPlugin()
```

这些 Plugin 开发时也可以执行，但可能拖慢速度，所以通常只在生产环境启用：

```js
const isProd = process.env.NODE_ENV === "production";

module.exports = {
  plugins: [
    new HtmlWebpackPlugin(),
    isProd && new MiniCssExtractPlugin(),
    isProd && new CompressionPlugin(),
  ].filter(Boolean),
};
```

另外，`webpack-dev-server` 开发时产物通常在内存里，不一定真的写入 `dist`。

所以：

> 开发环境会执行 Plugin，但开发环境通常少开重型 Plugin，而且产物常由 dev server 在内存中提供。

### MiniCssExtractPlugin 的作用

`MiniCssExtractPlugin` 的作用是：

> 把 CSS 从 JS bundle 里抽离出来，生成独立的 `.css` 文件。

比如业务代码里引入 CSS：

```js
import "./style.css";
```

如果使用 `style-loader`：

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
};
```

CSS 会被打进 JS 里，运行时由 JS 插入页面。

如果使用 `MiniCssExtractPlugin`：

```js
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].[contenthash].css",
    }),
  ],
};
```

Webpack 会生成独立 CSS 文件：

```text
dist/
  main.js
  main.a1b2c3.css
```

这样做的好处是：

- CSS 可以独立缓存
- JS bundle 体积更小
- 样式不需要等 JS 执行后再插入
- 更适合生产环境长期缓存

开发环境常用 `style-loader`，因为热更新方便。

生产环境常用 `MiniCssExtractPlugin`，因为更利于缓存和加载性能。

---

## 代码分割：为什么会有多个 Chunk

如果所有代码都打成一个 bundle，项目变大后首屏加载会越来越慢。

代码分割解决的是：

> 不要一次性加载所有代码，而是按入口、公共依赖或路由拆分。

Webpack 常见代码分割来源有三种。

第一，多入口：

```js
module.exports = {
  entry: {
    main: "./src/index.js",
    admin: "./src/admin.js",
  },
};
```

第二，动态导入：

```js
button.onclick = () => {
  import("./dialog").then(({ openDialog }) => {
    openDialog();
  });
};
```

第三，`splitChunks` 抽离公共依赖：

```js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: "all",
    },
  },
};
```

这样 React、lodash 这类公共依赖就可以被拆到单独 chunk 里，避免重复打包。

---

## Tree Shaking 是怎么实现的

Tree Shaking 的目标是：

> 删除没有被使用的导出，减少最终 bundle 体积。

Webpack 的 Tree Shaking 主要依赖四件事：

```text
ESModule 静态分析
  ↓
标记 unused exports
  ↓
压缩器删除 dead code
  ↓
sideEffects 判断模块副作用
```

### 1. 依赖 ESModule 静态结构

比如：

```js
// math.js
export function add(a, b) {
  return a + b;
}

export function minus(a, b) {
  return a - b;
}
```

使用时：

```js
import { add } from "./math";

console.log(add(1, 2));
```

Webpack 可以在编译阶段看出来：

```text
add 被使用了
minus 没被使用
```

因为 ESModule 的 `import/export` 是静态结构。

CommonJS 就困难很多：

```js
const math = require("./math");

math[someKey]();
```

这里的 `someKey` 运行时才知道，构建阶段很难判断到底用了什么。

### 2. Webpack 标记 unused exports

Webpack 构建依赖图时，会分析每个模块的导出，并标记哪些导出被使用、哪些没有被使用。

这个能力对应：

```js
optimization: {
  usedExports: true,
}
```

生产模式下通常默认开启：

```js
module.exports = {
  mode: "production",
};
```

注意，这一步主要是“标记”，不是最终删除。

### 3. 压缩器真正删除代码

Webpack 标记完 unused exports 后，还需要压缩器做 Dead Code Elimination。

生产模式下 Webpack 默认会使用 TerserPlugin 压缩 JS。

所以完整流程是：

```text
Webpack 分析 ESM
  ↓
标记 unused exports
  ↓
Terser 删除 dead code
  ↓
最终 bundle 变小
```

### 4. sideEffects 判断模块能不能整块删除

有些模块虽然没有导出被使用，但它可能有副作用。

比如：

```js
import "./global.css";
```

或者：

```js
window.appVersion = "1.0.0";
```

这种模块不能随便删。

所以可以在 `package.json` 里声明：

```json
{
  "sideEffects": false
}
```

意思是：

> 这个包里的模块没有副作用，没用到就可以删除。

如果项目里有 CSS，需要保留：

```json
{
  "sideEffects": ["*.css"]
}
```

否则 CSS 可能被误判为无副作用而被删掉。

一句话总结：

> Webpack Tree Shaking = ESM 静态分析 + unused exports 标记 + 压缩器删除 + sideEffects 辅助判断模块副作用。

---

## Runtime 是什么

Webpack 输出的 bundle 里不只有业务代码，还会有一小段运行时代码，也就是 runtime。

runtime 负责：

- 管理模块加载
- 维护模块缓存
- 加载异步 chunk
- 处理动态导入
- 连接各个 bundle

可以粗略理解为：

> runtime 是 Webpack 在浏览器里运行模块系统所需要的小型加载器。

如果项目里有异步 chunk，runtime 就会负责在需要时插入 `<script>`，把对应 chunk 加载回来。

---

## Hash、ContentHash 和缓存

Webpack 常见输出文件名：

```js
module.exports = {
  output: {
    filename: "[name].[contenthash].js",
  },
};
```

`contenthash` 会根据文件内容生成 hash。

如果文件内容没变，hash 不变，浏览器可以继续使用缓存。

如果文件内容变了，hash 变化，浏览器会请求新文件。

```text
main.a1b2c3.js   内容没变 → 文件名不变 → 命中缓存
main.d4e5f6.js   内容变了 → 文件名变化 → 重新请求
```

这就是生产环境构建里经常使用 `[contenthash]` 的原因。

---

## Webpack 为什么慢

Webpack 开发时通常需要先构建完整依赖图，再生成开发环境 bundle。

```text
启动开发服务
  ↓
扫描入口
  ↓
分析所有依赖
  ↓
执行 Loader
  ↓
生成 bundle
  ↓
浏览器加载
```

项目越大，这个过程越重。

尤其是大型项目里常见的：

- 大量业务模块
- 大量 `node_modules`
- Babel 编译
- TypeScript 编译
- CSS 预处理
- 复杂插件链

都会增加启动和 HMR 成本。

---

## Webpack 适合什么场景

Webpack 现在仍然适合：

- 存量大型项目
- 企业复杂工程
- 对构建流程有深度定制需求
- 微前端和 Module Federation
- 需要依赖成熟插件生态的项目

Webpack 不一定是新项目的默认首选，但它仍然是复杂工程里的强力工具。

---

## 总结

Webpack 的一句话理解：

> 我来接管整个前端世界。

它的优势是生态成熟、能力完整、可定制性强。

它的问题是体系偏重，开发启动和 HMR 在大项目里容易变慢。

所以今天的选型可以这样理解：

- 新应用优先看 Vite
- 复杂存量项目继续用 Webpack
- 高度定制构建仍然可以选 Webpack
