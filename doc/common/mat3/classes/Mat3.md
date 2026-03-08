[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [common/mat3](../README.md) / Mat3

# Class: Mat3

Defined in: [common/mat3.ts:16](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/common/mat3.ts#L16)

3x3 双精度浮点矩阵类。
物理引擎核心数学工具类，专为3维空间变换设计，
主要用于旋转表示、缩放变换、惯性张量计算等物理场景，采用双精度浮点保证计算精度，
内置性能优化机制（实例复用、创建计数），符合物理引擎对精度和性能的双重要求。

矩阵元素采用**行主序**的一维 Float64Array 存储，索引对应关系：
[
  0: e00, 1: e01, 2: e02,  // 第一行（对应X轴方向）
  3: e10, 4: e11, 5: e12,  // 第二行（对应Y轴方向）
  6: e20, 7: e21, 8: e22   // 第三行（对应Z轴方向）
]

## Constructors

### Constructor

> **new Mat3**(`e00?`, `e01?`, `e02?`, `e10?`, `e11?`, `e12?`, `e20?`, `e21?`, `e22?`): `Mat3`

Defined in: [common/mat3.ts:36](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/common/mat3.ts#L36)

构造函数。
初始化3x3矩阵，默认创建单位矩阵（物理引擎中最常用的初始状态）

#### Parameters

##### e00?

`number` = `1`

第一行第一列元素（X轴X分量）

##### e01?

`number` = `0`

第一行第二列元素（X轴Y分量）

##### e02?

`number` = `0`

第一行第三列元素（X轴Z分量）

##### e10?

`number` = `0`

第二行第一列元素（Y轴X分量）

##### e11?

`number` = `1`

第二行第二列元素（Y轴Y分量）

##### e12?

`number` = `0`

第二行第三列元素（Y轴Z分量）

##### e20?

`number` = `0`

第三行第一列元素（Z轴X分量）

##### e21?

`number` = `0`

第三行第二列元素（Z轴Y分量）

##### e22?

`number` = `1`

第三行第三列元素（Z轴Z分量）

#### Returns

`Mat3`

## Properties

### elements

> **elements**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [common/mat3.ts:21](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/common/mat3.ts#L21)

矩阵元素存储数组（行主序）。
默认初始化为单位矩阵（无旋转/缩放）。

## Methods

### init()

> **init**(`e00`, `e01`, `e02`, `e10`, `e11`, `e12`, `e20`, `e21`, `e22`): `Mat3`

Defined in: [common/mat3.ts:74](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/common/mat3.ts#L74)

重新初始化矩阵元素。

物理引擎高性能优化方法：
1. 复用已有Mat3实例，避免频繁new创建/GC回收，降低内存开销；
2. 链式调用设计（return this），简化代码书写；
3. 直接修改内部elements数组，无额外内存分配。

#### Parameters

##### e00

`number`

第一行第一列元素

##### e01

`number`

第一行第二列元素

##### e02

`number`

第一行第三列元素

##### e10

`number`

第二行第一列元素

##### e11

`number`

第二行第二列元素

##### e12

`number`

第二行第三列元素

##### e20

`number`

第三行第一列元素

##### e21

`number`

第三行第二列元素

##### e22

`number`

第三行第三列元素

#### Returns

`Mat3`

当前矩阵实例（支持链式调用）
