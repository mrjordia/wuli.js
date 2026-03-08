[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [constraint/joint/translational-limit-motor](../README.md) / TranslationalLimitMotor

# Class: TranslationalLimitMotor

Defined in: [constraint/joint/translational-limit-motor.ts:6](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/translational-limit-motor.ts#L6)

平移限位驱动配置类。
物理引擎中平移关节（如滑块、棱柱关节）的限位与驱动配置容器，定义平移运动的上下限位范围、驱动速度和最大驱动力，
             用于限制刚体平移范围并提供可控的平移驱动，是平移约束的核心参数配置类

## Constructors

### Constructor

> **new TranslationalLimitMotor**(): `TranslationalLimitMotor`

#### Returns

`TranslationalLimitMotor`

## Properties

### lowerLimit

> **lowerLimit**: `number` = `1`

Defined in: [constraint/joint/translational-limit-motor.ts:12](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/translational-limit-motor.ts#L12)

平移下限。
平移运动的最小位移限制，默认值1；与upperLimit配合定义平移范围，
             若lowerLimit > upperLimit（默认状态），表示禁用平移限位约束

***

### motorForce

> **motorForce**: `number` = `0`

Defined in: [constraint/joint/translational-limit-motor.ts:26](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/translational-limit-motor.ts#L26)

驱动最大作用力。
平移驱动允许输出的最大作用力，默认值0；值为0时禁用驱动功能，
             非零值限制驱动的最大推力/拉力，防止驱动过载导致刚体运动失控

***

### motorSpeed

> **motorSpeed**: `number` = `0`

Defined in: [constraint/joint/translational-limit-motor.ts:33](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/translational-limit-motor.ts#L33)

驱动目标速度。
平移驱动的目标速度，默认值0；仅在motorForce>0时生效，
             正数表示向平移上限方向运动，负数表示向平移下限方向运动

***

### upperLimit

> **upperLimit**: `number` = `0`

Defined in: [constraint/joint/translational-limit-motor.ts:19](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/translational-limit-motor.ts#L19)

平移上限。
平移运动的最大位移限制，默认值0；与lowerLimit配合定义平移范围，
             仅当lowerLimit <= upperLimit时，限位约束才会生效

## Methods

### clone()

> **clone**(): `TranslationalLimitMotor`

Defined in: [constraint/joint/translational-limit-motor.ts:69](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/translational-limit-motor.ts#L69)

克隆当前平移限位驱动配置。
深度克隆（值类型拷贝）当前配置的所有参数，返回独立的新实例，
             避免多个平移关节共享同一配置实例导致的参数联动修改问题

#### Returns

`TranslationalLimitMotor`

新的TranslationalLimitMotor实例，与当前实例参数完全一致

***

### setLimits()

> **setLimits**(`lower`, `upper`): `TranslationalLimitMotor`

Defined in: [constraint/joint/translational-limit-motor.ts:43](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/translational-limit-motor.ts#L43)

设置平移限位范围。
批量设置平移上下限位，返回自身以支持链式调用（如setLimits(0, 10).setMotor(2, 50)），
             需保证lower <= upper才能启用限位约束

#### Parameters

##### lower

`number`

平移下限

##### upper

`number`

平移上限

#### Returns

`TranslationalLimitMotor`

当前实例（链式调用）

***

### setMotor()

> **setMotor**(`speed`, `force`): `TranslationalLimitMotor`

Defined in: [constraint/joint/translational-limit-motor.ts:57](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/translational-limit-motor.ts#L57)

设置平移驱动参数。
批量设置驱动速度和最大作用力，返回自身以支持链式调用，
             force设为0可快速禁用驱动功能

#### Parameters

##### speed

`number`

驱动目标速度

##### force

`number`

驱动最大作用力

#### Returns

`TranslationalLimitMotor`

当前实例（链式调用）
