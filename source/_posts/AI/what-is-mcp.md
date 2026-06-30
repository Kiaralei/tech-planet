---
title: 什么是 MCP：给大模型接上外部世界的「USB-C」
date: 2026-06-30 14:00:00
categories:
  - AI
  - AI 工程
tags:
  - MCP
  - LLM
  - Agent
  - Claude
---

大模型本身是个「关在盒子里的大脑」：它会推理、会写字，但看不到你的数据库、读不了你本地的文件、调不了公司的内部 API。要让它真正干活，就得给它接上外部世界——读数据、调工具、做操作。

**MCP（Model Context Protocol，模型上下文协议）** 就是为这件事定的一套开放标准。它由 Anthropic 在 2024 年底提出并开源，现在已经成为 AI 工具生态里事实上的通用接口。

---

## 一、它解决的是「M×N 集成爆炸」问题

在 MCP 之前，让模型接外部能力是一件很碎的事。假设你有 M 个 AI 应用（Claude Desktop、某个 IDE 插件、自研 Agent……），要接 N 个数据源/工具（GitHub、数据库、Slack、文件系统……）。

每个应用都要为每个工具单独写一套对接代码，总共要写 **M × N** 套集成。换个应用、换个工具，又得重来。

```text
没有标准协议：每个 App 都要为每个工具写专属对接

   App A ──┬── GitHub
           ├── 数据库
           └── Slack
   App B ──┬── GitHub      ← 同样的对接又写一遍
           ├── 数据库
           └── Slack
   → M × N 套胶水代码
```

MCP 的思路和 USB-C 一样：**定义一个统一接口**。工具方只要实现一次 MCP Server，任何支持 MCP 的应用都能即插即用；应用方只要实现一次 MCP Client，就能接入所有 MCP Server。

```text
有了 MCP：大家都对着同一个协议

   App A ─┐                 ┌─ GitHub Server
   App B ─┼─── MCP 协议 ───┼─ 数据库 Server
   App C ─┘                 └─ Slack Server
   → M + N 套实现，互相通用
```

集成复杂度从 **M × N 降到 M + N**。这就是「AI 界的 USB-C」这个比喻的来源。

---

## 二、架构：Host、Client、Server

MCP 是经典的**客户端-服务器**架构，但有三个角色要分清：

```text
┌─────────────────────────────────────────────┐
│  Host  宿主应用（Claude Desktop / IDE / Agent）│
│  ┌───────────┐   ┌───────────┐               │
│  │ MCP Client│   │ MCP Client│  每个 Client   │
│  └─────┬─────┘   └─────┬─────┘  对应一个 Server│
└────────┼───────────────┼──────────────────────┘
         │ JSON-RPC 2.0  │
   ┌─────┴─────┐   ┌─────┴─────┐
   │ MCP Server│   │ MCP Server│  暴露工具/数据
   │ (文件系统) │   │ (GitHub)  │
   └───────────┘   └───────────┘
```

- **Host（宿主）**：用户直接用的 AI 应用，内部跑着大模型。它负责管理若干 Client、决定调用哪些能力、处理权限。
- **Client（客户端）**：住在 Host 里，和某个 Server 保持 **1:1** 连接，负责协议层的收发。
- **Server（服务端）**：一个轻量程序，把某类能力（一个数据库、一个 API、本地文件……）按 MCP 规范暴露出来。

底层通信用 **JSON-RPC 2.0**。连接建立时有一次 `initialize` 握手，双方**协商各自支持的能力**（capability negotiation），之后才开始正常交互。

---

## 三、Server 能提供的三类东西

这是 MCP 最该记住的部分。一个 Server 可以向模型暴露三种「原语（primitives）」，区别在于**由谁主导调用**：

### 1. Tools（工具）—— 模型主导

可被模型调用的函数，带名字、描述和 JSON Schema 参数。比如 `create_issue(repo, title, body)`、`run_query(sql)`。模型在对话中自己判断要不要调、传什么参数。**这是 MCP 用得最多的能力**，本质上是把「函数调用 / tool use」标准化、跨应用化了。

### 2. Resources（资源）—— 应用/数据主导

只读的上下文数据，用 URI 标识，比如一个文件、一段数据库记录、一个网页快照。它更像「给模型看的素材」而不是「让模型执行的动作」，通常由宿主应用决定把哪些资源喂进上下文。

### 3. Prompts（提示模板）—— 用户主导

预设好的提示词模板 / 工作流，常以斜杠命令、按钮等形式呈现给用户主动触发。比如「帮我 review 这个 PR」背后是一段精心写好的、可复用的 prompt 模板。

> 一句话区分：**Tools 是模型想调就调，Resources 是应用喂给模型看，Prompts 是用户点了才用。**

反过来，Server 也能请求 Client 侧的能力，例如 **Sampling**（让 Server 反过来借宿主的大模型生成一段内容）、**Roots**（告诉 Server 它能访问的文件系统边界）、以及较新的 **Elicitation**（Server 运行中向用户追问、补充输入）。这让交互可以双向流动，而不只是「应用单向调工具」。

---

## 四、本地还是远程：两种传输方式

MCP 不规定你把 Server 跑在哪，靠**传输层（transport）**适配不同场景：

- **stdio**：Server 作为本地子进程，通过标准输入输出通信。适合访问本地文件、本地数据库这类「就在你机器上」的能力，延迟低、无需联网。
- **Streamable HTTP**：基于 HTTP 的远程传输（早期方案是 HTTP + SSE，现已演进为 Streamable HTTP），适合托管在云端、给多用户共享的 Server。

无论哪种传输，上层都是同一套 JSON-RPC 消息，所以同一个 Server 逻辑可以在本地和远程之间平滑迁移。

---

## 五、一次工具调用的完整流程

把前面的概念串起来，看模型用 MCP 调一次工具发生了什么：

```text
1. 启动：Host 拉起各个 MCP Server，Client 与之 initialize 握手、协商能力
2. 发现：Client 向 Server 请求「你有哪些 Tools/Resources/Prompts」
3. 注入：Host 把可用工具的名字、描述、参数 Schema 放进模型上下文
4. 决策：用户提问 →  模型判断需要调用某个工具，产出一个工具调用请求
5. 调用：Client 把请求按 JSON-RPC 发给对应 Server
6. 执行：Server 真正干活（查库 / 调 API / 读文件），把结果回传
7. 续写：结果塞回模型上下文，模型据此生成最终回答（必要时再调下一个工具）
```

可以看到，**模型本身永远不直接碰外部系统**——它只是「决定要调什么」，真正的执行、鉴权、边界控制都在 Server 和 Host 这一侧。这对安全和可控性很关键：权限、审计、人审确认都能卡在协议这一层。

---

## 六、为什么它重要

MCP 真正的价值不在协议细节，而在它**把生态打通了**：

- **对工具方**：写一次 Server，所有支持 MCP 的客户端（Claude、各类 IDE、自研 Agent）都能用，不用为每家单独适配。
- **对应用方**：实现一次 Client，就能接入整个不断增长的 Server 生态。
- **对 Agent 开发**：Agent 的能力边界不再写死在代码里，而是「插拔式」的——想让它会发邮件，就挂一个邮件 Server；想让它读公司知识库，就挂一个对应 Server。

这也正是「用 Claude Code / Codex 做开发」时，工程基建的一块核心：与其把外部能力硬编码进 prompt 或脚本，不如沉淀成标准化、可复用、可共享的 MCP Server，让不同项目、不同工具链都能复用同一套能力接入。

---

## 七、进阶：为什么是「连接」，而不只是「一套接口」

很多人第一反应是：MCP 不就是一套接口规范吗，为什么还要 Client 和 Server 建立连接？关键区别在于——**MCP 不是一套「无状态接口」，而是一套「会话式协议」**。

对比你熟悉的普通 REST API：你事先看文档，把 `POST /createIssue` 这种端点**写死在代码里**；每次请求**互相独立**，服务端不记得上次；而且只能**你问它答**。这套模式下确实「就是一套接口」，不需要连接。

MCP 偏偏要做四件 REST 做不到的事，于是只能选会话模型：

1. **能力协商**：宿主可能挂上一个**从没见过**的 Server，连上第一步要 `initialize` 握手，互报协议版本和支持的能力。这是一次性的会话状态。
2. **动态发现**：工具不是写死的，而是 Client 连上后**运行时问出来**的——「你都有哪些 tools？」换个 Server 工具集就变，宿主不用改代码。
3. **双向通信**：Server 能**反向找 Client**（借用宿主大模型的 Sampling、运行中追问用户的 Elicitation）。这要求一条双方都能随时说话的通道。
4. **主动推送**：工具列表变了、资源更新了、长任务报进度——都由 Server 主动推给 Client。

| | 普通 REST API | MCP |
|---|---|---|
| 接口怎么来 | 看文档、写死 | 连上后**运行时问出来** |
| 状态 | 无状态，每次独立 | **有会话**（握手协商后保持） |
| 谁能发起 | 只有客户端 | **双向**，服务端也能主动发 |
| 推送 | 不行 | 支持通知 / 进度 / 订阅 |
| 比喻 | 自动售货机：投币出货，互不记得 | **打电话 / SSH 会话**：先接通、互相知道底细、谁都能随时说话 |

> 「接口」是 MCP 的一部分，但这套接口是在**一条活的连接里被发现和调用**的，而不是被你提前写死的。连接换来的，是即插即用和双向通信。

---

## 八、进阶：Server 是怎么做到主动推送的

Server 能推送，靠的不是 HTTP 那种「一问一答」，而是**底层一条持续的双向消息流 + JSON-RPC 的消息类型设计**。

根基是 JSON-RPC 2.0 的三种消息，**两个方向都能发**：

| 消息类型 | 有没有 `id` | 对方要回吗 |
|---|---|---|
| **Request** | 有 | 要，回一个同 id 的 Response |
| **Response** | 有（对应某个 Request） | 不用 |
| **Notification** | 没有 | 不用回，纯通知 |

那个 `id` 是关键：它让**一条单一的双向通道**能把「我问它答」和「它问我答」揉在一起还不乱——我发的 Request 带我的 id，对方 Response 带同一个 id 我能对上号；对方主动发来的 Request / Notification，我就当「别人找我」处理。**协议层根本没规定只能 Client 发起**，这就是反向推送在原理上成立的根本。

剩下只需传输层能让双方在任意时刻往对面写字节：

- **stdio（本地）**：Server 是宿主拉起的子进程，走它的 stdin / stdout。stdout **不是只在回复时才写**——Server 想推就随时往 stdout 写一条 JSON-RPC 消息，Client 那边有个循环一直在读、读到就分发。本地场景下「推送」几乎是免费的，管道本就是全双工。
- **HTTP（远程）**：普通 HTTP 服务端推不了，所以用 **SSE（Server-Sent Events）**——客户端发起请求后，服务端把响应设成 `text/event-stream` 并**保持不关闭，持续往里写 `data: {...}` 事件**，撑起一条 server→client 的长连接下行通道。早期方案是 GET（SSE 下行）+ POST（上行）两个端点；现在的 **Streamable HTTP** 收敛成单端点：Client 用 POST 发消息，Server 可直接回单条 JSON，也可把这次响应**升级成 SSE 流**，在其中陆续写响应、进度、甚至反向请求。

> 一句话：**持续的双向字节通道 + JSON-RPC 用 id 多路复用**。本地靠子进程的 stdout 随时可写，远程靠 SSE 长连接撑起下行——这也正是「建立连接」的意义之一：留住一条能让 Server 随时说话的通道。

---

## 九、进阶：MCP 是不是越多越好

不是。这是 AI 工程里典型的「贪多反受其害」，原因分几层：

1. **工具定义在吃上下文**：每挂一个 Server，它**所有工具的名字、描述、参数 Schema 都要塞进模型上下文，而且每轮都塞**。几十个工具就是上万 token 的固定开销——既花钱，又挤占了留给真正任务的窗口，还让 prefill 更重、首字更慢。
2. **工具一多，模型反而选不准**：候选越多，挑对工具的准确率越低；功能相近、描述含糊的工具会互相干扰，模型容易调错、传错参。工具集不是能力清单，是**决策负担**。
3. **安全面被放大**：每个 Server 都是真在跑、带访问权限的代码。挂得越多，攻击面越大，prompt injection 能撬动的能力越多，要信任和审计的第三方也越多。
4. **启动、延迟、维护成本**：每个 Server 要拉进程、握手、保活，越多越慢、越容易某个挂了拖累整体。

正确姿势是**按需、最小必要集**——当前任务需要什么才挂什么：按项目 / 会话裁剪启用的 Server、合并重复能力、把工具描述写清楚、甚至让工具**按需加载**而不是一开始全塞进上下文。

> MCP 的价值在「接得对」，不在「接得多」。可插拔恰恰意味着该插才插、用完可拔，而不是一股脑全插上——这背后其实是**上下文工程**：把模型有限的注意力和窗口，留给真正重要的东西。

---

## 十、进阶：Agent 是怎么把 Server 接进来的

最后落到实处——所谓「挂一个 MCP」，Agent 内部到底做了什么？先澄清一个误解：**Client 不是你单独安装/加载的东西，它是宿主（Agent）内部的组件。你给的是「连哪些 Server」的配置，Agent 据此把 Client 一个个建出来，通常一个 Server 对应一个 Client 实例。**

分两种情况。

### 1. 用现成宿主（Claude Code / IDE）——配置驱动

你不写代码，只给一份配置列出要连的 Server（Claude 系是 `mcpServers` / 项目里的 `.mcp.json`）：

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/项目路径"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "xxx" }
    },
    "remote-svc": {
      "url": "https://example.com/mcp"
    }
  }
}
```

宿主启动时读配置，对**每一项**做四步：

1. **建传输 + 拉起 Server**：stdio 型（有 `command`）把它当**子进程拉起来**并接上 stdin/stdout；HTTP 型（有 `url`）对地址开 HTTP/SSE 连接。
2. **建一个 Client 实例**绑定这条传输。
3. **握手 + 发现**：Client 发 `initialize` 协商能力，再 `tools/list` 等问出这个 Server 有哪些工具。
4. **注册到模型**：把发现到的工具并入模型本轮可用的工具集（可能受上下文预算 / 过滤影响，见第九节的「按需加载」）。

### 2. 自己写 Agent（用 SDK）——代码驱动

如果用 MCP SDK / Agent SDK 自己搭，「加载 Client」就是显式实例化一个 Client、给它 transport、`connect`（TS 伪代码）：

```ts
import { Client } from "@modelcontextprotocol/sdk/client";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio";

// 1. 选传输：本地子进程
const transport = new StdioClientTransport({
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-github"],
  env: { GITHUB_TOKEN: "xxx" },
});

// 2. 建 Client 并连接（内部完成 initialize 握手）
const client = new Client({ name: "my-agent", version: "1.0.0" });
await client.connect(transport);

// 3. 发现工具
const { tools } = await client.listTools();

// 4. 模型决定调用时再执行
const result = await client.callTool({ name: "create_issue", arguments: { /* ... */ } });
```

要连多个 Server 就重复这套，得到多个 Client。Agent 内部维护一张表：**工具名 → 对应哪个 Client**。

### 3. 运行时：一次工具调用怎么路由

```text
启动期:  Agent 读配置 → 对每个 Server: 拉起/连接 → new Client → 握手 → listTools
                         ↓ 得到 {工具名 → Client} 映射表，工具并入模型上下文
运行期:  用户提问 → 模型产出一个工具调用（比如 create_issue）
        → Agent 查映射表，找到 github 那个 Client
        → client.callTool() 经传输发给 Server → Server 干活 → 结果回传
        → 塞回模型上下文 → 模型续写回答
```

关键点：**模型只负责「说要调哪个工具」，真正「建 Client、拉进程、发请求、收结果」全是 Agent（宿主）这层在干。** 模型不知道底层是 stdio 还是 HTTP，也不直接碰 Server。所以你平时「挂 MCP」动的是那份配置，Client 的生命周期由宿主替你管理。

---

## 一句话总结

> MCP 是给大模型用的统一外设接口：模型负责「想」，MCP Server 负责「连」和「做」。它用一套基于 JSON-RPC 的标准协议，把「每个应用各接各的工具」变成「大家共用一套即插即用的能力市场」，从而让集成成本从 M×N 降到 M+N。

理解了 MCP，再回头看 Agent、工具调用、AI 辅助开发这些话题，就有了一根能把它们串起来的主线。
