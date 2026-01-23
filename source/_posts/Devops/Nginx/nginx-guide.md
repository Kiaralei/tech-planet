---
title: Nginx 详解：从入门到实战的完整指南
date: 2026-01-22 18:00:00
categories:
  - Devops
  - Nginx
tags:
  - Nginx
  - 反向代理
  - 负载均衡
  - Web服务器
---

## 📚 前言

**Nginx**（发音：engine-x）是一个高性能的 **Web 服务器**、**反向代理服务器**和**负载均衡器**。全球超过 30% 的网站使用 Nginx，包括 Netflix、Airbnb、GitHub 等大型网站。

---

## 🎯 Nginx 能做什么？

| 功能             | 说明                           |
| ---------------- | ------------------------------ |
| **静态文件服务** | 直接返回 HTML、CSS、JS、图片等 |
| **反向代理**     | 转发请求到后端服务器           |
| **负载均衡**     | 将请求分发到多台服务器         |
| **HTTPS 证书**   | 配置 SSL/TLS 加密              |
| **缓存**         | 缓存后端响应，提升性能         |
| **Gzip 压缩**    | 压缩响应内容，减少传输         |
| **限流**         | 限制请求速率，防止攻击         |

---

## 🔧 安装 Nginx

### Ubuntu/Debian

```bash
sudo apt update
sudo apt install nginx

# 启动
sudo systemctl start nginx
sudo systemctl enable nginx  # 开机自启

# 查看状态
sudo systemctl status nginx
```

### CentOS/RHEL

```bash
sudo yum install epel-release
sudo yum install nginx

sudo systemctl start nginx
sudo systemctl enable nginx
```

### macOS

```bash
brew install nginx

# 启动
brew services start nginx
```

### Docker

```bash
docker run -d -p 80:80 nginx
```

---

## 📁 目录结构

```
/etc/nginx/
├── nginx.conf              # 主配置文件
├── conf.d/                 # 自定义配置目录
│   └── default.conf
├── sites-available/        # 可用站点配置
├── sites-enabled/          # 已启用站点（软链接）
├── mime.types              # MIME 类型映射
└── modules-enabled/        # 已启用模块

/var/log/nginx/
├── access.log              # 访问日志
└── error.log               # 错误日志

/var/www/html/              # 默认网站根目录
```

---

## 📝 配置文件结构

```nginx
# nginx.conf 基本结构

# 全局块
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;

# events 块
events {
    worker_connections 1024;
}

# http 块
http {
    include /etc/nginx/mime.types;

    # server 块（虚拟主机）
    server {
        listen 80;
        server_name example.com;

        # location 块（路由规则）
        location / {
            root /var/www/html;
            index index.html;
        }
    }
}
```

### 配置层级

```
全局块（main）
├── events 块     → 连接处理
└── http 块       → HTTP 服务
    └── server 块 → 虚拟主机
        └── location 块 → URL 匹配规则
```

---

## 🌐 基础配置

### 1. 静态网站

```nginx
server {
    listen 80;
    server_name example.com www.example.com;

    root /var/www/example;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ =404;
    }

    # 静态资源缓存
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 2. 配置 HTTPS（SSL）

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    # SSL 证书
    ssl_certificate /etc/nginx/ssl/example.com.crt;
    ssl_certificate_key /etc/nginx/ssl/example.com.key;

    # SSL 配置优化
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;

    root /var/www/example;
    index index.html;
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}
```

### 3. 使用 Let's Encrypt 免费证书

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 自动获取并配置证书
sudo certbot --nginx -d example.com -d www.example.com

# 自动续期
sudo certbot renew --dry-run
```

---

## 🔄 反向代理

### 什么是反向代理？

```
正向代理（VPN）：代理客户端（帮你访问）
客户端 → 代理服务器 → 目标服务器
（客户端知道代理，服务器不知道客户端，代理站在你这边，帮你出去）

反向代理：代理服务器（帮服务器接客）
客户端 → Nginx → 后端服务器
（客户端不知道后端，只知道 Nginx，代理站在服务器这边，帮服务器接客）
```

| 类型     | 代理谁 | 隐藏谁     | 例子          |
| -------- | ------ | ---------- | ------------- |
| 正向代理 | 客户端 | 隐藏客户端 | VPN、科学上网 |
| 反向代理 | 服务器 | 隐藏服务器 | Nginx、CDN    |

### 基础反向代理

```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://localhost:3000;  # 转发到 Node.js
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 代理 WebSocket

```nginx
location /ws {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 86400;  # WebSocket 长连接
}
```

### 前后端分离部署

```nginx
server {
    listen 80;
    server_name example.com;

    # 前端静态资源
    location / {
        root /var/www/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;  # SPA 路由支持
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://localhost:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 静态资源
    location /static/ {
        alias /var/www/static/;
        expires 30d;
    }
}
```

---

## ⚖️ 负载均衡

### 基础配置

```nginx
# 定义后端服务器组
upstream backend {
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
    server 192.168.1.103:8080;
}

server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 负载均衡策略

```nginx
# 1. 轮询（默认）- 依次分发
upstream backend {
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
}

# 2. 权重 - 按权重分配
upstream backend {
    server 192.168.1.101:8080 weight=3;  # 3/5 的请求
    server 192.168.1.102:8080 weight=2;  # 2/5 的请求
}

# 3. IP Hash - 同一 IP 固定访问同一服务器（会话保持）
upstream backend {
    ip_hash;
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
}

# 4. 最少连接 - 分发给连接数最少的服务器
upstream backend {
    least_conn;
    server 192.168.1.101:8080;
    server 192.168.1.102:8080;
}

# 5. 健康检查
upstream backend {
    server 192.168.1.101:8080 max_fails=3 fail_timeout=30s;
    server 192.168.1.102:8080 max_fails=3 fail_timeout=30s;
    server 192.168.1.103:8080 backup;  # 备用服务器
}
```

### 负载均衡策略对比

| 策略         | 说明             | 适用场景           |
| ------------ | ---------------- | ------------------ |
| **轮询**     | 依次分发         | 服务器性能相近     |
| **权重**     | 按权重分发       | 服务器性能不同     |
| **IP Hash**  | 同 IP 固定服务器 | 需要会话保持       |
| **最少连接** | 分给最空闲的     | 请求处理时间差异大 |

---

## 🗂️ location 匹配规则

### 匹配语法

```nginx
location [ = | ~ | ~* | ^~ ] uri {
    # ...
}
```

| 符号 | 说明                     | 示例                   |
| ---- | ------------------------ | ---------------------- | ------ |
| `=`  | 精确匹配                 | `location = /api`      |
| `^~` | 前缀匹配（优先）         | `location ^~ /static/` |
| `~`  | 正则匹配（区分大小写）   | `location ~ \.php$`    |
| `~*` | 正则匹配（不区分大小写） | `location ~\* \.(jpg   | png)$` |
| 无   | 前缀匹配                 | `location /api/`       |

### 匹配优先级

```
1. = 精确匹配（最高）
2. ^~ 前缀匹配
3. ~ 或 ~* 正则匹配（按配置顺序）
4. 普通前缀匹配（最长匹配）
```

### 示例

```nginx
server {
    # 精确匹配首页
    location = / {
        root /var/www/html;
        index index.html;
    }

    # 静态资源（优先匹配）
    location ^~ /static/ {
        alias /var/www/static/;
        expires 30d;
    }

    # 图片文件（正则）
    location ~* \.(jpg|jpeg|png|gif|ico|svg)$ {
        root /var/www/images;
        expires 7d;
    }

    # API 代理
    location /api/ {
        proxy_pass http://localhost:8080/;
    }

    # 默认（SPA）
    location / {
        root /var/www/app;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## ⚡ 性能优化

### 1. Gzip 压缩

```nginx
http {
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json
               application/javascript application/xml+rss
               application/atom+xml image/svg+xml;
}
```

### 2. 缓存配置

```nginx
# 静态资源强缓存
location ~* \.(css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# 图片缓存
location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
    expires 30d;
    add_header Cache-Control "public";
}

# HTML 不缓存
location ~* \.html$ {
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

### 3. 连接优化

```nginx
http {
    # 长连接
    keepalive_timeout 65;
    keepalive_requests 100;

    # 文件传输优化
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;

    # 缓冲区
    client_body_buffer_size 16k;
    client_max_body_size 100m;

    # 超时设置
    client_body_timeout 12;
    client_header_timeout 12;
    send_timeout 10;
}
```

### 4. 代理缓存

```nginx
http {
    # 定义缓存区域
    proxy_cache_path /var/cache/nginx levels=1:2
                     keys_zone=my_cache:10m
                     max_size=1g inactive=60m;

    server {
        location /api/ {
            proxy_pass http://backend;
            proxy_cache my_cache;
            proxy_cache_valid 200 10m;
            proxy_cache_valid 404 1m;
            add_header X-Cache-Status $upstream_cache_status;
        }
    }
}
```

---

## 🔒 安全配置

### 1. 隐藏版本号

```nginx
http {
    server_tokens off;
}
```

### 2. 安全响应头

```nginx
server {
    # 防止点击劫持
    add_header X-Frame-Options "SAMEORIGIN" always;

    # 防止 XSS
    add_header X-XSS-Protection "1; mode=block" always;

    # 防止 MIME 类型嗅探
    add_header X-Content-Type-Options "nosniff" always;

    # HTTPS 强制
    add_header Strict-Transport-Security "max-age=31536000" always;

    # CSP（内容安全策略）
    add_header Content-Security-Policy "default-src 'self'" always;
}
```

### 3. 限制请求

```nginx
http {
    # 定义限制区域
    limit_req_zone $binary_remote_addr zone=one:10m rate=10r/s;
    limit_conn_zone $binary_remote_addr zone=addr:10m;

    server {
        # 请求速率限制
        location /api/ {
            limit_req zone=one burst=20 nodelay;
            limit_conn addr 10;
            proxy_pass http://backend;
        }
    }
}
```

### 4. IP 黑白名单

```nginx
# 允许/拒绝访问
location /admin/ {
    allow 192.168.1.0/24;
    allow 10.0.0.1;
    deny all;

    proxy_pass http://localhost:8080;
}
```

### 5. 防止目录遍历

```nginx
location / {
    autoindex off;
}
```

---

## 📊 日志配置

### 自定义日志格式

```nginx
http {
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    log_format json escape=json '{'
        '"time":"$time_iso8601",'
        '"ip":"$remote_addr",'
        '"method":"$request_method",'
        '"uri":"$request_uri",'
        '"status":$status,'
        '"size":$body_bytes_sent,'
        '"referer":"$http_referer",'
        '"ua":"$http_user_agent",'
        '"rt":$request_time'
    '}';

    access_log /var/log/nginx/access.log main;
    # 或 JSON 格式
    access_log /var/log/nginx/access.json json;
}
```

### 按条件记录日志

```nginx
# 不记录静态资源日志
location ~* \.(css|js|png|jpg|gif|ico)$ {
    access_log off;
}

# 只记录错误
access_log /var/log/nginx/access.log combined if=$loggable;
```

---

## 🛠️ 常用命令

```bash
# 测试配置文件语法
nginx -t

# 重新加载配置（不停机）
nginx -s reload

# 停止 Nginx
nginx -s stop      # 快速停止
nginx -s quit      # 优雅停止

# 查看版本
nginx -v           # 简单版本
nginx -V           # 详细信息（含编译参数）

# 查看进程
ps aux | grep nginx

# 查看监听端口
netstat -tlnp | grep nginx
```

---

## 🐛 常见问题

### 1. 502 Bad Gateway

```
原因：后端服务未启动或不可达

排查：
1. 检查后端服务是否运行
2. 检查 proxy_pass 地址是否正确
3. 检查防火墙是否放行
4. 查看 error.log
```

### 2. 504 Gateway Timeout

```nginx
# 解决：增加超时时间
location /api/ {
    proxy_pass http://backend;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

### 3. 413 Request Entity Too Large

```nginx
# 解决：增加上传大小限制
http {
    client_max_body_size 100m;
}
```

### 4. 跨域问题

```nginx
location /api/ {
    # CORS 配置
    add_header Access-Control-Allow-Origin * always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;

    if ($request_method = OPTIONS) {
        return 204;
    }

    proxy_pass http://backend;
}
```

---

## 📋 实战配置模板

### 完整的生产环境配置

```nginx
# /etc/nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 日志
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" $request_time';
    access_log /var/log/nginx/access.log main;

    # 性能优化
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript
               text/xml application/xml application/xml+rss text/javascript;

    # 安全
    server_tokens off;

    # 限流
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    # 负载均衡
    upstream backend {
        least_conn;
        server 127.0.0.1:3001 weight=2;
        server 127.0.0.1:3002 weight=1;
        keepalive 32;
    }

    # HTTP 重定向到 HTTPS
    server {
        listen 80;
        server_name example.com www.example.com;
        return 301 https://$host$request_uri;
    }

    # HTTPS 主站点
    server {
        listen 443 ssl http2;
        server_name example.com www.example.com;

        # SSL
        ssl_certificate /etc/nginx/ssl/example.com.crt;
        ssl_certificate_key /etc/nginx/ssl/example.com.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;

        # 安全头
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000" always;

        # 前端
        location / {
            root /var/www/frontend/dist;
            index index.html;
            try_files $uri $uri/ /index.html;

            # 缓存
            location ~* \.(css|js)$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
            }

            location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
                expires 30d;
            }
        }

        # API
        location /api/ {
            limit_req zone=api burst=20 nodelay;

            proxy_pass http://backend/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Connection "";

            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }

        # WebSocket
        location /ws/ {
            proxy_pass http://backend/ws/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_read_timeout 86400;
        }
    }
}
```

---

## 🎯 总结

### 核心功能

| 功能     | 关键配置                            |
| -------- | ----------------------------------- |
| 静态服务 | `root`, `index`, `try_files`        |
| 反向代理 | `proxy_pass`, `proxy_set_header`    |
| 负载均衡 | `upstream`, `weight`, `ip_hash`     |
| HTTPS    | `ssl_certificate`, `ssl_protocols`  |
| 缓存     | `expires`, `proxy_cache`            |
| 压缩     | `gzip on`                           |
| 限流     | `limit_req_zone`, `limit_conn_zone` |

### 记忆口诀

> **Nginx 三大能力**：静态服务、反向代理、负载均衡
>
> **性能三件套**：Gzip、缓存、长连接
>
> **安全三要素**：HTTPS、限流、安全头

---

## 📚 相关资源

- [Nginx 官方文档](https://nginx.org/en/docs/)
- [Nginx 配置生成器](https://www.digitalocean.com/community/tools/nginx)
- [Let's Encrypt](https://letsencrypt.org/) - 免费 SSL 证书
- [Nginx 性能调优指南](https://www.nginx.com/blog/tuning-nginx/)
