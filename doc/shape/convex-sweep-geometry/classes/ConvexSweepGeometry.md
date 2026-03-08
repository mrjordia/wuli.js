[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [shape/convex-sweep-geometry](../README.md) / ConvexSweepGeometry

# Class: ConvexSweepGeometry

Defined in: [shape/convex-sweep-geometry.ts:15](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/convex-sweep-geometry.ts#L15)

凸扫掠几何体类。
实现用于「凸体扫掠检测（Convex Sweep Test）」的封装几何体，
核心功能是将目标凸几何体与平移向量结合，模拟几何体在空间中移动的扫掠过程，
为GJK/EPA扫掠碰撞检测提供支撑顶点计算能力。
注意：该类仅实现核心扫掠支撑顶点逻辑，AABB计算和质量更新方法暂未实现。

## Extends

- [`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md)

## Constructors

### Constructor

> **new ConvexSweepGeometry**(): `ConvexSweepGeometry`

Defined in: [shape/convex-sweep-geometry.ts:35](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/convex-sweep-geometry.ts#L35)

构造函数：创建凸扫掠几何体实例。
初始化父类并设置几何体类型为NULL，
初始状态下目标几何体和扫掠向量均为null，需调用init()完成初始化。

#### Returns

`ConvexSweepGeometry`

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

### c

> **c**: [`Nullable`](../../../common/nullable/type-aliases/Nullable.md)\<[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md)\>

Defined in: [shape/convex-sweep-geometry.ts:21](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/convex-sweep-geometry.ts#L21)

被扫掠的目标凸几何体。
待执行扫掠检测的原始凸几何体（如Box/Capsule/Cone），
初始化前为null，调用init()后指向有效几何体实例

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

### localTranslation

> **localTranslation**: [`Nullable`](../../../common/nullable/type-aliases/Nullable.md)\<[`Vec3`](../../../common/vec3/classes/Vec3.md)\>

Defined in: [shape/convex-sweep-geometry.ts:28](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/convex-sweep-geometry.ts#L28)

局部坐标系下的扫掠平移向量。
几何体扫掠的位移向量（已转换到局部坐标系），
初始化前为null，调用init()后赋值

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

> **computeAabb**(`aabb`, `tf`): `void`

Defined in: [shape/convex-sweep-geometry.ts:83](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/convex-sweep-geometry.ts#L83)

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

> **computeLocalSupportingVertex**(`_dir`, `_out`): `void`

Defined in: [shape/convex-sweep-geometry.ts:74](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/convex-sweep-geometry.ts#L74)

计算局部坐标系下沿指定方向的扫掠支撑顶点。
扫掠支撑顶点核心计算逻辑：
1. 先计算目标几何体在指定方向的原始支撑顶点；
2. 判断扫掠向量与采样方向的点积符号：若为正，说明扫掠方向与采样方向同向，
   则将支撑顶点叠加扫掠向量，得到扫掠后的最远顶点；
3. 该逻辑是GJK扫掠碰撞检测的核心，确保检测覆盖几何体移动的整个路径。

#### Parameters

##### \_dir

[`Vec3`](../../../common/vec3/classes/Vec3.md)

采样方向向量（局部坐标系，无需归一化）

##### \_out

[`Vec3`](../../../common/vec3/classes/Vec3.md)

输出参数，存储计算得到的扫掠支撑顶点

#### Returns

`void`

#### Overrides

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`computeLocalSupportingVertex`](../../convex-geometry/classes/ConvexGeometry.md#computelocalsupportingvertex)

***

### init()

> **init**(`c`, `_transform`, `_translation`): `void`

Defined in: [shape/convex-sweep-geometry.ts:50](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/convex-sweep-geometry.ts#L50)

初始化扫掠几何体。
核心逻辑：
1. 绑定目标凸几何体，继承其GJK容差（margin）；
2. 将世界坐标系的扫掠平移向量转换为局部坐标系；
3. 存储局部坐标系平移向量，为支撑顶点计算提供数据。

#### Parameters

##### c

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md)

待扫掠的目标凸几何体（非null）

##### \_transform

[`Transform`](../../../common/transform/classes/Transform.md)

坐标变换矩阵（用于将世界坐标系平移向量转换到局部坐标系）

##### \_translation

[`Vec3`](../../../common/vec3/classes/Vec3.md)

世界坐标系下的扫掠平移向量

#### Returns

`void`

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

Defined in: [shape/convex-sweep-geometry.ts:86](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/shape/convex-sweep-geometry.ts#L86)

更新几何体的质量相关数据。
抽象方法，子类需实现以计算当前几何体的体积和惯性张量系数：
1. 计算几何体的体积（赋值给volume属性）；
2. 计算并填充惯性张量系数矩阵（inertiaCoeff）；
该方法是刚体质量计算的核心依赖，修改几何体尺寸后需调用。

#### Returns

`void`

#### Overrides

[`ConvexGeometry`](../../convex-geometry/classes/ConvexGeometry.md).[`updateMass`](../../convex-geometry/classes/ConvexGeometry.md#updatemass)
