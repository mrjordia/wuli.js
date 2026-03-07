[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [common/convex-cast-wrapper](../README.md) / ConvexCastWrapper

# Class: ConvexCastWrapper

Defined in: [common/convex-cast-wrapper.ts:16](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/convex-cast-wrapper.ts#L16)

凸体扫略检测回调包装类。
宽相位碰撞检测中，用于执行凸几何体的扫略检测（模拟凸体沿指定路径移动的碰撞检测），
基于GJK-EPA算法实现高精度凸体相交检测，仅处理球体/胶囊体/凸包等凸几何体类型。

## Extends

- [`BroadPhaseProxyCallback`](../../../broad-phase/broad-phase-proxy-callback/classes/BroadPhaseProxyCallback.md)

## Constructors

### Constructor

> **new ConvexCastWrapper**(): `ConvexCastWrapper`

#### Returns

`ConvexCastWrapper`

#### Inherited from

[`BroadPhaseProxyCallback`](../../../broad-phase/broad-phase-proxy-callback/classes/BroadPhaseProxyCallback.md).[`constructor`](../../../broad-phase/broad-phase-proxy-callback/classes/BroadPhaseProxyCallback.md#constructor)

## Properties

### begin

> **begin**: [`Transform`](../../transform/classes/Transform.md)

Defined in: [common/convex-cast-wrapper.ts:28](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/convex-cast-wrapper.ts#L28)

凸体初始变换（位置+旋转）。
待扫略的凸体的起始变换矩阵，定义扫略的初始位置和朝向。

***

### callback?

> `optional` **callback**: [`RayCastCallback`](../../ray-cast-callback/classes/RayCastCallback.md)

Defined in: [common/convex-cast-wrapper.ts:47](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/convex-cast-wrapper.ts#L47)

扫略检测命中后的自定义回调。
检测到凸体相交时触发，用于处理命中逻辑（如停止移动、播放碰撞效果）；
未设置时不会执行任何后续处理。

***

### convex?

> `optional` **convex**: [`ConvexGeometry`](../../../shape/convex-geometry/classes/ConvexGeometry.md)

Defined in: [common/convex-cast-wrapper.ts:53](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/convex-cast-wrapper.ts#L53)

待扫略的凸几何体（必选）。
需检测的凸体（如球体、胶囊体、凸包），检测前必须赋值，否则会触发空值错误。

***

### rayCastHit

> **rayCastHit**: [`RayCastHit`](../../../shape/ray-cast-hit/classes/RayCastHit.md)

Defined in: [common/convex-cast-wrapper.ts:22](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/convex-cast-wrapper.ts#L22)

凸体扫略检测的命中结果。
存储扫略检测的相交点、法向量、命中比例等核心结果；
检测成功时会更新该对象的属性，供回调函数使用。

***

### translation

> **translation**: [`Vec3`](../../vec3/classes/Vec3.md)

Defined in: [common/convex-cast-wrapper.ts:34](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/convex-cast-wrapper.ts#L34)

凸体扫略的平移向量。
凸体沿该向量方向移动（扫略路径），决定扫略的方向和距离。

***

### zero

> **zero**: [`Vec3`](../../vec3/classes/Vec3.md)

Defined in: [common/convex-cast-wrapper.ts:40](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/convex-cast-wrapper.ts#L40)

零向量（优化性能，避免重复创建）。
固定为(0,0,0)的向量，作为GJK-EPA算法的默认入参，减少内存分配。

## Methods

### process()

> **process**(`proxy`): `void`

Defined in: [common/convex-cast-wrapper.ts:65](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/convex-cast-wrapper.ts#L65)

处理单个物理代理的凸体扫略检测。
核心逻辑：
1. 过滤非凸几何体（仅处理球体/胶囊体/凸包类型）；
2. 调用GJK-EPA算法执行凸体扫略检测；
3. 检测成功时触发自定义回调，传递形状和命中结果；
注意：假设proxy.userData为非空的形状实例，且convex已提前赋值。

#### Parameters

##### proxy

[`PhysicsProxy`](../../../broad-phase/physics-proxy/classes/PhysicsProxy.md)

待检测的物理代理（包含凸几何体的形状数据）

#### Returns

`void`

#### Overrides

[`BroadPhaseProxyCallback`](../../../broad-phase/broad-phase-proxy-callback/classes/BroadPhaseProxyCallback.md).[`process`](../../../broad-phase/broad-phase-proxy-callback/classes/BroadPhaseProxyCallback.md#process)
