[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [constraint/joint/generic-joint-config](../README.md) / GenericJointConfig

# Class: GenericJointConfig

Defined in: [constraint/joint/generic-joint-config.ts:17](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/generic-joint-config.ts#L17)

通用关节配置类。
继承自JointConfig，是通用关节（Generic Joint）的专属配置容器，
             通用关节是物理引擎中最灵活的关节类型，支持自定义3个平移轴+3个旋转轴的约束规则，
             可通过配置不同的限位驱动、弹簧阻尼参数，模拟圆柱、球铰、棱柱等各类关节效果，
             是创建通用约束的核心配置载体

## Extends

- [`JointConfig`](../../joint-config/classes/JointConfig.md)

## Constructors

### Constructor

> **new GenericJointConfig**(): `GenericJointConfig`

#### Returns

`GenericJointConfig`

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

### localBasis1

> **localBasis1**: [`Mat3`](../../../../common/mat3/classes/Mat3.md)

Defined in: [constraint/joint/generic-joint-config.ts:23](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/generic-joint-config.ts#L23)

第一个刚体的本地基向量矩阵。
相对于rigidBody1本地坐标系的3x3基向量矩阵，每行对应一个约束轴（X/Y/Z）；
             初始化时由世界基向量矩阵转换而来，决定第一个刚体的约束坐标系方向，默认初始化为单位矩阵

***

### localBasis2

> **localBasis2**: [`Mat3`](../../../../common/mat3/classes/Mat3.md)

Defined in: [constraint/joint/generic-joint-config.ts:30](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/generic-joint-config.ts#L30)

第二个刚体的本地基向量矩阵。
相对于rigidBody2本地坐标系的3x3基向量矩阵，每行对应一个约束轴（X/Y/Z）；
             初始化时由世界基向量矩阵转换而来，需与localBasis1配合保证约束坐标系对齐，默认初始化为单位矩阵

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

### rotationalLimitMotors

> **rotationalLimitMotors**: [`RotationalLimitMotor`](../../rotational-limit-motor/classes/RotationalLimitMotor.md)[]

Defined in: [constraint/joint/generic-joint-config.ts:48](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/generic-joint-config.ts#L48)

旋转限位驱动配置数组（3个轴）。
依次对应X/Y/Z轴的旋转限位驱动配置，默认初始化3个实例且限位范围为(0,0)（固定约束）；
             每个轴可独立配置限位角度、驱动速度、最大驱动力矩，实现不同轴的差异化旋转约束

***

### rotationalSpringDampers

> **rotationalSpringDampers**: [`SpringDamper`](../../spring-damper/classes/SpringDamper.md)[]

Defined in: [constraint/joint/generic-joint-config.ts:66](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/generic-joint-config.ts#L66)

旋转弹簧阻尼器配置数组（3个轴）。
依次对应X/Y/Z轴的旋转弹簧阻尼参数，默认初始化3个空实例（无弹性约束）；
             每个轴可独立配置频率、阻尼比，为不同轴的旋转运动添加差异化弹性/阻尼效果

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

### translationalLimitMotors

> **translationalLimitMotors**: [`TranslationalLimitMotor`](../../translational-limit-motor/classes/TranslationalLimitMotor.md)[]

Defined in: [constraint/joint/generic-joint-config.ts:37](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/generic-joint-config.ts#L37)

平移限位驱动配置数组（3个轴）。
依次对应X/Y/Z轴的平移限位驱动配置，默认初始化3个实例且限位范围为(0,0)（固定约束）；
             每个轴可独立配置限位范围、驱动速度、最大驱动力，实现不同轴的差异化平移约束

***

### translationalSpringDampers

> **translationalSpringDampers**: [`SpringDamper`](../../spring-damper/classes/SpringDamper.md)[]

Defined in: [constraint/joint/generic-joint-config.ts:59](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/generic-joint-config.ts#L59)

平移弹簧阻尼器配置数组（3个轴）。
依次对应X/Y/Z轴的平移弹簧阻尼参数，默认初始化3个空实例（无弹性约束）；
             每个轴可独立配置频率、阻尼比，为不同轴的平移运动添加差异化弹性/阻尼效果

## Methods

### init()

> **init**(`rigidBody1`, `rigidBody2`, `_worldAnchor`, `_worldBasis1`, `_worldBasis2`): `GenericJointConfig`

Defined in: [constraint/joint/generic-joint-config.ts:82](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/generic-joint-config.ts#L82)

初始化通用关节配置。
核心初始化逻辑：
             1. 调用父类initialize方法，初始化刚体关联、锚点等基础配置；
             2. 将世界坐标系的基向量矩阵转换为两个刚体的本地坐标系矩阵（localBasis1/localBasis2）；
             3. 返回自身以支持链式调用（如init(rb1, rb2, anchor, b1, b2).setSolverType(...)）；
             是创建通用关节的标准初始化入口

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

##### \_worldBasis1

[`Mat3`](../../../../common/mat3/classes/Mat3.md)

第一个刚体的约束基向量矩阵（世界坐标）

##### \_worldBasis2

[`Mat3`](../../../../common/mat3/classes/Mat3.md)

第二个刚体的约束基向量矩阵（世界坐标）

#### Returns

`GenericJointConfig`

当前配置实例（链式调用）
