[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [collision-detector/box-box-detector/box-box-detector](../README.md) / BoxBoxDetector

# Class: BoxBoxDetector

Defined in: [collision-detector/box-box-detector/box-box-detector.ts:19](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/collision-detector/box-box-detector/box-box-detector.ts#L19)

盒体-盒体碰撞检测核心类。
物理引擎中轴对齐/旋转盒体（BoxGeometry）间的精确碰撞检测实现类；
继承自通用Detector抽象类，专注于两个盒体的碰撞检测，核心能力：
1. 基于分离轴定理（SAT）检测两个盒体是否相交；
2. 计算碰撞深度、碰撞法向量、接触点等关键碰撞数据；
3. 结合FaceClipper完成接触点的裁剪与简化，输出高精度碰撞结果；
主要应用于刚体物理碰撞、碰撞响应、接触点生成等场景。

## Extends

- [`Detector`](../../../detector/classes/Detector.md)\<[`BoxGeometry`](../../../../shape/box-geometry/classes/BoxGeometry.md), [`BoxGeometry`](../../../../shape/box-geometry/classes/BoxGeometry.md)\>

## Constructors

### Constructor

> **new BoxBoxDetector**(): `BoxBoxDetector`

Defined in: [collision-detector/box-box-detector/box-box-detector.ts:59](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/collision-detector/box-box-detector/box-box-detector.ts#L59)

构造函数：初始化盒体碰撞检测器。
调用父类Detector的构造函数，设置非增量检测模式；
初始化FaceClipper实例，为后续接触点裁剪做准备。

#### Returns

`BoxBoxDetector`

#### Overrides

[`Detector`](../../../detector/classes/Detector.md).[`constructor`](../../../detector/classes/Detector.md#constructor)

## Properties

### clipper

> **clipper**: [`FaceClipper`](../../face-clipper/classes/FaceClipper.md)

Defined in: [collision-detector/box-box-detector/box-box-detector.ts:25](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/collision-detector/box-box-detector/box-box-detector.ts#L25)

面裁剪器实例。
用于碰撞接触点的矩形边界裁剪与顶点简化；
在detectImpl中初始化裁剪参数并执行裁剪/简化操作。

***

### swapped

> **swapped**: `boolean`

Defined in: [collision-detector/detector.ts:24](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/collision-detector/detector.ts#L24)

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

Defined in: [collision-detector/detector.ts:65](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/collision-detector/detector.ts#L65)

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

Defined in: [collision-detector/detector.ts:102](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/collision-detector/detector.ts#L102)

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

[`BoxGeometry`](../../../../shape/box-geometry/classes/BoxGeometry.md)

第一个几何对象

##### geom2

[`BoxGeometry`](../../../../shape/box-geometry/classes/BoxGeometry.md)

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

Defined in: [collision-detector/detector.ts:43](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/collision-detector/detector.ts#L43)

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
