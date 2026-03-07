[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [constraint/contact/manifold-updater](../README.md) / ManifoldUpdater

# Class: ManifoldUpdater

Defined in: [constraint/contact/manifold-updater.ts:13](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/manifold-updater.ts#L13)

碰撞流形更新器类。
负责碰撞流形（Manifold）的全生命周期更新管理，包括接触点的添加、移除、位置/深度更新、热启动数据继承、
             新旧接触点匹配等核心功能，是物理引擎中碰撞响应连续性的关键组件

## Constructors

### Constructor

> **new ManifoldUpdater**(`manifold`): `ManifoldUpdater`

Defined in: [constraint/contact/manifold-updater.ts:39](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/manifold-updater.ts#L39)

构造函数：初始化碰撞流形更新器。
初始化时创建oldPoints数组的ManifoldPoint实例，避免运行时动态创建，优化内存性能

#### Parameters

##### manifold

[`Manifold`](../../manifold/classes/Manifold.md)

待管理的碰撞流形实例 - 必须传入有效的Manifold实例，后续所有更新操作均作用于此实例

#### Returns

`ManifoldUpdater`

## Properties

### \_manifold

> **\_manifold**: [`Manifold`](../../manifold/classes/Manifold.md)

Defined in: [constraint/contact/manifold-updater.ts:18](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/manifold-updater.ts#L18)

待管理的碰撞流形实例。
指向需要进行接触点更新的Manifold实例，所有操作均基于此实例完成

***

### numOldPoints

> **numOldPoints**: `number` = `0`

Defined in: [constraint/contact/manifold-updater.ts:25](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/manifold-updater.ts#L25)

旧接触点的数量。
在全量更新时，用于暂存更新前的有效接触点数量，辅助新旧接触点的数据继承

#### Default

```ts
0
```

***

### oldPoints

> **oldPoints**: [`ManifoldPoint`](../../manifold-point/classes/ManifoldPoint.md)[]

Defined in: [constraint/contact/manifold-updater.ts:32](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/manifold-updater.ts#L32)

旧接触点缓存数组。
预分配固定长度的ManifoldPoint数组，长度与SETTING_MAX_MANIFOLD_POINTS一致，
             用于在更新过程中缓存旧的接触点数据，实现冲量的热启动（Warm Starting）

## Methods

### addManifoldPoint()

> **addManifoldPoint**(`point`, `_tf1`, `_tf2`): `void`

Defined in: [constraint/contact/manifold-updater.ts:114](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/manifold-updater.ts#L114)

向碰撞流形添加新的接触点。
核心逻辑：
             1. 若接触点数量已达最大值（SETTING_MAX_MANIFOLD_POINTS），则替换最优目标索引的接触点
             2. 若还有剩余空间，则使用最后一个空闲接触点
             3. 将检测结果点的世界坐标转换为物体局部坐标和相对质心坐标
             4. 初始化接触点的深度、冲量、ID等属性

#### Parameters

##### point

[`DetectorResultPoint`](../../../../collision-detector/detector-result-point/classes/DetectorResultPoint.md)

碰撞检测结果点 - 包含接触点的世界坐标、穿透深度、ID等信息

##### \_tf1

[`Transform`](../../../../common/transform/classes/Transform.md)

第一个物体的变换信息 - 用于局部/世界坐标转换

##### \_tf2

[`Transform`](../../../../common/transform/classes/Transform.md)

第二个物体的变换信息 - 用于局部/世界坐标转换

#### Returns

`void`

***

### computeRelativePositions()

> **computeRelativePositions**(`_tf1`, `_tf2`): `void`

Defined in: [constraint/contact/manifold-updater.ts:287](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/manifold-updater.ts#L287)

计算所有接触点的相对质心坐标。
核心逻辑：
             1. 将每个接触点的局部坐标通过物体的旋转矩阵转换为相对质心坐标（relPos1/relPos2）
             2. 标记接触点为已热启动（warmStarted=true），表示冲量数据可复用
             注：相对质心坐标 = 旋转矩阵 × 局部坐标

#### Parameters

##### \_tf1

[`Transform`](../../../../common/transform/classes/Transform.md)

第一个物体的变换信息 - 包含旋转矩阵，用于局部→相对坐标转换

##### \_tf2

[`Transform`](../../../../common/transform/classes/Transform.md)

第二个物体的变换信息 - 包含旋转矩阵，用于局部→相对坐标转换

#### Returns

`void`

***

### computeTargetIndex()

> **computeTargetIndex**(`newPoint`, `_tf1`, `_tf2`): `number`

Defined in: [constraint/contact/manifold-updater.ts:175](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/manifold-updater.ts#L175)

计算最优替换的接触点索引（当接触点数量达上限时）。
核心算法：
             1. 找到当前穿透深度最大的接触点（优先保留大深度点，不替换）
             2. 计算新点与现有三个接触点构成的四面体体积（通过叉积模长平方表示）
             3. 分别计算移除不同接触点后的体积，选择体积最大的组合对应的移除索引
             目的：保留能最大化接触区域覆盖的接触点集合，提升碰撞响应的稳定性

#### Parameters

##### newPoint

[`DetectorResultPoint`](../../../../collision-detector/detector-result-point/classes/DetectorResultPoint.md)

新的碰撞检测点 - 待添加的接触点

##### \_tf1

[`Transform`](../../../../common/transform/classes/Transform.md)

第一个物体的变换信息 - 用于坐标转换

##### \_tf2

[`Transform`](../../../../common/transform/classes/Transform.md)

第二个物体的变换信息 - 用于坐标转换

#### Returns

`number`

最优替换的接触点索引（0~3）

***

### findNearestContactPointIndex()

> **findNearestContactPointIndex**(`target`, `_tf1`, `_tf2`): `number`

Defined in: [constraint/contact/manifold-updater.ts:316](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/manifold-updater.ts#L316)

查找与新检测点最近的现有接触点索引。
匹配逻辑：
             1. 将新点的世界坐标转换为相对质心坐标
             2. 计算新点与每个现有接触点的相对坐标平方距离（分别计算两个物体侧）
             3. 选择最小平方距离小于阈值的接触点作为匹配结果
             用途：增量更新时复用已有接触点的冲量数据，实现热启动

#### Parameters

##### target

[`DetectorResultPoint`](../../../../collision-detector/detector-result-point/classes/DetectorResultPoint.md)

新的碰撞检测点 - 待匹配的接触点

##### \_tf1

[`Transform`](../../../../common/transform/classes/Transform.md)

第一个物体的变换信息 - 用于世界→相对坐标转换

##### \_tf2

[`Transform`](../../../../common/transform/classes/Transform.md)

第二个物体的变换信息 - 用于世界→相对坐标转换

#### Returns

`number`

最近接触点的索引，无匹配则返回-1

***

### incrementalUpdate()

> **incrementalUpdate**(`result`, `_tf1`, `_tf2`): `void`

Defined in: [constraint/contact/manifold-updater.ts:430](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/manifold-updater.ts#L430)

增量更新碰撞流形（复用现有接触点，仅更新/添加新点）。
增量更新流程（适用于连续碰撞帧）：
             1. 更新现有接触点的深度和位置
             2. 标记所有现有接触点为已热启动
             3. 匹配新检测点与现有接触点：
                - 找到匹配点：更新该点的坐标和深度
                - 未找到匹配点：添加新接触点
             4. 移除过期的接触点，保持接触点有效性
             注：增量更新能保持碰撞响应的连续性，减少抖动

#### Parameters

##### result

[`DetectorResult`](../../../../collision-detector/detector-result/classes/DetectorResult.md)

碰撞检测结果 - 包含最新的单个接触点信息

##### \_tf1

[`Transform`](../../../../common/transform/classes/Transform.md)

第一个物体的变换信息 - 用于坐标转换

##### \_tf2

[`Transform`](../../../../common/transform/classes/Transform.md)

第二个物体的变换信息 - 用于坐标转换

#### Returns

`void`

***

### removeManifoldPoint()

> **removeManifoldPoint**(`index`): `void`

Defined in: [constraint/contact/manifold-updater.ts:80](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/manifold-updater.ts#L80)

移除指定索引的接触点并重置数据。
核心逻辑：
             1. 将待移除的接触点与最后一个有效接触点交换位置
             2. 减少有效接触点数量（numPoints）
             3. 重置最后一个接触点的所有数据（坐标、深度、冲量、状态等）为初始值
             注：采用交换而非直接删除的方式，避免数组元素移位，提升性能

#### Parameters

##### index

`number`

待移除的接触点索引 - 需在0 ~ numPoints-1范围内

#### Returns

`void`

***

### removeOutdatedPoints()

> **removeOutdatedPoints**(): `void`

Defined in: [constraint/contact/manifold-updater.ts:52](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/manifold-updater.ts#L52)

移除过期/无效的接触点。
根据接触点的位置和法向关系，判断接触点是否超出有效范围，移除不符合条件的接触点：
             1. 接触点在法向方向的投影超出持久化阈值（CPT）
             2. 接触点在切平面内的偏移距离超出阈值的平方
             移除后会重置该接触点的所有数据，并调整有效接触点数量

#### Returns

`void`

***

### totalUpdate()

> **totalUpdate**(`result`, `_tf1`, `_tf2`): `void`

Defined in: [constraint/contact/manifold-updater.ts:353](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/contact/manifold-updater.ts#L353)

全量更新碰撞流形（替换所有接触点）。
全量更新流程：
             1. 缓存当前所有接触点数据到oldPoints（用于冲量继承）
             2. 根据检测结果重置接触点数量，并更新所有接触点的坐标、深度、ID等信息
             3. 匹配新旧接触点的ID，继承冲量数据（热启动）
             注：适用于碰撞状态发生突变的场景（如首次碰撞、碰撞区域大幅变化）

#### Parameters

##### result

[`DetectorResult`](../../../../collision-detector/detector-result/classes/DetectorResult.md)

碰撞检测结果 - 包含最新的所有接触点信息

##### \_tf1

[`Transform`](../../../../common/transform/classes/Transform.md)

第一个物体的变换信息 - 用于坐标转换

##### \_tf2

[`Transform`](../../../../common/transform/classes/Transform.md)

第二个物体的变换信息 - 用于坐标转换

#### Returns

`void`
