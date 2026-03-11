[**wuli.js API文档**](../../../../../README.md)

***

[wuli.js API文档](../../../../../modules.md) / [constraint/solver/direct/boundary](../README.md) / Boundary

# Class: Boundary

Defined in: [constraint/solver/direct/boundary.ts:19](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/solver/direct/boundary.ts#L19)

约束边界类。
物理引擎中MLCP（混合线性互补问题）求解的核心边界模型类，核心作用：
1. 封装单组约束边界的完整状态（有界/无界索引、符号标记、RHS值）；
2. 实现基于质量矩阵的约束冲量计算，验证边界条件的可行性；
3. 支持质量矩阵子矩阵缓存复用，避免重复计算，提升求解性能；
核心特性：
- 内存预分配：构造时初始化固定大小的类型化数组，符合物理引擎内存优化策略；
- 状态复用：通过init方法重置边界状态，支持多次复用同一实例；
- 缓存优化：基于matrixId的质量矩阵子矩阵缓存机制，大幅减少矩阵计算开销；
- 精度控制：引入SETTING_DIRECT_MLCP_SOLVER_EPS阈值，适配浮点精度问题；
主要应用场景：PGS/MLCP约束求解的边界条件验证、关节约束冲量计算、约束可行域判断。

## Constructors

### Constructor

> **new Boundary**(`maxRows`): `Boundary`

Defined in: [constraint/solver/direct/boundary.ts:99](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/solver/direct/boundary.ts#L99)

构造函数：初始化约束边界实例。
核心初始化逻辑：
1. 预分配所有类型化数组缓冲区，长度均为maxRows：
   - iBounded/iUnbounded/signs：Int8Array，最小化内存占用；
   - b：Float64Array，保证浮点计算精度；
2. 所有状态变量初始化为0，保证初始状态一致性；
工程化设计：预分配连续内存缓冲区，符合物理引擎“空间换时间”的优化思路，避免运行时动态扩容。

#### Parameters

##### maxRows

`number`

最大约束行数（边界维度上限）

#### Returns

`Boundary`

## Properties

### b

> **b**: `Float64Array`

Defined in: [constraint/solver/direct/boundary.ts:57](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/solver/direct/boundary.ts#L57)

约束边界RHS（右手项）数组。
存储MLCP求解的右手项值，核心作用：
1. 每个元素对应约束行的修正后RHS值（含冲量因子、相对速度、CFM项）；
2. 使用Float64Array保证浮点计算精度，适配物理引擎的高精度需求；
计算时机：computeImpulses方法中先更新无界约束行的b值，再用于冲量计算。

***

### iBounded

> **iBounded**: `Int8Array`

Defined in: [constraint/solver/direct/boundary.ts:28](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/solver/direct/boundary.ts#L28)

有界约束行索引数组。
存储当前边界中具有明确冲量限制的约束行索引，核心特性：
1. 元素类型为Int8，适配小范围索引值（0~maxRows-1），最小化内存占用；
2. 有效元素数量由numBounded标识，前numBounded个元素为有效索引；
3. 与signs数组一一对应，标识每个有界约束行的符号方向（-1/0/1）；
初始化规则：构造时预分配内存，init方法从BoundaryBuildInfo同步数据。

***

### iUnbounded

> **iUnbounded**: `Int8Array`

Defined in: [constraint/solver/direct/boundary.ts:38](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/solver/direct/boundary.ts#L38)

无界约束行索引数组。
存储当前边界中无冲量限制的约束行索引，核心特性：
1. 元素类型为Int8，内存布局与iBounded一致；
2. 有效元素数量由numUnbounded标识，前numUnbounded个元素为有效索引；
3. 用于构建质量矩阵子矩阵，是MLCP求解的核心维度；
关联属性：matrixId由该数组索引的位掩码生成，用于缓存子矩阵。

***

### matrixId

> **matrixId**: `number` = `0`

Defined in: [constraint/solver/direct/boundary.ts:87](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/solver/direct/boundary.ts#L87)

质量矩阵子矩阵缓存ID。
基于无界约束行索引的位掩码标识，核心作用：
1. 通过位运算（1 << idx）生成唯一ID，标识当前无界约束行组合；
2. 作为massMatrix缓存的键值，避免重复计算相同的子矩阵；
3. init方法中重置为0，computeImpulses中可重新计算。
设计价值：大幅减少质量矩阵子矩阵的计算次数，提升MLCP求解性能。

#### Default

```ts
0
```

***

### numBounded

> **numBounded**: `number` = `0`

Defined in: [constraint/solver/direct/boundary.ts:66](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/solver/direct/boundary.ts#L66)

有界约束行数量。
标识iBounded数组的有效元素数量，核心特性：
1. init方法中从BoundaryBuildInfo同步，取值范围：0 ≤ numBounded ≤ maxRows；
2. 作为遍历iBounded和signs数组的终止条件，避免无效遍历。

#### Default

```ts
0
```

***

### numUnbounded

> **numUnbounded**: `number` = `0`

Defined in: [constraint/solver/direct/boundary.ts:76](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/solver/direct/boundary.ts#L76)

无界约束行数量。
标识iUnbounded数组的有效元素数量，核心特性：
1. init方法中从BoundaryBuildInfo同步，取值范围：0 ≤ numUnbounded ≤ maxRows；
2. 约束规则：numBounded + numUnbounded ≤ maxRows，保证维度完整性；
3. 作为构建质量矩阵子矩阵的维度基准。

#### Default

```ts
0
```

***

### signs

> **signs**: `Int8Array`

Defined in: [constraint/solver/direct/boundary.ts:48](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/solver/direct/boundary.ts#L48)

有界约束行符号标记数组。
标记有界约束行的冲量限制方向，核心取值：
- -1：约束行受下边界限制（冲量 ≥ minImpulse）；
- 1：约束行受上边界限制（冲量 ≤ maxImpulse）；
- 0：约束行冲量固定为0（minImpulse=maxImpulse=0）；
关联关系：与iBounded数组一一对应，长度由maxRows限定。

## Methods

### computeImpulses()

> **computeImpulses**(`info`, `mass`, `relVels`, `impulses`, `dImpulses`, `impulseFactor`, `noCheck`): `boolean`

Defined in: [constraint/solver/direct/boundary.ts:165](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/solver/direct/boundary.ts#L165)

计算约束冲量并验证边界可行性。
核心计算流程（分四阶段）：
【阶段1：更新无界约束RHS值】
- 遍历无界约束行，计算修正后的b值：b[idx] = row.rhs*factor - relVels[idx] - row.cfm*impulses[idx]；
【阶段2：计算有界约束冲量增量】
- 基于符号标记计算有界约束的目标冲量增量dImpulse；
- 更新无界约束的b值（扣除有界冲量的影响）；
【阶段3：质量矩阵子矩阵计算/缓存】
- 基于无界约束索引生成缓存ID，优先使用缓存的子矩阵，未缓存则计算并缓存；
【阶段4：冲量计算与边界验证】
1. 无界约束冲量验证：计算冲量并检查是否在[minImpulse-MSE, maxImpulse+MSE]范围内；
2. 有界约束误差验证（可选）：计算冲量更新后的约束误差，检查是否满足符号标记的限制；
关键优化点：
- 质量矩阵子矩阵缓存：避免重复计算高开销的矩阵求逆/分解操作；
- 精度阈值MSE：适配浮点计算误差，防止误判边界可行性；
- 类型化数组：全程使用Float64Array保证计算精度，Int8Array减少内存占用；
核心价值：是MLCP求解的核心实现，判断当前边界组合是否为可行解，为约束求解提供决策依据。

#### Parameters

##### info

[`JointSolverInfo`](../../../../joint/joint-solver-info/classes/JointSolverInfo.md)

关节约束求解信息，提供约束行的冲量限制、RHS等参数

##### mass

[`MassMatrix`](../../mass-matrix/classes/MassMatrix.md)

质量矩阵实例，提供子矩阵计算和缓存能力

##### relVels

`Float64Array`

相对速度数组，存储各约束行的当前相对速度

##### impulses

`Float64Array`

冲量数组，存储各约束行的当前冲量值

##### dImpulses

`Float64Array`

冲量增量数组，输出计算得到的冲量变化值

##### impulseFactor

`number`

冲量缩放因子，适配时间步长或帧率补偿

##### noCheck

`boolean`

是否跳过边界验证（仅计算冲量，不验证可行性）

#### Returns

`boolean`

边界是否可行（冲量在限制范围内且误差满足精度要求）

***

### init()

> **init**(`buildInfo`): `void`

Defined in: [constraint/solver/direct/boundary.ts:119](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/solver/direct/boundary.ts#L119)

初始化边界状态。
核心初始化逻辑：
1. 同步有界约束状态：从buildInfo拷贝numBounded、iBounded、signs数据；
2. 同步无界约束状态：从buildInfo拷贝numUnbounded、iUnbounded数据；
3. 生成矩阵缓存ID：通过位运算（1 << idx）为当前无界约束组合生成唯一matrixId；
4. 重置matrixId初始值为0，保证位运算准确性；
设计价值：
- 支持边界实例复用，避免频繁创建/销毁带来的GC开销；
- 一次性拷贝所有状态数据，比逐行赋值更高效；
- 预先生成matrixId，为后续质量矩阵缓存做准备。

#### Parameters

##### buildInfo

[`BoundaryBuildInfo`](../../boundary-build-info/classes/BoundaryBuildInfo.md)

边界构建信息容器，提供初始化数据源

#### Returns

`void`
