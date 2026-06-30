---
title: 用一个玩具例子看懂 Transformer 的 Q/K/V
date: 2026-06-30 11:50:00
categories:
  - AI
  - 大模型原理
tags:
  - Transformer
  - Attention
  - LLM
---

真实大模型里的向量动辄几千维，光看公式很难建立直觉。这篇用一个**玩具数字例子**，把注意力机制里最核心的 Q/K/V 拆成"三张工作卡"：模型怎么从 token 得到 embedding、怎么算出 Q/K/V、又怎么用它们预测下一个 token。

下面是一个可交互的动画，点按钮一步步走就行：

<div style="position:relative;left:50%;right:50%;width:100vw;margin-left:-50vw;margin-right:-50vw;overflow-x:auto;display:flex;justify-content:center;">
  <iframe
    src="/demos/transformer-qkv.html"
    title="Transformer QKV 交互动画"
    loading="lazy"
    style="flex:0 0 auto;width:1280px;height:1060px;border:1px solid #ddd1bc;border-radius:10px;"
  ></iframe>
</div>

> 如果上面的动画加载不出来，可以直接打开：[Transformer Q/K/V 交互动画](/demos/transformer-qkv.html)

## 一句话

Q/K/V 不是三个神秘矩阵，而是同一批 token embedding 经过三组不同投影后得到的"提问 / 索引 / 内容"三张卡——注意力做的事，就是用 Q 去和每个 K 比对相关度，再按相关度把对应的 V 加权汇总起来。
