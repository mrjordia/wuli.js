[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [broad-phase/bvh-broad-phase/bvh-strategy](../README.md) / BvhStrategy

# Class: BvhStrategy

Defined in: [broad-phase/bvh-broad-phase/bvh-strategy.ts:16](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/broad-phase/bvh-broad-phase/bvh-strategy.ts#L16)

BVH（边界体积层次）树策略核心类。
物理引擎中BVH树构建与更新的核心策略类，核心作用：
1. 定义BVH节点插入策略，决定新叶子节点的最优插入位置；
2. 实现BVH树节点分割算法，基于空间方差划分叶子节点集合；
3. 计算节点插入的代价（Cost），优化BVH树的空间划分效率；
核心特性：
- 支持多套插入策略（中心点距离/代价计算），可通过_insertionStrategy切换；
- 内置临时数组缓存（_tv0/_tv1等），避免频繁内存分配；
- 支持树平衡开关（balancingEnabled），适配不同性能/精度需求；
主要应用场景：BVHBroadphase粗检测中BVH树的动态构建、节点插入、树结构优化。

## Constructors

### Constructor

> **new BvhStrategy**(): `BvhStrategy`

#### Returns

`BvhStrategy`

## Properties

### balancingEnabled

> **balancingEnabled**: `boolean` = `false`

Defined in: [broad-phase/bvh-broad-phase/bvh-strategy.ts:30](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/broad-phase/bvh-broad-phase/bvh-strategy.ts#L30)

树平衡开关。
是否启用BVH树的平衡优化：
- true：插入/分割节点时优化树的高度平衡，提升查询效率；
- false：关闭平衡优化，优先保证插入速度；
初始值为false，适用于动态性低的场景。

## Methods

### decideInsertion()

> **decideInsertion**(`currentNode`, `leaf`): `-1` \| `0` \| `1`

Defined in: [broad-phase/bvh-broad-phase/bvh-strategy.ts:49](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/broad-phase/bvh-broad-phase/bvh-strategy.ts#L49)

决定新叶子节点的插入位置。
核心逻辑：根据_insertionStrategy选择不同的插入策略：
1. 策略0（中心点距离）：
   - 计算新叶子节点中心点与当前节点左右子节点中心点的欧氏距离；
   - 选择距离更近的子节点作为插入目标；
2. 策略1（代价计算）：
   - 计算插入到左右子节点的AABB扩展代价、新建分支的创建代价；
   - 选择总代价最小的方案作为插入决策；
3. 无效策略：打印警告日志，默认返回-1。

#### Parameters

##### currentNode

[`BvhNode`](../../bvh-node/classes/BvhNode.md)

当前待判断的非叶子节点

##### leaf

[`BvhNode`](../../bvh-node/classes/BvhNode.md)

待插入的新叶子节点

#### Returns

`-1` \| `0` \| `1`

- 插入决策结果：
  - -1：在当前节点下新建分支（代价策略专属）；
  - 0：插入到当前节点的左子节点（children[0]）；
  - 1：插入到当前节点的右子节点（children[1]）；

***

### splitLeaves()

> **splitLeaves**(`leaves`, `from`, `until`): `number`

Defined in: [broad-phase/bvh-broad-phase/bvh-strategy.ts:103](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/broad-phase/bvh-broad-phase/bvh-strategy.ts#L103)

分割叶子节点集合（BVH树构建核心）。
基于空间方差的节点分割算法，核心逻辑：
1. 计算叶子节点集合的中心点均值（centerMean）；
2. 计算各轴（x/y/z）的方差，选择方差最大的轴作为分割轴；
3. 基于分割轴的均值，使用双指针法将叶子节点划分为左右两部分；
4. 返回分割点索引，用于构建BVH树的左右子节点；
核心目的：使分割后的左右子节点AABB重叠最小，提升BVH查询效率。

#### Parameters

##### leaves

[`BvhNode`](../../bvh-node/classes/BvhNode.md)[]

待分割的叶子节点数组

##### from

`number`

分割起始索引（包含）

##### until

`number`

分割结束索引（不包含）

#### Returns

`number`

- 分割点索引（左半部分到该索引，右半部分从该索引开始）
