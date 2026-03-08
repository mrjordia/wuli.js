[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [collision-detector/gjk-epa-detector/gjk-epa](../README.md) / GjkEpa

# Class: GjkEpa

Defined in: [collision-detector/gjk-epa-detector/gjk-epa.ts:23](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/gjk-epa.ts#L23)

GJK/EPA算法核心实现类（单例模式）。
集成GJK（Gilbert-Johnson-Keerthi）和EPA（Expanding Polytope Algorithm）算法的核心实现，
提供凸几何体的碰撞检测、距离计算、连续碰撞检测（ConvexCast）、射线检测（RayCast）能力；
核心原理：
1. GJK算法：通过构建Minkowski差空间的单纯形（Simplex），迭代逼近原点，判断凸几何体是否碰撞；
2. EPA算法：在GJK基础上扩展多面体，计算精确的碰撞法线、穿透深度和接触点；
适用场景：所有凸几何体（凸多面体、球体、胶囊体等）的碰撞检测与距离计算。

## Constructors

### Constructor

> **new GjkEpa**(): `GjkEpa`

#### Returns

`GjkEpa`

## Properties

### baseDirs

> **baseDirs**: [`Vec3`](../../../../common/vec3/classes/Vec3.md)[]

Defined in: [collision-detector/gjk-epa-detector/gjk-epa.ts:35](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/gjk-epa.ts#L35)

基础方向向量（X/Y/Z轴，用于初始化单纯形搜索方向）

***

### c1

> **c1**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`ConvexGeometry`](../../../../shape/convex-geometry/classes/ConvexGeometry.md)\>

Defined in: [collision-detector/gjk-epa-detector/gjk-epa.ts:57](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/gjk-epa.ts#L57)

第一个凸几何体（碰撞检测目标1）

***

### c2

> **c2**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`ConvexGeometry`](../../../../shape/convex-geometry/classes/ConvexGeometry.md)\>

Defined in: [collision-detector/gjk-epa-detector/gjk-epa.ts:59](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/gjk-epa.ts#L59)

第二个凸几何体（碰撞检测目标2）

***

### closest

> **closest**: [`Vec3`](../../../../common/vec3/classes/Vec3.md)

Defined in: [collision-detector/gjk-epa-detector/gjk-epa.ts:49](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/gjk-epa.ts#L49)

单纯形到原点的最近点（GJK迭代目标）

***

### closestPoint1

> **closestPoint1**: [`Vec3`](../../../../common/vec3/classes/Vec3.md)

Defined in: [collision-detector/gjk-epa-detector/gjk-epa.ts:51](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/gjk-epa.ts#L51)

第一个几何体的最近点（世界空间）

***

### closestPoint2

> **closestPoint2**: [`Vec3`](../../../../common/vec3/classes/Vec3.md)

Defined in: [collision-detector/gjk-epa-detector/gjk-epa.ts:53](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/gjk-epa.ts#L53)

第二个几何体的最近点（世界空间）

***

### depth

> **depth**: `number`

Defined in: [collision-detector/gjk-epa-detector/gjk-epa.ts:65](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/gjk-epa.ts#L65)

碰撞穿透深度（EPA算法计算结果）

***

### dir

> **dir**: [`Vec3`](../../../../common/vec3/classes/Vec3.md)

Defined in: [collision-detector/gjk-epa-detector/gjk-epa.ts:47](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/gjk-epa.ts#L47)

当前搜索方向向量（GJK迭代的核心方向）

***

### distance

> **distance**: `number` = `0`

Defined in: [collision-detector/gjk-epa-detector/gjk-epa.ts:25](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/gjk-epa.ts#L25)

两个凸几何体之间的最短距离（正数=分离，负数=穿透）

***

### polyhedron

> **polyhedron**: [`EpaPolyhedron`](../../epa-polyhedron/classes/EpaPolyhedron.md)

Defined in: [collision-detector/gjk-epa-detector/gjk-epa.ts:55](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/gjk-epa.ts#L55)

EPA算法的多面体对象（用于扩展计算精确碰撞信息）

***

### rayR

> **rayR**: [`Vec3`](../../../../common/vec3/classes/Vec3.md)

Defined in: [collision-detector/gjk-epa-detector/gjk-epa.ts:43](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/gjk-epa.ts#L43)

射线R向量（ConvexCast内部计算）

***

### rayX

> **rayX**: [`Vec3`](../../../../common/vec3/classes/Vec3.md)

Defined in: [collision-detector/gjk-epa-detector/gjk-epa.ts:41](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/gjk-epa.ts#L41)

射线X向量（ConvexCast内部计算）

***

### s

> **s**: [`Vec3`](../../../../common/vec3/classes/Vec3.md)[]

Defined in: [collision-detector/gjk-epa-detector/gjk-epa.ts:29](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/gjk-epa.ts#L29)

GJK单纯形顶点数组（Minkowski差空间中的顶点，最多4个）

***

### simplexSize

> **simplexSize**: `number`

Defined in: [collision-detector/gjk-epa-detector/gjk-epa.ts:27](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/gjk-epa.ts#L27)

当前单纯形（Simplex）的顶点数量（1=点，2=线，3=三角形，4=四面体）

***

### tempTransform

> **tempTransform**: [`Transform`](../../../../common/transform/classes/Transform.md)

Defined in: [collision-detector/gjk-epa-detector/gjk-epa.ts:45](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/gjk-epa.ts#L45)

临时变换对象（RayCast内部构建临时几何体变换）

***

### tf1

> **tf1**: [`Transform`](../../../../common/transform/classes/Transform.md)

Defined in: [collision-detector/gjk-epa-detector/gjk-epa.ts:61](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/gjk-epa.ts#L61)

第一个几何体的变换（位置/旋转/缩放）

***

### tf2

> **tf2**: [`Transform`](../../../../common/transform/classes/Transform.md)

Defined in: [collision-detector/gjk-epa-detector/gjk-epa.ts:63](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/gjk-epa.ts#L63)

第二个几何体的变换（位置/旋转/缩放）

***

### tl1

> **tl1**: [`Vec3`](../../../../common/vec3/classes/Vec3.md)

Defined in: [collision-detector/gjk-epa-detector/gjk-epa.ts:37](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/gjk-epa.ts#L37)

临时向量1（用于ConvexCast/RayCast的变换计算）

***

### tl2

> **tl2**: [`Vec3`](../../../../common/vec3/classes/Vec3.md)

Defined in: [collision-detector/gjk-epa-detector/gjk-epa.ts:39](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/gjk-epa.ts#L39)

临时向量2（用于ConvexCast/RayCast的变换计算）

***

### w1

> **w1**: [`Vec3`](../../../../common/vec3/classes/Vec3.md)[]

Defined in: [collision-detector/gjk-epa-detector/gjk-epa.ts:31](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/gjk-epa.ts#L31)

第一个几何体在世界空间中的支撑点数组（对应s的每个顶点）

***

### w2

> **w2**: [`Vec3`](../../../../common/vec3/classes/Vec3.md)[]

Defined in: [collision-detector/gjk-epa-detector/gjk-epa.ts:33](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/gjk-epa.ts#L33)

第二个几何体在世界空间中的支撑点数组（对应s的每个顶点）

## Accessors

### instance

#### Get Signature

> **get** `static` **instance**(): `GjkEpa`

Defined in: [collision-detector/gjk-epa-detector/gjk-epa.ts:91](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/gjk-epa.ts#L91)

获取GjkEpa单例实例（全局唯一，避免重复创建）。

##### Returns

`GjkEpa`

单例实例

## Methods

### computeClosestPoints()

> **computeClosestPoints**(`c1`, `c2`, `tf1`, `tf2`, `cache`): `number`

Defined in: [collision-detector/gjk-epa-detector/gjk-epa.ts:200](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/gjk-epa.ts#L200)

计算两个凸几何体的最近点（启用EPA，返回精确碰撞信息）。

#### Parameters

##### c1

[`ConvexGeometry`](../../../../shape/convex-geometry/classes/ConvexGeometry.md)

第一个凸几何体

##### c2

[`ConvexGeometry`](../../../../shape/convex-geometry/classes/ConvexGeometry.md)

第二个凸几何体

##### tf1

[`Transform`](../../../../common/transform/classes/Transform.md)

第一个几何体的变换

##### tf2

[`Transform`](../../../../common/transform/classes/Transform.md)

第二个几何体的变换

##### cache

[`CachedDetectorData`](../../../cached-detector-data/classes/CachedDetectorData.md)

检测器缓存

#### Returns

`number`

算法状态码（0=成功，其他=失败）

***

### computeClosestPointsImpl()

> **computeClosestPointsImpl**(`c1`, `c2`, `_tf1`, `_tf2`, `cache`, `useEpa`): `number`

Defined in: [collision-detector/gjk-epa-detector/gjk-epa.ts:111](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/gjk-epa.ts#L111)

GJK/EPA核心实现：计算两个凸几何体的最近点（内部接口）。
核心逻辑：
1. 初始化算法参数，加载缓存（若启用）；
2. 初始化单纯形，迭代构建/收缩单纯形逼近原点；
3. 单纯形包含原点时，启用EPA计算精确碰撞信息；
4. 迭代收敛后，插值计算最近点，保存缓存（若启用）；
5. 返回算法执行状态。

#### Parameters

##### c1

[`ConvexGeometry`](../../../../shape/convex-geometry/classes/ConvexGeometry.md)

第一个凸几何体

##### c2

[`ConvexGeometry`](../../../../shape/convex-geometry/classes/ConvexGeometry.md)

第二个凸几何体

##### \_tf1

[`Transform`](../../../../common/transform/classes/Transform.md)

第一个几何体的变换

##### \_tf2

[`Transform`](../../../../common/transform/classes/Transform.md)

第二个几何体的变换

##### cache

[`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`CachedDetectorData`](../../../cached-detector-data/classes/CachedDetectorData.md)\>

检测器缓存（启用GJK缓存优化）

##### useEpa

`boolean`

是否启用EPA算法（true=计算精确碰撞，false=仅GJK距离）

#### Returns

`number`

算法状态码（0=成功，1=EPA初始化失败，2=迭代未收敛）

***

### computeDistance()

> **computeDistance**(`c1`, `c2`, `tf1`, `tf2`, `cache`): `number`

Defined in: [collision-detector/gjk-epa-detector/gjk-epa.ts:213](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/gjk-epa.ts#L213)

计算两个凸几何体的最短距离（仅GJK，不启用EPA）。

#### Parameters

##### c1

[`ConvexGeometry`](../../../../shape/convex-geometry/classes/ConvexGeometry.md)

第一个凸几何体

##### c2

[`ConvexGeometry`](../../../../shape/convex-geometry/classes/ConvexGeometry.md)

第二个凸几何体

##### tf1

[`Transform`](../../../../common/transform/classes/Transform.md)

第一个几何体的变换

##### tf2

[`Transform`](../../../../common/transform/classes/Transform.md)

第二个几何体的变换

##### cache

[`CachedDetectorData`](../../../cached-detector-data/classes/CachedDetectorData.md)

检测器缓存

#### Returns

`number`

算法状态码（0=成功，其他=失败）

***

### convexCast()

> **convexCast**(`c1`, `c2`, `tf1`, `tf2`, `tl1`, `tl2`, `hit`): `boolean`

Defined in: [collision-detector/gjk-epa-detector/gjk-epa.ts:228](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/gjk-epa.ts#L228)

凸几何体连续碰撞检测（ConvexCast）。

#### Parameters

##### c1

[`ConvexGeometry`](../../../../shape/convex-geometry/classes/ConvexGeometry.md)

第一个凸几何体

##### c2

[`ConvexGeometry`](../../../../shape/convex-geometry/classes/ConvexGeometry.md)

第二个凸几何体

##### tf1

[`Transform`](../../../../common/transform/classes/Transform.md)

第一个几何体的初始变换

##### tf2

[`Transform`](../../../../common/transform/classes/Transform.md)

第二个几何体的初始变换

##### tl1

[`Vec3`](../../../../common/vec3/classes/Vec3.md)

第一个几何体的运动向量

##### tl2

[`Vec3`](../../../../common/vec3/classes/Vec3.md)

第二个几何体的运动向量

##### hit

[`RayCastHit`](../../../../shape/ray-cast-hit/classes/RayCastHit.md)

碰撞结果（输出参数）

#### Returns

`boolean`

是否检测到碰撞

***

### rayCast()

> **rayCast**(`c`, `tf`, `_begin`, `_end`, `hit`): `boolean`

Defined in: [collision-detector/gjk-epa-detector/gjk-epa.ts:243](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/collision-detector/gjk-epa-detector/gjk-epa.ts#L243)

射线与凸几何体碰撞检测（RayCast）。
核心逻辑：将射线检测转换为ConvexCast，
把射线起点作为移动的点几何体，与目标凸几何体进行连续碰撞检测。

#### Parameters

##### c

[`ConvexGeometry`](../../../../shape/convex-geometry/classes/ConvexGeometry.md)

凸几何体

##### tf

[`Transform`](../../../../common/transform/classes/Transform.md)

几何体的变换

##### \_begin

[`Vec3`](../../../../common/vec3/classes/Vec3.md)

射线起点

##### \_end

[`Vec3`](../../../../common/vec3/classes/Vec3.md)

射线终点

##### hit

[`RayCastHit`](../../../../shape/ray-cast-hit/classes/RayCastHit.md)

碰撞结果（输出参数）

#### Returns

`boolean`

是否检测到碰撞
