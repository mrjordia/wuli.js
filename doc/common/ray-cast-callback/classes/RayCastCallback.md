[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [common/ray-cast-callback](../README.md) / RayCastCallback

# Abstract Class: RayCastCallback

Defined in: [common/ray-cast-callback.ts:9](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/ray-cast-callback.ts#L9)

射线检测回调抽象类。
物理引擎射线检测的核心回调接口，定义射线与形状相交后的自定义处理逻辑；
需由业务层实现具体的process方法，支持处理单次/多次射线相交结果。

## Extended by

- [`RayCastClosest`](../../ray-cast-closest/classes/RayCastClosest.md)

## Constructors

### Constructor

> **new RayCastCallback**(): `RayCastCallback`

#### Returns

`RayCastCallback`

## Methods

### process()

> `abstract` **process**(`shape`, `hit?`): `void`

Defined in: [common/ray-cast-callback.ts:21](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/ray-cast-callback.ts#L21)

射线相交处理抽象方法（必须实现）。
核心用途：
1. 单次射线检测：处理首个相交的形状（如射线拾取物体）；
2. 多次射线检测：遍历所有相交形状并按需过滤（如射线穿透多个物体）；
注意：hit参数为可选，未命中时可能为undefined，实现时需做空值判断。

#### Parameters

##### shape

[`Shape`](../../../shape/shape/classes/Shape.md)

与射线相交的形状实例（如球体、地形、凸包等）

##### hit?

[`RayCastHit`](../../../shape/ray-cast-hit/classes/RayCastHit.md)

可选，射线相交详情（包含相交点、法向量、命中比例等）

#### Returns

`void`
