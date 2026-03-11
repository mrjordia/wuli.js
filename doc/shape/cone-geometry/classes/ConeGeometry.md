[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [shape/cone-geometry](../README.md) / ConeGeometry

# Class: ConeGeometry

Defined in: [shape/cone-geometry.ts:15](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/cone-geometry.ts#L15)

锥体凸几何体类。
实现基于圆锥体的凸几何体，锥体沿Y轴方向延伸（顶点在+Y轴，底面在-Y轴），
支持物理属性自动计算、世界坐标系AABB生成、GJK碰撞检测支撑顶点计算和高精度射线检测，
是物理引擎中用于锥形碰撞体（如子弹、锥形障碍物）的核心实现。

## Extends

- [`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md)

## Constructors

### Constructor

> **new ConeGeometry**(`radius`, `height`): `ConeGeometry`

Defined in: [shape/cone-geometry.ts:47](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/cone-geometry.ts#L47)

构造函数：创建锥体几何体实例。
初始化锥体的半径和半高度，预计算母线与中心轴夹角的正弦/余弦值（优化后续计算），
并自动计算锥体的物理质量属性（体积、转动惯量系数）。

#### Parameters

##### radius

`number`

锥体底面半径（必须大于0）

##### height

`number`

锥体完整高度（必须大于0）

#### Returns

`ConeGeometry`

#### Overrides

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`constructor`](../../convex-geometry/classes/ConvexGeometry.md#constructor)

## Properties

### aabbComputed

> **aabbComputed**: [`Aabb`](../../../common/aabb/classes/Aabb.md)

Defined in: [shape/geometry.ts:26](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/geometry.ts#L26)

预计算的AABB缓存（用于临时计算，避免频繁创建新Aabb实例）

#### Inherited from

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`aabbComputed`](../../convex-geometry/classes/ConvexGeometry.md#aabbcomputed)

***

### cosTheta

> **cosTheta**: `number`

Defined in: [shape/cone-geometry.ts:38](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/cone-geometry.ts#L38)

锥体母线与Y轴夹角的余弦值。
cos(θ)，θ为锥体母线与中心轴（Y轴）的夹角，预计算以优化碰撞检测性能

***

### gjkMargin

> **gjkMargin**: `number`

Defined in: [shape/convex-geometry.ts:20](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/convex-geometry.ts#L20)

GJK 算法的边缘容差（碰撞检测margin）。 用于解决 GJK 算法中几何体边缘的精度问题，避免因浮点误差导致的碰撞检测失效，
该值通常为极小的正数（如 0.001）。

#### Default

```ts
初始化为 CONSTANT.SETTING_DEFAULT_GJK_MARGIN
```

#### Inherited from

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`gjkMargin`](../../convex-geometry/classes/ConvexGeometry.md#gjkmargin)

***

### halfHeight

> **halfHeight**: `number`

Defined in: [shape/cone-geometry.ts:26](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/cone-geometry.ts#L26)

锥体的半高度（完整高度的1/2）。
锥体沿Y轴的半高度，完整高度 = 2 × halfHeight，顶点位于 (0, halfHeight, 0)

***

### inertiaCoeff

> **inertiaCoeff**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [shape/geometry.ts:24](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/geometry.ts#L24)

惯性张量系数（3x3矩阵，Float64Array存储，按行优先排列）。
惯性张量的基础系数，不同几何体有不同的系数矩阵，
结合质量和尺寸可计算出最终的惯性张量，用于刚体旋转运动的计算。
存储格式：[00,01,02, 10,11,12, 20,21,22]（对应3x3矩阵的9个元素）

#### Inherited from

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`inertiaCoeff`](../../convex-geometry/classes/ConvexGeometry.md#inertiacoeff)

***

### radius

> **radius**: `number`

Defined in: [shape/cone-geometry.ts:20](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/cone-geometry.ts#L20)

锥体底面半径。
锥体底部圆形的半径，决定锥体的径向尺寸

***

### sinTheta

> **sinTheta**: `number`

Defined in: [shape/cone-geometry.ts:32](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/cone-geometry.ts#L32)

锥体母线与Y轴夹角的正弦值。
sin(θ)，θ为锥体母线与中心轴（Y轴）的夹角，预计算以优化碰撞检测性能

***

### type

> `readonly` **type**: [`GEOMETRY_TYPE`](../../../constant/enumerations/GEOMETRY_TYPE.md)

Defined in: [shape/geometry.ts:15](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/geometry.ts#L15)

几何体类型标识（如SPHERE/BOX/CAPSULE等），只读不可修改

#### Inherited from

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`type`](../../convex-geometry/classes/ConvexGeometry.md#type)

***

### volume

> **volume**: `number` = `0`

Defined in: [shape/geometry.ts:17](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/geometry.ts#L17)

几何体体积（m³），用于结合密度计算质量

#### Inherited from

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`volume`](../../convex-geometry/classes/ConvexGeometry.md#volume)

## Methods

### computeAabb()

> **computeAabb**(`_aabb`, `_tf`): `void`

Defined in: [shape/cone-geometry.ts:92](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/cone-geometry.ts#L92)

计算锥体在指定变换下的世界坐标系AABB。
核心逻辑：
1. 基于锥体的半径和半高度，结合变换矩阵的旋转分量计算径向/轴向投影范围；
2. 综合径向和轴向的极值，计算世界坐标系下的AABB最小/最大边界；
3. 将计算结果同步到aabbComputed属性。

#### Parameters

##### \_aabb

[`Aabb`](../../../common/aabb/classes/Aabb.md)

输出参数，存储计算后的世界AABB

##### \_tf

[`Transform`](../../../common/transform/classes/Transform.md)

锥体的变换矩阵（包含平移、旋转、缩放）

#### Returns

`void`

#### Overrides

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`computeAabb`](../../convex-geometry/classes/ConvexGeometry.md#computeaabb)

***

### computeLocalSupportingVertex()

> **computeLocalSupportingVertex**(`_dir`, `_out`): `void`

Defined in: [shape/cone-geometry.ts:130](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/cone-geometry.ts#L130)

计算局部坐标系下沿指定方向的支撑顶点。
锥体的支撑顶点分两种情况计算（GJK/EPA碰撞检测核心步骤）：
1. 方向偏向Y轴正方向：支撑顶点为锥体顶点（扣除GJK容差）；
2. 其他方向：支撑顶点为锥体底面沿该方向的极值点（扣除GJK容差）；
计算时扣除GJK容差以保证碰撞检测的稳定性。

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

Defined in: [shape/convex-geometry.ts:44](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/convex-geometry.ts#L44)

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

Defined in: [shape/cone-geometry.ts:167](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/cone-geometry.ts#L167)

局部坐标系下的射线-锥体相交检测。
分两步检测射线与锥体的相交：
1. 先检测射线是否在锥体的Y轴高度范围内；
2. 再检测射线与锥体侧面/底面的相交，计算相交点和法向量；
最终返回第一个有效相交点，并填充法向量、交点位置和相交比例。

#### Parameters

##### beginX

`number`

射线起点X坐标（局部坐标系）

##### beginY

`number`

射线起点Y坐标（局部坐标系）

##### beginZ

`number`

射线起点Z坐标（局部坐标系）

##### endX

`number`

射线终点X坐标（局部坐标系）

##### endY

`number`

射线终点Y坐标（局部坐标系）

##### endZ

`number`

射线终点Z坐标（局部坐标系）

##### hit

[`RayCastHit`](../../ray-cast-hit/classes/RayCastHit.md)

输出参数，存储射线检测结果（交点、法向量、相交比例）

#### Returns

`boolean`

射线是否与锥体相交（true：相交，false：未相交）

#### Overrides

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`rayCastLocal`](../../convex-geometry/classes/ConvexGeometry.md#raycastlocal)

***

### updateMass()

> **updateMass**(): `void`

Defined in: [shape/cone-geometry.ts:65](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/cone-geometry.ts#L65)

更新锥体的物理质量属性。
基于均匀密度假设计算锥体的体积和转动惯量系数：
1. 体积计算：V = (1/3)πr²H（H为完整高度，此处 3.14159265358979 = π）
2. 转动惯量：区分径向（X/Z轴）和轴向（Y轴），使用锥体转动惯量公式计算，
   0.05/0.3 为公式中的常数系数（对应 1/20、3/10）。

#### Returns

`void`

#### Overrides

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`updateMass`](../../convex-geometry/classes/ConvexGeometry.md#updatemass)
