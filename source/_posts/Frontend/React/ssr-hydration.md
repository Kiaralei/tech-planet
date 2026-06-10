---
title: 一文搞懂 SSR 水合（Hydration）：从"能看"到"能点"
date: 2026-06-10 11:31:00
categories:
  - Frontend
  - React
tags:
  - SSR
  - Hydration
  - React
  - 性能优化
---

# 一文搞懂 SSR 水合（Hydration）：从"能看"到"能点"

如果你第一次听到"水合"这个词觉得莫名其妙，那很正常——它是 Hydration 的直译，本身是个比喻。这篇文章从零开始，把这个概念拆开讲清楚：**它解决什么问题、具体发生了什么、为什么会出问题、以及业界怎么优化它**。

---

## 一、先从两种渲染方式说起

要理解水合，得先理解 CSR 和 SSR 各自的流程。

### CSR（客户端渲染）：浏览器从一张白纸开始

纯 React 应用（比如 `create-react-app` 创建的项目）返回的 HTML 长这样：

```html
<!DOCTYPE html>
<html>
  <body>
    <div id="root"></div>
    <script src="/bundle.js"></script>
  </body>
</html>
```

注意 `<div id="root">` 是**空的**。用户看到的所有内容，都要等浏览器下载并执行完 `bundle.js`，由 React 在客户端"凭空"创建出 DOM：

```js
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('root')).render(<App />);
```

这个流程的问题很明显：

- **白屏时间长**：JS 没下载、没执行完之前，用户什么都看不到
- **SEO 不友好**：爬虫抓到的是一个空 div

### SSR（服务端渲染）：服务器先把 HTML 画好

SSR 的思路是：组件代码不光能在浏览器跑，也能在 Node.js 里跑。服务器收到请求后，先在服务端把组件渲染成完整的 HTML 字符串，直接返回：

```js
// 服务端
import { renderToString } from 'react-dom/server';

const html = renderToString(<App />);
// html = '<div><h1>商品列表</h1><button>加入购物车</button>...</div>'
res.send(`<div id="root">${html}</div>`);
```

浏览器拿到的 HTML 里已经有完整内容了，**用户立刻就能看到页面**。

但这里有一个关键问题，也是水合存在的全部理由：

> **这份 HTML 是"死"的。**

`renderToString` 输出的只是 HTML 字符串。HTML 本身没有能力携带 JS 逻辑——`onClick` 回调、`useState` 的状态、`useEffect` 的副作用，这些都不存在于 HTML 里。用户看到了"加入购物车"按钮，但点了没有任何反应。

---

## 二、水合：给静态 HTML"通电"

于是 SSR 必须再走一步：浏览器下载 JS bundle 后，React 在客户端再次运行 `<App />`，然后做一件特殊的事——

> **不是丢掉服务端的 HTML 重画一遍，而是把客户端构建的组件树与页面上已有的 DOM 逐节点"对接"起来：复用现有 DOM 节点，在上面挂载事件监听器，恢复组件状态。**

这一步就叫**水合（Hydration）**。

```js
// 客户端入口：注意不是 createRoot().render()
import { hydrateRoot } from 'react-dom/client';

hydrateRoot(document.getElementById('root'), <App />);
```

### 为什么叫"水合"？

这个比喻来自"脱水食品"：

- 服务端输出的 HTML 像**脱水的方便面饼**——形状完整、内容齐全，但是干的、没法吃
- 客户端 JS 像**热水**——注入之后，面饼"活"了过来
- 水合 = **把交互逻辑（水）注回静态结构（脱水的 HTML）里**

对应到技术细节，"脱水"（dehydrate）在 SSR 里也是个真实步骤：服务端会把渲染时用到的数据序列化成 JSON 嵌进 HTML（你在 Next.js 页面源码里看到的 `__NEXT_DATA__` 就是它），客户端水合时读取这份数据，保证两端用同一份数据渲染。

### React 的 hydrateRoot 到底做了什么

`hydrateRoot(container, <App />)` 的作用是：**让 React 接管一份已经由服务端生成好的 HTML**。

比如服务端已经返回了：

```html
<div id="root">
  <button>加入购物车</button>
</div>
```

浏览器能看到这个按钮，但它还没有 React 的组件状态、事件系统和更新能力。客户端执行：

```js
import { hydrateRoot } from 'react-dom/client';

hydrateRoot(document.getElementById('root'), <App />);
```

React 会开始把这份静态 DOM 变成自己可管理的应用树。

具体来说，`hydrateRoot` 会做这些事：

1. **在客户端重新运行组件**：React 会执行一遍 `<App />`，构建出对应的 Fiber 树。Fiber 可以理解成 React 内部维护的组件树和更新任务结构
2. **把 Fiber 树和已有 DOM 对齐**：React 不会默认清空 `#root` 重新创建 DOM，而是拿客户端生成的组件结构，去和服务端留下的真实 DOM 逐节点匹配
3. **复用匹配成功的 DOM 节点**：如果两边结构一致，React 会直接复用这些 DOM 节点，避免从零创建
4. **绑定事件系统**：比如 `onClick`、`onChange` 这些事件处理逻辑，会在水合过程中接入 React 的事件系统
5. **恢复组件状态和上下文关系**：`useState` 的初始状态、Context、refs、组件之间的父子关系都会重新建立
6. **调度副作用**：`useEffect` 不会在服务端执行，而是在客户端水合完成后再执行

所以 `hydrateRoot` 不是“把页面画出来”。页面在它执行之前已经能看到了。

它真正做的是：

> 把 React 的运行时能力接到已有 HTML 上，让页面从“能看”变成“能交互”。

它和普通客户端渲染最大的区别在这里：

```js
// CSR：从空容器开始创建 DOM
createRoot(root).render(<App />);

// SSR + Hydration：复用服务端已经存在的 DOM，并接管它
hydrateRoot(root, <App />);
```

如果 `hydrateRoot` 发现客户端第一次渲染出来的结构和服务端 HTML 不一致，就会出现 **Hydration Mismatch**。轻则控制台报警，重则 React 放弃复用这部分 DOM，退回客户端重新渲染。

### 一般意义上的水合做了什么

React 的 `hydrateRoot` 是一个具体 API，而水合（Hydration）是一类更通用的前端框架机制。

更抽象地说，水合就是：

> 客户端框架拿到服务端生成的静态 HTML 后，在浏览器里恢复应用的交互能力和运行时状态。

不同框架内部实现不完全一样，但一般都会做这些事：

1. **加载客户端 JavaScript**：服务端 HTML 只能表达结构和内容，真正的交互逻辑还在 JS bundle 里
2. **重新建立应用实例或组件树**：框架需要知道页面上每个 DOM 节点对应哪个组件、哪个状态、哪个事件
3. **匹配已有 DOM**：客户端生成的虚拟结构要和服务端 HTML 对上。能对上就复用，对不上就修正或重新渲染
4. **绑定事件**：按钮点击、输入框输入、表单提交等交互，在这一步接回框架运行时
5. **恢复数据和状态**：很多 SSR 框架会把服务端渲染时用过的数据序列化进 HTML，客户端水合时读取这份数据，保证第一次客户端渲染和服务端一致
6. **让页面进入可更新状态**：水合完成后，状态变化、路由跳转、用户交互才会被框架正常管理

可以把它理解成三层东西的重新对接：

```text
服务端 HTML：有内容，但没有完整交互能力
客户端 JS：有逻辑，但还没接管页面
水合过程：把 JS 逻辑、组件状态和已有 DOM 对接起来
```

最关键的一点是：

> 水合不是重新渲染整页，而是尽量复用已有 HTML/DOM。

这也是为什么水合要求服务端和客户端第一次渲染结果必须一致。只要两边第一眼长得不一样，框架就很难判断“哪个 DOM 节点对应哪个组件”。

水合完成后，页面才真正"可交互"。

### 一图看懂完整时间线

```text
CSR:  [请求] → [空白页面 😶] → [下载 JS] → [执行 JS] → [渲染出内容 + 可交互 ✅]
                └─────────── 白屏期 ───────────┘

SSR:  [请求] → [服务端渲染 HTML] → [看到内容 👀] → [下载 JS] → [水合] → [可交互 ✅]
                                    └────── 可见但点不动 ──────┘
```

注意 SSR 中间那段"**可见但点不动**"的窗口期——页面看起来好了，点按钮却没反应。这就是衡量指标里 **FCP（首次内容绘制）很快、但 TTI（可交互时间）滞后**的来源，也是 SSR 最著名的痛点。

---

## 三、水合不匹配（Hydration Mismatch）：最常见的坑

水合有一个前提假设：**客户端渲染出的结果，必须和服务端 HTML 完全一致**。React 是按"两边长得一样"去逐节点对接的，一旦不一样，对接就失败。

### 典型翻车代码

```jsx
function Clock() {
  // ❌ 服务端渲染时是 10:00:00.123，客户端水合时是 10:00:01.456
  return <p>当前时间：{new Date().toLocaleTimeString()}</p>;
}

function Greeting() {
  // ❌ 服务端没有 window，走 else 分支；客户端有，走 if 分支
  if (typeof window !== 'undefined') {
    return <p>欢迎回来，{localStorage.getItem('name')}</p>;
  }
  return <p>欢迎</p>;
}

function Lucky() {
  // ❌ 两端各 random 一次，结果必然不同
  return <p>幸运数字：{Math.random()}</p>;
}
```

常见诱因还有：日期/时区格式化在 Node 和浏览器表现不一致、浏览器插件篡改了 DOM（如划词翻译插件）、HTML 嵌套不合法被浏览器自动纠正（比如 `<p>` 里套 `<div>`，浏览器会拆开它，导致实际 DOM 和服务端字符串对不上）。

### 后果是什么

- 开发环境：控制台经典报错 `Hydration failed because the initial UI does not match what was rendered on the server`
- React 18+：放弃出错的子树，**退回客户端重新渲染**——页面闪一下，且这部分丢掉了 SSR 的性能收益
- 更隐蔽的情况：React 复用了错误的 DOM 节点，出现内容错乱

### 正确姿势

凡是"只有客户端才知道"的内容，应该**先按服务端的样子渲染，水合完成后再更新**：

```jsx
function Clock() {
  const [time, setTime] = useState(null); // 两端初始渲染一致：都是 null

  useEffect(() => {
    // useEffect 只在客户端、且在水合完成后执行
    setTime(new Date().toLocaleTimeString());
  }, []);

  return <p>当前时间：{time ?? '加载中...'}</p>;
}
```

如果差异确实无法避免（比如时间戳），可以用 `suppressHydrationWarning` 显式告诉 React"这里不一致是预期的"：

```jsx
<time suppressHydrationWarning>{Date.now()}</time>
```

但它只该用于单个文本节点的例外情况，不是消除警告的万能贴。

---

## 四、水合的性能问题与演进方向

水合虽然复用了 DOM，但**整棵组件树的 JS 仍然要下载、解析、执行一遍**。页面越大，水合越慢，"可见但点不动"的窗口就越长。更讽刺的是：页面上 90% 可能是纯展示内容（文章正文、商品描述），根本不需要交互，却也要陪着跑一遍水合。

业界沿着"少水合、晚水合、不水合"三个方向演进：

### 1. 流式 SSR + 选择性水合（React 18）

React 18 用 `renderToPipeableStream` 替代 `renderToString`，配合 `Suspense` 实现：

- **流式输出**：服务端不必等所有数据就绪，先把外壳 HTML 发出去，慢的部分（如评论区）后续以流的形式补上
- **选择性水合**：各个 `Suspense` 边界**独立水合**，不必等整页 JS 就绪；如果用户点击了尚未水合的区域，React 会**优先水合那个区域**

```jsx
<Layout>
  <Article />               {/* 先到先水合 */}
  <Suspense fallback={<Spinner />}>
    <Comments />            {/* 数据慢，晚点流过来，独立水合 */}
  </Suspense>
</Layout>
```

这是 Next.js App Router 的底层机制。

### 2. 岛屿架构（Islands Architecture）

Astro 等框架的思路：默认**整个页面都是纯静态 HTML，零 JS**，只有显式标记的交互组件（"岛屿"）才发送 JS 并水合：

```astro
<Article />                          {/* 纯 HTML，不水合 */}
<ShareButton client:load />          {/* 立即水合 */}
<Comments client:visible />          {/* 滚动到可视区域才水合 */}
```

静态内容是大海，交互组件是岛——水合的成本从"整页"缩小到"几个岛"。

### 3. 可恢复性（Resumability）：干脆不水合

Qwik 提出更激进的方案：水合的本质浪费在于**客户端重新执行了一遍服务端已经执行过的代码**，只为重建状态和绑定事件。那能不能不重新执行？

Qwik 把组件状态、事件绑定关系全部**序列化进 HTML**，客户端通过一个极小的全局 loader 监听事件；用户点击某个按钮时，才按需下载并执行那一小段处理函数。应用不是被"水合"激活的，而是从服务端中断的地方直接"**恢复**"（resume）执行——所以叫 Resumability。

### 三种方案对比

| 方案 | 代表 | 思路 | 客户端执行组件代码？ |
|---|---|---|---|
| 选择性水合 | React 18 / Next.js | 整页都水合，但拆块、分优先级 | ✅ 全部 |
| 岛屿架构 | Astro | 只水合少数交互岛 | ⚠️ 仅岛屿 |
| 可恢复性 | Qwik | 状态序列化进 HTML，按需执行 | ❌ 几乎不 |

---

## 五、总结

把整篇文章压缩成几句话：

1. **SSR 让用户更快看到内容，但服务端给的 HTML 没有事件和状态，是"死"的**
2. **水合 = 客户端 React 重新运行组件，与现有 DOM 逐节点对接，复用 DOM、绑定事件、恢复状态，让页面从"能看"变成"能点"**
3. **水合的前提是两端渲染结果一致**——`Date.now()`、`Math.random()`、`window` 分支是 mismatch 三大惯犯，解法是把客户端专属逻辑放进 `useEffect`
4. **水合的代价是 TTI 滞后**，React 18 的选择性水合、Astro 的岛屿架构、Qwik 的可恢复性分别从"晚水合、少水合、不水合"三个方向优化它

理解了水合，你也就理解了现代前端框架近几年大半的演进方向——它们都在和这一步的成本搏斗。
