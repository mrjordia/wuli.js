[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [broad-phase/bvh-broad-phase/bvh-broad-phase](../README.md) / BvhBroadPhase

# Class: BvhBroadPhase

Defined in: [broad-phase/bvh-broad-phase/bvh-broad-phase.ts:35](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/bvh-broad-phase/bvh-broad-phase.ts#L35)

BVH（边界体积层次）粗检测核心实现类。
物理引擎中基于BVH树的高性能粗检测实现，核心作用：
1. 替代暴力遍历，通过BVH树的分层空间索引大幅减少AABB检测次数；
2. 支持增量更新（incremental），仅重检测移动的代理，提升动态场景性能；
3. 实现碰撞对收集、射线检测、凸体扫掠、AABB测试等核心粗检测能力；
4. 内置BVH树平衡优化，保证查询效率的稳定性；
核心特性：
- 增量检测：通过movedProxies管理移动代理，根据阈值选择增量/全量检测；
- 递归遍历：采用递归算法遍历BVH树，适配二叉树的空间划分特性；
- 节点复用：通过BvhTree的节点池复用BVHNode，优化内存开销；
- 平衡优化：支持BVH树的旋转平衡，避免树退化导致的性能下降；
性能特点：
- 时间复杂度：查询/检测为O(n log n)，远优于暴力检测的O(n²)；
- 增量更新：动态场景下仅处理移动代理，性能提升显著；
主要应用场景：中大规模物理场景、动态碰撞体较多的游戏/仿真、高精度碰撞检测需求。

## Extends

- [`BroadPhase`](../../../broad-phase/classes/BroadPhase.md)

## Constructors

### Constructor

> **new BvhBroadPhase**(): `BvhBroadPhase`

Defined in: [broad-phase/bvh-broad-phase/bvh-broad-phase.ts:68](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/bvh-broad-phase/bvh-broad-phase.ts#L68)

构造函数：初始化BVH粗检测实例。
核心初始化逻辑：
1. 调用父类构造函数，指定粗检测类型为BVH；
2. 初始化BVH树实例，继承父类的临时对象（_aabb、_convexSweep等）；
3. 启用增量更新，初始化移动代理数组。

#### Returns

`BvhBroadPhase`

#### Overrides

[`BroadPhase`](../../../broad-phase/classes/BroadPhase.md).[`constructor`](../../../broad-phase/classes/BroadPhase.md#constructor)

## Properties

### identity

> **identity**: [`Transform`](../../../../common/transform/classes/Transform.md)

Defined in: [broad-phase/broad-phase.ts:75](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/broad-phase.ts#L75)

单位变换矩阵。
预初始化的单位Transform实例（无平移、无旋转）；
用于不需要变换的几何检测场景，避免频繁创建单位矩阵。

#### Inherited from

[`BroadPhase`](../../../broad-phase/classes/BroadPhase.md).[`identity`](../../../broad-phase/classes/BroadPhase.md#identity)

***

### incremental

> **incremental**: `boolean` = `true`

Defined in: [broad-phase/bvh-broad-phase/bvh-broad-phase.ts:43](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/bvh-broad-phase/bvh-broad-phase.ts#L43)

增量更新开关。
是否启用增量粗检测：
- true：仅处理移动的代理，减少不必要的检测；
- false：每帧全量检测所有代理；
初始值为true，适配动态物理场景的性能优化需求。

#### Overrides

[`BroadPhase`](../../../broad-phase/classes/BroadPhase.md).[`incremental`](../../../broad-phase/classes/BroadPhase.md#incremental)

***

### movedProxies

> **movedProxies**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`BvhProxy`](../../bvh-proxy/classes/BvhProxy.md)\>[]

Defined in: [broad-phase/bvh-broad-phase/bvh-broad-phase.ts:50](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/bvh-broad-phase/bvh-broad-phase.ts#L50)

移动代理数组。
存储帧内发生移动的BvhProxy实例，长度初始化为1024；
数组满时自动扩容（翻倍），避免溢出，未使用位置为null。

***

### numMovedProxies

> **numMovedProxies**: `number` = `0`

Defined in: [broad-phase/bvh-broad-phase/bvh-broad-phase.ts:57](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/bvh-broad-phase/bvh-broad-phase.ts#L57)

移动代理数量。
统计当前帧移动代理数组中的有效代理数量；
新增移动代理时递增，帧末重置为0，初始值为0。

***

### proxyPairList

> **proxyPairList**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`ProxyPair`](../../../proxy-pair/classes/ProxyPair.md)\>

Defined in: [broad-phase/broad-phase.ts:54](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/broad-phase.ts#L54)

碰撞对链表头节点。
指向当前帧检测出的候选碰撞对链表的第一个节点；
collectPairs方法会更新该链表，用于后续细检测阶段处理。

#### Inherited from

[`BroadPhase`](../../../broad-phase/classes/BroadPhase.md).[`proxyPairList`](../../../broad-phase/classes/BroadPhase.md#proxypairlist)

***

### raycastHit

> **raycastHit**: [`RayCastHit`](../../../../shape/ray-cast-hit/classes/RayCastHit.md)

Defined in: [broad-phase/broad-phase.ts:89](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/broad-phase.ts#L89)

射线检测命中结果。
预初始化的RayCastHit实例，用于存储射线检测的命中数据；
如命中点、法向量、命中比例等，避免频繁创建实例。

#### Inherited from

[`BroadPhase`](../../../broad-phase/classes/BroadPhase.md).[`raycastHit`](../../../broad-phase/classes/BroadPhase.md#raycasthit)

***

### testCount

> **testCount**: `number` = `0`

Defined in: [broad-phase/broad-phase.ts:68](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/broad-phase.ts#L68)

检测计数。
统计当前帧粗检测的碰撞对测试次数；
用于性能分析与调优，每帧检测完成后可重置。

#### Inherited from

[`BroadPhase`](../../../broad-phase/classes/BroadPhase.md).[`testCount`](../../../broad-phase/classes/BroadPhase.md#testcount)

***

### type

> `readonly` **type**: [`BROAD_PHASE_TYPE`](../../../../constant/enumerations/BROAD_PHASE_TYPE.md)

Defined in: [broad-phase/broad-phase.ts:47](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/broad-phase.ts#L47)

粗检测类型标识。
标记当前粗检测实例的具体类型（如网格型、扫描型等）；
由构造函数初始化，只读属性，不可运行时修改。

#### Inherited from

[`BroadPhase`](../../../broad-phase/classes/BroadPhase.md).[`type`](../../../broad-phase/classes/BroadPhase.md#type)

***

### zero

> **zero**: [`Vec3`](../../../../common/vec3/classes/Vec3.md)

Defined in: [broad-phase/broad-phase.ts:82](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/broad-phase.ts#L82)

零向量。
预初始化的零向量（x=0,y=0,z=0）；
用于位移、方向等参数的默认值场景，提升代码复用性。

#### Inherited from

[`BroadPhase`](../../../broad-phase/classes/BroadPhase.md).[`zero`](../../../broad-phase/classes/BroadPhase.md#zero)

## Methods

### aabbTest()

> **aabbTest**(`aabb`, `callback`): `void`

Defined in: [broad-phase/bvh-broad-phase/bvh-broad-phase.ts:534](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/bvh-broad-phase/bvh-broad-phase.ts#L534)

AABB测试入口方法。
核心逻辑：
1. 边界处理：BVH树为空时直接返回；
2. 递归检测：调用aabbTestRecursive遍历BVH树；
核心封装：对外提供简洁接口，内部复用递归遍历逻辑。

#### Parameters

##### aabb

[`Aabb`](../../../../common/aabb/classes/Aabb.md)

待测试的AABB包围盒

##### callback

[`AabbTestWrapper`](../../../../common/aabb-test-wrapper/classes/AabbTestWrapper.md)

AABB测试回调函数

#### Returns

`void`

#### Overrides

[`BroadPhase`](../../../broad-phase/classes/BroadPhase.md).[`aabbTest`](../../../broad-phase/classes/BroadPhase.md#aabbtest)

***

### aabbTestRecursive()

> **aabbTestRecursive**(`node`, `aabb`, `callback`): `void`

Defined in: [broad-phase/bvh-broad-phase/bvh-broad-phase.ts:187](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/bvh-broad-phase/bvh-broad-phase.ts#L187)

递归AABB测试（BVH树遍历）。
AABB测试核心逻辑（剪枝遍历）：
1. 剪枝条件：测试AABB与当前节点AABB不相交，直接返回；
2. 叶子节点：调用回调函数，传入代理执行自定义处理；
3. 非叶子节点：递归遍历左右子节点，继续AABB测试；
核心应用：区域内形状检索、碰撞体范围查询等场景。

#### Parameters

##### node

[`BvhNode`](../../bvh-node/classes/BvhNode.md)

当前遍历的BVH节点

##### aabb

[`Aabb`](../../../../common/aabb/classes/Aabb.md)

待测试的AABB包围盒

##### callback

[`AabbTestWrapper`](../../../../common/aabb-test-wrapper/classes/AabbTestWrapper.md)

AABB测试回调函数

#### Returns

`void`

***

### collectPairs()

> **collectPairs**(): `void`

Defined in: [broad-phase/bvh-broad-phase/bvh-broad-phase.ts:412](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/bvh-broad-phase/bvh-broad-phase.ts#L412)

收集碰撞对（增量/全量检测）。
核心逻辑（增量检测为主）：
1. 清理缓存：回收上一帧的碰撞对链表至对象池；
2. 阈值判断：根据移动代理占比选择增量/全量检测；
3. 增量检测：
   - 遍历移动代理，重新插入BVH树并平衡；
   - 仅检测移动代理与整棵树的碰撞，减少检测次数；
4. 全量检测：遍历整棵BVH树，检测所有节点对的碰撞；
5. 状态重置：清空移动代理数组，重置数量计数；
核心优化：增量检测大幅减少动态场景的检测开销。

#### Returns

`void`

#### Overrides

[`BroadPhase`](../../../broad-phase/classes/BroadPhase.md).[`collectPairs`](../../../broad-phase/classes/BroadPhase.md#collectpairs)

***

### collide()

> **collide**(`n1`, `n2`): `void`

Defined in: [broad-phase/bvh-broad-phase/bvh-broad-phase.ts:88](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/bvh-broad-phase/bvh-broad-phase.ts#L88)

递归检测两个BVH节点的碰撞（核心碰撞对收集逻辑）。
基于BVH树的碰撞对收集算法，核心逻辑（递归遍历）：
1. 递增检测计数（testCount），记录AABB检测次数；
2. 边界处理：
   - 节点自身碰撞：非叶子节点递归检测子节点与自身，叶子节点直接返回；
   - AABB不重叠：直接返回，无需后续检测；
3. 叶子节点处理：
   - 两个均为叶子节点且AABB重叠：创建ProxyPair加入碰撞对链表；
4. 非叶子节点处理：
   - 选择高度更高/叶子节点的分支递归检测，减少遍历次数；
   - 保证递归遍历的高效性，避免冗余检测。

#### Parameters

##### n1

[`BvhNode`](../../bvh-node/classes/BvhNode.md)

待检测的第一个BVH节点

##### n2

[`BvhNode`](../../bvh-node/classes/BvhNode.md)

待检测的第二个BVH节点

#### Returns

`void`

***

### convexCast()

> **convexCast**(`convex`, `begin`, `translation`, `callback`): `void`

Defined in: [broad-phase/bvh-broad-phase/bvh-broad-phase.ts:519](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/bvh-broad-phase/bvh-broad-phase.ts#L519)

凸体扫掠检测入口方法。
核心逻辑：
1. 边界处理：BVH树为空时直接返回；
2. 递归检测：调用convexCastRecursive遍历BVH树；
核心封装：对外提供简洁接口，内部复用递归遍历逻辑。

#### Parameters

##### convex

[`ConvexGeometry`](../../../../shape/convex-geometry/classes/ConvexGeometry.md)

待扫掠的凸体几何

##### begin

[`Transform`](../../../../common/transform/classes/Transform.md)

凸体初始变换

##### translation

[`Vec3`](../../../../common/vec3/classes/Vec3.md)

凸体扫掠位移向量

##### callback

[`ConvexCastWrapper`](../../../../common/convex-cast-wrapper/classes/ConvexCastWrapper.md)

扫掠检测回调函数

#### Returns

`void`

#### Overrides

[`BroadPhase`](../../../broad-phase/classes/BroadPhase.md).[`convexCast`](../../../broad-phase/classes/BroadPhase.md#convexcast)

***

### convexCastRecursive()

> **convexCastRecursive**(`node`, `convex`, `begin`, `translation`, `callback`): `void`

Defined in: [broad-phase/bvh-broad-phase/bvh-broad-phase.ts:158](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/bvh-broad-phase/bvh-broad-phase.ts#L158)

递归凸体扫掠检测（BVH树遍历）。
凸体扫掠检测核心逻辑（剪枝遍历）：
1. 初始化节点AABB到临时_aabb对象；
2. 剪枝条件：通过GJK-EPA算法判断凸体扫掠路径与节点AABB不相交，直接返回；
3. 叶子节点：调用回调函数，传入代理执行细检测；
4. 非叶子节点：递归遍历左右子节点，继续扫掠检测；
核心优化：结合GJK-EPA快速筛选，减少细检测次数。

#### Parameters

##### node

[`BvhNode`](../../bvh-node/classes/BvhNode.md)

当前遍历的BVH节点

##### convex

[`ConvexGeometry`](../../../../shape/convex-geometry/classes/ConvexGeometry.md)

待扫掠的凸体几何

##### begin

[`Transform`](../../../../common/transform/classes/Transform.md)

凸体初始变换（位置/旋转）

##### translation

[`Vec3`](../../../../common/vec3/classes/Vec3.md)

凸体扫掠位移向量

##### callback

[`ConvexCastWrapper`](../../../../common/convex-cast-wrapper/classes/ConvexCastWrapper.md)

扫掠检测回调函数

#### Returns

`void`

***

### createProxy()

> **createProxy**(`userData`, `aabb`): [`BvhProxy`](../../bvh-proxy/classes/BvhProxy.md)

Defined in: [broad-phase/bvh-broad-phase/bvh-broad-phase.ts:319](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/bvh-broad-phase/bvh-broad-phase.ts#L319)

创建BVH物理代理（关联BVH树叶子节点）。
核心逻辑：
1. 创建BvhProxy：分配唯一ID，初始化AABB并添加padding；
2. 创建叶子节点：从对象池获取/新建BVHNode，关联代理与节点；
3. 插入BVH树：
   - 空树：直接设为根节点；
   - 非空树：根据插入策略找到最优位置，创建父节点并插入；
4. 平衡更新：调用updateNode优化树结构，标记代理为已移动；
核心特性：节点池复用，减少内存分配开销。

#### Parameters

##### userData

[`Shape`](../../../../shape/shape/classes/Shape.md)

关联的物理形状实例

##### aabb

[`Aabb`](../../../../common/aabb/classes/Aabb.md)

形状的AABB包围盒

#### Returns

[`BvhProxy`](../../bvh-proxy/classes/BvhProxy.md)

- 创建并注册的BVH代理实例

#### Overrides

[`BroadPhase`](../../../broad-phase/classes/BroadPhase.md).[`createProxy`](../../../broad-phase/classes/BroadPhase.md#createproxy)

***

### destroyProxy()

> **destroyProxy**(`proxy`): `void`

Defined in: [broad-phase/bvh-broad-phase/bvh-broad-phase.ts:381](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/bvh-broad-phase/bvh-broad-phase.ts#L381)

销毁BVH物理代理（从BVH树移除并回收节点）。
核心逻辑：
1. 链表清理：从代理链表中移除，维护prev/next指针；
2. BVH树清理：调用_resetBvhProxy移除叶子节点，回收至对象池；
3. 状态重置：清理代理关联数据，重置移动状态；
核心保证：安全回收节点资源，避免内存泄漏。

#### Parameters

##### proxy

[`BvhProxy`](../../bvh-proxy/classes/BvhProxy.md)

待销毁的BVH代理

#### Returns

`void`

#### Overrides

[`BroadPhase`](../../../broad-phase/classes/BroadPhase.md).[`destroyProxy`](../../../broad-phase/classes/BroadPhase.md#destroyproxy)

***

### getTreeBalance()

> **getTreeBalance**(): `number`

Defined in: [broad-phase/bvh-broad-phase/bvh-broad-phase.ts:545](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/bvh-broad-phase/bvh-broad-phase.ts#L545)

获取BVH树的总平衡度。
封装BvhTree的getBalance方法，对外提供树平衡度查询接口；
平衡度越小，树结构越优，查询效率越高。

#### Returns

`number`

- BVH树的总平衡度（非负整数）

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

[`PhysicsProxy`](../../../physics-proxy/classes/PhysicsProxy.md)

第一个物理代理

##### proxy2

[`PhysicsProxy`](../../../physics-proxy/classes/PhysicsProxy.md)

第二个物理代理

#### Returns

`boolean`

- 重叠结果：true=AABB相交，false=AABB分离

#### Inherited from

[`BroadPhase`](../../../broad-phase/classes/BroadPhase.md).[`isOverlapping`](../../../broad-phase/classes/BroadPhase.md#isoverlapping)

***

### moveProxy()

> **moveProxy**(`proxy`, `aabb`, `displacement`): `void`

Defined in: [broad-phase/bvh-broad-phase/bvh-broad-phase.ts:212](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/bvh-broad-phase/bvh-broad-phase.ts#L212)

移动物理代理（更新AABB并标记移动状态）。
核心逻辑：
1. 剪枝条件：新AABB完全包含在旧AABB内，无需更新；
2. 更新AABB：复制新AABB数据，添加BVH代理padding并扩展位移；
3. 标记移动：将代理加入movedProxies数组，标记为已移动；
核心优化：通过padding和位移扩展避免频繁的BVH树更新。

#### Parameters

##### proxy

[`BvhProxy`](../../bvh-proxy/classes/BvhProxy.md)

待移动的BVH代理

##### aabb

[`Aabb`](../../../../common/aabb/classes/Aabb.md)

代理新的AABB包围盒

##### displacement

[`Vec3`](../../../../common/vec3/classes/Vec3.md)

代理的位移向量

#### Returns

`void`

#### Overrides

[`BroadPhase`](../../../broad-phase/classes/BroadPhase.md).[`moveProxy`](../../../broad-phase/classes/BroadPhase.md#moveproxy)

***

### rayCast()

> **rayCast**(`begin`, `end`, `callback`): `void`

Defined in: [broad-phase/bvh-broad-phase/bvh-broad-phase.ts:500](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/bvh-broad-phase/bvh-broad-phase.ts#L500)

射线检测入口方法。
核心逻辑：
1. 边界处理：BVH树为空时直接返回；
2. 递归检测：提取射线坐标，调用rayCastRecursive遍历BVH树；
核心封装：对外提供简洁接口，内部复用递归遍历逻辑。

#### Parameters

##### begin

[`Vec3`](../../../../common/vec3/classes/Vec3.md)

射线起点

##### end

[`Vec3`](../../../../common/vec3/classes/Vec3.md)

射线终点

##### callback

[`RayCastWrapper`](../../../../common/ray-cast-wrapper/classes/RayCastWrapper.md)

射线检测回调函数

#### Returns

`void`

#### Overrides

[`BroadPhase`](../../../broad-phase/classes/BroadPhase.md).[`rayCast`](../../../broad-phase/classes/BroadPhase.md#raycast)

***

### rayCastRecursive()

> **rayCastRecursive**(`node`, `x1`, `y1`, `z1`, `x2`, `y2`, `z2`, `callback`): `void`

Defined in: [broad-phase/bvh-broad-phase/bvh-broad-phase.ts:131](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/bvh-broad-phase/bvh-broad-phase.ts#L131)

递归射线检测（BVH树遍历）。
射线检测核心逻辑（剪枝遍历）：
1. 剪枝条件：射线与当前节点AABB不相交，直接返回；
2. 叶子节点：调用回调函数，传入代理执行细检测；
3. 非叶子节点：递归遍历左右子节点，继续射线检测；
核心优化：通过AABB快速剪枝，避免遍历无关节点。

#### Parameters

##### node

[`BvhNode`](../../bvh-node/classes/BvhNode.md)

当前遍历的BVH节点

##### x1

`number`

射线起点X坐标

##### y1

`number`

射线起点Y坐标

##### z1

`number`

射线起点Z坐标

##### x2

`number`

射线终点X坐标

##### y2

`number`

射线终点Y坐标

##### z2

`number`

射线终点Z坐标

##### callback

[`RayCastWrapper`](../../../../common/ray-cast-wrapper/classes/RayCastWrapper.md)

射线检测回调函数

#### Returns

`void`

***

### setProxyChain()

> **setProxyChain**(`parent`, `self`, `si`, `child`, `ci`): `void`

Defined in: [broad-phase/bvh-broad-phase/bvh-broad-phase.ts:240](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/bvh-broad-phase/bvh-broad-phase.ts#L240)

设置代理链（维护BVH树父子节点关系）。
核心逻辑：
1. 调用_makeProxyChain维护三层节点的父子关系；
2. 更新父节点的AABB和高度信息；
核心作用：BVH树平衡旋转时，调整节点的拓扑结构。

#### Parameters

##### parent

[`BvhNode`](../../bvh-node/classes/BvhNode.md)

父节点

##### self

[`BvhNode`](../../bvh-node/classes/BvhNode.md)

当前节点

##### si

`number`

当前节点在父节点中的索引

##### child

[`BvhNode`](../../bvh-node/classes/BvhNode.md)

子节点

##### ci

`number`

子节点在当前节点中的索引

#### Returns

`void`

***

### updateNode()

> **updateNode**(`nd`, `tree`): `void`

Defined in: [broad-phase/bvh-broad-phase/bvh-broad-phase.ts:261](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/broad-phase/bvh-broad-phase/bvh-broad-phase.ts#L261)

更新BVH节点（平衡优化+AABB/高度更新）。
核心逻辑（自底向上更新）：
1. 平衡优化（启用时）：
   - 检测节点平衡度，超过阈值则执行旋转平衡；
   - 支持LL/LR/RR/RL四种旋转场景，保证树的平衡；
2. 节点更新：
   - 自底向上更新父节点的AABB和高度；
   - 调整根节点引用，维护树的拓扑正确性；
核心目的：避免BVH树退化，保证查询效率的稳定性。

#### Parameters

##### nd

[`BvhNode`](../../bvh-node/classes/BvhNode.md)

待更新的BVH节点

##### tree

[`BvhTree`](../../bvh-tree/classes/BvhTree.md)

BVH树实例

#### Returns

`void`
