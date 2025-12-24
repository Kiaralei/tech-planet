---
title: JavaScript中的 N 种继承
date:
categories:
  - Frontend
  - JavaScript
tags:
  - Frontend
  - JavaScript
---

## 简介

在这里写文章简介...

## 内容

### 原型链继承（Prototype Chain）

function\* read() {
let a = yield 'a';
console.log("a", a);
let b = yield 'b';
console.log("b", b);
let c = yield 'c';
console.log("c", c);
return 'end';
}

let it = read();
console.log("it.next()", it.next()); // 程序运行到 yield 'a' 处，返回 'a'，打印出 it.next() {value: 'a', done: false}
console.log("it.next('x')", it.next('x')); // 程序运行到 yield 'b' 处，前置赋值 a = undefined，打印出 "a" undefined，it.next() {value: 'b', done: false}
console.log("it.next()", it.next()); // 程序运行到 yield 'c' 处，前置赋值 b = 'x'，打印出 "b" x ,it.next() {value: 'c', done: false}
console.log("it.next()", it.next()); // 程序运行到 return 'end' 处，前置赋值 c = undefined，打印出 "c" undefined，it.next() {value: 'end', done: true}
console.log("it.next()", it.next()); // 程序运行到 return 'end' 处，返回 'end'，打印出 it.next() {value: undefined, done: true}
