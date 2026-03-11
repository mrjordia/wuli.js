[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [collision-detector/cached-detector-data](../README.md) / CachedDetectorData

# Class: CachedDetectorData

Defined in: [collision-detector/cached-detector-data.ts:9](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/collision-detector/cached-detector-data.ts#L9)

碰撞检测器缓存数据类。
物理引擎碰撞检测器的缓存容器，用于存储检测器运行过程中可复用的中间数据，
核心作用是优化重复碰撞检测的性能（如避免重复计算GJK算法的凸包顶点），
支持缓存数据的统一清空，保证检测状态的一致性。

## Constructors

### Constructor

> **new CachedDetectorData**(): `CachedDetectorData`

#### Returns

`CachedDetectorData`

## Properties

### gjkCache?

> `optional` **gjkCache**: [`GjkCache`](../../gjk-epa-detector/gjk-cache/classes/GjkCache.md)

Defined in: [collision-detector/cached-detector-data.ts:15](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/collision-detector/cached-detector-data.ts#L15)

GJK-EPA算法缓存数据。
可选属性，存储GJK-EPA碰撞检测算法的中间缓存数据（如最近的单纯形、顶点索引等），
仅在使用GJK-EPA检测器时赋值，未使用时为undefined，避免无效内存占用。

## Methods

### clear()

> **clear**(): `void`

Defined in: [collision-detector/cached-detector-data.ts:24](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/collision-detector/cached-detector-data.ts#L24)

清空所有缓存数据。
核心逻辑：
1. 判空后调用GJK缓存的clear方法，重置GJK-EPA算法的中间数据；
2. 仅处理已初始化的缓存数据，避免空指针异常；
用途：在碰撞检测周期结束后重置缓存，保证下一次检测的初始状态干净。

#### Returns

`void`
