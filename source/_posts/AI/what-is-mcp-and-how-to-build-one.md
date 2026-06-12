---
title: 什么是 MCP？从「为什么需要」到「手写一个 MCP Server」
date: 2026-06-12 10:00:00
categories:
  - AI
  - AIEngineering
tags:
  - MCP
  - Model Context Protocol
  - Agent
  - 工具调用
  - LLM 应用
  - Anthropic
---

## 📚 前言

先讲个很多人都踩过的场景。

你给 LLM 接了个「查天气」的能力，写了一段 function calling 的代码。
过两天又要接「查数据库」，再写一段。
再过两天，换了个客户端 —— 从自己写的 Web，换成了 Claude Desktop 或者某个 IDE 插件 ——
发现之前那两段全部要重写。

你会发现一个尴尬的事实：

> 每一个「能力」，乘以每一个「客户端」，都要重新对接一次。

这就是经典的 **M×N 问题**：M 个 AI 应用，N 个工具/数据源，要写 M×N 套胶水代码。

MCP 想干的事，就是把它从 **M×N** 变成 **M+N**。

这篇文章分两半：
- 前半讲清楚 **MCP 到底是什么、解决什么问题**；
- 后半带你 **从零手写一个能跑的 MCP Server**，并接到客户端里真正用起来。

---

## 一、MCP 是什么：给 AI 应用的「USB-C」

MCP 全称 **Model Context Protocol（模型上下文协议）**，是 Anthropic 在 2024 年底开源的一个**开放协议**。

官方有个很贴切的比喻：

> MCP 就是 AI 应用的 **USB-C 接口**。

在 USB-C 之前，充电口五花八门，每个设备配一根线。有了统一接口之后，一根线插所有设备。

MCP 想做的就是这件事：**定义一套标准协议，让「AI 应用」和「外部能力」之间用同一种方式对接。**

只要你的工具实现了 MCP 协议，那么**任何**支持 MCP 的客户端（Claude Desktop、Claude Code、Cursor、各种 IDE 插件……）都能直接用，不用改一行对接代码。

反过来也成立：客户端只要实现一次 MCP，就能接入**整个 MCP 生态**里所有的 Server。

这就是 M+N 的来源：
- 工具方实现 1 次 MCP Server；
- 应用方实现 1 次 MCP Client；
- 双方在协议层握手，中间不再需要两两对接。

---

## 二、为什么 function calling 还不够

你可能会问：模型本来就有 function calling（工具调用），为什么还要再搞一个协议？

区别在于**抽象的层次不同**。

```txt
function calling：模型「能力」层面的约定
                 —— 模型怎么表达「我想调用某个函数、参数是什么」

MCP            ：系统「集成」层面的约定
                 —— 工具怎么被发现、怎么连接、怎么传输、谁来执行、能力怎么描述
```

function calling 只规定了「模型如何说出它想调一个工具」这一小步。
至于这个工具**长什么样、住在哪、怎么连上、谁去执行、返回怎么传回来** —— 这些全是你自己写的胶水代码。

MCP 把后面这一整套「集成」标准化了：

- 工具如何**自我描述**（名字、参数、用途）；
- 客户端如何**发现**有哪些工具（`tools/list`）；
- 如何**建立连接、传输消息**（基于 JSON-RPC 2.0）；
- 除了「工具」，还能标准化地暴露**数据**和**提示词模板**。

一句话：

> function calling 解决「模型怎么表达意图」，MCP 解决「这个意图如何被一个可复用、可移植的系统接住」。

---

## 三、MCP 的架构：Host / Client / Server

MCP 里有三个角色，初学最容易绕晕，先把它们拆开。

```txt
┌─────────────────────────────────────────────┐
│  MCP Host（宿主应用）                            │
│  例：Claude Desktop / Claude Code / IDE          │
│                                                 │
│   ┌───────────┐   ┌───────────┐                 │
│   │ MCP Client │   │ MCP Client │   ← 一个 Host 内   │
│   └─────┬─────┘   └─────┬─────┘     可有多个 Client │
└─────────┼───────────────┼───────────────────────┘
          │ MCP 协议        │ MCP 协议
          ▼               ▼
   ┌────────────┐   ┌────────────┐
   │ MCP Server │   │ MCP Server │   ← 你要写的就是这个
   │  (天气)     │   │  (数据库)   │
   └─────┬──────┘   └─────┬──────┘
         ▼                ▼
     天气 API          PostgreSQL
```

- **Host（宿主）**：用户真正在用的那个 AI 应用，比如 Claude Desktop。它内部嵌着模型，负责跟用户交互。
- **Client（客户端）**：Host 内部的连接器，**一个 Client 对应一个 Server**，负责维持那条连接。
- **Server（服务端）**：**对外提供能力的程序，也就是这篇要教你写的东西**。它把「查天气」「读数据库」这类能力按 MCP 协议暴露出来。

关键心智：

> 你写的 MCP Server 不直接面对模型，也不直接面对用户。
> 它只面对协议。剩下的兼容性，协议帮你兜底。

---

## 四、MCP Server 能暴露什么：三种原语

一个 MCP Server 可以对外提供三类东西，它们的**控制权归属不同**，这点非常关键：

| 原语 | 是什么 | 谁来决定用不用 |
|---|---|---|
| **Tools（工具）** | 可执行的函数，有副作用 | **模型**控制（模型决定调不调） |
| **Resources（资源）** | 只读的数据/上下文 | **应用**控制（应用决定塞不塞给模型） |
| **Prompts（提示词）** | 预设的提示词模板 | **用户**控制（用户主动选用） |

通俗点说：

- **Tools** 像「函数」：`查天气`、`发邮件`、`执行 SQL`。模型看情况自己调用。
- **Resources** 像「文件 / GET 接口」：一份文档、一张表的内容。它是只读的，由应用决定要不要把它喂进上下文。
- **Prompts** 像「斜杠命令」：用户主动触发的模板，比如 `/code-review`。

三者里，**Tools 是用得最多、最先要掌握的**。下面的实战就从写一个 Tool 开始。

---

## 五、实战：手写一个 MCP Server（TypeScript）

我们写一个最小但完整的天气 Server，包含一个工具 `get-weather`。

### 1. 初始化项目

```bash
mkdir weather-mcp && cd weather-mcp
npm init -y
npm install @modelcontextprotocol/sdk zod
npm install -D typescript @types/node
```

在 `package.json` 里加上（MCP SDK 是 ESM）：

```json
{
  "type": "module",
  "bin": { "weather-mcp": "./build/index.js" }
}
```

### 2. 写 Server

新建 `src/index.ts`：

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// 1) 创建 Server，声明名字和版本
const server = new McpServer({
  name: "weather",
  version: "1.0.0",
});

// 2) 注册一个工具
server.registerTool(
  "get-weather",
  {
    title: "查询天气",
    description: "查询某个城市的当前天气",
    // 用 zod 描述入参，SDK 会自动转成模型能读懂的 JSON Schema
    inputSchema: {
      city: z.string().describe("城市名，例如「北京」"),
    },
  },
  // 3) 真正的执行逻辑
  async ({ city }) => {
    // 真实场景这里会去调天气 API，这里先写死演示
    const weather = `「${city}」当前晴，22°C，东南风 2 级`;

    return {
      content: [{ type: "text", text: weather }],
    };
  }
);

// 4) 用 stdio 传输方式启动（本地最常用）
const transport = new StdioServerTransport();
await server.connect(transport);
```

三步就够了：**建 Server → 注册工具 → 连上 transport**。

注意 `inputSchema` 用 `zod` 来写：你只管描述参数，SDK 会自动把它转成模型能理解的 JSON Schema，并在调用时帮你做校验。`describe()` 写的说明会直接影响模型「用得对不对」，要认真写。

### 3. 编译并配置

`tsconfig.json` 里把输出目录设成 `build`，然后：

```bash
npx tsc
```

接着把它接到客户端。以 **Claude Desktop** 为例，编辑配置文件 `claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "weather": {
      "command": "node",
      "args": ["/绝对路径/weather-mcp/build/index.js"]
    }
  }
}
```

> ⚠️ 这里必须用**绝对路径**，相对路径常常找不到。

重启 Claude Desktop，问它「北京天气怎么样」，它就会自动调用你这个工具了。

如果你用的是 **Claude Code**，更简单，一条命令搞定：

```bash
claude mcp add weather -- node /绝对路径/weather-mcp/build/index.js
```

---

## 六、换成 Python：FastMCP 更短

如果你更习惯 Python，官方的 `FastMCP` 写起来几乎是「装饰器即工具」：

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("weather")

@mcp.tool()
def get_weather(city: str) -> str:
    """查询某个城市的当前天气

    Args:
        city: 城市名，例如「北京」
    """
    return f"「{city}」当前晴，22°C，东南风 2 级"

if __name__ == "__main__":
    mcp.run()  # 默认 stdio
```

注意两个细节，FastMCP 全靠它们生成给模型看的描述：

- **函数的 docstring** → 工具的 description；
- **类型注解（`city: str`）** → 入参 schema。

所以在 MCP 里，「把函数签名和注释写清楚」不再只是给同事看的，**它直接决定模型会不会、能不能正确调用你的工具**。

---

## 七、stdio 还是 HTTP：两种传输方式

上面用的都是 **stdio**，它是 MCP 最常用的本地传输方式：

```txt
stdio          ：Host 把 Server 当子进程拉起来，通过标准输入输出通信
                 → 适合「本地工具」，零网络配置，最简单
```

但如果你的 Server 要部署成一个**远程服务**，给多个用户、多个客户端共用，就要用 HTTP：

```txt
Streamable HTTP：Server 是个独立的 HTTP 服务，客户端通过网络连接
                 → 适合「远程 / 多租户 / 云端」部署
```

> 早期 MCP 用的是 HTTP+SSE，现在推荐用 **Streamable HTTP**，写新 Server 直接用它即可。

选择很简单：

- 自己电脑上跑的小工具 → **stdio**；
- 要上线、多人用、远程访问 → **Streamable HTTP**。

协议是同一套，换的只是 transport 这一层，业务代码基本不动。

---

## 八、几个新手最容易踩的坑

1. **stdio 模式下，别用 `console.log` 打印调试信息。**
   stdout 是协议通道，你打印的东西会污染 JSON-RPC 消息，导致连接直接挂掉。要打日志请用 `console.error`（走 stderr）。

2. **工具的 `description` 和参数说明，是给模型读的，不是给人读的。**
   模型靠这些文字判断「这个工具在什么场景该被调用」。描述含糊，模型就会乱调或不调。把它当 prompt 来写。

3. **路径用绝对路径。** 客户端拉起 Server 时的工作目录未必是你想的那个。

4. **工具要做好错误处理和返回。** 出错时返回结构化的错误信息（而不是直接抛异常崩掉），模型才能理解「失败了」并尝试兜底。

5. **权限与安全。** Tools 是能产生副作用的（删数据、发请求、花钱）。暴露能力时务必想清楚边界，危险操作要有确认机制 —— 这点和写一个对外 API 没有区别。

---

## 小结

这一篇我们把 MCP 从「是什么」讲到「手写一个」。

记住几句话就够了：

```txt
1. MCP 是「AI 应用的 USB-C」，用一套开放协议把 M×N 的对接变成 M+N
2. 它和 function calling 不冲突：fc 管「模型怎么表达意图」，MCP 管「意图如何被一个可复用系统接住」
3. 三个角色：Host（宿主应用）/ Client（连接器）/ Server（你写的能力）
4. Server 能暴露三种原语：Tools（模型控制）/ Resources（应用控制）/ Prompts（用户控制）
5. 写一个 Server 就三步：建 Server → 注册工具 → 连上 transport（本地用 stdio，远程用 Streamable HTTP）
```

最关键的认知转变是这一句：

> 写 MCP Server，本质是在写一个「面向模型的 API」。
> 函数签名、类型、描述文案，全都变成了模型能不能用对你的工具的关键。

下一篇可以接着把 **Resources 和 Prompts** 这两种原语讲透，并做一个真正接了外部 API、能跑在生产环境的 MCP Server。
