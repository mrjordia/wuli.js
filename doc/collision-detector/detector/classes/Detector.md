[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [collision-detector/detector](../README.md) / Detector

# Abstract Class: Detector\<T1, T2\>

Defined in: [collision-detector/detector.ts:14](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/detector.ts#L14)

碰撞检测器抽象类。
物理引擎几何碰撞检测的核心抽象类，定义两个几何形状碰撞检测的通用逻辑；
需由业务层实现具体的detectImpl方法，支持处理几何形状的碰撞点、法线等核心数据，
内置swapped标记支持交换检测对象顺序，适配不同场景的碰撞检测需求。

## Extended by

- [`CapsuleCapsuleDetector`](../../capsule-capsule-detector/classes/CapsuleCapsuleDetector.md)
- [`ConvexTerrainDetector`](../../convex-terrain-detector/classes/ConvexTerrainDetector.md)
- [`SphereBoxDetector`](../../sphere-box-detector/classes/SphereBoxDetector.md)
- [`SphereCapsuleDetector`](../../sphere-capsule-detector/classes/SphereCapsuleDetector.md)
- [`SphereSphereDetector`](../../sphere-sphere-detector/classes/SphereSphereDetector.md)
- [`BoxBoxDetector`](../../box-box-detector/box-box-detector/classes/BoxBoxDetector.md)
- [`GjkEpaDetector`](../../gjk-epa-detector/gjk-epa-detector/classes/GjkEpaDetector.md)

## Type Parameters

### T1

`T1` = [`Geometry`](../../../shape/geometry/classes/Geometry.md)

第一个几何形状类型（默认Geometry）

### T2

`T2` = [`Geometry`](../../../shape/geometry/classes/Geometry.md)

第二个几何形状类型（默认Geometry）

## Constructors

### Constructor

> **new Detector**\<`T1`, `T2`\>(`swapped`): `Detector`\<`T1`, `T2`\>

Defined in: [collision-detector/detector.ts:30](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/detector.ts#L30)

碰撞检测器构造函数

#### Parameters

##### swapped

`boolean`

是否交换检测对象顺序

#### Returns

`Detector`\<`T1`, `T2`\>

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

`T1`

第一个几何对象

##### geom2

`T2`

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
