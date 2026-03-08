[**wuli.js API文档**](../../../../../README.md)

***

[wuli.js API文档](../../../../../modules.md) / [constraint/solver/direct/boundary-build-info](../README.md) / BoundaryBuildInfo

# Class: BoundaryBuildInfo

Defined in: [constraint/solver/direct/boundary-build-info.ts:13](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/boundary-build-info.ts#L13)

边界构建信息管理类。
物理引擎中边界构建流程的核心数据容器类，核心作用：
1. 统一管理边界构建过程中的有界/无界维度索引、符号标记等关键数据；
2. 预分配固定大小的内存缓冲区，避免动态扩容带来的性能开销；
3. 维护有界/无界维度的计数状态，简化边界构建算法的状态管理；
核心特性：
- 内存预分配：构造时按指定大小初始化所有数组，符合物理引擎“空间换时间”的优化思路；
- 状态内聚：将边界构建的计数、索引、符号信息封装为单一实体，降低算法耦合度；
- 轻量级设计：仅包含基础数据存储和初始化逻辑，无额外计算开销；
主要应用场景：凸多面体边界构建、碰撞形状AABB/OOBB计算、约束边界检测等需要区分有界/无界维度的场景。

## Constructors

### Constructor

> **new BoundaryBuildInfo**(`size`): `BoundaryBuildInfo`

Defined in: [constraint/solver/direct/boundary-build-info.ts:79](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/boundary-build-info.ts#L79)

构造函数：初始化边界构建信息容器。
核心初始化逻辑：
1. 赋值维度总容量size，作为所有内部数组的长度基准；
2. 预分配Int8Array类型的数组缓冲区（iBounded、signs、iUnbounded），避免运行时动态扩容；
3. 初始化有界/无界维度计数为0，保证初始状态的一致性；
工程化设计：使用Int8Array而非普通数组，减少内存占用并提升访问效率，适配物理引擎的高性能需求。

#### Parameters

##### size

`number`

边界维度总容量，决定内部数组的长度

#### Returns

`BoundaryBuildInfo`

## Properties

### iBounded

> **iBounded**: `Int8Array`

Defined in: [constraint/solver/direct/boundary-build-info.ts:40](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/boundary-build-info.ts#L40)

有界维度的索引数组。
存储有界维度的索引值，核心特性：
1. 数组长度由size指定，元素类型为Int8（节省内存，适配维度索引的小数值场景）；
2. 前numBounded个元素为有效索引，后续元素为初始值0（无意义）；
3. 典型值：0(x轴)、1(y轴)、2(z轴)，适配3D物理引擎的维度表示。

***

### iUnbounded

> **iUnbounded**: `Int8Array`

Defined in: [constraint/solver/direct/boundary-build-info.ts:68](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/boundary-build-info.ts#L68)

无界维度的索引数组。
存储无界维度的索引值，核心特性：
1. 数组长度由size指定，元素类型为Int8，内存布局与iBounded一致；
2. 前numUnbounded个元素为有效索引，代表无边界限制的维度；
3. 应用场景：无限平面、半空间等非封闭形状的边界表示。

***

### numBounded

> **numBounded**: `number` = `0`

Defined in: [constraint/solver/direct/boundary-build-info.ts:31](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/boundary-build-info.ts#L31)

有界维度的数量。
已标记为有界的维度计数，核心特性：
1. 初始值为0，随边界构建过程动态递增；
2. 作为iBounded数组的有效元素长度标识，避免遍历全部数组；
3. 取值范围：0 ≤ numBounded ≤ size，保证数据有效性。

#### Default

```ts
0
```

***

### numUnbounded

> **numUnbounded**: `number` = `0`

Defined in: [constraint/solver/direct/boundary-build-info.ts:59](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/boundary-build-info.ts#L59)

无界维度的数量。
已标记为无界的维度计数，核心特性：
1. 初始值为0，随边界构建过程动态递增；
2. 作为iUnbounded数组的有效元素长度标识；
3. 约束规则：numBounded + numUnbounded ≤ size，保证维度分类的完整性。

#### Default

```ts
0
```

***

### signs

> **signs**: `Int8Array`

Defined in: [constraint/solver/direct/boundary-build-info.ts:49](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/boundary-build-info.ts#L49)

有界维度的符号标记数组。
标记对应有界维度的符号方向，核心作用：
1. 与iBounded数组一一对应，标识维度的边界方向（正/负）；
2. 典型取值：1（正方向边界）、-1（负方向边界）、0（未定义）；
应用场景：区分维度的上边界/下边界，如x轴正方向边界、y轴负方向边界。

***

### size

> **size**: `number`

Defined in: [constraint/solver/direct/boundary-build-info.ts:21](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/boundary-build-info.ts#L21)

边界维度总容量。
边界构建的最大维度数量，核心作用：
1. 作为所有内部数组（iBounded、signs、iUnbounded）的初始化长度；
2. 限制有界/无界维度的最大存储数量，防止数组越界；
初始化规则：由构造函数参数指定，且在实例生命周期内保持不变。
