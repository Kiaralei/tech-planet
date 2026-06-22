---
title: 浏览器输入 URL 到页面展示：一次完整网络请求发生了什么
date: 2026-06-22 15:20:00
categories:
  - Frontend
  - Network
tags:
  - 计算机网络
  - 浏览器
  - DNS
  - TCP
  - HTTPS
  - HTTP
  - 浏览器渲染
---

## 前言

“浏览器输入 URL 到页面展示发生了什么”是一个经典问题。

它看起来是在问浏览器，实际上是在串联整条网络链路：

```txt
URL 解析
  ↓
缓存
  ↓
DNS
  ↓
TCP
  ↓
TLS
  ↓
HTTP
  ↓
服务端响应
  ↓
浏览器解析和渲染
```

以访问下面这个地址为例：

```txt
https://example.com/page
```

---

## 1. 浏览器解析 URL

浏览器先把 URL 拆开：

```txt
协议：https
域名：example.com
路径：/page
端口：443
```

如果 URL 里没有显式写端口，浏览器会根据协议使用默认端口：

```txt
HTTP：80
HTTPS：443
```

如果用户没有写协议，现代浏览器通常会优先尝试 HTTPS，或者根据历史记录、HSTS 等策略补全。

---

## 2. 检查缓存

在真正发网络请求之前，浏览器会先检查缓存。

可能涉及：

```txt
内存缓存
磁盘缓存
Service Worker 缓存
HTTP 强缓存
HTTP 协商缓存
```

如果强缓存命中，浏览器可能根本不发请求，直接使用本地资源。

如果需要协商缓存，浏览器会带上条件请求头：

```http
If-None-Match: "abc123"
If-Modified-Since: Wed, 21 Oct 2025 07:28:00 GMT
```

服务端如果判断资源没变，可以返回：

```http
304 Not Modified
```

浏览器继续使用本地缓存。

---

## 3. DNS 解析域名

如果需要发网络请求，浏览器要先把域名解析成 IP：

```txt
example.com -> 93.184.216.34
```

DNS 查询顺序大致是：

```txt
浏览器 DNS 缓存
  ↓
操作系统 DNS 缓存
  ↓
hosts 文件
  ↓
本地 DNS 服务器
  ↓
根域名服务器
  ↓
顶级域名服务器
  ↓
权威域名服务器
```

本地 DNS 拿到结果后返回给浏览器。

DNS 查询本身也是网络通信，通常走：

```txt
DNS -> UDP/TCP -> IP -> MAC -> 物理层
```

---

## 4. 建立 TCP 连接

拿到 IP 后，浏览器会连接：

```txt
93.184.216.34:443
```

如果使用的是 HTTP/1.1 或 HTTP/2 over TCP，就需要先建立 TCP 连接。

TCP 三次握手：

```txt
客户端 -> 服务端：SYN
服务端 -> 客户端：SYN + ACK
客户端 -> 服务端：ACK
```

三次握手确认：

```txt
双方都能发送
双方都能接收
双方同步初始序号
TCP 连接建立
```

这一步还没有发送 HTTP 请求。

---

## 5. TLS 握手

因为访问的是 HTTPS，还要进行 TLS 握手。

TLS 主要做：

```txt
确认服务端身份
协商加密算法
生成会话密钥
建立加密通道
```

浏览器会校验证书：

```txt
证书是否过期
域名是否匹配
证书链是否可信
是否被吊销
```

TLS 建立后，后续 HTTP 数据都会在加密通道里传输。

所以 HTTPS 的大致顺序是：

```txt
TCP 三次握手
  ↓
TLS 握手
  ↓
加密后的 HTTP 请求
```

---

## 6. 发送 HTTP 请求

浏览器发送 HTTP 请求。

如果是 HTTP/1.1，请求可能长这样：

```http
GET /page HTTP/1.1
Host: example.com
User-Agent: ...
Accept: text/html
Cookie: ...
```

如果是 HTTP/2，语义仍然是：

```txt
GET
Header
Cookie
Status Code
```

但底层会变成二进制 Frame 和 Stream。

HTTP 请求会继续被下面的层承载：

```txt
HTTP
  ↓
TLS
  ↓
TCP
  ↓
IP
  ↓
MAC
  ↓
物理层
```

---

## 7. 服务端处理请求

请求到达服务端后，可能经过：

```txt
CDN
负载均衡
Nginx / API Gateway
应用服务
数据库 / 缓存
```

服务端处理后返回 HTTP 响应：

```http
HTTP/1.1 200 OK
Content-Type: text/html
Cache-Control: ...
Set-Cookie: ...

<html>...</html>
```

也可能返回：

```txt
301 / 302 / 307 / 308：重定向
304：资源未修改，继续用缓存
401 / 403：认证或权限问题
404：资源不存在
500：服务端错误
```

---

## 8. 浏览器接收响应

浏览器收到响应后，会处理：

```txt
状态码
Content-Type
缓存策略
Cookie
重定向
压缩解码 gzip / br
CORS
CSP 等安全策略
```

如果是 HTML，浏览器开始解析页面。

如果是重定向，浏览器会根据 `Location` 发起新的请求。

如果是 304，浏览器会复用本地缓存。

---

## 9. 解析 HTML，构建 DOM

浏览器把 HTML 解析成 DOM 树。

例如：

```html
<div>
  <p>Hello</p>
</div>
```

会变成 DOM 节点结构：

```txt
div
└── p
    └── text: Hello
```

DOM 表示页面结构。

---

## 10. 解析 CSS，构建 CSSOM

浏览器加载并解析 CSS：

```css
p {
  color: red;
}
```

形成 CSSOM。

CSS 会影响渲染，所以 CSS 通常是渲染阻塞资源。

浏览器需要知道样式，才能正确计算元素最终呈现效果。

---

## 11. 执行 JavaScript

遇到普通脚本：

```html
<script src="app.js"></script>
```

浏览器通常会暂停 HTML 解析，下载并执行 JS。

因为 JS 可能修改 DOM：

```js
document.body.innerHTML = "";
```

如果脚本带不同属性，行为不同：

```html
<script defer src="app.js"></script>
<script async src="app.js"></script>
```

简单记：

```txt
普通 script：阻塞 HTML 解析
defer：不阻塞解析，DOM 解析完按顺序执行
async：不阻塞解析，下载完立即执行，顺序不保证
```

---

## 12. 构建渲染树、布局、绘制和合成

浏览器把 DOM 和 CSSOM 合成渲染树。

然后执行：

```txt
样式计算：每个节点最终应用哪些样式
布局 Layout：每个元素多大、在哪
绘制 Paint：画文字、颜色、边框、图片
合成 Composite：图层合成到屏幕
```

最终页面显示出来。

---

## 13. 继续加载子资源

HTML 里可能引用很多子资源：

```txt
CSS
JS
图片
字体
视频
接口请求
```

这些资源会触发新的请求。

浏览器会根据这些因素调度加载：

```txt
资源优先级
缓存情况
连接复用
HTTP/2 多路复用
preload
preconnect
dns-prefetch
```

所以一个页面展示出来，不是一个请求结束就完事，而是多个资源请求和渲染任务不断交织。

---

## 14. preload、preconnect、dns-prefetch 放在哪

这些优化提示本质上是在提前做某些准备。

```html
<link rel="dns-prefetch" href="//cdn.example.com">
```

提前做 DNS 解析。

```html
<link rel="preconnect" href="https://cdn.example.com">
```

提前建立连接，可能包括 DNS、TCP、TLS。

```html
<link rel="preload" href="/app.css" as="style">
```

提前下载关键资源。

它们优化的是：

```txt
DNS
TCP/TLS 建连
关键资源下载
```

---

## 15. 一句话总流程

可以压成这条线：

```txt
解析 URL
  ↓
检查缓存
  ↓
DNS 解析
  ↓
TCP 三次握手
  ↓
TLS 握手
  ↓
发送 HTTP 请求
  ↓
服务端返回响应
  ↓
浏览器解析 HTML
  ↓
加载 CSS / JS / 图片等子资源
  ↓
构建 DOM / CSSOM
  ↓
布局、绘制、合成
  ↓
页面展示
```

最短记法：

> URL 先变 IP，IP 建 TCP，HTTPS 加 TLS，HTTP 拿 HTML，浏览器解析并渲染页面。
