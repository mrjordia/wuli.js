[**wuli.js API文档**](../../../../../README.md)

***

[wuli.js API文档](../../../../../modules.md) / [constraint/solver/direct/boundary-selector](../README.md) / BoundarySelector

# Class: BoundarySelector

Defined in: [constraint/solver/direct/boundary-selector.ts:14](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/boundary-selector.ts#L14)

边界索引选择器类。
物理引擎中边界索引的动态管理与排序工具类，核心作用：
1. 维护边界维度索引的有序数组，支持快速选中指定索引并置顶；
2. 按尺寸阈值分割索引数组，分离有效/无效边界索引，适配动态维度调整；
3. 采用双Int8Array缓冲区交换策略，避免数组拷贝开销，提升索引操作性能；
核心特性：
- 轻量级存储：使用Int8Array存储索引，最小化内存占用（适配小范围索引场景）；
- 原地操作：索引交换、分割均在预分配缓冲区完成，无额外内存分配；
- 状态一致性：构造时初始化连续索引序列，保证初始状态的规范性；
- 高效分割：线性遍历+双指针策略分割索引数组，时间复杂度O(n)；
主要应用场景：物理引擎边界求解的索引优先级调整、动态维度裁剪、约束行筛选等场景。

## Constructors

### Constructor

> **new BoundarySelector**(`n`): `BoundarySelector`

Defined in: [constraint/solver/direct/boundary-selector.ts:53](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/boundary-selector.ts#L53)

构造函数：初始化边界索引选择器。
核心初始化逻辑：
1. 赋值索引数组总长度n，作为缓冲区大小基准；
2. 预分配indices和tmpIndices两个Int8Array缓冲区，长度均为n；
3. 初始化indices为连续索引序列[0,1,2,...,n-1]，保证初始状态的规范性；
工程化设计：预分配连续内存缓冲区，符合物理引擎“空间换时间”的优化思路，避免运行时动态扩容。

#### Parameters

##### n

`number`

索引数组总长度（最大维度数量）

#### Returns

`BoundarySelector`

## Properties

### indices

> **indices**: `Int8Array`

Defined in: [constraint/solver/direct/boundary-selector.ts:32](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/boundary-selector.ts#L32)

活跃索引数组。
存储当前有效的边界索引序列，核心特性：
1. 元素类型为Int8，适配小范围索引值（0~n-1），节省内存；
2. 构造时初始化为连续序列[0,1,2,...,n-1]，保证初始状态有序；
3. 支持动态排序（select方法）和分割（setSize方法），是索引操作的核心载体；
访问规则：通过getIndex方法读取，避免直接操作导致的状态不一致。

***

### n

> **n**: `number`

Defined in: [constraint/solver/direct/boundary-selector.ts:22](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/boundary-selector.ts#L22)

索引数组总长度。
限定索引管理的最大维度数量，核心作用：
1. 作为indices和tmpIndices数组的初始化长度，固定缓冲区大小；
2. 限制索引操作的边界范围，防止数组越界访问；
初始化规则：由构造函数参数指定，实例生命周期内保持不变。

***

### tmpIndices

> **tmpIndices**: `Int8Array`

Defined in: [constraint/solver/direct/boundary-selector.ts:42](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/boundary-selector.ts#L42)

临时索引缓冲区。
索引分割操作的临时存储缓冲区，核心作用：
1. 作为setSize方法的辅助存储，避免在原数组上直接修改导致的数据混乱；
2. 与indices数组长度相同（n），采用交换策略复用缓冲区，减少内存分配；
3. 仅在setSize操作时活跃，操作完成后与indices交换角色；
设计价值：双缓冲区交换避免数组拷贝，提升大维度场景下的操作效率。

## Methods

### getIndex()

> **getIndex**(`i`): `number`

Defined in: [constraint/solver/direct/boundary-selector.ts:73](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/boundary-selector.ts#L73)

获取指定位置的索引值。
索引数组的安全访问接口，核心作用：
1. 封装indices数组的直接访问，提供统一的读取入口；
2. 保证索引读取的一致性，避免外部直接修改indices导致的状态错误；
应用场景：遍历边界索引、获取指定位置的优先级索引等。

#### Parameters

##### i

`number`

索引数组的位置下标（0 ≤ i < n）

#### Returns

`number`

对应位置存储的边界索引值

***

### select()

> **select**(`index`): `void`

Defined in: [constraint/solver/direct/boundary-selector.ts:87](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/boundary-selector.ts#L87)

选中指定索引并置顶。
核心操作逻辑（原地冒泡排序）：
1. 线性遍历indices数组，找到目标索引的位置i；
2. 从位置i向前冒泡交换，将目标索引逐步移动到数组首位（置顶）；
3. 所有交换操作在indices数组原地完成，无额外内存分配；
设计目的：提升指定索引的优先级，使其在后续边界处理中优先被访问；
性能说明：时间复杂度O(n)，适用于小维度（n≤32）的物理引擎场景。

#### Parameters

##### index

`number`

需要选中的边界索引值（需存在于indices数组中）

#### Returns

`void`

***

### setSize()

> **setSize**(`size`): `void`

Defined in: [constraint/solver/direct/boundary-selector.ts:113](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/boundary-selector.ts#L113)

按尺寸阈值分割索引数组。
核心分割逻辑（双指针+缓冲区交换）：
1. 初始化两个计数器numSmaller（<size的索引数）、numGreater（≥size的索引数）；
2. 遍历indices数组，将索引分为两类：
   - 小于size的索引：存入tmpIndices的前numSmaller位置；
   - 大于等于size的索引：存入tmpIndices的size+numGreater位置；
3. 交换indices和tmpIndices的引用，完成分割操作；
设计优势：
- 线性遍历仅需一次O(n)操作，分割效率高；
- 缓冲区交换避免数组拷贝，仅修改引用指针，性能开销极小；
- 保持同类索引的相对顺序，保证分割后的索引序列稳定性；
应用场景：动态裁剪边界维度、筛选有效约束行索引、适配不同规模的边界求解场景。

#### Parameters

##### size

`number`

分割阈值（有效索引的上限）

#### Returns

`void`
