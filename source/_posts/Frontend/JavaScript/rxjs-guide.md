---
title: RxJS 响应式编程入门指南
date: 2026-01-21 16:00:00
categories:
  - Frontend
  - JavaScript
tags:
  - RxJS
  - 响应式编程
  - Observable
  - 异步编程
---

## 📚 前言

**RxJS（Reactive Extensions for JavaScript）** 是一个响应式编程库，使用 **Observable**（可观察对象）来处理异步数据流。它在 Angular 中被广泛使用，也适用于 React、Vue 等任何 JavaScript 项目。

---

## 🎯 为什么需要 RxJS？

### 传统异步处理的问题

```javascript
// 回调地狱
fetchUser(userId, (user) => {
  fetchOrders(user.id, (orders) => {
    fetchProducts(orders[0].productId, (product) => {
      // 越来越深...
    });
  });
});

// Promise 链
fetchUser(userId)
  .then((user) => fetchOrders(user.id))
  .then((orders) => fetchProducts(orders[0].productId))
  .then((product) => console.log(product));

// 但如果需要：取消请求、重试、节流、合并多个流？
// Promise 就力不从心了
```

### RxJS 的优势

| 场景           | 传统方式             | RxJS                                |
| -------------- | -------------------- | ----------------------------------- |
| 取消请求       | 需要 AbortController | `subscription.unsubscribe()`        |
| 自动重试       | 手动实现             | `retry(3)`                          |
| 节流防抖       | setTimeout           | `debounceTime()` / `throttleTime()` |
| 合并多个请求   | Promise.all          | `forkJoin()` / `combineLatest()`    |
| 处理 WebSocket | 复杂                 | 内置支持                            |

---

## 🧱 核心概念

### 1. Observable（可观察对象）

Observable 是数据的**生产者**，可以发出多个值：

```javascript
import { Observable } from "rxjs";

// 创建 Observable
const observable = new Observable((subscriber) => {
  subscriber.next(1); // 发出值 1
  subscriber.next(2); // 发出值 2
  subscriber.next(3); // 发出值 3
  subscriber.complete(); // 完成
});

// 订阅
observable.subscribe({
  next: (value) => console.log(value), // 1, 2, 3
  error: (err) => console.error(err),
  complete: () => console.log("完成"),
});
```

### 2. Observer（观察者）

Observer 是数据的**消费者**，定义如何处理数据：

```javascript
const observer = {
  next: (value) => console.log("收到:", value),
  error: (err) => console.error("错误:", err),
  complete: () => console.log("完成"),
};

observable.subscribe(observer);
```

### 3. Subscription（订阅）

订阅后返回 Subscription，用于**取消订阅**：

```javascript
const subscription = observable.subscribe((value) => console.log(value));

// 取消订阅（停止接收数据）
subscription.unsubscribe();
```

### 4. Operators（操作符）

操作符用于**转换、过滤、组合**数据流：

```javascript
import { of } from "rxjs";
import { map, filter } from "rxjs/operators";

of(1, 2, 3, 4, 5)
  .pipe(
    filter((x) => x % 2 === 0), // 过滤偶数
    map((x) => x * 10) // 乘以 10
  )
  .subscribe(console.log); // 20, 40
```

### 5. Subject（主题）

Subject 既是 Observable 又是 Observer，可以**多播**：

```javascript
import { Subject } from "rxjs";

const subject = new Subject();

// 多个订阅者
subject.subscribe((v) => console.log("A:", v));
subject.subscribe((v) => console.log("B:", v));

// 发送数据
subject.next(1); // A: 1, B: 1
subject.next(2); // A: 2, B: 2
```

---

## 🔧 创建 Observable

### 常用创建函数

```javascript
import { of, from, interval, fromEvent, ajax } from "rxjs";

// of - 从值创建
of(1, 2, 3).subscribe(console.log); // 1, 2, 3

// from - 从数组/Promise 创建
from([1, 2, 3]).subscribe(console.log); // 1, 2, 3
from(fetch("/api/user")).subscribe(console.log);

// interval - 定时发出值
interval(1000).subscribe(console.log); // 0, 1, 2, 3... (每秒)

// fromEvent - 从 DOM 事件创建
fromEvent(document, "click").subscribe((e) => console.log(e));

// ajax - HTTP 请求
ajax("/api/users").subscribe((response) => console.log(response));
```

### 创建函数对比

| 函数        | 用途                  | 示例                      |
| ----------- | --------------------- | ------------------------- |
| `of`        | 固定值                | `of(1, 2, 3)`             |
| `from`      | 数组/Promise/Iterable | `from([1, 2, 3])`         |
| `interval`  | 定时器                | `interval(1000)`          |
| `timer`     | 延迟 + 定时           | `timer(2000, 1000)`       |
| `fromEvent` | DOM 事件              | `fromEvent(btn, 'click')` |
| `ajax`      | HTTP 请求             | `ajax('/api')`            |

---

## 🎨 常用操作符

### 转换操作符

```javascript
import { map, mergeMap, switchMap, concatMap } from "rxjs/operators";

// map - 转换每个值
of(1, 2, 3)
  .pipe(map((x) => x * 2))
  .subscribe(console.log); // 2, 4, 6

// mergeMap - 映射并合并（并行）
of(1, 2, 3)
  .pipe(mergeMap((x) => ajax(`/api/user/${x}`)))
  .subscribe(console.log);

// switchMap - 映射并切换（取消前一个）
fromEvent(input, "input")
  .pipe(switchMap((e) => ajax(`/api/search?q=${e.target.value}`)))
  .subscribe(console.log);

// concatMap - 映射并顺序执行
of(1, 2, 3)
  .pipe(concatMap((x) => ajax(`/api/user/${x}`)))
  .subscribe(console.log);
```

### 过滤操作符

```javascript
import {
  filter,
  take,
  takeUntil,
  debounceTime,
  distinctUntilChanged,
} from "rxjs/operators";

// filter - 过滤
of(1, 2, 3, 4, 5)
  .pipe(filter((x) => x > 2))
  .subscribe(console.log); // 3, 4, 5

// take - 只取前 N 个
interval(1000).pipe(take(3)).subscribe(console.log); // 0, 1, 2 然后完成

// debounceTime - 防抖
fromEvent(input, "input").pipe(debounceTime(300)).subscribe(console.log);

// distinctUntilChanged - 去重（相邻）
of(1, 1, 2, 2, 3, 1).pipe(distinctUntilChanged()).subscribe(console.log); // 1, 2, 3, 1
```

### 组合操作符

```javascript
import { merge, concat, forkJoin, combineLatest, zip } from "rxjs";

// merge - 合并多个流（同时发出）
merge(
  interval(1000).pipe(map((x) => `A${x}`)),
  interval(1500).pipe(map((x) => `B${x}`))
).subscribe(console.log);

// forkJoin - 等待所有完成（类似 Promise.all）
forkJoin({
  user: ajax("/api/user"),
  orders: ajax("/api/orders"),
}).subscribe(({ user, orders }) => {
  console.log(user, orders);
});

// combineLatest - 任一发出时组合最新值
combineLatest([
  fromEvent(input1, "input"),
  fromEvent(input2, "input"),
]).subscribe(([e1, e2]) => {
  console.log(e1.target.value, e2.target.value);
});
```

### 错误处理操作符

```javascript
import { catchError, retry, retryWhen } from "rxjs/operators";
import { throwError, timer } from "rxjs";

// catchError - 捕获错误
ajax("/api/user")
  .pipe(
    catchError((error) => {
      console.error("请求失败:", error);
      return of({ name: "default" }); // 返回默认值
    })
  )
  .subscribe(console.log);

// retry - 自动重试
ajax("/api/user")
  .pipe(
    retry(3) // 失败后重试 3 次
  )
  .subscribe(console.log);

// retryWhen - 自定义重试逻辑
ajax("/api/user")
  .pipe(
    retryWhen((errors) =>
      errors.pipe(
        delay(1000), // 等待 1 秒后重试
        take(3) // 最多重试 3 次
      )
    )
  )
  .subscribe(console.log);
```

---

## 💡 实战场景

### 1. 搜索框自动补全

```javascript
import { fromEvent } from "rxjs";
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  filter,
} from "rxjs/operators";

const search$ = fromEvent(searchInput, "input").pipe(
  map((e) => e.target.value.trim()),
  filter((query) => query.length >= 2), // 至少 2 个字符
  debounceTime(300), // 防抖 300ms
  distinctUntilChanged(), // 值变化才请求
  switchMap((query) => ajax(`/api/search?q=${query}`)) // 取消前一个请求
);

search$.subscribe((results) => {
  renderResults(results);
});
```

### 2. 无限滚动加载

```javascript
import { fromEvent, BehaviorSubject } from "rxjs";
import { filter, exhaustMap, scan } from "rxjs/operators";

const page$ = new BehaviorSubject(1);

const scroll$ = fromEvent(window, "scroll").pipe(
  filter(() => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    return scrollTop + clientHeight >= scrollHeight - 100;
  }),
  exhaustMap(() => {
    const page = page$.value;
    page$.next(page + 1);
    return ajax(`/api/posts?page=${page}`);
  }),
  scan((acc, curr) => [...acc, ...curr.response], [])
);

scroll$.subscribe((posts) => renderPosts(posts));
```

### 3. WebSocket 实时通信

```javascript
import { webSocket } from "rxjs/webSocket";
import { retryWhen, delay } from "rxjs/operators";

const socket$ = webSocket("wss://example.com/socket");

// 发送消息
socket$.next({ type: "subscribe", channel: "updates" });

// 接收消息（带自动重连）
socket$.pipe(retryWhen((errors) => errors.pipe(delay(3000)))).subscribe({
  next: (msg) => console.log("收到消息:", msg),
  error: (err) => console.error("连接错误:", err),
});
```

### 4. 并发控制

```javascript
import { from } from "rxjs";
import { mergeMap } from "rxjs/operators";

const urls = ["/api/1", "/api/2", "/api/3", "/api/4", "/api/5"];

from(urls)
  .pipe(
    mergeMap((url) => ajax(url), 2) // 最多并发 2 个请求
  )
  .subscribe(console.log);
```

### 5. 轮询请求

```javascript
import { timer } from "rxjs";
import { switchMap, takeUntil } from "rxjs/operators";

const stop$ = new Subject();

timer(0, 5000)
  .pipe(
    // 立即执行，然后每 5 秒
    switchMap(() => ajax("/api/status")),
    takeUntil(stop$) // 直到 stop$ 发出
  )
  .subscribe((status) => {
    console.log("状态:", status);
    if (status.completed) {
      stop$.next(); // 停止轮询
    }
  });
```

---

## 📊 Subject 类型对比

| Subject 类型      | 特点                             |
| ----------------- | -------------------------------- |
| `Subject`         | 普通多播，新订阅者收不到之前的值 |
| `BehaviorSubject` | 有初始值，新订阅者收到最新值     |
| `ReplaySubject`   | 新订阅者收到 N 个历史值          |
| `AsyncSubject`    | 只发出最后一个值（complete 后）  |

```javascript
import { BehaviorSubject, ReplaySubject } from "rxjs";

// BehaviorSubject - 需要初始值
const behavior$ = new BehaviorSubject(0);
behavior$.next(1);
behavior$.next(2);
behavior$.subscribe((v) => console.log(v)); // 2（最新值）

// ReplaySubject - 缓存历史值
const replay$ = new ReplaySubject(2); // 缓存 2 个
replay$.next(1);
replay$.next(2);
replay$.next(3);
replay$.subscribe((v) => console.log(v)); // 2, 3
```

---

## ⚠️ 注意事项

### 1. 记得取消订阅

```javascript
// ❌ 内存泄漏
ngOnInit() {
  this.data$.subscribe(data => this.data = data);
}

// ✅ 正确做法
ngOnDestroy() {
  this.subscription.unsubscribe();
}

// ✅ 或使用 takeUntil
destroy$ = new Subject();

ngOnInit() {
  this.data$.pipe(
    takeUntil(this.destroy$)
  ).subscribe(data => this.data = data);
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

### 2. 冷 Observable vs 热 Observable

```javascript
// 冷 Observable - 每次订阅都执行
const cold$ = new Observable((subscriber) => {
  console.log("执行"); // 每个订阅者都会触发
  subscriber.next(Math.random());
});

cold$.subscribe((v) => console.log("A:", v)); // 执行, A: 0.123
cold$.subscribe((v) => console.log("B:", v)); // 执行, B: 0.456

// 热 Observable - 共享执行
const hot$ = cold$.pipe(share());
hot$.subscribe((v) => console.log("A:", v)); // 执行, A: 0.789
hot$.subscribe((v) => console.log("B:", v)); // B: 0.789（共享）
```

---

## 🔬 源码原理探索

理解 RxJS 的内部实现，能帮助你更好地使用它。以下是核心概念的**简化版源码实现**。

### 1. Observable 的实现

RxJS 的 Observable 核心非常简单：

```javascript
// 简化版 Observable 实现
class Observable {
  constructor(subscribe) {
    // 保存订阅函数
    this._subscribe = subscribe;
  }

  subscribe(observer) {
    // 如果传入的是函数，包装成 observer 对象
    if (typeof observer === "function") {
      observer = { next: observer };
    }

    // 调用订阅函数，传入 observer
    this._subscribe(observer);
  }
}

// 使用
const observable = new Observable((observer) => {
  observer.next(1);
  observer.next(2);
  observer.next(3);
});

observable.subscribe((value) => console.log(value));
// 1, 2, 3
```

**核心思想**：Observable 只是一个**包装器**，保存了"如何生产数据"的函数，直到 `subscribe` 时才执行。

### 2. 完整的 Observable（带取消订阅）

```javascript
// RxJS 源码简化版
class Subscription {
  constructor() {
    this._teardowns = []; // 存储清理函数
    this.closed = false;
  }

  add(teardown) {
    if (teardown) {
      this._teardowns.push(teardown);
    }
  }

  unsubscribe() {
    if (!this.closed) {
      this.closed = true;
      // 执行所有清理函数
      this._teardowns.forEach((teardown) => {
        if (typeof teardown === "function") {
          teardown();
        } else if (teardown.unsubscribe) {
          teardown.unsubscribe();
        }
      });
    }
  }
}

class Observable {
  constructor(subscribe) {
    this._subscribe = subscribe;
  }

  subscribe(observerOrNext, error, complete) {
    // 标准化 observer
    const observer =
      typeof observerOrNext === "function"
        ? { next: observerOrNext, error, complete }
        : observerOrNext;

    const subscription = new Subscription();

    // 包装 observer，检查是否已取消
    const safeObserver = {
      next: (value) => {
        if (!subscription.closed && observer.next) {
          observer.next(value);
        }
      },
      error: (err) => {
        if (!subscription.closed && observer.error) {
          observer.error(err);
        }
        subscription.unsubscribe();
      },
      complete: () => {
        if (!subscription.closed && observer.complete) {
          observer.complete();
        }
        subscription.unsubscribe();
      },
    };

    // 执行订阅，获取清理函数
    const teardown = this._subscribe(safeObserver);
    subscription.add(teardown);

    return subscription;
  }
}

// 使用示例
const observable = new Observable((observer) => {
  let i = 0;
  const id = setInterval(() => {
    observer.next(i++);
  }, 1000);

  // 返回清理函数
  return () => {
    console.log("清理！");
    clearInterval(id);
  };
});

const subscription = observable.subscribe((x) => console.log(x));

// 3 秒后取消
setTimeout(() => {
  subscription.unsubscribe(); // 输出：清理！
}, 3000);
```

### 3. pipe 和操作符的实现

```javascript
// pipe 方法的实现
class Observable {
  // ...前面的代码

  pipe(...operators) {
    // 依次应用每个操作符
    return operators.reduce((source, operator) => operator(source), this);
  }
}

// 操作符就是一个函数：接收 Observable，返回新的 Observable
function map(fn) {
  return (source) =>
    new Observable((observer) => {
      return source.subscribe({
        next: (value) => observer.next(fn(value)),
        error: (err) => observer.error(err),
        complete: () => observer.complete(),
      });
    });
}

function filter(predicate) {
  return (source) =>
    new Observable((observer) => {
      return source.subscribe({
        next: (value) => {
          if (predicate(value)) {
            observer.next(value);
          }
        },
        error: (err) => observer.error(err),
        complete: () => observer.complete(),
      });
    });
}

// 使用
const source$ = new Observable((observer) => {
  observer.next(1);
  observer.next(2);
  observer.next(3);
  observer.next(4);
  observer.complete();
});

source$
  .pipe(
    filter((x) => x % 2 === 0),
    map((x) => x * 10)
  )
  .subscribe(console.log);
// 20, 40
```

**核心思想**：操作符是一个**高阶函数**，返回一个新的 Observable，内部订阅源 Observable 并转换数据。

### 4. Subject 的实现

```javascript
class Subject extends Observable {
  constructor() {
    super((observer) => {
      // 订阅时，把 observer 加入列表
      this.observers.push(observer);

      // 返回取消订阅的函数
      return () => {
        const index = this.observers.indexOf(observer);
        if (index > -1) {
          this.observers.splice(index, 1);
        }
      };
    });

    this.observers = [];
  }

  next(value) {
    // 通知所有订阅者
    this.observers.forEach((observer) => observer.next(value));
  }

  error(err) {
    this.observers.forEach((observer) => observer.error(err));
  }

  complete() {
    this.observers.forEach((observer) => observer.complete());
  }
}

// 使用
const subject = new Subject();

subject.subscribe((v) => console.log("A:", v));
subject.subscribe((v) => console.log("B:", v));

subject.next(1); // A: 1, B: 1
subject.next(2); // A: 2, B: 2
```

### 5. BehaviorSubject 的实现

```javascript
class BehaviorSubject extends Subject {
  constructor(initialValue) {
    super();
    this._value = initialValue;
  }

  get value() {
    return this._value;
  }

  next(value) {
    this._value = value; // 保存最新值
    super.next(value);
  }

  subscribe(observerOrNext, error, complete) {
    const subscription = super.subscribe(observerOrNext, error, complete);

    // 新订阅者立即收到当前值
    const observer =
      typeof observerOrNext === "function"
        ? { next: observerOrNext }
        : observerOrNext;

    observer.next(this._value);

    return subscription;
  }
}

// 使用
const behavior$ = new BehaviorSubject(0);
behavior$.next(1);
behavior$.next(2);

behavior$.subscribe((v) => console.log(v)); // 立即输出 2（最新值）
```

### 6. 源码结构总结

```
RxJS 核心结构：
├── Observable
│   ├── _subscribe: Function     // 订阅函数（生产者逻辑）
│   ├── subscribe(): Subscription // 开始订阅
│   └── pipe(): Observable        // 链式操作
│
├── Observer
│   ├── next(value)              // 接收值
│   ├── error(err)               // 接收错误
│   └── complete()               // 完成通知
│
├── Subscription
│   ├── closed: boolean          // 是否已取消
│   ├── add(teardown)            // 添加清理逻辑
│   └── unsubscribe()            // 取消订阅
│
├── Operator (高阶函数)
│   └── (source$) => new Observable(...)
│
└── Subject (Observable + Observer)
    ├── observers: Array         // 订阅者列表
    ├── next/error/complete      // 可以主动发送数据
    └── subscribe()              // 可以被订阅
```

### 设计模式解读

| 模式           | 在 RxJS 中的体现            |
| -------------- | --------------------------- |
| **观察者模式** | Observable 被 Observer 订阅 |
| **迭代器模式** | next/complete 像迭代器      |
| **组合模式**   | 操作符可以无限组合          |
| **装饰器模式** | 每个操作符包装原 Observable |

---

## 🎯 总结

### 核心概念

| 概念             | 作用                   |
| ---------------- | ---------------------- |
| **Observable**   | 数据流的生产者         |
| **Observer**     | 数据流的消费者         |
| **Subscription** | 订阅关系，可取消       |
| **Operators**    | 转换、过滤、组合数据流 |
| **Subject**      | 可多播的 Observable    |

### 常用操作符速查

| 操作符                 | 用途                   |
| ---------------------- | ---------------------- |
| `map`                  | 转换值                 |
| `filter`               | 过滤值                 |
| `switchMap`            | 切换到新流（取消旧的） |
| `mergeMap`             | 并行执行               |
| `debounceTime`         | 防抖                   |
| `distinctUntilChanged` | 去重                   |
| `catchError`           | 错误处理               |
| `retry`                | 重试                   |
| `takeUntil`            | 条件停止               |
| `forkJoin`             | 等待全部完成           |

### 一句话总结

> **RxJS = 用流的方式处理异步**，用操作符像管道一样转换数据，让复杂的异步逻辑变得简洁可读。

---

## 📚 相关资源

- [RxJS 官方文档](https://rxjs.dev/)
- [Learn RxJS](https://www.learnrxjs.io/)
- [RxJS Marbles](https://rxmarbles.com/) - 可视化操作符
- [RxJS 操作符决策树](https://rxjs.dev/operator-decision-tree)
