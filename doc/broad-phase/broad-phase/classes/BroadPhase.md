[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [broad-phase/broad-phase](../README.md) / BroadPhase

# Abstract Class: BroadPhase

Defined in: [broad-phase/broad-phase.ts:30](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/broad-phase.ts#L30)

粗检测抽象基类。
物理引擎中碰撞粗检测的核心抽象类，定义粗检测的通用接口与基础能力；
粗检测是物理碰撞检测的第一阶段，核心目标：
1. 快速筛选出可能发生碰撞的形状对（ProxyPair），排除大量无碰撞可能的形状；
2. 为细检测（Narrowphase）提供候选碰撞对，大幅降低细检测的计算开销；
3. 支持射线检测、凸体扫掠检测、AABB测试等通用空间查询能力；
主要特性：
- 管理PhysicsProxy实例的生命周期（创建/销毁/移动）；
- 维护代理链表、碰撞对链表、碰撞对对象池，优化内存与性能；
- 定义抽象接口，由具体实现类（如GridBroadphase、SAPBroadphase）实现不同粗检测算法。

## Extended by

- [`BruteForceBroadPhase`](../../brute-force-broad-phase/classes/BruteForceBroadPhase.md)
- [`BvhBroadPhase`](../../bvh-broad-phase/bvh-broad-phase/classes/BvhBroadPhase.md)

## Constructors

### Constructor

> **new BroadPhase**(`type`): `BroadPhase`

Defined in: [broad-phase/broad-phase.ts:100](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/broad-phase.ts#L100)

构造函数：初始化粗检测抽象类。
核心初始化逻辑：
1. 初始化粗检测类型（只读属性）；
2. 预创建常用的临时对象（identity变换、zero向量、raycastHit等）；
3. 初始化内部缓存（_bv0、_tb）和对象池（_proxyPairPool）；
注意：抽象类不可直接实例化，需由子类实现抽象方法后使用。

#### Parameters

##### type

[`BROAD_PHASE_TYPE`](../../../constant/enumerations/BROAD_PHASE_TYPE.md)

粗检测类型标识

#### Returns

`BroadPhase`

## Properties

### identity

> **identity**: [`Transform`](../../../common/transform/classes/Transform.md)

Defined in: [broad-phase/broad-phase.ts:75](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/broad-phase.ts#L75)

单位变换矩阵。
预初始化的单位Transform实例（无平移、无旋转）；
用于不需要变换的几何检测场景，避免频繁创建单位矩阵。

***

### incremental

> **incremental**: `boolean` = `false`

Defined in: [broad-phase/broad-phase.ts:61](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/broad-phase.ts#L61)

增量检测开关。
是否启用增量式粗检测；
增量检测仅处理位置变化的代理，减少不必要的计算，初始值为false。

***

### proxyPairList

> **proxyPairList**: [`Nullable`](../../../common/nullable/type-aliases/Nullable.md)\<[`ProxyPair`](../../proxy-pair/classes/ProxyPair.md)\>

Defined in: [broad-phase/broad-phase.ts:54](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/broad-phase.ts#L54)

碰撞对链表头节点。
指向当前帧检测出的候选碰撞对链表的第一个节点；
collectPairs方法会更新该链表，用于后续细检测阶段处理。

***

### raycastHit

> **raycastHit**: [`RayCastHit`](../../../shape/ray-cast-hit/classes/RayCastHit.md)

Defined in: [broad-phase/broad-phase.ts:89](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/broad-phase.ts#L89)

射线检测命中结果。
预初始化的RayCastHit实例，用于存储射线检测的命中数据；
如命中点、法向量、命中比例等，避免频繁创建实例。

***

### testCount

> **testCount**: `number` = `0`

Defined in: [broad-phase/broad-phase.ts:68](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/broad-phase.ts#L68)

检测计数。
统计当前帧粗检测的碰撞对测试次数；
用于性能分析与调优，每帧检测完成后可重置。

***

### type

> `readonly` **type**: [`BROAD_PHASE_TYPE`](../../../constant/enumerations/BROAD_PHASE_TYPE.md)

Defined in: [broad-phase/broad-phase.ts:47](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/broad-phase.ts#L47)

粗检测类型标识。
标记当前粗检测实例的具体类型（如网格型、扫描型等）；
由构造函数初始化，只读属性，不可运行时修改。

***

### zero

> **zero**: [`Vec3`](../../../common/vec3/classes/Vec3.md)

Defined in: [broad-phase/broad-phase.ts:82](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/broad-phase.ts#L82)

零向量。
预初始化的零向量（x=0,y=0,z=0）；
用于位移、方向等参数的默认值场景，提升代码复用性。

## Methods

### aabbTest()

> `abstract` **aabbTest**(`aabb`, `callback`): `void`

Defined in: [broad-phase/broad-phase.ts:202](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/broad-phase.ts#L202)

AABB测试抽象方法。
子类需实现该方法，筛选出与指定AABB相交的代理：
1. 遍历代理链表，判断代理AABB与测试AABB是否相交；
2. 对相交的代理，通过callback回调返回结果；
常用于空间查询、区域内形状检索等场景。

#### Parameters

##### aabb

[`Aabb`](../../../common/aabb/classes/Aabb.md)

待测试的AABB包围盒

##### callback

[`AabbTestWrapper`](../../../common/aabb-test-wrapper/classes/AabbTestWrapper.md)

AABB测试回调函数

#### Returns

`void`

***

### collectPairs()

> `abstract` **collectPairs**(): `void`

Defined in: [broad-phase/broad-phase.ts:163](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/broad-phase.ts#L163)

收集碰撞对抽象方法。
子类需实现该方法，筛选出所有候选碰撞对：
1. 遍历所有物理代理，通过AABB重叠判断筛选可能碰撞的代理对；
2. 从_proxyPairPool获取ProxyPair实例，填充proxy1/proxy2；
3. 将碰撞对加入proxyPairList链表，更新testCount计数。

#### Returns

`void`

***

### convexCast()

> `abstract` **convexCast**(`convex`, `begin`, `translation`, `callback`): `void`

Defined in: [broad-phase/broad-phase.ts:190](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/broad-phase.ts#L190)

凸体扫掠检测抽象方法。
子类需实现该方法，完成凸体扫掠与代理的相交检测：
1. 计算凸体扫掠后的AABB，筛选出可能相交的代理；
2. 对候选代理，通过callback回调执行凸体-形状的细检测；
3. 返回扫掠过程中的首次命中结果（如有）。

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

***

### createProxy()

> `abstract` **createProxy**(`userData`, `aabb`): `any`

Defined in: [broad-phase/broad-phase.ts:114](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/broad-phase.ts#L114)

创建物理代理抽象方法。
子类需实现该方法，完成PhysicsProxy的创建与注册：
1. 为Shape分配唯一ID，创建PhysicsProxy实例；
2. 初始化代理的AABB数据，将代理加入链表；
3. 更新_proxyList、_proxyListLast、_numProxies等状态。

#### Parameters

##### userData

[`Shape`](../../../shape/shape/classes/Shape.md)

关联的物理形状实例

##### aabb

[`Aabb`](../../../common/aabb/classes/Aabb.md)

形状的AABB包围盒

#### Returns

`any`

- 创建的PhysicsProxy实例（具体返回值由子类定义）

***

### destroyProxy()

> `abstract` **destroyProxy**(`proxy`): `void`

Defined in: [broad-phase/broad-phase.ts:125](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/broad-phase.ts#L125)

销毁物理代理抽象方法。
子类需实现该方法，完成PhysicsProxy的销毁与清理：
1. 将代理从链表中移除，更新_proxyList、_proxyListLast；
2. 递减_numProxies，清理代理的关联数据；
3. 可选：将代理回收至对象池（如有）。

#### Parameters

##### proxy

[`PhysicsProxy`](../../physics-proxy/classes/PhysicsProxy.md)

待销毁的物理代理实例

#### Returns

`void`

***

### isOverlapping()

> **isOverlapping**(`proxy1`, `proxy2`): `boolean`

Defined in: [broad-phase/broad-phase.ts:150](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/broad-phase.ts#L150)

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

***

### moveProxy()

> `abstract` **moveProxy**(`proxy`, `aabb`, `displacement`): `void`

Defined in: [broad-phase/broad-phase.ts:138](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/broad-phase.ts#L138)

移动物理代理抽象方法。
子类需实现该方法，处理代理位置变化：
1. 更新代理的AABB数据（size数组）；
2. 根据粗检测算法更新代理在空间分区中的位置；
3. 增量检测模式下标记代理为"已变化"，触发后续重检测。

#### Parameters

##### proxy

[`PhysicsProxy`](../../physics-proxy/classes/PhysicsProxy.md)

待移动的物理代理实例

##### aabb

[`Aabb`](../../../common/aabb/classes/Aabb.md)

代理新的AABB包围盒

##### displacement

[`Vec3`](../../../common/vec3/classes/Vec3.md)

代理的位移向量

#### Returns

`void`

***

### rayCast()

> `abstract` **rayCast**(`begin`, `end`, `callback`): `void`

Defined in: [broad-phase/broad-phase.ts:176](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/broad-phase.ts#L176)

射线检测抽象方法。
子类需实现该方法，完成射线与代理的相交检测：
1. 遍历代理链表，调用raycastTest判断射线与代理AABB是否相交；
2. 对相交的代理，通过callback回调执行细检测；
3. 支持回调中断（如检测到第一个命中后停止）。

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
