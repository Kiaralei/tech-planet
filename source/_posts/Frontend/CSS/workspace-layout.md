---
title: 工作台布局实战：打造类飞书的企业级 Web 应用界面
date: 2026-01-19 10:45:41
tags:
---

# 整体布局结构

```
┌─────────────────────────────────────────────────────────────┐
│                      Header (固定在顶部)                      │
│                        height: 60px                          │
├────────────┬────────────────────────────────────────────────┤
│            │                                                │
│   Sider    │                Content                         │
│  (可折叠)   │            (独立滚动容器)                        │
│   200-500px │                                               │
│            │  ┌─────────────────────────────────────────┐  │
│            │  │        页面内容 (env/config)              │  │
│            │  │  ┌─────────────────────────────────┐   │  │
│            │  │  │       TopCard (sticky top)      │   │  │
│            │  │  └─────────────────────────────────┘   │  │
│            │  │  ┌───────┬─────────────────────────┐   │  │
│            │  │  │Menu   │        Title            │   │  │
│            │  │  │sticky │ (sticky top: 24px)      │   │  │
│            │  │  │top:24 │─────────────────────────│   │  │
│            │  │  │       │ ModuleRenderer 列表      │   │  │
│            │  │  │       │ (可滚动内容)             │   │  │
│            │  │  └───────┴─────────────────────────┘   │  │
│            │  └─────────────────────────────────────────┘  │
└────────────┴────────────────────────────────────────────────┘
```

## 滚动区域的花粉

核心原理：项目只有一个滚动容器，就是 Content

```
 <Layout
  style={{
    marginTop: 60,
    height: "calc(100vh - 60px)",
    overflow: "hidden",
  }}
>
  {/* 侧边栏 */}
  <Sider
    style={{
      height: "100%",
      overflowY: "auto",
      overflowX: "hidden",
    }}
  >
  </Sider>

  {/* 主内容区域 */}
  <Content
    className="px-[40px] bg-white"
    style={{
      height: "100%",
      overflowY: "auto",
      overflowX: "auto",
    }}
  >
    ...
  </Content>
</Layout>
```

**关键点：**

1. 外层 Layout 设置 overflow: hidden，自身不产生滚动
2. Sider（左侧侧边栏）和 Content（右侧内容）各自独立滚动
3. 两者高度都是 100%，填满视口剩余高度

## 左右滚动互不干扰

这是 CSS 的 BFC（块级格式化上下文） 和 独立滚动容器 原理：

```
┌────────────┬────────────────────────────────────────────────┐
│   Sider    │                Content                         │
│ ┌────────┐ │ ┌────────────────────────────────────────────┐ │
│ │        │ │ │                                            │ │
│ │ 滚动   │ │ │    滚动容器 B                              │ │
│ │ 容器 A │ │ │    overflow-y: auto                        │ │
│ │ overflow│ │ │                                            │ │
│ │ -y:auto│ │ │    当鼠标在这里滚动时，                      │ │
│ │        │ │ │    只有这个容器响应滚动事件                  │ │
│ └────────┘ │ └────────────────────────────────────────────┘ │
└────────────┴────────────────────────────────────────────────┘
```

**浏览器滚动事件的冒泡规则：**
当你在某个元素上滚动时，浏览器会找到最近的可滚动祖先  
如果 Content 设置了 overflow-y: auto，鼠标在 Content 内滚动时，只会滚动 Content  
Sider 同理，有自己的 overflow-y: auto

# Sticky 布局

## 什么是 Sticky？

position: sticky 是一种"混合定位"：
正常情况：元素跟随文档流
滚动到阈值时：元素"粘"在指定位置，表现像 fixed

## 关键前提：Sticky 必须在滚动容器内生效

```
滚动容器 (overflow: auto/scroll)
└── 普通内容
└── sticky 元素 (position: sticky; top: 24px)
└── 更多内容...
```

在本项目中，Content 就是滚动容器，所有 sticky 元素都在它内部。

# Title 的吸顶检测

```
  const sentinelRef = useRef<HTMLDivElement>(null);
  // 检测是否处于 sticky 吸顶状态
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const scrollContainer = document.querySelector(".ant-layout-content");
    if (!scrollContainer) return;

    const checkSticky = () => {
      const sentinelRect = sentinel.getBoundingClientRect();
      const containerRect = scrollContainer.getBoundingClientRect();
      // 当 sentinel 的顶部小于等于滚动容器的顶部时，说明已经吸顶
      // 加上一点容差（sticky top-6 = 24px）
      setIsScrolled(sentinelRect.top <= containerRect.top + 24);
    };

    checkSticky();
    scrollContainer.addEventListener("scroll", checkSticky, { passive: true });
    return () => scrollContainer.removeEventListener("scroll", checkSticky);
  }, []);

  return(
    <>
      {/* Sentinel 元素，用于检测滚动状态 */}
      <div ref={sentinelRef} className="h-0 w-0" />
      ...
    </>
  )
```

```
初始状态（未吸顶）：
┌────────────────────────────────┐ ← scrollContainer.top
│                                │
│   24px 间距                     │
│                                │
│ ──sentinel (h:0)───────────────│ ← sentinelRect.top > containerRect.top + 24
│ ┌─────────────────────────────┐│
│ │ Title                       ││
│ └─────────────────────────────┘│

吸顶状态：
┌────────────────────────────────┐ ← scrollContainer.top
│ ──sentinel────────────────────│ ← sentinelRect.top <= containerRect.top + 24
│ ┌─────────────────────────────┐│ ← 粘在 top: 24px
│ │ Title (有底部线)             ││
│ └─────────────────────────────┘│
│ 下方内容被推上来...             │
```
