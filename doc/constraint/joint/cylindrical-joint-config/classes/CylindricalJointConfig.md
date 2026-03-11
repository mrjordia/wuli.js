[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [constraint/joint/cylindrical-joint-config](../README.md) / CylindricalJointConfig

# Class: CylindricalJointConfig

Defined in: [constraint/joint/cylindrical-joint-config.ts:15](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/cylindrical-joint-config.ts#L15)

圆柱关节配置类。
继承自JointConfig，是圆柱关节（Cylindrical Joint）的专属配置容器，
             圆柱关节允许两个刚体沿指定轴做平移运动+绕该轴做旋转运动，此类封装了该关节的轴配置、平移/旋转限位驱动、弹簧阻尼等核心参数，
             是创建圆柱关节的核心配置载体

## Extends

- [`JointConfig`](../../joint-config/classes/JointConfig.md)

## Constructors

### Constructor

> **new CylindricalJointConfig**(): `CylindricalJointConfig`

#### Returns

`CylindricalJointConfig`

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

### localAxis1

> **localAxis1**: [`Vec3`](../../../../common/vec3/classes/Vec3.md)

Defined in: [constraint/joint/cylindrical-joint-config.ts:21](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/cylindrical-joint-config.ts#L21)

第一个刚体的本地圆柱轴（平移+旋转轴）。
相对于rigidBody1本地坐标系的圆柱关节主轴，默认值(1,0,0)（X轴）；
             刚体将沿该轴平移、绕该轴旋转，需与localAxis2配合保证关节约束方向一致

***

### localAxis2

> **localAxis2**: [`Vec3`](../../../../common/vec3/classes/Vec3.md)

Defined in: [constraint/joint/cylindrical-joint-config.ts:28](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/cylindrical-joint-config.ts#L28)

第二个刚体的本地圆柱轴（平移+旋转轴）。
相对于rigidBody2本地坐标系的圆柱关节主轴，默认值(1,0,0)（X轴）；
             初始化时会通过世界轴转换为刚体本地轴，保证两个刚体的关节轴对齐

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

### rotationalLimitMotor

> **rotationalLimitMotor**: [`RotationalLimitMotor`](../../rotational-limit-motor/classes/RotationalLimitMotor.md)

Defined in: [constraint/joint/cylindrical-joint-config.ts:49](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/cylindrical-joint-config.ts#L49)

旋转限位驱动配置。
圆柱关节旋转运动的限位角度、驱动速度、最大驱动力矩配置，默认初始化空实例（无限位/驱动）；
             可通过该配置限制旋转角度或添加可控的旋转驱动

***

### rotationalSpringDamper

> **rotationalSpringDamper**: [`SpringDamper`](../../spring-damper/classes/SpringDamper.md)

Defined in: [constraint/joint/cylindrical-joint-config.ts:56](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/cylindrical-joint-config.ts#L56)

旋转弹簧阻尼器配置。
圆柱关节旋转运动的弹簧阻尼参数，默认初始化空实例（无弹性约束）；
             用于为旋转运动添加弹性/阻尼效果（如旋转缓冲、回弹）

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

### translationalLimitMotor

> **translationalLimitMotor**: [`TranslationalLimitMotor`](../../translational-limit-motor/classes/TranslationalLimitMotor.md)

Defined in: [constraint/joint/cylindrical-joint-config.ts:35](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/cylindrical-joint-config.ts#L35)

平移限位驱动配置。
圆柱关节平移运动的限位范围、驱动速度、最大驱动力配置，默认初始化空实例（无限位/驱动）；
             可通过该配置限制平移范围或添加可控的平移驱动

***

### translationalSpringDamper

> **translationalSpringDamper**: [`SpringDamper`](../../spring-damper/classes/SpringDamper.md)

Defined in: [constraint/joint/cylindrical-joint-config.ts:42](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/cylindrical-joint-config.ts#L42)

平移弹簧阻尼器配置。
圆柱关节平移运动的弹簧阻尼参数，默认初始化空实例（无弹性约束）；
             用于为平移运动添加弹性/阻尼效果（如悬挂系统的弹性）

## Methods

### init()

> **init**(`rigidBody1`, `rigidBody2`, `_worldAnchor`, `_worldAxis`): `CylindricalJointConfig`

Defined in: [constraint/joint/cylindrical-joint-config.ts:71](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/cylindrical-joint-config.ts#L71)

初始化圆柱关节配置。
核心初始化逻辑：
             1. 调用父类initialize方法，初始化刚体关联、锚点等基础配置；
             2. 将世界坐标系的关节主轴转换为两个刚体的本地坐标系轴（localAxis1/localAxis2）；
             3. 返回自身以支持链式调用（如init(rb1, rb2, anchor, axis).setSolverType(...)）；
             是创建圆柱关节的标准初始化入口

#### Parameters

##### rigidBody1

[`RigidBody`](../../../../rigid-body/rigid-body/classes/RigidBody.md)

关节关联的第一个刚体

##### rigidBody2

[`RigidBody`](../../../../rigid-body/rigid-body/classes/RigidBody.md)

关节关联的第二个刚体

##### \_worldAnchor

[`Vec3`](../../../../common/vec3/classes/Vec3.md)

关节锚点的世界坐标

##### \_worldAxis

[`Vec3`](../../../../common/vec3/classes/Vec3.md)

关节主轴的世界坐标

#### Returns

`CylindricalJointConfig`

当前配置实例（链式调用）
