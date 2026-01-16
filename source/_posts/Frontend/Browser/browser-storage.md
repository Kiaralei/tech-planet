---
title: 前端浏览器存储全面指南：Cookie、LocalStorage、SessionStorage、IndexedDB
date: 2026-01-16 14:30:00
categories:
  - Frontend
  - Browser
tags:
  - 浏览器存储
  - Cookie
  - LocalStorage
  - SessionStorage
  - IndexedDB
---

## 📚 前言

浏览器提供了多种数据存储方案，每种都有其适用场景。本文将全面介绍 **Cookie**、**LocalStorage**、**SessionStorage** 和 **IndexedDB**，帮助你在实际开发中做出正确选择。

---

## 🎯 快速对比

| 特性             | Cookie           | LocalStorage | SessionStorage | IndexedDB            |
| ---------------- | ---------------- | ------------ | -------------- | -------------------- |
| **存储大小**     | ~4KB             | ~5MB         | ~5MB           | 无限制（受磁盘限制） |
| **生命周期**     | 可设置过期时间   | 永久         | 标签页关闭清除 | 永久                 |
| **与服务器通信** | 每次请求自动携带 | 不发送       | 不发送         | 不发送               |
| **API 易用性**   | 复杂             | 简单         | 简单           | 复杂（异步）         |
| **数据类型**     | 字符串           | 字符串       | 字符串         | 任意类型             |
| **同源策略**     | 遵循             | 遵循         | 遵循           | 遵循                 |
| **适用场景**     | 用户认证、追踪   | 持久化配置   | 临时表单数据   | 大量结构化数据       |

---

## 🍪 Cookie

### 什么是 Cookie？

Cookie 是服务器发送到浏览器并保存在本地的小型数据，浏览器在**每次请求时自动携带**发送给服务器，无需手动设置。

| 场景     | Cookie 自动携带？ | 需要配置？                                    |
| -------- | ----------------- | --------------------------------------------- |
| 同源请求 | ✅ 自动           | 不需要                                        |
| 跨域请求 | ❌ 默认不带       | 前端 credentials: 'include'<br>后端 CORS 配置 |

### 基本使用

```javascript
// 设置 Cookie
document.cookie = "username=john";
document.cookie = "theme=dark";

// 读取所有 Cookie（返回字符串）
console.log(document.cookie);
// 输出: "username=john; theme=dark"

// 设置过期时间
const date = new Date();
date.setTime(date.getTime() + 7 * 24 * 60 * 60 * 1000); // 7天后
document.cookie = `token=abc123; expires=${date.toUTCString()}`;

// 设置 max-age（秒数）
document.cookie = "session=xyz; max-age=3600"; // 1小时后过期

// 删除 Cookie（设置过期时间为过去）
document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
```

### Cookie 属性

```javascript
document.cookie = `name=value; 
  expires=${date.toUTCString()}; 
  max-age=3600; 
  path=/; 
  domain=.example.com; 
  secure; 
  samesite=strict`;
```

| 属性       | 说明                             |
| ---------- | -------------------------------- |
| `expires`  | 过期时间（UTC 格式）             |
| `max-age`  | 有效期（秒），优先级高于 expires |
| `path`     | Cookie 生效的路径                |
| `domain`   | Cookie 生效的域名                |
| `secure`   | 只在 HTTPS 下传输                |
| `httpOnly` | 禁止 JS 访问（只能服务器设置）   |
| `samesite` | 跨站请求限制（Strict/Lax/None）  |

### 封装 Cookie 工具

```javascript
const CookieUtil = {
  // 获取
  get(name) {
    const cookies = document.cookie.split("; ");
    for (const cookie of cookies) {
      const [key, value] = cookie.split("=");
      if (key === name) {
        return decodeURIComponent(value);
      }
    }
    return null;
  },

  // 设置
  set(name, value, options = {}) {
    let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    if (options.expires) {
      cookie += `; expires=${options.expires.toUTCString()}`;
    }
    if (options.maxAge) {
      cookie += `; max-age=${options.maxAge}`;
    }
    if (options.path) {
      cookie += `; path=${options.path}`;
    }
    if (options.domain) {
      cookie += `; domain=${options.domain}`;
    }
    if (options.secure) {
      cookie += "; secure";
    }
    if (options.sameSite) {
      cookie += `; samesite=${options.sameSite}`;
    }

    document.cookie = cookie;
  },

  // 删除
  remove(name, options = {}) {
    this.set(name, "", {
      ...options,
      expires: new Date(0),
    });
  },
};

// 使用
CookieUtil.set("token", "abc123", { maxAge: 86400, path: "/" });
CookieUtil.get("token"); // 'abc123'
CookieUtil.remove("token");
```

### Cookie 的问题

- ❌ 每次请求都携带，增加带宽开销
- ❌ 大小限制 4KB
- ❌ API 不友好，需要手动解析
- ❌ 安全风险（XSS、CSRF）

### 适用场景

✅ 用户登录状态（配合 httpOnly）
✅ 服务端需要读取的数据
✅ 跨标签页共享的认证信息

---

## 💾 LocalStorage

### 什么是 LocalStorage？

LocalStorage 是 HTML5 提供的本地存储方案，数据**永久保存**，除非手动清除。

### 基本使用

```javascript
// 存储数据
localStorage.setItem("username", "john");
localStorage.setItem("settings", JSON.stringify({ theme: "dark", lang: "zh" }));

// 读取数据
const username = localStorage.getItem("username");
const settings = JSON.parse(localStorage.getItem("settings"));

// 删除数据
localStorage.removeItem("username");

// 清空所有数据
localStorage.clear();

// 获取数量
console.log(localStorage.length);

// 遍历
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  const value = localStorage.getItem(key);
  console.log(key, value);
}
```

### 存储对象和数组

```javascript
// ❌ 错误：直接存储对象
localStorage.setItem("user", { name: "john" });
localStorage.getItem("user"); // "[object Object]"

// ✅ 正确：JSON 序列化
localStorage.setItem("user", JSON.stringify({ name: "john" }));
JSON.parse(localStorage.getItem("user")); // { name: 'john' }
```

### 封装 LocalStorage 工具

```javascript
const Storage = {
  // 获取（自动解析 JSON）
  get(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return defaultValue;
      return JSON.parse(value);
    } catch {
      return localStorage.getItem(key) || defaultValue;
    }
  },

  // 设置（自动序列化）
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  // 删除
  remove(key) {
    localStorage.removeItem(key);
  },

  // 清空
  clear() {
    localStorage.clear();
  },

  // 带过期时间的存储
  setWithExpiry(key, value, ttl) {
    const item = {
      value,
      expiry: Date.now() + ttl,
    };
    localStorage.setItem(key, JSON.stringify(item));
  },

  getWithExpiry(key) {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;

    const item = JSON.parse(itemStr);
    if (Date.now() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return item.value;
  },
};

// 使用
Storage.set("user", { name: "john", age: 25 });
Storage.get("user"); // { name: 'john', age: 25 }

Storage.setWithExpiry("temp", "data", 60000); // 1分钟后过期
```

### 监听存储变化

```javascript
// 监听其他标签页的存储变化
window.addEventListener("storage", (event) => {
  console.log("Key:", event.key);
  console.log("Old Value:", event.oldValue);
  console.log("New Value:", event.newValue);
  console.log("URL:", event.url);
});
```

> ⚠️ 注意：`storage` 事件只在**其他同源标签页**修改时触发，当前页面修改不会触发。

### 适用场景

✅ 用户偏好设置（主题、语言）
✅ 缓存不敏感数据
✅ 草稿保存
✅ 不需要发送给服务器的数据

---

## 📋 SessionStorage

### 什么是 SessionStorage？

SessionStorage 与 LocalStorage API 相同，但数据仅在**当前标签页有效**，关闭标签页后清除。

### 基本使用

```javascript
// API 与 LocalStorage 完全相同
sessionStorage.setItem("tempData", "value");
sessionStorage.getItem("tempData");
sessionStorage.removeItem("tempData");
sessionStorage.clear();
```

### LocalStorage vs SessionStorage

| 对比                 | LocalStorage | SessionStorage       |
| -------------------- | ------------ | -------------------- |
| **生命周期**         | 永久         | 标签页关闭清除       |
| **跨标签页**         | ✅ 共享      | ❌ 不共享            |
| **新标签页打开链接** | 共享数据     | 复制数据（独立副本） |
| **刷新页面**         | 保留         | 保留                 |

### 适用场景

✅ 表单临时数据（防止刷新丢失）
✅ 页面间传递数据
✅ 一次性的临时状态
✅ 敏感数据（关闭即清除）

### 实际应用：表单防丢失

```javascript
const form = document.querySelector("form");

// 保存表单数据
form.addEventListener("input", () => {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  sessionStorage.setItem("formDraft", JSON.stringify(data));
});

// 恢复表单数据
window.addEventListener("load", () => {
  const draft = sessionStorage.getItem("formDraft");
  if (draft) {
    const data = JSON.parse(draft);
    Object.entries(data).forEach(([key, value]) => {
      const input = form.querySelector(`[name="${key}"]`);
      if (input) input.value = value;
    });
  }
});

// 提交后清除
form.addEventListener("submit", () => {
  sessionStorage.removeItem("formDraft");
});
```

---

## 🗄️ IndexedDB

### 什么是 IndexedDB？

IndexedDB 是浏览器提供的**大型、结构化数据**存储方案，支持索引、事务和异步操作。

### 核心概念

```
IndexedDB
├── Database（数据库）
│   ├── ObjectStore（对象仓库，类似表）
│   │   ├── Record（记录）
│   │   ├── Record
│   │   └── Index（索引）
│   └── ObjectStore
└── Transaction（事务）
```

### 基本使用

```javascript
// 1. 打开/创建数据库
const request = indexedDB.open("MyDatabase", 1);

// 2. 数据库升级时创建对象仓库
request.onupgradeneeded = (event) => {
  const db = event.target.result;

  // 创建对象仓库，keyPath 是主键
  const store = db.createObjectStore("users", {
    keyPath: "id",
    autoIncrement: true,
  });

  // 创建索引
  store.createIndex("name", "name", { unique: false });
  store.createIndex("email", "email", { unique: true });
};

// 3. 打开成功
request.onsuccess = (event) => {
  const db = event.target.result;
  console.log("数据库打开成功");
};

// 4. 打开失败
request.onerror = (event) => {
  console.error("数据库打开失败", event.target.error);
};
```

### CRUD 操作

```javascript
class IndexedDBHelper {
  constructor(dbName, version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  // 打开数据库
  open(stores = []) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        stores.forEach(({ name, keyPath, indexes = [] }) => {
          if (!db.objectStoreNames.contains(name)) {
            const store = db.createObjectStore(name, {
              keyPath,
              autoIncrement: true,
            });
            indexes.forEach(({ name, keyPath, unique }) => {
              store.createIndex(name, keyPath, { unique });
            });
          }
        });
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  // 添加数据
  add(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 获取数据
  get(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 获取所有数据
  getAll(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 更新数据
  put(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 删除数据
  delete(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 通过索引查询
  getByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
```

### 使用示例

```javascript
// 使用封装的工具类
const db = new IndexedDBHelper("MyApp", 1);

// 初始化数据库
await db.open([
  {
    name: "users",
    keyPath: "id",
    indexes: [
      { name: "name", keyPath: "name", unique: false },
      { name: "email", keyPath: "email", unique: true },
    ],
  },
  {
    name: "posts",
    keyPath: "id",
    indexes: [{ name: "userId", keyPath: "userId", unique: false }],
  },
]);

// 添加数据
const userId = await db.add("users", {
  name: "John",
  email: "john@example.com",
});

// 获取数据
const user = await db.get("users", userId);

// 更新数据
await db.put("users", {
  id: userId,
  name: "John Doe",
  email: "john@example.com",
});

// 通过索引查询
const usersByName = await db.getByIndex("users", "name", "John");

// 删除数据
await db.delete("users", userId);
```

### 推荐库：Dexie.js

原生 IndexedDB API 复杂，推荐使用 **Dexie.js**：

```javascript
import Dexie from "dexie";

// 定义数据库
const db = new Dexie("MyDatabase");

db.version(1).stores({
  users: "++id, name, email", // ++ 表示自增
  posts: "++id, userId, title",
});

// 使用（超简洁！）
await db.users.add({ name: "John", email: "john@example.com" });
const users = await db.users.where("name").equals("John").toArray();
await db.users.update(1, { name: "John Doe" });
await db.users.delete(1);
```

### 适用场景

✅ 离线应用数据存储
✅ 大量结构化数据（如文章、商品列表）
✅ 需要索引和查询的数据
✅ 文件和 Blob 存储
✅ PWA 离线缓存

---

## 📊 如何选择？

### 决策流程图

```
需要存储什么数据？
       │
       ├── 需要发送给服务器？
       │   └── 是 → Cookie
       │
       ├── 需要永久保存？
       │   ├── 是 + 数据量小（<5MB）→ LocalStorage
       │   └── 是 + 数据量大 → IndexedDB
       │
       └── 临时数据（关闭清除）？
           └── SessionStorage
```

### 场景推荐

| 场景          | 推荐方案              |
| ------------- | --------------------- |
| 用户登录状态  | Cookie（httpOnly）    |
| 用户偏好设置  | LocalStorage          |
| 表单草稿      | SessionStorage        |
| 购物车数据    | LocalStorage          |
| 离线文章缓存  | IndexedDB             |
| 图片/文件缓存 | IndexedDB / Cache API |
| 敏感临时数据  | SessionStorage        |
| 服务端会话 ID | Cookie                |

---

## 🔒 安全注意事项

### 1. 不要存储敏感信息

```javascript
// ❌ 危险
localStorage.setItem("password", "123456");
localStorage.setItem("creditCard", "1234-5678-9012-3456");

// ✅ 安全
// 敏感信息应该由服务端管理，使用 httpOnly Cookie
```

### 2. 防止 XSS 攻击

```javascript
// ❌ 危险：直接渲染存储的内容
element.innerHTML = localStorage.getItem("userInput");

// ✅ 安全：转义或使用 textContent
element.textContent = localStorage.getItem("userInput");
```

### 3. Cookie 安全设置

```javascript
// ✅ 安全的 Cookie 设置
document.cookie = "token=xxx; secure; samesite=strict; path=/";

// 服务端设置 httpOnly（JS 无法读取）
// Set-Cookie: token=xxx; HttpOnly; Secure; SameSite=Strict
```

---

## 🎯 总结

| 存储方案           | 一句话定位             |
| ------------------ | ---------------------- |
| **Cookie**         | 与服务器通信的小型数据 |
| **LocalStorage**   | 永久的客户端键值存储   |
| **SessionStorage** | 标签页级别的临时存储   |
| **IndexedDB**      | 大型结构化数据存储     |

### 记忆口诀

> - **Cookie**：要发服务器，用我
> - **LocalStorage**：永久存，用我
> - **SessionStorage**：临时存，用我
> - **IndexedDB**：数据大，用我

---

## 📚 相关资源

- [MDN - Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [MDN - IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [MDN - Document.cookie](https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie)
- [Dexie.js](https://dexie.org/) - IndexedDB 封装库
- [localForage](https://localforage.github.io/localForage/) - 统一存储 API
