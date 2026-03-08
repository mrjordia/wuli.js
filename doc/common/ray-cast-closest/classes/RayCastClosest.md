[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [common/ray-cast-closest](../README.md) / RayCastClosest

# Class: RayCastClosest

Defined in: [common/ray-cast-closest.ts:12](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/common/ray-cast-closest.ts#L12)

射线检测最近命中回调类。
继承射线检测回调接口，专门用于筛选射线检测中**最近的相交形状**；
自动对比所有相交形状的命中比例（fraction），仅保留距离射线起点最近的命中结果。

## Extends

- [`RayCastCallback`](../../ray-cast-callback/classes/RayCastCallback.md)

## Constructors

### Constructor

> **new RayCastClosest**(): `RayCastClosest`

#### Returns

`RayCastClosest`

#### Inherited from

[`RayCastCallback`](../../ray-cast-callback/classes/RayCastCallback.md).[`constructor`](../../ray-cast-callback/classes/RayCastCallback.md#constructor)

## Properties

### fraction

> **fraction**: `number` = `1`

Defined in: [common/ray-cast-closest.ts:20](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/common/ray-cast-closest.ts#L20)

最近命中的比例（0~1，0=射线起点，1=射线终点；初始为1表示未命中）

***

### hit

> **hit**: `boolean` = `false`

Defined in: [common/ray-cast-closest.ts:22](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/common/ray-cast-closest.ts#L22)

是否命中任意形状（true=有命中，false=无命中）

***

### normal

> **normal**: [`Vec3`](../../vec3/classes/Vec3.md)

Defined in: [common/ray-cast-closest.ts:16](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/common/ray-cast-closest.ts#L16)

最近命中点的法向量（初始为(0,0,0)）

***

### position

> **position**: [`Vec3`](../../vec3/classes/Vec3.md)

Defined in: [common/ray-cast-closest.ts:14](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/common/ray-cast-closest.ts#L14)

最近命中点的世界坐标（初始为(0,0,0)）

***

### shape

> **shape**: [`Nullable`](../../nullable/type-aliases/Nullable.md)\<[`Shape`](../../../shape/shape/classes/Shape.md)\>

Defined in: [common/ray-cast-closest.ts:18](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/common/ray-cast-closest.ts#L18)

最近命中的形状实例（未命中时为null）

## Methods

### clear()

> **clear**(): `void`

Defined in: [common/ray-cast-closest.ts:29](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/common/ray-cast-closest.ts#L29)

重置所有命中状态（复用实例前调用）。
清空形状引用、重置命中比例为1、归零位置/法向量、标记未命中；
避免残留上一次检测结果，保证每次检测的独立性。

#### Returns

`void`

***

### process()

> **process**(`shape`, `hit`): `void`

Defined in: [common/ray-cast-closest.ts:50](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/common/ray-cast-closest.ts#L50)

处理单次射线相交结果（核心筛选逻辑）。
核心逻辑：
1. 对比本次命中比例与已保存的最近比例（fraction）；
2. 若本次更近（fraction更小），则更新最近命中状态（形状、位置、法向量、比例）；
3. 标记hit为true，表示至少命中一个形状；
注意：该方法会被射线检测逻辑多次调用（每相交一个形状调用一次）。

#### Parameters

##### shape

[`Shape`](../../../shape/shape/classes/Shape.md)

当前相交的形状实例

##### hit

[`RayCastHit`](../../../shape/ray-cast-hit/classes/RayCastHit.md)

本次相交的详细信息（包含命中比例、位置、法向量）

#### Returns

`void`

#### Overrides

[`RayCastCallback`](../../ray-cast-callback/classes/RayCastCallback.md).[`process`](../../ray-cast-callback/classes/RayCastCallback.md#process)
