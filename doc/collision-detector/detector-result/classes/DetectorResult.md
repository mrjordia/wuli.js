[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [collision-detector/detector-result](../README.md) / DetectorResult

# Class: DetectorResult

Defined in: [collision-detector/detector-result.ts:10](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/collision-detector/detector-result.ts#L10)

碰撞检测结果类。
物理引擎碰撞检测的结果容器，用于存储两个几何形状碰撞的核心数据，
包含碰撞点列表、碰撞法线、最大穿透深度等关键信息，支持结果清空和深度计算。

## Constructors

### Constructor

> **new DetectorResult**(): `DetectorResult`

Defined in: [collision-detector/detector-result.ts:43](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/collision-detector/detector-result.ts#L43)

碰撞检测结果构造函数。
初始化碰撞点数组，为每个元素创建DetectorResultPoint实例，
确保数组长度符合最大碰撞点数限制，避免后续使用时出现空指针。

#### Returns

`DetectorResult`

## Properties

### incremental

> **incremental**: `boolean` = `false`

Defined in: [collision-detector/detector-result.ts:29](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/collision-detector/detector-result.ts#L29)

增量检测标记。
标记是否启用增量碰撞检测：
- true：保留上一帧的碰撞点，仅补充新的碰撞点；
- false：每次检测清空所有碰撞点（默认）；

***

### normal

> **normal**: [`Vec3`](../../../common/vec3/classes/Vec3.md)

Defined in: [collision-detector/detector-result.ts:21](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/collision-detector/detector-result.ts#L21)

碰撞法线向量。
表示碰撞接触的法线方向（指向第一个几何对象的外侧），初始化为零向量

***

### numPoints

> **numPoints**: `number` = `0`

Defined in: [collision-detector/detector-result.ts:15](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/collision-detector/detector-result.ts#L15)

有效碰撞点数量。
标记points数组中实际有效的碰撞点个数，初始值为0

***

### points

> **points**: [`DetectorResultPoint`](../../detector-result-point/classes/DetectorResultPoint.md)[]

Defined in: [collision-detector/detector-result.ts:36](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/collision-detector/detector-result.ts#L36)

碰撞点数组。
存储碰撞点详情的数组，长度由最大碰撞点数常量限制，
每个元素包含两个几何对象的碰撞位置、穿透深度、标识ID等信息

## Methods

### clear()

> **clear**(): `void`

Defined in: [collision-detector/detector-result.ts:75](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/collision-detector/detector-result.ts#L75)

清空碰撞检测结果。
重置所有碰撞相关数据至初始状态：
1. 重置有效碰撞点数量为0；
2. 清空所有碰撞点的坐标、深度、ID；
3. 重置碰撞法线为零向量；
用于下一次碰撞检测前的状态初始化。

#### Returns

`void`

***

### getMaxDepth()

> **getMaxDepth**(): `number`

Defined in: [collision-detector/detector-result.ts:54](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/collision-detector/detector-result.ts#L54)

获取最大穿透深度。
遍历所有有效碰撞点，筛选出最大的depth值，用于判断碰撞的严重程度，
无有效碰撞点时返回0（初始值）。

#### Returns

`number`

所有有效碰撞点中的最大深度值
