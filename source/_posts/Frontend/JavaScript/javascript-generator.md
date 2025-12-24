---
title: JavaScript Generator 深入解析
date: 2025-12-24 14:23:52
categories:
  - Frontend
  - JavaScript
tags:
  - JavaScript
  - Generator
  - ES6
  - 异步编程
---

## 📚 什么是 Generator？

Generator（生成器）是 ES6 引入的一种特殊函数，它可以**暂停执行**和**恢复执行**，是实现异步编程和迭代器的强大工具。

### 🔑 核心特点

- **可暂停**：使用 `yield` 关键字暂停函数执行
- **可恢复**：通过 `next()` 方法恢复执行
- **惰性求值**：只在需要时才计算下一个值
- **双向通信**：可以在暂停和恢复时传递数据

---

## 🎯 基础语法

### 定义 Generator 函数

```javascript
// 使用 function* 定义生成器函数
function* generatorFunction() {
  yield "first";
  yield "second";
  return "done";
}

// 调用生成器函数返回一个迭代器对象
const iterator = generatorFunction();
```

### next() 方法

```javascript
iterator.next(); // { value: 'first', done: false }
iterator.next(); // { value: 'second', done: false }
iterator.next(); // { value: 'done', done: true }
iterator.next(); // { value: undefined, done: true }
```

---

## 💡 执行流程详解

### 示例代码

```javascript
function* read() {
  let a = yield "a";
  console.log("a =", a);

  let b = yield "b";
  console.log("b =", b);

  let c = yield "c";
  console.log("c =", c);

  return "end";
}

const iterator = read();
```

### 执行步骤分析

```javascript
// 步骤 1️⃣：第一次调用 next()
console.log(iterator.next());
// 🔸 执行到第一个 yield 'a' 处暂停
// 🔸 返回：{ value: 'a', done: false }
// 🔸 注意：此时 a 还未赋值

// 步骤 2️⃣：第二次调用 next('x')
console.log(iterator.next("x"));
// 🔸 将 'x' 作为上一个 yield 的返回值，赋值给 a
// 🔸 执行 console.log("a =", a) → 输出：a = x
// 🔸 执行到第二个 yield 'b' 处暂停
// 🔸 返回：{ value: 'b', done: false }

// 步骤 3️⃣：第三次调用 next('y')
console.log(iterator.next("y"));
// 🔸 将 'y' 作为上一个 yield 的返回值，赋值给 b
// 🔸 执行 console.log("b =", b) → 输出：b = y
// 🔸 执行到第三个 yield 'c' 处暂停
// 🔸 返回：{ value: 'c', done: false }

// 步骤 4️⃣：第四次调用 next('z')
console.log(iterator.next("z"));
// 🔸 将 'z' 作为上一个 yield 的返回值，赋值给 c
// 🔸 执行 console.log("c =", c) → 输出：c = z
// 🔸 执行到 return 'end' 语句
// 🔸 返回：{ value: 'end', done: true }

// 步骤 5️⃣：第五次调用 next()
console.log(iterator.next());
// 🔸 生成器已经执行完毕
// 🔸 返回：{ value: undefined, done: true }
```

### 完整输出

```
{ value: 'a', done: false }
a = x
{ value: 'b', done: false }
b = y
{ value: 'c', done: false }
c = z
{ value: 'end', done: true }
{ value: undefined, done: true }
```

---

## 🔍 关键要点

### 1. yield 的双重作用

```javascript
function* demo() {
  // yield 既是"暂停点"，也是"接收值的表达式"
  const result = yield "output"; // 输出 'output'，接收下次 next() 的参数
  console.log("received:", result);
}

const it = demo();
it.next(); // 输出：{ value: 'output', done: false }
it.next("input"); // 输出：received: input
```

### 2. 第一次 next() 的参数会被忽略

```javascript
function* demo() {
  const x = yield 1;
  console.log(x);
}

const it = demo();
it.next("ignored"); // 第一次调用的参数无效
it.next("received"); // 输出：received
```

**原因**：第一次调用 `next()` 时，还没有任何 yield 表达式等待接收值。

---

## 🎨 实际应用场景

### 1. 实现无限序列

```javascript
// 斐波那契数列生成器
function* fibonacci() {
  let [prev, curr] = [0, 1];

  while (true) {
    yield curr;
    [prev, curr] = [curr, prev + curr];
  }
}

const fib = fibonacci();
console.log(fib.next().value); // 1
console.log(fib.next().value); // 1
console.log(fib.next().value); // 2
console.log(fib.next().value); // 3
console.log(fib.next().value); // 5
```

### 2. 遍历数据结构

```javascript
// 遍历树结构
function* traverseTree(node) {
  yield node.value;

  if (node.children) {
    for (const child of node.children) {
      yield* traverseTree(child); // yield* 委托给另一个生成器
    }
  }
}

const tree = {
  value: 1,
  children: [
    { value: 2, children: [{ value: 4 }, { value: 5 }] },
    { value: 3 },
  ],
};

for (const value of traverseTree(tree)) {
  console.log(value); // 1, 2, 4, 5, 3
}
```

### 3. 控制异步流程

```javascript
// 模拟异步操作
function* fetchData() {
  console.log("开始获取数据...");

  const user = yield fetch("/api/user");
  console.log("用户信息：", user);

  const posts = yield fetch(`/api/posts/${user.id}`);
  console.log("用户文章：", posts);

  return posts;
}

// 执行器函数
function run(generator) {
  const iterator = generator();

  function handle(result) {
    if (result.done) return result.value;

    result.value
      .then((data) => data.json())
      .then((data) => handle(iterator.next(data)))
      .catch((err) => iterator.throw(err));
  }

  handle(iterator.next());
}

// 使用
run(fetchData);
```

### 4. 实现迭代器协议

```javascript
// 自定义可迭代对象
const range = {
  from: 1,
  to: 5,

  // 使 range 可迭代
  *[Symbol.iterator]() {
    for (let value = this.from; value <= this.to; value++) {
      yield value;
    }
  },
};

// 使用 for...of 遍历
for (const num of range) {
  console.log(num); // 1, 2, 3, 4, 5
}

// 使用展开运算符
console.log([...range]); // [1, 2, 3, 4, 5]
```

---

## 🆚 Generator vs Async/Await

| 特性         | Generator             | Async/Await       |
| ------------ | --------------------- | ----------------- |
| **语法**     | `function*` + `yield` | `async` + `await` |
| **返回值**   | Iterator 对象         | Promise 对象      |
| **执行控制** | 手动调用 `next()`     | 自动执行          |
| **适用场景** | 惰性求值、自定义迭代  | 异步操作          |
| **易用性**   | ⭐⭐⭐                | ⭐⭐⭐⭐⭐        |

**注意**：Async/Await 本质上是基于 Generator 和 Promise 的语法糖。

---

## 📊 常用方法

### 1. next(value)

继续执行并可选地传入一个值给上一个 `yield` 表达式。

```javascript
function* gen() {
  const x = yield;
  console.log(x);
}

const g = gen();
g.next(); // 启动生成器
g.next("hello"); // 输出：hello
```

### 2. return(value)

提前终止生成器并返回给定的值。

```javascript
function* gen() {
  yield 1;
  yield 2;
  yield 3;
}

const g = gen();
console.log(g.next()); // { value: 1, done: false }
console.log(g.return("end")); // { value: 'end', done: true }
console.log(g.next()); // { value: undefined, done: true }
```

### 3. throw(error)

向生成器抛出一个错误。

```javascript
function* gen() {
  try {
    yield 1;
  } catch (e) {
    console.log("捕获错误：", e);
  }
}

const g = gen();
g.next();
g.throw(new Error("出错了")); // 输出：捕获错误：Error: 出错了
```

---

## 💡 最佳实践

### ✅ 推荐

```javascript
// 1. 使用有意义的变量名
function* generateIds() {
  let id = 0;
  while (true) {
    yield ++id;
  }
}

// 2. 处理边界情况
function* safeGenerator(max) {
  let count = 0;
  while (count < max) {
    yield count++;
  }
}

// 3. 使用 try-finally 清理资源
function* withResource() {
  const resource = acquireResource();
  try {
    yield resource;
  } finally {
    releaseResource(resource);
  }
}
```

### ❌ 避免

```javascript
// 1. 不要在生成器外部修改内部状态
// 2. 避免过度使用，简单场景用普通函数
// 3. 注意内存泄漏（无限生成器要小心使用）
```

---

## 🎯 总结

- **Generator 是什么**：可暂停和恢复执行的特殊函数
- **核心概念**：`yield` 暂停，`next()` 恢复，双向数据传递
- **主要用途**：惰性求值、自定义迭代器、流程控制
- **现代替代**：对于异步操作，Async/Await 更加简洁和易用
- **学习价值**：理解 Generator 有助于深入理解 JavaScript 的异步编程机制 ✨

---

## 📚 相关资源

- [MDN - Generator](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Generator)
- [ES6 Generator 详解](https://es6.ruanyifeng.com/#docs/generator)
- [异步编程系列](https://javascript.info/async)
