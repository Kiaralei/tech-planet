---
title: 策略模式在前端的应用
date: 2026-01-08 19:05:44
categories:
  - Frontend
  - DesignPattern
tags:
  - 设计模式
  - 策略模式
---

## 背景与痛点

在后台管理系统中，我们经常遇到这样的场景：需要渲染多种不同类型的配置模块，每种模块有不同的：

- 数据结构
- 表格列配置
- 表单字段
- CRUD 操作逻辑

传统做法是用大量的 if-else 或 switch-case，导致代码臃肿、难以维护，因此我们想到了一种解决方案：策略模式+同意渲染器

## 定义

策略模式是一种行为设计模式，它定义了一系列算法，把它们封装起来，并使它们可以相互替换。

## 核心思想

❌ 不用策略模式：一堆 if-else / switch
✅ 用策略模式：把每种算法封装成独立的策略，按需选择

## 经典场景

根据用户输入类型判断是否符合标准
❌ 不用策略模式

```

function validate(type, value) {
if (type === 'email') {
return /^[\w-]+(\.[\w-]+)\*@[\w-]+(\.[\w-]+)+$/.test(value);
  } else if (type === 'phone') {
    return /^1[3-9]\d{9}$/.test(value);
} else if (type === 'password') {
return value.length >= 8;
} else if (type === 'username') {
return /^[a-zA-Z0-9_]{4,16}$/.test(value);
}
// 继续加 if-else...
}

```

**问题：**

- 函数越来越长
- 新增验证规则要改原函数
- 违反开闭原则

> **开闭原则**：对扩展开放，对修改关闭（Open for extension, Closed for modification），意思是：软件实体（类、模块、函数）应该可以扩展新功能，但不应该修改已有代码。

✅ 使用策略模式

```

// 1. 定义策略对象
const validators = {
email: (value) => /^[\w-]+(\.[\w-]+)\*@[\w-]+(\.[\w-]+)+$/.test(value),
  phone: (value) => /^1[3-9]\d{9}$/.test(value),
password: (value) => value.length >= 8,
username: (value) => /^[a-zA-Z0-9_]{4,16}$/.test(value),
};

// 2. 使用策略
function validate(type, value) {
const validator = validators[type];
if (!validator) throw new Error(`Unknown validator: ${type}`);
return validator(value);
}

// 3. 轻松扩展，不改原代码
validators.idCard = (value) => /^\d{17}[\dXx]$/.test(value);

```

## 最佳实践

### 架构概览

```
┌─────────────────────────────────────────────────────────┐
│                    ModuleRenderer                        │
│  (统一渲染器 - 负责组装和协调)                            │
├─────────────────────────────────────────────────────────┤
│                     getStrategy()                        │
│  (策略选择器 - 根据模块类型匹配策略)                       │
├──────────┬──────────┬──────────┬───────────────────────┤
│ Login    │ Pay      │ User     │ Default               │
│ Strategy │ Strategy │ Agreement│ Strategy              │
│          │          │ Strategy │ (兜底)                 │
└──────────┴──────────┴──────────┴───────────────────────┘
```

### 定义策略接口

首先，抽象出所有模块共同的行为：

```
// types.ts
interface ModuleStrategy {
  /** 模块类型标识 */
  type: string;

  /** 判断是否匹配此策略 */
  match: (module: AnyConfigModule) => boolean;

  /** 转换数据源 - 将原始数据转换为表格需要的格式 */
  transformDataSource: (module, context?) => ConfigChild[];

  /** 渲染添加表单 */
  renderAddForm: (module, context?) => React.ReactNode;

  /** 渲染编辑弹窗内容（可选） */
  renderEditModal?: (record, form, context?) => React.ReactNode;

  /** 处理添加操作 */
  handleAdd: (module, values, envId, context?) => Promise<void>;

  /** 处理开关变更（可选） */
  handleEnableChange?: (...) => Promise<void>;

  /** 处理拖拽排序（可选） */
  handleDragEnd?: (...) => Promise<void>;

  /** 自定义列配置（可选） */
  customColumns?: (...) => ColumnType[];

  /** UI 配置 */
  getAddButtonText: () => string;
  showAddButton: () => boolean;
  isDraggable: () => boolean;
}
```

**设计亮点**

- 必选方法 vs 可选方法：match、transformDataSource、handleAdd 是必须的，而 handleDragEnd、customColumns 等是可选的
- 通过 context 参数传递额外数据，保持接口稳定

### 策略注册表

```
// modules/index.ts
const strategies: ModuleStrategy[] = [
  LoginMethodStrategy,
  PayMethodStrategy,
  UserAgreementStrategy,
  DefaultStrategy,  // 默认策略放最后作为兜底
];

export const getStrategy = (module: AnyConfigModule): ModuleStrategy => {
  return strategies.find((s) => s.match(module)) || DefaultStrategy;
};
```

**设计亮点**

- 顺序匹配，先匹配到的优先
- DefaultStrategy 作为兜底，match: () => true
- 新增模块类型只需添加新策略，无需修改现有代码

### 具体策略实现

```
// DefaultModule.tsx - 兜底策略
export const DefaultStrategy: ModuleStrategy = {
  type: "default",
  match: () => true,  // 匹配所有

  transformDataSource: (module) => module.children,

  renderAddForm: (module) => {
    return module.children.map((child) => (
      <Form.Item key={getChildKey(child)} label={child.label} name={getChildKey(child)} />
    ));
  },

  handleAdd: async () => {
    message.info("该配置类型暂不支持新增");
  },

  showAddButton: () => false,
  isDraggable: () => false,
};
```

```
// UserAgreementModule.tsx - 特定策略
export const UserAgreementStrategy: ModuleStrategy = {
  type: "user_agreement",
  match: (module) => module.key === "user_agreement",

  transformDataSource: (module, context) => {
    // 将用户协议数据转换为表格格式
    return module.children.flatMap((child) => {
      if (!isUserAgreementItem(child)) return [];
      // 复杂的数据转换逻辑...
    });
  },

  renderAddForm: (_module, context) => (
    <UserAgreementFormFields agreementList={context?.agreementList} />
  ),

  renderEditModal: (records, form, context) => (
    <UserAgreementFormFields
      agreementList={context?.agreementList}
      initialValues={{ ... }}
    />
  ),

  handleAdd: async (module, values, envId, context) => {
    await UpdateRegionConfig(getParams(values, envId, context));
  },

  showAddButton: () => true,
  isDraggable: () => false,
};
```

### 统一渲染器

```
// ModuleRenderer.tsx
export const ModuleRenderer: React.FC<ModuleRendererProps> = ({
  module, index, envId, refreshData, context, onOptimisticUpdate,
}) => {
  const [form] = Form.useForm();

  // 🎯 核心：根据模块类型获取策略
  const strategy = useMemo(() => getStrategy(module), [module]);

  // 使用策略方法
  const dataSource = useMemo(
    () => strategy.transformDataSource(module, context),
    [strategy, module, context]
  );

  const columns = useMemo(() => {
    // 优先使用策略的自定义列，否则用默认渲染器
    if (strategy.customColumns) {
      return strategy.customColumns(module, context);
    }
    return columnRenderers(module.columns, { ... });
  }, [module, context, strategy]);

  const editModalContent = useMemo(() => {
    // 优先使用策略的编辑弹窗，否则用默认渲染器
    if (strategy.renderEditModal) {
      return strategy.renderEditModal(currentRecord, form, context);
    }
    return currentRecord.map((child) => formRenderers(child, ...));
  }, [strategy, ...]);

  return (
    <div>
      <TableWithAdd
        columns={columns}
        dataSource={dataSource}
        draggable={strategy.isDraggable()}
        showAddButton={strategy.showAddButton()}
        addButtonText={strategy.getAddButtonText()}
        formItems={strategy.renderAddForm(module, context)}
        onAdd={handleAdd}
        onDragEnd={strategy.handleDragEnd ? handleDragEnd : undefined}
      />
      <Modal ...>{editModalContent}</Modal>
    </div>
  );
};
```

### 设计优势

✅ 开闭原则 (OCP)

- 对扩展开放：新增模块类型只需创建新策略文件
- 对修改关闭：无需修改 ModuleRenderer 或其他策略

✅ 单一职责 (SRP)

- ModuleRenderer：只负责组装和协调
- 各 Strategy：只负责自己类型的具体逻辑

✅ 依赖倒置 (DIP)

- ModuleRenderer 依赖抽象的 ModuleStrategy 接口
- 不依赖具体的策略实现

✅ 可测试性

- 每个策略可以独立单元测试
- 渲染器逻辑与业务逻辑分离

### 扩展新模块类型

只需 3 步：

```
// 1. 创建新策略文件 NewModuleStrategy.tsx
export const NewModuleStrategy: ModuleStrategy = {
  type: "new_type",
  match: (module) => module.key === "new_type",
  transformDataSource: ...,
  renderAddForm: ...,
  handleAdd: ...,
  // ...
};

// 2. 注册到策略列表 modules/index.ts
const strategies = [
  NewModuleStrategy,  // 添加这一行
  LoginMethodStrategy,
  // ...
];

// 3. 完成！无需修改 ModuleRenderer
```
