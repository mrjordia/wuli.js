[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [constraint/contact/contact](../README.md) / Contact

# Class: Contact

Defined in: [constraint/contact/contact.ts:18](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/contact/contact.ts#L18)

碰撞接触类。
物理引擎中两个刚体之间碰撞接触的核心管理类，整合了碰撞检测、接触流形（Manifold）、接触约束、回调事件等所有相关数据和逻辑，
             是连接碰撞检测与物理约束求解的关键桥梁

## Constructors

### Constructor

> **new Contact**(): `Contact`

Defined in: [constraint/contact/contact.ts:135](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/contact/contact.ts#L135)

构造函数：初始化碰撞接触实例。
初始化时自动创建ManifoldUpdater和ContactConstraint实例，关联当前Contact的manifold

#### Returns

`Contact`

## Properties

### cachedDetectorData

> **cachedDetectorData**: [`CachedDetectorData`](../../../../collision-detector/cached-detector-data/classes/CachedDetectorData.md)

Defined in: [constraint/contact/contact.ts:84](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/contact/contact.ts#L84)

碰撞检测器的缓存数据。
存储检测器的中间计算结果，避免重复计算，提升碰撞检测性能

***

### contactConstraint

> **contactConstraint**: [`ContactConstraint`](../../contact-constraint/classes/ContactConstraint.md)

Defined in: [constraint/contact/contact.ts:122](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/contact/contact.ts#L122)

接触约束。
基于manifold数据构建的物理约束，用于求解碰撞后的速度、位置修正

***

### detector

> **detector**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`Detector`](../../../../collision-detector/detector/classes/Detector.md)\<[`Geometry`](../../../../shape/geometry/classes/Geometry.md), [`Geometry`](../../../../shape/geometry/classes/Geometry.md)\>\>

Defined in: [constraint/contact/contact.ts:78](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/contact/contact.ts#L78)

碰撞检测器实例。
用于检测shape1和shape2是否碰撞的检测器，不同形状组合对应不同的检测器实现

#### Default

```ts
null
```

***

### detectorResult

> **detectorResult**: [`DetectorResult`](../../../../collision-detector/detector-result/classes/DetectorResult.md)

Defined in: [constraint/contact/contact.ts:90](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/contact/contact.ts#L90)

碰撞检测结果。
存储每次碰撞检测的输出结果，包括接触点、法向、穿透深度等核心数据

***

### latest

> **latest**: `boolean` = `false`

Defined in: [constraint/contact/contact.ts:97](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/contact/contact.ts#L97)

是否为最新的接触。
标记该接触是否是当前帧最新检测到的，用于过滤无效/过期的接触

#### Default

```ts
false
```

***

### link1

> **link1**: [`ContactLink`](../../contact-link/classes/ContactLink.md)

Defined in: [constraint/contact/contact.ts:37](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/contact/contact.ts#L37)

第一个碰撞物体的接触链接信息。
关联第一个刚体/形状的接触元数据，用于快速索引和管理

***

### link2

> **link2**: [`ContactLink`](../../contact-link/classes/ContactLink.md)

Defined in: [constraint/contact/contact.ts:43](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/contact/contact.ts#L43)

第二个碰撞物体的接触链接信息。
关联第二个刚体/形状的接触元数据，与link1对称

***

### manifold

> **manifold**: [`Manifold`](../../manifold/classes/Manifold.md)

Defined in: [constraint/contact/contact.ts:110](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/contact/contact.ts#L110)

碰撞接触流形。
存储该碰撞接触的所有接触点、法向/切向基向量等核心数据，是约束求解的核心数据源

***

### next

> **next**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<`Contact`\>

Defined in: [constraint/contact/contact.ts:24](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/contact/contact.ts#L24)

接触链表的下一个节点。
用于将多个Contact实例组织成双向链表，方便批量管理（如场景中所有碰撞接触）

#### Default

```ts
null
```

***

### prev

> **prev**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<`Contact`\>

Defined in: [constraint/contact/contact.ts:31](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/contact/contact.ts#L31)

接触链表的上一个节点。
双向链表的前驱节点，与next配合实现链表的遍历和管理

#### Default

```ts
null
```

***

### rigidBody1

> **rigidBody1**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`RigidBody`](../../../../rigid-body/rigid-body/classes/RigidBody.md)\>

Defined in: [constraint/contact/contact.ts:64](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/contact/contact.ts#L64)

第一个碰撞的刚体。
关联的第一个物理刚体，包含质量、变换、速度等物理属性，用于后续约束求解

#### Default

```ts
null
```

***

### rigidBody2

> **rigidBody2**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`RigidBody`](../../../../rigid-body/rigid-body/classes/RigidBody.md)\>

Defined in: [constraint/contact/contact.ts:71](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/contact/contact.ts#L71)

第二个碰撞的刚体。
关联的第二个物理刚体，与rigidBody1配对进行碰撞响应计算

#### Default

```ts
null
```

***

### shape1

> **shape1**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`Shape`](../../../../shape/shape/classes/Shape.md)\>

Defined in: [constraint/contact/contact.ts:50](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/contact/contact.ts#L50)

第一个碰撞物体的形状。
参与碰撞的第一个几何形状（如球体、盒子），必须非空才能进行碰撞检测

#### Default

```ts
null
```

***

### shape2

> **shape2**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`Shape`](../../../../shape/shape/classes/Shape.md)\>

Defined in: [constraint/contact/contact.ts:57](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/contact/contact.ts#L57)

第二个碰撞物体的形状。
参与碰撞的第二个几何形状，与shape1配对进行碰撞检测

#### Default

```ts
null
```

***

### shouldBeSkipped

> **shouldBeSkipped**: `boolean` = `false`

Defined in: [constraint/contact/contact.ts:104](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/contact/contact.ts#L104)

是否应跳过该接触。
标记该接触是否需要跳过约束求解，true时将不参与物理响应计算

#### Default

```ts
false
```

***

### touching

> **touching**: `boolean` = `false`

Defined in: [constraint/contact/contact.ts:129](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/contact/contact.ts#L129)

是否处于接触状态。
标记两个物体是否实际接触（有有效接触点），true表示碰撞中，false表示已分离

#### Default

```ts
false
```

***

### updater

> **updater**: [`ManifoldUpdater`](../../manifold-updater/classes/ManifoldUpdater.md)

Defined in: [constraint/contact/contact.ts:116](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/contact/contact.ts#L116)

流形更新器。
用于更新manifold数据的工具类实例，负责接触点的添加、移除、热启动等逻辑

## Methods

### postSolve()

> **postSolve**(): `void`

Defined in: [constraint/contact/contact.ts:221](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/contact/contact.ts#L221)

碰撞约束求解后触发的回调方法。
在接触约束求解完成后调用，触发两个碰撞形状的postSolve回调函数，
             用于处理碰撞后的自定义逻辑（如播放音效、扣血、触发特效等）
             注：会避免重复触发相同的回调（cc1和cc2相同时仅触发一次）

#### Returns

`void`

***

### updateManifold()

> **updateManifold**(): `void`

Defined in: [constraint/contact/contact.ts:151](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/contact/contact.ts#L151)

更新碰撞接触流形数据（核心方法）。
完整的接触更新流程，包含以下核心步骤：
             1. 执行碰撞检测，获取最新的接触点、法向等数据
             2. 更新touching状态（是否有有效接触点）
             3. 构建接触流形的法向基向量
             4. 根据穿透深度选择位置修正算法
             5. 增量/全量更新接触流形数据
             6. 触发接触生命周期回调（beginContact/endContact/preSolve）
             注：若detector为null则直接返回，不执行任何更新

#### Returns

`void`
