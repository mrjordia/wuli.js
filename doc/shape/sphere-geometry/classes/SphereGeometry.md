[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [shape/sphere-geometry](../README.md) / SphereGeometry

# Class: SphereGeometry

Defined in: [shape/sphere-geometry.ts:16](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/sphere-geometry.ts#L16)

球体凸几何体类。
实现基于球体的凸几何体，是物理引擎中最基础的碰撞体之一，
具有各向同性的物理特性（所有轴向的转动惯量相同），支持物理属性自动计算、
世界坐标系AABB生成、GJK碰撞检测支撑顶点计算和高精度射线-球体相交检测，
适用于球状物体（如弹珠、球类、粒子碰撞）的碰撞模拟。

## Extends

- [`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md)

## Constructors

### Constructor

> **new SphereGeometry**(`radius`): `SphereGeometry`

Defined in: [shape/sphere-geometry.ts:30](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/sphere-geometry.ts#L30)

构造函数：创建球体几何体实例。
初始化球体半径，将GJK容差设为半径值（适配球体各向同性的碰撞特性），
并自动计算球体的物理质量属性（体积、转动惯量系数）。

#### Parameters

##### radius

`number`

球体半径（必须大于0）

#### Returns

`SphereGeometry`

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

### radius

> **radius**: `number`

Defined in: [shape/sphere-geometry.ts:22](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/sphere-geometry.ts#L22)

球体半径。
球体的径向尺寸，同时作为GJK碰撞检测的容差（margin），
决定球体的物理体积和碰撞范围

***

### type

> `readonly` **type**: [`GEOMETRY_TYPE`](../../../constant/enumerations/GEOMETRY_TYPE.md)

Defined in: [shape/geometry.ts:15](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/geometry.ts#L15)

几何体类型标识（如SPHERE/BOX/CAPSULE等），只读不可修改

#### Inherited from

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`type`](../../convex-geometry/classes/ConvexGeometry.md#type)

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

Defined in: [shape/sphere-geometry.ts:70](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/sphere-geometry.ts#L70)

计算球体在指定变换下的世界坐标系AABB。
核心逻辑：
1. 球体的AABB为轴对齐立方体，边长为 2×半径；
2. 基于变换矩阵的平移分量（tf[0]/tf[1]/tf[2]）为中心，向各轴扩展半径得到AABB；
3. 将计算结果同步到aabbComputed属性。

#### Parameters

##### \_aabb

[`Aabb`](../../../common/aabb/classes/Aabb.md)

输出参数，存储计算后的世界AABB

##### \_tf

[`Transform`](../../../common/transform/classes/Transform.md)

球体的变换矩阵（主要使用平移分量，旋转/缩放不影响球体AABB）

#### Returns

`void`

#### Overrides

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`computeAabb`](../../convex-geometry/classes/ConvexGeometry.md#computeaabb)

***

### computeLocalSupportingVertex()

> **computeLocalSupportingVertex**(`dir`, `out`): `void`

Defined in: [shape/sphere-geometry.ts:88](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/sphere-geometry.ts#L88)

计算局部坐标系下沿指定方向的支撑顶点。
特殊说明：该方法当前实现为返回原点（0,0,0），
球体的实际支撑顶点逻辑由GJK容差（margin=radius）补充实现——
GJK算法会自动将原点沿采样方向扩展半径，得到球体的真实支撑顶点（dir.normalize()×radius）。
此设计简化了代码，利用GJK容差特性实现球体各向同性的支撑顶点计算。

#### Parameters

##### dir

[`Vec3`](../../../common/vec3/classes/Vec3.md)

采样方向向量（局部坐标系，无需归一化）

##### out

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

Defined in: [shape/sphere-geometry.ts:109](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/sphere-geometry.ts#L109)

局部坐标系下的射线-球体相交检测。
基于几何公式的射线-球体相交检测：
1. 构建射线与球体的相交方程，计算判别式D判断是否相交；
2. 计算最近相交点的参数t（0≤t≤1表示在射线段内）；
3. 计算相交点坐标和法向量（法向量为相交点指向原点的归一化向量）；
4. 填充射线检测结果（位置、法向量、相交比例）并返回。

#### Parameters

##### beginX

`number`

射线起点X坐标（局部坐标系，球体中心为原点）

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

射线是否与球体相交（true：相交，false：未相交）

#### Overrides

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`rayCastLocal`](../../convex-geometry/classes/ConvexGeometry.md#raycastlocal)

***

### updateMass()

> **updateMass**(): `void`

Defined in: [shape/sphere-geometry.ts:44](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/sphere-geometry.ts#L44)

更新球体的物理质量属性。
基于均匀密度假设计算球体的体积和转动惯量系数：
1. 体积计算：V = (4/3)πr³（4.1887902047863861 = 4/3×π）
2. 转动惯量：球体为各向同性，所有轴向转动惯量系数均为 0.4×r²（即 2/5×r²）。

#### Returns

`void`

#### Overrides

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`updateMass`](../../convex-geometry/classes/ConvexGeometry.md#updatemass)
