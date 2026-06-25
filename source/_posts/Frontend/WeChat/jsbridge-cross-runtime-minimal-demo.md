---
title: JSBridge 最小模型：跨环境调用、异步 RPC 和 callbackId 是怎么工作的
date: 2026-06-25 16:30:00
categories:
  - Frontend
  - WeChat
tags:
  - JSBridge
  - Native
  - WebView
  - Unity
  - 小程序运行时
---

## 前言

理解 JSBridge 时，最容易卡住的问题不是：

```txt
JSBridge 是什么
```

而是：

```txt
两个不同环境，为什么能互相调用方法？
```

比如：

```txt
JS 为什么能调用 Native？
Native 为什么又能回调 JS？
C# 为什么能调用 JS？
JS 为什么又能 SendMessage 回 Unity？
```

如果只说一句“通过桥通信”，其实还是有点虚。

这篇用一个最小 demo，把这件事拆开。

先放结论：

> 跨环境调用不是两种语言天然互通，而是宿主在创建 JS 运行时时注入了入口；JS 也会暴露一个接收入口。双方通过约定好的消息格式通信，再用 callbackId 把异步结果和原始调用配对。

---

## 一、先分清两个世界

一个 JSBridge 场景里，通常至少有两个世界：

```txt
宿主环境 Host
JS 运行环境 JavaScript Runtime
```

在不同场景里，它们的名字不一样。

小程序里：

```txt
微信 Native = 宿主 Host
小程序 JS   = JS Runtime
```

WebView 里：

```txt
iOS / Android App = 宿主 Host
网页 JS            = JS Runtime
```

Unity WebGL 里：

```txt
Unity Runtime / WASM = 宿主 Host
JS SDK               = JS Runtime
```

所以关键不是语言，而是：

```txt
谁创建和管理这个 JS 运行环境
```

谁创建它，谁就有机会往里面注入一些东西。

---

## 二、什么叫“宿主给 JS 注入能力”

看一个最小模型。

Node 里有一个 `vm` 模块，可以创建一个独立的 JS 运行环境。

```js
const vm = require('node:vm')

const jsRuntime = vm.createContext({
  console,
  NativeBridge: {
    postMessage(message) {
      console.log('Host received:', message)
    },
  },
})
```

这里发生了两件事：

```txt
1. 宿主创建了一个新的 JS 运行环境 jsRuntime
2. 宿主往这个环境里塞了 NativeBridge.postMessage
```

所以在 `jsRuntime` 里面执行的代码，可以直接调用：

```js
NativeBridge.postMessage(...)
```

这不是 JavaScript 原生能力。

它能调用，是因为宿主提前塞进去了。

换成浏览器 WebView，可能是：

```js
window.webkit.messageHandlers.JSBridge.postMessage(...)
```

换成 Android WebView，可能是：

```js
window.NativeBridge.postMessage(...)
```

换成 Unity 小游戏，可能是：

```js
GameGlobal.Module.SendMessage(...)
```

名字不同，本质相同：

```txt
宿主给 JS 留了一个“发消息给我”的入口
```

---

## 三、globalThis 是谁

再看这句：

```js
globalThis.JSBridge = {
  receiveFromNative(message) {}
}
```

`globalThis` 是 JavaScript 的全局对象。

不同环境里，全局对象以前有不同名字：

```txt
浏览器：window
Node：global
Web Worker：self
通用写法：globalThis
```

所以：

```js
globalThis.JSBridge = ...
```

意思就是：

```txt
在当前 JS 运行环境的全局对象上挂一个 JSBridge
```

如果这段代码运行在 `jsRuntime` 里面，那么它等价于：

```txt
给 jsRuntime 的全局对象挂上 JSBridge
```

于是宿主以后就可以通过这个全局对象找到：

```js
jsRuntime.JSBridge.receiveFromNative(...)
```

这就是反方向通道：

```txt
JS 自己给宿主留了一个“你有结果时调我”的入口
```

---

## 四、最小 demo

仓库里有一个最小 demo：

```txt
demos/jsbridge-cross-env-minimal.js
```

代码如下：

```js
const vm = require('node:vm')

// Host side: pretend this is Native / Unity / WebView host.
const jsRuntime = vm.createContext({
  console,
  setTimeout,
  NativeBridge: {
    postMessage(rawMessage) {
      const message = JSON.parse(rawMessage)
      console.log('[Host] received from JS:', message)

      setTimeout(() => {
        const response = {
          callbackId: message.callbackId,
          status: 'success',
          data: { text: 'result from host' },
        }

        console.log('[Host] send result back:', response)
        jsRuntime.JSBridge.receiveFromNative(JSON.stringify(response))
      }, 500)
    },
  },
})

// JS runtime side: pretend this code runs inside WebView / JSCore.
vm.runInContext(`
  const callbackMap = new Map()
  let id = 0

  globalThis.JSBridge = {
    invoke(api, params, callback) {
      const callbackId = 'cb_' + (++id)
      callbackMap.set(callbackId, callback)

      NativeBridge.postMessage(JSON.stringify({
        api,
        params,
        callbackId,
      }))
    },

    receiveFromNative(rawMessage) {
      const message = JSON.parse(rawMessage)
      const callback = callbackMap.get(message.callbackId)

      if (!callback) return
      callback(message.data)
      callbackMap.delete(message.callbackId)
    },
  }

  JSBridge.invoke('getSomething', { value: 1 }, (res) => {
    console.log('[JS] callback runs:', res)
  })

  console.log('[JS] invoke returned immediately')
`, jsRuntime)
```

运行：

```bash
node demos/jsbridge-cross-env-minimal.js
```

输出：

```txt
[Host] received from JS: { api: 'getSomething', params: { value: 1 }, callbackId: 'cb_1' }
[JS] invoke returned immediately
[Host] send result back: { callbackId: 'cb_1', status: 'success', data: { text: 'result from host' } }
[JS] callback runs: { text: 'result from host' }
```

---

## 五、这个 demo 到底发生了什么

### 1. 宿主创建 JS 运行时

```js
const jsRuntime = vm.createContext(...)
```

可以理解成：

```txt
宿主开了一个 JS 房间
```

### 2. 宿主往 JS 里注入 NativeBridge

```js
NativeBridge: {
  postMessage(rawMessage) {}
}
```

可以理解成：

```txt
宿主在 JS 房间里放了一部电话
电话名字叫 NativeBridge.postMessage
JS 有事就用这部电话找宿主
```

所以 JS 里面可以调用：

```js
NativeBridge.postMessage(...)
```

### 3. JS 在自己的全局对象上挂 JSBridge

```js
globalThis.JSBridge = {
  receiveFromNative(rawMessage) {}
}
```

可以理解成：

```txt
JS 在房间公告板上写了一个回电话地址
宿主有结果时，可以调 JSBridge.receiveFromNative
```

所以宿主可以回调：

```js
jsRuntime.JSBridge.receiveFromNative(...)
```

### 4. JS 调用 invoke

```js
JSBridge.invoke('getSomething', { value: 1 }, callback)
```

表面看是调用方法。

但它实际做的是：

```txt
生成 callbackId
保存 callback
把 api、params、callbackId 发给宿主
```

### 5. callbackMap 保存等待中的回调

```js
callbackMap.set(callbackId, callback)
```

这一步很关键。

因为跨环境调用通常不能马上拿到结果，所以 JS 要先记住：

```txt
等 cb_1 的结果回来时，要执行哪个 callback
```

### 6. JS 把消息发给宿主

```js
NativeBridge.postMessage(JSON.stringify({
  api,
  params,
  callbackId,
}))
```

这里跨出去的不是函数，而是一条消息：

```json
{
  "api": "getSomething",
  "params": { "value": 1 },
  "callbackId": "cb_1"
}
```

### 7. 宿主收到消息

```js
postMessage(rawMessage) {
  const message = JSON.parse(rawMessage)
}
```

宿主看到：

```txt
api = getSomething
callbackId = cb_1
```

于是它去执行对应能力。

在真实小程序里，这一步可能是：

```txt
scanCode → 打开扫码
getLocation → 调系统定位
request → 发网络请求
login → 获取登录凭证
```

### 8. 宿主执行完以后回 JS

```js
jsRuntime.JSBridge.receiveFromNative(JSON.stringify(response))
```

回传消息里带着同一个 `callbackId`：

```json
{
  "callbackId": "cb_1",
  "status": "success",
  "data": {
    "text": "result from host"
  }
}
```

### 9. JS 根据 callbackId 找回调

```js
const callback = callbackMap.get(message.callbackId)
callback(message.data)
callbackMap.delete(message.callbackId)
```

这就是为什么结果能回到最开始那个调用。

不是宿主直接拿到了 JS callback 函数。

而是：

```txt
宿主只回传 callbackId 和结果
JSBridge 在 JS 侧自己找到 callback 并执行
```

---

## 六、为什么这叫异步 RPC

RPC 是 Remote Procedure Call，远程过程调用。

直白一点：

```txt
像调用本地函数一样，调用另一个环境里的能力
```

比如：

```js
wx.scanCode({
  success(res) {}
})
```

看起来像 JS 函数。

但真正执行扫码的是微信 Native。

所以它更像：

```txt
JS 请求 Native 执行 scanCode
```

为什么是异步？

因为调用后不会马上返回结果。

```js
JSBridge.invoke('getSomething', params, callback)
console.log('这行会先执行')
```

输出里也能看到：

```txt
[JS] invoke returned immediately
```

然后宿主过一会儿才回：

```txt
[JS] callback runs
```

所以异步 RPC 可以拆成：

```txt
RPC：调用另一个环境里的能力
异步：先发消息，不等结果；结果回来后再执行 callback
```

---

## 七、为什么不同语言能互相调用

严格来说，不是“不同语言直接互相调用”。

真正发生的是：

```txt
运行时提供了一层 binding / glue
```

以 Unity WebGL 为例：

```txt
C# 编译成 WASM
JS 运行在小游戏 JS 环境
Unity / Emscripten 生成 JS 胶水层
```

C# 里写：

```csharp
[DllImport("__Internal")]
public static extern void ParkLogin(string param, string callback_id);
```

意思是：

```txt
我需要调用一个外部函数，名字叫 ParkLogin
```

`.jslib` 里定义：

```js
mergeInto(LibraryManager.library, {
  ParkLogin: function(param, callback_id) {
    window.ParkSDKInstance.login(...)
  }
})
```

构建时，Unity / Emscripten 会把这个 JS 函数注册成 WASM 能调用的外部函数。

所以 C# 能调 JS，不是 C# 天然懂 JS，而是：

```txt
WASM 支持 import 外部函数
.jslib 把 JS 函数注册进去
运行时胶水层负责转发和参数转换
```

反过来 JS 回 Unity：

```js
GameGlobal.Module.SendMessage(
  '-ParkToJS-',
  'OnRecvResultFromJS',
  json
)
```

Unity Runtime 会做：

```txt
找到名为 -ParkToJS- 的 GameObject
找到它身上的 OnRecvResultFromJS 方法
把 json 字符串传进去
执行 C# 方法
```

所以跨语言调用的本质不是语言互懂，而是：

```txt
宿主运行时暴露了可调用入口
```

---

## 八、对应到 js-sdk-mono

`js-sdk-mono` 里的链路就是这个模型。

它不是微信底层 Native Bridge，而是 Unity / C# 和 JS SDK 之间的一层桥。

完整链路大概是：

```txt
C# 调 ParkSDKManager.ParkLogin
  ↓
ParkToJS 生成 callback_id
  ↓
callbackMap[callback_id] = C# callback
  ↓
DllImport("__Internal") 调 JS 函数 ParkLogin
  ↓
parksdk.jslib 调 window.ParkSDKInstance.login(params, callback_id)
  ↓
JS SDK 执行业务逻辑
  ↓
JS SDK 调 wx.login / wx.request / wx.requestMidasPaymentGameItem
  ↓
JS SDK 拿到结果
  ↓
MsgHelper.send(callback_id, response)
  ↓
GameGlobal.Module.SendMessage("-ParkToJS-", "OnRecvResultFromJS", json)
  ↓
C# OnRecvResultFromJS 根据 callback_id 找 callbackMap
  ↓
执行 C# callback
```

它和微信底层 JSBridge 的思想一样：

```txt
跨环境不能直接传函数
所以传 api、params、callbackId
结果回来后再用 callbackId 找回调
```

只是桥的两端不同。

微信底层 JSBridge：

```txt
小程序 JS ↔ 微信 Native
```

`js-sdk-mono` 这一层：

```txt
Unity / C# ↔ JS SDK
```

---

## 九、对应到微信小程序

微信小程序里的模型也是类似的。

```txt
微信 Native 创建 JS Runtime
  ↓
注入 WeixinJSBridge / 内部桥能力
  ↓
加载微信基础库
  ↓
基础库暴露 wx / App / Page / Component
  ↓
开发者调用 wx.xxx
  ↓
基础库生成 callbackId 并保存回调
  ↓
通过桥发消息给 Native
  ↓
Native 执行系统或微信能力
  ↓
Native 带 callbackId 回传结果
  ↓
基础库找回 success / fail / complete 执行
```

所以你写：

```js
wx.scanCode({
  success(res) {
    console.log(res.result)
  }
})
```

不是 JS 自己扫码。

而是：

```txt
JS 发消息请求 Native 扫码
Native 扫完以后回传 callbackId 和结果
JS 侧基础库再执行 success
```

---

## 十、最后用一句话记住

JSBridge 的最小模型是：

```txt
宿主创建 JS 运行时
  ↓
宿主注入 JS → 宿主的发送入口
  ↓
JS 注册宿主 → JS 的接收入口
  ↓
调用时生成 callbackId，保存 callback
  ↓
发送 api、params、callbackId
  ↓
宿主执行后带 callbackId 回来
  ↓
JS 用 callbackId 找 callback 并执行
```

再压缩一下：

```txt
入口靠宿主注入
通信靠消息协议
异步靠 callbackId
回调靠 callbackMap
```

这就是 JSBridge、Native Bridge、Unity SendMessage、WebView Bridge 这些东西背后的共同骨架。
