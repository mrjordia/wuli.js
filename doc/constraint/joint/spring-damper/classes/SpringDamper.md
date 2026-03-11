[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [constraint/joint/spring-damper](../README.md) / SpringDamper

# Class: SpringDamper

Defined in: [constraint/joint/spring-damper.ts:6](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/spring-damper.ts#L6)

弹簧阻尼器配置类。
物理引擎中弹簧阻尼器的核心参数配置容器，定义弹簧的振动频率、阻尼系数及数值积分方式，
             用于为关节/刚体添加弹性约束（如弹性关节、悬挂系统），平衡运动的弹性和阻尼效果

## Constructors

### Constructor

> **new SpringDamper**(): `SpringDamper`

#### Returns

`SpringDamper`

## Properties

### dampingRatio

> **dampingRatio**: `number` = `0`

Defined in: [constraint/joint/spring-damper.ts:22](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/spring-damper.ts#L22)

阻尼比。
弹簧的阻尼系数（无量纲），默认值0；取值范围及效果：
             - 0 < 阻尼比 < 1：欠阻尼（弹簧振动逐渐衰减）；
             - 阻尼比 = 1：临界阻尼（弹簧最快回到平衡位置且无振动）；
             - 阻尼比 > 1：过阻尼（弹簧缓慢回到平衡位置，无振动）；
             值为0时无阻尼，弹簧会持续振动

***

### frequency

> **frequency**: `number` = `0`

Defined in: [constraint/joint/spring-damper.ts:12](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/spring-damper.ts#L12)

弹簧固有频率（Hz）。
弹簧的振动频率，默认值0；值越大弹簧越“硬”（振动越快、恢复力越强），值为0时禁用弹簧效果，
             需结合阻尼系数共同控制弹簧的振动特性

***

### useSymplecticEuler

> **useSymplecticEuler**: `boolean` = `false`

Defined in: [constraint/joint/spring-damper.ts:29](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/spring-damper.ts#L29)

是否使用辛欧拉积分法。
数值积分方式开关，默认值false；启用辛欧拉（Symplectic Euler）积分可提升弹簧阻尼系统的能量守恒特性，
             避免普通欧拉积分导致的能量发散，提升仿真稳定性

## Methods

### clone()

> **clone**(): `SpringDamper`

Defined in: [constraint/joint/spring-damper.ts:37](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/spring-damper.ts#L37)

克隆当前弹簧阻尼器配置。
深度克隆（值类型拷贝）当前配置的所有参数，返回独立的新实例，
             避免多个对象共享同一配置实例导致的参数联动修改问题

#### Returns

`SpringDamper`

新的SpringDamper实例，与当前实例参数完全一致
