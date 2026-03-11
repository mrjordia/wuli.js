[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [rigid-body/rigid-body-config](../README.md) / IRigidBodyConfigOptions

# Interface: IRigidBodyConfigOptions

Defined in: [rigid-body/rigid-body-config.ts:10](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/rigid-body/rigid-body-config.ts#L10)

刚体配置项接口（初始化入参类型）。
用于定义创建RigidBodyConfig时的可选配置参数，所有字段均为可选，未传时使用默认值

## Properties

### angularDamping?

> `optional` **angularDamping**: `number`

Defined in: [rigid-body/rigid-body-config.ts:52](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/rigid-body/rigid-body-config.ts#L52)

角阻尼系数（角速度衰减率），取值范围 [0, 1]。
作用：模拟旋转阻力，使刚体角速度逐渐衰减。
0表示无阻尼，1表示瞬时停止旋转。
默认为0

***

### angularVelocity?

> `optional` **angularVelocity**: `object`

Defined in: [rigid-body/rigid-body-config.ts:27](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/rigid-body/rigid-body-config.ts#L27)

刚体初始角速度（rad/s）

#### x

> **x**: `number`

#### y

> **y**: `number`

#### z

> **z**: `number`

***

### autoSleep?

> `optional` **autoSleep**: `boolean`

Defined in: [rigid-body/rigid-body-config.ts:38](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/rigid-body/rigid-body-config.ts#L38)

是否启用自动休眠。
休眠逻辑：刚体速度低于阈值时进入休眠状态，停止物理计算以提升性能。
默认为true（启用）。

***

### linearDamping?

> `optional` **linearDamping**: `number`

Defined in: [rigid-body/rigid-body-config.ts:45](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/rigid-body/rigid-body-config.ts#L45)

线性阻尼系数（速度衰减率），取值范围 [0, 1]。
作用：模拟空气阻力、摩擦力等，使刚体线速度逐渐衰减。
0表示无阻尼（速度不衰减），1表示瞬时停止。
默认为0。

***

### linearVelocity?

> `optional` **linearVelocity**: `object`

Defined in: [rigid-body/rigid-body-config.ts:23](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/rigid-body/rigid-body-config.ts#L23)

刚体初始线速度（m/s）

#### x

> **x**: `number`

#### y

> **y**: `number`

#### z

> **z**: `number`

***

### name?

> `optional` **name**: `string`

Defined in: [rigid-body/rigid-body-config.ts:57](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/rigid-body/rigid-body-config.ts#L57)

刚体名称（用于调试/标识）
默认为空字符串

***

### position?

> `optional` **position**: `object`

Defined in: [rigid-body/rigid-body-config.ts:14](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/rigid-body/rigid-body-config.ts#L14)

刚体初始位置（世界坐标系）

#### x

> **x**: `number`

#### y

> **y**: `number`

#### z

> **z**: `number`

***

### rotation?

> `optional` **rotation**: `object`

Defined in: [rigid-body/rigid-body-config.ts:19](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/rigid-body/rigid-body-config.ts#L19)

刚体初始旋转（四元数）。
注：内部会自动转换为3x3旋转矩阵存储

#### w

> **w**: `number`

#### x

> **x**: `number`

#### y

> **y**: `number`

#### z

> **z**: `number`

***

### type?

> `optional` **type**: [`RIGID_BODY_TYPE`](../../../constant/enumerations/RIGID_BODY_TYPE.md)

Defined in: [rigid-body/rigid-body-config.ts:32](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/rigid-body/rigid-body-config.ts#L32)

刚体类型（静态/动态/运动学）。
默认为动态刚体（RIGID_BODY_TYPE.DYNAMIC）
