---
title: 微信小程序 JSBridge 详解：wx API 如何调用原生能力
date: 2026-06-01 15:10:00
categories:
  - Frontend
  - WeChat
tags:
  - 微信小程序
  - JSBridge
  - wx API
  - Native
  - 小程序运行时
  - 前端工程化
---

## 📚 前言

前两篇我们先建立了两条主线：

```txt
小程序运行在微信客户端宿主环境里
```

以及：

```txt
小程序页面由逻辑层和渲染层共同完成
```

这一篇继续往下讲：

> 小程序里的 `wx.xxx` API，为什么能调用微信和系统的原生能力？

比如：

```js
wx.login()
wx.scanCode()
wx.getLocation()
wx.chooseImage()
```

这些 API 看起来像普通 JS 函数。

但它们本质上不是普通 JS 工具函数。

它们背后连接的是：

```txt
微信客户端 Native 能力
```

这中间的通信桥梁，就是：

```txt
JSBridge
```

---

## 一、先用一句话理解 JSBridge

JSBridge 可以理解为：

```txt
JS 和 Native 之间的通信通道
```

在小程序里，大概是：

```txt
小程序 JS
  ↓
微信基础库
  ↓
JSBridge
  ↓
微信客户端 Native
  ↓
iOS / Android 系统能力
```

更直白一点：

> JSBridge 让 JS 可以请求微信客户端帮它做一些浏览器 JS 做不了的事。

比如 JS 本身不能直接打开微信支付。

但它可以发起请求：

```txt
我要调用支付
```

然后微信 Native 层去处理真正的支付流程。

---

## 二、为什么需要 JSBridge

普通 JS 的能力是有限的。

在浏览器里，JS 主要能做：

- 操作页面
- 发网络请求
- 使用浏览器开放的 Web API
- 使用部分设备能力

但很多能力不应该直接开放给网页。

比如：

- 微信登录态
- 微信支付
- 扫码
- 相册
- 相机
- 蓝牙
- 文件系统
- 分享
- 订阅消息

这些能力涉及：

```txt
用户隐私
账号安全
支付安全
系统权限
平台差异
```

所以不能让 JS 随便直接调用系统底层 API。

微信采用的方式是：

```txt
JS 只能调用微信定义好的 wx API
真正执行由微信 Native 层完成
```

这就是 JSBridge 存在的原因。

---

## 三、wx API 不是普通函数

看一个例子：

```js
wx.scanCode({
  success(res) {
    console.log(res.result)
  }
})
```

从写法上看，它像一个普通函数。

但底层更像一次跨端请求：

```txt
JS 调用 wx.scanCode
  ↓
微信基础库检查参数
  ↓
通过 JSBridge 发给 Native
  ↓
Native 打开扫码界面
  ↓
用户完成扫码
  ↓
Native 拿到扫码结果
  ↓
结果通过 JSBridge 回到 JS
  ↓
执行 success 回调
```

所以 `wx.scanCode` 不是：

```txt
JS 自己完成扫码
```

而是：

```txt
JS 请求微信客户端代为扫码
```

---

## 四、一次 wx API 调用的完整链路

可以把一次 API 调用拆成五步。

### 1. JS 发起调用

开发者写：

```js
wx.getLocation({
  type: 'gcj02',
  success(res) {
    console.log(res.latitude, res.longitude)
  }
})
```

### 2. 基础库封装请求

微信基础库会处理：

- API 名称
- 参数
- 回调
- 调用上下文
- 调用 ID

可以理解成生成一条消息：

```txt
{
  api: "getLocation",
  params: {
    type: "gcj02"
  },
  callbackId: "callback_001"
}
```

这里的结构只是帮助理解，不代表真实内部协议完全长这样。

### 3. JSBridge 发送消息

基础库把这条请求通过 JSBridge 发给 Native。

```txt
JS → JSBridge → Native
```

### 4. Native 执行能力

Native 层根据 API 类型做不同事情。

比如定位：

```txt
调用定位模块
  ↓
拿到定位结果
```

比如扫码：

```txt
打开扫码页面
  ↓
调用相机
  ↓
识别二维码
  ↓
返回扫码结果
```

### 5. Native 回传结果

Native 执行完成后，把结果通过 JSBridge 回传给 JS。

```txt
Native → JSBridge → JS callback
```

于是触发：

```js
success(res) {}
```

或者：

```js
fail(err) {}
complete(res) {}
```

这条链路可以先用一张图记住：

![微信小程序 JSBridge 通信链路](/images/wechat/jsbridge-call-chain.svg)

---

## 五、JSBridge 通信到底是怎么实现的

前面一直在说：

```txt
JSBridge 把 JS 请求发给 Native
```

但这句话还不够底层。

更准确地说，JSBridge 通常由三部分组成：

```txt
JS 侧桥对象
Native 侧桥模块
一套消息协议
```

在小程序里，开发者看到的是：

```js
wx.scanCode()
```

但 `wx.scanCode` 背后不是直接调用系统扫码能力，而是微信基础库帮你把调用转换成一条“消息”。

### 1. Native 先创建 JS Runtime

先回答一个很容易卡住的问题：

> 小程序逻辑层没有 DOM，那 JSBridge 怎么通信？

关键是：

```txt
JSBridge 不一定依赖 DOM。
```

DOM、`postMessage`、`MessageHandler` 这些更常出现在 WebView 场景里。

但小程序逻辑层更像是：

```txt
微信 Native App
  ↓
创建一个 JS Runtime
  ↓
往这个 Runtime 里注入通信能力
  ↓
加载微信基础库
  ↓
执行开发者的小程序 JS
```

也就是说，小程序 JS 不是直接跑在普通浏览器页面里。

它跑在微信自己管理的 JS 运行环境中。

概念上类似：

```txt
微信小程序逻辑层 =
JS Runtime
+ 微信基础库
+ Native 注入的 JSBridge
+ 开发者 JS 代码
```

这层关系可以先看成下面这张图：

![微信小程序逻辑层运行模型](/images/wechat/js-runtime-base-library.svg)

这里的 JS Runtime 可以理解成一个能执行 JavaScript 的环境。

Native 程序可以通过嵌入 JS 引擎来创建它，比如 JavaScriptCore、V8、QuickJS、Hermes 这类引擎。

伪代码大概像这样：

```js
const runtime = createJavaScriptRuntime()

runtime.inject('WeixinJSBridge', nativeBridge)
runtime.evaluate(wechatBaseLibraryCode)
runtime.evaluate(developerAppCode)
```

真实微信内部实现不会这么简单，但模型可以这样理解。

### 2. Native 给 JS 注入桥能力

小程序 JS 运行在微信提供的 JS 运行环境里。

这个环境不是完全裸的 JavaScript。

微信客户端会在运行时准备好一些平台对象和通信能力，比如：

```txt
wx
WeixinJSBridge
其他内部基础库对象
```

你可以把它理解成：

```txt
Native 先把一根“通信线”接进 JS 环境
```

所以 JS 才能调用：

```js
wx.getLocation()
wx.scanCode()
```

如果没有这层注入，普通 JavaScript 是不知道 `wx` 是什么的。

### 3. 微信基础库先搭好运行框架

这里还要区分两个东西：

```txt
微信基础库
开发者写的小程序 JS
```

它们通常运行在同一个逻辑层 JS Runtime 里。

但角色不是平级的。

可以理解成：

```txt
微信基础库先加载
  ↓
提供 App / Page / Component / wx / setData 等接口
  ↓
开发者 JS 后加载
  ↓
调用这些接口注册应用、页面、组件和事件
```

所以你能在小程序里直接写：

```js
App({})
Page({})
Component({})
wx.scanCode({})
```

不是因为 JavaScript 原生就有这些函数。

而是微信基础库提前放进了运行环境。

比如 `Page` 可以理解成：

```js
globalThis.Page = function page(pageOptions) {
  registerPage(pageOptions)
}
```

开发者写的：

```js
Page({
  data: {
    count: 0
  },
  onLoad() {},
  add() {}
})
```

本质是在告诉基础库：

```txt
这里有一个页面
它有哪些 data
它有哪些生命周期
它有哪些事件处理函数
```

所以基础库和业务代码的关系更像：

```txt
同一个 JS Runtime
  ├─ 微信基础库：先加载，负责提供运行时 API 和调度能力
  └─ 业务 JS：后加载，调用基础库 API 注册页面和执行逻辑
```

普通业务计算不需要 Native：

```js
const total = list.reduce((sum, item) => sum + item.price, 0)
```

但如果涉及微信能力、页面更新、生命周期调度、事件传递等，就会由基础库和 Native / 渲染层协作。

### 4. wx API 会被基础库包装成标准消息

比如开发者写：

```js
wx.scanCode({
  onlyFromCamera: true,
  success(res) {
    console.log(res.result)
  }
})
```

基础库不会把 `success` 函数直接丢给 Native。

因为 JS 函数不能像普通数据一样跨到 Native 层执行。

它通常会做两件事：

```txt
保存回调函数
生成 callbackId
```

可以理解成这样：

```js
const callbackId = 'scanCode_10001'

callbackMap[callbackId] = {
  success,
  fail,
  complete
}
```

然后把真正能跨层传递的数据整理成消息：

```js
{
  api: 'scanCode',
  params: {
    onlyFromCamera: true
  },
  callbackId: 'scanCode_10001'
}
```

这里的结构是帮助理解的伪代码，不代表微信内部真实协议完全长这样。

关键点是：

```txt
跨桥传的是可序列化消息，不是 JS 函数本身。
```

### 5. 消息通过宿主提供的通道送到 Native

JSBridge 的“桥”，本质上就是宿主环境提供的一条跨语言通信通道。

在普通 WebView 容器里，常见实现方式可能包括：

```txt
iOS：WKScriptMessageHandler、evaluateJavaScript
Android：addJavascriptInterface、evaluateJavascript
历史方案：拦截 URL Scheme、prompt 拦截
```

小程序内部实现会更复杂，也不一定等同于普通 H5 WebView 的某一种方案。

但抽象模型是类似的：

```txt
JS 把消息交给宿主
宿主把消息交给 Native
Native 解析消息并执行对应能力
```

所以这一步不是浏览器网络请求，也不是 JS import。

它是：

```txt
JS 运行环境和微信客户端 Native 之间的进程内 / 宿主内通信
```

### 6. Native 收到消息后做分发

Native 拿到消息后，会看：

```txt
api 是什么
参数是否合法
当前小程序是否有权限
当前平台是否支持
当前调用时机是否允许
```

然后进入不同的原生模块。

比如：

```txt
scanCode → 扫码模块
getLocation → 定位模块
chooseImage → 相册 / 相机模块
request → 网络模块
login → 登录态模块
```

这一步可以理解成 Native 侧有一个分发器：

```txt
收到 scanCode 消息
  ↓
找到扫码能力处理器
  ↓
检查权限和参数
  ↓
调用 iOS / Android 对应实现
```

也正是因为 Native 层在这里做了分发和适配，JS 侧才可以始终写统一的 `wx.xxx`。

### 7. Native 执行完后带着 callbackId 回来

扫码、定位、选图这类能力不可能同步返回。

Native 执行完成后，会把结果再包装成一条回传消息：

```js
{
  callbackId: 'scanCode_10001',
  status: 'success',
  data: {
    result: 'https://example.com'
  }
}
```

然后通过反向通道通知 JS。

JS 侧基础库收到结果后：

```txt
根据 callbackId 找到之前保存的回调
  ↓
如果 status 是 success，执行 success
  ↓
如果 status 是 fail，执行 fail
  ↓
最后执行 complete
  ↓
清理 callbackMap
```

伪代码大概是：

```js
function onNativeCallback(message) {
  const handlers = callbackMap[message.callbackId]

  if (!handlers) return

  if (message.status === 'success') {
    handlers.success?.(message.data)
  } else {
    handlers.fail?.(message.error)
  }

  handlers.complete?.(message.data || message.error)
  delete callbackMap[message.callbackId]
}
```

所以 `success` 不是 Native 直接调用你的 JS 函数。

更准确地说是：

```txt
Native 回传 callbackId 和结果
基础库在 JS 侧找到对应函数再执行
```

### 8. 为什么 JSBridge 调用大多是异步的

因为中间隔了 Native，而且 Native 可能还要继续调用系统能力。

比如扫码：

```txt
JS 发起 scanCode
  ↓
Native 打开相机
  ↓
用户对准二维码
  ↓
系统识别
  ↓
Native 拿到结果
  ↓
回传 JS
```

这个过程完全不可能像下面这样同步返回：

```js
const result = wx.scanCode()
```

所以小程序 API 早期大量使用：

```js
success / fail / complete
```

后来很多 API 也可以被框架或开发者包装成 Promise，本质仍然是在等 Native 回调回来。

### 9. 用一张图记住实现模型

完整通信模型可以这样记：

```txt
Native 创建 JS Runtime
  ↓
注入 JSBridge
  ↓
加载微信基础库
  ↓
执行开发者 JS
  ↓
开发者调用 wx.xxx
  ↓
基础库校验参数
  ↓
基础库保存回调，生成 callbackId
  ↓
把 api、params、callbackId 序列化成消息
  ↓
JSBridge 通道把消息送到 Native
  ↓
Native 分发到对应原生模块
  ↓
Native 调用微信能力或系统能力
  ↓
Native 把 callbackId 和执行结果回传给 JS
  ↓
基础库根据 callbackId 找回 success / fail / complete
```

这才是 JSBridge 的核心：

```txt
不是 JS 直接碰 Native
而是 JS 和 Native 通过消息协议互相通信
```

---

## 六、这条链路应该怎么记

可以记成一句话：

```txt
wx API 是 JS 通过 JSBridge 向 Native 发起的一次消息请求。
```

再完整一点：

```txt
微信 Native 创建 JS Runtime
  ↓
注入 JSBridge
  ↓
加载微信基础库
  ↓
执行开发者小程序 JS
  ↓
开发者调用 wx API
  ↓
微信基础库校验参数
  ↓
保存回调，生成 callbackId
  ↓
把 api、params、callbackId 封装成消息
  ↓
JSBridge 把消息发给 Native
  ↓
Native 分发到对应原生模块
  ↓
Native 执行后回传 callbackId 和结果
  ↓
基础库根据 callbackId 找到 JS 回调并执行
```

这条链路解释了很多事情：

- 为什么没有 DOM 也能做 JSBridge 通信
- 为什么 `wx`、`App`、`Page` 不是 JS 原生能力
- 为什么基础库和业务代码在同一个 Runtime 里，但角色不同
- 为什么 API 是异步的
- 为什么会有 success / fail / complete
- 为什么 JS 函数不能直接传给 Native 执行
- 为什么需要 callbackId
- 为什么返回结果要再通过桥回到 JS

---

## 🧠 一句话总结

JSBridge 是小程序 JS 和微信 Native 能力之间的桥。

`wx` API 是桥上的标准入口。

```txt
微信先创建 JS Runtime
再加载基础库和开发者代码
开发者通过 wx API 发起消息
消息经过 JSBridge 到达 Native
Native 执行后再把结果回传给 JS
```

理解这点，就能看懂小程序里很多 API 的行为：

```txt
App / Page 来自微信基础库
业务 JS 运行在基础库搭好的框架之上
调用前要校验
调用时要封装成消息
调用中要经过 JSBridge 和 Native
调用后要通过 callbackId 找回回调
```

下一篇可以继续讲：

```txt
小程序页面渲染和组件系统：WXML、WXSS、组件生命周期如何工作
```
