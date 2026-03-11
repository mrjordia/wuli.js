[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [shape/aabb-geometry](../README.md) / AabbGeometry

# Class: AabbGeometry

Defined in: [shape/aabb-geometry.ts:13](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/aabb-geometry.ts#L13)

轴对齐包围盒凸几何体类。
实现基于轴对齐包围盒的凸几何体，是物理引擎中最基础、高效的碰撞检测几何体。
AABB 由局部坐标系下的最小/最大顶点定义，所有边均与坐标轴平行，适用于快速包围盒检测、
粗碰撞筛选和简单刚体的物理属性计算。

## Extends

- [`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md)

## Constructors

### Constructor

> **new AabbGeometry**(): `AabbGeometry`

Defined in: [shape/aabb-geometry.ts:33](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/aabb-geometry.ts#L33)

构造函数：创建 AABB 几何体实例。
初始化 AABB 几何体，父类类型暂设为 GEOMETRY_TYPE.NULL，
可根据业务需求替换为专属的 AABB 类型枚举值。

#### Returns

`AabbGeometry`

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

### max

> **max**: [`Vec3`](../../../common/vec3/classes/Vec3.md)

Defined in: [shape/aabb-geometry.ts:26](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/aabb-geometry.ts#L26)

AABB 局部坐标系的最大顶点。
该顶点定义了 AABB 在 x/y/z 轴上的最大值边界

#### Default

```ts
初始化为零向量 (0, 0, 0)
```

***

### min

> **min**: [`Vec3`](../../../common/vec3/classes/Vec3.md)

Defined in: [shape/aabb-geometry.ts:19](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/aabb-geometry.ts#L19)

AABB 局部坐标系的最小顶点。
该顶点定义了 AABB 在 x/y/z 轴上的最小值边界

#### Default

```ts
初始化为零向量 (0, 0, 0)
```

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

> **computeAabb**(`aabb`, `tf`): `void`

Defined in: [shape/aabb-geometry.ts:44](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/aabb-geometry.ts#L44)

计算几何体在指定变换下的AABB包围盒。
抽象方法，子类需实现以适配不同几何体的AABB计算逻辑：
根据几何体的本地形状和传入的世界变换，计算轴对齐的包围盒，
结果写入传入的aabb参数（避免内存分配），用于宽相位碰撞检测。

#### Parameters

##### aabb

[`Aabb`](../../../common/aabb/classes/Aabb.md)

输出参数，计算后的AABB会写入此对象

##### tf

[`Transform`](../../../common/transform/classes/Transform.md)

几何体的世界变换（位置+旋转）

#### Returns

`void`

#### Overrides

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`computeAabb`](../../convex-geometry/classes/ConvexGeometry.md#computeaabb)

***

### computeLocalSupportingVertex()

> **computeLocalSupportingVertex**(`dir`, `out`): `void`

Defined in: [shape/aabb-geometry.ts:37](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/aabb-geometry.ts#L37)

计算局部坐标系下沿指定方向的支撑顶点（抽象方法）。
支撑顶点是凸几何体在指定方向上的最远顶点，是 GJK/EPA 算法的核心接口，
每个具体的凸几何体（如 AABB、球体、胶囊体）都需实现该方法的具体逻辑。

#### Parameters

##### dir

[`Vec3`](../../../common/vec3/classes/Vec3.md)

采样方向向量（局部坐标系，无需归一化）

##### out

[`Vec3`](../../../common/vec3/classes/Vec3.md)

输出参数，用于存储计算得到的支撑顶点

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

Defined in: [shape/geometry.ts:69](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/geometry.ts#L69)

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

Defined in: [shape/aabb-geometry.ts:47](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/aabb-geometry.ts#L47)

更新几何体的质量相关数据。
抽象方法，子类需实现以计算当前几何体的体积和惯性张量系数：
1. 计算几何体的体积（赋值给volume属性）；
2. 计算并填充惯性张量系数矩阵（inertiaCoeff）；
该方法是刚体质量计算的核心依赖，修改几何体尺寸后需调用。

#### Returns

`void`

#### Overrides

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`updateMass`](../../convex-geometry/classes/ConvexGeometry.md#updatemass)
