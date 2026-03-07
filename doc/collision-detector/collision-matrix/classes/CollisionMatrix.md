[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [collision-detector/collision-matrix](../README.md) / CollisionMatrix

# Class: CollisionMatrix

Defined in: [collision-detector/collision-matrix.ts:17](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/collision-matrix.ts#L17)

碰撞检测器矩阵类。
物理引擎的碰撞检测器映射矩阵，核心作用是根据两个几何形状的类型（GEOMETRY_TYPE），
快速匹配对应的专用碰撞检测器（Detector），避免运行时动态判断类型，提升检测效率；
矩阵维度为 8x8，覆盖所有支持的几何类型组合，部分组合复用通用GJK-EPA检测器。

## Constructors

### Constructor

> **new CollisionMatrix**(): `CollisionMatrix`

Defined in: [collision-detector/collision-matrix.ts:30](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/collision-matrix.ts#L30)

碰撞矩阵构造函数。
初始化时自动调用私有方法_init()，完成检测器矩阵的初始化，
预先填充所有几何类型组合对应的检测器实例，确保后续可直接获取使用。

#### Returns

`CollisionMatrix`

## Properties

### detectors

> **detectors**: [`Detector`](../../detector/classes/Detector.md)\<[`Geometry`](../../../shape/geometry/classes/Geometry.md), [`Geometry`](../../../shape/geometry/classes/Geometry.md)\>[][] = `[]`

Defined in: [collision-detector/collision-matrix.ts:23](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/collision-matrix.ts#L23)

碰撞检测器二维矩阵。
行/列索引对应几何类型（GEOMETRY_TYPE）转换后的数值，
每个元素存储对应几何类型组合的碰撞检测器实例，初始化时填充所有支持的检测器组合。

## Methods

### getDetector()

> **getDetector**(`geomType1`, `geomType2`): [`Detector`](../../detector/classes/Detector.md)

Defined in: [collision-detector/collision-matrix.ts:44](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/collision-matrix.ts#L44)

获取指定几何类型组合的碰撞检测器。
核心逻辑：
1. 将GEOMETRY_TYPE枚举值转换为矩阵索引（减去NULL类型偏移并修正）；
2. 从二维矩阵中获取对应位置的检测器实例；
注意：索引转换确保枚举值与矩阵索引一一对应，避免越界。

#### Parameters

##### geomType1

[`GEOMETRY_TYPE`](../../../constant/enumerations/GEOMETRY_TYPE.md)

第一个几何形状的类型（如球体、盒子、胶囊体等）

##### geomType2

[`GEOMETRY_TYPE`](../../../constant/enumerations/GEOMETRY_TYPE.md)

第二个几何形状的类型

#### Returns

[`Detector`](../../detector/classes/Detector.md)

匹配的碰撞检测器实例
