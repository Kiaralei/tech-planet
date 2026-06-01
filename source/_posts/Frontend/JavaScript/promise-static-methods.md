---
title: 手写 Promise 四兄弟：all / race / any / allSettled
date: 2026-06-01 15:24:00
categories:
  - Frontend
  - JavaScript
tags:
  - JavaScript
  - Promise
  - 异步编程
  - 手写源码
---

# 手写 Promise 四兄弟：all / race / any / allSettled

`Promise.all`、`Promise.race`、`Promise.any`、`Promise.allSettled` 是异步编程里最常用的四个静态方法。它们语义相近、结构对称，**理解一个就能推出其它三个**。本文从语义出发，逐一手写实现，并把容易踩的坑（为什么要 `Promise.resolve` 包一层、Promise 是不是要"运行"等）说透。

---

## 一、四兄弟语义对照表

| 方法 | 何时成功 | 何时失败 | 结果形态 | 空数组行为 |
|---|---|---|---|---|
| `all` | **全部**成功 | **任一**失败 | `[v1, v2, ...]` 按原顺序 | 立即 resolve `[]` |
| `race` | **第一个** settle 的是成功 | **第一个** settle 的是失败 | 单个值 | **永远 pending** |
| `any` | **任一**成功 | **全部**失败 | 单个成功值 | 立即 reject `AggregateError` |
| `allSettled` | 全部 settle 后（**永不 reject**） | 同左 | `[{status, value/reason}, ...]` | 立即 resolve `[]` |

口诀：

- **all**：要么全好，要么全黄
- **race**：先到先得，不论好坏
- **any**：只求一胜，全败才败
- **allSettled**：好坏都收，一个不落

---

## 二、动手前先搞清两个关键点

### 1. 为什么要用 `Promise.resolve(item)` 包一层？

传给静态方法的数组里，**不一定都是 Promise**，可能混着普通值：

```js
Promise.all([1, 'hello', Promise.resolve(3)]);  // 合法
```

如果直接 `item.then(...)`，遇到数字、字符串就会报 `TypeError: item.then is not a function`。

`Promise.resolve` 是个**归一化适配器**：

| 传入 | 返回 |
|---|---|
| 普通值 `1` | 一个已 resolved 的 Promise，值为 `1` |
| 已经是 Promise | **原样返回**，不会再包一层 |
| thenable | 包装成 Promise，跟随它的状态 |

包一层之后，统一都能 `.then()`，不用做类型判断。

### 2. Promise 不需要"运行"，它已经在跑了

很多人初学时会想"在 `forEach` 里要不要调用 Promise 启动它"，**不用**。

```js
const p = new Promise((resolve) => {
  console.log('我已经在跑了！');   // 创建瞬间就执行
  setTimeout(() => resolve(42), 1000);
});

p.then(v => console.log(v));        // 这里只是订阅结果
```

- **Promise** 像一个**已经发车的快递** 📦，`.then()` 是在运单上写"到了通知我"
- **函数** 像一个**待启动的机器** 🔧，必须调用才会跑

所以在静态方法的实现里，我们做的是**收集结果**，不是**启动任务**。

### 3. Promise 状态不可变（race 的核心）

一个 Promise 一旦 settle（fulfilled / rejected），状态就锁死，后续再调用 `resolve/reject` 都会被静默忽略。

这条规则让 `race` 的实现可以极其简洁 —— 给每个 Promise 都挂上同一对 `(resolve, reject)`，谁先到谁就"赢"，其余的自动作废。

---

## 三、Promise.all

### 实现

```js
function myPromiseAll(iterable) {
  return new Promise((resolve, reject) => {
    const list = Array.from(iterable);
    const results = new Array(list.length);
    let remaining = list.length;

    // 空数组：立即 resolve []
    if (remaining === 0) {
      resolve(results);
      return;
    }

    list.forEach((item, index) => {
      Promise.resolve(item).then(
        (value) => {
          results[index] = value;          // 按 index 写入，保持原顺序
          remaining--;
          if (remaining === 0) resolve(results);
        },
        (reason) => reject(reason)         // 任一失败，立即整体失败
      );
    });
  });
}
```

### 关键细节

- **必须按 `index` 写入 `results`，不能用 `push`**：异步快慢不同，`push` 会乱序。
- **必须用 `remaining` 计数器追踪完成数**：原因见下一节。
- **空数组必须特判**：否则 `remaining` 永远到不了 0，Promise 永远 pending。

### 为什么必须用 `remaining` 计数器？

初学者常问：**为什么不能等 `forEach` 遍历结束直接 `resolve`？** 这个问题背后是对"同步循环"和"异步回调"边界的误解。

#### 核心结论

**`forEach` 是同步的，它在所有 Promise 还没 resolve 之前就已经跑完了。**

"遍历结束" 对应的是"任务**派发完成**"，而不是"任务**完成**"。我们要等的是后者。

#### 用时间线看

```js
console.log('1. forEach 开始');

list.forEach((item, index) => {
  console.log('2. 派发第', index, '个');     // 同步执行
  Promise.resolve(item).then((value) => {
    console.log('5. 第', index, '个完成');    // 异步，要等
  });
});

console.log('3. forEach 结束');
console.log('4. 同步代码全跑完');
```

输出顺序：

```
1. forEach 开始
2. 派发第 0 个
2. 派发第 1 个
2. 派发第 2 个
3. forEach 结束           ← 此刻所有 then 回调一个都没跑！
4. 同步代码全跑完
5. 第 0 个完成            ← 微任务/异步任务这时才开始执行
5. 第 1 个完成
5. 第 2 个完成
```

`forEach` 结束的瞬间，3 个 `then` 回调一个都还没执行。如果这时 `resolve(results)`，`results` 里全是 `undefined`。

#### 反例：在 forEach 后直接 resolve 会怎样

```js
function brokenPromiseAll(list) {
  return new Promise((resolve) => {
    const results = [];
    list.forEach((item, index) => {
      Promise.resolve(item).then((value) => {
        results[index] = value;
      });
    });
    resolve(results);   // ❌ 这里立刻就 resolve 了
  });
}

brokenPromiseAll([
  new Promise(r => setTimeout(() => r(1), 100)),
  new Promise(r => setTimeout(() => r(2), 100)),
]).then(console.log);
// 输出：[]  ← results 还是空的就被返回了
```

100ms 后 `setTimeout` 才 resolve 各个内部 Promise，但外层 Promise **状态已经定了**，再写 `results[index]` 也没用了（订阅者已经拿到空数组）。

#### 为什么不能用 `results.length === list.length` 代替？

两个原因：

1. **稀疏数组陷阱**：`results[2] = 'c'` 时，如果 `results[0]`、`results[1]` 还没赋值，`length` 会直接变成 3，但前两个位置是 `<empty>` —— 判断会假阳性。
2. **本质上没省事**：你还是要在**每个 then 里**做这个判断，跟 `remaining--` + `if (remaining === 0)` 是同一回事，还更绕。

#### 那能不能改写成不需要计数器？

可以，但都有代价。

**方案 A：用 reduce 串成 Promise 链**

```js
function myPromiseAll(iterable) {
  return Array.from(iterable).reduce(
    (acc, item) =>
      acc.then((results) =>
        Promise.resolve(item).then((v) => [...results, v])
      ),
    Promise.resolve([])
  );
}
```

能跑，但 **串行执行**，丢失了并行性 —— `Promise.all` 的核心价值就是并行，这就背离了语义。

**方案 B：`for await`**

```js
async function myPromiseAll(iterable) {
  const results = [];
  for (const item of iterable) {
    results.push(await Promise.resolve(item));
  }
  return results;
}
```

同样问题：串行。

#### 计数器是"等齐"问题的标准解法

回到本质，`Promise.all` 要解决的是：

> **N 个独立的异步任务，并行执行，全部完成时通知我。**

"全部完成"这个判断必须在**每个任务结束后**问一次："我是不是最后一个？" 最简洁的实现就是：

- 一个共享的整数 `remaining = N`
- 每个任务结束后做 `remaining--`
- 谁让 `remaining` 归零，谁就负责 `resolve`

这是经典的 **barrier / join 同步原语**，多线程编程里也是同一套思路（叫 latch、barrier、countdown latch）。计数器不是 hack，而是这类"并发汇合"问题的标准答案。

### 测试

```js
myPromiseAll([1, 2, 3]).then(console.log);                     // [1, 2, 3]
myPromiseAll([1, Promise.resolve(2), delay(50, 3)]).then(console.log); // [1, 2, 3]
myPromiseAll([delay(30, 'a'), delay(10, 'boom', true)]).catch(console.log); // 'boom'
myPromiseAll([]).then(console.log);                            // []
```

---

## 四、Promise.race

### 实现

```js
function myPromiseRace(iterable) {
  return new Promise((resolve, reject) => {
    for (const item of iterable) {
      Promise.resolve(item).then(resolve, reject);
    }
    // 空数组不特殊处理：保持 pending（这是规范行为）
  });
}
```

**就这么短**。利用"状态不可变"，谁先 settle 谁就抢到外层 Promise 的状态，后到的全部失效。

### 经典应用：超时控制

`race` 最常见的用法是给请求加超时：

```js
function withTimeout(promise, ms) {
  const timeout = new Promise((_, rej) =>
    setTimeout(() => rej(new Error('timeout')), ms)
  );
  return Promise.race([promise, timeout]);
}

withTimeout(fetch('/api/slow'), 3000)
  .then((res) => console.log(res))
  .catch((err) => console.log(err.message));  // 超过 3s 输出 'timeout'
```

---

## 五、Promise.any

### 实现

```js
function myPromiseAny(iterable) {
  return new Promise((resolve, reject) => {
    const list = Array.from(iterable);
    const errors = new Array(list.length);
    let remaining = list.length;

    if (remaining === 0) {
      reject(new AggregateError([], 'All promises were rejected'));
      return;
    }

    list.forEach((item, index) => {
      Promise.resolve(item).then(
        resolve,                            // 任一成功 → 立即整体成功
        (reason) => {
          errors[index] = reason;
          remaining--;
          if (remaining === 0) {
            reject(new AggregateError(errors, 'All promises were rejected'));
          }
        }
      );
    });
  });
}
```

### 与 `all` 的对称性

`any` 可以看成 `all` 的"成功/失败镜像"：

| | 成功回调 | 失败回调 |
|---|---|---|
| `all` | 填 `results`，归零 resolve | 立即 reject |
| `any` | 立即 resolve | 填 `errors`，归零 reject |

---

## 六、Promise.allSettled

### 实现

```js
function myPromiseAllSettled(iterable) {
  return new Promise((resolve) => {        // 注意：没有 reject 参数
    const list = Array.from(iterable);
    const results = new Array(list.length);
    let remaining = list.length;

    if (remaining === 0) {
      resolve(results);
      return;
    }

    list.forEach((item, index) => {
      Promise.resolve(item).then(
        (value) => {
          results[index] = { status: 'fulfilled', value };
          remaining--;
          if (remaining === 0) resolve(results);
        },
        (reason) => {
          results[index] = { status: 'rejected', reason };
          remaining--;
          if (remaining === 0) resolve(results);   // 失败也走 resolve
        }
      );
    });
  });
}
```

### 与 `all` 的差异

仅两处：

1. **失败处理**：不再 `reject(reason)`，而是把 `{status: 'rejected', reason}` 写入结果数组，**也走 `remaining--`**。
2. **结果格式**：成功的也包一层 `{status: 'fulfilled', value}`。

### 为什么需要它？

`Promise.all` 有个痛点：**一个失败，全部白等**。

```js
Promise.all([fetchUser(), fetchOrders(), fetchSettings()])
  .catch((err) => {
    // ❌ 只要有一个挂了，另两个的成功结果也拿不到
    // 而且都不知道是哪个挂了
  });
```

`allSettled` 解决这个：

```js
Promise.allSettled([fetchUser(), fetchOrders(), fetchSettings()])
  .then(([userR, ordersR, settingsR]) => {
    if (userR.status === 'fulfilled') showUser(userR.value);
    else showError('用户加载失败', userR.reason);
    // 其它字段同理
  });
```

典型场景：

- **页面初始化**：多个独立接口，一个挂掉不影响别的模块
- **批量操作**：上传 100 个文件，要知道哪些成功哪些失败
- **健康检查**：检查 5 个微服务，全部报告状态

---

## 七、四兄弟实现结构对比

四个实现高度对称，记住下面这张表就能默写：

```
                  成功回调           失败回调          外层 Promise 何时定状态
all          →    填 results        立即 reject       全成功 or 一失败
race         →    立即 resolve      立即 reject       第一个 settle 的
any          →    立即 resolve      填 errors         一成功 or 全失败
allSettled   →    填 results        填 results        全部 settle（永不 reject）
```

完整的可运行 demo（含测试用例）见 [demos/promise-static-methods.js](https://github.com/Kiaralei/tech-planet/blob/main/demos/promise-static-methods.js)。

---

## 八、常见误区回顾

1. **`Object.prototype.MyPromise = () => {...}`** —— 不要污染 `Object.prototype`，所有对象都会带上这个属性，遍历时容易出问题。
2. **`pList.forEach(e => pList())`** —— 把数组当函数调，是把 Promise 误当成"需要启动的任务"。Promise 已经在跑，直接挂 `.then()` 即可。
3. **`push` 收集结果** —— 异步快慢顺序不同会乱序，必须用 `index` 定位。
4. **忘记空数组特判** —— `all` / `any` / `allSettled` 都要判，否则 `remaining` 永远到不了 0。
5. **忘记包装非 Promise 值** —— 直接 `.then` 普通值会报错，要用 `Promise.resolve(item).then(...)`。

---

## 九、四兄弟实战对照

```js
const ps = [Promise.resolve(1), Promise.reject(2), Promise.resolve(3)];

Promise.all(ps).catch((e) => console.log('all:', e));
// all: 2 （短路失败，丢失 1 和 3）

Promise.race(ps).then((v) => console.log('race:', v));
// race: 1 （第一个 settle 的是 1）

Promise.any(ps).then((v) => console.log('any:', v));
// any: 1 （第一个成功的是 1）

Promise.allSettled(ps).then((rs) => console.log('allSettled:', rs));
// [
//   { status: 'fulfilled', value: 1 },
//   { status: 'rejected',  reason: 2 },
//   { status: 'fulfilled', value: 3 }
// ]
```

吃透这四个，加上 Promise 状态机的基本规则（pending → fulfilled / rejected 不可逆），日常异步流程基本都能写出来了。
