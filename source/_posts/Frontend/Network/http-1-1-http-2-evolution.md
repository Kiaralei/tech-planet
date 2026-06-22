---
title: HTTP/1.0、HTTP/1.1 与 HTTP/2：从短连接到长连接，再到多路复用
date: 2026-06-22 14:25:00
categories:
  - Frontend
  - Network
tags:
  - 计算机网络
  - HTTP
  - HTTP/1.0
  - HTTP/1.1
  - HTTP/2
  - ETag
  - 缓存
---

## 前言

HTTP 的版本演进可以先压成一句话：

```txt
HTTP/1.0：短连接为主，每次请求成本高。
HTTP/1.1：默认长连接，复用 TCP 连接，但请求容易排队。
HTTP/2：二进制分帧和多路复用，一个 TCP 连接里并发多个请求。
```

这篇文章围绕几个问题展开：

- HTTP/1.0 为什么慢？
- HTTP/1.1 的长连接解决了什么？
- 为什么 HTTP/1.1 还有队头阻塞？
- HTTP/2 为什么能在 TCP 上实现多路复用？
- 为什么 HTTP/2 仍然有 TCP 层队头阻塞？
- ETag 是哪个版本引入的缓存机制？

---

## 1. HTTP/1.0：一个请求基本一次连接

HTTP/1.0 的典型特点是：

> 一个请求基本对应一次 TCP 连接，请求完就关闭。

假设页面需要这些资源：

```txt
index.html
style.css
app.js
logo.png
```

HTTP/1.0 的典型流程是：

```txt
请求 index.html：
TCP 三次握手
发送 HTTP 请求
接收 HTTP 响应
关闭 TCP 连接

请求 style.css：
TCP 三次握手
发送 HTTP 请求
接收 HTTP 响应
关闭 TCP 连接

请求 app.js：
TCP 三次握手
发送 HTTP 请求
接收 HTTP 响应
关闭 TCP 连接
```

页面资源越多，连接建立和关闭成本越高。

---

## 2. 为什么连接成本高

普通 HTTP 不是直接发送请求。

它至少需要：

```txt
TCP 三次握手
  ↓
HTTP 请求
  ↓
HTTP 响应
```

如果是 HTTPS，还要更多：

```txt
TCP 三次握手
  ↓
TLS 握手
  ↓
HTTP 请求
  ↓
HTTP 响应
```

如果每个资源都重新建连接，就会浪费很多 RTT。

RTT 是一次往返时间：

```txt
客户端发出数据 -> 服务端响应回来
```

网络延迟越高，频繁建连越伤。

---

## 3. HTTP/1.0 有没有长连接

HTTP/1.0 默认不是长连接。

后来有些实现支持：

```http
Connection: keep-alive
```

但这不是 HTTP/1.0 的默认行为，也不是特别统一。

真正把长连接变成默认能力的是 HTTP/1.1。

HTTP/1.0 的核心问题可以总结成：

```txt
连接复用弱
频繁 TCP 建连
每个资源成本高
对现代多资源网页不友好
```

---

## 4. HTTP/1.1：默认长连接

HTTP/1.1 的核心改进是：

> 默认长连接，复用 TCP 连接。

也就是：

```txt
建立一次 TCP 连接
请求 index.html
响应 index.html
请求 style.css
响应 style.css
请求 app.js
响应 app.js
一段时间后再关闭连接
```

这减少了：

```txt
TCP 三次握手成本
TLS 握手成本
连接频繁创建/销毁成本
```

HTTP/1.1 里长连接是默认行为。

如果要关闭连接，可以显式写：

```http
Connection: close
```

---

## 5. HTTP/1.1 为什么还有队头阻塞

HTTP/1.1 虽然能复用 TCP 连接，但同一条连接上的请求和响应仍然容易排队。

常见模式是：

```txt
请求 A -> 响应 A
请求 B -> 响应 B
请求 C -> 响应 C
```

如果 A 很慢：

```txt
请求 A：慢
请求 B：快
请求 C：快
```

B、C 也可能被 A 卡住。

这叫：

```txt
HTTP 层队头阻塞
```

HTTP/1.1 有 pipelining，允许客户端不等前一个响应回来就连续发请求：

```txt
请求 A
请求 B
请求 C
```

但响应仍然必须按请求顺序返回：

```txt
响应 A
响应 B
响应 C
```

如果 A 慢，即使 B、C 已经处理完，也不能先完整返回。

这就是 pipelining 没有真正解决队头阻塞的原因。

---

## 6. 浏览器如何缓解 HTTP/1.1 队头阻塞

浏览器通常会对同一个域名开多个 TCP 连接。

比如：

```txt
连接 1：请求 A
连接 2：请求 B
连接 3：请求 C
连接 4：请求 D
```

这样一个连接被慢请求卡住，其他连接还能继续跑。

但代价是：

```txt
更多 TCP 连接
更多 TLS 握手
更多服务器资源
拥塞控制彼此独立
```

这也是为什么 HTTP/1.1 时代常见这些前端优化：

```txt
合并 JS / CSS
雪碧图
减少请求数
域名分片
```

它们很多都是为了缓解请求数量和连接排队带来的成本。

---

## 7. HTTP/1.1 的其他重要能力

HTTP/1.1 不只是长连接。

它还强化了很多现代 Web 的基础能力。

### Host 头

HTTP/1.1 要求请求里带 Host：

```http
Host: example.com
```

这让一个 IP 可以托管多个站点：

```txt
a.com
b.com
c.com
```

服务端通过 Host 判断客户端请求的是哪个域名。

### 缓存控制

HTTP/1.1 强化了缓存相关能力：

```http
Cache-Control
ETag
If-None-Match
If-Modified-Since
```

这些对浏览器性能非常重要。

### Range 请求

HTTP/1.1 支持请求资源的一部分：

```http
Range: bytes=0-999
```

这可以用于：

```txt
断点续传
视频拖动播放
大文件分段下载
```

### Chunked 分块传输

服务端可以边生成边发送：

```http
Transfer-Encoding: chunked
```

不必一开始就知道完整 `Content-Length`。

---

## 8. ETag 是什么

ETag 是 HTTP/1.1 引入并标准化的重要缓存机制。

服务端响应时可以返回：

```http
ETag: "abc123"
```

意思是：

```txt
这是这个资源当前版本的标识。
```

浏览器下次请求时可以带：

```http
If-None-Match: "abc123"
```

服务端比较后，如果资源没变，就返回：

```http
304 Not Modified
```

响应体可以不传，浏览器继续使用本地缓存。

所以 ETag 的作用是：

```txt
用资源版本标识判断缓存是否仍然有效。
```

它比 `Last-Modified` 更精确，因为 `Last-Modified` 基于时间，而 ETag 可以基于内容 hash、版本号、文件 inode 等生成。

常见协商缓存对比：

```txt
Last-Modified / If-Modified-Since：按修改时间判断
ETag / If-None-Match：按资源标识判断
```

通常：

```txt
If-None-Match / ETag 优先于 If-Modified-Since / Last-Modified
```

---

## 9. HTTP/2：语义不变，传输方式变化

HTTP/2 的目标是：

> 在尽量保持 HTTP 语义不变的前提下，提升传输效率。

也就是说，这些语义还在：

```txt
GET / POST
Header
Status Code
Cookie
Cache-Control
```

但底层传输方式变了。

HTTP/1.1 是文本报文。

HTTP/2 改成二进制分帧：

```txt
Frame
Frame
Frame
```

每个 Frame 有明确结构：

```txt
长度
类型
标志位
Stream ID
Payload
```

这让机器解析更高效，也为多路复用打基础。

---

## 10. HTTP/2 的 Stream 是什么

HTTP/2 引入 Stream。

可以理解成：

```txt
一次请求 / 响应对应一条 Stream。
```

比如页面加载：

```txt
/index.html  -> Stream 1
/style.css   -> Stream 3
/app.js      -> Stream 5
/logo.png    -> Stream 7
```

每个 Frame 都带有 Stream ID。

接收方看到 Frame 后，就知道：

```txt
这帧属于 HTML
这帧属于 CSS
这帧属于 JS
```

然后分别拼回对应的请求或响应。

---

## 11. HTTP/2 为什么能在 TCP 上多路复用

TCP 给 HTTP/1.1 和 HTTP/2 的底座其实一样：

```txt
一条可靠、有序的字节流
```

区别是 HTTP 自己怎么把数据放进这条字节流里。

HTTP/1.1 按完整文本请求/响应排队：

```txt
请求 A
响应 A
请求 B
响应 B
请求 C
响应 C
```

HTTP/2 把请求和响应拆成带 Stream ID 的二进制 Frame。

所以可以交错发送：

```txt
Stream 1 的一帧
Stream 3 的一帧
Stream 5 的一帧
Stream 1 的一帧
Stream 5 的一帧
Stream 3 的一帧
```

接收方根据 Stream ID 拼回去：

```txt
Stream 1 -> HTML
Stream 3 -> CSS
Stream 5 -> JS
```

所以：

> HTTP/2 不是让 TCP 懂多路复用，而是在 TCP 字节流里自己定义了 Frame 和 Stream。

---

## 12. HTTP/2 为什么仍有队头阻塞

HTTP/2 解决的是 HTTP 层队头阻塞，但没有解决 TCP 层队头阻塞。

HTTP/2 可以让多个 Stream 交错发送。

但底层 TCP 仍然要求：

```txt
字节必须按顺序交付给上层。
```

假设 TCP 字节流里有这些包：

```txt
包 1：包含 Stream 1 的帧
包 2：丢了
包 3：包含 Stream 3 的帧
包 4：包含 Stream 5 的帧
```

即使包 3、包 4 已经到达，TCP 也不能先交给 HTTP/2。

因为 TCP 看到的是连续字节流：

```txt
包 1 -> 包 2 -> 包 3 -> 包 4
```

包 2 没到，后面的字节不能越过它交付。

于是：

```txt
Stream 3 和 Stream 5 也被包 2 卡住
```

这就是 TCP 层队头阻塞。

所以：

```txt
HTTP/2 解决 HTTP 层排队
但仍受 TCP 有序字节流限制
```

HTTP/3 / QUIC 就是为了进一步减少这个问题。

---

## 13. HTTP/2 的 Header 压缩

HTTP 请求头经常重复。

比如多个请求都有：

```http
Host: example.com
Cookie: ...
User-Agent: ...
Accept: ...
Authorization: ...
```

HTTP/1.1 每次都要重复发送这些文本 Header。

HTTP/2 使用 HPACK 做 Header 压缩。

它会维护一张 Header 表，把重复 Header 用索引表示。

第一次发：

```txt
User-Agent: Chrome...
Cookie: token=...
```

后面可以用更短的索引引用。

这能减少请求头体积，尤其对很多小请求很有帮助。

---

## 14. HTTP/2 对前端优化的影响

HTTP/1.1 时代，很多优化是为了减少请求数：

```txt
合并 JS
合并 CSS
雪碧图
域名分片
资源内联
```

HTTP/2 更擅长处理并发小请求。

所以一些策略需要重新评估：

```txt
过度合并资源可能降低缓存效率
域名分片可能破坏 HTTP/2 单连接复用
```

但这不代表完全不用打包。

现实中还要考虑：

```txt
模块加载
缓存粒度
压缩效率
首屏关键路径
浏览器并发策略
构建复杂度
```

---

## 15. 一句话总结

可以这样记：

```txt
HTTP/1.0：短连接为主，请求多时建连成本高。
HTTP/1.1：默认长连接，复用 TCP 连接，但同一连接上容易排队。
HTTP/2：二进制分帧和 Stream，让多个请求/响应能在一条 TCP 连接上交错传输。
```

再补一句：

```txt
HTTP/2 解决 HTTP 层队头阻塞，但仍受 TCP 层队头阻塞影响。
```

最短记法：

> HTTP/1.1 是“排队办事”，HTTP/2 是“给每件事编号，拆成小片交错办事”。
