[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [broad-phase/brute-force-broad-phase](../README.md) / BruteForceBroadPhase

# Class: BruteForceBroadPhase

Defined in: [broad-phase/brute-force-broad-phase.ts:26](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/broad-phase/brute-force-broad-phase.ts#L26)

暴力遍历型粗检测实现类。
物理引擎中最简单的粗检测（BroadPhase）实现，核心特性：
1. 基于暴力双重循环遍历所有物理代理对，判断AABB是否重叠；
2. 实现逻辑简单、无空间分区优化，适用于代理数量较少（<100）的场景；
3. 不支持增量检测（强制关闭incremental），每帧全量检测所有代理对；
性能特点：
- 优点：实现成本低、无额外空间开销、逻辑易调试；
- 缺点：时间复杂度O(n²)，代理数量增多时性能急剧下降；
主要应用场景：小型物理场景、测试/调试环境、简单demo验证。

## Extends

- [`BroadPhase`](../../broad-phase/classes/BroadPhase.md)

## Constructors

### Constructor

> **new BruteForceBroadPhase**(): `BruteForceBroadPhase`

Defined in: [broad-phase/brute-force-broad-phase.ts:34](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/broad-phase/brute-force-broad-phase.ts#L34)

构造函数：初始化暴力粗检测实例。
核心初始化逻辑：
1. 调用父类构造函数，指定粗检测类型为BRUTE_FORCE；
2. 强制关闭增量检测（incremental=false），因暴力检测无增量优化逻辑；
3. 继承父类预初始化的临时对象（identity、zero、raycastHit等）。

#### Returns

`BruteForceBroadPhase`

#### Overrides

[`BroadPhase`](../../broad-phase/classes/BroadPhase.md).[`constructor`](../../broad-phase/classes/BroadPhase.md#constructor)

## Properties

### identity

> **identity**: [`Transform`](../../../common/transform/classes/Transform.md)

Defined in: [broad-phase/broad-phase.ts:75](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/broad-phase/broad-phase.ts#L75)

单位变换矩阵。
预初始化的单位Transform实例（无平移、无旋转）；
用于不需要变换的几何检测场景，避免频繁创建单位矩阵。

#### Inherited from

[`BroadPhase`](../../broad-phase/classes/BroadPhase.md).[`identity`](../../broad-phase/classes/BroadPhase.md#identity)

***

### incremental

> **incremental**: `boolean` = `false`

Defined in: [broad-phase/broad-phase.ts:61](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/broad-phase/broad-phase.ts#L61)

增量检测开关。
是否启用增量式粗检测；
增量检测仅处理位置变化的代理，减少不必要的计算，初始值为false。

#### Inherited from

[`BroadPhase`](../../broad-phase/classes/BroadPhase.md).[`incremental`](../../broad-phase/classes/BroadPhase.md#incremental)

***

### proxyPairList

> **proxyPairList**: [`Nullable`](../../../common/nullable/type-aliases/Nullable.md)\<[`ProxyPair`](../../proxy-pair/classes/ProxyPair.md)\>

Defined in: [broad-phase/broad-phase.ts:54](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/broad-phase/broad-phase.ts#L54)

碰撞对链表头节点。
指向当前帧检测出的候选碰撞对链表的第一个节点；
collectPairs方法会更新该链表，用于后续细检测阶段处理。

#### Inherited from

[`BroadPhase`](../../broad-phase/classes/BroadPhase.md).[`proxyPairList`](../../broad-phase/classes/BroadPhase.md#proxypairlist)

***

### raycastHit

> **raycastHit**: [`RayCastHit`](../../../shape/ray-cast-hit/classes/RayCastHit.md)

Defined in: [broad-phase/broad-phase.ts:89](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/broad-phase/broad-phase.ts#L89)

射线检测命中结果。
预初始化的RayCastHit实例，用于存储射线检测的命中数据；
如命中点、法向量、命中比例等，避免频繁创建实例。

#### Inherited from

[`BroadPhase`](../../broad-phase/classes/BroadPhase.md).[`raycastHit`](../../broad-phase/classes/BroadPhase.md#raycasthit)

***

### testCount

> **testCount**: `number` = `0`

Defined in: [broad-phase/broad-phase.ts:68](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/broad-phase/broad-phase.ts#L68)

检测计数。
统计当前帧粗检测的碰撞对测试次数；
用于性能分析与调优，每帧检测完成后可重置。

#### Inherited from

[`BroadPhase`](../../broad-phase/classes/BroadPhase.md).[`testCount`](../../broad-phase/classes/BroadPhase.md#testcount)

***

### type

> `readonly` **type**: [`BROAD_PHASE_TYPE`](../../../constant/enumerations/BROAD_PHASE_TYPE.md)

Defined in: [broad-phase/broad-phase.ts:47](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/broad-phase/broad-phase.ts#L47)

粗检测类型标识。
标记当前粗检测实例的具体类型（如网格型、扫描型等）；
由构造函数初始化，只读属性，不可运行时修改。

#### Inherited from

[`BroadPhase`](../../broad-phase/classes/BroadPhase.md).[`type`](../../broad-phase/classes/BroadPhase.md#type)

***

### zero

> **zero**: [`Vec3`](../../../common/vec3/classes/Vec3.md)

Defined in: [broad-phase/broad-phase.ts:82](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/broad-phase/broad-phase.ts#L82)

零向量。
预初始化的零向量（x=0,y=0,z=0）；
用于位移、方向等参数的默认值场景，提升代码复用性。

#### Inherited from

[`BroadPhase`](../../broad-phase/classes/BroadPhase.md).[`zero`](../../broad-phase/classes/BroadPhase.md#zero)

## Methods

### aabbTest()

> **aabbTest**(`aabb`, `callback`): `void`

Defined in: [broad-phase/brute-force-broad-phase.ts:211](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/broad-phase/brute-force-broad-phase.ts#L211)

AABB测试。
实现父类抽象方法，核心逻辑：
1. 遍历所有物理代理，获取测试AABB的数组数据；
2. 调用Method.boxIntersectsBox判断测试AABB与代理AABB是否相交；
3. 相交则调用callback.process，传入代理执行自定义处理；
应用场景：区域内形状检索、碰撞体范围查询等。

#### Parameters

##### aabb

[`Aabb`](../../../common/aabb/classes/Aabb.md)

待测试的AABB包围盒

##### callback

[`AabbTestWrapper`](../../../common/aabb-test-wrapper/classes/AabbTestWrapper.md)

AABB测试回调函数

#### Returns

`void`

#### Overrides

[`BroadPhase`](../../broad-phase/classes/BroadPhase.md).[`aabbTest`](../../broad-phase/classes/BroadPhase.md#aabbtest)

***

### collectPairs()

> **collectPairs**(): `void`

Defined in: [broad-phase/brute-force-broad-phase.ts:113](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/broad-phase/brute-force-broad-phase.ts#L113)

收集候选碰撞对。
实现父类抽象方法，核心逻辑（暴力双重循环）：
1. 清理上一帧的碰撞对链表，将ProxyPair回收至对象池；
2. 重置检测计数（testCount），准备全量检测；
3. 外层循环遍历每个代理p1，内层循环遍历p1之后的所有代理p2；
4. 对每对(p1,p2)：
   - 递增testCount，记录检测次数；
   - 调用Method.boxIntersectsBox判断AABB是否重叠；
   - 重叠则从对象池获取ProxyPair，填充proxy1/proxy2并加入链表；
性能说明：双重循环遍历n个代理时，共执行n*(n-1)/2次AABB检测。

#### Returns

`void`

#### Overrides

[`BroadPhase`](../../broad-phase/classes/BroadPhase.md).[`collectPairs`](../../broad-phase/classes/BroadPhase.md#collectpairs)

***

### convexCast()

> **convexCast**(`convex`, `begin`, `translation`, `callback`): `void`

Defined in: [broad-phase/brute-force-broad-phase.ts:184](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/broad-phase/brute-force-broad-phase.ts#L184)

凸体扫掠检测。
实现父类抽象方法，核心逻辑：
1. 遍历所有物理代理，初始化代理的AABB数据到临时_aabb对象；
2. 调用_convexSweep.init初始化凸体扫掠的几何数据；
3. 使用GJK-EPA算法判断凸体扫掠路径与代理AABB是否相交；
4. 相交（distance<=0）则调用callback.process，传入代理执行细检测；
注意：GJK-EPA为细检测算法，此处仅用于粗检测阶段的快速筛选。

#### Parameters

##### convex

[`ConvexGeometry`](../../../shape/convex-geometry/classes/ConvexGeometry.md)

待扫掠的凸体几何

##### begin

[`Transform`](../../../common/transform/classes/Transform.md)

凸体的初始变换（位置/旋转）

##### translation

[`Vec3`](../../../common/vec3/classes/Vec3.md)

凸体的扫掠位移向量

##### callback

[`ConvexCastWrapper`](../../../common/convex-cast-wrapper/classes/ConvexCastWrapper.md)

扫掠检测回调函数

#### Returns

`void`

#### Overrides

[`BroadPhase`](../../broad-phase/classes/BroadPhase.md).[`convexCast`](../../broad-phase/classes/BroadPhase.md#convexcast)

***

### createProxy()

> **createProxy**(`userData`, `aabb`): [`PhysicsProxy`](../../physics-proxy/classes/PhysicsProxy.md)

Defined in: [broad-phase/brute-force-broad-phase.ts:49](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/broad-phase/brute-force-broad-phase.ts#L49)

创建物理代理。
实现父类抽象方法，核心逻辑：
1. 为Shape分配唯一ID，创建PhysicsProxy实例；
2. 调用父类setProxyList方法，将代理加入链表并初始化AABB数据；
3. 递增代理数量（_numProxies），返回新创建的代理实例。

#### Parameters

##### userData

[`Shape`](../../../shape/shape/classes/Shape.md)

关联的物理形状实例

##### aabb

[`Aabb`](../../../common/aabb/classes/Aabb.md)

形状的AABB包围盒

#### Returns

[`PhysicsProxy`](../../physics-proxy/classes/PhysicsProxy.md)

- 创建并注册的物理代理实例

#### Overrides

[`BroadPhase`](../../broad-phase/classes/BroadPhase.md).[`createProxy`](../../broad-phase/classes/BroadPhase.md#createproxy)

***

### destroyProxy()

> **destroyProxy**(`proxy`): `void`

Defined in: [broad-phase/brute-force-broad-phase.ts:64](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/broad-phase/brute-force-broad-phase.ts#L64)

销毁物理代理。
实现父类抽象方法，核心逻辑：
1. 递减代理数量（_numProxies）；
2. 维护双向链表指针：更新前驱/后继节点的prev/next，处理头/尾节点边界；
3. 清理代理的关联数据（prev/next置空、userData置空），避免内存泄漏。

#### Parameters

##### proxy

[`PhysicsProxy`](../../physics-proxy/classes/PhysicsProxy.md)

待销毁的物理代理实例

#### Returns

`void`

#### Overrides

[`BroadPhase`](../../broad-phase/classes/BroadPhase.md).[`destroyProxy`](../../broad-phase/classes/BroadPhase.md#destroyproxy)

***

### isOverlapping()

> **isOverlapping**(`proxy1`, `proxy2`): `boolean`

Defined in: [broad-phase/broad-phase.ts:150](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/broad-phase/broad-phase.ts#L150)

判断两个代理的AABB是否重叠。
通用的AABB重叠判断实现：
1. 获取两个代理的AABB数据（size数组）；
2. 调用Method.boxIntersectsBox方法判断AABB是否相交；
该方法为所有粗检测子类提供统一的重叠判断逻辑。

#### Parameters

##### proxy1

[`PhysicsProxy`](../../physics-proxy/classes/PhysicsProxy.md)

第一个物理代理

##### proxy2

[`PhysicsProxy`](../../physics-proxy/classes/PhysicsProxy.md)

第二个物理代理

#### Returns

`boolean`

- 重叠结果：true=AABB相交，false=AABB分离

#### Inherited from

[`BroadPhase`](../../broad-phase/classes/BroadPhase.md).[`isOverlapping`](../../broad-phase/classes/BroadPhase.md#isoverlapping)

***

### moveProxy()

> **moveProxy**(`proxy`, `aabb`, `displacement`): `void`

Defined in: [broad-phase/brute-force-broad-phase.ts:96](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/broad-phase/brute-force-broad-phase.ts#L96)

移动物理代理。
实现父类抽象方法，核心逻辑：
1. 直接复制新AABB数据到代理的size数组，更新代理的AABB边界；
2. 暴力检测无空间分区优化，无需处理位移相关的分区更新；
注意：displacement参数仅为兼容父类接口，实际未使用。

#### Parameters

##### proxy

[`PhysicsProxy`](../../physics-proxy/classes/PhysicsProxy.md)

待移动的物理代理实例

##### aabb

[`Aabb`](../../../common/aabb/classes/Aabb.md)

代理新的AABB包围盒

##### displacement

[`Vec3`](../../../common/vec3/classes/Vec3.md)

代理的位移向量（暴力检测中未使用）

#### Returns

`void`

#### Overrides

[`BroadPhase`](../../broad-phase/classes/BroadPhase.md).[`moveProxy`](../../broad-phase/classes/BroadPhase.md#moveproxy)

***

### rayCast()

> **rayCast**(`begin`, `end`, `callback`): `void`

Defined in: [broad-phase/brute-force-broad-phase.ts:156](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/broad-phase/brute-force-broad-phase.ts#L156)

射线检测。
实现父类抽象方法，核心逻辑：
1. 遍历所有物理代理，获取射线起点/终点的数组数据；
2. 调用父类raycastTest方法，判断射线与代理AABB是否相交；
3. 相交则调用callback.process，将代理传入回调执行细检测；
注意：暴力检测无射线空间筛选，需遍历所有代理。

#### Parameters

##### begin

[`Vec3`](../../../common/vec3/classes/Vec3.md)

射线起点

##### end

[`Vec3`](../../../common/vec3/classes/Vec3.md)

射线终点

##### callback

[`RayCastWrapper`](../../../common/ray-cast-wrapper/classes/RayCastWrapper.md)

射线检测回调函数

#### Returns

`void`

#### Overrides

[`BroadPhase`](../../broad-phase/classes/BroadPhase.md).[`rayCast`](../../broad-phase/classes/BroadPhase.md#raycast)
