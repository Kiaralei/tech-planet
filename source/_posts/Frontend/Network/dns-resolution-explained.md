---
title: DNS 解析全过程：域名是怎么一步步变成 IP 的
date: 2026-06-22 14:55:00
categories:
  - Frontend
  - Network
tags:
  - 计算机网络
  - DNS
  - 域名解析
  - UDP
  - 缓存
  - TTL
---

## 前言

DNS 负责把人类好记的域名，解析成网络能使用的 IP 地址。

比如访问：

```txt
https://example.com
```

浏览器不能直接拿 `example.com` 建 TCP 连接。

TCP/IP 需要目标 IP：

```txt
93.184.216.34
```

所以要先做 DNS 解析：

```txt
example.com -> 93.184.216.34
```

一句话：

> DNS 解决“去哪儿”，HTTP 解决“到了以后说什么”。

---

## 1. DNS 是应用层协议

DNS 是应用层协议。

它定义的是：

```txt
我要查哪个域名？
我要查什么记录类型？
结果是什么？
缓存多久？
查不到怎么表示？
```

比如：

```txt
查询：example.com 的 A 记录
响应：93.184.216.34
```

DNS 查询本身也要走网络：

```txt
DNS -> UDP/TCP -> IP -> MAC -> 物理层
```

DNS 常用 UDP 53，但也可以用 TCP 53。

---

## 2. DNS 常见记录类型

DNS 查的不是只有 IP。

常见记录类型有：

```txt
A：域名 -> IPv4 地址
AAAA：域名 -> IPv6 地址
CNAME：域名 -> 另一个域名
MX：邮件服务器
TXT：文本记录，常用于验证、SPF、DKIM 等
NS：这个域名由哪些权威 DNS 服务器负责
```

比如：

```txt
www.example.com CNAME example.com
example.com A 93.184.216.34
```

意思可能是：

```txt
www.example.com 先指向 example.com
example.com 再解析到 IP
```

如果遇到 CNAME，解析器还需要继续解析 CNAME 指向的目标。

---

## 3. 浏览器访问网站时 DNS 查询顺序

浏览器不会一上来就问根域名服务器。

它会先查缓存。

大概顺序是：

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

前几步如果命中，就不会继续往下查。

---

## 4. hosts 文件是什么

hosts 文件是本机上的静态域名映射表。

比如：

```txt
127.0.0.1 localhost
192.168.1.100 dev.example.com
```

如果 hosts 里有对应记录，系统可以直接使用。

它常用于：

```txt
本地开发
临时域名映射
测试环境切换
屏蔽某些域名
```

---

## 5. 本地 DNS 服务器是什么

本地 DNS 服务器也叫递归解析器。

它通常来自：

```txt
路由器
运营商 DNS
公共 DNS，比如 8.8.8.8 / 1.1.1.1
公司内网 DNS
```

你的电脑通常不是自己去问根服务器，而是把问题交给本地 DNS：

```txt
example.com 的 IP 是多少？
```

本地 DNS 如果有缓存，直接返回。

如果没有，它会继续帮你查。

---

## 6. 根、顶级、权威 DNS 怎么分工

DNS 是树状结构。

比如：

```txt
www.example.com.
```

最后那个点代表根。

可以理解成：

```txt
.
└── com
    └── example
        └── www
```

如果本地 DNS 没有缓存，它会从根开始，逐层找到谁有权回答。

### 根域名服务器

本地 DNS 问根服务器：

```txt
请问 www.example.com 的 A 记录是什么？
```

根服务器通常不会直接告诉你 IP。

它会说：

```txt
我不知道 www.example.com 的 IP，
但 .com 归这些 TLD 服务器管，你去问它们。
```

### 顶级域名服务器

本地 DNS 再问 `.com` 顶级域名服务器：

```txt
请问 www.example.com 的 A 记录是什么？
```

`.com` 服务器通常也不会直接告诉你 IP。

它会说：

```txt
我不知道具体 IP，
但 example.com 归这些权威 DNS 服务器管，你去问它们。
```

### 权威 DNS 服务器

本地 DNS 再问 `example.com` 的权威 DNS：

```txt
请问 www.example.com 的 A 记录是什么？
```

权威 DNS 才可能回答：

```txt
www.example.com 是 93.184.216.34
```

或者：

```txt
www.example.com 是 CNAME example.com
```

如果是 CNAME，还要继续解析：

```txt
example.com 的 A 记录是什么？
```

---

## 7. 不是先查短域名，而是找谁有权回答

这里很容易误解成：

```txt
先查 www.example.com
再查 example.com
再查 .com
```

更准确的理解是：

> DNS 不是从完整域名往短域名“查 IP”，而是从根往下找“谁有权回答这个完整域名”。

本地 DNS 的目标一直是：

```txt
我要查 www.example.com 的记录。
```

但它一开始不知道谁有权回答。

所以它逐级问：

```txt
根服务器：.com 应该问谁？
.com 服务器：example.com 应该问谁？
example.com 权威服务器：www.example.com 的记录是什么？
```

所以 `example.com` 会出现，但通常是作为：

```txt
example.com 这个区域由哪些权威 DNS 服务器负责。
```

不是固定流程里“先查 www.example.com，再查 example.com，再查 .com”。

一句话：

> 目标一直是完整域名，层级查询是在寻找能回答它的权威服务器。

---

## 8. 递归查询和迭代查询

用户电脑通常对本地 DNS 做递归查询：

```txt
你帮我查到底，最后给我结果。
```

本地 DNS 对根、顶级、权威服务器通常做迭代查询：

```txt
你不知道没关系，告诉我下一步该问谁。
```

所以：

```txt
客户端 -> 本地 DNS：递归查询
本地 DNS -> 根/TLD/权威：迭代查询
```

这也是为什么本地 DNS 经常叫递归解析器。

---

## 9. DNS 缓存和 TTL

DNS 响应会带 TTL。

比如：

```txt
TTL = 300
```

意思是：

```txt
这个结果可以缓存 300 秒。
```

缓存可能存在于：

```txt
浏览器
操作系统
本地 DNS
运营商 DNS
公共 DNS
```

TTL 的好处：

```txt
减少查询次数
降低延迟
减轻 DNS 服务器压力
```

代价是：

```txt
域名解析变更不会立刻全网生效
```

比如你改了域名 IP，但旧缓存还没过期，有些用户仍然访问旧 IP。

---

## 10. DNS 为什么常用 UDP

DNS 查询通常很小：

```txt
问：example.com 的 IP 是什么？
答：93.184.216.34
```

UDP 不需要三次握手：

```txt
发查询
收响应
```

延迟低，开销小。

但 DNS 也可能用 TCP：

```txt
响应太大
区域传送
DNS over TCP
某些安全或可靠性需求
```

所以：

```txt
DNS 常用 UDP，但不是只能用 UDP。
```

---

## 11. DNS 和 HTTP 的关系

DNS 和 HTTP 都是应用层协议，但负责不同事情。

```txt
DNS：去哪儿？域名对应哪个 IP？
HTTP：到了以后说什么？请求哪个资源？
```

访问网站通常是：

```txt
DNS 解析域名
  ↓
TCP 连接目标 IP:443
  ↓
TLS 握手
  ↓
HTTP 请求
```

DNS 查询和 HTTP 请求不是同一条连接。

DNS 通信对象是：

```txt
你的电脑 <-> DNS 服务器
```

HTTP 通信对象是：

```txt
你的浏览器 <-> Web 服务器
```

---

## 12. DNS 常见问题

### DNS 解析慢

可能原因：

```txt
缓存没命中
本地 DNS 慢
跨地区解析
权威 DNS 响应慢
```

### DNS 解析错

可能原因：

```txt
hosts 配置
运营商劫持
内网 DNS 配置
缓存未过期
CDN 调度
```

### 改了 DNS 记录但不生效

常见原因：

```txt
TTL 没过
各级缓存还在
本地 DNS 没刷新
```

### ping 域名和访问网页结果不同

因为：

```txt
ping 用 ICMP
网页用 TCP/HTTP/HTTPS
```

而且不同地域、不同 DNS 服务器可能解析到不同 CDN 节点。

---

## 13. 一句话总结

DNS 可以这样记：

```txt
浏览器先查缓存
缓存没有问本地 DNS
本地 DNS 逐级问根、顶级、权威
最后拿到 IP
再去建立 TCP/TLS/HTTP 连接
```

更准确地说：

```txt
根服务器告诉你 TLD 该问谁。
TLD 告诉你权威 DNS 该问谁。
权威 DNS 才回答具体记录。
```

最短记法：

> DNS 负责把域名变成 IP；本地 DNS 帮你递归查，根/TLD/权威一步步告诉它该问谁；TTL 决定结果能缓存多久。
