[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [constraint/contact/contact-manager](../README.md) / ContactManager

# Class: ContactManager

Defined in: [constraint/contact/contact-manager.ts:16](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/contact-manager.ts#L16)

碰撞接触管理器类。
物理引擎中碰撞接触的全局管理核心类，负责接触的创建、销毁、更新全生命周期管理，
             整合了宽相位检测结果、碰撞矩阵、接触池、接触链表等核心组件，是连接宽相位检测与接触约束求解的关键枢纽

## Constructors

### Constructor

> **new ContactManager**(`broadPhase`): `ContactManager`

Defined in: [constraint/contact/contact-manager.ts:60](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/contact-manager.ts#L60)

构造函数：初始化碰撞接触管理器。
初始化时关联宽相位检测实例，初始化碰撞矩阵和接触池等核心属性

#### Parameters

##### broadPhase

[`BroadPhase`](../../../../broad-phase/broad-phase/classes/BroadPhase.md)

宽相位检测实例 - 必须传入有效的BroadPhase实例，作为潜在碰撞对的数据源

#### Returns

`ContactManager`

## Properties

### broadPhase

> **broadPhase**: [`BroadPhase`](../../../../broad-phase/broad-phase/classes/BroadPhase.md)

Defined in: [constraint/contact/contact-manager.ts:21](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/contact-manager.ts#L21)

宽相位碰撞检测实例。
提供潜在碰撞对（proxyPairList）的数据源，是接触创建的基础

***

### collisionMatrix

> **collisionMatrix**: [`CollisionMatrix`](../../../../collision-detector/collision-matrix/classes/CollisionMatrix.md)

Defined in: [constraint/contact/contact-manager.ts:27](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/contact-manager.ts#L27)

碰撞检测器矩阵。
存储不同几何形状组合对应的碰撞检测器，用于为接触匹配正确的检测器实例

***

### contactList

> **contactList**: [`Contact`](../../contact/classes/Contact.md)

Defined in: [constraint/contact/contact-manager.ts:40](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/contact-manager.ts#L40)

接触链表的头节点。
存储所有当前有效接触的双向链表头节点，遍历从该节点开始

***

### contactListLast

> **contactListLast**: [`Contact`](../../contact/classes/Contact.md)

Defined in: [constraint/contact/contact-manager.ts:46](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/contact-manager.ts#L46)

接触链表的尾节点。
接触双向链表的尾节点，用于快速添加新接触到链表末尾

***

### contactPool

> **contactPool**: [`Contact`](../../contact/classes/Contact.md)

Defined in: [constraint/contact/contact-manager.ts:53](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/contact-manager.ts#L53)

接触对象池。
复用已销毁的Contact实例的对象池，避免频繁创建/销毁对象导致的性能开销，
             采用链表结构管理空闲Contact实例

***

### numContacts

> **numContacts**: `number` = `0`

Defined in: [constraint/contact/contact-manager.ts:34](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/contact-manager.ts#L34)

当前有效接触的数量。
标记接触链表（contactList）中实际有效的Contact实例数量，用于性能统计和遍历控制

#### Default

```ts
0
```

## Methods

### createContacts()

> **createContacts**(): `void`

Defined in: [constraint/contact/contact-manager.ts:75](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/contact-manager.ts#L75)

创建新的碰撞接触（核心方法）。
基于宽相位检测的潜在碰撞对，创建/更新Contact实例，核心流程：
             1. 遍历宽相位的proxyPairList，获取所有潜在碰撞的形状对
             2. 过滤无效碰撞对（通过shouldCollide判断）
             3. 检查碰撞对是否已有对应的Contact实例：
                - 已有：标记为latest=true（最新接触）
                - 无：从对象池获取或新建Contact实例，初始化并加入接触链表
             4. 关联Contact与刚体的ContactLink链表，更新接触计数
             注：优先遍历接触链接少的刚体，优化查找性能

#### Returns

`void`

***

### destroyOutdatedContacts()

> **destroyOutdatedContacts**(): `void`

Defined in: [constraint/contact/contact-manager.ts:180](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/contact-manager.ts#L180)

销毁过期/无效的碰撞接触。
清理无效的Contact实例，核心逻辑分两种模式：
             1. 非增量模式（incremental=false）：
                - 直接销毁所有未标记为latest的Contact
             2. 增量模式（incremental=true）：
                - 跳过休眠/静态刚体的接触（标记shouldBeSkipped=true）
                - 检查AABB是否重叠，不重叠则销毁
                - 检查碰撞规则（shouldCollide），不满足则销毁
             销毁流程：
             - 从接触链表移除
             - 触发endContact回调（若处于touching状态）
             - 从刚体的ContactLink链表移除
             - 重置Contact所有属性
             - 回收至对象池（contactPool）
             - 减少有效接触计数（numContacts）

#### Returns

`void`

***

### postSolve()

> **postSolve**(): `void`

Defined in: [constraint/contact/contact-manager.ts:352](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/contact-manager.ts#L352)

触发所有接触的postSolve回调。
遍历所有有效接触，对处于touching状态的Contact触发postSolve回调，
             用于处理碰撞求解后的自定义逻辑（如播放音效、扣血、触发特效等）

#### Returns

`void`

***

### shouldCollide()

> **shouldCollide**(`s1`, `s2`): `boolean`

Defined in: [constraint/contact/contact-manager.ts:304](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/contact-manager.ts#L304)

判断两个形状是否应该发生碰撞。
碰撞过滤规则（按优先级）：
             1. 同一刚体的形状不碰撞（r1 === r2）
             2. 两个非动态刚体不碰撞（均为静态/运动学刚体）
             3. 碰撞组/掩码不匹配则不碰撞（collisionGroup & collisionMask === 0）
             4. 关节禁止碰撞（joint.allowCollision=false）则不碰撞
             注：优先遍历关节链接少的刚体，优化查找性能

#### Parameters

##### s1

[`Shape`](../../../../shape/shape/classes/Shape.md)

第一个碰撞形状 - 非空的Shape实例

##### s2

[`Shape`](../../../../shape/shape/classes/Shape.md)

第二个碰撞形状 - 非空的Shape实例

#### Returns

`boolean`

是否允许碰撞：true=允许，false=禁止

***

### updateContacts()

> **updateContacts**(): `void`

Defined in: [constraint/contact/contact-manager.ts:341](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/contact-manager.ts#L341)

更新所有碰撞接触（对外暴露的核心入口）。
接触更新完整流程：
             1. 宽相位检测：collectPairs() 收集潜在碰撞对
             2. 创建接触：createContacts() 基于潜在碰撞对创建/更新Contact
             3. 销毁无效接触：destroyOutdatedContacts() 清理过期/无效Contact
             注：该方法是接触管理的主入口，建议每帧调用一次

#### Returns

`void`
