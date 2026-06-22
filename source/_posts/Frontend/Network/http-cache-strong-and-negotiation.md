---
title: HTTP 强缓存与协商缓存：浏览器怎么知道要不要发请求
date: 2026-06-22 15:50:00
categories:
  - Frontend
  - Network
tags:
  - 计算机网络
  - HTTP
  - HTTP缓存
  - Cache-Control
  - ETag
  - 304
---

## 前言

HTTP 缓存里最重要的两个概念是：

```txt
强缓存：不问服务器，直接用本地缓存。
协商缓存：问服务器资源变没变，没变就继续用本地缓存。
```

很多人会问：

> 浏览器怎么知道这次请求要不要走强缓存？

答案是：

> 浏览器第一次拿到响应时，会把响应体和响应头一起存下来；下次请求同一个资源前，根据之前保存的缓存规则判断缓存是否仍然新鲜。

---

## 1. 第一次请求时，浏览器存了什么

第一次请求：

```http
GET /app.js HTTP/1.1
```

服务端返回：

```http
HTTP/1.1 200 OK
Cache-Control: max-age=3600
ETag: "abc123"
Content-Type: application/javascript

console.log("hello")
```

浏览器会缓存两类东西：

```txt
响应体：console.log("hello")
响应头：Cache-Control、ETag、Date、Expires 等
```

同时浏览器会记录：

```txt
这个资源什么时候缓存的
它的缓存规则是什么
```

所以强缓存判断来自“上一次响应”，不是这次请求凭空决定的。

---

## 2. 第二次请求前，浏览器先查缓存

当页面再次需要：

```txt
/app.js
```

浏览器会先用 URL 等信息去查本地缓存。

如果找到缓存记录，它会看之前存下来的响应头：

```http
Cache-Control: max-age=3600
Date: ...
```

然后判断：

```txt
现在距离上次响应时间有没有超过 3600 秒？
```

如果没有超过：

```txt
缓存仍然新鲜
```

浏览器就直接使用本地缓存，不发请求。

这就是强缓存。

---

## 3. 强缓存是什么

强缓存命中时，浏览器不会发请求到服务器。

它直接从本地缓存拿资源。

Network 面板里可能看到：

```txt
(from memory cache)
(from disk cache)
```

强缓存主要由这些响应头控制：

```http
Cache-Control: max-age=31536000
Expires: Wed, 22 Jun 2027 12:00:00 GMT
```

其中 `Cache-Control` 是 HTTP/1.1 更常用的缓存控制方式。

---

## 4. Cache-Control 怎么控制强缓存

最典型的是：

```http
Cache-Control: max-age=3600
```

意思是：

```txt
从响应生成开始，3600 秒内缓存是新鲜的。
```

在这 3600 秒内，浏览器再次请求这个资源：

```txt
直接使用本地缓存
不发请求到服务器
```

这就是强缓存。

常见指令：

```http
Cache-Control: max-age=3600
Cache-Control: no-cache
Cache-Control: no-store
Cache-Control: public
Cache-Control: private
Cache-Control: max-age=31536000, immutable
```

含义是：

```txt
max-age：缓存有效时间。
no-cache：可以缓存，但使用前必须向服务器确认。
no-store：完全不缓存。
public：浏览器、CDN、代理都可以缓存。
private：只能浏览器私有缓存，CDN/代理不要缓存。
immutable：有效期内资源不会变化，适合带 hash 的静态资源。
```

注意：

```txt
no-cache 不是“不缓存”
```

它是：

```txt
可以存，但每次使用前都要协商确认。
```

真正不缓存是：

```http
Cache-Control: no-store
```

---

## 5. Expires 是什么

`Expires` 是 HTTP/1.0 的缓存头。

比如：

```http
Expires: Wed, 22 Jun 2027 12:00:00 GMT
```

意思是：

```txt
在这个时间之前，缓存有效。
```

但它依赖客户端本地时间。

如果用户电脑时间不准，判断可能出错。

所以 HTTP/1.1 更推荐：

```http
Cache-Control: max-age=3600
```

如果 `Cache-Control` 和 `Expires` 同时存在，通常 `Cache-Control` 优先。

---

## 6. 强缓存过期后怎么办

如果超过了 `max-age`：

```txt
缓存不新鲜了。
```

浏览器不能直接用强缓存。

它会进入协商缓存。

如果之前缓存里有：

```http
ETag: "abc123"
```

浏览器会带上：

```http
If-None-Match: "abc123"
```

如果之前缓存里有：

```http
Last-Modified: Wed, 22 Jun 2026 10:00:00 GMT
```

浏览器会带上：

```http
If-Modified-Since: Wed, 22 Jun 2026 10:00:00 GMT
```

服务端判断资源没变，返回：

```http
304 Not Modified
```

浏览器继续使用本地缓存。

服务端判断资源变了，返回：

```http
200 OK
```

并带上新的响应体，浏览器更新缓存。

---

## 7. 协商缓存是什么

协商缓存命中时，浏览器会发请求到服务器，但服务端可以不返回完整资源。

流程是：

```txt
浏览器：我本地有一份资源，它还是新的吗？
服务器：没变，继续用本地的。
```

服务器返回：

```http
304 Not Modified
```

没有响应体，浏览器继续用本地缓存。

协商缓存主要有两组头：

```txt
Last-Modified / If-Modified-Since
ETag / If-None-Match
```

---

## 8. Last-Modified / If-Modified-Since

第一次请求，服务端返回：

```http
Last-Modified: Wed, 22 Jun 2026 10:00:00 GMT
```

意思是：

```txt
这个资源最后修改时间是这个。
```

下次请求，浏览器带上：

```http
If-Modified-Since: Wed, 22 Jun 2026 10:00:00 GMT
```

服务端判断：

```txt
资源从这个时间后没变 -> 304
资源变了 -> 200 + 新资源
```

缺点是：

```txt
时间精度有限。
文件内容没变但修改时间变了，也可能重新下载。
短时间内多次修改可能不够精确。
```

---

## 9. ETag / If-None-Match

第一次请求，服务端返回：

```http
ETag: "abc123"
```

意思是：

```txt
这是资源当前版本标识。
```

下次请求，浏览器带上：

```http
If-None-Match: "abc123"
```

服务端判断：

```txt
ETag 一样 -> 304
ETag 不一样 -> 200 + 新资源
```

ETag 可以基于：

```txt
文件内容 hash
版本号
构建产物指纹
文件元信息
```

所以它通常比 `Last-Modified` 更精确。

如果两者同时存在，通常：

```txt
ETag / If-None-Match 优先级更高
```

---

## 10. 强缓存和协商缓存的完整流程

浏览器请求资源时，大致流程是：

```txt
1. 先看本地有没有缓存记录
   没有 -> 发请求

2. 有缓存记录，检查强缓存是否仍然新鲜
   新鲜 -> 直接用缓存，不发请求

3. 强缓存失效
   进入协商缓存
   带 If-None-Match / If-Modified-Since 问服务器

4. 服务器判断资源没变
   返回 304
   浏览器用本地缓存

5. 服务器判断资源变了
   返回 200 + 新资源
   浏览器更新缓存
```

顺序是：

```txt
强缓存优先
协商缓存其次
```

---

## 11. 哪些信息会参与缓存匹配

浏览器一般会用资源 URL 作为缓存 key 的核心。

比如：

```txt
https://cdn.example.com/app.js
```

如果 URL 变了：

```txt
/app.js?v=1
/app.js?v=2
```

对浏览器来说通常就是两个不同资源。

所以前端静态资源常用 hash 文件名：

```txt
app.a1b2c3.js
app.d4e5f6.js
```

内容变了，URL 变了，浏览器自然请求新资源。

内容没变，URL 不变，继续走缓存。

---

## 12. 常见缓存策略

### 带 hash 的静态资源

比如：

```txt
app.8f3a9c.js
style.a1b2c3.css
```

文件名里有内容 hash，内容变了文件名也变。

可以设置很长强缓存：

```http
Cache-Control: public, max-age=31536000, immutable
```

### HTML 文件

HTML 通常不能强缓存太久，因为它要引用最新的 JS/CSS。

常见策略是：

```http
Cache-Control: no-cache
```

意思是：

```txt
可以缓存，但每次使用前要和服务器确认。
```

### 接口数据

要看业务。

用户信息、订单状态这类可能用：

```http
Cache-Control: no-store
```

公共、变化不频繁的数据可以适当缓存。

---

## 13. 用户刷新会不会影响强缓存

会。

不同刷新方式可能不一样：

```txt
普通访问 / 页面跳转：
正常使用强缓存

刷新 F5：
浏览器可能跳过强缓存，走协商缓存

强制刷新 Ctrl + F5：
通常绕过缓存，重新请求资源
```

如果 DevTools 勾选了：

```txt
Disable cache
```

缓存行为也会被禁用。

---

## 14. 常见误区

### no-cache 是不缓存

不是。

```http
Cache-Control: no-cache
```

表示：

```txt
可以缓存，但用之前必须协商。
```

真正不缓存是：

```http
Cache-Control: no-store
```

### 304 是没有走网络

不是。

304 是协商缓存，已经发了请求，只是服务端没有返回完整响应体。

### 缓存只发生在浏览器

不一定。

缓存可能发生在：

```txt
浏览器
Service Worker
CDN
代理服务器
网关
```

排查缓存问题时要看完整链路。

---

## 15. 一句话总结

可以这样记：

```txt
强缓存：缓存没过期，不发请求，直接用本地缓存。
协商缓存：缓存过期了，发请求问服务器，没变就返回 304。
```

浏览器怎么知道要不要走强缓存？

```txt
靠上一次响应里保存下来的 Cache-Control / Expires 等缓存规则。
```

最短记法：

> 强缓存看新鲜度，协商缓存问版本号。
