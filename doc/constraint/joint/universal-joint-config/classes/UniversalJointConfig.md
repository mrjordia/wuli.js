[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [constraint/joint/universal-joint-config](../README.md) / UniversalJointConfig

# Class: UniversalJointConfig

Defined in: [constraint/joint/universal-joint-config.ts:16](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/universal-joint-config.ts#L16)

万向节配置类。
继承自JointConfig，是万向节（Universal Joint）的专属配置容器，
             万向节允许两个刚体绕两个正交的旋转轴做二维旋转（2个旋转自由度），完全限制平移自由度，
             可分别为两个旋转轴配置弹簧阻尼（缓冲/复位）和限位驱动（角度限制/主动旋转），
             常用于模拟汽车传动轴、十字轴万向节、机器人关节等需要双轴旋转的机械场景，
             是连接旋转关节（单轴）和球关节（全轴）的中间型关节配置

## Extends

- [`JointConfig`](../../joint-config/classes/JointConfig.md)

## Constructors

### Constructor

> **new UniversalJointConfig**(): `UniversalJointConfig`

#### Returns

`UniversalJointConfig`

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

### limitMotor1

> **limitMotor1**: [`RotationalLimitMotor`](../../rotational-limit-motor/classes/RotationalLimitMotor.md)

Defined in: [constraint/joint/universal-joint-config.ts:50](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/universal-joint-config.ts#L50)

旋转轴1的限位驱动配置。
为绕localAxis1的旋转运动配置的限位驱动参数，默认初始化空实例（无限位/无驱动）；
             可限制该轴旋转角度范围，或提供主动旋转驱动力（如电机带动传动轴）

***

### limitMotor2

> **limitMotor2**: [`RotationalLimitMotor`](../../rotational-limit-motor/classes/RotationalLimitMotor.md)

Defined in: [constraint/joint/universal-joint-config.ts:57](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/universal-joint-config.ts#L57)

旋转轴2的限位驱动配置。
为绕localAxis2的旋转运动配置的限位驱动参数，默认初始化空实例（无限位/无驱动）；
             可独立于limitMotor1配置，实现双轴差异化的旋转约束/驱动

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

### localAxis1

> **localAxis1**: [`Vec3`](../../../../common/vec3/classes/Vec3.md)

Defined in: [constraint/joint/universal-joint-config.ts:22](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/universal-joint-config.ts#L22)

第一个刚体的本地旋转轴1。
相对于rigidBody1本地坐标系的第一个旋转轴，默认值(1, 0, 0)（X轴）；
             该轴与localAxis2需保持正交，是万向节双轴旋转的核心参数之一

***

### localAxis2

> **localAxis2**: [`Vec3`](../../../../common/vec3/classes/Vec3.md)

Defined in: [constraint/joint/universal-joint-config.ts:29](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/universal-joint-config.ts#L29)

第二个刚体的本地旋转轴2。
相对于rigidBody2本地坐标系的第二个旋转轴，默认值(1, 0, 0)（X轴）；
             该轴需与localAxis1正交，共同构成万向节的双旋转轴约束

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

### springDamper1

> **springDamper1**: [`SpringDamper`](../../spring-damper/classes/SpringDamper.md)

Defined in: [constraint/joint/universal-joint-config.ts:36](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/universal-joint-config.ts#L36)

旋转轴1的弹簧阻尼器配置。
为绕localAxis1的旋转运动配置的弹簧阻尼参数，默认初始化空实例（无弹性约束）；
             用于为该轴旋转添加缓冲/复位效果（如传动轴的减震）

***

### springDamper2

> **springDamper2**: [`SpringDamper`](../../spring-damper/classes/SpringDamper.md)

Defined in: [constraint/joint/universal-joint-config.ts:43](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/universal-joint-config.ts#L43)

旋转轴2的弹簧阻尼器配置。
为绕localAxis2的旋转运动配置的弹簧阻尼参数，默认初始化空实例（无弹性约束）；
             用于为该轴旋转添加缓冲/复位效果，可独立于springDamper1配置

## Methods

### init()

> **init**(`rigidBody1`, `rigidBody2`, `_worldAnchor`, `_worldAxis1`, `_worldAxis2`): `UniversalJointConfig`

Defined in: [constraint/joint/universal-joint-config.ts:73](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/universal-joint-config.ts#L73)

初始化万向节配置。
核心初始化逻辑：
             1. 调用父类initialize方法，完成刚体关联、锚点等基础配置的初始化；
             2. 将世界坐标系的两个旋转轴转换为对应刚体的本地坐标系轴（保证旋转轴在本地空间的一致性）；
             3. 返回自身以支持链式调用（如init(rb1, rb2, anchor, axis1, axis2).setSolverType(...)）；
             注意：传入的_worldAxis1和_worldAxis2需保证正交，否则会导致万向节约束异常

#### Parameters

##### rigidBody1

[`RigidBody`](../../../../rigid-body/rigid-body/classes/RigidBody.md)

关节关联的第一个刚体（如汽车传动轴输入端）

##### rigidBody2

[`RigidBody`](../../../../rigid-body/rigid-body/classes/RigidBody.md)

关节关联的第二个刚体（如汽车传动轴输出端）

##### \_worldAnchor

[`Vec3`](../../../../common/vec3/classes/Vec3.md)

关节锚点的世界坐标（万向节的旋转中心点，如十字轴中心）

##### \_worldAxis1

[`Vec3`](../../../../common/vec3/classes/Vec3.md)

第一个旋转轴的世界坐标（相对于rigidBody1的旋转轴）

##### \_worldAxis2

[`Vec3`](../../../../common/vec3/classes/Vec3.md)

第二个旋转轴的世界坐标（相对于rigidBody2的旋转轴）

#### Returns

`UniversalJointConfig`

当前配置实例（支持链式调用）
