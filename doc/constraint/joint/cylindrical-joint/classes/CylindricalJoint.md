[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [constraint/joint/cylindrical-joint](../README.md) / CylindricalJoint

# Class: CylindricalJoint

Defined in: [constraint/joint/cylindrical-joint.ts:18](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/cylindrical-joint.ts#L18)

圆柱关节实现类。
继承自Joint基类，是圆柱关节的具体实现，支持两个刚体沿指定轴的平移运动+绕该轴的旋转运动，
             封装了平移/旋转的误差计算、约束求解信息构建、锚点同步等核心逻辑，是物理引擎中圆柱约束的核心实现类

## Extends

- [`Joint`](../../joint/classes/Joint.md)

## Constructors

### Constructor

> **new CylindricalJoint**(`config`): `CylindricalJoint`

Defined in: [constraint/joint/cylindrical-joint.ts:54](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/cylindrical-joint.ts#L54)

构造函数：初始化圆柱关节。
核心初始化逻辑：
             1. 调用父类构造函数，指定关节类型为CYLINDRICAL；
             2. 拷贝配置中的本地轴到关节基向量矩阵，基于X轴构建本地基向量；
             3. 初始化基向量跟踪器，克隆配置中的弹簧阻尼/限位驱动参数（避免联动修改）；

#### Parameters

##### config

[`CylindricalJointConfig`](../../cylindrical-joint-config/classes/CylindricalJointConfig.md)

圆柱关节专属配置实例

#### Returns

`CylindricalJoint`

#### Overrides

[`Joint`](../../joint/classes/Joint.md).[`constructor`](../../joint/classes/Joint.md#constructor)

## Properties

### allowCollision

> **allowCollision**: `boolean`

Defined in: [constraint/joint/joint.ts:66](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L66)

是否允许关联刚体碰撞。
关节约束下两个刚体的碰撞开关，默认继承JointConfig的配置；禁用可避免锚点处的穿透和异常碰撞反馈

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`allowCollision`](../../joint/classes/Joint.md#allowcollision)

***

### anchor1

> **anchor1**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:114](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L114)

第一个刚体锚点的世界坐标（3维向量）。
rigidBody1锚点在世界坐标系中的位置，由relativeAnchor1经坐标变换得到，实时同步刚体运动

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`anchor1`](../../joint/classes/Joint.md#anchor1)

***

### anchor2

> **anchor2**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:120](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L120)

第二个刚体锚点的世界坐标（3维向量）。
rigidBody2锚点在世界坐标系中的位置，由relativeAnchor2经坐标变换得到，实时同步刚体运动

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`anchor2`](../../joint/classes/Joint.md#anchor2)

***

### angularError

> **angularError**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/cylindrical-joint.ts:27](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/cylindrical-joint.ts#L27)

旋转误差向量（3维）。
存储圆柱关节的旋转误差分量：
             - [0]：绕主轴的旋转角度误差；
             - [1]：Y轴旋转误差（约束轴）；
             - [2]：Z轴旋转误差（约束轴）；
             用于约束求解时的位置/速度修正

***

### appliedForce

> **appliedForce**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:150](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L150)

关节当前承受的合外力（3维向量）。
存储关节约束施加到刚体上的合外力，用于判断是否触发breakForce断裂阈值

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`appliedForce`](../../joint/classes/Joint.md#appliedforce)

***

### appliedTorque

> **appliedTorque**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:156](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L156)

关节当前承受的合外力矩（3维向量）。
存储关节约束施加到刚体上的合外力矩，用于判断是否触发breakTorque断裂阈值

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`appliedTorque`](../../joint/classes/Joint.md#appliedtorque)

***

### basis1

> **basis1**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:132](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L132)

第一个刚体基向量矩阵的世界坐标（9维数组）。
rigidBody1本地基向量矩阵变换到世界坐标系的结果，实时同步刚体旋转

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`basis1`](../../joint/classes/Joint.md#basis1)

***

### basis2

> **basis2**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:144](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L144)

第二个刚体基向量矩阵的世界坐标（9维数组）。
rigidBody2本地基向量矩阵变换到世界坐标系的结果，实时同步刚体旋转

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`basis2`](../../joint/classes/Joint.md#basis2)

***

### breakForce

> **breakForce**: `number`

Defined in: [constraint/joint/joint.ts:72](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L72)

关节断裂的力阈值。
触发关节断裂的合外力平方阈值，默认0（永不因受力断裂）；当appliedForce的模长平方超过该值时，关节会被从世界中移除

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`breakForce`](../../joint/classes/Joint.md#breakforce)

***

### breakTorque

> **breakTorque**: `number`

Defined in: [constraint/joint/joint.ts:78](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L78)

关节断裂的力矩阈值。
触发关节断裂的合外力矩平方阈值，默认0（永不因力矩断裂）；当appliedTorque的模长平方超过该值时，关节会被从世界中移除

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`breakTorque`](../../joint/classes/Joint.md#breaktorque)

***

### impulses

> **impulses**: [`JointImpulse`](../../joint-impulse/classes/JointImpulse.md)[]

Defined in: [constraint/joint/joint.ts:174](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L174)

关节约束冲量数组。
长度为SETTING_MAX_JACOBIAN_ROWS的冲量数组，每个元素对应单行约束的速度/驱动/位置冲量，预分配内存提升求解效率

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`impulses`](../../joint/classes/Joint.md#impulses)

***

### linearError

> **linearError**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/cylindrical-joint.ts:37](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/cylindrical-joint.ts#L37)

平移误差向量（3维）。
存储圆柱关节的平移误差分量：
             - [0]：沿主轴的平移距离误差；
             - [1]：Y轴平移误差（约束轴）；
             - [2]：Z轴平移误差（约束轴）；
             用于约束求解时的位置/速度修正

***

### link1

> **link1**: [`JointLink`](../../joint-link/classes/JointLink.md)

Defined in: [constraint/joint/joint.ts:30](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L30)

关联第一个刚体的链表节点。
用于将当前关节挂载到rigidBody1的关节链表中，通过双向链表实现刚体关联关节的高效遍历

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`link1`](../../joint/classes/Joint.md#link1)

***

### link2

> **link2**: [`JointLink`](../../joint-link/classes/JointLink.md)

Defined in: [constraint/joint/joint.ts:36](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L36)

关联第二个刚体的链表节点。
用于将当前关节挂载到rigidBody2的关节链表中，与link1配合实现两个刚体的关节关联管理

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`link2`](../../joint/classes/Joint.md#link2)

***

### localAnchor1

> **localAnchor1**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:90](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L90)

第一个刚体的本地锚点（3维向量）。
相对于rigidBody1本地坐标系的关节锚点，长度为3的浮点数组，存储x/y/z坐标，由JointConfig初始化

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`localAnchor1`](../../joint/classes/Joint.md#localanchor1)

***

### localAnchor2

> **localAnchor2**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:96](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L96)

第二个刚体的本地锚点（3维向量）。
相对于rigidBody2本地坐标系的关节锚点，长度为3的浮点数组，存储x/y/z坐标，由JointConfig初始化

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`localAnchor2`](../../joint/classes/Joint.md#localanchor2)

***

### localBasis1

> **localBasis1**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:126](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L126)

第一个刚体的本地基向量矩阵（9维数组）。
相对于rigidBody1本地坐标系的3x3基向量矩阵，存储X/Y/Z轴方向，用于约束的方向计算

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`localBasis1`](../../joint/classes/Joint.md#localbasis1)

***

### localBasis2

> **localBasis2**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:138](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L138)

第二个刚体的本地基向量矩阵（9维数组）。
相对于rigidBody2本地坐标系的3x3基向量矩阵，存储X/Y/Z轴方向，用于约束的方向计算

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`localBasis2`](../../joint/classes/Joint.md#localbasis2)

***

### next

> **next**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`Joint`](../../joint/classes/Joint.md)\>

Defined in: [constraint/joint/joint.ts:168](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L168)

物理世界中关节链表的后继节点。
用于构建世界级的关节双向链表，高效遍历所有关节实例

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`next`](../../joint/classes/Joint.md#next)

***

### positionCorrectionAlgorithm

> **positionCorrectionAlgorithm**: `number` = `CONSTANT.SETTING_DEFAULT_JOINT_POSITION_CORRECTION_ALGORITHM`

Defined in: [constraint/joint/joint.ts:181](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L181)

位置修正算法类型。
指定关节位置误差的修正算法，默认值为SETTING_DEFAULT_JOINT_POSITION_CORRECTION_ALGORITHM，
             可选Baumgarte、分离冲量等算法，用于消除关节穿透

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`positionCorrectionAlgorithm`](../../joint/classes/Joint.md#positioncorrectionalgorithm)

***

### prev

> **prev**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`Joint`](../../joint/classes/Joint.md)\>

Defined in: [constraint/joint/joint.ts:162](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L162)

物理世界中关节链表的前驱节点。
用于构建世界级的关节双向链表，高效遍历所有关节实例

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`prev`](../../joint/classes/Joint.md#prev)

***

### relativeAnchor1

> **relativeAnchor1**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:102](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L102)

第一个刚体的相对锚点（3维向量）。
rigidBody1本地坐标系到锚点的相对位置，由localAnchor1经坐标变换得到，用于约束求解中的位置计算

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`relativeAnchor1`](../../joint/classes/Joint.md#relativeanchor1)

***

### relativeAnchor2

> **relativeAnchor2**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint.ts:108](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L108)

第二个刚体的相对锚点（3维向量）。
rigidBody2本地坐标系到锚点的相对位置，由localAnchor2经坐标变换得到，用于约束求解中的位置计算

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`relativeAnchor2`](../../joint/classes/Joint.md#relativeanchor2)

***

### rigidBody1

> `readonly` **rigidBody1**: [`RigidBody`](../../../../rigid-body/rigid-body/classes/RigidBody.md)

Defined in: [constraint/joint/joint.ts:54](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L54)

关节关联的第一个刚体（只读）。
关节约束的第一个目标刚体，由JointConfig初始化赋值且不可修改，是约束求解的核心刚体对象之一

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`rigidBody1`](../../joint/classes/Joint.md#rigidbody1)

***

### rigidBody2

> `readonly` **rigidBody2**: [`RigidBody`](../../../../rigid-body/rigid-body/classes/RigidBody.md)

Defined in: [constraint/joint/joint.ts:60](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L60)

关节关联的第二个刚体（只读）。
关节约束的第二个目标刚体，由JointConfig初始化赋值且不可修改；若为静态刚体则作为关节的固定端

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`rigidBody2`](../../joint/classes/Joint.md#rigidbody2)

***

### solver

> **solver**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`ConstraintSolver`](../../../solver/constraint-solver/classes/ConstraintSolver.md)\>

Defined in: [constraint/joint/joint.ts:84](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L84)

关节约束求解器实例。
根据JointConfig的solverType初始化（迭代式Pgs/直接式Direct），负责具体的约束冲量求解；可为null（未初始化时）

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`solver`](../../joint/classes/Joint.md#solver)

***

### type

> `readonly` **type**: [`JOINT_TYPE`](../../../../constant/enumerations/JOINT_TYPE.md)

Defined in: [constraint/joint/joint.ts:42](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L42)

关节类型（只读）。
标识当前关节的具体类型（如球铰、铰链、滑块等），构造时赋值且不可修改，用于约束求解时的类型区分

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`type`](../../joint/classes/Joint.md#type)

***

### world

> **world**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`World`](../../../../world/classes/World.md)\>

Defined in: [constraint/joint/joint.ts:48](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L48)

关节所属的物理世界。
关联的物理世界实例，可为null（未添加到世界时）；用于关节销毁、约束求解时的全局参数访问

#### Inherited from

[`Joint`](../../joint/classes/Joint.md).[`world`](../../joint/classes/Joint.md#world)

## Accessors

### angle

#### Get Signature

> **get** **angle**(): `number`

Defined in: [constraint/joint/cylindrical-joint.ts:70](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/cylindrical-joint.ts#L70)

绕主轴的旋转角度。
获取angularError[0]，即圆柱关节绕主轴的旋转角度误差

##### Returns

`number`

#### Set Signature

> **set** **angle**(`n`): `void`

Defined in: [constraint/joint/cylindrical-joint.ts:88](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/cylindrical-joint.ts#L88)

绕主轴的旋转角度。
设置angularError[0]，手动更新圆柱关节绕主轴的旋转角度误差

##### Parameters

###### n

`number`

##### Returns

`void`

***

### angularErrorY

#### Get Signature

> **get** **angularErrorY**(): `number`

Defined in: [constraint/joint/cylindrical-joint.ts:76](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/cylindrical-joint.ts#L76)

Y轴旋转误差。
获取angularError[1]，即圆柱关节Y轴方向的旋转误差（约束轴）

##### Returns

`number`

#### Set Signature

> **set** **angularErrorY**(`n`): `void`

Defined in: [constraint/joint/cylindrical-joint.ts:94](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/cylindrical-joint.ts#L94)

Y轴旋转误差。
设置angularError[1]，手动更新圆柱关节Y轴方向的旋转误差

##### Parameters

###### n

`number`

##### Returns

`void`

***

### angularErrorZ

#### Get Signature

> **get** **angularErrorZ**(): `number`

Defined in: [constraint/joint/cylindrical-joint.ts:82](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/cylindrical-joint.ts#L82)

Z轴旋转误差。
获取angularError[2]，即圆柱关节Z轴方向的旋转误差（约束轴）

##### Returns

`number`

#### Set Signature

> **set** **angularErrorZ**(`n`): `void`

Defined in: [constraint/joint/cylindrical-joint.ts:100](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/cylindrical-joint.ts#L100)

Z轴旋转误差。
设置angularError[2]，手动更新圆柱关节Z轴方向的旋转误差

##### Parameters

###### n

`number`

##### Returns

`void`

***

### linearErrorY

#### Get Signature

> **get** **linearErrorY**(): `number`

Defined in: [constraint/joint/cylindrical-joint.ts:112](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/cylindrical-joint.ts#L112)

Y轴平移误差。
获取linearError[1]，即圆柱关节Y轴方向的平移误差（约束轴）

##### Returns

`number`

#### Set Signature

> **set** **linearErrorY**(`n`): `void`

Defined in: [constraint/joint/cylindrical-joint.ts:130](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/cylindrical-joint.ts#L130)

Y轴平移误差。
设置linearError[1]，手动更新圆柱关节Y轴方向的平移误差

##### Parameters

###### n

`number`

##### Returns

`void`

***

### linearErrorZ

#### Get Signature

> **get** **linearErrorZ**(): `number`

Defined in: [constraint/joint/cylindrical-joint.ts:118](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/cylindrical-joint.ts#L118)

Z轴平移误差。
获取linearError[2]，即圆柱关节Z轴方向的平移误差（约束轴）

##### Returns

`number`

#### Set Signature

> **set** **linearErrorZ**(`n`): `void`

Defined in: [constraint/joint/cylindrical-joint.ts:136](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/cylindrical-joint.ts#L136)

Z轴平移误差。
设置linearError[2]，手动更新圆柱关节Z轴方向的平移误差。

##### Parameters

###### n

`number`

##### Returns

`void`

***

### translation

#### Get Signature

> **get** **translation**(): `number`

Defined in: [constraint/joint/cylindrical-joint.ts:106](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/cylindrical-joint.ts#L106)

沿主轴的平移距离。
获取linearError[0]，即圆柱关节沿主轴的平移距离误差

##### Returns

`number`

#### Set Signature

> **set** **translation**(`n`): `void`

Defined in: [constraint/joint/cylindrical-joint.ts:124](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/cylindrical-joint.ts#L124)

沿主轴的平移距离。
设置linearError[0]，手动更新圆柱关节沿主轴的平移距离误差

##### Parameters

###### n

`number`

##### Returns

`void`

## Methods

### buildLocalBasesFromX()

> **buildLocalBasesFromX**(): `void`

Defined in: [constraint/joint/joint.ts:230](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L230)

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

Defined in: [constraint/joint/joint.ts:262](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L262)

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

Defined in: [constraint/joint/joint.ts:247](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L247)

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

Defined in: [constraint/joint/joint.ts:290](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L290)

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

Defined in: [constraint/joint/joint.ts:472](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L472)

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

Defined in: [constraint/joint/joint.ts:389](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L389)

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

Defined in: [constraint/joint/joint.ts:411](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L411)

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

Defined in: [constraint/joint/joint.ts:498](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L498)

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

Defined in: [constraint/joint/joint.ts:507](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L507)

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

Defined in: [constraint/joint/cylindrical-joint.ts:430](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/cylindrical-joint.ts#L430)

获取绕主轴的旋转角度。
兼容式getter方法，与angle属性getter功能一致，适配外部调用习惯

#### Returns

`number`

旋转角度误差（angularError[0]）

***

### getAppliedForceTo()

> **getAppliedForceTo**(`appliedForce`): `void`

Defined in: [constraint/joint/joint.ts:554](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L554)

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

Defined in: [constraint/joint/joint.ts:563](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L563)

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

> **getAxis1To**(`out`): `void`

Defined in: [constraint/joint/cylindrical-joint.ts:358](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/cylindrical-joint.ts#L358)

获取第一个刚体关节轴的世界坐标。
将basis1[0-2]（主轴世界坐标）赋值到输出对象，用于外部访问关节轴的实时位置

#### Parameters

##### out

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

> **getAxis2To**(`out`): `void`

Defined in: [constraint/joint/cylindrical-joint.ts:367](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/cylindrical-joint.ts#L367)

获取第二个刚体关节轴的世界坐标。
将basis2[0-2]（主轴世界坐标）赋值到输出对象，用于外部访问关节轴的实时位置

#### Parameters

##### out

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

Defined in: [constraint/joint/joint.ts:534](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L534)

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

Defined in: [constraint/joint/joint.ts:544](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L544)

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

Defined in: [constraint/joint/joint.ts:369](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L369)

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

Defined in: [constraint/joint/cylindrical-joint.ts:154](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/cylindrical-joint.ts#L154)

构建圆柱关节的约束求解器信息。
核心逻辑：
             1. 计算ERP参数，初始化平移/旋转误差的RHS（右手边）值；
             2. 计算平移/旋转约束的有效质量；
             3. 构建平移约束行（主轴平移+Y/Z轴约束）：
                - 主轴平移：配置限位驱动、弹簧阻尼、雅可比矩阵；
                - Y/Z轴平移：固定约束（无限冲量范围），仅设置RHS和雅可比矩阵；
             4. 构建旋转约束行（主轴旋转+Y/Z轴约束）：
                - 主轴旋转：配置限位驱动、弹簧阻尼、雅可比矩阵；
                - Y/Z轴旋转：固定约束（无限冲量范围），仅设置RHS和雅可比矩阵；
             是圆柱关节约束求解的核心参数构建方法

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

Defined in: [constraint/joint/joint.ts:516](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L516)

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

Defined in: [constraint/joint/joint.ts:525](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L525)

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

> **getLocalAxis1To**(`out`): `void`

Defined in: [constraint/joint/cylindrical-joint.ts:376](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/cylindrical-joint.ts#L376)

获取第一个刚体的本地关节轴。
将localBasis1[0-2]（本地主轴）赋值到输出对象，用于外部访问本地轴配置

#### Parameters

##### out

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

> **getLocalAxis2To**(`out`): `void`

Defined in: [constraint/joint/cylindrical-joint.ts:385](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/cylindrical-joint.ts#L385)

获取第二个刚体的本地关节轴。
将localBasis2[0-2]（本地主轴）赋值到输出对象，用于外部访问本地轴配置

#### Parameters

##### out

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

Defined in: [constraint/joint/cylindrical-joint.ts:348](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/cylindrical-joint.ts#L348)

构建位置约束求解器信息。
调用父类基础初始化方法，再调用getInfo构建位置约束的具体参数（isPositionPart=true，timeStep=null）

#### Parameters

##### info

[`JointSolverInfo`](../../joint-solver-info/classes/JointSolverInfo.md)

待填充的求解器信息实例

#### Returns

`void`

#### Overrides

[`Joint`](../../joint/classes/Joint.md).[`getPositionSolverInfo`](../../joint/classes/Joint.md#getpositionsolverinfo)

***

### getRotationalLimitMotor()

> **getRotationalLimitMotor**(): [`RotationalLimitMotor`](../../rotational-limit-motor/classes/RotationalLimitMotor.md)

Defined in: [constraint/joint/cylindrical-joint.ts:421](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/cylindrical-joint.ts#L421)

获取旋转限位驱动配置。
返回内部克隆的旋转限位驱动实例，支持外部修改限位/驱动参数（如调整限位角度/驱动速度）

#### Returns

[`RotationalLimitMotor`](../../rotational-limit-motor/classes/RotationalLimitMotor.md)

旋转限位驱动实例

***

### getRotationalSpringDamper()

> **getRotationalSpringDamper**(): [`SpringDamper`](../../spring-damper/classes/SpringDamper.md)

Defined in: [constraint/joint/cylindrical-joint.ts:403](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/cylindrical-joint.ts#L403)

获取旋转弹簧阻尼器配置。
返回内部克隆的旋转弹簧阻尼器实例，支持外部修改参数（如调整频率/阻尼比）

#### Returns

[`SpringDamper`](../../spring-damper/classes/SpringDamper.md)

旋转弹簧阻尼器实例

***

### getTranslation()

> **getTranslation**(): `number`

Defined in: [constraint/joint/cylindrical-joint.ts:439](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/cylindrical-joint.ts#L439)

获取沿主轴的平移距离。
兼容式getter方法，与translation属性getter功能一致，适配外部调用习惯

#### Returns

`number`

平移距离误差（linearError[0]）

***

### getTranslationalLimitMotor()

> **getTranslationalLimitMotor**(): [`TranslationalLimitMotor`](../../translational-limit-motor/classes/TranslationalLimitMotor.md)

Defined in: [constraint/joint/cylindrical-joint.ts:412](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/cylindrical-joint.ts#L412)

获取平移限位驱动配置。
返回内部克隆的平移限位驱动实例，支持外部修改限位/驱动参数（如调整限位范围/驱动速度）

#### Returns

[`TranslationalLimitMotor`](../../translational-limit-motor/classes/TranslationalLimitMotor.md)

平移限位驱动实例

***

### getTranslationalSpringDamper()

> **getTranslationalSpringDamper**(): [`SpringDamper`](../../spring-damper/classes/SpringDamper.md)

Defined in: [constraint/joint/cylindrical-joint.ts:394](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/cylindrical-joint.ts#L394)

获取平移弹簧阻尼器配置。
返回内部克隆的平移弹簧阻尼器实例，支持外部修改参数（如调整频率/阻尼比）

#### Returns

[`SpringDamper`](../../spring-damper/classes/SpringDamper.md)

平移弹簧阻尼器实例

***

### getType()

> **getType**(): [`JOINT_TYPE`](../../../../constant/enumerations/JOINT_TYPE.md)

Defined in: [constraint/joint/joint.ts:489](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L489)

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

Defined in: [constraint/joint/cylindrical-joint.ts:338](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/cylindrical-joint.ts#L338)

构建速度约束求解器信息。
调用父类基础初始化方法，再调用getInfo构建速度约束的具体参数（isPositionPart=false）

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

Defined in: [constraint/joint/joint.ts:342](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L342)

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

Defined in: [constraint/joint/joint.ts:314](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint.ts#L314)

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

Defined in: [constraint/joint/cylindrical-joint.ts:228](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/cylindrical-joint.ts#L228)

同步锚点和基向量，并计算平移/旋转误差。
核心逻辑：
             1. 调用父类syncAnchors方法，同步锚点和基向量的世界坐标；
             2. 计算两个刚体基向量的旋转差值，通过四元数插值修正基向量跟踪器；
             3. 计算旋转误差（绕主轴/Y/Z轴）和平移误差（沿主轴/Y/Z轴）；
             4. 更新angularError和linearError，为约束求解提供误差数据；
             是圆柱关节约束求解的前置核心步骤，保证误差计算的实时性

#### Returns

`void`

#### Overrides

[`Joint`](../../joint/classes/Joint.md).[`syncAnchors`](../../joint/classes/Joint.md#syncanchors)
