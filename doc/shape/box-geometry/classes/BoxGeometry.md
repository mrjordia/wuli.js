[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [shape/box-geometry](../README.md) / BoxGeometry

# Class: BoxGeometry

Defined in: [shape/box-geometry.ts:15](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/box-geometry.ts#L15)

立方体凸几何体类。
实现基于轴向立方体的凸几何体，是物理引擎中最常用的基础碰撞体之一。
支持自定义尺寸、物理属性自动计算、世界坐标系AABB生成、GJK碰撞检测支撑顶点计算
以及高精度的射线-立方体相交检测，内部采用紧凑的 Float64Array 存储数据以优化性能。

## Extends

- [`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md)

## Constructors

### Constructor

> **new BoxGeometry**(`width?`, `height?`, `depth?`): `BoxGeometry`

Defined in: [shape/box-geometry.ts:38](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/box-geometry.ts#L38)

构造函数：创建立方体几何体实例。
初始化立方体半尺寸和轴向量，自动计算物理质量属性，并限制GJK容差不超过
最小半尺寸的20%，避免碰撞检测时因容差过大导致的精度问题。

#### Parameters

##### width?

`number` = `1`

立方体宽度（X轴完整尺寸，默认1）

##### height?

`number` = `1`

立方体高度（Y轴完整尺寸，默认1）

##### depth?

`number` = `1`

立方体深度（Z轴完整尺寸，默认1）

#### Returns

`BoxGeometry`

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

### size

> **size**: `Float64Array`

Defined in: [shape/box-geometry.ts:28](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/box-geometry.ts#L28)

立方体尺寸与轴向量数据（紧凑存储的 Float64Array）。
数组内存布局（共12个元素）：
| 索引 | 含义                | 说明                     |
|------|---------------------|--------------------------|
| 0    | _halfExtentsX       | X轴半宽度                |
| 1    | _halfExtentsY       | Y轴半高度                |
| 2    | _halfExtentsZ       | Z轴半深度                |
| 3-5  | _halfAxisXX/XY/XZ   | X轴半长轴向量（X/Y/Z分量）|
| 6-8  | _halfAxisYX/YY/YZ   | Y轴半长轴向量（X/Y/Z分量）|
| 9-11 | _halfAxisZX/ZY/ZZ   | Z轴半长轴向量（X/Y/Z分量）|

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

## Accessors

### halfDepth

#### Get Signature

> **get** **halfDepth**(): `number`

Defined in: [shape/box-geometry.ts:71](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/box-geometry.ts#L71)

获取立方体Z轴半深度

##### Returns

`number`

Z轴半深度值（size[2]）

***

### halfHeight

#### Get Signature

> **get** **halfHeight**(): `number`

Defined in: [shape/box-geometry.ts:63](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/box-geometry.ts#L63)

获取立方体Y轴半高度

##### Returns

`number`

Y轴半高度值（size[1]）

***

### halfWidth

#### Get Signature

> **get** **halfWidth**(): `number`

Defined in: [shape/box-geometry.ts:55](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/box-geometry.ts#L55)

获取立方体X轴半宽度

##### Returns

`number`

X轴半宽度值（size[0]）

## Methods

### computeAabb()

> **computeAabb**(`_aabb`, `_tf`): `void`

Defined in: [shape/box-geometry.ts:116](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/box-geometry.ts#L116)

计算几何体在指定变换下的AABB包围盒。
抽象方法，子类需实现以适配不同几何体的AABB计算逻辑：
根据几何体的本地形状和传入的世界变换，计算轴对齐的包围盒，
结果写入传入的aabb参数（避免内存分配），用于宽相位碰撞检测。

#### Parameters

##### \_aabb

[`Aabb`](../../../common/aabb/classes/Aabb.md)

##### \_tf

[`Transform`](../../../common/transform/classes/Transform.md)

#### Returns

`void`

#### Overrides

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`computeAabb`](../../convex-geometry/classes/ConvexGeometry.md#computeaabb)

***

### computeLocalSupportingVertex()

> **computeLocalSupportingVertex**(`_dir`, `_out`): `void`

Defined in: [shape/box-geometry.ts:143](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/box-geometry.ts#L143)

计算局部坐标系下沿指定方向的支撑顶点（抽象方法）。
支撑顶点是凸几何体在指定方向上的最远顶点，是 GJK/EPA 算法的核心接口，
每个具体的凸几何体（如 AABB、球体、胶囊体）都需实现该方法的具体逻辑。

#### Parameters

##### \_dir

[`Vec3`](../../../common/vec3/classes/Vec3.md)

##### \_out

[`Vec3`](../../../common/vec3/classes/Vec3.md)

#### Returns

`void`

#### Overrides

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`computeLocalSupportingVertex`](../../convex-geometry/classes/ConvexGeometry.md#computelocalsupportingvertex)

***

### getHalfExtentsTo()

> **getHalfExtentsTo**(`halfExtents`): `object`

Defined in: [shape/box-geometry.ts:84](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/box-geometry.ts#L84)

将立方体半尺寸写入目标对象。
复用传入的对象存储半尺寸数据，避免创建新对象以提升性能。

#### Parameters

##### halfExtents

输出对象（需包含x/y/z属性）

###### x

`number`

X轴半尺寸输出字段

###### y

`number`

Y轴半尺寸输出字段

###### z

`number`

Z轴半尺寸输出字段

#### Returns

`object`

填充了半尺寸数据的目标对象

##### x

> **x**: `number`

##### y

> **y**: `number`

##### z

> **z**: `number`

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

Defined in: [shape/box-geometry.ts:168](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/box-geometry.ts#L168)

局部坐标系下的射线-立方体相交检测。
采用Slab算法实现高精度射线检测，支持处理射线平行于坐标轴的边界情况，
计算相交点、法向量和相交比例，过滤起点在立方体内的无效检测。

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

输出参数，存储射线检测结果

#### Returns

`boolean`

射线是否与立方体相交（true：相交，false：未相交）

#### Overrides

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`rayCastLocal`](../../convex-geometry/classes/ConvexGeometry.md#raycastlocal)

***

### updateMass()

> **updateMass**(): `void`

Defined in: [shape/box-geometry.ts:98](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/box-geometry.ts#L98)

更新立方体的物理质量属性。
计算立方体的体积和转动惯量系数：
1. 体积 = 8 × 半宽 × 半高 × 半深（完整立方体体积）
2. 转动惯量系数：基于均匀密度立方体公式 I = (1/3)×(r₁² + r₂²)，
   此处 0.33333333333333331 为 1/3 的高精度浮点表示。

#### Returns

`void`

#### Overrides

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`updateMass`](../../convex-geometry/classes/ConvexGeometry.md#updatemass)
