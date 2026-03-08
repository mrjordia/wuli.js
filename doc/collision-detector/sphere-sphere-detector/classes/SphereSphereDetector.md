[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [collision-detector/sphere-sphere-detector](../README.md) / SphereSphereDetector

# Class: SphereSphereDetector

Defined in: [collision-detector/sphere-sphere-detector.ts:13](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/sphere-sphere-detector.ts#L13)

球体-球体碰撞检测器类。
专用于检测两个球体（SphereGeometry）之间碰撞的检测器，继承自通用碰撞检测器抽象类；
核心算法：计算两个球心之间的距离，判断是否小于“两球半径之和”，若满足则判定为碰撞；
是物理引擎中最基础、高效的碰撞检测器，无需交换检测对象顺序（swapped固定为false）。

## Extends

- [`Detector`](../../detector/classes/Detector.md)\<[`SphereGeometry`](../../../shape/sphere-geometry/classes/SphereGeometry.md), [`SphereGeometry`](../../../shape/sphere-geometry/classes/SphereGeometry.md)\>

## Constructors

### Constructor

> **new SphereSphereDetector**(): `SphereSphereDetector`

Defined in: [collision-detector/sphere-sphere-detector.ts:18](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/sphere-sphere-detector.ts#L18)

球体-球体检测器构造函数。
初始化父类Detector，固定设置swapped为false（球体碰撞无方向依赖，无需交换检测顺序）。

#### Returns

`SphereSphereDetector`

#### Overrides

[`Detector`](../../detector/classes/Detector.md).[`constructor`](../../detector/classes/Detector.md#constructor)

## Properties

### swapped

> **swapped**: `boolean`

Defined in: [collision-detector/detector.ts:24](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/detector.ts#L24)

是否交换检测对象顺序标记。
标记为true时：
1. 交换geom1/geom2、transform1/transform2的检测顺序；
2. 法线向量取反；
3. 碰撞点的position1/position2坐标交换；
用于适配“反向检测”场景（如B-A碰撞等效于A-B碰撞）。

#### Inherited from

[`Detector`](../../detector/classes/Detector.md).[`swapped`](../../detector/classes/Detector.md#swapped)

## Methods

### addPoint()

> **addPoint**(`result`, `pos1X`, `pos1Y`, `pos1Z`, `pos2X`, `pos2Y`, `pos2Z`, `depth`, `id`): `void`

Defined in: [collision-detector/detector.ts:65](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/detector.ts#L65)

向检测结果添加碰撞点信息。
自动根据swapped标记交换position1/position2坐标，保证坐标与检测顺序一致。

#### Parameters

##### result

[`DetectorResult`](../../detector-result/classes/DetectorResult.md)

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

[`Detector`](../../detector/classes/Detector.md).[`addPoint`](../../detector/classes/Detector.md#addpoint)

***

### detect()

> **detect**(`result`, `geom1`, `geom2`, `transform1`, `transform2`, `cachedData`): `void`

Defined in: [collision-detector/detector.ts:102](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/detector.ts#L102)

执行碰撞检测的入口方法。
执行流程：
1. 清空检测结果的碰撞点、法线等数据；
2. 根据swapped标记决定检测顺序，调用具体检测实现；
核心作用：封装通用的检测前置/后置逻辑，子类仅需实现detectImpl即可。

#### Parameters

##### result

[`DetectorResult`](../../detector-result/classes/DetectorResult.md)

碰撞检测结果实例（输出参数）

##### geom1

[`SphereGeometry`](../../../shape/sphere-geometry/classes/SphereGeometry.md)

第一个几何对象

##### geom2

[`SphereGeometry`](../../../shape/sphere-geometry/classes/SphereGeometry.md)

第二个几何对象

##### transform1

[`Transform`](../../../common/transform/classes/Transform.md)

第一个几何对象的变换矩阵（位置/旋转/缩放）

##### transform2

[`Transform`](../../../common/transform/classes/Transform.md)

第二个几何对象的变换矩阵（位置/旋转/缩放）

##### cachedData

[`CachedDetectorData`](../../cached-detector-data/classes/CachedDetectorData.md)

检测器缓存数据（优化重复检测性能）

#### Returns

`void`

#### Inherited from

[`Detector`](../../detector/classes/Detector.md).[`detect`](../../detector/classes/Detector.md#detect)

***

### setNormal()

> **setNormal**(`result`, `nX`, `nY`, `nZ`): `void`

Defined in: [collision-detector/detector.ts:43](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/detector.ts#L43)

设置碰撞检测结果的法线向量。
自动根据swapped标记决定是否对法线向量取反，保证法线方向符合检测顺序。

#### Parameters

##### result

[`DetectorResult`](../../detector-result/classes/DetectorResult.md)

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

[`Detector`](../../detector/classes/Detector.md).[`setNormal`](../../detector/classes/Detector.md#setnormal)
