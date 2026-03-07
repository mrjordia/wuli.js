[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [common/ray-cast-wrapper](../README.md) / RayCastWrapper

# Class: RayCastWrapper

Defined in: [common/ray-cast-wrapper.ts:12](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/ray-cast-wrapper.ts#L12)

射线检测宽相位回调包装类。
物理引擎宽相位阶段的射线检测封装，遍历宽相位筛选出的物理代理，
对每个代理内的形状执行高精度射线相交检测，并触发自定义回调处理命中结果。

## Extends

- [`BroadPhaseProxyCallback`](../../../broad-phase/broad-phase-proxy-callback/classes/BroadPhaseProxyCallback.md)

## Constructors

### Constructor

> **new RayCastWrapper**(): `RayCastWrapper`

#### Returns

`RayCastWrapper`

#### Inherited from

[`BroadPhaseProxyCallback`](../../../broad-phase/broad-phase-proxy-callback/classes/BroadPhaseProxyCallback.md).[`constructor`](../../../broad-phase/broad-phase-proxy-callback/classes/BroadPhaseProxyCallback.md#constructor)

## Properties

### begin

> **begin**: [`Vec3`](../../vec3/classes/Vec3.md)

Defined in: [common/ray-cast-wrapper.ts:16](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/ray-cast-wrapper.ts#L16)

射线起点坐标（世界坐标系）

***

### callback?

> `optional` **callback**: [`RayCastCallback`](../../ray-cast-callback/classes/RayCastCallback.md)

Defined in: [common/ray-cast-wrapper.ts:20](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/ray-cast-wrapper.ts#L20)

射线命中后的自定义回调（可选，未设置时不执行后续处理）

***

### end

> **end**: [`Vec3`](../../vec3/classes/Vec3.md)

Defined in: [common/ray-cast-wrapper.ts:18](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/ray-cast-wrapper.ts#L18)

射线终点坐标（世界坐标系）

***

### rayCastHit

> **rayCastHit**: [`RayCastHit`](../../../shape/ray-cast-hit/classes/RayCastHit.md)

Defined in: [common/ray-cast-wrapper.ts:14](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/ray-cast-wrapper.ts#L14)

射线检测命中结果容器（复用该实例避免频繁创建）

## Methods

### process()

> **process**(`proxy`): `void`

Defined in: [common/ray-cast-wrapper.ts:32](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/ray-cast-wrapper.ts#L32)

处理单个物理代理的射线检测。
核心逻辑：
1. 从代理中获取形状实例（假设proxy.userData为非空Shape）；
2. 调用形状几何体的高精度射线检测方法（rayCast）；
3. 检测命中时触发自定义回调，传递形状和命中详情；
注意：需提前设置begin/end射线起止点，否则检测结果无效。

#### Parameters

##### proxy

[`PhysicsProxy`](../../../broad-phase/physics-proxy/classes/PhysicsProxy.md)

宽相位筛选出的物理代理实例

#### Returns

`void`

#### Overrides

[`BroadPhaseProxyCallback`](../../../broad-phase/broad-phase-proxy-callback/classes/BroadPhaseProxyCallback.md).[`process`](../../../broad-phase/broad-phase-proxy-callback/classes/BroadPhaseProxyCallback.md#process)
