[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [collision-detector/detector-result-point](../README.md) / DetectorResultPoint

# Class: DetectorResultPoint

Defined in: [collision-detector/detector-result-point.ts:8](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/collision-detector/detector-result-point.ts#L8)

碰撞检测点详情类。
物理引擎碰撞检测中单个碰撞点的详情容器，
存储两个几何对象在碰撞点处的位置、穿透深度和标识ID，是DetectorResult的核心子数据结构。

## Constructors

### Constructor

> **new DetectorResultPoint**(): `DetectorResultPoint`

#### Returns

`DetectorResultPoint`

## Properties

### depth

> **depth**: `number` = `0`

Defined in: [collision-detector/detector-result-point.ts:28](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/collision-detector/detector-result-point.ts#L28)

碰撞点穿透深度。
两个几何对象在该碰撞点处的穿透深度值（正数表示穿透，越大穿透越严重），
初始值为0（无穿透），用于物理引擎的碰撞响应计算（如推离重叠对象）。

***

### id

> **id**: `number` = `0`

Defined in: [collision-detector/detector-result-point.ts:35](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/collision-detector/detector-result-point.ts#L35)

碰撞点唯一标识ID。
用于区分不同碰撞点的标识值，初始值为0，
可用于关联碰撞点与几何对象的面/边/顶点等原始数据，便于精准的碰撞响应。

***

### position1

> **position1**: [`Vec3`](../../../common/vec3/classes/Vec3.md)

Defined in: [collision-detector/detector-result-point.ts:14](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/collision-detector/detector-result-point.ts#L14)

第一个几何对象的碰撞点坐标。
以世界坐标系/局部坐标系表示的第一个几何对象碰撞位置，初始化为零向量，
坐标空间取决于检测器的实现逻辑（通常为世界坐标系）。

***

### position2

> **position2**: [`Vec3`](../../../common/vec3/classes/Vec3.md)

Defined in: [collision-detector/detector-result-point.ts:21](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/collision-detector/detector-result-point.ts#L21)

第二个几何对象的碰撞点坐标。
以世界坐标系/局部坐标系表示的第二个几何对象碰撞位置，初始化为零向量，
与position1对应同一碰撞接触点在不同对象上的投影位置。
