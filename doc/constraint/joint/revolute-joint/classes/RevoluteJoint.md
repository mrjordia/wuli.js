[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [constraint/joint/revolute-joint](../README.md) / RevoluteJoint

# Class: RevoluteJoint

Defined in: [constraint/joint/revolute-joint.ts:19](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/revolute-joint.ts#L19)

旋转关节实现类。
继承自Joint基类，是旋转关节（Revolute Joint）的具体实现，
             仅允许两个刚体绕指定轴做纯旋转运动（完全限制平移和其他方向旋转自由度），
             支持旋转角度限位、弹簧阻尼缓冲，可精准模拟门轴、车轮、铰链、机械臂关节等场景的物理特性，
             是刚体物理模拟中最常用的关节类型之一

## Extends

- [`Joint`](../../joint/classes/Joint.md)

## Constructors

### Constructor

> **new RevoluteJoint**(`config`): `RevoluteJoint`

Defined in: [constraint/joint/revolute-joint.ts:50](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/revolute-joint.ts#L50)

构造函数：初始化旋转关节。
核心初始化逻辑：
             1. 调用父类构造函数，指定关节类型为REVOLUTE；
             2. 从配置中复制本地旋转轴到关节本地基向量矩阵；
             3. 基于X轴构建完整的本地基向量矩阵（适配旋转关节的单轴旋转特性）；
             4. 初始化基向量追踪器，用于后续基向量更新；
             5. 克隆配置中的弹簧阻尼器和限位驱动实例（避免配置联动）；

#### Parameters

##### config

[`RevoluteJointConfig`](../../revolute-joint-config/classes/RevoluteJointConfig.md)

旋转关节配置实例

#### Returns

`RevoluteJoint`

#### Overrides

[`Joint`](../../joint/classes/Joint.md).[`constructor`](../../joint/classes/Joint.md#constructor)

## Properties

### allowCollision

> **allowCollision**: `boolean`

Defined in: [constraint/joint/joint.ts:66](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L66)

是否允许关联刚体碰撞。
关节约束下两个刚体的碰撞开关，默认继承JointConfig的配置；禁用可避免锚点处的穿透和异常碰撞反馈

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`allowCollision`](../../joint/classes/Joint.md#allowcollision)

***

### anchor1

> **anchor1**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:114](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L114)

第一个刚体锚点的世界坐标（3维向量）。
rigidBody1锚点在世界坐标系中的位置，由relativeAnchor1经坐标变换得到，实时同步刚体运动

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`anchor1`](../../joint/classes/Joint.md#anchor1)

***

### anchor2

> **anchor2**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:120](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L120)

第二个刚体锚点的世界坐标（3维向量）。
rigidBody2锚点在世界坐标系中的位置，由relativeAnchor2经坐标变换得到，实时同步刚体运动

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`anchor2`](../../joint/classes/Joint.md#anchor2)

***

### angularError

> **angularError**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/revolute-joint.ts:27](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/revolute-joint.ts#L27)

角度误差数组。
存储旋转关节的角度误差（3维），各索引含义：
             - 0: 绕旋转轴的旋转角度（核心运动参数）
             - 1: Y轴方向角度误差（需约束为0，限制非目标轴旋转）
             - 2: Z轴方向角度误差（需约束为0，限制非目标轴旋转）

***

### appliedForce

> **appliedForce**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:150](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L150)

关节当前承受的合外力（3维向量）。
存储关节约束施加到刚体上的合外力，用于判断是否触发breakForce断裂阈值

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`appliedForce`](../../joint/classes/Joint.md#appliedforce)

***

### appliedTorque

> **appliedTorque**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:156](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L156)

关节当前承受的合外力矩（3维向量）。
存储关节约束施加到刚体上的合外力矩，用于判断是否触发breakTorque断裂阈值

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`appliedTorque`](../../joint/classes/Joint.md#appliedtorque)

***

### basis1

> **basis1**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:132](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L132)

第一个刚体基向量矩阵的世界坐标（9维数组）。
rigidBody1本地基向量矩阵变换到世界坐标系的结果，实时同步刚体旋转

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`basis1`](../../joint/classes/Joint.md#basis1)

***

### basis2

> **basis2**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:144](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L144)

第二个刚体基向量矩阵的世界坐标（9维数组）。
rigidBody2本地基向量矩阵变换到世界坐标系的结果，实时同步刚体旋转

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`basis2`](../../joint/classes/Joint.md#basis2)

***

### breakForce

> **breakForce**: `number`

Defined in: [constraint/joint/joint.ts:72](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L72)

关节断裂的力阈值。
触发关节断裂的合外力平方阈值，默认0（永不因受力断裂）；当appliedForce的模长平方超过该值时，关节会被从世界中移除

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`breakForce`](../../joint/classes/Joint.md#breakforce)

***

### breakTorque

> **breakTorque**: `number`

Defined in: [constraint/joint/joint.ts:78](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L78)

关节断裂的力矩阈值。
触发关节断裂的合外力矩平方阈值，默认0（永不因力矩断裂）；当appliedTorque的模长平方超过该值时，关节会被从世界中移除

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`breakTorque`](../../joint/classes/Joint.md#breaktorque)

***

### impulses

> **impulses**: [`JointImpulse`](../../joint-impulse/classes/JointImpulse.md)[]

Defined in: [constraint/joint/joint.ts:174](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L174)

关节约束冲量数组。
长度为SETTING_MAX_JACOBIAN_ROWS的冲量数组，每个元素对应单行约束的速度/驱动/位置冲量，预分配内存提升求解效率

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`impulses`](../../joint/classes/Joint.md#impulses)

***

### linearError

> **linearError**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/revolute-joint.ts:34](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/revolute-joint.ts#L34)

线性误差数组。
存储关节锚点的线性偏移误差（X/Y/Z轴），所有分量需约束为0，
             保证两个刚体仅绕关节轴旋转，无位置偏移（模拟铰链的固定连接特性）

***

### link1

> **link1**: [`JointLink`](../../joint-link/classes/JointLink.md)

Defined in: [constraint/joint/joint.ts:30](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L30)

关联第一个刚体的链表节点。
用于将当前关节挂载到rigidBody1的关节链表中，通过双向链表实现刚体关联关节的高效遍历

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`link1`](../../joint/classes/Joint.md#link1)

***

### link2

> **link2**: [`JointLink`](../../joint-link/classes/JointLink.md)

Defined in: [constraint/joint/joint.ts:36](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L36)

关联第二个刚体的链表节点。
用于将当前关节挂载到rigidBody2的关节链表中，与link1配合实现两个刚体的关节关联管理

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`link2`](../../joint/classes/Joint.md#link2)

***

### localAnchor1

> **localAnchor1**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:90](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L90)

第一个刚体的本地锚点（3维向量）。
相对于rigidBody1本地坐标系的关节锚点，长度为3的浮点数组，存储x/y/z坐标，由JointConfig初始化

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`localAnchor1`](../../joint/classes/Joint.md#localanchor1)

***

### localAnchor2

> **localAnchor2**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:96](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L96)

第二个刚体的本地锚点（3维向量）。
相对于rigidBody2本地坐标系的关节锚点，长度为3的浮点数组，存储x/y/z坐标，由JointConfig初始化

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`localAnchor2`](../../joint/classes/Joint.md#localanchor2)

***

### localBasis1

> **localBasis1**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:126](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L126)

第一个刚体的本地基向量矩阵（9维数组）。
相对于rigidBody1本地坐标系的3x3基向量矩阵，存储X/Y/Z轴方向，用于约束的方向计算

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`localBasis1`](../../joint/classes/Joint.md#localbasis1)

***

### localBasis2

> **localBasis2**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:138](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L138)

第二个刚体的本地基向量矩阵（9维数组）。
相对于rigidBody2本地坐标系的3x3基向量矩阵，存储X/Y/Z轴方向，用于约束的方向计算

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`localBasis2`](../../joint/classes/Joint.md#localbasis2)

***

### next

> **next**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`Joint`](../../joint/classes/Joint.md)\>

Defined in: [constraint/joint/joint.ts:168](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L168)

物理世界中关节链表的后继节点。
用于构建世界级的关节双向链表，高效遍历所有关节实例

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`next`](../../joint/classes/Joint.md#next)

***

### positionCorrectionAlgorithm

> **positionCorrectionAlgorithm**: `number` = `CONSTANT.SETTING_DEFAULT_JOINT_POSITION_CORRECTION_ALGORITHM`

Defined in: [constraint/joint/joint.ts:181](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L181)

位置修正算法类型。
指定关节位置误差的修正算法，默认值为SETTING_DEFAULT_JOINT_POSITION_CORRECTION_ALGORITHM，
             可选Baumgarte、分离冲量等算法，用于消除关节穿透

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`positionCorrectionAlgorithm`](../../joint/classes/Joint.md#positioncorrectionalgorithm)

***

### prev

> **prev**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`Joint`](../../joint/classes/Joint.md)\>

Defined in: [constraint/joint/joint.ts:162](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L162)

物理世界中关节链表的前驱节点。
用于构建世界级的关节双向链表，高效遍历所有关节实例

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`prev`](../../joint/classes/Joint.md#prev)

***

### relativeAnchor1

> **relativeAnchor1**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:102](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L102)

第一个刚体的相对锚点（3维向量）。
rigidBody1本地坐标系到锚点的相对位置，由localAnchor1经坐标变换得到，用于约束求解中的位置计算

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`relativeAnchor1`](../../joint/classes/Joint.md#relativeanchor1)

***

### relativeAnchor2

> **relativeAnchor2**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:108](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L108)

第二个刚体的相对锚点（3维向量）。
rigidBody2本地坐标系到锚点的相对位置，由localAnchor2经坐标变换得到，用于约束求解中的位置计算

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`relativeAnchor2`](../../joint/classes/Joint.md#relativeanchor2)

***

### rigidBody1

> `readonly` **rigidBody1**: [`RigidBody`](../../../../rigid-body/rigid-body/classes/RigidBody.md)

Defined in: [constraint/joint/joint.ts:54](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L54)

关节关联的第一个刚体（只读）。
关节约束的第一个目标刚体，由JointConfig初始化赋值且不可修改，是约束求解的核心刚体对象之一

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`rigidBody1`](../../joint/classes/Joint.md#rigidbody1)

***

### rigidBody2

> `readonly` **rigidBody2**: [`RigidBody`](../../../../rigid-body/rigid-body/classes/RigidBody.md)

Defined in: [constraint/joint/joint.ts:60](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L60)

关节关联的第二个刚体（只读）。
关节约束的第二个目标刚体，由JointConfig初始化赋值且不可修改；若为静态刚体则作为关节的固定端

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`rigidBody2`](../../joint/classes/Joint.md#rigidbody2)

***

### solver

> **solver**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`ConstraintSolver`](../../../solver/constraint-solver/classes/ConstraintSolver.md)\>

Defined in: [constraint/joint/joint.ts:84](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L84)

关节约束求解器实例。
根据JointConfig的solverType初始化（迭代式Pgs/直接式Direct），负责具体的约束冲量求解；可为null（未初始化时）

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`solver`](../../joint/classes/Joint.md#solver)

***

### type

> `readonly` **type**: [`JOINT_TYPE`](../../../../constant/enumerations/JOINT_TYPE.md)

Defined in: [constraint/joint/joint.ts:42](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L42)

关节类型（只读）。
标识当前关节的具体类型（如球铰、铰链、滑块等），构造时赋值且不可修改，用于约束求解时的类型区分

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`type`](../../joint/classes/Joint.md#type)

***

### world

> **world**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`World`](../../../../world/classes/World.md)\>

Defined in: [constraint/joint/joint.ts:48](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L48)

关节所属的物理世界。
关联的物理世界实例，可为null（未添加到世界时）；用于关节销毁、约束求解时的全局参数访问

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`world`](../../joint/classes/Joint.md#world)

## Accessors

### angle

#### Get Signature

> **get** **angle**(): `number`

Defined in: [constraint/joint/revolute-joint.ts:64](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/revolute-joint.ts#L64)

绕旋转轴的旋转角度

##### Returns

`number`

当前旋转角度（弧度）

#### Set Signature

> **set** **angle**(`n`): `void`

Defined in: [constraint/joint/revolute-joint.ts:82](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/revolute-joint.ts#L82)

绕旋转轴的旋转角度

##### Parameters

###### n

`number`

目标旋转角度（弧度）

##### Returns

`void`

***

### angularErrorY

#### Get Signature

> **get** **angularErrorY**(): `number`

Defined in: [constraint/joint/revolute-joint.ts:70](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/revolute-joint.ts#L70)

Y轴方向角度误差

##### Returns

`number`

Y轴角度误差值

#### Set Signature

> **set** **angularErrorY**(`n`): `void`

Defined in: [constraint/joint/revolute-joint.ts:88](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/revolute-joint.ts#L88)

Y轴方向角度误差

##### Parameters

###### n

`number`

目标Y轴角度误差值

##### Returns

`void`

***

### angularErrorZ

#### Get Signature

> **get** **angularErrorZ**(): `number`

Defined in: [constraint/joint/revolute-joint.ts:76](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/revolute-joint.ts#L76)

Z轴方向角度误差

##### Returns

`number`

Z轴角度误差值

#### Set Signature

> **set** **angularErrorZ**(`n`): `void`

Defined in: [constraint/joint/revolute-joint.ts:94](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/revolute-joint.ts#L94)

Z轴方向角度误差

##### Parameters

###### n

`number`

目标Z轴角度误差值

##### Returns

`void`

***

### linearErrorX

#### Get Signature

> **get** **linearErrorX**(): `number`

Defined in: [constraint/joint/revolute-joint.ts:100](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/revolute-joint.ts#L100)

X轴线性误差

##### Returns

`number`

X轴线性偏移误差值

#### Set Signature

> **set** **linearErrorX**(`n`): `void`

Defined in: [constraint/joint/revolute-joint.ts:118](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/revolute-joint.ts#L118)

X轴线性误差

##### Parameters

###### n

`number`

目标X轴线性误差值

##### Returns

`void`

***

### linearErrorY

#### Get Signature

> **get** **linearErrorY**(): `number`

Defined in: [constraint/joint/revolute-joint.ts:106](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/revolute-joint.ts#L106)

Y轴线性误差

##### Returns

`number`

Y轴线性偏移误差值

#### Set Signature

> **set** **linearErrorY**(`n`): `void`

Defined in: [constraint/joint/revolute-joint.ts:124](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/revolute-joint.ts#L124)

Y轴线性误差

##### Parameters

###### n

`number`

目标Y轴线性误差值

##### Returns

`void`

***

### linearErrorZ

#### Get Signature

> **get** **linearErrorZ**(): `number`

Defined in: [constraint/joint/revolute-joint.ts:112](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/revolute-joint.ts#L112)

Z轴线性误差

##### Returns

`number`

Z轴线性偏移误差值

#### Set Signature

> **set** **linearErrorZ**(`n`): `void`

Defined in: [constraint/joint/revolute-joint.ts:130](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/revolute-joint.ts#L130)

Z轴线性误差

##### Parameters

###### n

`number`

目标Z轴线性误差值

##### Returns

`void`

## Methods

### buildLocalBasesFromX()

> **buildLocalBasesFromX**(): `void`

Defined in: [constraint/joint/joint.ts:230](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L230)

基于X轴构建本地基向量矩阵。
以X轴为基准构建rigidBody1/rigidBody2的本地基向量矩阵，自动计算Y/Z轴方向，
             保证基向量的正交性，用于依赖单轴约束的关节（如铰链关节）

#### Returns

`void`

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`buildLocalBasesFromX`](../../joint/classes/Joint.md#buildlocalbasesfromx)

***

### buildLocalBasesFromX1Z2()

> **buildLocalBasesFromX1Z2**(): `void`

Defined in: [constraint/joint/joint.ts:262](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L262)

基于刚体1的X轴和刚体2的Z轴构建本地基向量矩阵。
混合两个刚体的不同轴构建基向量矩阵，解决跨刚体的约束方向对齐问题，
             用于万向节、球铰等需要多轴耦合约束的关节

#### Returns

`void`

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`buildLocalBasesFromX1Z2`](../../joint/classes/Joint.md#buildlocalbasesfromx1z2)

***

### buildLocalBasesFromXY()

> **buildLocalBasesFromXY**(): `void`

Defined in: [constraint/joint/joint.ts:247](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L247)

基于X/Y轴构建本地基向量矩阵。
以X/Y轴为基准构建rigidBody1/rigidBody2的本地基向量矩阵，通过叉乘计算Z轴方向，
             保证基向量的正交归一性，用于依赖双轴约束的关节（如滑块关节）

#### Returns

`void`

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`buildLocalBasesFromXY`](../../joint/classes/Joint.md#buildlocalbasesfromxy)

***

### buildLocalBasesFromXY1X2()

> **buildLocalBasesFromXY1X2**(): `void`

Defined in: [constraint/joint/joint.ts:290](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L290)

基于刚体1的XY轴和刚体2的X轴构建本地基向量矩阵。
适配非正交轴约束场景的基向量构建方法，保证约束方向的准确性，
             用于自定义关节或复杂耦合约束

#### Returns

`void`

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`buildLocalBasesFromXY1X2`](../../joint/classes/Joint.md#buildlocalbasesfromxy1x2)

***

### checkDestruction()

> **checkDestruction**(): `void`

Defined in: [constraint/joint/joint.ts:472](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L472)

检查关节是否满足断裂条件。
核心逻辑：
             1. 计算合外力/力矩的平方值；
             2. 若超过breakForce/breakTorque阈值，将关节从物理世界中移除；
             保证关节在受力/力矩过载时自动断裂，提升物理仿真的真实感

#### Returns

`void`

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`checkDestruction`](../../joint/classes/Joint.md#checkdestruction)

***

### computeEffectiveInertiaMoment()

> **computeEffectiveInertiaMoment**(`axisX`, `axisY`, `axisZ`): `number`

Defined in: [constraint/joint/joint.ts:389](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L389)

计算指定轴的有效转动惯量。
结合两个刚体的逆惯性张量、相对锚点位置计算有效转动惯量，是旋转约束冲量计算的核心参数

#### Parameters

##### axisX

`number`

旋转轴X分量

##### axisY

`number`

旋转轴Y分量

##### axisZ

`number`

旋转轴Z分量

#### Returns

`number`

有效转动惯量（0表示无转动惯量）

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`computeEffectiveInertiaMoment`](../../joint/classes/Joint.md#computeeffectiveinertiamoment)

***

### computeEffectiveInertiaMoment2()

> **computeEffectiveInertiaMoment2**(`axis1X`, `axis1Y`, `axis1Z`, `axis2X`, `axis2Y`, `axis2Z`): `number`

Defined in: [constraint/joint/joint.ts:411](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L411)

计算两个指定轴的有效转动惯量（双轴场景）。
适配双轴耦合约束场景的有效转动惯量计算，用于万向节、球铰等多轴旋转关节

#### Parameters

##### axis1X

`number`

第一个旋转轴X分量

##### axis1Y

`number`

第一个旋转轴Y分量

##### axis1Z

`number`

第一个旋转轴Z分量

##### axis2X

`number`

第二个旋转轴X分量

##### axis2Y

`number`

第二个旋转轴Y分量

##### axis2Z

`number`

第二个旋转轴Z分量

#### Returns

`number`

有效转动惯量（0表示无转动惯量）

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`computeEffectiveInertiaMoment2`](../../joint/classes/Joint.md#computeeffectiveinertiamoment2)

***

### getAnchor1To()

> **getAnchor1To**(`anchor`): `void`

Defined in: [constraint/joint/joint.ts:498](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L498)

获取第一个刚体锚点的世界坐标。
将anchor1的世界坐标赋值到传入的对象中，避免创建新数组，提升性能

#### Parameters

##### anchor

输出对象（包含x/y/z属性）

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

`void`

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`getAnchor1To`](../../joint/classes/Joint.md#getanchor1to)

***

### getAnchor2To()

> **getAnchor2To**(`anchor`): `void`

Defined in: [constraint/joint/joint.ts:507](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L507)

获取第二个刚体锚点的世界坐标。
将anchor2的世界坐标赋值到传入的对象中，避免创建新数组，提升性能

#### Parameters

##### anchor

输出对象（包含x/y/z属性）

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

`void`

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`getAnchor2To`](../../joint/classes/Joint.md#getanchor2to)

***

### getAngle()

> **getAngle**(): `number`

Defined in: [constraint/joint/revolute-joint.ts:415](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/revolute-joint.ts#L415)

获取当前旋转角度。
外部访问旋转角度的快捷接口，与angle getter功能一致，兼容不同调用习惯

#### Returns

`number`

当前绕旋转轴的旋转角度（弧度）

***

### getAppliedForceTo()

> **getAppliedForceTo**(`appliedForce`): `void`

Defined in: [constraint/joint/joint.ts:554](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L554)

获取关节当前承受的合外力。
将appliedForce的合外力值赋值到传入的对象中，用于外部监测关节受力状态

#### Parameters

##### appliedForce

输出对象（包含x/y/z属性）

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

`void`

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`getAppliedForceTo`](../../joint/classes/Joint.md#getappliedforceto)

***

### getAppliedTorqueTo()

> **getAppliedTorqueTo**(`appliedTorque`): `void`

Defined in: [constraint/joint/joint.ts:563](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L563)

获取关节当前承受的合外力矩。
将appliedTorque的合外力矩值赋值到传入的对象中，用于外部监测关节受力矩状态

#### Parameters

##### appliedTorque

输出对象（包含x/y/z属性）

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

`void`

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`getAppliedTorqueTo`](../../joint/classes/Joint.md#getappliedtorqueto)

***

### getAxis1To()

> **getAxis1To**(`axis`): `void`

Defined in: [constraint/joint/revolute-joint.ts:359](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/revolute-joint.ts#L359)

获取第一个刚体的世界旋转轴。
将basis1中的旋转轴世界坐标赋值到输出对象，用于物理调试或可视化

#### Parameters

##### axis

输出对象（包含x/y/z属性）

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

`void`

***

### getAxis2To()

> **getAxis2To**(`axis`): `void`

Defined in: [constraint/joint/revolute-joint.ts:368](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/revolute-joint.ts#L368)

获取第二个刚体的世界旋转轴。
将basis2中的旋转轴世界坐标赋值到输出对象，用于物理调试或可视化

#### Parameters

##### axis

输出对象（包含x/y/z属性）

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

`void`

***

### getBasis1To()

> **getBasis1To**(`basis`): `void`

Defined in: [constraint/joint/joint.ts:534](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L534)

获取第一个刚体基向量矩阵的世界坐标。
将basis1的世界坐标矩阵赋值到传入的Mat3对象中，用于外部访问基向量配置

#### Parameters

##### basis

[`Mat3`](../../../../common/mat3/classes/Mat3.md)

输出Mat3矩阵实例

#### Returns

`void`

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`getBasis1To`](../../joint/classes/Joint.md#getbasis1to)

***

### getBasis2To()

> **getBasis2To**(`basis`): `void`

Defined in: [constraint/joint/joint.ts:544](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L544)

获取第二个刚体基向量矩阵的世界坐标。
将basis2的世界坐标矩阵赋值到传入的Mat3对象中，用于外部访问基向量配置

#### Parameters

##### basis

[`Mat3`](../../../../common/mat3/classes/Mat3.md)

输出Mat3矩阵实例

#### Returns

`void`

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`getBasis2To`](../../joint/classes/Joint.md#getbasis2to)

***

### getErp()

> **getErp**(`timeStep`, `isPositionPart`): `number`

Defined in: [constraint/joint/joint.ts:369](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L369)

计算位置修正算法的ERP（Error Reduction Parameter）参数。
ERP用于控制约束误差的修正速度：
             1. 位置约束阶段返回1（全量修正）；
             2. 速度约束阶段且使用Baumgarte算法时，返回timeStep.invDt * SETTING_VELOCITY_BAUMGARTE；
             3. 其他场景返回0（不修正）；

#### Parameters

##### timeStep

[`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`TimeStep`](../../../../common/time-step/classes/TimeStep.md)\>

时间步信息（可为null）

##### isPositionPart

`boolean`

是否为位置约束阶段

#### Returns

`number`

ERP参数值（0~1）

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`getErp`](../../joint/classes/Joint.md#geterp)

***

### getInfo()

> **getInfo**(`info`, `timeStep`, `isPositionPart`): `void`

Defined in: [constraint/joint/revolute-joint.ts:145](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/revolute-joint.ts#L145)

构建旋转关节的约束求解器信息。
核心逻辑：
             1. 计算误差还原参数（erp），将线性/角度误差转换为约束修正量；
             2. 构建X/Y/Z轴线性约束行：强制约束锚点偏移为0，设置极大力矩范围（±1e65536）确保严格约束；
             3. 构建Y/Z轴角度约束行：强制约束非目标轴旋转为0，限制刚体绕非指定轴的旋转；
             4. 计算旋转驱动的有效转动惯量（模拟刚体旋转的物理特性）；
             5. 构建旋转轴约束行：配置弹簧阻尼和限位驱动，处理绕目标轴的旋转约束；
             该方法是旋转关节物理约束的核心，确保仅绕指定轴旋转且无位置偏移

#### Parameters

##### info

[`JointSolverInfo`](../../joint-solver-info/classes/JointSolverInfo.md)

待填充的求解器信息实例

##### timeStep

[`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`TimeStep`](../../../../common/time-step/classes/TimeStep.md)\>

时间步信息（位置约束阶段为null）

##### isPositionPart

`boolean`

是否为位置约束阶段

#### Returns

`void`

***

### getLimitMotor()

> **getLimitMotor**(): [`RotationalLimitMotor`](../../rotational-limit-motor/classes/RotationalLimitMotor.md)

Defined in: [constraint/joint/revolute-joint.ts:406](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/revolute-joint.ts#L406)

获取旋转限位驱动实例。
外部访问/修改旋转限位参数的接口（如限制门的开合角度），
             直接返回内部实例，修改会实时影响关节运动范围

#### Returns

[`RotationalLimitMotor`](../../rotational-limit-motor/classes/RotationalLimitMotor.md)

内部旋转限位驱动实例

***

### getLocalAnchor1To()

> **getLocalAnchor1To**(`localAnchor`): `void`

Defined in: [constraint/joint/joint.ts:516](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L516)

获取第一个刚体的本地锚点坐标。
将localAnchor1的坐标赋值到传入的对象中，用于外部访问本地锚点配置

#### Parameters

##### localAnchor

输出对象（包含x/y/z属性）

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

`void`

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`getLocalAnchor1To`](../../joint/classes/Joint.md#getlocalanchor1to)

***

### getLocalAnchor2To()

> **getLocalAnchor2To**(`localAnchor`): `void`

Defined in: [constraint/joint/joint.ts:525](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L525)

获取第二个刚体的本地锚点坐标。
将localAnchor2的坐标赋值到传入的对象中，用于外部访问本地锚点配置

#### Parameters

##### localAnchor

输出对象（包含x/y/z属性）

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

`void`

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`getLocalAnchor2To`](../../joint/classes/Joint.md#getlocalanchor2to)

***

### getLocalAxis1To()

> **getLocalAxis1To**(`axis`): `void`

Defined in: [constraint/joint/revolute-joint.ts:377](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/revolute-joint.ts#L377)

获取第一个刚体的本地旋转轴。
将localBasis1中的旋转轴本地坐标赋值到输出对象，用于配置调整

#### Parameters

##### axis

输出对象（包含x/y/z属性）

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

`void`

***

### getLocalAxis2To()

> **getLocalAxis2To**(`axis`): `void`

Defined in: [constraint/joint/revolute-joint.ts:386](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/revolute-joint.ts#L386)

获取第二个刚体的本地旋转轴。
将localBasis2中的旋转轴本地坐标赋值到输出对象，用于配置调整

#### Parameters

##### axis

输出对象（包含x/y/z属性）

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

`void`

***

### getPositionSolverInfo()

> **getPositionSolverInfo**(`info`): `void`

Defined in: [constraint/joint/revolute-joint.ts:349](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/revolute-joint.ts#L349)

构建位置约束求解器信息。
调用父类基础初始化，再通过getInfo构建位置约束参数（isPositionPart=true），
             用于修正位置/角度偏差，保证旋转约束的精准性

#### Parameters

##### info

[`JointSolverInfo`](../../joint-solver-info/classes/JointSolverInfo.md)

待填充的求解器信息实例

#### Returns

`void`

#### Overrides

[`Joint`](../../joint/classes/Joint.md).[`getPositionSolverInfo`](../../joint/classes/Joint.md#getpositionsolverinfo)

***

### getSpringDamper()

> **getSpringDamper**(): [`SpringDamper`](../../spring-damper/classes/SpringDamper.md)

Defined in: [constraint/joint/revolute-joint.ts:396](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/revolute-joint.ts#L396)

获取弹簧阻尼器实例。
外部访问/修改旋转弹性参数的接口（如调整门的缓冲力度），
             直接返回内部实例，修改会实时影响关节物理特性

#### Returns

[`SpringDamper`](../../spring-damper/classes/SpringDamper.md)

内部弹簧阻尼器实例

***

### getType()

> **getType**(): [`JOINT_TYPE`](../../../../constant/enumerations/JOINT_TYPE.md)

Defined in: [constraint/joint/joint.ts:489](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L489)

获取关节类型。
只读访问关节类型，用于约束求解器区分不同关节的处理逻辑

#### Returns

[`JOINT_TYPE`](../../../../constant/enumerations/JOINT_TYPE.md)

关节具体类型（如球铰、铰链）

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`getType`](../../joint/classes/Joint.md#gettype)

***

### getVelocitySolverInfo()

> **getVelocitySolverInfo**(`timeStep`, `info`): `void`

Defined in: [constraint/joint/revolute-joint.ts:338](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/revolute-joint.ts#L338)

构建速度约束求解器信息。
调用父类基础初始化，再通过getInfo构建速度约束参数（isPositionPart=false），
             用于修正旋转/平移的速度偏差，保证旋转运动的平滑性

#### Parameters

##### timeStep

[`TimeStep`](../../../../common/time-step/classes/TimeStep.md)

时间步信息

##### info

[`JointSolverInfo`](../../joint-solver-info/classes/JointSolverInfo.md)

待填充的求解器信息实例

#### Returns

`void`

#### Overrides

[`Joint`](../../joint/classes/Joint.md).[`getVelocitySolverInfo`](../../joint/classes/Joint.md#getvelocitysolverinfo)

***

### setSolverInfoRowAngular()

> **setSolverInfoRowAngular**(`row`, `diff`, `lm`, `mass`, `sd`, `timeStep`, `isPositionPart`): `void`

Defined in: [constraint/joint/joint.ts:342](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L342)

配置旋转约束求解器单行信息。
核心逻辑：
             1. 对角度误差进行归一化处理（-π~π）；
             2. 计算弹簧阻尼器的CFM/ERP参数；
             3. 配置驱动速度/最大冲量；
             4. 根据角度误差和限位配置，设置约束行的冲量范围、CFM、RHS等核心参数；

#### Parameters

##### row

[`JointSolverInfoRow`](../../joint-solver-info-row/classes/JointSolverInfoRow.md)

待配置的约束行实例

##### diff

`number`

旋转角度误差（当前值与目标值的差值）

##### lm

[`RotationalLimitMotor`](../../rotational-limit-motor/classes/RotationalLimitMotor.md)

旋转限位驱动配置

##### mass

`number`

约束行的有效质量

##### sd

[`SpringDamper`](../../spring-damper/classes/SpringDamper.md)

弹簧阻尼器配置

##### timeStep

[`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`TimeStep`](../../../../common/time-step/classes/TimeStep.md)\>

时间步信息（可为null）

##### isPositionPart

`boolean`

是否为位置约束阶段

#### Returns

`void`

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`setSolverInfoRowAngular`](../../joint/classes/Joint.md#setsolverinforowangular)

***

### setSolverInfoRowLinear()

> **setSolverInfoRowLinear**(`row`, `diff`, `lm`, `mass`, `sd`, `timeStep`, `isPositionPart`): `void`

Defined in: [constraint/joint/joint.ts:314](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L314)

配置平移约束求解器单行信息。
核心逻辑：
             1. 计算弹簧阻尼器的CFM/ERP参数；
             2. 配置驱动速度/最大冲量；
             3. 根据位移误差和限位配置，设置约束行的冲量范围、CFM、RHS等核心参数；

#### Parameters

##### row

[`JointSolverInfoRow`](../../joint-solver-info-row/classes/JointSolverInfoRow.md)

待配置的约束行实例

##### diff

`number`

平移位移误差（当前值与目标值的差值）

##### lm

[`TranslationalLimitMotor`](../../translational-limit-motor/classes/TranslationalLimitMotor.md)

平移限位驱动配置

##### mass

`number`

约束行的有效质量

##### sd

[`SpringDamper`](../../spring-damper/classes/SpringDamper.md)

弹簧阻尼器配置

##### timeStep

[`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`TimeStep`](../../../../common/time-step/classes/TimeStep.md)\>

时间步信息（可为null）

##### isPositionPart

`boolean`

是否为位置约束阶段

#### Returns

`void`

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`setSolverInfoRowLinear`](../../joint/classes/Joint.md#setsolverinforowlinear)

***

### syncAnchors()

> **syncAnchors**(): `void`

Defined in: [constraint/joint/revolute-joint.ts:225](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/revolute-joint.ts#L225)

同步锚点和基向量，计算角度/线性误差。
核心逻辑（旋转关节物理核心计算步骤）：
             1. 调用父类syncAnchors，同步锚点和基向量的世界坐标；
             2. 通过四元数球面插值（Slerp）计算刚体间的相对旋转，保证旋转计算的平滑性；
             3. 更新基向量追踪器的基向量矩阵，确保旋转轴始终对齐；
             4. 计算绕目标轴的旋转角度（核心运动参数）和非目标轴的角度误差（需约束为0）；
             5. 计算锚点间的线性偏移，更新linearError（需约束为0）；
             该方法是旋转关节「纯旋转、无平移」特性的核心保障，通过高精度的四元数计算确保旋转约束的准确性

#### Returns

`void`

#### Overrides

[`Joint`](../../joint/classes/Joint.md).[`syncAnchors`](../../joint/classes/Joint.md#syncanchors)
