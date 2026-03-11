[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [constraint/joint/ragdoll-joint-config](../README.md) / RagdollJointConfig

# Class: RagdollJointConfig

Defined in: [constraint/joint/ragdoll-joint-config.ts:15](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/ragdoll-joint-config.ts#L15)

布娃娃关节配置类。
继承自JointConfig，是布娃娃关节（Ragdoll Joint）的专属配置容器，
             布娃娃关节专为角色物理模拟设计，支持「扭转（Twist）+ 双轴摆动（Swing）」的人体关节运动约束，
             可精准模拟肩膀、髋关节、膝关节等人体关节的旋转范围和弹性效果，
             是创建角色布娃娃物理系统的核心配置载体

## Extends

- [`JointConfig`](../../joint-config/classes/JointConfig.md)

## Constructors

### Constructor

> **new RagdollJointConfig**(): `RagdollJointConfig`

#### Returns

`RagdollJointConfig`

#### Inherited from

[`JointConfig`](../../joint-config/classes/JointConfig.md).[`constructor`](../../joint-config/classes/JointConfig.md#constructor)

## Properties

### allowCollision

> **allowCollision**: `boolean` = `false`

Defined in: [constraint/joint/joint-config.ts:40](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/joint-config.ts#L40)

是否允许关联的两个刚体碰撞。
关节约束下刚体的碰撞开关，默认值false（禁止碰撞），避免关节锚点处的穿透和异常碰撞反馈

#### Inherited from

[`JointConfig`](../../joint-config/classes/JointConfig.md).[`allowCollision`](../../joint-config/classes/JointConfig.md#allowcollision)

***

### breakForce

> **breakForce**: `number` = `0`

Defined in: [constraint/joint/joint-config.ts:60](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/joint-config.ts#L60)

关节断裂的力阈值。
触发关节断裂的合外力阈值，默认值0（永不因受力断裂），当关节承受的力超过该值时关节会断开

#### Inherited from

[`JointConfig`](../../joint-config/classes/JointConfig.md).[`breakForce`](../../joint-config/classes/JointConfig.md#breakforce)

***

### breakTorque

> **breakTorque**: `number` = `0`

Defined in: [constraint/joint/joint-config.ts:66](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/joint-config.ts#L66)

关节断裂的力矩阈值。
触发关节断裂的合外力矩阈值，默认值0（永不因力矩断裂），当关节承受的力矩超过该值时关节会断开

#### Inherited from

[`JointConfig`](../../joint-config/classes/JointConfig.md).[`breakTorque`](../../joint-config/classes/JointConfig.md#breaktorque)

***

### localAnchor1

> **localAnchor1**: [`Vec3`](../../../../common/vec3/classes/Vec3.md)

Defined in: [constraint/joint/joint-config.ts:28](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/joint-config.ts#L28)

第一个刚体的本地锚点坐标。
相对于rigidBody1本地坐标系的关节锚点，初始值为零向量，通过initialize方法从世界锚点转换而来

#### Inherited from

[`JointConfig`](../../joint-config/classes/JointConfig.md).[`localAnchor1`](../../joint-config/classes/JointConfig.md#localanchor1)

***

### localAnchor2

> **localAnchor2**: [`Vec3`](../../../../common/vec3/classes/Vec3.md)

Defined in: [constraint/joint/joint-config.ts:34](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/joint-config.ts#L34)

第二个刚体的本地锚点坐标。
相对于rigidBody2本地坐标系的关节锚点，初始值为零向量，通过initialize方法从世界锚点转换而来

#### Inherited from

[`JointConfig`](../../joint-config/classes/JointConfig.md).[`localAnchor2`](../../joint-config/classes/JointConfig.md#localanchor2)

***

### localSwingAxis1

> **localSwingAxis1**: [`Vec3`](../../../../common/vec3/classes/Vec3.md)

Defined in: [constraint/joint/ragdoll-joint-config.ts:35](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/ragdoll-joint-config.ts#L35)

第一个刚体的本地摆动轴。
相对于rigidBody1本地坐标系的摆动参考轴（如人体关节的左右摆动轴），默认值(0,1,0)（Y轴）；
             摆动轴作为双轴摆动的基准，结合maxSwingAngle1/2限制摆动范围（如肩膀的上下/左右摆动）

***

### localTwistAxis1

> **localTwistAxis1**: [`Vec3`](../../../../common/vec3/classes/Vec3.md)

Defined in: [constraint/joint/ragdoll-joint-config.ts:21](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/ragdoll-joint-config.ts#L21)

第一个刚体的本地扭转轴。
相对于rigidBody1本地坐标系的扭转旋转轴（如人体关节的前后旋转轴），默认值(1,0,0)（X轴）；
             扭转轴是布娃娃关节的主旋转轴，对应人体关节的「拧转」动作（如胳膊绕上臂轴旋转）

***

### localTwistAxis2

> **localTwistAxis2**: [`Vec3`](../../../../common/vec3/classes/Vec3.md)

Defined in: [constraint/joint/ragdoll-joint-config.ts:28](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/ragdoll-joint-config.ts#L28)

第二个刚体的本地扭转轴。
相对于rigidBody2本地坐标系的扭转旋转轴，默认值(1,0,0)（X轴）；
             初始化时由世界扭转轴转换而来，需与localTwistAxis1对齐，保证扭转旋转的一致性

***

### maxSwingAngle1

> **maxSwingAngle1**: `number` = `3.14159265358979`

Defined in: [constraint/joint/ragdoll-joint-config.ts:63](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/ragdoll-joint-config.ts#L63)

第一摆动轴最大角度。
沿摆动参考轴的第一方向最大摆动角度，默认值π（180°）；
             用于限制关节单侧摆动范围（如肩关节向上摆动的最大角度），单位为弧度

***

### maxSwingAngle2

> **maxSwingAngle2**: `number` = `3.14159265358979`

Defined in: [constraint/joint/ragdoll-joint-config.ts:70](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/ragdoll-joint-config.ts#L70)

第二摆动轴最大角度。
沿摆动参考轴垂直方向的第二方向最大摆动角度，默认值π（180°）；
             与maxSwingAngle1配合形成双轴摆动范围（如肩关节的上下+左右摆动限制），单位为弧度

***

### positionCorrectionAlgorithm

> **positionCorrectionAlgorithm**: `number` = `CONSTANT.SETTING_DEFAULT_JOINT_POSITION_CORRECTION_ALGORITHM`

Defined in: [constraint/joint/joint-config.ts:54](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/joint-config.ts#L54)

位置修正算法类型。
指定关节位置误差的修正算法，默认值为CONSTANT.SETTING_DEFAULT_JOINT_POSITION_CORRECTION_ALGORITHM，
             可选值包括Baumgarte、分离冲量、NGS等算法，用于消除关节穿透

#### Inherited from

[`JointConfig`](../../joint-config/classes/JointConfig.md).[`positionCorrectionAlgorithm`](../../joint-config/classes/JointConfig.md#positioncorrectionalgorithm)

***

### rigidBody1

> **rigidBody1**: [`RigidBody`](../../../../rigid-body/rigid-body/classes/RigidBody.md)

Defined in: [constraint/joint/joint-config.ts:16](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/joint-config.ts#L16)

关节关联的第一个刚体。
关节约束的第一个目标刚体，非可选（通过!断言确保赋值），与rigidBody2共同构成关节约束的两个主体

#### Inherited from

[`JointConfig`](../../joint-config/classes/JointConfig.md).[`rigidBody1`](../../joint-config/classes/JointConfig.md#rigidbody1)

***

### rigidBody2

> **rigidBody2**: [`RigidBody`](../../../../rigid-body/rigid-body/classes/RigidBody.md)

Defined in: [constraint/joint/joint-config.ts:22](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/joint-config.ts#L22)

关节关联的第二个刚体。
关节约束的第二个目标刚体，非可选（通过!断言确保赋值），若为静态刚体则作为关节的固定端

#### Inherited from

[`JointConfig`](../../joint-config/classes/JointConfig.md).[`rigidBody2`](../../joint-config/classes/JointConfig.md#rigidbody2)

***

### solverType

> **solverType**: `number` = `CONSTANT.SETTING_DEFAULT_JOINT_CONSTRAINT_SOLVER_TYPE`

Defined in: [constraint/joint/joint-config.ts:47](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/joint-config.ts#L47)

关节约束求解器类型。
指定关节约束的求解算法类型，默认值为CONSTANT.SETTING_DEFAULT_JOINT_CONSTRAINT_SOLVER_TYPE，
             不同类型对应不同的约束求解策略（如直接求解、迭代求解）

#### Inherited from

[`JointConfig`](../../joint-config/classes/JointConfig.md).[`solverType`](../../joint-config/classes/JointConfig.md#solvertype)

***

### swingSpringDamper

> **swingSpringDamper**: [`SpringDamper`](../../spring-damper/classes/SpringDamper.md)

Defined in: [constraint/joint/ragdoll-joint-config.ts:49](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/ragdoll-joint-config.ts#L49)

摆动运动弹簧阻尼器。
摆动轴旋转运动的弹簧阻尼参数，默认初始化空实例（无弹性约束）；
             用于为摆动运动添加弹性/阻尼效果，模拟人体关节的韧带缓冲

***

### twistLimitMotor

> **twistLimitMotor**: [`RotationalLimitMotor`](../../rotational-limit-motor/classes/RotationalLimitMotor.md)

Defined in: [constraint/joint/ragdoll-joint-config.ts:56](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/ragdoll-joint-config.ts#L56)

扭转限位驱动。
扭转轴旋转的限位范围、驱动速度、最大驱动力矩配置，默认初始化空实例（无限位/驱动）；
             用于限制扭转角度范围（如肘关节的扭转限制）或添加可控的扭转驱动（如角色主动摆臂）

***

### twistSpringDamper

> **twistSpringDamper**: [`SpringDamper`](../../spring-damper/classes/SpringDamper.md)

Defined in: [constraint/joint/ragdoll-joint-config.ts:42](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/ragdoll-joint-config.ts#L42)

扭转运动弹簧阻尼器。
扭转轴旋转运动的弹簧阻尼参数，默认初始化空实例（无弹性约束）；
             用于为扭转运动添加弹性/阻尼效果（如关节复位、摆动缓冲），模拟人体关节的肌肉弹性

## Methods

### init()

> **init**(`rigidBody1`, `rigidBody2`, `_worldAnchor`, `_worldTwistAxis`, `_worldSwingAxis`): `RagdollJointConfig`

Defined in: [constraint/joint/ragdoll-joint-config.ts:87](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/ragdoll-joint-config.ts#L87)

初始化布娃娃关节配置。
核心初始化逻辑：
             1. 调用父类initialize方法，初始化刚体关联、锚点等基础配置；
             2. 将世界坐标系的扭转轴转换为两个刚体的本地坐标系轴（localTwistAxis1/localTwistAxis2）；
             3. 将世界坐标系的摆动轴转换为第一个刚体的本地坐标系轴（localSwingAxis1）；
             4. 返回自身以支持链式调用（如init(rb1, rb2, anchor, twist, swing).setSolverType(...)）；
             是创建布娃娃关节的标准初始化入口，保证关节轴与人体骨骼坐标系对齐

#### Parameters

##### rigidBody1

[`RigidBody`](../../../../rigid-body/rigid-body/classes/RigidBody.md)

关节关联的第一个刚体（如人体上臂）

##### rigidBody2

[`RigidBody`](../../../../rigid-body/rigid-body/classes/RigidBody.md)

关节关联的第二个刚体（如人体前臂）

##### \_worldAnchor

[`Vec3`](../../../../common/vec3/classes/Vec3.md)

关节锚点的世界坐标（如肘关节位置）

##### \_worldTwistAxis

[`Vec3`](../../../../common/vec3/classes/Vec3.md)

扭转轴的世界坐标（如胳膊的长度方向轴）

##### \_worldSwingAxis

[`Vec3`](../../../../common/vec3/classes/Vec3.md)

摆动参考轴的世界坐标（如胳膊的左右摆动轴）

#### Returns

`RagdollJointConfig`

当前配置实例（链式调用）
