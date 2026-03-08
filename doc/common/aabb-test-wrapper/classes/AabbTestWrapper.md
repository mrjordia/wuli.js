[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [common/aabb-test-wrapper](../README.md) / AabbTestWrapper

# Class: AabbTestWrapper

Defined in: [common/aabb-test-wrapper.ts:11](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/common/aabb-test-wrapper.ts#L11)

AABB检测回调包装类。
宽相位碰撞检测中，用于筛选与目标AABB相交的物理代理（PhysicsProxy），
核心逻辑是逐一代理检测AABB重叠，并触发自定义回调处理相交的形状。

## Extends

- [`BroadPhaseProxyCallback`](../../../broad-phase/broad-phase-proxy-callback/classes/BroadPhaseProxyCallback.md)

## Constructors

### Constructor

> **new AabbTestWrapper**(): `AabbTestWrapper`

#### Returns

`AabbTestWrapper`

#### Inherited from

[`BroadPhaseProxyCallback`](../../../broad-phase/broad-phase-proxy-callback/classes/BroadPhaseProxyCallback.md).[`constructor`](../../../broad-phase/broad-phase-proxy-callback/classes/BroadPhaseProxyCallback.md#constructor)

## Properties

### aabb

> **aabb**: [`Aabb`](../../aabb/classes/Aabb.md)

Defined in: [common/aabb-test-wrapper.ts:16](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/common/aabb-test-wrapper.ts#L16)

目标检测AABB（待检测相交的轴对齐包围盒）。
初始化为空AABB，需在检测前设置具体的min/max值（elements[0-5]对应xmin/ymin/zmin/xmax/ymax/zmax）。

***

### callback?

> `optional` **callback**: [`AabbTestCallback`](../../aabb-test-callback/classes/AabbTestCallback.md)

Defined in: [common/aabb-test-wrapper.ts:23](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/common/aabb-test-wrapper.ts#L23)

AABB相交后的自定义回调函数。
检测到代理AABB与目标AABB相交时触发，用于处理相交的形状（如收集结果、过滤逻辑）；
未设置时不会执行任何后续处理。

## Methods

### process()

> **process**(`proxy`): `void`

Defined in: [common/aabb-test-wrapper.ts:35](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/common/aabb-test-wrapper.ts#L35)

处理单个物理代理的AABB相交检测。
核心逻辑：
1. 从代理中获取形状的AABB数据；
2. 采用轴分离定理（SAT）检测两个AABB是否重叠（6个轴方向均不分离则相交）；
3. 相交时调用自定义callback处理该形状；
注意：假设proxy.userData为非空的形状实例，需保证代理数据合法性。

#### Parameters

##### proxy

[`PhysicsProxy`](../../../broad-phase/physics-proxy/classes/PhysicsProxy.md)

待检测的物理代理（包含形状的AABB和用户数据）

#### Returns

`void`

#### Overrides

[`BroadPhaseProxyCallback`](../../../broad-phase/broad-phase-proxy-callback/classes/BroadPhaseProxyCallback.md).[`process`](../../../broad-phase/broad-phase-proxy-callback/classes/BroadPhaseProxyCallback.md#process)
