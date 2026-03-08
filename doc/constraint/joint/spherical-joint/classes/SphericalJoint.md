[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [constraint/joint/spherical-joint](../README.md) / SphericalJoint

# Class: SphericalJoint

Defined in: [constraint/joint/spherical-joint.ts:17](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/spherical-joint.ts#L17)

球关节实现类。
继承自Joint基类，是球关节（Spherical Joint）的具体实现，
             允许两个刚体绕共同锚点做全三维旋转（3个旋转自由度），仅限制锚点位置偏移（无平移自由度），
             支持弹簧阻尼器配置以添加旋转缓冲/复位效果，常用于模拟肩关节、髋关节、万向节等全向旋转场景，
             是刚体物理模拟中实现「球铰连接」的核心组件

## Extends

- [`Joint`](../../joint/classes/Joint.md)

## Constructors

### Constructor

> **new SphericalJoint**(`config`): `SphericalJoint`

Defined in: [constraint/joint/spherical-joint.ts:33](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/spherical-joint.ts#L33)

构造函数：初始化球关节。
核心初始化逻辑：
             1. 调用父类构造函数，指定关节类型为SPHERICAL；
             2. 克隆配置中的弹簧阻尼器实例（避免多个关节共享同一配置导致参数联动）；

#### Parameters

##### config

[`SphericalJointConfig`](../../spherical-joint-config/classes/SphericalJointConfig.md)

球关节配置实例

#### Returns

`SphericalJoint`

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

### springDamper

> **springDamper**: [`SpringDamper`](../../spring-damper/classes/SpringDamper.md)

Defined in: [constraint/joint/spherical-joint.ts:24](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/spherical-joint.ts#L24)

旋转弹簧阻尼器实例。
从配置类克隆的弹簧阻尼器实例，独立存储避免配置联动修改，
             用于为球关节的全向旋转添加弹性/阻尼效果（如肩关节的复位缓冲、球头连杆的减震），
             频率设为0时仅限制锚点偏移，无弹性约束

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

Defined in: [constraint/joint/spherical-joint.ts:52](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/spherical-joint.ts#L52)

构建球关节的约束求解器信息。
核心逻辑：
             1. 弹簧阻尼器启用且处于位置约束阶段时，直接返回（弹性约束仅在速度阶段生效）；
             2. 计算锚点间的线性偏移误差（核心约束目标：误差需为0）；
             3. 根据弹簧阻尼器配置计算CFM（Constraint Force Mixing）和ERP（Error Reduction Parameter）：
                - 启用弹簧阻尼：按频率/阻尼比计算弹性约束参数，模拟缓冲/复位效果；
                - 禁用弹簧阻尼：CFM=0，ERP使用默认值，强制锚点对齐；
             4. 构建X/Y/Z轴线性约束行：设置极大的力矩范围（±1e65536），确保锚点严格对齐；
             球关节无旋转约束，仅通过线性约束保证锚点重合，从而实现绕锚点的全向旋转

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

### getPositionSolverInfo()

> **getPositionSolverInfo**(`info`): `void`

Defined in: [constraint/joint/spherical-joint.ts:153](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/spherical-joint.ts#L153)

构建位置约束求解器信息。
调用父类基础初始化，再通过getInfo构建位置约束参数（isPositionPart=true），
             启用弹簧阻尼时该阶段会跳过，仅做刚性约束时修正锚点位置偏移

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

Defined in: [constraint/joint/spherical-joint.ts:164](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/spherical-joint.ts#L164)

获取弹簧阻尼器实例。
外部访问/修改球关节弹性参数的接口（如调整肩关节的复位力度），
             直接返回内部实例，修改会实时影响关节的物理特性

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

Defined in: [constraint/joint/spherical-joint.ts:142](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/spherical-joint.ts#L142)

构建速度约束求解器信息。
调用父类基础初始化，再通过getInfo构建速度约束参数（isPositionPart=false），
             弹簧阻尼器的弹性/阻尼效果主要在该阶段生效，保证旋转运动的平滑性

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

Defined in: [constraint/joint/joint.ts:430](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/joint.ts#L430)

同步锚点和基向量的世界坐标。
核心同步逻辑：
             1. 将本地锚点转换为刚体相对锚点；
             2. 将相对锚点转换为世界坐标；
             3. 将本地基向量矩阵转换为世界坐标；
             保证锚点和基向量与刚体运动实时同步，是约束求解的前置必要步骤

#### Returns

`void`

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`syncAnchors`](../../joint/classes/Joint.md#syncanchors)
