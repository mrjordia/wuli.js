[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [collision-detector/gjk-epa-detector/gjk-cache](../README.md) / GjkCache

# Class: GjkCache

Defined in: [collision-detector/gjk-epa-detector/gjk-cache.ts:12](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/gjk-epa-detector/gjk-cache.ts#L12)

GJK（Gilbert-Johnson-Keerthi）算法缓存类。
用于存储GJK算法迭代过程中的关键缓存数据，优化算法迭代效率；
核心作用：
1. 缓存上一次迭代计算出的最近方向向量，作为下一次迭代的初始搜索方向；
2. 避免每次迭代都从默认方向开始搜索，减少算法迭代次数，提升碰撞检测性能；
GJK算法是用于检测两个凸几何体是否碰撞的经典算法，该类是算法性能优化的辅助数据结构。

## Constructors

### Constructor

> **new GjkCache**(): `GjkCache`

#### Returns

`GjkCache`

## Properties

### prevClosestDir

> **prevClosestDir**: [`Vec3`](../../../../common/vec3/classes/Vec3.md)

Defined in: [collision-detector/gjk-epa-detector/gjk-cache.ts:18](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/gjk-epa-detector/gjk-cache.ts#L18)

上一次迭代的最近方向向量（缓存核心数据）。
存储GJK算法上一次迭代中计算出的指向原点的最近方向向量，
作为下一次迭代的初始搜索方向，加速算法收敛。

## Methods

### clear()

> **clear**(): `void`

Defined in: [collision-detector/gjk-epa-detector/gjk-cache.ts:28](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/gjk-epa-detector/gjk-cache.ts#L28)

清空GJK缓存数据，重置为初始状态。
核心逻辑：
1. 将缓存的最近方向向量（prevClosestDir）的所有元素置为0；
2. 重置缓存状态，保证下一次算法迭代从默认初始方向开始；
3. 通常在每次完整的GJK碰撞检测开始前调用，避免历史缓存干扰。

#### Returns

`void`
