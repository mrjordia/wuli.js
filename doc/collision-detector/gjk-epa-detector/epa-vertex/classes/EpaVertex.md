[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [collision-detector/gjk-epa-detector/epa-vertex](../README.md) / EpaVertex

# Class: EpaVertex

Defined in: [collision-detector/gjk-epa-detector/epa-vertex.ts:11](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/epa-vertex.ts#L11)

EPA顶点类。
用于表示EPA算法中扩展多面体的顶点数据结构，存储顶点的核心几何信息和拓扑关联关系；
EPA算法是GJK算法的扩展，用于计算两个凸几何体之间的精确碰撞法线和穿透深度，该类是算法的核心数据单元。

## Constructors

### Constructor

> **new EpaVertex**(): `EpaVertex`

#### Returns

`EpaVertex`

## Properties

### next

> **next**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<`EpaVertex`\>

Defined in: [collision-detector/gjk-epa-detector/epa-vertex.ts:22](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/epa-vertex.ts#L22)

顶点在边环中的下一个顶点引用（拓扑关联）

***

### randId

> **randId**: `number`

Defined in: [collision-detector/gjk-epa-detector/epa-vertex.ts:13](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/epa-vertex.ts#L13)

顶点随机ID，用于调试/标识，避免顶点重复或混淆（取整随机数）

***

### tmpEdgeLoopNext

> **tmpEdgeLoopNext**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<`EpaVertex`\>

Defined in: [collision-detector/gjk-epa-detector/epa-vertex.ts:24](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/epa-vertex.ts#L24)

临时边环的下一个顶点引用（算法过程中临时使用）

***

### tmpEdgeLoopOuterTriangle

> **tmpEdgeLoopOuterTriangle**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`EpaTriangle`](../../epa-triangle/classes/EpaTriangle.md)\>

Defined in: [collision-detector/gjk-epa-detector/epa-vertex.ts:26](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/epa-vertex.ts#L26)

临时边环所属的外部三角形引用（算法过程中临时拓扑关联）

***

### v

> **v**: [`Vec3`](../../../../common/vec3/classes/Vec3.md)

Defined in: [collision-detector/gjk-epa-detector/epa-vertex.ts:15](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/epa-vertex.ts#L15)

顶点在Minkowski差空间中的坐标（核心几何属性）

***

### w1

> **w1**: [`Vec3`](../../../../common/vec3/classes/Vec3.md)

Defined in: [collision-detector/gjk-epa-detector/epa-vertex.ts:17](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/epa-vertex.ts#L17)

该顶点对应的第一个凸几何体的支撑点坐标（世界坐标系）

***

### w2

> **w2**: [`Vec3`](../../../../common/vec3/classes/Vec3.md)

Defined in: [collision-detector/gjk-epa-detector/epa-vertex.ts:19](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/epa-vertex.ts#L19)

该顶点对应的第二个凸几何体的支撑点坐标（世界坐标系）

## Methods

### init()

> **init**(`v`, `w1`, `w2`): `EpaVertex`

Defined in: [collision-detector/gjk-epa-detector/epa-vertex.ts:39](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/epa-vertex.ts#L39)

初始化EPA顶点的核心数据。
核心逻辑：
1. 拷贝传入的坐标数据到顶点内部属性；
2. 重置所有拓扑关联引用为null，保证顶点初始状态干净；
3. 返回自身实例，支持链式调用。

#### Parameters

##### v

[`Vec3`](../../../../common/vec3/classes/Vec3.md)

Minkowski差空间中的顶点坐标

##### w1

[`Vec3`](../../../../common/vec3/classes/Vec3.md)

第一个凸几何体的支撑点坐标

##### w2

[`Vec3`](../../../../common/vec3/classes/Vec3.md)

第二个凸几何体的支撑点坐标

#### Returns

`EpaVertex`

初始化后的当前顶点实例（链式调用）

***

### removeReferences()

> **removeReferences**(): `void`

Defined in: [collision-detector/gjk-epa-detector/epa-vertex.ts:60](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/epa-vertex.ts#L60)

移除顶点的所有拓扑关联引用。
核心作用：
1. 将所有顶点关联的引用（next/tmpEdgeLoopNext/tmpEdgeLoopOuterTriangle）置为null；
2. 避免内存泄漏，同时保证顶点可被复用或销毁时的状态干净。

#### Returns

`void`
