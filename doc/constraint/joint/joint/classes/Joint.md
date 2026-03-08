[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [constraint/joint/joint](../README.md) / Joint

# Class: Joint

Defined in: [constraint/joint/joint.ts:25](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L25)

物理引擎核心关节类。
所有关节类型（如球铰、铰链、滑块关节）的基类，封装关节的核心属性、约束求解逻辑、锚点/基向量同步、限位/驱动配置等能力，
             是连接两个刚体并施加运动约束的核心抽象，负责约束求解器的绑定、冲量计算、位置/速度约束的构建与执行

## Extended by

- [`CylindricalJoint`](../../cylindrical-joint/classes/CylindricalJoint.md)
- [`GenericJoint`](../../generic-joint/classes/GenericJoint.md)
- [`PrismaticJoint`](../../prismatic-joint/classes/PrismaticJoint.md)
- [`RagdollJoint`](../../ragdoll-joint/classes/RagdollJoint.md)
- [`RevoluteJoint`](../../revolute-joint/classes/RevoluteJoint.md)
- [`SphericalJoint`](../../spherical-joint/classes/SphericalJoint.md)
- [`UniversalJoint`](../../universal-joint/classes/UniversalJoint.md)

## Constructors

### Constructor

> **new Joint**(`config`, `type`): `Joint`

Defined in: [constraint/joint/joint.ts:200](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L200)

构造函数：初始化关节基类。
核心初始化逻辑：
             1. 创建关联两个刚体的JointLink节点；
             2. 赋值关节类型、关联刚体、碰撞开关、断裂阈值等基础参数；
             3. 根据solverType初始化约束求解器（Pgs/Direct）；
             4. 拷贝本地锚点数据，预分配冲量数组并初始化所有JointImpulse实例；

#### Parameters

##### config

[`JointConfig`](../../joint-config/classes/JointConfig.md)

关节配置实例，包含刚体关联、锚点、求解器类型等核心参数

##### type

[`JOINT_TYPE`](../../../../constant/enumerations/JOINT_TYPE.md)

关节具体类型（如球铰、铰链）

#### Returns

`Joint`

## Properties

### allowCollision

> **allowCollision**: `boolean`

Defined in: [constraint/joint/joint.ts:66](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L66)

是否允许关联刚体碰撞。
关节约束下两个刚体的碰撞开关，默认继承JointConfig的配置；禁用可避免锚点处的穿透和异常碰撞反馈

***

### anchor1

> **anchor1**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:114](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L114)

第一个刚体锚点的世界坐标（3维向量）。
rigidBody1锚点在世界坐标系中的位置，由relativeAnchor1经坐标变换得到，实时同步刚体运动

***

### anchor2

> **anchor2**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:120](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L120)

第二个刚体锚点的世界坐标（3维向量）。
rigidBody2锚点在世界坐标系中的位置，由relativeAnchor2经坐标变换得到，实时同步刚体运动

***

### appliedForce

> **appliedForce**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:150](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L150)

关节当前承受的合外力（3维向量）。
存储关节约束施加到刚体上的合外力，用于判断是否触发breakForce断裂阈值

***

### appliedTorque

> **appliedTorque**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:156](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L156)

关节当前承受的合外力矩（3维向量）。
存储关节约束施加到刚体上的合外力矩，用于判断是否触发breakTorque断裂阈值

***

### basis1

> **basis1**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:132](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L132)

第一个刚体基向量矩阵的世界坐标（9维数组）。
rigidBody1本地基向量矩阵变换到世界坐标系的结果，实时同步刚体旋转

***

### basis2

> **basis2**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:144](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L144)

第二个刚体基向量矩阵的世界坐标（9维数组）。
rigidBody2本地基向量矩阵变换到世界坐标系的结果，实时同步刚体旋转

***

### breakForce

> **breakForce**: `number`

Defined in: [constraint/joint/joint.ts:72](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L72)

关节断裂的力阈值。
触发关节断裂的合外力平方阈值，默认0（永不因受力断裂）；当appliedForce的模长平方超过该值时，关节会被从世界中移除

***

### breakTorque

> **breakTorque**: `number`

Defined in: [constraint/joint/joint.ts:78](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L78)

关节断裂的力矩阈值。
触发关节断裂的合外力矩平方阈值，默认0（永不因力矩断裂）；当appliedTorque的模长平方超过该值时，关节会被从世界中移除

***

### impulses

> **impulses**: [`JointImpulse`](../../joint-impulse/classes/JointImpulse.md)[]

Defined in: [constraint/joint/joint.ts:174](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L174)

关节约束冲量数组。
长度为SETTING_MAX_JACOBIAN_ROWS的冲量数组，每个元素对应单行约束的速度/驱动/位置冲量，预分配内存提升求解效率

***

### link1

> **link1**: [`JointLink`](../../joint-link/classes/JointLink.md)

Defined in: [constraint/joint/joint.ts:30](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L30)

关联第一个刚体的链表节点。
用于将当前关节挂载到rigidBody1的关节链表中，通过双向链表实现刚体关联关节的高效遍历

***

### link2

> **link2**: [`JointLink`](../../joint-link/classes/JointLink.md)

Defined in: [constraint/joint/joint.ts:36](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L36)

关联第二个刚体的链表节点。
用于将当前关节挂载到rigidBody2的关节链表中，与link1配合实现两个刚体的关节关联管理

***

### localAnchor1

> **localAnchor1**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:90](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L90)

第一个刚体的本地锚点（3维向量）。
相对于rigidBody1本地坐标系的关节锚点，长度为3的浮点数组，存储x/y/z坐标，由JointConfig初始化

***

### localAnchor2

> **localAnchor2**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:96](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L96)

第二个刚体的本地锚点（3维向量）。
相对于rigidBody2本地坐标系的关节锚点，长度为3的浮点数组，存储x/y/z坐标，由JointConfig初始化

***

### localBasis1

> **localBasis1**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:126](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L126)

第一个刚体的本地基向量矩阵（9维数组）。
相对于rigidBody1本地坐标系的3x3基向量矩阵，存储X/Y/Z轴方向，用于约束的方向计算

***

### localBasis2

> **localBasis2**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:138](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L138)

第二个刚体的本地基向量矩阵（9维数组）。
相对于rigidBody2本地坐标系的3x3基向量矩阵，存储X/Y/Z轴方向，用于约束的方向计算

***

### next

> **next**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<`Joint`\>

Defined in: [constraint/joint/joint.ts:168](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L168)

物理世界中关节链表的后继节点。
用于构建世界级的关节双向链表，高效遍历所有关节实例

***

### positionCorrectionAlgorithm

> **positionCorrectionAlgorithm**: `number` = `CONSTANT.SETTING_DEFAULT_JOINT_POSITION_CORRECTION_ALGORITHM`

Defined in: [constraint/joint/joint.ts:181](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L181)

位置修正算法类型。
指定关节位置误差的修正算法，默认值为SETTING_DEFAULT_JOINT_POSITION_CORRECTION_ALGORITHM，
             可选Baumgarte、分离冲量等算法，用于消除关节穿透

***

### prev

> **prev**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<`Joint`\>

Defined in: [constraint/joint/joint.ts:162](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L162)

物理世界中关节链表的前驱节点。
用于构建世界级的关节双向链表，高效遍历所有关节实例

***

### relativeAnchor1

> **relativeAnchor1**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:102](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L102)

第一个刚体的相对锚点（3维向量）。
rigidBody1本地坐标系到锚点的相对位置，由localAnchor1经坐标变换得到，用于约束求解中的位置计算

***

### relativeAnchor2

> **relativeAnchor2**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:108](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L108)

第二个刚体的相对锚点（3维向量）。
rigidBody2本地坐标系到锚点的相对位置，由localAnchor2经坐标变换得到，用于约束求解中的位置计算

***

### rigidBody1

> `readonly` **rigidBody1**: [`RigidBody`](../../../../rigid-body/rigid-body/classes/RigidBody.md)

Defined in: [constraint/joint/joint.ts:54](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L54)

关节关联的第一个刚体（只读）。
关节约束的第一个目标刚体，由JointConfig初始化赋值且不可修改，是约束求解的核心刚体对象之一

***

### rigidBody2

> `readonly` **rigidBody2**: [`RigidBody`](../../../../rigid-body/rigid-body/classes/RigidBody.md)

Defined in: [constraint/joint/joint.ts:60](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L60)

关节关联的第二个刚体（只读）。
关节约束的第二个目标刚体，由JointConfig初始化赋值且不可修改；若为静态刚体则作为关节的固定端

***

### solver

> **solver**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`ConstraintSolver`](../../../solver/constraint-solver/classes/ConstraintSolver.md)\>

Defined in: [constraint/joint/joint.ts:84](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L84)

关节约束求解器实例。
根据JointConfig的solverType初始化（迭代式Pgs/直接式Direct），负责具体的约束冲量求解；可为null（未初始化时）

***

### type

> `readonly` **type**: [`JOINT_TYPE`](../../../../constant/enumerations/JOINT_TYPE.md)

Defined in: [constraint/joint/joint.ts:42](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L42)

关节类型（只读）。
标识当前关节的具体类型（如球铰、铰链、滑块等），构造时赋值且不可修改，用于约束求解时的类型区分

***

### world

> **world**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`World`](../../../../world/classes/World.md)\>

Defined in: [constraint/joint/joint.ts:48](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L48)

关节所属的物理世界。
关联的物理世界实例，可为null（未添加到世界时）；用于关节销毁、约束求解时的全局参数访问

## Methods

### buildLocalBasesFromX()

> **buildLocalBasesFromX**(): `void`

Defined in: [constraint/joint/joint.ts:230](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L230)

基于X轴构建本地基向量矩阵。
以X轴为基准构建rigidBody1/rigidBody2的本地基向量矩阵，自动计算Y/Z轴方向，
             保证基向量的正交性，用于依赖单轴约束的关节（如铰链关节）

#### Returns

`void`

***

### buildLocalBasesFromX1Z2()

> **buildLocalBasesFromX1Z2**(): `void`

Defined in: [constraint/joint/joint.ts:262](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L262)

基于刚体1的X轴和刚体2的Z轴构建本地基向量矩阵。
混合两个刚体的不同轴构建基向量矩阵，解决跨刚体的约束方向对齐问题，
             用于万向节、球铰等需要多轴耦合约束的关节

#### Returns

`void`

***

### buildLocalBasesFromXY()

> **buildLocalBasesFromXY**(): `void`

Defined in: [constraint/joint/joint.ts:247](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L247)

基于X/Y轴构建本地基向量矩阵。
以X/Y轴为基准构建rigidBody1/rigidBody2的本地基向量矩阵，通过叉乘计算Z轴方向，
             保证基向量的正交归一性，用于依赖双轴约束的关节（如滑块关节）

#### Returns

`void`

***

### buildLocalBasesFromXY1X2()

> **buildLocalBasesFromXY1X2**(): `void`

Defined in: [constraint/joint/joint.ts:290](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L290)

基于刚体1的XY轴和刚体2的X轴构建本地基向量矩阵。
适配非正交轴约束场景的基向量构建方法，保证约束方向的准确性，
             用于自定义关节或复杂耦合约束

#### Returns

`void`

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

***

### getPositionSolverInfo()

> **getPositionSolverInfo**(`info`): `void`

Defined in: [constraint/joint/joint.ts:459](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L459)

构建位置约束求解器信息。
初始化位置约束求解的基础信息（关联刚体、约束行数量），子类需重写此方法补充具体的约束行配置

#### Parameters

##### info

[`JointSolverInfo`](../../joint-solver-info/classes/JointSolverInfo.md)

待填充的求解器信息实例

#### Returns

`void`

***

### getType()

> **getType**(): [`JOINT_TYPE`](../../../../constant/enumerations/JOINT_TYPE.md)

Defined in: [constraint/joint/joint.ts:489](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L489)

获取关节类型。
只读访问关节类型，用于约束求解器区分不同关节的处理逻辑

#### Returns

[`JOINT_TYPE`](../../../../constant/enumerations/JOINT_TYPE.md)

关节具体类型（如球铰、铰链）

***

### getVelocitySolverInfo()

> **getVelocitySolverInfo**(`timeStep`, `info`): `void`

Defined in: [constraint/joint/joint.ts:448](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L448)

构建速度约束求解器信息。
初始化速度约束求解的基础信息（关联刚体、约束行数量），子类需重写此方法补充具体的约束行配置

#### Parameters

##### timeStep

[`TimeStep`](../../../../common/time-step/classes/TimeStep.md)

时间步信息

##### info

[`JointSolverInfo`](../../joint-solver-info/classes/JointSolverInfo.md)

待填充的求解器信息实例

#### Returns

`void`

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

***

### syncAnchors()

> **syncAnchors**(): `void`

Defined in: [constraint/joint/joint.ts:430](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L430)

同步锚点和基向量的世界坐标。
核心同步逻辑：
             1. 将本地锚点转换为刚体相对锚点；
             2. 将相对锚点转换为世界坐标；
             3. 将本地基向量矩阵转换为世界坐标；
             保证锚点和基向量与刚体运动实时同步，是约束求解的前置必要步骤

#### Returns

`void`
