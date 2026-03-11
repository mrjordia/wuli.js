[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [shape/terrain-geometry](../README.md) / TerrainGeometry

# Class: TerrainGeometry

Defined in: [shape/terrain-geometry.ts:15](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/terrain-geometry.ts#L15)

地形几何体类。
实现基于网格的高度场地形几何体，支持自定义X/Z轴尺寸、分段数和高度数据，
是物理引擎中用于地面、山坡、不规则地形碰撞检测的核心类。内部以二维网格存储高度数据，
实现高精度的射线-地形相交检测（逐三角形检测），支持动态更新地形高度并自动更新包围盒。

## Extends

- [`Geometry`](../../geometry/classes/Geometry.md)

## Constructors

### Constructor

> **new TerrainGeometry**(`xSize`, `zSize`, `xSegments`, `zSegments`, `heights`): `TerrainGeometry`

Defined in: [shape/terrain-geometry.ts:72](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/terrain-geometry.ts#L72)

构造函数：创建地形几何体实例。
核心逻辑：
1. 验证输入参数合法性，尺寸和分段数必须为正数；
2. 标准化高度数据为Float64Array格式，自动补全缺失数据或截断过长数据；
3. 计算地形最小/最大高度，初始化物理质量属性。
注意：高度数据为空或格式错误时会抛出异常，非有限数值会被替换为0。

#### Parameters

##### xSize

`number`

X轴总尺寸（必须>0）

##### zSize

`number`

Z轴总尺寸（必须>0）

##### xSegments

`number`

X轴分段数（必须>0）

##### zSegments

`number`

Z轴分段数（必须>0）

##### heights

地形高度数据

`Float64Array`\<`ArrayBufferLike`\> | `number`[][]

#### Returns

`TerrainGeometry`

#### Overrides

[`Geometry`](../../geometry/classes/Geometry.md).[`constructor`](../../geometry/classes/Geometry.md#constructor)

## Properties

### aabbComputed

> **aabbComputed**: [`Aabb`](../../../common/aabb/classes/Aabb.md)

Defined in: [shape/geometry.ts:26](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/geometry.ts#L26)

预计算的AABB缓存（用于临时计算，避免频繁创建新Aabb实例）

#### Inherited from

[`Geometry`](../../geometry/classes/Geometry.md).[`aabbComputed`](../../geometry/classes/Geometry.md#aabbcomputed)

***

### heights

> **heights**: `Float64Array`

Defined in: [shape/terrain-geometry.ts:45](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/terrain-geometry.ts#L45)

地形高度数据数组（Float64Array）。
存储地形网格每个顶点的高度值，索引计算规则：index = x*(zSegments+1) + z，
其中x∈[0,xSegments]，z∈[0,zSegments]，总长度 = (xSegments+1)*(zSegments+1)

***

### inertiaCoeff

> **inertiaCoeff**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [shape/geometry.ts:24](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/geometry.ts#L24)

惯性张量系数（3x3矩阵，Float64Array存储，按行优先排列）。
惯性张量的基础系数，不同几何体有不同的系数矩阵，
结合质量和尺寸可计算出最终的惯性张量，用于刚体旋转运动的计算。
存储格式：[00,01,02, 10,11,12, 20,21,22]（对应3x3矩阵的9个元素）

#### Inherited from

[`Geometry`](../../geometry/classes/Geometry.md).[`inertiaCoeff`](../../geometry/classes/Geometry.md#inertiacoeff)

***

### maxHeight

> **maxHeight**: `number`

Defined in: [shape/terrain-geometry.ts:57](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/terrain-geometry.ts#L57)

地形最大高度值。
从高度数据中计算出的最大高度，由_calcMinMaxHeight()方法更新

***

### minHeight

> **minHeight**: `number`

Defined in: [shape/terrain-geometry.ts:51](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/terrain-geometry.ts#L51)

地形最小高度值。
从高度数据中计算出的最小高度，由_calcMinMaxHeight()方法更新

***

### type

> `readonly` **type**: [`GEOMETRY_TYPE`](../../../constant/enumerations/GEOMETRY_TYPE.md)

Defined in: [shape/geometry.ts:15](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/geometry.ts#L15)

几何体类型标识（如SPHERE/BOX/CAPSULE等），只读不可修改

#### Inherited from

[`Geometry`](../../geometry/classes/Geometry.md).[`type`](../../geometry/classes/Geometry.md#type)

***

### volume

> **volume**: `number` = `0`

Defined in: [shape/geometry.ts:17](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/geometry.ts#L17)

几何体体积（m³），用于结合密度计算质量

#### Inherited from

[`Geometry`](../../geometry/classes/Geometry.md).[`volume`](../../geometry/classes/Geometry.md#volume)

***

### xSegments

> **xSegments**: `number`

Defined in: [shape/terrain-geometry.ts:32](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/terrain-geometry.ts#L32)

X轴方向的分段数。
将X轴总尺寸划分为xSegments个等分，每个分段宽度 = xSize/xSegments

***

### xSize

> **xSize**: `number`

Defined in: [shape/terrain-geometry.ts:20](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/terrain-geometry.ts#L20)

地形X轴总尺寸（宽度）。
地形在X轴方向的总长度，地形范围为 [-xSize/2, xSize/2]

***

### zSegments

> **zSegments**: `number`

Defined in: [shape/terrain-geometry.ts:38](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/terrain-geometry.ts#L38)

Z轴方向的分段数。
将Z轴总尺寸划分为zSegments个等分，每个分段长度 = zSize/zSegments

***

### zSize

> **zSize**: `number`

Defined in: [shape/terrain-geometry.ts:26](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/terrain-geometry.ts#L26)

地形Z轴总尺寸（长度）。
地形在Z轴方向的总长度，地形范围为 [-zSize/2, zSize/2]

## Methods

### computeAabb()

> **computeAabb**(`_aabb`, `_tf`): `void`

Defined in: [shape/terrain-geometry.ts:155](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/terrain-geometry.ts#L155)

计算地形在指定变换下的世界坐标系AABB。
核心逻辑：
1. X/Z轴范围基于地形尺寸和变换矩阵平移分量计算；
2. Y轴范围基于地形最小/最大高度和变换矩阵平移分量计算；
3. 将计算结果同步到aabbComputed属性。

#### Parameters

##### \_aabb

[`Aabb`](../../../common/aabb/classes/Aabb.md)

输出参数，存储计算后的世界AABB

##### \_tf

[`Transform`](../../../common/transform/classes/Transform.md)

地形的变换矩阵（主要使用平移分量）

#### Returns

`void`

#### Overrides

[`Geometry`](../../geometry/classes/Geometry.md).[`computeAabb`](../../geometry/classes/Geometry.md#computeaabb)

***

### getHeight()

> **getHeight**(`x`, `z`): `number`

Defined in: [shape/terrain-geometry.ts:421](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/terrain-geometry.ts#L421)

获取地形指定网格顶点的高度。
安全获取高度数据，索引超出范围时返回0而非抛出异常，
适用于外部查询地形高度的场景。

#### Parameters

##### x

`number`

X轴网格索引（0~xSegments）

##### z

`number`

Z轴网格索引（0~zSegments）

#### Returns

`number`

对应网格顶点的高度值（索引越界返回0）

***

### rayCast()

> **rayCast**(`_begin`, `_end`, `_transform`, `hit`): `boolean`

Defined in: [shape/geometry.ts:86](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/geometry.ts#L86)

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

#### Inherited from

[`Geometry`](../../geometry/classes/Geometry.md).[`rayCast`](../../geometry/classes/Geometry.md#raycast)

***

### rayCastLocal()

> **rayCastLocal**(`beginX`, `beginY`, `beginZ`, `endX`, `endY`, `endZ`, `hit`): `boolean`

Defined in: [shape/terrain-geometry.ts:198](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/terrain-geometry.ts#L198)

局部坐标系下的射线-地形相交检测。
核心逻辑：
1. 快速剔除：射线方向与地形高度范围无交集、射线过短、射线完全在地形外时直接返回false；
2. 网格遍历：将地形网格拆分为三角形，逐三角形检测射线相交；
3. 结果筛选：记录最近的相交点，计算相交点坐标和法向量；
4. 填充结果：将相交信息写入hit对象并返回true。

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

射线是否与地形相交（true：相交，false：未相交）

#### Overrides

[`Geometry`](../../geometry/classes/Geometry.md).[`rayCastLocal`](../../geometry/classes/Geometry.md#raycastlocal)

***

### updateHeight()

> **updateHeight**(`x`, `z`, `height`): `void`

Defined in: [shape/terrain-geometry.ts:404](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/terrain-geometry.ts#L404)

更新地形指定网格顶点的高度。
核心逻辑：
1. 验证网格索引合法性，超出范围抛出异常；
2. 更新高度数据数组对应位置的值；
3. 重新计算地形最小/最大高度（保证AABB准确性）。

#### Parameters

##### x

`number`

X轴网格索引（0~xSegments）

##### z

`number`

Z轴网格索引（0~zSegments）

##### height

`number`

新高度值

#### Returns

`void`

***

### updateMass()

> **updateMass**(): `void`

Defined in: [shape/terrain-geometry.ts:140](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/shape/terrain-geometry.ts#L140)

更新地形的物理质量属性。
地形作为静态几何体，体积和转动惯量系数均设为0，
无需参与物理模拟的质量计算。

#### Returns

`void`

#### Overrides

[`Geometry`](../../geometry/classes/Geometry.md).[`updateMass`](../../geometry/classes/Geometry.md#updatemass)
