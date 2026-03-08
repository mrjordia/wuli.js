[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [constraint/joint/rotational-limit-motor](../README.md) / RotationalLimitMotor

# Class: RotationalLimitMotor

Defined in: [constraint/joint/rotational-limit-motor.ts:8](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/rotational-limit-motor.ts#L8)

旋转限位驱动类。
用于控制旋转关节的角度限位和驱动特性的核心配置类，
             可同时设置旋转角度的上下限范围、驱动电机的转速和力矩，
             广泛应用于旋转关节（Revolute）、布娃娃关节（Ragdoll）等需要旋转约束的场景，
             既能限制关节旋转范围（如门的开合角度），也能提供主动旋转驱动力（如电机带动机械臂）

## Constructors

### Constructor

> **new RotationalLimitMotor**(): `RotationalLimitMotor`

#### Returns

`RotationalLimitMotor`

## Properties

### lowerLimit

> **lowerLimit**: `number` = `1`

Defined in: [constraint/joint/rotational-limit-motor.ts:16](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/rotational-limit-motor.ts#L16)

旋转下限角度。
关节允许旋转的最小角度（弧度），默认值1；
             当lowerLimit > upperLimit时，限位功能失效（无角度限制）；
             示例：门的最小开合角度设为0（完全关闭）

***

### motorSpeed

> **motorSpeed**: `number` = `0`

Defined in: [constraint/joint/rotational-limit-motor.ts:40](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/rotational-limit-motor.ts#L40)

电机目标转速。
驱动关节旋转的目标角速度（弧度/秒），默认值0（无主动旋转）；
             正数为顺时针旋转，负数为逆时针旋转；
             电机将尽力以该转速旋转，直到达到力矩上限或角度限位

***

### motorTorque

> **motorTorque**: `number` = `0`

Defined in: [constraint/joint/rotational-limit-motor.ts:32](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/rotational-limit-motor.ts#L32)

电机驱动力矩。
驱动关节旋转的最大力矩（N·m），默认值0（无驱动力）；
             力矩越大，关节旋转的动力越强，可模拟电机/肌肉的驱动力；
             设为0时，关节仅受外部力/限位约束，无主动旋转动力

***

### upperLimit

> **upperLimit**: `number` = `0`

Defined in: [constraint/joint/rotational-limit-motor.ts:24](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/rotational-limit-motor.ts#L24)

旋转上限角度。
关节允许旋转的最大角度（弧度），默认值0；
             当upperLimit < lowerLimit时，限位功能失效（无角度限制）；
             示例：门的最大开合角度设为Math.PI/2（90度打开）

## Methods

### clone()

> **clone**(): `RotationalLimitMotor`

Defined in: [constraint/joint/rotational-limit-motor.ts:76](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/rotational-limit-motor.ts#L76)

克隆当前实例。
创建并返回一个与当前实例参数完全相同的新实例，
             避免多个关节共享同一配置实例导致的参数联动问题

#### Returns

`RotationalLimitMotor`

新的RotationalLimitMotor实例

***

### setLimits()

> **setLimits**(`lower`, `upper`): `RotationalLimitMotor`

Defined in: [constraint/joint/rotational-limit-motor.ts:50](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/rotational-limit-motor.ts#L50)

设置旋转角度限位。
批量设置旋转角度的上下限，返回自身以支持链式调用；
             示例：lm.setLimits(0, Math.PI/2) → 限制关节在0~90度范围内旋转

#### Parameters

##### lower

`number`

旋转下限角度（弧度）

##### upper

`number`

旋转上限角度（弧度）

#### Returns

`RotationalLimitMotor`

当前实例（支持链式调用）

***

### setMotor()

> **setMotor**(`speed`, `torque`): `RotationalLimitMotor`

Defined in: [constraint/joint/rotational-limit-motor.ts:64](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/joint/rotational-limit-motor.ts#L64)

设置电机驱动参数。
批量设置电机的目标转速和最大力矩，返回自身以支持链式调用；
             示例：lm.setMotor(1.0, 10.0) → 以1弧度/秒的速度旋转，最大力矩10N·m

#### Parameters

##### speed

`number`

目标转速（弧度/秒）

##### torque

`number`

最大驱动力矩（N·m）

#### Returns

`RotationalLimitMotor`

当前实例（支持链式调用）
