---
title: Less、Sass、SCSS 与 CSS 的区别与选择
date: 2026-01-07 10:45:42
categories:
  - Frontend
  - CSS
tags:
  - CSS
  - Less
  - Sass
  - SCSS
  - CSS预处理器
---

## 📚 前言

在前端开发中，CSS 是样式的基础，但随着项目复杂度增加，原生 CSS 的局限性逐渐显现。**CSS 预处理器**（Less、Sass/SCSS）应运而生，它们扩展了 CSS 的能力，让样式编写更高效、更易维护。

---

## 🎯 快速对比

| 特性         | CSS            | Less    | Sass         | SCSS         |
| ------------ | -------------- | ------- | ------------ | ------------ |
| **语法**     | 原生           | 类 CSS  | 缩进式       | 类 CSS       |
| **变量**     | `--var` (CSS3) | `@var`  | `$var`       | `$var`       |
| **嵌套**     | ❌             | ✅      | ✅           | ✅           |
| **Mixin**    | ❌             | ✅      | ✅           | ✅           |
| **函数**     | 有限           | ✅      | ✅           | ✅           |
| **运行环境** | 浏览器原生     | Node.js | Node.js/Dart | Node.js/Dart |
| **文件后缀** | `.css`         | `.less` | `.sass`      | `.scss`      |

---

## 🌐 CSS - 样式的基础

**CSS（Cascading Style Sheets）** 是浏览器原生支持的样式语言。

### 原生 CSS 示例

```css
:root {
  --primary-color: #3498db;
  --spacing: 16px;
}

.button {
  background-color: var(--primary-color);
  padding: var(--spacing);
  border: none;
  border-radius: 4px;
}

.button:hover {
  background-color: #2980b9;
}

.button-large {
  padding: calc(var(--spacing) * 2);
}
```

### CSS 的局限性

- ❌ 无法嵌套选择器（需要重复写父选择器）
- ❌ 没有真正的变量运算能力（CSS 变量功能有限）
- ❌ 无法复用代码块（没有 Mixin）
- ❌ 缺乏模块化机制
- ❌ 没有条件语句和循环

---

## 💚 Less - 简单易上手

**Less（Leaner Style Sheets）** 是一种 CSS 预处理器，语法接近 CSS，学习成本低。

### Less 核心特性

#### 1. 变量

```less
// 定义变量
@primary-color: #3498db;
@spacing: 16px;
@font-stack: "Helvetica", sans-serif;

.button {
  background-color: @primary-color;
  padding: @spacing;
  font-family: @font-stack;
}
```

#### 2. 嵌套

```less
.nav {
  background: #333;

  ul {
    list-style: none;
    margin: 0;
  }

  li {
    display: inline-block;

    a {
      color: white;
      text-decoration: none;

      &:hover {
        color: @primary-color;
      }
    }
  }
}
```

#### 3. Mixin（混入）

```less
// 定义 Mixin
.border-radius(@radius: 4px) {
  border-radius: @radius;
  -webkit-border-radius: @radius;
  -moz-border-radius: @radius;
}

.flex-center() {
  display: flex;
  justify-content: center;
  align-items: center;
}

// 使用 Mixin
.card {
  .border-radius(8px);
  .flex-center();
}
```

#### 4. 运算

```less
@base-size: 16px;

.container {
  width: 100% - 20px;
  padding: @base-size * 2;
  margin: @base-size / 2;
}
```

#### 5. 导入

```less
// styles.less
@import "variables.less";
@import "mixins.less";
@import "components/button.less";
```

### Less 使用方式

```bash
# 安装
npm install less -D

# 编译
npx lessc styles.less styles.css

# 或在构建工具中使用
npm install less-loader -D  # webpack
```

---

## 💜 Sass vs SCSS - 同源不同语法

**Sass（Syntactically Awesome Style Sheets）** 有两种语法：

| 语法                  | 文件后缀 | 特点                     |
| --------------------- | -------- | ------------------------ |
| **Sass**（缩进语法）  | `.sass`  | 用缩进代替大括号，无分号 |
| **SCSS**（Sassy CSS） | `.scss`  | 完全兼容 CSS 语法        |

### Sass 语法（缩进式）

```sass
// variables.sass
$primary-color: #9b59b6
$spacing: 16px

// 嵌套 - 用缩进表示层级
.nav
  background: #333

  ul
    list-style: none

  li
    display: inline-block

    a
      color: white

      &:hover
        color: $primary-color

// Mixin
=border-radius($radius)
  border-radius: $radius

.card
  +border-radius(8px)
```

### SCSS 语法（推荐）

```scss
// variables.scss
$primary-color: #9b59b6;
$spacing: 16px;
$breakpoints: (
  "mobile": 320px,
  "tablet": 768px,
  "desktop": 1024px,
);

// 嵌套
.nav {
  background: #333;

  ul {
    list-style: none;
  }

  li {
    display: inline-block;

    a {
      color: white;

      &:hover {
        color: $primary-color;
      }
    }
  }
}
```

### SCSS 核心特性

#### 1. Mixin 与 Include

```scss
// 定义 Mixin
@mixin flex-center($direction: row) {
  display: flex;
  flex-direction: $direction;
  justify-content: center;
  align-items: center;
}

@mixin respond-to($breakpoint) {
  @if map-has-key($breakpoints, $breakpoint) {
    @media (min-width: map-get($breakpoints, $breakpoint)) {
      @content;
    }
  }
}

// 使用 Mixin
.container {
  @include flex-center(column);

  @include respond-to("tablet") {
    flex-direction: row;
  }
}
```

#### 2. 继承（Extend）

```scss
// 基础样式
%button-base {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

// 继承
.button-primary {
  @extend %button-base;
  background: $primary-color;
  color: white;
}

.button-secondary {
  @extend %button-base;
  background: #95a5a6;
  color: white;
}
```

#### 3. 函数

```scss
// 内置函数
.element {
  color: darken($primary-color, 10%);
  background: lighten($primary-color, 20%);
  border-color: rgba($primary-color, 0.5);
}

// 自定义函数
@function rem($pixels) {
  @return $pixels / 16px * 1rem;
}

.text {
  font-size: rem(18px); // 输出: 1.125rem
  padding: rem(32px); // 输出: 2rem
}
```

#### 4. 条件与循环

```scss
// 条件语句
@mixin theme($mode) {
  @if $mode == "dark" {
    background: #1a1a1a;
    color: #ffffff;
  } @else {
    background: #ffffff;
    color: #1a1a1a;
  }
}

// 循环 - 生成工具类
@for $i from 1 through 5 {
  .mt-#{$i} {
    margin-top: $i * 8px;
  }
}

// 遍历 Map
$colors: (
  "primary": #3498db,
  "success": #2ecc71,
  "danger": #e74c3c,
);

@each $name, $color in $colors {
  .text-#{$name} {
    color: $color;
  }
  .bg-#{$name} {
    background-color: $color;
  }
}
```

#### 5. 模块化（@use 和 @forward）

```scss
// _variables.scss
$primary-color: #3498db;
$spacing: 16px;

// _mixins.scss
@use "variables" as vars;

@mixin button-style {
  padding: vars.$spacing;
  background: vars.$primary-color;
}

// main.scss
@use "variables" as *;
@use "mixins";

.button {
  @include mixins.button-style;
}
```

### Sass/SCSS 使用方式

```bash
# 安装 Dart Sass（推荐）
npm install sass -D

# 编译
npx sass src/styles.scss dist/styles.css

# 监听模式
npx sass --watch src:dist

# 在构建工具中使用
npm install sass-loader -D  # webpack
```

---

## 🔍 详细对比

### 语法差异

```less
// Less - 使用 @
@color: #3498db;
.mixin() {
  color: @color;
}
.box {
  .mixin();
}
```

```scss
// SCSS - 使用 $
$color: #3498db;
@mixin mixin {
  color: $color;
}
.box {
  @include mixin;
}
```

```sass
// Sass - 缩进语法
$color: #3498db
=mixin
  color: $color
.box
  +mixin
```

### 功能对比

| 功能       | Less          | Sass/SCSS                 |
| ---------- | ------------- | ------------------------- |
| 变量       | `@var`        | `$var`                    |
| Mixin 定义 | `.mixin()`    | `@mixin name`             |
| Mixin 调用 | `.mixin()`    | `@include name`           |
| 继承       | `:extend()`   | `@extend`                 |
| 条件语句   | `when`        | `@if/@else`               |
| 循环       | 有限支持      | `@for/@each/@while`       |
| 函数       | 内置 + 自定义 | 内置 + 自定义（更强大）   |
| 模块系统   | `@import`     | `@use/@forward`（更现代） |

---

## 🎯 如何选择？

### 选择 Less 如果：

- ✅ 团队熟悉 CSS，希望快速上手
- ✅ 项目简单，只需要变量和嵌套
- ✅ 使用 Ant Design 等基于 Less 的 UI 框架

### 选择 SCSS 如果：

- ✅ 需要强大的编程能力（循环、条件、函数）
- ✅ 大型项目需要更好的模块化
- ✅ 使用 Bootstrap、Element Plus 等基于 SCSS 的框架
- ✅ 团队已有 Sass/SCSS 经验

### 选择原生 CSS 如果：

- ✅ 小型项目或简单页面
- ✅ 追求零依赖
- ✅ 使用 CSS-in-JS 或 Tailwind CSS 等方案

---

## 🛠️ 现代 CSS 的崛起

随着 CSS 标准的发展，原生 CSS 也在增强：

```css
/* CSS 变量 */
:root {
  --primary: #3498db;
}

/* CSS 嵌套（Chrome 112+） */
.card {
  background: white;

  & .title {
    font-size: 1.5rem;
  }

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

/* CSS 容器查询 */
@container (min-width: 400px) {
  .card {
    display: flex;
  }
}
```

---

## 📊 生态与工具支持

| 工具    | Less        | Sass/SCSS   |
| ------- | ----------- | ----------- |
| Webpack | less-loader | sass-loader |
| Vite    | 内置支持    | 内置支持    |
| VS Code | 插件支持    | 插件支持    |
| PostCSS | 可配合使用  | 可配合使用  |

---

## 🧨 什么是 Mixin

Mixin（混入） 是 CSS 预处理器中的一种可复用代码块，类似于编程语言中的函数。你可以定义一组样式，然后在多个地方重复使用。

### 📊 类比理解

| 概念   | 编程语言       | CSS                | 预处理器 |
| ------ | -------------- | ------------------ | -------- |
| 定义   | function       | @mixin             |
| 调用   | functionName() | @include           |
| 参数   | 支持           | 支持               |
| 返回值 | 有             | 无（直接输出样式） |

### 💡 解决什么问题？

- 没有 Mixin 时：重复写相同代码
- 有了 Mixin：定义一次，到处使用，还能传参数！

```
// 定义
@mixin flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

// 使用
.button { @include flex-center; }
.card   { @include flex-center; }
.modal  { @include flex-center; }
```

### 🚀 Mixin 可以带参数

```
// 带参数的 Mixin
@mixin button($bg-color, $text-color: white) {
  background: $bg-color;
  color: $text-color;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
}

// 使用
.btn-primary {
  @include button(#3498db);        // 蓝色按钮
}

.btn-danger {
  @include button(#e74c3c);        // 红色按钮
}

.btn-custom {
  @include button(#2ecc71, #333);  // 自定义颜色
}
```

---

## 🎯 总结

```
需要 CSS 预处理器？
        │
        ├── 简单需求 + 快速上手 → Less
        │
        ├── 复杂需求 + 强大功能 → SCSS（推荐）
        │
        └── 极简项目 → 原生 CSS + CSS 变量
```

### 一句话建议

> **新项目推荐 SCSS**：语法兼容 CSS、功能强大、生态完善、是目前最主流的选择。

---

## 📚 相关资源

- [Less 官方文档](https://lesscss.org/)
- [Sass 官方文档](https://sass-lang.com/)
- [CSS 嵌套规范](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting)
- [PostCSS](https://postcss.org/) - CSS 转换工具
