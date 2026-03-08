[**wuli.js API文档**](../../README.md)

***

[wuli.js API文档](../../modules.md) / [world](../README.md) / World

# Class: World

Defined in: [world.ts:63](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/world.ts#L63)

物理引擎核心世界类。
物理引擎的顶层管理类，负责：
1. 初始化宽相位、接触管理器、性能监控等核心组件；
2. 管理刚体（RigidBody）和关节（Joint）的添加/移除；
3. 驱动物理步进（step），包含接触更新、岛屿构建与求解；
4. 提供射线检测、凸体投射、AABB检测等物理查询能力。

## Constructors

### Constructor

> **new World**(`optional`): `World`

Defined in: [world.ts:115](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/world.ts#L115)

构造函数：初始化物理世界。
核心初始化流程：
1. 创建宽相位实例（默认BVH，可选暴力检测）；
2. 初始化步进间隔、重力、模拟动画控制器；
3. 创建接触管理器、性能监控实例（若配置）。

#### Parameters

##### optional

[`IWorldOptions`](../interfaces/IWorldOptions.md)

初始化配置项

#### Returns

`World`

## Properties

### afterCall

> **afterCall**: [`Nullable`](../../common/nullable/type-aliases/Nullable.md)\<() => `void`\>

Defined in: [world.ts:79](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/world.ts#L79)

物理步进后置回调（step执行后触发）

***

### beforeCall

> **beforeCall**: [`Nullable`](../../common/nullable/type-aliases/Nullable.md)\<() => `void`\>

Defined in: [world.ts:77](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/world.ts#L77)

物理步进前置回调（step执行前触发）

***

### broadPhase

> `readonly` **broadPhase**: [`BroadPhase`](../../broad-phase/broad-phase/classes/BroadPhase.md)

Defined in: [world.ts:65](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/world.ts#L65)

宽相位检测实例（BVH/暴力检测二选一），只读

***

### contactManager

> `readonly` **contactManager**: [`ContactManager`](../../constraint/contact/contact-manager/classes/ContactManager.md)

Defined in: [world.ts:67](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/world.ts#L67)

接触管理器，负责形状间接触的检测与管理，只读

***

### gravity

> **gravity**: [`Vec3`](../../common/vec3/classes/Vec3.md)

Defined in: [world.ts:81](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/world.ts#L81)

世界重力向量（默认(0, -9.8, 0)）

***

### interval

> **interval**: `number`

Defined in: [world.ts:83](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/world.ts#L83)

物理步进间隔（秒），默认0.01666

***

### numPositionIterations

> **numPositionIterations**: `number` = `5`

Defined in: [world.ts:73](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/world.ts#L73)

位置求解迭代次数（默认5次）

***

### numShapes

> **numShapes**: `number` = `0`

Defined in: [world.ts:69](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/world.ts#L69)

世界内形状总数

***

### numVelocityIterations

> **numVelocityIterations**: `number` = `10`

Defined in: [world.ts:75](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/world.ts#L75)

速度求解迭代次数（默认10次）

***

### performance?

> `readonly` `optional` **performance**: [`InfoDisplay`](../../common/info-display/classes/InfoDisplay.md)

Defined in: [world.ts:85](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/world.ts#L85)

性能监控实例（可选，由stats配置项控制创建），只读

***

### shapeIdCount

> **shapeIdCount**: `number` = `0`

Defined in: [world.ts:71](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/world.ts#L71)

形状ID计数器（用于生成唯一形状ID）

## Accessors

### numIslands

#### Get Signature

> **get** **numIslands**(): `number`

Defined in: [world.ts:575](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/world.ts#L575)

获取当前岛屿数量

##### Returns

`number`

岛屿总数

***

### numJoints

#### Get Signature

> **get** **numJoints**(): `number`

Defined in: [world.ts:567](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/world.ts#L567)

获取世界内关节数量

##### Returns

`number`

关节总数

***

### numRigidBodies

#### Get Signature

> **get** **numRigidBodies**(): `number`

Defined in: [world.ts:559](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/world.ts#L559)

获取世界内刚体数量

##### Returns

`number`

刚体总数

***

### simulate

#### Set Signature

> **set** **simulate**(`state`): `void`

Defined in: [world.ts:150](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/world.ts#L150)

物理模拟状态设置器。
控制物理模拟的启动/停止/单次执行：
1. START：启动动画循环，定时执行step；
2. STOP：停止动画循环；
3. IMMEDIATELY：立即执行一次step；
注意：需先配置simulateAnimation，否则报错。

##### Parameters

###### state

[`SIMULATE_STATE`](../../constant/enumerations/SIMULATE_STATE.md)

模拟状态（START/STOP/IMMEDIATELY）

##### Returns

`void`

## Methods

### aabbTest()

> **aabbTest**(`aabb`, `callback`): `void`

Defined in: [world.ts:549](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/world.ts#L549)

AABB检测（检测与指定AABB相交的形状）。
配置AABB检测包装器，调用宽相位AABB检测。

#### Parameters

##### aabb

[`Aabb`](../../common/aabb/classes/Aabb.md)

待检测的AABB（世界坐标）

##### callback

[`AabbTestCallback`](../../common/aabb-test-callback/classes/AabbTestCallback.md)

相交回调（处理相交的形状）

#### Returns

`void`

***

### addJoint()

> **addJoint**(`joint`): `void`

Defined in: [world.ts:386](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/world.ts#L386)

添加关节到物理世界。
核心逻辑：
1. 校验关节归属，避免重复添加；
2. 将关节加入世界链表，设置所属世界；
3. 关联关节与刚体的链接列表，唤醒关联刚体；
4. 同步关节锚点，递增关节计数。

#### Parameters

##### joint

[`Joint`](../../constraint/joint/joint/classes/Joint.md)

待添加的关节实例

#### Returns

`void`

#### Throws

关节已属于其他世界时抛出错误

***

### addRigidBody()

> **addRigidBody**(`rigidBody`): `void`

Defined in: [world.ts:212](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/world.ts#L212)

添加刚体到物理世界。
核心逻辑：
1. 校验刚体归属，避免重复添加；
2. 将刚体加入世界链表，设置所属世界；
3. 为刚体所有形状创建宽相位代理，分配唯一ID；
4. 递增刚体/形状计数。

#### Parameters

##### rigidBody

[`RigidBody`](../../rigid-body/rigid-body/classes/RigidBody.md)

待添加的刚体实例

#### Returns

`void`

#### Throws

刚体已属于其他世界时抛出错误

***

### convexCast()

> **convexCast**(`convex`, `begin`, `translation`, `callback`): `void`

Defined in: [world.ts:535](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/world.ts#L535)

凸体投射（凸几何体沿指定方向投射检测）。
配置凸体投射包装器，调用宽相位凸体投射检测。

#### Parameters

##### convex

[`ConvexGeometry`](../../shape/convex-geometry/classes/ConvexGeometry.md)

待投射的凸几何体

##### begin

[`Transform`](../../common/transform/classes/Transform.md)

投射起始变换（位置+旋转）

##### translation

[`Vec3`](../../common/vec3/classes/Vec3.md)

投射方向/位移向量

##### callback

[`RayCastCallback`](../../common/ray-cast-callback/classes/RayCastCallback.md)

命中回调

#### Returns

`void`

***

### rayCast()

> **rayCast**(`_begin`, `_end`, `callback?`): `void`

Defined in: [world.ts:515](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/world.ts#L515)

射线检测（宽相位筛选+高精度检测）。
核心流程：
1. 转换起止点到内部Vec3实例；
2. 配置射线检测包装器；
3. 调用宽相位射线检测，触发高精度检测和回调。

#### Parameters

##### \_begin

射线起点（世界坐标）

###### x

`number`

###### y

`number`

###### z

`number`

##### \_end

射线终点（世界坐标）

###### x

`number`

###### y

`number`

###### z

`number`

##### callback?

[`RayCastCallback`](../../common/ray-cast-callback/classes/RayCastCallback.md)

可选，命中回调（处理相交结果）

#### Returns

`void`

***

### removeJoint()

> **removeJoint**(`joint`): `void`

Defined in: [world.ts:439](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/world.ts#L439)

从物理世界移除关节。
核心逻辑：
1. 校验关节归属，确保属于当前世界；
2. 从世界链表移除关节，清空所属世界；
3. 清理关节与刚体的链接列表，唤醒关联刚体；
4. 递减关节计数。

#### Parameters

##### joint

[`Joint`](../../constraint/joint/joint/classes/Joint.md)

待移除的关节实例

#### Returns

`void`

#### Throws

关节不属于当前世界时抛出错误

***

### removeRigidBody()

> **removeRigidBody**(`rigidBody`): `void`

Defined in: [world.ts:246](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/world.ts#L246)

从物理世界移除刚体。
核心逻辑：
1. 校验刚体归属，确保属于当前世界；
2. 从世界链表移除刚体，清空所属世界；
3. 销毁刚体所有形状的宽相位代理，清理关联接触；
4. 递减刚体/形状计数。

#### Parameters

##### rigidBody

[`RigidBody`](../../rigid-body/rigid-body/classes/RigidBody.md)

待移除的刚体实例

#### Returns

`void`

#### Throws

刚体不属于当前世界时抛出错误

***

### step()

> **step**(`timeStep?`): `void`

Defined in: [world.ts:180](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/world.ts#L180)

物理步进（核心单帧物理求解逻辑）。
核心流程：
1. 执行前置回调 → 记录性能时间戳；
2. 更新时间步参数（dt变化时同步dtRatio/invDt）；
3. 更新接触 → 构建并求解岛屿 → 更新刚体3D对象变换；
4. 记录性能耗时 → 执行后置回调。

#### Parameters

##### timeStep?

`number`

可选，自定义步进间隔（秒），默认使用world.interval

#### Returns

`void`
