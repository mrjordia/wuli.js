[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [shape/cylinder-geometry](../README.md) / CylinderGeometry

# Class: CylinderGeometry

Defined in: [shape/cylinder-geometry.ts:15](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/cylinder-geometry.ts#L15)

圆柱体凸几何体类。
实现基于轴向圆柱体的凸几何体（沿Y轴延伸），是物理引擎中常用的基础碰撞体，
支持自定义半径/高度、物理属性自动计算、世界坐标系AABB生成、GJK碰撞检测支撑顶点计算
以及高精度的射线-圆柱体相交检测，适用于圆柱状物体（如柱子、车轮、管道）的碰撞模拟。

## Extends

- [`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md)

## Constructors

### Constructor

> **new CylinderGeometry**(`radius`, `halfHeight`): `CylinderGeometry`

Defined in: [shape/cylinder-geometry.ts:35](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/cylinder-geometry.ts#L35)

构造函数：创建圆柱体几何体实例。
初始化圆柱体的半径和半高度，自动计算物理质量属性（体积、转动惯量系数），
圆柱体默认沿Y轴延伸，底面位于XZ平面。

#### Parameters

##### radius

`number`

圆柱体底面半径（必须大于0）

##### halfHeight

`number`

圆柱体半高度（必须大于等于0）

#### Returns

`CylinderGeometry`

#### Overrides

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`constructor`](../../convex-geometry/classes/ConvexGeometry.md#constructor)

## Properties

### aabbComputed

> **aabbComputed**: [`Aabb`](../../../common/aabb/classes/Aabb.md)

Defined in: [shape/geometry.ts:26](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/geometry.ts#L26)

预计算的AABB缓存（用于临时计算，避免频繁创建新Aabb实例）

#### Inherited from

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`aabbComputed`](../../convex-geometry/classes/ConvexGeometry.md#aabbcomputed)

***

### gjkMargin

> **gjkMargin**: `number`

Defined in: [shape/convex-geometry.ts:20](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/convex-geometry.ts#L20)

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

Defined in: [shape/cylinder-geometry.ts:26](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/cylinder-geometry.ts#L26)

圆柱体的半高度（仅沿Y轴方向）。
圆柱体轴向半高度，完整高度 = 2 × halfHeight，中心在局部坐标系原点

***

### inertiaCoeff

> **inertiaCoeff**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [shape/geometry.ts:24](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/geometry.ts#L24)

惯性张量系数（3x3矩阵，Float64Array存储，按行优先排列）。
惯性张量的基础系数，不同几何体有不同的系数矩阵，
结合质量和尺寸可计算出最终的惯性张量，用于刚体旋转运动的计算。
存储格式：[00,01,02, 10,11,12, 20,21,22]（对应3x3矩阵的9个元素）

#### Inherited from

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`inertiaCoeff`](../../convex-geometry/classes/ConvexGeometry.md#inertiacoeff)

***

### radius

> **radius**: `number`

Defined in: [shape/cylinder-geometry.ts:20](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/cylinder-geometry.ts#L20)

圆柱体底面半径（XZ平面）。
圆柱体径向尺寸，决定XZ平面内圆形截面的大小

***

### type

> `readonly` **type**: [`GEOMETRY_TYPE`](../../../constant/enumerations/GEOMETRY_TYPE.md)

Defined in: [shape/geometry.ts:15](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/geometry.ts#L15)

几何体类型标识（如SPHERE/BOX/CAPSULE等），只读不可修改

#### Inherited from

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`type`](../../convex-geometry/classes/ConvexGeometry.md#type)

***

### volume

> **volume**: `number` = `0`

Defined in: [shape/geometry.ts:17](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/geometry.ts#L17)

几何体体积（m³），用于结合密度计算质量

#### Inherited from

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`volume`](../../convex-geometry/classes/ConvexGeometry.md#volume)

## Methods

### computeAabb()

> **computeAabb**(`_aabb`, `_tf`): `void`

Defined in: [shape/cylinder-geometry.ts:78](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/cylinder-geometry.ts#L78)

计算圆柱体在指定变换下的世界坐标系AABB。
核心逻辑：
1. 结合圆柱体半径（径向）和半高度（轴向），计算变换后各轴的投影范围；
2. 基于旋转分量计算径向/轴向在世界坐标系的最大扩展；
3. 叠加平移分量得到最终AABB，并同步到aabbComputed属性。

#### Parameters

##### \_aabb

[`Aabb`](../../../common/aabb/classes/Aabb.md)

输出参数，存储计算后的世界AABB

##### \_tf

[`Transform`](../../../common/transform/classes/Transform.md)

圆柱体的变换矩阵（包含平移、旋转、缩放）

#### Returns

`void`

#### Overrides

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`computeAabb`](../../convex-geometry/classes/ConvexGeometry.md#computeaabb)

***

### computeLocalSupportingVertex()

> **computeLocalSupportingVertex**(`_dir`, `_out`): `void`

Defined in: [shape/cylinder-geometry.ts:103](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/cylinder-geometry.ts#L103)

计算局部坐标系下沿指定方向的支撑顶点。
圆柱体支撑顶点计算逻辑（GJK/EPA碰撞检测核心）：
1. 径向（XZ平面）：沿采样方向的径向分量取半径极值（扣除GJK容差）；
2. 轴向（Y轴）：沿采样方向的Y分量正负取半高度极值（扣除GJK容差）；
3. 扣除GJK容差以保证碰撞检测的稳定性。

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

Defined in: [shape/convex-geometry.ts:44](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/convex-geometry.ts#L44)

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

Defined in: [shape/cylinder-geometry.ts:133](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/cylinder-geometry.ts#L133)

局部坐标系下的射线-圆柱体相交检测。
分两步检测射线与圆柱体的相交：
1. 先检测射线是否在圆柱体的Y轴高度范围内；
2. 再检测射线与圆柱体侧面（XZ平面圆形截面）的相交；
最终返回第一个有效相交点，区分命中顶面/底面（Y轴法向量）和侧面（径向法向量）。

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

射线是否与圆柱体相交（true：相交，false：未相交）

#### Overrides

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`rayCastLocal`](../../convex-geometry/classes/ConvexGeometry.md#raycastlocal)

***

### updateMass()

> **updateMass**(): `void`

Defined in: [shape/cylinder-geometry.ts:51](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/cylinder-geometry.ts#L51)

更新圆柱体的物理质量属性。
基于均匀密度假设计算圆柱体的体积和转动惯量系数：
1. 体积计算：V = πr²H（H为完整高度=2×halfHeight，3.14159265358979 = π）
2. 转动惯量：
   - X/Z轴（径向）：0.083333333333333329 × (3r² + H²)（即 1/12 × (3r² + H²)）
   - Y轴（轴向）：0.5 × r²（即 1/2 × r²）

#### Returns

`void`

#### Overrides

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`updateMass`](../../convex-geometry/classes/ConvexGeometry.md#updatemass)
