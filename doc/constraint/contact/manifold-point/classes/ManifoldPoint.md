[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [constraint/contact/manifold-point](../README.md) / ManifoldPoint

# Class: ManifoldPoint

Defined in: [constraint/contact/manifold-point.ts:7](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/manifold-point.ts#L7)

碰撞流形点类。
用于存储物理碰撞中单个接触点的完整信息，包括接触点坐标、穿透深度、冲量、状态标识等，是碰撞检测与物理响应的核心数据结构

## Constructors

### Constructor

> **new ManifoldPoint**(): `ManifoldPoint`

#### Returns

`ManifoldPoint`

## Properties

### depth

> **depth**: `number` = `0`

Defined in: [constraint/contact/manifold-point.ts:49](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/manifold-point.ts#L49)

接触点的穿透深度。
单位为米(m)，正值表示两个物体相互穿透的深度，用于计算碰撞响应的冲量大小

#### Default

```ts
0
```

***

### disabled

> **disabled**: `boolean` = `false`

Defined in: [constraint/contact/manifold-point.ts:69](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/manifold-point.ts#L69)

接触点禁用状态标识。
true表示该接触点被禁用，不会参与碰撞响应计算；false表示启用，正常参与物理计算

#### Default

```ts
false
```

***

### id

> **id**: `number` = `-1`

Defined in: [constraint/contact/manifold-point.ts:76](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/manifold-point.ts#L76)

接触点唯一标识ID。
用于区分不同的接触点，-1表示未分配有效ID，通常在碰撞检测阶段赋值

#### Default

```ts
-1
```

***

### impulse

> **impulse**: [`ContactImpulse`](../../contact-impulse/classes/ContactImpulse.md)

Defined in: [constraint/contact/manifold-point.ts:55](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/manifold-point.ts#L55)

该接触点的碰撞冲量信息。
包含法向、切向、副法向等方向的冲量分量，以及冲量作用线的坐标

***

### localPos1

> **localPos1**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/contact/manifold-point.ts:12](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/manifold-point.ts#L12)

第一个碰撞物体的局部坐标系下的接触点坐标。
长度为3的浮点数组，格式 [x, y, z]，单位为米(m)，基于第一个物体的局部空间

***

### localPos2

> **localPos2**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/contact/manifold-point.ts:18](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/manifold-point.ts#L18)

第二个碰撞物体的局部坐标系下的接触点坐标。
长度为3的浮点数组，格式 [x, y, z]，单位为米(m)，基于第二个物体的局部空间

***

### pos1

> **pos1**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/contact/manifold-point.ts:36](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/manifold-point.ts#L36)

世界坐标系下第一个碰撞物体的接触点坐标。
长度为3的浮点数组，格式 [x, y, z]，单位为米(m)，基于全局世界空间

***

### pos2

> **pos2**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/contact/manifold-point.ts:42](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/manifold-point.ts#L42)

世界坐标系下第二个碰撞物体的接触点坐标。
长度为3的浮点数组，格式 [x, y, z]，单位为米(m)，基于全局世界空间

***

### relPos1

> **relPos1**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/contact/manifold-point.ts:24](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/manifold-point.ts#L24)

第一个碰撞物体的相对接触点坐标（通常相对于质心）。
长度为3的浮点数组，格式 [x, y, z]，单位为米(m)，表示接触点相对于第一个物体质心的位置

***

### relPos2

> **relPos2**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/contact/manifold-point.ts:30](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/manifold-point.ts#L30)

第二个碰撞物体的相对接触点坐标（通常相对于质心）。
长度为3的浮点数组，格式 [x, y, z]，单位为米(m)，表示接触点相对于第二个物体质心的位置

***

### warmStarted

> **warmStarted**: `boolean` = `false`

Defined in: [constraint/contact/manifold-point.ts:62](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/manifold-point.ts#L62)

热启动状态标识。
标记该接触点是否启用了物理冲量的热启动（Warm Starting）优化，true表示已启用，可提升物理仿真的稳定性和收敛速度

#### Default

```ts
false
```
