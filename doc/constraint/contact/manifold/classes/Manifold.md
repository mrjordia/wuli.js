[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [constraint/contact/manifold](../README.md) / Manifold

# Class: Manifold

Defined in: [constraint/contact/manifold.ts:11](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/manifold.ts#L11)

碰撞流形类。
用于存储两个碰撞物体之间的完整接触信息，包括接触法向/切向/副法向基向量、所有接触点（ManifoldPoint）集合，
             并提供接触数据的清空、基向量构建、深度和位置更新等核心方法，是物理引擎中碰撞响应计算的核心数据结构

## Constructors

### Constructor

> **new Manifold**(): `Manifold`

Defined in: [constraint/contact/manifold.ts:48](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/manifold.ts#L48)

构造函数：初始化接触点数组。
创建Manifold实例时，自动初始化points数组，为每个元素创建ManifoldPoint实例，避免运行时动态创建

#### Returns

`Manifold`

## Properties

### binormal

> **binormal**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/contact/manifold.ts:28](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/manifold.ts#L28)

碰撞接触副法向向量（世界坐标系）。
长度为3的浮点数组，格式 [x, y, z]，与法向、切向都垂直的副法向单位向量，构成接触基的第三个轴（法向×切向）

***

### normal

> **normal**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/contact/manifold.ts:16](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/manifold.ts#L16)

碰撞接触法向向量（世界坐标系）。
长度为3的浮点数组，格式 [x, y, z]，表示两个碰撞物体接触区域的主法向方向，单位向量，指向从物体2到物体1的方向

***

### numPoints

> **numPoints**: `number` = `0`

Defined in: [constraint/contact/manifold.ts:35](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/manifold.ts#L35)

当前有效接触点数量。
范围 0 ~ SETTING_MAX_MANIFOLD_POINTS，标识points数组中实际有效的接触点个数

#### Default

```ts
0
```

***

### points

> **points**: [`ManifoldPoint`](../../manifold-point/classes/ManifoldPoint.md)[]

Defined in: [constraint/contact/manifold.ts:42](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/manifold.ts#L42)

碰撞接触点数组。
预分配固定长度的ManifoldPoint数组，长度由CONSTANT.SETTING_MAX_MANIFOLD_POINTS指定，
             存储该碰撞流形下的所有接触点信息，实际有效数量由numPoints标识

***

### tangent

> **tangent**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/contact/manifold.ts:22](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/manifold.ts#L22)

碰撞接触切向向量（世界坐标系）。
长度为3的浮点数组，格式 [x, y, z]，与法向垂直的切向单位向量，构成接触基的第二个轴

## Methods

### buildBasis()

> **buildBasis**(`_normal`): `void`

Defined in: [constraint/contact/manifold.ts:90](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/manifold.ts#L90)

基于输入法向构建接触基向量（法向、切向、副法向）。
算法原理：
             1. 将输入法向赋值给当前流形的normal属性
             2. 找到法向中最小分量的轴，构造垂直的切向向量（保证数值稳定性）
             3. 通过法向与切向的叉积计算副法向，形成正交的接触基
             所有向量最终均为单位向量，构成右手坐标系

#### Parameters

##### \_normal

[`Vec3`](../../../../common/vec3/classes/Vec3.md)

输入法向向量 - 碰撞接触的主法向（Vec3实例），用于推导切向和副法向

#### Returns

`void`

***

### clear()

> **clear**(): `void`

Defined in: [constraint/contact/manifold.ts:59](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/manifold.ts#L59)

清空碰撞流形的所有接触点数据。
将所有有效接触点的坐标、深度、冲量、状态等数据重置为初始值，并将有效接触点数量置0，
             保留数组内存避免频繁GC，仅重置数据内容

#### Returns

`void`

***

### updateDepthsAndPositions()

> **updateDepthsAndPositions**(`_tf1`, `_tf2`): `void`

Defined in: [constraint/contact/manifold.ts:131](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/manifold.ts#L131)

更新所有接触点的穿透深度和世界坐标。
核心逻辑：
             1. 将接触点的局部坐标通过物体变换矩阵转换为相对质心的坐标（relPos1/relPos2）
             2. 结合物体的世界平移量，计算接触点的世界坐标（pos1/pos2）
             3. 通过世界坐标差值与法向的点积，计算并更新接触点的穿透深度（depth）
             穿透深度公式：depth = - (pos1 - pos2) · normal

#### Parameters

##### \_tf1

[`Transform`](../../../../common/transform/classes/Transform.md)

第一个物体的变换信息 - 包含物体1的平移和旋转矩阵（Transform实例）

##### \_tf2

[`Transform`](../../../../common/transform/classes/Transform.md)

第二个物体的变换信息 - 包含物体2的平移和旋转矩阵（Transform实例）

#### Returns

`void`
