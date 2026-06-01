---
title: 微信小程序 / 小游戏底层逻辑专栏
date: 2026-06-01 15:30:00
comments: false
---

这个专栏想解决的不是“某个 API 怎么用”，而是：

```txt
小程序和小游戏为什么要这样设计？
```

我们会从运行时、双线程、JSBridge、渲染链路、组件系统、框架编译和小游戏运行环境一路往下拆。

---

## 阅读路线

### 1. 运行时总览

- [微信小程序和小游戏底层逻辑：从运行时链路开始理解](/2026/06/01/Frontend/WeChat/wechat-miniprogram-minigame-runtime-overview/)

先建立整体地图：小程序运行在微信客户端里，逻辑层、渲染层和 Native 层分别承担什么职责，小程序和小游戏在运行环境上有什么差异。

### 2. 双线程架构

- [微信小程序双线程架构详解：逻辑层、渲染层和 setData 链路](/2026/06/01/Frontend/WeChat/wechat-miniprogram-two-thread-runtime/)

理解小程序为什么把逻辑和渲染隔离，`setData` 为什么不是普通赋值，以及这种架构如何帮助微信做平台适配。

### 3. JSBridge 与原生能力

- [微信小程序 JSBridge 详解：wx API 如何调用原生能力](/2026/06/01/Frontend/WeChat/wechat-jsbridge-wx-api-native-capability/)

拆开 `wx.login`、`wx.scanCode`、`wx.request` 这类 API 背后的调用链路，看 JS 如何通过微信基础库和 Native 层拿到系统能力。

### 4. 页面渲染与组件系统

- WXML / WXSS 如何变成可渲染结构
- 组件树、数据绑定和事件通信
- 自定义组件为什么有自己的生命周期

### 5. 框架层：uni-app / Taro

- uni-app、Taro 站在哪一层
- 跨端框架如何把 Vue / React 写法编译成小程序代码
- 框架抹平了什么差异，又暴露了什么限制

### 6. 小游戏运行环境

- 小游戏为什么更接近 Canvas + JS Runtime
- 游戏循环、资源加载和渲染管线
- 小程序和小游戏在能力模型上的差异

---

## 专栏主线

```txt
微信宿主环境
  ↓
小程序 / 小游戏运行时
  ↓
逻辑层与渲染层隔离
  ↓
setData 通信链路
  ↓
JSBridge 调用 Native 能力
  ↓
页面渲染与组件系统
  ↓
uni-app / Taro 跨端编译
  ↓
小游戏运行机制
```

---

## 一句话

学习微信小程序和小游戏底层逻辑，本质是在理解：前端代码如何被微信客户端接管、约束、调度，并最终映射到不同平台的原生能力上。
