/**
 * 原型链继承（Prototype Chain）
 * 优点：简单，可共享父原型上的方法。
 * 缺点：所有子实例共享引用类型属性（如数组），无法向父构造函数传参（在 new Parent() 时已固定），无法实现多继承。
 * 适用：仅共享方法且没有引用类型状态时。
 */
function Parent_1() {
  this.age = 40;
  this.colors = ["red"];
}
Parent_1.prototype.say = function () {
  console.log(this.age);
};
Parent_1.prototype.appendColor = function (color) {
  this.colors.push(color);
  console.log("原型链继承：", this.colors);
};
function Child_1() { }
Child_1.prototype = new Parent_1();
Child_1.prototype.constructor = Child_1;
const child_1_1 = new Child_1();
child_1_1.say();
console.log("原型链继承：", child_1_1.age);
child_1_1.appendColor("blue");

const child_1_2 = new Child_1();
child_1_2.appendColor("green"); // 和 child_1_1 共享了 colors 数组

/**
 * 借用构造函数 / 经典继承（Constructor Stealing）
 * 优点：每个实例有自己的实例属性（避免共享引用），可以向父构造函数传参。
 * 缺点：父原型上的方法不能继承（方法不能共享），每个子实例如果需要父方法则需重复定义或拷贝（效率差）。
 * 适用：需要继承实例属性且不关心父原型方法共享时。
 */
function Parent_2(name) {
  this.name = name;
  this.colors = ["red"];

  this.sayFn = function () {
    console.log("借用构造函数 sayFn：", this.name);
  };
}
Parent_2.prototype.sayPrototype = function () {
  console.log("借用构造函数 sayPrototype：", this.name);
};
function Child_2(name) {
  Parent_2.call(this, name);
}
const child_2_1 = new Child_2("child_2_1");
child_2_1.sayFn();
// child_2_1.sayPrototype(); // 报错，因为 sayPrototype 是定义在原型上的方法，而借用构造函数不会继承原型上的方法
const child_2_2 = new Child_2("child_2_2");
console.log("借用构造函数：", child_2_2.sayFn === child_2_1.sayFn); // false 因为每个实例都会创造一个新的 sayFn 函数，所以会造成内存浪费（效率差）

/**
 * 组合继承（Prototype + Constructor，Pseudo-classical）
 * 优点：结合了原型链继承和借用构造函数的优点，每个实例有自己的实例属性，又可以通过原型链继承共享方法。
 * 缺点：调用了两次父构造函数（一次在创建子实例时，一次在设置子原型时），生成了两份相同的属性（实例属性和原型属性），造成性能和副作用问题。
 * 适用：早期常用，如果不介意双调用则可用，需要继承实例属性和共享方法时。
 */
function Parent_3() {
  this.name = "parent_3";
  this.colors = ["red"];
  console.log("Parent_3 构造函数被调用");
}
Parent_3.prototype.say = function () {
  console.log("组合继承 say：", this.name);
};
function Child_3(key) {
  Parent_3.call(this); // 调用父构造函数

  this.key = key;
}
Child_3.prototype = new Parent_3(); // 调用父构造函数
Child_3.prototype.constructor = Child_3;

const child_3_1 = new Child_3("child_3_1");
const child_3_2 = new Child_3("child_3_2");
console.log("组合继承原型方法共享：", child_3_1.say === child_3_2.say); // true
console.log("组合继承实例属性：", child_3_1.key, child_3_2.key);

/**
 * 函数式继承（工厂函数 + 闭包）
 * 优点：优点：封装强、无原型链副作用，适合模块化、组合。
 * 缺点：方法无法共享到原型（每个实例都会创建新函数），内存开销较大（可通过共享原型对象混合优化）。
 */
function createChild_4(name) {
  return {
    say() { console.log("函数式继承 say：", name); } // 闭包中的私有 name
  };
}
const child_4_1 = createChild_4("child_4_1");
child_4_1.say();
const child_4_2 = createChild_4("child_4_2");
child_4_2.say();
console.log("函数式继承：", child_4_1.say === child_4_2.say); // false

/**
 * 寄生式继承（Parasitic Inheritance）
 * 优点：灵活，适合创建带增强功能的对象。
 * 缺点：方法不能共享父构造函数的私有变量，性能和语义上不如原型链直接使用。
 */
function createChild_5(original) {
  const clone = Object.create(original);
  clone.sayHi = function () {
    console.log("寄生式继承 sayHi：", this.name);
  };
  return clone;
}
const parent_5 = {
  name: "original",
  colors: ["red"],
};
const child_5_1 = createChild_5(parent_5);
child_5_1.sayHi();
const child_5_2 = createChild_5(parent_5);
child_5_2.sayHi();
console.log("寄生式继承：", child_5_1.sayHi === child_5_2.sayHi); // false

/**
 * 寄生组合继承（Parasitic Combination，最优的 ES5 继承方案）
 * 优点：避免双构造调用，保留实例属性和原型方法共享，是 ES5 环境下推荐方案。
 * 适用：需要传统面向对象继承语义且在 ES5 环境下。
 */
function createChild_6(Child, Parent) {
  Child.prototype = Object.create(Parent.prototype);
  Child.prototype.constructor = Child;
}

function Parent_6(name) {
  this.name = name;
  console.log("Parent_5 构造函数被调用");
}
Parent_6.prototype.say = function () {
  console.log("寄生组合继承 say：", this.name);
};
function Child_6(name, age) {
  Parent_6.call(this, name);
  this.age = age;
}
createChild_6(Child_6, Parent_6);

const child_6_1 = new Child_6("child_6_1", 10);
const child_6_2 = new Child_6("child_6_2", 20);
child_6_1.say();
child_6_2.say();
console.log("寄生组合继承：", child_6_1.say === child_6_2.say); // true
console.log("寄生组合继承实例属性：", child_6_1.age, child_6_2.age);

/**
 * ES6 类继承 class / extends 语法糖（Class Inheritance）
 * 优点：语法简洁，符合现代 JavaScript 习惯，自动调用 super() 和设置原型，支持继承静态方法和内置类（例如继承 Error、Array 的行为更可靠），更接近传统 OOP。
 * 缺点：不支持低版本浏览器，无法手动设置原型（ES6 内部实现），继承关系不如原型链清晰，仍然是基于原型的语法糖，误用可能带来 this/绑定问题。。
 * 适用：现代 JavaScript 项目，需要传统面向对象继承语义时。
 */
class Parent_7 {
  constructor(name) {
    this.name = name;
  }
  say() {
    console.log("ES6 类继承 say：", this.name);
  }
}
class Child_7 extends Parent_7 {
  constructor(name, age) {
    super(name); // 调用父构造
    this.age = age;
  }
}

const child_7_1 = new Child_7("child_7_1", 10);
child_7_1.say();

/**
 * Mixin（混入）与组合优先
 * 原理：通过 Object.assign 或工厂函数将若干功能“拷贝”到目标对象或原型上，实现类似多继承的效果。
 * 优点：简单、灵活，避免深层继承树，推荐“组合优于继承”原则。
 * 缺点：方法是拷贝，不建立继承链，可能重名冲突。
 */
const Parent_8 = { eat() { console.log('Mixin eat'); } };
const Child_8 = { walk() { console.log('Mixin walk'); } };
const child_8_1 = Object.assign({}, Parent_8, Child_8);
child_8_1.eat();
child_8_1.walk();
