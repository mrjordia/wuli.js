[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [broad-phase/physics-proxy](../README.md) / PhysicsProxy

# Class: PhysicsProxy

Defined in: [broad-phase/physics-proxy.ts:12](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/broad-phase/physics-proxy.ts#L12)

物理代理核心类。
物理引擎中用于封装碰撞形状（Shape）的代理类，核心作用：
1. 存储形状的AABB包围盒数据，用于碰撞检测的粗测阶段；
2. 维护形状的唯一标识ID和用户数据关联；
3. 通过双向链表（prev/next）管理代理实例，支持高效的空间查询；
主要应用于物理世界的碰撞粗检测、形状管理、空间分区（如Broadphase）等场景。

## Extended by

- [`BvhProxy`](../../bvh-broad-phase/bvh-proxy/classes/BvhProxy.md)

## Constructors

### Constructor

> **new PhysicsProxy**(`userData`, `id`): `PhysicsProxy`

Defined in: [broad-phase/physics-proxy.ts:62](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/broad-phase/physics-proxy.ts#L62)

构造函数：初始化物理代理。
核心初始化逻辑：
1. 绑定传入的Shape对象到userData属性；
2. 初始化代理唯一ID；
3. size数组默认初始化为长度6的Float64Array，AABB数据需后续赋值；
4. prev/next默认为null，需通过链表操作赋值。

#### Parameters

##### userData

[`Shape`](../../../shape/shape/classes/Shape.md)

关联的物理形状实例（非空）

##### id

`number`

代理的唯一标识ID

#### Returns

`PhysicsProxy`

## Properties

### id

> **id**: `number`

Defined in: [broad-phase/physics-proxy.ts:36](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/broad-phase/physics-proxy.ts#L36)

代理唯一标识ID。
物理代理的全局唯一ID，用于区分不同的代理实例；
在构造函数中初始化，通常由物理世界统一分配和管理。

***

### next

> **next**: [`Nullable`](../../../common/nullable/type-aliases/Nullable.md)\<`PhysicsProxy`\>

Defined in: [broad-phase/physics-proxy.ts:50](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/broad-phase/physics-proxy.ts#L50)

双向链表后继节点。
指向链表中当前代理的下一个节点；
类型为Nullable，链表尾节点的next为null，用于代理实例的链表管理。

***

### prev

> **prev**: [`Nullable`](../../../common/nullable/type-aliases/Nullable.md)\<`PhysicsProxy`\>

Defined in: [broad-phase/physics-proxy.ts:43](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/broad-phase/physics-proxy.ts#L43)

双向链表前驱节点。
指向链表中当前代理的上一个节点；
类型为Nullable，链表头节点的prev为null，用于代理实例的链表管理。

***

### size

> **size**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [broad-phase/physics-proxy.ts:29](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/broad-phase/physics-proxy.ts#L29)

AABB包围盒尺寸数据。
长度为6的浮点数组，存储AABB包围盒的最小/最大边界值，数组结构：
[
  aabbMinX,aabbMinY,aabbMinZ,    // 索引0-2：AABB包围盒最小点坐标
  aabbMaxX,aabbMaxY,aabbMaxZ     // 索引3-5：AABB包围盒最大点坐标
]
采用Float64Array保证高精度计算，适配物理引擎的数值精度需求。

***

### userData

> **userData**: [`Nullable`](../../../common/nullable/type-aliases/Nullable.md)\<[`Shape`](../../../shape/shape/classes/Shape.md)\>

Defined in: [broad-phase/physics-proxy.ts:18](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/broad-phase/physics-proxy.ts#L18)

关联的物理形状实例。
指向代理所封装的Shape对象（如盒体、球体、凸包等）；
类型为Nullable，支持空值表示代理未关联有效形状。
