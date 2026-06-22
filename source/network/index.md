---
title: 计算机网络专栏
date: 2026-06-22 10:30:00
comments: false
---

这个专栏想解决的是：

```txt
前端开发到底应该怎样理解网络？
```

它不会只停在“HTTP 状态码有哪些”这种知识点清单，而是沿着一次请求真正经过的链路，把 DNS、IP、TCP、TLS、HTTP、浏览器缓存、跨域、CDN、网关和排查工具串起来。

---

## 阅读路线

### 1. 总览篇

- [计算机网络学习地图：从分层模型到浏览器请求链路](/2026/06/22/Frontend/Network/computer-network-learning-map/)

先建立整体地图：网络分层解决什么问题，一次浏览器请求会经过哪些阶段，哪些知识是前端必须优先掌握的主线。

### 2. 网络分层与基础概念

- [OSI 七层模型与 TCP/IP 四层模型：计算机网络分层到底怎么理解](/2026/06/22/Frontend/Network/osi-and-tcp-ip-model/)
- 局域网、广域网、互联网
- 客户端、服务端、网关、代理、交换机、路由器
- 带宽、延迟、吞吐量和丢包

### 3. IP、路由与局域网通信

- [IP 地址、子网与路由表：下一跳到底是怎么决定的](/2026/06/22/Frontend/Network/ip-address-subnet-routing/)
- [IP 包是怎么一跳一跳转发的：路由表、ARP、MAC、交换机与路由器](/2026/06/22/Frontend/Network/ip-mac-arp-router-forwarding/)
- 公网 IP、私网 IP 和 NAT
- 路由表与路由转发
- ICMP 与 ping

### 4. TCP、UDP 与 QUIC

- [TCP 详解：从三次握手到可靠传输、滑动窗口和四次挥手](/2026/06/22/Frontend/Network/tcp-from-handshake-to-reliable-transmission/)
- [TCP、UDP 与 QUIC：为什么 HTTP/3 要基于 UDP](/2026/06/22/Frontend/Network/tcp-udp-quic-http3/)

### 5. DNS、HTTP 与 HTTPS

- [DNS 解析全过程：域名是怎么一步步变成 IP 的](/2026/06/22/Frontend/Network/dns-resolution-explained/)
- HTTP 报文、方法、状态码和 Header
- [HTTP/1.0、HTTP/1.1 与 HTTP/2：从短连接到长连接，再到多路复用](/2026/06/22/Frontend/Network/http-1-1-http-2-evolution/)
- [HTTP 强缓存与协商缓存：浏览器怎么知道要不要发请求](/2026/06/22/Frontend/Network/http-cache-strong-and-negotiation/)
- HTTPS、TLS 握手和证书链
- [HTTP 连接与多路复用：为什么说是 HTTP/2 支持多路复用，而不是 TCP](/2026/06/22/Frontend/Network/http-connection-and-multiplexing/)

### 6. 浏览器网络专题

- [浏览器输入 URL 到页面展示：一次完整网络请求发生了什么](/2026/06/22/Frontend/Network/what-happens-when-you-enter-a-url/)
- preload、prefetch、preconnect、dns-prefetch
- Cookie、Session、Token 和 SameSite
- CORS 与 OPTIONS 预检请求
- Service Worker 与离线缓存
- DevTools Network 面板分析方法

### 7. 性能、安全与排查

- CDN 加速与静态资源优化
- 请求并发控制、接口聚合和弱网优化
- CSRF、XSS、DNS 劫持和中间人攻击
- curl、nslookup、tracert、Wireshark 的基本用法
- 线上偶发请求失败如何排查

---

## 专栏主线

```txt
网络分层
  ↓
局域网与 IP 路由
  ↓
TCP / UDP / QUIC
  ↓
DNS
  ↓
HTTP / HTTPS
  ↓
浏览器请求链路
  ↓
缓存、跨域与 Cookie
  ↓
CDN、网关与性能优化
  ↓
网络问题排查
```

---

## 一句话

计算机网络不是背协议名，而是理解：一个请求如何从浏览器出发，穿过本机、局域网、运营商、CDN、网关和服务端，再把响应稳定地带回来。
