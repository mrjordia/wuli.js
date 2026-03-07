[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [collision-detector/gjk-epa-detector/gjk-epa-detector](../README.md) / GjkEpaDetector

# Class: GjkEpaDetector

Defined in: [collision-detector/gjk-epa-detector/gjk-epa-detector.ts:18](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/gjk-epa-detector/gjk-epa-detector.ts#L18)

GJK/EPA碰撞检测器类（凸几何体精确碰撞检测）。
基于GJK（快速碰撞检测）+ EPA（精确距离/法线计算）算法的凸几何体碰撞检测器；
核心功能：
1. 检测两个凸几何体是否碰撞，并计算精确的碰撞法线、穿透深度、接触点；
2. 支持GJK缓存优化，提升连续帧碰撞检测性能；
3. 处理几何体的GJK Margin（边缘容差），保证碰撞检测的稳定性；
适用场景：所有凸几何体（如凸多面体、球体、胶囊体等）的精确碰撞检测。

## Extends

- [`Detector`](../../../detector/classes/Detector.md)\<[`ConvexGeometry`](../../../../shape/convex-geometry/classes/ConvexGeometry.md), [`ConvexGeometry`](../../../../shape/convex-geometry/classes/ConvexGeometry.md)\>

## Constructors

### Constructor

> **new GjkEpaDetector**(): `GjkEpaDetector`

Defined in: [collision-detector/gjk-epa-detector/gjk-epa-detector.ts:24](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/gjk-epa-detector/gjk-epa-detector.ts#L24)

GJK/EPA碰撞检测器构造函数。
调用父类构造函数，设置检测器为非连续检测模式（false）；
非连续检测：仅检测当前帧几何体是否碰撞，不检测运动过程中的碰撞（CCD）。

#### Returns

`GjkEpaDetector`

#### Overrides

[`Detector`](../../../detector/classes/Detector.md).[`constructor`](../../../detector/classes/Detector.md#constructor)

## Properties

### swapped

> **swapped**: `boolean`

Defined in: [collision-detector/detector.ts:24](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/detector.ts#L24)

是否交换检测对象顺序标记。
标记为true时：
1. 交换geom1/geom2、transform1/transform2的检测顺序；
2. 法线向量取反；
3. 碰撞点的position1/position2坐标交换；
用于适配“反向检测”场景（如B-A碰撞等效于A-B碰撞）。

#### Inherited from

[`Detector`](../../../detector/classes/Detector.md).[`swapped`](../../../detector/classes/Detector.md#swapped)

## Methods

### addPoint()

> **addPoint**(`result`, `pos1X`, `pos1Y`, `pos1Z`, `pos2X`, `pos2Y`, `pos2Z`, `depth`, `id`): `void`

Defined in: [collision-detector/detector.ts:65](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/detector.ts#L65)

向检测结果添加碰撞点信息。
自动根据swapped标记交换position1/position2坐标，保证坐标与检测顺序一致。

#### Parameters

##### result

[`DetectorResult`](../../../detector-result/classes/DetectorResult.md)

碰撞检测结果实例

##### pos1X

`number`

第一个几何对象碰撞点X坐标

##### pos1Y

`number`

第一个几何对象碰撞点Y坐标

##### pos1Z

`number`

第一个几何对象碰撞点Z坐标

##### pos2X

`number`

第二个几何对象碰撞点X坐标

##### pos2Y

`number`

第二个几何对象碰撞点Y坐标

##### pos2Z

`number`

第二个几何对象碰撞点Z坐标

##### depth

`number`

碰撞点深度（穿透深度）

##### id

`number`

碰撞点唯一标识ID

#### Returns

`void`

#### Inherited from

[`Detector`](../../../detector/classes/Detector.md).[`addPoint`](../../../detector/classes/Detector.md#addpoint)

***

### detect()

> **detect**(`result`, `geom1`, `geom2`, `transform1`, `transform2`, `cachedData`): `void`

Defined in: [collision-detector/detector.ts:102](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/detector.ts#L102)

执行碰撞检测的入口方法。
执行流程：
1. 清空检测结果的碰撞点、法线等数据；
2. 根据swapped标记决定检测顺序，调用具体检测实现；
核心作用：封装通用的检测前置/后置逻辑，子类仅需实现detectImpl即可。

#### Parameters

##### result

[`DetectorResult`](../../../detector-result/classes/DetectorResult.md)

碰撞检测结果实例（输出参数）

##### geom1

[`ConvexGeometry`](../../../../shape/convex-geometry/classes/ConvexGeometry.md)

第一个几何对象

##### geom2

[`ConvexGeometry`](../../../../shape/convex-geometry/classes/ConvexGeometry.md)

第二个几何对象

##### transform1

[`Transform`](../../../../common/transform/classes/Transform.md)

第一个几何对象的变换矩阵（位置/旋转/缩放）

##### transform2

[`Transform`](../../../../common/transform/classes/Transform.md)

第二个几何对象的变换矩阵（位置/旋转/缩放）

##### cachedData

[`CachedDetectorData`](../../../cached-detector-data/classes/CachedDetectorData.md)

检测器缓存数据（优化重复检测性能）

#### Returns

`void`

#### Inherited from

[`Detector`](../../../detector/classes/Detector.md).[`detect`](../../../detector/classes/Detector.md#detect)

***

### setNormal()

> **setNormal**(`result`, `nX`, `nY`, `nZ`): `void`

Defined in: [collision-detector/detector.ts:43](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/detector.ts#L43)

设置碰撞检测结果的法线向量。
自动根据swapped标记决定是否对法线向量取反，保证法线方向符合检测顺序。

#### Parameters

##### result

[`DetectorResult`](../../../detector-result/classes/DetectorResult.md)

碰撞检测结果实例（存储法线、碰撞点等数据）

##### nX

`number`

法线向量X分量

##### nY

`number`

法线向量Y分量

##### nZ

`number`

法线向量Z分量

#### Returns

`void`

#### Inherited from

[`Detector`](../../../detector/classes/Detector.md).[`setNormal`](../../../detector/classes/Detector.md#setnormal)
