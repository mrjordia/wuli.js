[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [common/vec3](../README.md) / Vec3

# Class: Vec3

Defined in: [common/vec3.ts:16](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/vec3.ts#L16)

3D双精度浮点向量核心类。
物理引擎中表示3维空间物理量的基础核心类，核心作用：
1. 统一封装位置、方向、速度、加速度、力等3维物理量的存储与操作；
2. 采用双精度浮点（Float64Array）存储，保证物理计算的高精度需求；
3. 提供x/y/z访问器，兼顾便捷性与底层数组操作的性能；
核心特性：
- 精度优先：Float64Array（64位浮点）避免单精度（32位）的累积误差，适配物理模拟；
- 内存高效：固定3个元素的连续内存布局，便于CPU缓存命中和SIMD优化；
- 易用性：x/y/z访问器封装底层数组操作，降低使用成本；
- 可监控：构造时统计实例创建数，支持性能分析与内存监控；
主要应用场景：刚体位置/速度计算、碰撞检测的向量运算、力/扭矩的表示与传递。

## Constructors

### Constructor

> **new Vec3**(`x?`, `y?`, `z?`): `Vec3`

Defined in: [common/vec3.ts:42](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/vec3.ts#L42)

构造函数：初始化三维向量。
核心初始化逻辑：
1. 按参数赋值x/y/z分量到elements数组对应索引；
2. 自动递增CONSTANT.VEC3_NUM_CREATIONS，统计实例创建数量（用于性能分析/内存监控）；
3. 默认创建零向量，保证未传参时的安全初始化。

#### Parameters

##### x?

`number` = `0`

X轴分量，默认0

##### y?

`number` = `0`

Y轴分量，默认0

##### z?

`number` = `0`

Z轴分量，默认0

#### Returns

`Vec3`

## Properties

### elements

> **elements**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [common/vec3.ts:30](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/vec3.ts#L30)

向量分量存储数组（双精度浮点）。
固定长度3的Float64Array，内存布局严格定义：
| 索引 | 分量 | 物理含义                | 默认值 |
|------|------|-------------------------|--------|
| 0    | x    | 三维空间X轴分量         | 0      |
| 1    | y    | 三维空间Y轴分量         | 0      |
| 2    | z    | 三维空间Z轴分量         | 0      |
工程建议：
- 高性能场景：直接操作此数组（如批量运算），避免访问器的微小开销；
- 常规场景：使用x/y/z访问器，代码更易读；
- 精度保证：64位浮点可满足物理模拟的高精度要求，避免位置/速度计算漂移。

## Accessors

### x

#### Get Signature

> **get** **x**(): `number`

Defined in: [common/vec3.ts:54](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/vec3.ts#L54)

X分量访问器（只读）。
封装elements[0]的只读访问，兼顾易用性与性能：

##### Returns

`number`

当前X轴分量值

#### Set Signature

> **set** **x**(`num`): `void`

Defined in: [common/vec3.ts:63](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/vec3.ts#L63)

X分量设置器（可写）。
封装elements[0]的写入操作，保证分量赋值的规范性：

##### Parameters

###### num

`number`

要设置的X轴分量值

##### Returns

`void`

***

### y

#### Get Signature

> **get** **y**(): `number`

Defined in: [common/vec3.ts:72](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/vec3.ts#L72)

Y分量访问器（只读）。
封装elements[1]的只读访问，逻辑同x访问器。

##### Returns

`number`

当前Y轴分量值

#### Set Signature

> **set** **y**(`num`): `void`

Defined in: [common/vec3.ts:81](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/vec3.ts#L81)

Y分量设置器（可写）。
封装elements[1]的写入操作，逻辑同x设置器。

##### Parameters

###### num

`number`

要设置的Y轴分量值

##### Returns

`void`

***

### z

#### Get Signature

> **get** **z**(): `number`

Defined in: [common/vec3.ts:90](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/vec3.ts#L90)

Z分量访问器（只读）。
封装elements[2]的只读访问，逻辑同x访问器。

##### Returns

`number`

当前Z轴分量值

#### Set Signature

> **set** **z**(`num`): `void`

Defined in: [common/vec3.ts:99](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/vec3.ts#L99)

Z分量设置器（可写）。
封装elements[2]的写入操作，逻辑同x设置器。

##### Parameters

###### num

`number`

要设置的Z轴分量值

##### Returns

`void`
