---
title: JavaScript 中的 8 种继承方式详解
date: 2025-12-24 14:00:00
categories:
  - Frontend
  - JavaScript
tags:
  - JavaScript
  - 继承
  - 原型链
  - ES6
---

## 📚 简介

JavaScript 继承机制是前端开发中的核心概念。本文将详细介绍 8 种常见的继承方式，包括它们的优缺点和适用场景。

---

## 1️⃣ 原型链继承（Prototype Chain）

### 特点

- ✅ **优点**：实现简单，可共享父类原型上的方法
- ❌ **缺点**：所有子实例共享引用类型属性，无法向父构造函数传参，无法实现多继承
- 🎯 **适用场景**：仅共享方法且没有引用类型状态时

### 代码示例

```javascript
// 父类构造函数
function Parent() {
  this.age = 40;
  this.colors = ["red"];
}

// 父类原型方法
Parent.prototype.say = function () {
  console.log(this.age);
};

Parent.prototype.appendColor = function (color) {
  this.colors.push(color);
  console.log("原型链继承：", this.colors);
};

// 子类构造函数
function Child() {}

// 🔑 核心：子类原型指向父类实例
Child.prototype = new Parent();
Child.prototype.constructor = Child;

// 创建实例
const child1 = new Child();
child1.say(); // 40
console.log(child1.age); // 40
child1.appendColor("blue"); // ["red", "blue"]

const child2 = new Child();
child2.appendColor("green"); // ["red", "blue", "green"]
// ⚠️ 注意：child1 和 child2 共享了 colors 数组！
```

---

## 2️⃣ 借用构造函数继承（Constructor Stealing）

### 特点

- ✅ **优点**：每个实例有自己的实例属性（避免共享引用），可以向父构造函数传参
- ❌ **缺点**：父原型上的方法不能继承，每个子实例都会创建新的方法副本（效率差）
- 🎯 **适用场景**：需要继承实例属性且不关心父原型方法共享时

### 代码示例

```javascript
// 父类构造函数
function Parent(name) {
  this.name = name;
  this.colors = ["red"];

  // 实例方法（非原型方法）
  this.sayName = function () {
    console.log("借用构造函数：", this.name);
  };
}

// 父类原型方法
Parent.prototype.sayPrototype = function () {
  console.log("原型方法：", this.name);
};

// 子类构造函数
function Child(name) {
  // 🔑 核心：在子类中调用父类构造函数
  Parent.call(this, name);
}

// 创建实例
const child1 = new Child("Alice");
child1.sayName(); // "借用构造函数：Alice"

const child2 = new Child("Bob");
console.log(child2.sayName === child1.sayName); // false ⚠️ 方法不共享

// child1.sayPrototype(); // ❌ 报错：无法继承原型方法
```

---

## 3️⃣ 组合继承（Combination Inheritance）

### 特点

- ✅ **优点**：结合了原型链和借用构造函数的优点，实例有自己的属性，又能共享方法
- ❌ **缺点**：调用了两次父构造函数，造成性能开销
- 🎯 **适用场景**：早期常用方案，需要继承实例属性和共享方法时

### 代码示例

```javascript
// 父类构造函数
function Parent() {
  this.name = "parent";
  this.colors = ["red"];
  console.log("Parent 构造函数被调用");
}

// 父类原型方法
Parent.prototype.say = function () {
  console.log("组合继承：", this.name);
};

// 子类构造函数
function Child(name, key) {
  // 🔑 第一次调用父构造函数：继承实例属性
  Parent.call(this);
  this.name = name;
  this.key = key;
}

// 🔑 第二次调用父构造函数：继承原型方法
Child.prototype = new Parent();
Child.prototype.constructor = Child;

// 创建实例
const child1 = new Child("Alice", "key1");
const child2 = new Child("Bob", "key2");

console.log(child1.say === child2.say); // true ✅ 方法共享
console.log(child1.key, child2.key); // "key1" "key2"
```

---

## 4️⃣ 函数式继承（Functional Inheritance）

### 特点

- ✅ **优点**：封装强、无原型链副作用，适合模块化
- ❌ **缺点**：方法无法共享到原型，内存开销较大
- 🎯 **适用场景**：需要强封装和私有变量时

### 代码示例

```javascript
// 工厂函数
function createPerson(name) {
  return {
    // 闭包中的私有变量
    say() {
      console.log("函数式继承：", name);
    },
  };
}

const person1 = createPerson("Alice");
person1.say(); // "函数式继承：Alice"

const person2 = createPerson("Bob");
person2.say(); // "函数式继承：Bob"

console.log(person1.say === person2.say); // false ⚠️ 方法不共享
```

---

## 5️⃣ 寄生式继承（Parasitic Inheritance）

### 特点

- ✅ **优点**：灵活，适合创建带增强功能的对象
- ❌ **缺点**：方法不能共享，效率不高
- 🎯 **适用场景**：需要在对象基础上添加额外方法时

### 代码示例

```javascript
// 创建增强对象的工厂函数
function createEnhancedObject(original) {
  // 基于原对象创建新对象
  const clone = Object.create(original);

  // 🔑 核心：增强对象功能
  clone.sayHi = function () {
    console.log("寄生式继承：", this.name);
  };

  return clone;
}

// 原始对象
const original = {
  name: "original",
  colors: ["red"],
};

// 创建增强对象
const enhanced1 = createEnhancedObject(original);
enhanced1.sayHi(); // "寄生式继承：original"

const enhanced2 = createEnhancedObject(original);
enhanced2.sayHi();

console.log(enhanced1.sayHi === enhanced2.sayHi); // false ⚠️ 方法不共享
```

---

## 6️⃣ 寄生组合继承（Parasitic Combination）⭐

### 特点

- ✅ **优点**：最优的 ES5 继承方案，避免双构造调用，保留实例属性和原型方法共享
- ❌ **缺点**：实现相对复杂
- 🎯 **适用场景**：ES5 环境下的推荐方案

### 代码示例

```javascript
// 🔑 核心辅助函数：设置原型继承
function inheritPrototype(Child, Parent) {
  // 创建父类原型的副本
  Child.prototype = Object.create(Parent.prototype);
  // 修正构造函数指向
  Child.prototype.constructor = Child;
}

// 父类构造函数
function Parent(name) {
  this.name = name;
  console.log("Parent 构造函数被调用");
}

// 父类原型方法
Parent.prototype.say = function () {
  console.log("寄生组合继承：", this.name);
};

// 子类构造函数
function Child(name, age) {
  // 🔑 继承实例属性（只调用一次父构造函数）
  Parent.call(this, name);
  this.age = age;
}

// 🔑 继承原型方法（不调用父构造函数）
inheritPrototype(Child, Parent);

// 创建实例
const child1 = new Child("Alice", 10);
const child2 = new Child("Bob", 20);

child1.say(); // "寄生组合继承：Alice"
child2.say(); // "寄生组合继承：Bob"

console.log(child1.say === child2.say); // true ✅ 方法共享
console.log(child1.age, child2.age); // 10 20
```

---

## 7️⃣ ES6 Class 继承 ⭐⭐

### 特点

- ✅ **优点**：语法简洁，符合现代 JavaScript 习惯，自动调用 `super()` 和设置原型
- ❌ **缺点**：不支持低版本浏览器，仍然是基于原型的语法糖
- 🎯 **适用场景**：现代 JavaScript 项目的首选方案

### 代码示例

```javascript
// 父类
class Parent {
  constructor(name) {
    this.name = name;
  }

  say() {
    console.log("ES6 类继承：", this.name);
  }
}

// 子类
class Child extends Parent {
  constructor(name, age) {
    // 🔑 核心：调用父类构造函数
    super(name);
    this.age = age;
  }
}

// 创建实例
const child1 = new Child("Alice", 10);
child1.say(); // "ES6 类继承：Alice"

const child2 = new Child("Bob", 20);
console.log(child1.say === child2.say); // true ✅ 方法共享
console.log(child1.age, child2.age); // 10 20
```

---

## 8️⃣ Mixin 混入

### 特点

- ✅ **优点**：简单灵活，避免深层继承树，符合"组合优于继承"原则
- ❌ **缺点**：方法是拷贝不是继承，可能有命名冲突
- 🎯 **适用场景**：需要多重继承或组合多个功能时

### 代码示例

```javascript
// 功能模块 A
const Eater = {
  eat() {
    console.log("Mixin: eating...");
  },
};

// 功能模块 B
const Walker = {
  walk() {
    console.log("Mixin: walking...");
  },
};

// 🔑 核心：通过 Object.assign 混入多个功能
const person = Object.assign({}, Eater, Walker);

person.eat(); // "Mixin: eating..."
person.walk(); // "Mixin: walking..."
```

### 高级用法：函数式 Mixin

```javascript
// 定义 Mixin
const flyMixin = (target) => {
  target.fly = function () {
    console.log("Flying...");
  };
  return target;
};

const swimMixin = (target) => {
  target.swim = function () {
    console.log("Swimming...");
  };
  return target;
};

// 应用多个 Mixin
class Animal {}
const duck = new Animal();

flyMixin(duck);
swimMixin(duck);

duck.fly(); // "Flying..."
duck.swim(); // "Swimming..."
```

---

## 📊 继承方式对比

| 继承方式         | 属性继承 | 方法共享 | 构造函数调用次数 | 推荐指数   |
| ---------------- | -------- | -------- | ---------------- | ---------- |
| 原型链继承       | ❌ 共享  | ✅       | 1 次             | ⭐⭐       |
| 借用构造函数     | ✅       | ❌       | 1 次             | ⭐⭐       |
| 组合继承         | ✅       | ✅       | 2 次             | ⭐⭐⭐     |
| 函数式继承       | ✅       | ❌       | 0 次             | ⭐⭐       |
| 寄生式继承       | ✅       | ❌       | 0 次             | ⭐⭐       |
| **寄生组合继承** | ✅       | ✅       | 1 次             | ⭐⭐⭐⭐   |
| **ES6 Class**    | ✅       | ✅       | 1 次             | ⭐⭐⭐⭐⭐ |
| **Mixin**        | ✅       | ✅       | 0 次             | ⭐⭐⭐⭐   |

---

## 🎯 选择建议

1. **现代项目**：优先使用 `ES6 Class` 继承
2. **需要多重继承**：使用 `Mixin` 组合功能
3. **ES5 环境**：使用 `寄生组合继承`
4. **简单场景**：使用 `组合继承`

---

## 💡 总结

- JavaScript 继承本质上是基于**原型链**的
- ES6 Class 只是**语法糖**，底层仍然使用原型
- 组合优于继承 —— 在可能的情况下，优先使用 Mixin 而不是深层继承链
- 理解继承机制对于掌握 JavaScript 面向对象编程至关重要 ✨
