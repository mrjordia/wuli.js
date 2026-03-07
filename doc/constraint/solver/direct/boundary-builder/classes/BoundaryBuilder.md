[**wuli.js API文档**](../../../../../README.md)

***

[wuli.js API文档](../../../../../modules.md) / [constraint/solver/direct/boundary-builder](../README.md) / BoundaryBuilder

# Class: BoundaryBuilder

Defined in: [constraint/solver/direct/boundary-builder.ts:18](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/solver/direct/boundary-builder.ts#L18)

边界构建器类。
物理引擎中基于关节约束信息递归构建边界的核心工具类，核心作用：
1. 解析关节约束的冲量限制规则，递归生成所有可能的边界组合；
2. 管理边界实例的内存复用，避免频繁创建/销毁Boundary对象带来的GC开销；
3. 封装边界构建的完整流程，将JointSolverInfo转换为可用于约束求解的Boundary实例集合；
核心特性：
- 递归构建：采用深度优先递归算法遍历所有约束行的边界状态，保证边界组合的完整性；
- 内存复用：预分配边界数组缓冲区，复用已有Boundary实例，降低内存分配开销；
- 状态回溯：构建过程中动态维护BoundaryBuildInfo的计数状态，递归返回时自动回溯，保证状态一致性；
- 阈值优化：通过大数阈值（1e65536）判断约束限制是否生效，适配浮点精度场景；
主要应用场景：关节约束的边界求解、凸多面体约束空间构建、PGS迭代求解的边界条件生成。

## Constructors

### Constructor

> **new BoundaryBuilder**(`maxRows`): `BoundaryBuilder`

Defined in: [constraint/solver/direct/boundary-builder.ts:68](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/solver/direct/boundary-builder.ts#L68)

构造函数：初始化边界构建器。
核心初始化逻辑：
1. 赋值最大约束行数maxRows，作为所有边界构建的维度基准；
2. 预分配边界数组缓冲区，长度为2^maxRows（所有可能的边界组合数）；
3. 创建BoundaryBuildInfo实例，维度与maxRows保持一致；
工程化设计：预分配数组缓冲区符合物理引擎“空间换时间”的优化思路，减少运行时内存操作。

#### Parameters

##### maxRows

`number`

最大约束行数（边界维度上限）

#### Returns

`BoundaryBuilder`

## Properties

### bbInfo

> **bbInfo**: [`BoundaryBuildInfo`](../../boundary-build-info/classes/BoundaryBuildInfo.md)

Defined in: [constraint/solver/direct/boundary-builder.ts:57](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/solver/direct/boundary-builder.ts#L57)

边界构建信息容器。
存储边界构建过程中的临时状态数据，核心作用：
1. 维护有界/无界约束行的索引和符号标记；
2. 递归过程中动态更新计数状态，返回时自动回溯，保证状态一致性；
3. 作为Boundary实例初始化的数据源，传递边界构建的核心参数；
初始化规则：构造函数中创建，与maxRows维度匹配。

***

### boundaries

> **boundaries**: [`Boundary`](../../boundary/classes/Boundary.md)[]

Defined in: [constraint/solver/direct/boundary-builder.ts:47](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/solver/direct/boundary-builder.ts#L47)

边界实例数组。
存储所有边界实例的缓冲区，核心特性：
1. 数组长度为2^maxRows，预分配所有可能的边界组合空间；
2. 采用“惰性初始化”策略：仅在需要时创建Boundary实例，复用已有实例避免重复分配；
3. 数组索引与边界组合一一对应，支持快速访问特定边界实例；
内存优化：数组元素初始为undefined，首次使用时创建，后续复用。

***

### maxRows

> **maxRows**: `number`

Defined in: [constraint/solver/direct/boundary-builder.ts:27](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/solver/direct/boundary-builder.ts#L27)

最大约束行数（边界维度上限）。
限定边界构建的最大约束行数量，核心作用：
1. 作为边界数组（boundaries）的长度基准（2^maxRows），预分配所有可能的边界组合空间；
2. 限制递归深度，防止无限递归导致的栈溢出；
3. 与BoundaryBuildInfo的size参数保持一致，保证数据维度匹配；
初始化规则：由构造函数参数指定，实例生命周期内不可修改。

***

### numBoundaries

> **numBoundaries**: `number` = `0`

Defined in: [constraint/solver/direct/boundary-builder.ts:37](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/solver/direct/boundary-builder.ts#L37)

已构建的边界数量。
记录当前有效边界实例的数量，核心特性：
1. 初始值为0，buildBoundaries调用时重置为0，构建过程中动态递增；
2. 作为boundaries数组的有效元素长度标识，取值范围：0 ≤ numBoundaries ≤ 2^maxRows；
3. 边界构建完成后，可通过该值遍历所有有效边界实例。

#### Default

```ts
0
```

## Methods

### buildBoundaries()

> **buildBoundaries**(`info`): `void`

Defined in: [constraint/solver/direct/boundary-builder.ts:143](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/solver/direct/boundary-builder.ts#L143)

构建边界入口方法。
边界构建的统一入口，核心流程：
1. 重置状态：将已构建边界数量numBoundaries置0，清空bbInfo的有界/无界计数；
2. 启动递归：调用buildBoundariesRecursive从第0行开始递归构建所有边界；
工程化价值：
- 封装递归入口，对外提供简洁的调用接口，隐藏递归实现细节；
- 构建前重置所有状态，保证多次调用的独立性和状态一致性；
执行时机：关节约束求解前，解析约束冲量限制并生成边界条件。

#### Parameters

##### info

[`JointSolverInfo`](../../../../joint/joint-solver-info/classes/JointSolverInfo.md)

关节约束求解信息，包含所有约束行的冲量限制规则

#### Returns

`void`

***

### buildBoundariesRecursive()

> **buildBoundariesRecursive**(`info`, `i`): `void`

Defined in: [constraint/solver/direct/boundary-builder.ts:89](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/solver/direct/boundary-builder.ts#L89)

递归构建边界。
核心递归逻辑（深度优先遍历）：
1. 终止条件：i === info.numRows时，创建/复用Boundary实例并初始化，完成一组边界构建；
2. 约束行状态判断：
   - 冲量上下限均为0：标记为有界且符号为0，递归处理下一行；
   - 其他情况：先标记为无界，递归处理下一行，再分别处理上下限生效的有界状态；
3. 状态回溯：递归返回后恢复bbInfo的计数状态（numBounded/numUnbounded），避免状态污染；
关键优化点：
- 使用1e65536大数阈值判断约束限制是否生效，适配浮点精度问题；
- 复用已有Boundary实例，仅在实例不存在时创建，降低内存分配开销；
- 递归过程中通过临时变量_this减少bbInfo属性访问开销。

#### Parameters

##### info

[`JointSolverInfo`](../../../../joint/joint-solver-info/classes/JointSolverInfo.md)

关节约束求解信息，包含所有约束行的冲量限制规则

##### i

`number`

当前递归处理的约束行索引

#### Returns

`void`
