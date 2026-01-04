---
title: Git Commit 规范完全指南
date: 2026-01-04 11:12:44
categories:
  - Devops
  - Git
tags:
  - Git
  - Commit
  - 代码规范
  - 团队协作
---

## 📚 为什么需要 Commit 规范？

良好的 Commit 规范可以：

- ✅ **提高可读性**：快速了解每次提交的目的
- ✅ **方便维护**：追踪历史更改和定位问题
- ✅ **自动化工具**：生成 CHANGELOG，语义化版本控制
- ✅ **团队协作**：统一的提交风格，降低沟通成本

---

## 🎯 约定式提交规范（Conventional Commits）

### 基本格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 三个组成部分

1. **Header（必需）**：`<type>(<scope>): <subject>`
2. **Body（可选）**：详细描述
3. **Footer（可选）**：关联 Issue 或 Breaking Changes

---

## 📝 Header 详解

### Type（类型）

| Type         | 说明                           | 示例                           |
| ------------ | ------------------------------ | ------------------------------ |
| **feat**     | 新功能                         | `feat: 添加用户登录功能`       |
| **fix**      | Bug 修复                       | `fix: 修复登录按钮无响应问题`  |
| **docs**     | 文档更新                       | `docs: 更新 README 安装说明`   |
| **style**    | 代码格式（不影响功能）         | `style: 格式化代码，统一缩进`  |
| **refactor** | 重构（不新增功能，不修复 bug） | `refactor: 重构用户模块代码`   |
| **perf**     | 性能优化                       | `perf: 优化列表渲染性能`       |
| **test**     | 测试相关                       | `test: 添加用户登录单元测试`   |
| **build**    | 构建系统或外部依赖             | `build: 升级 webpack 到 5.0`   |
| **ci**       | CI 配置文件和脚本              | `ci: 添加 GitHub Actions 配置` |
| **chore**    | 其他杂项（不修改 src 或测试）  | `chore: 更新依赖包版本`        |
| **revert**   | 回滚之前的提交                 | `revert: 回滚提交 abc123`      |

### Scope（范围）- 可选

指明修改影响的范围，如：

```bash
feat(user): 添加用户个人资料编辑功能
fix(api): 修复接口超时问题
docs(readme): 更新项目配置说明
```

**常见 Scope：**

- `user` - 用户模块
- `auth` - 认证模块
- `api` - API 接口
- `ui` - UI 组件
- `config` - 配置文件
- `deps` - 依赖相关

### Subject（主题）

- 简短描述（建议不超过 50 字符）
- 使用祈使句，现在时态：`添加` 而不是 `添加了`
- 首字母小写
- 结尾不加句号

**✅ 好的示例：**

```bash
feat: 添加用户头像上传功能
fix: 修复页面滚动卡顿问题
```

**❌ 不好的示例：**

```bash
添加了功能           # 没有 type
feat：修复 bug       # 中文冒号
Feat: Add feature.  # 首字母大写，有句号
```

---

## 📖 Body（正文）- 可选

详细描述本次提交的内容，解释：

- **为什么**做这个改动
- **是什么**问题
- **如何**解决的

```bash
feat(user): 添加用户头像上传功能

- 支持拖拽上传
- 限制文件大小为 5MB
- 自动压缩图片质量

用户反馈上传头像步骤繁琐，
本次优化了上传流程，提升用户体验。
```

---

## 🔖 Footer（页脚）- 可选

### 1. 关闭 Issue

```bash
fix: 修复登录失败问题

Closes #123
Closes #456, #789
```

### 2. 不兼容变动（Breaking Changes）

```bash
feat(api): 重构用户 API 接口

BREAKING CHANGE:
用户 API 路径从 /api/user 改为 /api/v2/users
需要前端同步更新接口调用路径
```

---

## 💡 实际示例

### 示例 1：新功能

```bash
feat(auth): 添加双因素认证功能

- 支持 Google Authenticator
- 支持短信验证码
- 添加认证配置页面

Closes #234
```

### 示例 2：Bug 修复

```bash
fix(payment): 修复支付金额显示错误

支付页面金额显示少了两位小数，
修改了金额格式化逻辑。

Closes #567
```

### 示例 3：性能优化

```bash
perf(list): 优化长列表渲染性能

使用虚拟滚动技术，将 1000+ 条数据
的渲染时间从 3s 降低到 300ms。
```

### 示例 4：重构

```bash
refactor(user): 重构用户状态管理

使用 Pinia 替代 Vuex，简化状态管理逻辑，
提高代码可维护性。

BREAKING CHANGE:
移除了 Vuex 相关代码，需要更新依赖包
```

### 示例 5：文档更新

```bash
docs: 更新 API 文档

- 添加认证接口说明
- 修正参数类型错误
- 补充示例代码
```

---

## 🛠️ 工具辅助

### 1. Commitizen

使用命令行交互式工具生成规范的 Commit：

```bash
# 安装
npm install -g commitizen cz-conventional-changelog

# 初始化
commitizen init cz-conventional-changelog --save-dev --save-exact

# 使用
git cz  # 替代 git commit
```

**交互式提交：**

```bash
? Select the type of change: (Use arrow keys)
❯ feat:     新功能
  fix:      Bug修复
  docs:     文档更新
  style:    代码格式
  refactor: 重构
  perf:     性能优化
  test:     测试
```

### 2. Commitlint

检查 Commit 消息是否符合规范：

```bash
# 安装
npm install --save-dev @commitlint/config-conventional @commitlint/cli

# 配置 commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional']
};

# 配合 husky 使用
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'
```

### 3. Standard Version

自动生成 CHANGELOG 和版本号：

```bash
# 安装
npm install --save-dev standard-version

# 使用
npm run release
```

---

## 📋 快速参考

### 常用命令

```bash
# 标准提交
git commit -m "feat(user): 添加用户注册功能"

# 多行提交
git commit -m "feat(user): 添加用户注册功能" \
  -m "" \
  -m "- 支持邮箱注册" \
  -m "- 支持手机号注册" \
  -m "" \
  -m "Closes #123"

# 修改上次提交
git commit --amend

# 使用 commitizen
git cz
```

### Commit Message 模板

创建 `.gitmessage` 文件：

```bash
# <type>(<scope>): <subject>
#
# <body>
#
# <footer>

# type: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
# scope: 可选，指明影响范围
# subject: 简短描述（不超过50字符）
# body: 详细描述（可选）
# footer: 关闭Issue或Breaking Changes（可选）
```

配置使用模板：

```bash
git config --global commit.template .gitmessage
```

---

## ✅ 最佳实践

### 推荐做法

- ✅ **原子提交**：一次提交只做一件事
- ✅ **频繁提交**：小步快跑，便于回滚
- ✅ **描述清晰**：让别人（和未来的自己）看懂
- ✅ **使用工具**：Commitizen + Commitlint
- ✅ **团队统一**：制定团队规范文档

### 避免做法

- ❌ **模糊描述**：`update`, `fix bug`, `修改`
- ❌ **大杂烩**：一次提交包含多个不相关的改动
- ❌ **非规范格式**：随意书写，没有统一标准
- ❌ **中英混用**：保持语言一致性

---

## 🎯 团队规范建议

### 1. 定义团队规范

```markdown
# Git Commit 规范

## 格式

<type>(<scope>): <subject>

## Type 类型（必选）

- feat: 新功能
- fix: Bug 修复
- docs: 文档
- style: 格式
- refactor: 重构
- test: 测试
- chore: 其他

## 语言

统一使用中文描述

## 工具

必须使用 commitizen 提交
```

### 2. 配置 Pre-commit Hook

```bash
#!/bin/sh
# .husky/commit-msg

npx --no -- commitlint --edit "$1"
```

### 3. CI 检查

```yaml
# .github/workflows/commit-lint.yml
name: Commit Lint

on: [pull_request]

jobs:
  commitlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      - uses: wagoid/commitlint-github-action@v5
```

---

## 📊 Commit 统计分析

### 查看提交统计

```bash
# 按作者统计
git shortlog -s -n

# 按类型统计（需要规范的 commit）
git log --oneline | grep -E "^[a-z]+(\(.+\))?:" | \
  cut -d: -f1 | sort | uniq -c | sort -rn
```

### 生成 CHANGELOG

```bash
# 使用 standard-version
npm run release

# 手动生成
git log --pretty=format:"%s" --since="2024-01-01" | \
  grep -E "^feat|^fix" > CHANGELOG.md
```

---

## 💡 总结

- **规范格式**：`<type>(<scope>): <subject>`
- **核心类型**：feat, fix, docs, style, refactor, perf, test, chore
- **使用工具**：Commitizen + Commitlint + Husky
- **团队协作**：统一规范，持续执行
- **原子提交**：小步快跑，描述清晰

良好的 Commit 规范是项目可维护性的基石！✨

---

## 📚 相关资源

- [Conventional Commits 官网](https://www.conventionalcommits.org/)
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/master/CONTRIBUTING.md)
- [Commitizen 文档](https://github.com/commitizen/cz-cli)
- [Commitlint 文档](https://commitlint.js.org/)
