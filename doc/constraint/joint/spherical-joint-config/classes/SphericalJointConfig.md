[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [constraint/joint/spherical-joint-config](../README.md) / SphericalJointConfig

# Class: SphericalJointConfig

Defined in: [constraint/joint/spherical-joint-config.ts:13](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/spherical-joint-config.ts#L13)

球关节配置类。
继承自JointConfig，是球关节（Spherical Joint）的专属配置容器，
             球关节允许两个刚体绕共同锚点做全三维旋转（无平移自由度），仅限制锚点位置偏移，
             常用于模拟肩关节、髋关节、万向节、球头连杆等场景，可通过弹簧阻尼添加旋转缓冲/复位效果，
             是刚体物理模拟中实现全向旋转连接的核心配置载体

## Extends

- [`JointConfig`](../../joint-config/classes/JointConfig.md)

## Constructors

### Constructor

> **new SphericalJointConfig**(): `SphericalJointConfig`

#### Returns

`SphericalJointConfig`

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

### springDamper

> **springDamper**: [`SpringDamper`](../../spring-damper/classes/SpringDamper.md)

Defined in: [constraint/joint/spherical-joint-config.ts:20](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/spherical-joint-config.ts#L20)

旋转弹簧阻尼器配置。
球关节旋转运动的弹簧阻尼参数，默认初始化空实例（无弹性约束）；
             用于为全向旋转添加弹性/阻尼效果（如肩关节的复位缓冲、球头连杆的减震），
             无配置时关节仅限制锚点偏移，旋转无弹性约束

## Methods

### init()

> **init**(`rigidBody1`, `rigidBody2`, `_worldAnchor`): `SphericalJointConfig`

Defined in: [constraint/joint/spherical-joint-config.ts:33](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/spherical-joint-config.ts#L33)

初始化球关节配置。
核心初始化逻辑：
             1. 调用父类initialize方法，完成刚体关联、锚点等基础配置的初始化；
             2. 返回自身以支持链式调用（如init(rb1, rb2, anchor).setSolverType(...)）；
             球关节无特定旋转轴配置，仅需指定锚点即可实现全向旋转约束

#### Parameters

##### rigidBody1

[`RigidBody`](../../../../rigid-body/rigid-body/classes/RigidBody.md)

关节关联的第一个刚体（如人体上臂）

##### rigidBody2

[`RigidBody`](../../../../rigid-body/rigid-body/classes/RigidBody.md)

关节关联的第二个刚体（如人体前臂）

##### \_worldAnchor

[`Vec3`](../../../../common/vec3/classes/Vec3.md)

关节锚点的世界坐标（球关节的旋转中心点，如肩关节位置）

#### Returns

`SphericalJointConfig`

当前配置实例（支持链式调用）
