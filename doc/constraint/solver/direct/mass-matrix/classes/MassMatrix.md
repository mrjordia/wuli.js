[**wuli.js API文档**](../../../../../README.md)

***

[wuli.js API文档](../../../../../modules.md) / [constraint/solver/direct/mass-matrix](../README.md) / MassMatrix

# Class: MassMatrix

Defined in: [constraint/solver/direct/mass-matrix.ts:18](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/mass-matrix.ts#L18)

质量矩阵管理类。
物理引擎中MLCP/PGS约束求解的核心质量矩阵计算与缓存管理类，核心作用：
1. 构建包含CFM（约束力混合）的逆质量矩阵，适配关节约束的物理特性；
2. 基于位掩码ID实现质量矩阵子矩阵的缓存复用，避免重复计算高开销的矩阵求逆；
3. 提供手工展开的LU分解算法（支持4/5/6维），大幅提升小维度矩阵求逆性能；
4. 维护带/不带CFM的双份逆质量矩阵，适配不同约束求解场景的精度需求；
核心特性：
- 内存预分配：构造时初始化固定大小的类型化数组，避免运行时动态扩容；
- 缓存优化：基于位掩码的子矩阵缓存机制，将O(n³)的矩阵求逆开销降至O(1)（缓存命中时）；
- 手工展开优化：针对4/5/6维矩阵的LU分解手工展开，比通用算法快10~20倍；
- 精度控制：使用Float64Array保证双精度浮点计算，适配物理引擎的高精度需求；
主要应用场景：关节约束的MLCP求解、接触约束的冲量计算、PGS迭代求解的矩阵预处理。

## Constructors

### Constructor

> **new MassMatrix**(`size`): `MassMatrix`

Defined in: [constraint/solver/direct/mass-matrix.ts:97](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/mass-matrix.ts#L97)

构造函数：初始化质量矩阵管理器。
核心初始化逻辑：
【阶段1：基础矩阵缓冲区初始化】
- 初始化tmpMatrix、invMass、invMassWithoutCfm为size×size的Float64Array数组，所有元素置0；
【阶段2：缓存系统初始化】
- 计算maxSubmatrixId = 1 << size，确定缓存数组长度；
- 初始化cacheComputed数组（所有元素为false）和cachedSubmatrices数组；
- 预分配每个子矩阵ID对应的缓存空间（通过位计数计算子矩阵维度）；
工程化优化：
- 预分配所有内存缓冲区，符合物理引擎“空间换时间”的优化思路；
- 位计数算法（85/51/15掩码）快速计算子矩阵维度，避免循环计数；
- 所有数组初始化为0，保证计算初始状态的一致性。

#### Parameters

##### size

`number`

质量矩阵的维度大小（最大约束行数）

#### Returns

`MassMatrix`

## Properties

### cacheComputed

> **cacheComputed**: `boolean`[]

Defined in: [constraint/solver/direct/mass-matrix.ts:40](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/mass-matrix.ts#L40)

子矩阵缓存状态数组。
标记子矩阵是否已计算并缓存，核心作用：
1. 数组长度为maxSubmatrixId（1 << size），每个元素对应一个子矩阵ID的缓存状态；
2. true表示该ID对应的子矩阵已计算并存入cachedSubmatrices，false表示未计算；
3. computeInvMass时重置为false，保证矩阵更新后缓存失效；
设计价值：避免重复计算相同的子矩阵，将矩阵求逆的高开销操作缓存化。

***

### cachedSubmatrices

> **cachedSubmatrices**: `Float64Array`\<`ArrayBufferLike`\>[][]

Defined in: [constraint/solver/direct/mass-matrix.ts:50](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/mass-matrix.ts#L50)

缓存的子矩阵数组。
存储预计算的质量矩阵子矩阵（已求逆），核心特性：
1. 一级索引为子矩阵ID（位掩码），二级索引为子矩阵的行/列；
2. 子矩阵维度由ID对应的约束行数量决定（通过位计数计算）；
3. 元素类型为Float64Array，保证双精度计算精度；
访问规则：computeSubmatrix时优先读取缓存，未命中则计算并缓存。

***

### invMass

> **invMass**: `Float64Array`\<`ArrayBufferLike`\>[]

Defined in: [constraint/solver/direct/mass-matrix.ts:70](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/mass-matrix.ts#L70)

包含CFM的逆质量矩阵。
存储带约束力混合（CFM）的逆质量矩阵，核心特性：
1. 二维Float64Array数组，维度为size×size，与invMassWithoutCfm结构一致；
2. 对角线元素 = invMassWithoutCfm[i][i] + info.rows[i].cfm，非对角线元素与invMassWithoutCfm相同；
3. CFM项用于添加约束阻尼，避免约束求解的数值不稳定；
应用场景：主流约束求解场景，提供更鲁棒的数值稳定性。

***

### invMassWithoutCfm

> **invMassWithoutCfm**: `Float64Array`\<`ArrayBufferLike`\>[]

Defined in: [constraint/solver/direct/mass-matrix.ts:30](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/mass-matrix.ts#L30)

不含CFM的逆质量矩阵。
存储纯物理特性的逆质量矩阵（无约束力混合），核心特性：
1. 二维Float64Array数组，维度为size×size，双精度浮点保证计算精度；
2. 元素值由刚体的逆质量和逆惯性张量与雅可比矩阵计算得出；
3. 用于对精度要求高、不需要CFM阻尼的约束求解场景；
关联属性：与invMass一一对应，仅对角线元素缺少CFM项。

***

### maxSubmatrixId

> **maxSubmatrixId**: `number`

Defined in: [constraint/solver/direct/mass-matrix.ts:80](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/mass-matrix.ts#L80)

最大子矩阵ID。
子矩阵缓存的最大ID值（1 << size），核心作用：
1. 作为cacheComputed和cachedSubmatrices数组的长度基准；
2. 每个ID对应一个唯一的约束行组合（通过位掩码表示）；
3. 取值范围：0 ≤ submatrixId < maxSubmatrixId；
计算规则：构造函数中由_size计算得出，值为2的_size次方。

***

### tmpMatrix

> **tmpMatrix**: `Float64Array`\<`ArrayBufferLike`\>[]

Defined in: [constraint/solver/direct/mass-matrix.ts:60](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/mass-matrix.ts#L60)

矩阵计算临时缓冲区。
子矩阵计算的临时存储缓冲区，核心作用：
1. 维度为size×size的Float64Array数组，用于存储原始子矩阵数据；
2. 作为LU分解的工作区，避免直接修改原始invMass矩阵；
3. 所有子矩阵计算共享该缓冲区，减少内存分配开销；
设计价值：复用单一缓冲区，避免为每个子矩阵分配临时内存。

## Methods

### computeInvMass()

> **computeInvMass**(`info`, `massData`): `void`

Defined in: [constraint/solver/direct/mass-matrix.ts:625](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/mass-matrix.ts#L625)

计算逆质量矩阵（带/不带CFM）。
核心计算流程（分三阶段）：
【阶段1：质量数据预处理】
- 提取两个刚体的逆质量和逆惯性张量，缓存为局部变量减少属性访问开销；
- 遍历所有约束行，基于雅可比矩阵的稀疏性计算质量数据中间值，存入massData；
【阶段2：逆质量矩阵构建】
- 计算矩阵元素值：结合雅可比矩阵和massData，生成对称的质量矩阵；
- 构建双份矩阵：invMass（带CFM）和invMassWithoutCfm（不带CFM）；
- 对角线元素特殊处理：invMass[i][i] = invMassWithoutCfm[i][i] + info.rows[i].cfm；
【阶段3：缓存重置】
- 将cacheComputed数组全部置为false，保证矩阵更新后缓存失效；
关键优化点：
- 局部变量缓存：将刚体惯性张量缓存为局部变量，减少对象属性访问开销；
- 稀疏性优化：基于雅可比矩阵的sparsity掩码，跳过无效计算；
- 对称性利用：仅计算上三角矩阵，拷贝到下三角，减少50%计算量；
核心公式：
- 质量矩阵元素 = J·M⁻¹·Jᵀ，其中M⁻¹为刚体的逆质量/逆惯性张量矩阵；
- CFM项仅添加到对角线，保证矩阵的正定性和数值稳定性。

#### Parameters

##### info

[`JointSolverInfo`](../../../../joint/joint-solver-info/classes/JointSolverInfo.md)

关节约束求解信息，提供雅可比矩阵、CFM、刚体信息等

##### massData

[`JointSolverMassDataRow`](../../../../joint/joint-solver-mass-data-row/classes/JointSolverMassDataRow.md)[]

质量数据缓存行数组，用于临时存储计算中间值

#### Returns

`void`

***

### computeSubmatrix()

> **computeSubmatrix**(`id`, `indices`, `size`): `void`

Defined in: [constraint/solver/direct/mass-matrix.ts:157](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/mass-matrix.ts#L157)

计算质量矩阵子矩阵（带缓存）。
核心计算流程（分两阶段）：
【阶段1：子矩阵数据拷贝】
- 从invMass中拷贝指定约束行组合的子矩阵数据到tmpMatrix；
【阶段2：LU分解求逆（手工展开优化）】
1. 4/5/6维：使用手工展开的LU分解算法，逐行逐列计算逆矩阵，性能最优；
2. 其他维度：使用通用LU分解算法，保证兼容性；
3. 结果存入cachedSubmatrices[id]，并标记cacheComputed[id] = true；
关键优化点：
- 手工展开：针对4/5/6维矩阵的LU分解完全手工展开，消除循环开销，性能提升10~20倍；
- 原地计算：所有矩阵操作在tmpMatrix中完成，减少数据拷贝；
- 对称矩阵优化：利用质量矩阵的对称性，仅计算下三角并拷贝到上三角；
核心价值：物理引擎中99%的约束求解场景为4/5/6维，手工展开算法是性能关键。

#### Parameters

##### id

`number`

子矩阵ID（约束行组合的位掩码）

##### indices

`Int8Array`

子矩阵对应的约束行索引数组

##### size

`number`

子矩阵的维度大小

#### Returns

`void`
