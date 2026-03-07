[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [broad-phase/broad-phase-proxy-callback](../README.md) / BroadPhaseProxyCallback

# Abstract Class: BroadPhaseProxyCallback

Defined in: [broad-phase/broad-phase-proxy-callback.ts:14](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/broad-phase/broad-phase-proxy-callback.ts#L14)

粗检测代理回调抽象类。
物理引擎中粗检测（BroadPhase）阶段的代理遍历回调抽象类；
核心作用：
1. 定义粗检测空间查询（如AABB测试、射线检测）的代理处理回调接口；
2. 解耦粗检测的遍历逻辑与代理的具体处理逻辑，支持灵活的业务扩展；
主要应用场景：
- AABBTest：遍历与目标AABB相交的代理时，通过回调处理命中的代理；
- RayCast/ConvexCast：遍历射线/凸体扫掠命中的代理时，执行自定义处理；
- 批量代理遍历：如统计区域内代理数量、筛选特定类型的形状等。

## Extended by

- [`AabbTestWrapper`](../../../common/aabb-test-wrapper/classes/AabbTestWrapper.md)
- [`ConvexCastWrapper`](../../../common/convex-cast-wrapper/classes/ConvexCastWrapper.md)
- [`RayCastWrapper`](../../../common/ray-cast-wrapper/classes/RayCastWrapper.md)

## Constructors

### Constructor

> **new BroadPhaseProxyCallback**(): `BroadPhaseProxyCallback`

#### Returns

`BroadPhaseProxyCallback`

## Methods

### process()

> `abstract` **process**(`proxy`): `void`

Defined in: [broad-phase/broad-phase-proxy-callback.ts:25](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/broad-phase/broad-phase-proxy-callback.ts#L25)

代理处理抽象方法。
子类需实现该方法，定义对命中代理的具体处理逻辑：
1. 可获取代理关联的Shape对象（proxy.userData），执行细检测、数据统计等操作；
2. 支持中断遍历（如通过返回值/内部状态控制，需子类扩展）；
3. 典型实现：射线检测中调用细检测判断射线与形状是否真正相交，返回命中结果。

#### Parameters

##### proxy

[`PhysicsProxy`](../../physics-proxy/classes/PhysicsProxy.md)

待处理的物理代理实例

#### Returns

`void`
