[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [collision-detector/gjk-epa-detector/epa-triangle](../README.md) / EpaTriangle

# Class: EpaTriangle

Defined in: [collision-detector/gjk-epa-detector/epa-triangle.ts:13](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/epa-triangle.ts#L13)

EPA三角面类。
属于EPA（扩展多面体算法）核心数据结构，用于表示碰撞检测中多面体的三角面，
             存储三角面的顶点、相邻三角面、法向量、距离等关键几何信息，
             支持三角面初始化、相邻关系管理、引用清理等核心操作，是EPA算法求解碰撞穿透深度的基础组件

## Constructors

### Constructor

> **new EpaTriangle**(): `EpaTriangle`

#### Returns

`EpaTriangle`

## Properties

### adjacentPairIndex

> **adjacentPairIndex**: `Int8Array`\<`ArrayBuffer`\>

Defined in: [collision-detector/gjk-epa-detector/epa-triangle.ts:73](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/epa-triangle.ts#L73)

相邻三角面对应的边索引。
长度为3的数组，存储相邻三角面中对应共享边的索引，用于快速定位相邻边

***

### adjacentTriangles

> **adjacentTriangles**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<`EpaTriangle`\>[]

Defined in: [collision-detector/gjk-epa-detector/epa-triangle.ts:67](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/epa-triangle.ts#L67)

相邻三角面数组。
长度为3的数组，存储与当前三角面共享边的三个相邻三角面，
             索引与vertices一一对应（索引i对应顶点i和i+1组成的边的相邻三角面）

***

### distanceSq

> **distanceSq**: `number` = `0`

Defined in: [collision-detector/gjk-epa-detector/epa-triangle.ts:42](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/epa-triangle.ts#L42)

原点到三角面的距离平方。
优化计算用的缓存值，避免重复开平方，核心用于筛选最近三角面

***

### id

> **id**: `number` = `++CONSTANT.EPA_TRIANGLE_COUNT`

Defined in: [collision-detector/gjk-epa-detector/epa-triangle.ts:18](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/epa-triangle.ts#L18)

三角面唯一标识ID。
自增ID，通过全局EPA_TRIANGLE_COUNT生成，用于区分不同三角面实例

***

### next

> **next**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<`EpaTriangle`\>

Defined in: [collision-detector/gjk-epa-detector/epa-triangle.ts:24](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/epa-triangle.ts#L24)

链表下一个三角面。
用于三角面链表管理的指针，指向链表中当前三角面的下一个节点

***

### nextIndex

> **nextIndex**: `any`

Defined in: [collision-detector/gjk-epa-detector/epa-triangle.ts:85](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/epa-triangle.ts#L85)

下一个顶点索引映射。
预定义的顶点索引循环映射：[0,1,2,0]，用于快速获取当前顶点的下一个顶点索引

***

### normal

> **normal**: [`Vec3`](../../../../common/vec3/classes/Vec3.md)

Defined in: [collision-detector/gjk-epa-detector/epa-triangle.ts:36](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/epa-triangle.ts#L36)

三角面法向量。
三角面的单位法向量（指向外部），用于判断三角面朝向和计算距离

***

### prev

> **prev**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<`EpaTriangle`\>

Defined in: [collision-detector/gjk-epa-detector/epa-triangle.ts:30](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/epa-triangle.ts#L30)

链表上一个三角面。
用于三角面链表管理的指针，指向链表中当前三角面的上一个节点

***

### tmp

> **tmp**: [`Vec3`](../../../../common/vec3/classes/Vec3.md)

Defined in: [collision-detector/gjk-epa-detector/epa-triangle.ts:79](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/epa-triangle.ts#L79)

临时向量存储。
用于计算的临时向量，避免频繁创建新Vec3实例，优化内存开销

***

### tmpDfsId

> **tmpDfsId**: `number` = `0`

Defined in: [collision-detector/gjk-epa-detector/epa-triangle.ts:48](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/epa-triangle.ts#L48)

DFS遍历临时ID。
深度优先搜索（DFS）时的临时标记ID，用于遍历过程中区分已访问/未访问三角面

***

### tmpDfsVisible

> **tmpDfsVisible**: `boolean` = `false`

Defined in: [collision-detector/gjk-epa-detector/epa-triangle.ts:54](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/epa-triangle.ts#L54)

DFS遍历可见性标记。
深度优先搜索（DFS）时的临时可见性标记，标记三角面是否朝向原点（可见）

***

### vertices

> **vertices**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`EpaVertex`](../../epa-vertex/classes/EpaVertex.md)\>[]

Defined in: [collision-detector/gjk-epa-detector/epa-triangle.ts:60](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/epa-triangle.ts#L60)

三角面的三个顶点。
长度为3的数组，存储构成三角面的三个EPA顶点实例，索引0/1/2对应三角面的三个顶点

## Methods

### init()

> **init**(`vertex1`, `vertex2`, `vertex3`, `center`, `autoCheck`): `boolean`

Defined in: [collision-detector/gjk-epa-detector/epa-triangle.ts:117](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/epa-triangle.ts#L117)

初始化EPA三角面。
核心初始化逻辑：
             1. 复制顶点和中心点坐标到临时缓存，计算边向量和法向量；
             2. 判断法向量朝向：若朝向与中心点相反，autoCheck=true时交换顶点修正朝向，否则标记为反转；
             3. 计算三角面到原点的最近点和距离平方（distanceSq），优先取边/顶点的最近点，无则取法向量投影点；
             4. 初始化相邻三角面数组为null，相邻边索引为-1；
             该方法是三角面几何属性初始化的核心，保证法向量朝向和距离计算的准确性

#### Parameters

##### vertex1

[`EpaVertex`](../../epa-vertex/classes/EpaVertex.md)

第一个顶点

##### vertex2

[`EpaVertex`](../../epa-vertex/classes/EpaVertex.md)

第二个顶点

##### vertex3

[`EpaVertex`](../../epa-vertex/classes/EpaVertex.md)

第三个顶点

##### center

[`Vec3`](../../../../common/vec3/classes/Vec3.md)

参考中心点（通常为原点）

##### autoCheck

`boolean`

是否自动修正三角面朝向

#### Returns

`boolean`

三角面是否未被反转（true=朝向正确，false=已反转）

***

### removeAdjacentTriangles()

> **removeAdjacentTriangles**(): `void`

Defined in: [collision-detector/gjk-epa-detector/epa-triangle.ts:283](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/epa-triangle.ts#L283)

移除所有相邻三角面关联。
核心逻辑：
             1. 遍历当前三角面的三个相邻三角面；
             2. 若相邻三角面存在，双向清除关联（当前三角面置null，相邻三角面对应位置也置null）；
             3. 重置相邻边索引为-1；
             该方法用于三角面从多面体中移除时，清理拓扑关联，避免内存泄漏和计算错误

#### Returns

`void`

***

### removeReferences()

> **removeReferences**(): `void`

Defined in: [collision-detector/gjk-epa-detector/epa-triangle.ts:318](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/epa-triangle.ts#L318)

移除所有引用（清理内存）。
核心逻辑：
             1. 清空链表指针（next/prev）、DFS临时标记、距离平方；
             2. 清空顶点数组、相邻三角面数组、相邻边索引数组；
             该方法是三角面销毁前的核心清理操作，避免循环引用导致的内存泄漏

#### Returns

`void`

***

### setAdjacentTriangle()

> **setAdjacentTriangle**(`triangle`): `boolean`

Defined in: [collision-detector/gjk-epa-detector/epa-triangle.ts:205](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/epa-triangle.ts#L205)

设置相邻三角面。
核心逻辑：
             1. 遍历当前三角面和目标三角面的所有边组合（共9种），查找共享边；
             2. 找到唯一共享边时，双向绑定相邻三角面和边索引；
             3. 返回是否仅找到一条共享边（保证关联的唯一性）；
             该方法是EPA算法中构建多面体拓扑结构的核心，确保三角面间的边关联正确

#### Parameters

##### triangle

`EpaTriangle`

待关联的相邻三角面

#### Returns

`boolean`

是否成功关联（true=找到唯一共享边并关联，false=未找到/找到多条共享边）
