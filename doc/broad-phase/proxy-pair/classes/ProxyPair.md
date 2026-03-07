[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [broad-phase/proxy-pair](../README.md) / ProxyPair

# Class: ProxyPair

Defined in: [broad-phase/proxy-pair.ts:12](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/broad-phase/proxy-pair.ts#L12)

物理代理对核心类。
物理引擎中用于管理两个PhysicsProxy碰撞配对关系的核心类；
核心作用：
1. 封装一对可能发生碰撞的物理代理（PhysicsProxy）实例；
2. 通过单向链表（next）管理多组代理对，支持高效的碰撞对遍历与维护；
主要应用于物理世界的Broadphase（粗检测）阶段，存储候选碰撞对、过滤重复碰撞检测等场景。

## Constructors

### Constructor

> **new ProxyPair**(): `ProxyPair`

#### Returns

`ProxyPair`

## Properties

### next

> **next**: [`Nullable`](../../../common/nullable/type-aliases/Nullable.md)\<`ProxyPair`\>

Defined in: [broad-phase/proxy-pair.ts:32](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/broad-phase/proxy-pair.ts#L32)

单向链表后继节点。
指向链表中下一个ProxyPair实例；
类型为Nullable，链表尾节点的next为null，用于批量管理碰撞代理对（如粗检测结果链表）。

***

### proxy1

> **proxy1**: [`Nullable`](../../../common/nullable/type-aliases/Nullable.md)\<[`PhysicsProxy`](../../physics-proxy/classes/PhysicsProxy.md)\>

Defined in: [broad-phase/proxy-pair.ts:18](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/broad-phase/proxy-pair.ts#L18)

第一个物理代理实例。
指向配对中的第一个PhysicsProxy对象；
类型为Nullable，支持空值表示该位置未关联有效代理（如配对初始化/清理阶段）。

***

### proxy2

> **proxy2**: [`Nullable`](../../../common/nullable/type-aliases/Nullable.md)\<[`PhysicsProxy`](../../physics-proxy/classes/PhysicsProxy.md)\>

Defined in: [broad-phase/proxy-pair.ts:25](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/broad-phase/proxy-pair.ts#L25)

第二个物理代理实例。
指向配对中的第二个PhysicsProxy对象；
与proxy1配合构成一组碰撞候选对，类型为Nullable，语义同proxy1。
