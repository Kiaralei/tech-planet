---
title: HTTP 连接与多路复用：为什么说是 HTTP/2 支持多路复用，而不是 TCP
date: 2026-06-22 11:40:00
categories:
  - Frontend
  - Network
tags:
  - 计算机网络
  - HTTP
  - HTTP/1.1
  - HTTP/2
  - TCP
  - 多路复用
---

## 前言

学习 HTTP 版本演进时，很容易遇到几个问题：

- HTTP 不是应用层协议吗，为什么总说它要建立连接？
- HTTP/1.1 的长连接，到底连接的是谁和谁？
- HTTP/2 支持多路复用，为什么不说 TCP 支持多路复用？
- HTTP/2 既然能多路复用，为什么还会有 TCP 队头阻塞？

这篇文章就围绕一个主线来讲：

```txt
HTTP 负责定义请求和响应的语义；
TCP 负责提供一条可靠、有序的字节流；
HTTP/2 的多路复用，是在这条 TCP 字节流上做出来的应用层能力。
```

---

## 1. HTTP 到底是什么

HTTP 是应用层协议，它定义的是客户端和服务端如何交换有意义的数据。

比如一个 HTTP 请求可能长这样：

```http
GET /api/user HTTP/1.1
Host: example.com
Accept: application/json
Cookie: token=abc123
```

这里每一部分都有 HTTP 语义：

- `GET`：请求方法，表示获取资源。
- `/api/user`：请求路径。
- `HTTP/1.1`：协议版本。
- `Host`：目标域名。
- `Accept`：客户端希望接收的数据类型。
- `Cookie`：浏览器携带给服务端的状态信息。

服务端返回的响应也有 HTTP 语义：

```http
HTTP/1.1 200 OK
Content-Type: application/json
Set-Cookie: token=abc123

{
  "id": 1,
  "name": "tom"
}
```

所以 HTTP 解决的是：

```txt
请求怎么写
响应怎么写
状态码是什么意思
Header 怎么解释
Body 是什么格式
缓存、Cookie、跨域等应用规则怎么约定
```

但 HTTP 自己不负责把数据可靠地送到服务器。真正负责传输的是下面的 TCP/IP。

---

## 2. DNS 查询和 HTTP 请求不是同一条连接

访问一个域名时，通常会先发生 DNS 查询，再发生 HTTP 请求。

比如访问：

```txt
https://example.com/api/user
```

浏览器不能直接拿 `example.com` 建 TCP 连接，因为 TCP/IP 真正需要的是 IP 地址。

所以第一步是 DNS：

```txt
你的电脑 -> DNS 服务器
问：example.com 的 IP 是多少？
答：93.184.216.34
```

DNS 查询本身也是一次网络通信，它通常走 UDP 53，也可能在某些情况下走 TCP 53。

但不管 DNS 走 UDP 还是 TCP，它通信的对象都是：

```txt
你的电脑 <-> DNS 服务器
```

拿到 IP 后，浏览器才会进入第二步：和 Web 服务器建立连接。

```txt
你的浏览器 -> 93.184.216.34:443
```

这时新建的是另一条 TCP 连接：

```txt
你的电脑临时端口 <-> Web 服务器 443 端口
```

所以 DNS 和 HTTP 的关系不是：

```txt
DNS 建好一条 TCP 连接，然后 HTTP 复用这条连接
```

而是：

```txt
DNS：先查地址
HTTP：拿到地址后，再和 Web 服务器建立自己的 TCP 连接
```

可以这样记：

> DNS 只是查地址，不负责带你进门。

类似现实里：

```txt
DNS：打电话问地图服务，“这家店在哪？”
HTTP：按地址去店里点菜
```

你不会用“打给地图服务的电话”去跟那家店点菜。DNS 查询和 HTTP 请求是两段不同的通信。

---

## 3. HTTP 说的连接，到底是谁和谁的连接

严格来说，HTTP 自己不建立连接。

真正建立连接的是 TCP。

当浏览器访问：

```txt
https://example.com/api/user
```

浏览器会先解析出目标：

```txt
协议：https
域名：example.com
端口：443
路径：/api/user
```

然后通过 DNS 找到 `example.com` 对应的 IP，再和目标服务器的 `443` 端口建立 TCP 连接。

一条 TCP 连接通常可以用五元组标识：

```txt
源 IP
源端口
目标 IP
目标端口
协议
```

例如：

```txt
192.168.1.10:52341  <->  93.184.216.34:443  TCP
```

这才是所谓的连接。

如果是 HTTPS，顺序大致是：

```txt
建立 TCP 连接
  ↓
进行 TLS 握手，建立加密通道
  ↓
在加密通道里发送 HTTP 请求和响应
```

所以可以这样记：

```txt
HTTP：定义请求响应的格式和语义
TCP：建立连接并可靠传输字节
TLS：在 TCP 连接之上提供加密和身份校验
```

---

## 4. HTTP/1.0：一次请求基本一次连接

HTTP/1.0 比较朴素。

典型流程是：

```txt
建立 TCP 连接
  ↓
发送一个 HTTP 请求
  ↓
接收一个 HTTP 响应
  ↓
关闭 TCP 连接
```

如果一个页面需要加载 HTML、CSS、JS、图片，就可能变成：

```txt
请求 HTML：建连接 -> 请求 -> 响应 -> 关闭
请求 CSS：建连接 -> 请求 -> 响应 -> 关闭
请求 JS：建连接 -> 请求 -> 响应 -> 关闭
请求图片：建连接 -> 请求 -> 响应 -> 关闭
```

问题很明显：

- TCP 建连有成本。
- HTTPS 还要额外 TLS 握手。
- 一个页面资源很多，频繁建连会拖慢加载。

所以 HTTP/1.0 的主要问题是连接复用能力弱。

---

## 5. HTTP/1.1：长连接与队头阻塞

HTTP/1.1 默认支持长连接，也就是连接复用。

一次 TCP 连接建立后，可以传多个 HTTP 请求和响应：

```txt
建立 TCP 连接
  ↓
请求 /index.html
  ↓
响应 /index.html
  ↓
请求 /app.js
  ↓
响应 /app.js
  ↓
请求 /style.css
  ↓
响应 /style.css
```

这就是常说的 `keep-alive`。

它的好处是：

- 减少 TCP 握手次数。
- 减少 TLS 握手次数。
- 后续请求可以复用已有连接。

但 HTTP/1.1 仍然有一个重要问题：队头阻塞。

在一条连接里，如果前面的响应很慢，后面的响应就容易被卡住：

```txt
请求 A：很慢
请求 B：很快
请求 C：很快

结果：B、C 也可能被 A 拖住
```

这就是 HTTP/1.1 在应用层上的队头阻塞。

为了缓解这个问题，浏览器通常会对同一个域名同时开多个 TCP 连接。比如一个连接卡住了，其他资源可以走别的连接。

---

## 6. HTTP/2：多路复用做了什么

HTTP/2 最大的变化是多路复用。

它不再把一个完整请求或响应当成必须连续发送的大块文本，而是把 HTTP 消息拆成更小的二进制帧。

HTTP/2 里有两个关键概念：

- Frame：帧，HTTP/2 传输的最小单位。
- Stream：流，一次请求/响应对应的一条逻辑流。

比如浏览器同时请求三个资源：

```txt
Stream 1：/index.html
Stream 3：/app.js
Stream 5：/style.css
```

它们可以在同一条 TCP 连接里交错发送：

```txt
[Stream 1 的一帧]
[Stream 3 的一帧]
[Stream 5 的一帧]
[Stream 1 的一帧]
[Stream 5 的一帧]
[Stream 3 的一帧]
```

接收端再根据 Stream ID 把它们拼回各自的请求或响应：

```txt
Stream 1 -> /index.html
Stream 3 -> /app.js
Stream 5 -> /style.css
```

这就是 HTTP/2 多路复用。

它解决的是：

```txt
多个 HTTP 请求/响应不用在应用层严格排队。
```

所以 HTTP/2 通常一个域名一条 TCP 连接就可以承载很多并发请求。

---

## 7. 为什么不说 TCP 支持多路复用

因为 TCP 看不懂 HTTP 请求。

TCP 眼里只有一条可靠、有序的字节流：

```txt
byte 1
byte 2
byte 3
byte 4
...
```

它不知道这些字节属于：

- 请求 A 的 Header
- 请求 B 的 Body
- 响应 C 的一部分

TCP 也不会帮应用层标记：

```txt
这是 Stream 1
这是 Stream 3
这是 Stream 5
```

这些 Stream ID、Frame 类型、Header 压缩、请求优先级，都是 HTTP/2 在应用层设计出来的。

所以准确地说：

```txt
TCP 提供一条可靠、有序的字节管道；
HTTP/2 在这条管道上切出了多条逻辑流。
```

这就是为什么我们说 HTTP/2 支持多路复用，而不是 TCP 支持 HTTP 多路复用。

---

## 8. HTTP/2 为什么还有 TCP 队头阻塞

HTTP/2 解决了 HTTP 层面的队头阻塞，但没有完全解决 TCP 层面的队头阻塞。

原因是 TCP 必须保证字节流有序交付。

假设 TCP 传输过程中丢了一个包：

```txt
包 1：到了
包 2：丢了
包 3：到了
包 4：到了
```

即使包 3、包 4 已经到了，TCP 也不能直接把它们交给上层，因为中间缺了包 2。

它必须等包 2 重传成功后，才能继续按顺序交付：

```txt
包 1 -> 包 2 -> 包 3 -> 包 4
```

对 HTTP/2 来说，多个 Stream 虽然在应用层是并发的，但底下仍然共用同一条 TCP 字节流。

一旦 TCP 字节流被丢包卡住，所有 Stream 都可能受影响。

这就是 TCP 层队头阻塞。

---

## 9. HTTP/3 为什么基于 QUIC

HTTP/3 选择了 QUIC。

QUIC 基于 UDP，但它不是简单地“用 UDP 代替 TCP”。QUIC 在 UDP 之上重新实现了很多能力：

- 可靠传输
- 拥塞控制
- 多路复用
- TLS 加密
- 连接迁移

关键区别在于：QUIC 的多个 Stream 在传输层就相对独立。

如果一个 Stream 丢包：

```txt
Stream 1 丢包
Stream 3 正常
Stream 5 正常
```

它不一定阻塞其他 Stream。

所以可以这样理解：

```txt
HTTP/2：应用层多路复用，但底层还是 TCP 单字节流
HTTP/3：基于 QUIC，让传输层也支持更独立的多路复用
```

---

## 10. 为什么 HTTP/1.1 现在仍然常见

HTTP/2 和 HTTP/3 已经很普遍，但 HTTP/1.1 仍然大量存在。

主要原因是：

- HTTP/1.1 简单、稳定、好调试。
- 大量服务端框架、代理、网关和内网系统天然支持 HTTP/1.1。
- 很多普通 API 请求并不需要 HTTP/2 的全部优势。
- 即使浏览器到 CDN 是 HTTP/2，CDN 到源站也可能是 HTTP/1.1。

比如真实链路可能是：

```txt
浏览器 -> CDN：HTTP/2 或 HTTP/3
CDN -> 源站 Nginx：HTTP/1.1
Nginx -> 应用服务：HTTP/1.1
```

所以 HTTP/1.1 并不是“过时不能用”，而是简单、稳定、兼容性强。

---

## 11. 一句话总结

可以用这几句话记住：

```txt
DNS 先查 IP，HTTP 再用这个 IP 建立自己的 TCP 连接。
HTTP 定义请求响应语义。
TCP 建立连接并传输可靠字节流。
HTTP/1.1 通过长连接复用 TCP 连接。
HTTP/2 通过 Stream 和 Frame 在一条 TCP 连接里复用多个请求。
TCP 不理解 HTTP 请求，所以多路复用是 HTTP/2 设计出来的能力。
HTTP/2 解决了 HTTP 层队头阻塞，但仍受 TCP 层队头阻塞影响。
HTTP/3 基于 QUIC，是为了进一步解决 TCP 字节流带来的限制。
```

最短记法：

```txt
HTTP/1.0：每次都敲门
HTTP/1.1：敲一次门，排队办事
HTTP/2：敲一次门，多窗口办事
HTTP/3：换了交通系统，减少丢包互相拖累
```
