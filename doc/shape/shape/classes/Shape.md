[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [shape/shape](../README.md) / Shape

# Class: Shape

Defined in: [shape/shape.ts:18](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/shape.ts#L18)

物理形状核心类。
物理引擎中碰撞形状的核心封装，关联几何体、变换、物理属性（摩擦/恢复系数/密度），
是刚体的碰撞单元，负责碰撞检测、AABB计算、宽相位代理管理等核心功能。
每个Shape绑定到一个RigidBody，可通过链表组织多个Shape到同一个刚体上。

## Constructors

### Constructor

> **new Shape**(`config`): `Shape`

Defined in: [shape/shape.ts:60](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/shape.ts#L60)

构造函数。
初始化形状的本地变换、物理属性、几何体、碰撞过滤规则，
将配置中的位置/旋转组合为本地变换，并初始化历史/当前变换为本地变换。

#### Parameters

##### config

[`ShapeConfig`](../../shape-config/classes/ShapeConfig.md)

形状配置项

#### Returns

`Shape`

## Properties

### aabb

> **aabb**: [`Aabb`](../../../common/aabb/classes/Aabb.md)

Defined in: [shape/shape.ts:40](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/shape.ts#L40)

形状的AABB包围盒（用于宽相位检测）

***

### collisionGroup

> **collisionGroup**: `number`

Defined in: [shape/shape.ts:34](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/shape.ts#L34)

碰撞组（用于碰撞过滤，仅与匹配的collisionMask碰撞）

***

### collisionMask

> **collisionMask**: `number`

Defined in: [shape/shape.ts:36](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/shape.ts#L36)

碰撞掩码（用于碰撞过滤，标识可碰撞的组）

***

### contactCallback

> **contactCallback**: [`Nullable`](../../../common/nullable/type-aliases/Nullable.md)\<[`ContactCallback`](../../../common/contact-callback/classes/ContactCallback.md)\>

Defined in: [shape/shape.ts:38](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/shape.ts#L38)

接触回调（碰撞开始/持续/结束时触发的自定义逻辑）

***

### displacement

> **displacement**: [`Vec3`](../../../common/vec3/classes/Vec3.md)

Defined in: [shape/shape.ts:50](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/shape.ts#L50)

位移向量（当前帧相对于上一帧的位移，用于宽相位代理移动）

***

### friction

> **friction**: `number`

Defined in: [shape/shape.ts:30](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/shape.ts#L30)

摩擦系数（0=无摩擦，1=最大静摩擦）

***

### geometry

> **geometry**: [`Geometry`](../../geometry/classes/Geometry.md)

Defined in: [shape/shape.ts:32](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/shape.ts#L32)

形状关联的几何体（如球体/盒型/胶囊体等）

***

### id

> **id**: `number` = `-1`

Defined in: [shape/shape.ts:20](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/shape.ts#L20)

形状唯一标识ID（-1表示未初始化）

***

### localTransform

> **localTransform**: [`Transform`](../../../common/transform/classes/Transform.md)

Defined in: [shape/shape.ts:22](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/shape.ts#L22)

形状相对于刚体的本地变换（位置+旋转）

***

### next

> **next**: [`Nullable`](../../../common/nullable/type-aliases/Nullable.md)\<`Shape`\>

Defined in: [shape/shape.ts:48](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/shape.ts#L48)

形状链表后继节点（刚体的形状链表）

***

### prev

> **prev**: [`Nullable`](../../../common/nullable/type-aliases/Nullable.md)\<`Shape`\>

Defined in: [shape/shape.ts:46](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/shape.ts#L46)

形状链表前驱节点（刚体的形状链表）

***

### proxy

> **proxy**: [`Nullable`](../../../common/nullable/type-aliases/Nullable.md)\<[`PhysicsProxy`](../../../broad-phase/physics-proxy/classes/PhysicsProxy.md)\>

Defined in: [shape/shape.ts:42](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/shape.ts#L42)

宽相位代理（关联到BroadPhase的碰撞代理）

***

### ptransform

> **ptransform**: [`Transform`](../../../common/transform/classes/Transform.md)

Defined in: [shape/shape.ts:24](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/shape.ts#L24)

上一帧的世界变换（用于插值/碰撞检测的历史状态）

***

### restitution

> **restitution**: `number`

Defined in: [shape/shape.ts:28](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/shape.ts#L28)

恢复系数（弹性，0=完全非弹性碰撞，1=完全弹性碰撞）

***

### rigidBody

> **rigidBody**: [`Nullable`](../../../common/nullable/type-aliases/Nullable.md)\<[`RigidBody`](../../../rigid-body/rigid-body/classes/RigidBody.md)\>

Defined in: [shape/shape.ts:44](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/shape.ts#L44)

绑定的刚体（Shape必须归属到一个RigidBody）

***

### transform

> **transform**: [`Transform`](../../../common/transform/classes/Transform.md)

Defined in: [shape/shape.ts:26](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/shape.ts#L26)

当前帧的世界变换（本地变换 × 刚体世界变换）

## Accessors

### density

#### Get Signature

> **get** **density**(): `number`

Defined in: [shape/shape.ts:155](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/shape.ts#L155)

获取形状密度。
密度是计算刚体质量的核心参数，不同形状的密度结合体积可得到质量。

##### Returns

`number`

密度值（kg/m³），若私有变量为null则返回默认值1

#### Set Signature

> **set** **density**(`density`): `void`

Defined in: [shape/shape.ts:170](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/shape.ts#L170)

设置形状密度。
修改密度后会触发以下连锁更新：
1. 更新私有密度变量；
2. 重新计算刚体的质量数据（updateMass）；
3. 遍历刚体所有形状，更新其历史/当前世界变换；
4. 重新计算形状的AABB（合并历史/当前变换的AABB）；
5. 若存在宽相位代理，更新代理位置并通知宽相位。
该方法逻辑与setLocalTransform高度复用，确保密度修改后刚体物理状态同步。

##### Parameters

###### density

`number`

新的密度值（kg/m³）

##### Returns

`void`

## Methods

### setLocalTransform()

> **setLocalTransform**(`transform`): `void`

Defined in: [shape/shape.ts:83](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/shape.ts#L83)

设置形状的本地变换（相对于刚体）。
修改形状相对于刚体的本地变换，并触发以下连锁更新：
1. 重新计算刚体的质量数据（updateMass）；
2. 遍历刚体所有形状，更新其历史/当前世界变换（本地变换 × 刚体变换）；
3. 重新计算形状的AABB（合并历史/当前变换的AABB，防止穿模）；
4. 若存在宽相位代理，更新代理的位置并通知宽相位。
该方法会遍历刚体所有形状，而非仅当前形状，确保刚体形状整体同步。

#### Parameters

##### transform

[`Transform`](../../../common/transform/classes/Transform.md)

新的本地变换

#### Returns

`void`
