// ============================================================
// 手写 Promise 静态方法四兄弟：all / race / any / allSettled
// ============================================================

// ------------------------------------------------------------
// 1. Promise.all
//    语义：全部成功才成功，任一失败立即失败
//    结果：[v1, v2, ...] 按原顺序
// ------------------------------------------------------------
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
      // 非 Promise 值用 Promise.resolve 包装，统一处理
      Promise.resolve(item).then(
        (value) => {
          results[index] = value;       // 按原顺序填充
          remaining--;
          if (remaining === 0) resolve(results);
        },
        // 任一 reject 立即整体 reject；后续 resolve 会被忽略（Promise 状态不可变）
        (reason) => reject(reason)
      );
    });
  });
}

// ------------------------------------------------------------
// 2. Promise.race
//    语义：谁先 settle（无论成败）就用谁的结果
//    利用：Promise 状态不可变，后到的 resolve/reject 自动忽略
// ------------------------------------------------------------
function myPromiseRace(iterable) {
  return new Promise((resolve, reject) => {
    for (const item of iterable) {
      Promise.resolve(item).then(resolve, reject);
    }
    // 空数组不特殊处理：保持 pending（这就是规范行为）
  });
}

// ------------------------------------------------------------
// 3. Promise.any
//    语义：任一成功即成功，全部失败才失败
//    失败时返回 AggregateError，聚合所有 reason
// ------------------------------------------------------------
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
        resolve,                              // 任一成功 → 立即整体成功
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

// ------------------------------------------------------------
// 4. Promise.allSettled
//    语义：等所有 Promise 都 settle，永远不 reject
//    结果：[{status, value/reason}, ...]
// ------------------------------------------------------------
function myPromiseAllSettled(iterable) {
  return new Promise((resolve) => {           // 注意：没有 reject 参数
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

// ============================================================
// 测试
// ============================================================
const delay = (ms, value, fail = false) =>
  new Promise((resolve, reject) =>
    setTimeout(() => (fail ? reject(value) : resolve(value)), ms)
  );

// --- myPromiseAll ---
myPromiseAll([1, 2, 3]).then((r) => console.log('all 普通值:', r));      // [1, 2, 3]
myPromiseAll([1, Promise.resolve(2), delay(50, 3)])
  .then((r) => console.log('all 全成功:', r));                            // [1, 2, 3]
myPromiseAll([delay(30, 'a'), delay(10, 'boom', true), delay(100, 'c')])
  .catch((e) => console.log('all 有失败:', e));                           // 'boom'
myPromiseAll([]).then((r) => console.log('all 空数组:', r));              // []

// --- myPromiseRace ---
myPromiseRace([delay(100, '慢'), delay(10, '快')])
  .then((r) => console.log('race:', r));                                  // '快'

// --- myPromiseAny ---
myPromiseAny([delay(50, 'x', true), delay(20, 'y')])
  .then((r) => console.log('any 有成功:', r));                            // 'y'
myPromiseAny([delay(10, 'e1', true), delay(20, 'e2', true)])
  .catch((e) => console.log('any 全失败:', e.errors));                    // ['e1', 'e2']

// --- myPromiseAllSettled ---
myPromiseAllSettled([
  Promise.resolve('ok'),
  Promise.reject('fail'),
  delay(30, 'slow ok'),
  42,
]).then((r) => console.log('allSettled:', r));
// [
//   { status: 'fulfilled', value: 'ok' },
//   { status: 'rejected',  reason: 'fail' },
//   { status: 'fulfilled', value: 'slow ok' },
//   { status: 'fulfilled', value: 42 },
// ]
