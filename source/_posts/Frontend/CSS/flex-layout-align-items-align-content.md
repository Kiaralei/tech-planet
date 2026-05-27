---
title: Flex 布局里 align-items 和 align-content 到底有什么区别
date: 2026-05-27 10:00:00
categories:
  - Frontend
  - CSS
tags:
  - CSS
  - Flex
  - Flexbox
  - 布局
---

## 前言

Flex 布局里有两个很容易混淆的属性：

```css
align-items: center;
align-content: center;
```

它们看起来都和“交叉轴对齐”有关，也都经常被写在 flex 容器上。

但它们控制的对象完全不同：

| 属性 | 控制对象 | 什么时候生效 |
| --- | --- | --- |
| `align-items` | 每一行里的 flex item | 只要有 flex item 就会生效 |
| `align-content` | 多行 flex line 之间的整体分布 | 必须开启换行，并且真的产生多行 |

一句话总结：

> `align-items` 管 item，`align-content` 管 line。

---

## 先理解两个方向

Flex 布局有两个轴：

- 主轴：由 `flex-direction` 决定，默认是从左到右。
- 交叉轴：和主轴垂直，默认是从上到下。

默认情况下：

```css
.container {
  display: flex;
  flex-direction: row;
}
```

这时：

- 主轴是水平方向。
- 交叉轴是垂直方向。

所以很多人说：

> `align-items` 是控制垂直居中。

这个说法只在默认 `flex-direction: row` 时成立。更准确的说法应该是：

> `align-items` 控制 flex item 在交叉轴上的对齐方式。

---

## align-items 控制的是 item

看一个最常见的例子：

```css
.container {
  display: flex;
  height: 220px;
  align-items: center;
}
```

如果容器里只有一个元素：

```html
<div class="container">
  <div class="item">1</div>
</div>
```

这个元素依然会垂直居中。

原因很简单：

`align-items` 控制的是每个 item 在当前 flex line 里的交叉轴位置。

只要有 item，它就有东西可以控制。

---

## align-content 控制的是多行之间

再看这个例子：

```css
.container {
  display: flex;
  flex-wrap: wrap;
  height: 220px;
  align-content: center;
}
```

很多人以为只要写了：

```css
flex-wrap: wrap;
```

`align-content` 就一定会生效。

其实不是。

`flex-wrap: wrap` 只是允许换行，但不代表已经换行。

`align-content` 真正需要的是：

1. 开启换行：`flex-wrap: wrap`
2. 实际产生多行：内容宽度超过容器宽度，真的排成两行或更多行

如果容器里只有一个元素，或者所有元素都在同一行里，那么页面上只有一条 flex line。

这时没有“多行之间”的空间可以分配。

所以 `align-content` 看起来就像没有生效。

---

## Demo 1：只有一行时，align-content 不明显

下面这个 demo 同时写了：

```css
align-items: center;
align-content: center;
```

但容器里只有一个 item，所以真正能看出效果的是 `align-items`。

<style>
.flex-blog-demo {
  box-sizing: border-box;
  width: 100%;
  margin: 20px 0;
  padding: 16px;
  border: 1px solid #d8dee9;
  background: #f8fafc;
}

.flex-blog-demo * {
  box-sizing: border-box;
}

.flex-blog-demo-title {
  margin: 0 0 12px;
  color: #334155;
  font-weight: 600;
}

.flex-blog-container {
  display: flex;
  gap: 12px;
  min-height: 220px;
  padding: 12px;
  border: 2px dashed #94a3b8;
  background:
    linear-gradient(to bottom, transparent 49%, rgba(239, 68, 68, 0.2) 50%, transparent 51%),
    #ffffff;
}

.flex-blog-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 56px;
  border-radius: 6px;
  background: #2563eb;
  color: #ffffff;
  font-weight: 700;
}

.demo-one-line {
  flex-wrap: wrap;
  align-items: center;
  align-content: center;
}

.demo-multi-line {
  flex-wrap: wrap;
  align-items: center;
  align-content: center;
}

.demo-multi-line .flex-blog-item {
  width: 30%;
}

.demo-content-space-between {
  flex-wrap: wrap;
  align-items: center;
  align-content: space-between;
}

.demo-content-space-between .flex-blog-item {
  width: 30%;
}

.demo-align-items-start {
  flex-wrap: wrap;
  align-items: flex-start;
  align-content: center;
}

.demo-align-items-start .flex-blog-item {
  width: 30%;
}

.demo-align-items-start .flex-blog-item:nth-child(2),
.demo-align-items-start .flex-blog-item:nth-child(5) {
  height: 88px;
}
</style>

<div class="flex-blog-demo">
  <p class="flex-blog-demo-title">只有一个 item：align-items 可以让 item 垂直居中，align-content 没有多行可控制</p>
  <div class="flex-blog-container demo-one-line">
    <div class="flex-blog-item">1</div>
  </div>
</div>

---

## Demo 2：真的产生多行后，align-content 才开始工作

现在让容器里出现多个 item，并且每个 item 宽度都比较大。

它们放不进一行，于是会变成多行：

```css
.container {
  display: flex;
  flex-wrap: wrap;
  height: 220px;
  align-content: center;
}

.item {
  width: 30%;
}
```

这时 `align-content: center` 控制的是所有行组成的整体，让这些 flex line 在交叉轴上居中。

<div class="flex-blog-demo">
  <p class="flex-blog-demo-title">多行 item：align-content 可以移动多行组成的整体</p>
  <div class="flex-blog-container demo-multi-line">
    <div class="flex-blog-item">1</div>
    <div class="flex-blog-item">2</div>
    <div class="flex-blog-item">3</div>
    <div class="flex-blog-item">4</div>
    <div class="flex-blog-item">5</div>
    <div class="flex-blog-item">6</div>
  </div>
</div>

---

## Demo 3：align-content 控制的是行与行之间的空间

如果把 `align-content` 换成 `space-between`：

```css
.container {
  display: flex;
  flex-wrap: wrap;
  height: 220px;
  align-content: space-between;
}
```

多行之间会被拉开。

注意：它不是把单个 item 拉开，而是在分配 flex line 之间的剩余空间。

<div class="flex-blog-demo">
  <p class="flex-blog-demo-title">align-content: space-between：分配多行之间的剩余空间</p>
  <div class="flex-blog-container demo-content-space-between">
    <div class="flex-blog-item">1</div>
    <div class="flex-blog-item">2</div>
    <div class="flex-blog-item">3</div>
    <div class="flex-blog-item">4</div>
    <div class="flex-blog-item">5</div>
    <div class="flex-blog-item">6</div>
  </div>
</div>

---

## Demo 4：align-items 和 align-content 可以同时生效

多行场景里，这两个属性并不冲突。

比如：

```css
.container {
  display: flex;
  flex-wrap: wrap;
  height: 220px;
  align-content: center;
  align-items: flex-start;
}
```

这里会发生两件事：

- `align-content: center` 让多行整体在容器中居中。
- `align-items: flex-start` 让每一行内部的 item 顶部对齐。

<div class="flex-blog-demo">
  <p class="flex-blog-demo-title">两者同时生效：align-content 管多行整体，align-items 管每一行里的 item</p>
  <div class="flex-blog-container demo-align-items-start">
    <div class="flex-blog-item">1</div>
    <div class="flex-blog-item">2</div>
    <div class="flex-blog-item">3</div>
    <div class="flex-blog-item">4</div>
    <div class="flex-blog-item">5</div>
    <div class="flex-blog-item">6</div>
  </div>
</div>

---

## 最容易记错的点

### 误区一：写了 flex-wrap，align-content 就会生效

不对。

`flex-wrap: wrap` 只是允许换行。

真正关键是有没有实际产生多行。

如果没有多行，`align-content` 没有控制对象。

### 误区二：align-content 是控制 item 垂直居中

不准确。

控制 item 的是 `align-items`。

控制多行整体分布的才是 `align-content`。

### 误区三：align-items 和 align-content 谁优先级更高

它们不是同一个维度的竞争关系。

`align-items` 看的是 item。

`align-content` 看的是 line。

当只有一行时，你通常只能看到 `align-items` 的效果。

当有多行时，它们可以同时生效。

---

## 最后总结

记住这个判断顺序：

1. 我现在是不是 flex 容器？
2. 主轴和交叉轴分别是什么方向？
3. 我想控制的是 item，还是多行 line？
4. 如果想用 `align-content`，是否真的产生了多行？

最终结论：

```text
align-items   -> 控制 item
align-content -> 控制多行 line
```

所以你看到“`align-content` 不生效”的时候，第一反应应该是：

> 当前 flex 容器里，真的有多行吗？
