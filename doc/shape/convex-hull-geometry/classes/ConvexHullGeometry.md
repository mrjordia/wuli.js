[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [shape/convex-hull-geometry](../README.md) / ConvexHullGeometry

# Class: ConvexHullGeometry

Defined in: [shape/convex-hull-geometry.ts:14](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/convex-hull-geometry.ts#L14)

凸包几何体类。
实现基于顶点集的凸包几何体，支持任意凸多边形/多面体的碰撞体定义，
是物理引擎中用于自定义复杂凸形状的核心类。内部管理原始顶点集和临时顶点缓存，
自动计算包围盒、物理质量属性和GJK碰撞检测所需的支撑顶点。

## Extends

- [`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md)

## Constructors

### Constructor

> **new ConvexHullGeometry**(`vertices`): `ConvexHullGeometry`

Defined in: [shape/convex-hull-geometry.ts:40](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/convex-hull-geometry.ts#L40)

构造函数：创建凸包几何体实例。
初始化凸包顶点集，将输入的普通对象顶点转换为Vec3类型存储，
创建临时顶点缓存，启用GJK射线检测模式，并自动计算物理质量属性。
注意：输入的顶点集必须构成凸形状，非凸顶点集会导致碰撞检测异常。

#### Parameters

##### vertices

`object`[]

凸包顶点数组（局部坐标系）

#### Returns

`ConvexHullGeometry`

#### Overrides

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`constructor`](../../convex-geometry/classes/ConvexGeometry.md#constructor)

## Properties

### aabbComputed

> **aabbComputed**: [`Aabb`](../../../common/aabb/classes/Aabb.md)

Defined in: [shape/geometry.ts:26](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/geometry.ts#L26)

预计算的AABB缓存（用于临时计算，避免频繁创建新Aabb实例）

#### Inherited from

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`aabbComputed`](../../convex-geometry/classes/ConvexGeometry.md#aabbcomputed)

***

### gjkMargin

> **gjkMargin**: `number`

Defined in: [shape/convex-geometry.ts:20](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/convex-geometry.ts#L20)

GJK 算法的边缘容差（碰撞检测margin）。 用于解决 GJK 算法中几何体边缘的精度问题，避免因浮点误差导致的碰撞检测失效，
该值通常为极小的正数（如 0.001）。

#### Default

```ts
初始化为 CONSTANT.SETTING_DEFAULT_GJK_MARGIN
```

#### Inherited from

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`gjkMargin`](../../convex-geometry/classes/ConvexGeometry.md#gjkmargin)

***

### inertiaCoeff

> **inertiaCoeff**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [shape/geometry.ts:24](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/geometry.ts#L24)

惯性张量系数（3x3矩阵，Float64Array存储，按行优先排列）。
惯性张量的基础系数，不同几何体有不同的系数矩阵，
结合质量和尺寸可计算出最终的惯性张量，用于刚体旋转运动的计算。
存储格式：[00,01,02, 10,11,12, 20,21,22]（对应3x3矩阵的9个元素）

#### Inherited from

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`inertiaCoeff`](../../convex-geometry/classes/ConvexGeometry.md#inertiacoeff)

***

### numVertices

> **numVertices**: `number`

Defined in: [shape/convex-hull-geometry.ts:19](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/convex-hull-geometry.ts#L19)

凸包顶点数量。
构成凸包的顶点总数，由构造函数传入的顶点数组长度决定

***

### tmpVertices

> **tmpVertices**: [`Vec3`](../../../common/vec3/classes/Vec3.md)[]

Defined in: [shape/convex-hull-geometry.ts:31](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/convex-hull-geometry.ts#L31)

凸包临时顶点缓存。
用于临时计算的顶点缓存，避免频繁创建Vec3对象以优化性能

***

### type

> `readonly` **type**: [`GEOMETRY_TYPE`](../../../constant/enumerations/GEOMETRY_TYPE.md)

Defined in: [shape/geometry.ts:15](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/geometry.ts#L15)

几何体类型标识（如SPHERE/BOX/CAPSULE等），只读不可修改

#### Inherited from

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`type`](../../convex-geometry/classes/ConvexGeometry.md#type)

***

### vertices

> **vertices**: [`Vec3`](../../../common/vec3/classes/Vec3.md)[]

Defined in: [shape/convex-hull-geometry.ts:25](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/convex-hull-geometry.ts#L25)

凸包原始顶点集（局部坐标系）。
存储构成凸包的所有顶点，每个顶点为Vec3类型，只读不修改

***

### volume

> **volume**: `number` = `0`

Defined in: [shape/geometry.ts:17](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/geometry.ts#L17)

几何体体积（m³），用于结合密度计算质量

#### Inherited from

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`volume`](../../convex-geometry/classes/ConvexGeometry.md#volume)

## Methods

### computeAabb()

> **computeAabb**(`_aabb`, `_tf`): `void`

Defined in: [shape/convex-hull-geometry.ts:120](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/convex-hull-geometry.ts#L120)

计算凸包在指定变换下的世界坐标系AABB。
核心逻辑：
1. 将所有顶点应用变换矩阵转换到世界坐标系；
2. 遍历世界坐标系顶点计算X/Y/Z轴的极值；
3. 叠加GJK容差（margin）得到最终AABB，并同步到aabbComputed属性。

#### Parameters

##### \_aabb

[`Aabb`](../../../common/aabb/classes/Aabb.md)

输出参数，存储计算后的世界AABB

##### \_tf

[`Transform`](../../../common/transform/classes/Transform.md)

凸包的变换矩阵（包含平移、旋转、缩放）

#### Returns

`void`

#### Overrides

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`computeAabb`](../../convex-geometry/classes/ConvexGeometry.md#computeaabb)

***

### computeLocalSupportingVertex()

> **computeLocalSupportingVertex**(`_dir`, `_out`): `void`

Defined in: [shape/convex-hull-geometry.ts:162](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/convex-hull-geometry.ts#L162)

计算局部坐标系下沿指定方向的支撑顶点。
凸包支撑顶点计算核心逻辑：
1. 遍历所有顶点，计算顶点与指定方向的点积；
2. 选取点积最大的顶点作为支撑顶点（该顶点在指定方向上最远）；
3. 将支撑顶点坐标写入输出参数，是GJK/EPA碰撞检测的核心步骤。

#### Parameters

##### \_dir

[`Vec3`](../../../common/vec3/classes/Vec3.md)

采样方向向量（局部坐标系，无需归一化）

##### \_out

[`Vec3`](../../../common/vec3/classes/Vec3.md)

输出参数，存储计算得到的支撑顶点

#### Returns

`void`

#### Overrides

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`computeLocalSupportingVertex`](../../convex-geometry/classes/ConvexGeometry.md#computelocalsupportingvertex)

***

### rayCast()

> **rayCast**(`begin`, `end`, `transform`, `hit`): `boolean`

Defined in: [shape/convex-geometry.ts:44](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/convex-geometry.ts#L44)

世界坐标系下的射线检测（通用实现，无需子类重写）。
通用射线检测逻辑，核心步骤：
1. 将世界坐标系的射线转换为几何体本地坐标系；
2. 调用rayCastLocal执行本地射线检测；
3. 若命中，将本地坐标系的命中结果转换回世界坐标系；
该方法封装了坐标变换逻辑，子类只需实现rayCastLocal即可。

#### Parameters

##### begin

[`Vec3`](../../../common/vec3/classes/Vec3.md)

##### end

[`Vec3`](../../../common/vec3/classes/Vec3.md)

##### transform

[`Transform`](../../../common/transform/classes/Transform.md)

##### hit

[`RayCastHit`](../../ray-cast-hit/classes/RayCastHit.md)

输出参数，命中信息会写入此对象

#### Returns

`boolean`

是否命中（true=命中，false=未命中）

#### Inherited from

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`rayCast`](../../convex-geometry/classes/ConvexGeometry.md#raycast)

***

### rayCastLocal()

> **rayCastLocal**(`beginX`, `beginY`, `beginZ`, `endX`, `endY`, `endZ`, `hit`): `boolean`

Defined in: [shape/geometry.ts:69](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/geometry.ts#L69)

本地坐标系下的射线检测（子类可重写）。
基础实现返回false，子类需根据自身几何形状重写此方法，
实现本地坐标系下的精准射线检测逻辑，命中时需填充hit对象的位置、法向、距离等信息。

#### Parameters

##### beginX

`number`

射线起点X（本地坐标系）

##### beginY

`number`

射线起点Y（本地坐标系）

##### beginZ

`number`

射线起点Z（本地坐标系）

##### endX

`number`

射线终点X（本地坐标系）

##### endY

`number`

射线终点Y（本地坐标系）

##### endZ

`number`

射线终点Z（本地坐标系）

##### hit

[`RayCastHit`](../../ray-cast-hit/classes/RayCastHit.md)

输出参数，命中信息会写入此对象

#### Returns

`boolean`

是否命中（true=命中，false=未命中）

#### Inherited from

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`rayCastLocal`](../../convex-geometry/classes/ConvexGeometry.md#raycastlocal)

***

### updateMass()

> **updateMass**(): `void`

Defined in: [shape/convex-hull-geometry.ts:65](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/convex-hull-geometry.ts#L65)

更新凸包的物理质量属性。
基于轴对齐包围盒近似计算凸包的体积和转动惯量系数：
1. 先遍历顶点集计算X/Y/Z轴的极值，得到包围盒尺寸；
2. 体积近似为包围盒体积（长×宽×高）；
3. 转动惯量系数基于包围盒公式计算，并补充质心偏移修正项；
注意：该方法为近似计算，高精度场景需使用凸包精确积分算法。

#### Returns

`void`

#### Overrides

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`updateMass`](../../convex-geometry/classes/ConvexGeometry.md#updatemass)
