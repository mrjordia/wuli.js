[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [broad-phase/bvh-broad-phase/bvh-proxy](../README.md) / BvhProxy

# Class: BvhProxy

Defined in: [broad-phase/bvh-broad-phase/bvh-proxy.ts:16](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/broad-phase/bvh-broad-phase/bvh-proxy.ts#L16)

边界体积层次树专用物理代理类。
继承自基础PhysicsProxy，为BVH粗检测场景扩展专属属性，核心作用：
1. 关联BVH树的叶子节点，建立物理代理与BVH空间索引的映射关系；
2. 标记代理的移动状态，支持BVH树的增量更新（仅重检测移动的代理）；
3. 复用基础PhysicsProxy的核心能力（AABB存储、ID、链表指针等）；
核心特性：
- 轻量级扩展：仅新增叶子节点关联和移动标记，无额外性能开销；
- 适配BVH动态更新：通过moved标记减少不必要的树重构，提升性能；
主要应用场景：BVHBroadphase粗检测中，管理物理形状与BVH树节点的关联关系。

## Extends

- [`PhysicsProxy`](../../../physics-proxy/classes/PhysicsProxy.md)

## Constructors

### Constructor

> **new BvhProxy**(`userData`, `id`): `BvhProxy`

Defined in: [broad-phase/physics-proxy.ts:62](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/broad-phase/physics-proxy.ts#L62)

构造函数：初始化物理代理。
核心初始化逻辑：
1. 绑定传入的Shape对象到userData属性；
2. 初始化代理唯一ID；
3. size数组默认初始化为长度6的Float64Array，AABB数据需后续赋值；
4. prev/next默认为null，需通过链表操作赋值。

#### Parameters

##### userData

[`Shape`](../../../../shape/shape/classes/Shape.md)

关联的物理形状实例（非空）

##### id

`number`

代理的唯一标识ID

#### Returns

`BvhProxy`

#### Inherited from

[`PhysicsProxy`](../../../physics-proxy/classes/PhysicsProxy.md).[`constructor`](../../../physics-proxy/classes/PhysicsProxy.md#constructor)

## Properties

### id

> **id**: `number`

Defined in: [broad-phase/physics-proxy.ts:36](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/broad-phase/physics-proxy.ts#L36)

代理唯一标识ID。
物理代理的全局唯一ID，用于区分不同的代理实例；
在构造函数中初始化，通常由物理世界统一分配和管理。

#### Inherited from

[`PhysicsProxy`](../../../physics-proxy/classes/PhysicsProxy.md).[`id`](../../../physics-proxy/classes/PhysicsProxy.md#id)

***

### leaf

> **leaf**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`BvhNode`](../../bvh-node/classes/BvhNode.md)\>

Defined in: [broad-phase/bvh-broad-phase/bvh-proxy.ts:24](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/broad-phase/bvh-broad-phase/bvh-proxy.ts#L24)

关联的BVH叶子节点。
指向当前代理绑定的BVH树叶子节点；
- 叶子节点的proxy属性会反向指向当前BvhProxy实例；
- 代理未加入BVH树/已从树中移除时，该属性为null；
核心作用：建立代理与BVH空间索引的双向关联，支持快速定位与更新。

***

### moved

> **moved**: `boolean` = `false`

Defined in: [broad-phase/bvh-broad-phase/bvh-proxy.ts:33](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/broad-phase/bvh-broad-phase/bvh-proxy.ts#L33)

代理移动状态标记。
标记代理是否发生位置/AABB变化：
- true：代理已移动，需触发BVH树的增量更新（重新插入/调整节点）；
- false：代理未移动，无需参与BVH树的重检测；
初始值为false，移动物理代理时置为true，BVH更新完成后置为false。

***

### next

> **next**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`PhysicsProxy`](../../../physics-proxy/classes/PhysicsProxy.md)\>

Defined in: [broad-phase/physics-proxy.ts:50](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/broad-phase/physics-proxy.ts#L50)

双向链表后继节点。
指向链表中当前代理的下一个节点；
类型为Nullable，链表尾节点的next为null，用于代理实例的链表管理。

#### Inherited from

[`PhysicsProxy`](../../../physics-proxy/classes/PhysicsProxy.md).[`next`](../../../physics-proxy/classes/PhysicsProxy.md#next)

***

### prev

> **prev**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`PhysicsProxy`](../../../physics-proxy/classes/PhysicsProxy.md)\>

Defined in: [broad-phase/physics-proxy.ts:43](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/broad-phase/physics-proxy.ts#L43)

双向链表前驱节点。
指向链表中当前代理的上一个节点；
类型为Nullable，链表头节点的prev为null，用于代理实例的链表管理。

#### Inherited from

[`PhysicsProxy`](../../../physics-proxy/classes/PhysicsProxy.md).[`prev`](../../../physics-proxy/classes/PhysicsProxy.md#prev)

***

### size

> **size**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [broad-phase/physics-proxy.ts:29](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/broad-phase/physics-proxy.ts#L29)

AABB包围盒尺寸数据。
长度为6的浮点数组，存储AABB包围盒的最小/最大边界值，数组结构：
[
  aabbMinX,aabbMinY,aabbMinZ,    // 索引0-2：AABB包围盒最小点坐标
  aabbMaxX,aabbMaxY,aabbMaxZ     // 索引3-5：AABB包围盒最大点坐标
]
采用Float64Array保证高精度计算，适配物理引擎的数值精度需求。

#### Inherited from

[`PhysicsProxy`](../../../physics-proxy/classes/PhysicsProxy.md).[`size`](../../../physics-proxy/classes/PhysicsProxy.md#size)

***

### userData

> **userData**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`Shape`](../../../../shape/shape/classes/Shape.md)\>

Defined in: [broad-phase/physics-proxy.ts:18](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/broad-phase/physics-proxy.ts#L18)

关联的物理形状实例。
指向代理所封装的Shape对象（如盒体、球体、凸包等）；
类型为Nullable，支持空值表示代理未关联有效形状。

#### Inherited from

[`PhysicsProxy`](../../../physics-proxy/classes/PhysicsProxy.md).[`userData`](../../../physics-proxy/classes/PhysicsProxy.md#userdata)
