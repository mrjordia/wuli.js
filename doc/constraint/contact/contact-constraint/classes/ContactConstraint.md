[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [constraint/contact/contact-constraint](../README.md) / ContactConstraint

# Class: ContactConstraint

Defined in: [constraint/contact/contact-constraint.ts:16](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/contact/contact-constraint.ts#L16)

接触约束类。
物理引擎中单个碰撞接触的约束求解核心类，负责构建速度/位置约束的求解数据、同步接触流形数据、判断接触状态，
             整合了PGS求解器、接触流形（Manifold）、刚体/形状关联数据，是约束求解的核心载体

## Constructors

### Constructor

> **new ContactConstraint**(`manifold`): `ContactConstraint`

Defined in: [constraint/contact/contact-constraint.ts:83](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/contact/contact-constraint.ts#L83)

构造函数：初始化接触约束实例。
初始化时创建PGS求解器实例并关联当前约束，绑定接触流形

#### Parameters

##### manifold

[`Manifold`](../../manifold/classes/Manifold.md)

接触流形实例 - 必须传入有效的Manifold实例，作为约束数据的核心来源

#### Returns

`ContactConstraint`

## Properties

### manifold

> **manifold**: [`Manifold`](../../manifold/classes/Manifold.md)

Defined in: [constraint/contact/contact-constraint.ts:27](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/contact/contact-constraint.ts#L27)

关联的接触流形。
存储接触点、法向、穿透深度等核心数据，是约束构建的数据源

***

### positionCorrectionAlgorithm

> **positionCorrectionAlgorithm**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`POSITION_CORRECTION_ALGORITHM`](../../../../constant/enumerations/POSITION_CORRECTION_ALGORITHM.md)\>

Defined in: [constraint/contact/contact-constraint.ts:62](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/contact/contact-constraint.ts#L62)

位置修正算法类型。
标记使用的位置修正算法（如BAUMGARTE），决定位置约束的构建方式

#### Default

```ts
null
```

***

### rigidBody1

> **rigidBody1**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`RigidBody`](../../../../rigid-body/rigid-body/classes/RigidBody.md)\>

Defined in: [constraint/contact/contact-constraint.ts:34](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/contact/contact-constraint.ts#L34)

第一个碰撞刚体。
约束关联的第一个刚体，提供速度、角速度、质量等物理属性，用于约束方程构建

#### Default

```ts
null
```

***

### rigidBody2

> **rigidBody2**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`RigidBody`](../../../../rigid-body/rigid-body/classes/RigidBody.md)\>

Defined in: [constraint/contact/contact-constraint.ts:41](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/contact/contact-constraint.ts#L41)

第二个碰撞刚体。
约束关联的第二个刚体，与rigidBody1配对，共同参与约束方程计算

#### Default

```ts
null
```

***

### shape1

> **shape1**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`Shape`](../../../../shape/shape/classes/Shape.md)\>

Defined in: [constraint/contact/contact-constraint.ts:48](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/contact/contact-constraint.ts#L48)

第一个碰撞形状。
关联的第一个几何形状，提供摩擦系数、恢复系数等接触属性

#### Default

```ts
null
```

***

### shape2

> **shape2**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`Shape`](../../../../shape/shape/classes/Shape.md)\>

Defined in: [constraint/contact/contact-constraint.ts:55](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/contact/contact-constraint.ts#L55)

第二个碰撞形状。
关联的第二个几何形状，与shape1配对计算接触属性（如摩擦系数取几何平均）

#### Default

```ts
null
```

***

### solver

> **solver**: [`PgsContactConstraintSolver`](../../../solver/pgs-contact-constraint-solver/classes/PgsContactConstraintSolver.md)

Defined in: [constraint/contact/contact-constraint.ts:21](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/contact/contact-constraint.ts#L21)

PGS接触约束求解器实例。
基于投影梯度下降（PGS）算法的约束求解器，负责实际的速度/位置约束求解计算

***

### transform1

> **transform1**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`Transform`](../../../../common/transform/classes/Transform.md)\>

Defined in: [constraint/contact/contact-constraint.ts:69](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/contact/contact-constraint.ts#L69)

第一个刚体的变换矩阵。
存储刚体1的位置、旋转信息，用于计算接触点的世界坐标和相对位置

#### Default

```ts
null
```

***

### transform2

> **transform2**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`Transform`](../../../../common/transform/classes/Transform.md)\>

Defined in: [constraint/contact/contact-constraint.ts:76](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/contact/contact-constraint.ts#L76)

第二个刚体的变换矩阵。
存储刚体2的变换信息，与transform1配合计算接触点的深度和位置

#### Default

```ts
null
```

## Methods

### getPositionSolverInfo()

> **getPositionSolverInfo**(`info`): `void`

Defined in: [constraint/contact/contact-constraint.ts:181](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/contact/contact-constraint.ts#L181)

构建位置约束求解数据。
位置约束构建逻辑：
             1. 关联求解信息的刚体引用
             2. 遍历有效接触点（非disabled），仅构建法向雅克比矩阵（位置约束仅关注法向穿透）
             3. 计算rhs：穿透深度 - 线性容差（LINEAR_SLOP），确保rhs≥0
             4. 关联接触点冲量，用于位置修正的冲量累加
             注：位置约束仅处理法向穿透修正，不涉及切向/摩擦约束

#### Parameters

##### info

[`ContactSolverInfo`](../../contact-solver-info/classes/ContactSolverInfo.md)

求解信息容器 - 用于存储构建后的位置约束数据

#### Returns

`void`

***

### getVelocitySolverInfo()

> **getVelocitySolverInfo**(`timeStep`, `info`): `void`

Defined in: [constraint/contact/contact-constraint.ts:105](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/contact/contact-constraint.ts#L105)

构建速度约束求解数据（核心方法）。
速度约束构建完整流程：
             1. 关联求解信息的刚体引用
             2. 计算接触属性（摩擦系数、恢复系数取几何平均）
             3. 遍历所有接触点，过滤无效点（depth < 0）：
                - 无效点：标记disabled=true，重置冲量
                - 有效点：构建法向/切向/副法向雅克比矩阵
             4. 计算法向相对速度（rvn），根据反弹阈值设置rhs：
                - 速度低于阈值：rhs=0（无反弹）
                - 速度高于阈值：rhs=-rvn*restitution（带反弹）
             5. 若使用BAUMGARTE算法，根据穿透深度调整rhs（位置误差反馈）
             6. 关联接触点冲量到求解行，支持热启动（warmStarted）
             注：雅克比矩阵包含线速度和角速度分量，是约束方程 J·v = rhs 的核心

#### Parameters

##### timeStep

[`TimeStep`](../../../../common/time-step/classes/TimeStep.md)

时间步实例 - 包含帧时间、逆时间步等时间相关参数

##### info

[`ContactSolverInfo`](../../contact-solver-info/classes/ContactSolverInfo.md)

求解信息容器 - 用于存储构建后的约束求解数据

#### Returns

`void`

***

### isTouching()

> **isTouching**(): `boolean`

Defined in: [constraint/contact/contact-constraint.ts:224](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/contact/contact-constraint.ts#L224)

判断是否处于有效接触状态。
遍历所有接触点，只要存在一个深度≥0的有效接触点，就判定为处于接触状态，
             是判断是否需要执行约束求解的核心依据

#### Returns

`boolean`

是否有效接触：true=至少有一个接触点深度≥0，false=所有接触点无效

***

### syncManifold()

> **syncManifold**(): `void`

Defined in: [constraint/contact/contact-constraint.ts:214](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/contact/contact-constraint.ts#L214)

同步接触流形数据。
根据刚体的最新变换（transform1/transform2），更新接触流形中所有接触点的穿透深度和世界坐标，
             确保流形数据与刚体当前位置同步，为约束求解提供最新的接触数据

#### Returns

`void`
