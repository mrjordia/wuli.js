[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [common/aabb](../README.md) / Aabb

# Class: Aabb

Defined in: [common/aabb.ts:13](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/aabb.ts#L13)

轴对齐包围盒类。
用于物理引擎的碰撞检测（宽相检测、形状包围盒计算），表示3D空间中与坐标轴对齐的最小包围盒
内部采用 Float64Array 存储，元素索引对应关系：
[
  0: minX, 1: minY, 2: minZ,  // 包围盒最小点坐标
  3: maxX, 4: maxY, 5: maxZ   // 包围盒最大点坐标
]

## Constructors

### Constructor

> **new Aabb**(`ix?`, `iy?`, `iz?`, `ax?`, `ay?`, `az?`): `Aabb`

Defined in: [common/aabb.ts:30](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/aabb.ts#L30)

构造函数。
初始化AABB包围盒，未传参时默认创建空包围盒（所有分量为0）

#### Parameters

##### ix?

`number`

最小点X坐标（minX）

##### iy?

`number`

最小点Y坐标（minY）

##### iz?

`number`

最小点Z坐标（minZ）

##### ax?

`number`

最大点X坐标（maxX）

##### ay?

`number`

最大点Y坐标（maxY）

##### az?

`number`

最大点Z坐标（maxZ）

#### Returns

`Aabb`

## Properties

### elements

> **elements**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [common/aabb.ts:18](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/aabb.ts#L18)

AABB分量存储数组（双精度浮点）。
索引0-2为最小点(min)，3-5为最大点(max)，直接操作可提升碰撞检测性能

## Methods

### clone()

> **clone**(): `Float64Array`

Defined in: [common/aabb.ts:70](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/aabb.ts#L70)

克隆当前AABB的分量数组。
返回新的Float64Array（深拷贝），而非引用，避免数据污染

#### Returns

`Float64Array`

新的分量数组（包含当前AABB的min/max值）

***

### copyFrom()

> **copyFrom**(`_aabb`): `Aabb`

Defined in: [common/aabb.ts:59](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/aabb.ts#L59)

从另一个AABB复制数据。
用于复用已有AABB实例，避免频繁创建新对象，提升宽相检测性能

#### Parameters

##### \_aabb

`Aabb`

源AABB对象

#### Returns

`Aabb`

当前AABB实例（支持链式调用）

***

### init()

> **init**(`min`, `max`): `Aabb`

Defined in: [common/aabb.ts:46](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/aabb.ts#L46)

通过最小/最大点向量初始化AABB。
便捷的初始化方式，适配引擎中Vec3向量的使用习惯

#### Parameters

##### min

[`Vec3`](../../vec3/classes/Vec3.md)

最小点向量（x=minX, y=minY, z=minZ）

##### max

[`Vec3`](../../vec3/classes/Vec3.md)

最大点向量（x=maxX, y=maxY, z=maxZ）

#### Returns

`Aabb`

当前AABB实例（支持链式调用）
