[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [shape/geometry](../README.md) / Geometry

# Abstract Class: Geometry

Defined in: [shape/geometry.ts:13](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/geometry.ts#L13)

几何体抽象基类。
物理引擎中所有碰撞几何体的核心抽象层，定义了几何体的通用接口和基础属性，
包含质量计算、AABB计算、射线检测三大核心能力，是Shape类的碰撞几何载体。
所有具体几何体（球体/盒型/胶囊体等）都需继承此类并实现抽象方法。

## Extended by

- [`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md)
- [`TerrainGeometry`](../../terrain-geometry/classes/TerrainGeometry.md)

## Constructors

### Constructor

> **new Geometry**(`type`): `Geometry`

Defined in: [shape/geometry.ts:33](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/geometry.ts#L33)

构造函数。
初始化几何体类型标识，所有子类需调用此构造函数指定具体类型。

#### Parameters

##### type

[`GEOMETRY_TYPE`](../../../constant/enumerations/GEOMETRY_TYPE.md)

几何体类型

#### Returns

`Geometry`

## Properties

### aabbComputed

> **aabbComputed**: [`Aabb`](../../../common/aabb/classes/Aabb.md)

Defined in: [shape/geometry.ts:26](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/geometry.ts#L26)

预计算的AABB缓存（用于临时计算，避免频繁创建新Aabb实例）

***

### inertiaCoeff

> **inertiaCoeff**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [shape/geometry.ts:24](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/geometry.ts#L24)

惯性张量系数（3x3矩阵，Float64Array存储，按行优先排列）。
惯性张量的基础系数，不同几何体有不同的系数矩阵，
结合质量和尺寸可计算出最终的惯性张量，用于刚体旋转运动的计算。
存储格式：[00,01,02, 10,11,12, 20,21,22]（对应3x3矩阵的9个元素）

***

### type

> `readonly` **type**: [`GEOMETRY_TYPE`](../../../constant/enumerations/GEOMETRY_TYPE.md)

Defined in: [shape/geometry.ts:15](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/geometry.ts#L15)

几何体类型标识（如SPHERE/BOX/CAPSULE等），只读不可修改

***

### volume

> **volume**: `number` = `0`

Defined in: [shape/geometry.ts:17](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/geometry.ts#L17)

几何体体积（m³），用于结合密度计算质量

## Methods

### computeAabb()

> `abstract` **computeAabb**(`aabb`, `tf`): `void`

Defined in: [shape/geometry.ts:54](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/geometry.ts#L54)

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

***

### rayCast()

> **rayCast**(`_begin`, `_end`, `_transform`, `hit`): `boolean`

Defined in: [shape/geometry.ts:86](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/geometry.ts#L86)

世界坐标系下的射线检测（通用实现，无需子类重写）。
通用射线检测逻辑，核心步骤：
1. 将世界坐标系的射线转换为几何体本地坐标系；
2. 调用rayCastLocal执行本地射线检测；
3. 若命中，将本地坐标系的命中结果转换回世界坐标系；
该方法封装了坐标变换逻辑，子类只需实现rayCastLocal即可。

#### Parameters

##### \_begin

[`Vec3`](../../../common/vec3/classes/Vec3.md)

射线起点（世界坐标系）

##### \_end

[`Vec3`](../../../common/vec3/classes/Vec3.md)

射线终点（世界坐标系）

##### \_transform

[`Transform`](../../../common/transform/classes/Transform.md)

几何体的世界变换

##### hit

[`RayCastHit`](../../ray-cast-hit/classes/RayCastHit.md)

输出参数，命中信息会写入此对象

#### Returns

`boolean`

是否命中（true=命中，false=未命中）

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

***

### updateMass()

> `abstract` **updateMass**(): `void`

Defined in: [shape/geometry.ts:44](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/geometry.ts#L44)

更新几何体的质量相关数据。
抽象方法，子类需实现以计算当前几何体的体积和惯性张量系数：
1. 计算几何体的体积（赋值给volume属性）；
2. 计算并填充惯性张量系数矩阵（inertiaCoeff）；
该方法是刚体质量计算的核心依赖，修改几何体尺寸后需调用。

#### Returns

`void`
