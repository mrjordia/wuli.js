[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [rigid-body/rigid-body-config](../README.md) / RigidBodyConfig

# Class: RigidBodyConfig

Defined in: [rigid-body/rigid-body-config.ts:68](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body-config.ts#L68)

物理引擎刚体配置类。
封装刚体初始化所需的所有配置参数，提供统一的默认值和参数转换逻辑
核心作用：
1. 标准化刚体初始化参数（如四元数转旋转矩阵）
2. 提供合理的默认值，简化刚体创建流程
3. 隔离配置参数与刚体核心逻辑，提升代码可维护性

## Constructors

### Constructor

> **new RigidBodyConfig**(`optional?`): `RigidBodyConfig`

Defined in: [rigid-body/rigid-body-config.ts:136](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body-config.ts#L136)

构造函数：创建刚体配置实例

#### Parameters

##### optional?

[`IRigidBodyConfigOptions`](../interfaces/IRigidBodyConfigOptions.md) = `{}`

可选配置参数，未传字段使用默认值

#### Returns

`RigidBodyConfig`

## Properties

### angularDamping

> **angularDamping**: `number`

Defined in: [rigid-body/rigid-body-config.ts:123](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body-config.ts#L123)

角阻尼系数（角速度衰减率）。
用于模拟旋转过程中的阻力，取值范围 [0, 1]
计算公式：新角速度 = 原角速度 × (1 - angularDamping)
默认为0（无阻尼）

***

### angularVelocity

> **angularVelocity**: [`Vec3`](../../../common/vec3/classes/Vec3.md)

Defined in: [rigid-body/rigid-body-config.ts:91](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body-config.ts#L91)

刚体初始角速度（单位：弧度/秒 rad/s）。
描述刚体旋转的速度，默认为Vec3(0, 0, 0)（无旋转）

***

### autoSleep

> **autoSleep**: `boolean`

Defined in: [rigid-body/rigid-body-config.ts:107](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body-config.ts#L107)

自动休眠开关。
启用时，刚体速度低于阈值会进入休眠状态，暂停物理计算以优化性能
默认为true（启用）

***

### linearDamping

> **linearDamping**: `number`

Defined in: [rigid-body/rigid-body-config.ts:115](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body-config.ts#L115)

线性阻尼系数（速度衰减率）。
用于模拟平动过程中的阻力，取值范围 [0, 1]
计算公式：新速度 = 原速度 × (1 - linearDamping)
默认为0（无阻尼）

***

### linearVelocity

> **linearVelocity**: [`Vec3`](../../../common/vec3/classes/Vec3.md)

Defined in: [rigid-body/rigid-body-config.ts:85](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body-config.ts#L85)

刚体初始线速度（单位：米/秒 m/s）。
描述刚体平动的速度，默认为Vec3(0, 0, 0)（静止）

***

### name

> **name**: `string`

Defined in: [rigid-body/rigid-body-config.ts:130](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body-config.ts#L130)

刚体名称（调试用）。
可用于日志输出、调试工具标识刚体，无物理意义
默认为空字符串

***

### position

> **position**: [`Vec3`](../../../common/vec3/classes/Vec3.md)

Defined in: [rigid-body/rigid-body-config.ts:73](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body-config.ts#L73)

刚体初始位置（世界坐标系，单位：米/m）。
默认为Vec3(0, 0, 0)（世界原点）

***

### rotation

> **rotation**: [`Mat3`](../../../common/mat3/classes/Mat3.md)

Defined in: [rigid-body/rigid-body-config.ts:79](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body-config.ts#L79)

刚体初始旋转矩阵（3x3）。
由四元数转换而来，默认为单位矩阵（无旋转）

***

### type

> **type**: [`RIGID_BODY_TYPE`](../../../constant/enumerations/RIGID_BODY_TYPE.md)

Defined in: [rigid-body/rigid-body-config.ts:100](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body-config.ts#L100)

刚体类型。
- STATIC：静态刚体（无质量，不受力，位置固定）
- DYNAMIC：动态刚体（有质量，受物理力影响）
- KINEMATIC：运动学刚体（无质量，可通过代码控制运动）
默认为DYNAMIC（动态刚体）
