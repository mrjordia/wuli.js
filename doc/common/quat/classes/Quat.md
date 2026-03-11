[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [common/quat](../README.md) / Quat

# Class: Quat

Defined in: [common/quat.ts:13](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/quat.ts#L13)

双精度浮点四元数类（x, y, z, w）。
用于物理引擎中高效表示3维空间旋转（避免欧拉角万向锁问题）
内部采用 Float64Array 存储以保证物理计算精度，元素索引对应标准四元数格式：
[0] -> x 分量（虚部）
[1] -> y 分量（虚部）
[2] -> z 分量（虚部）
[3] -> w 分量（实部）
单位四元数（0, 0, 0, 1）表示无旋转状态

## Constructors

### Constructor

> **new Quat**(`x?`, `y?`, `z?`, `w?`): `Quat`

Defined in: [common/quat.ts:28](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/quat.ts#L28)

构造函数。
初始化四元数，默认创建单位四元数 (0, 0, 0, 1)（无旋转）

#### Parameters

##### x?

`number` = `0`

虚部x分量

##### y?

`number` = `0`

虚部y分量

##### z?

`number` = `0`

虚部z分量

##### w?

`number` = `1`

实部w分量

#### Returns

`Quat`

## Properties

### elements

> **elements**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [common/quat.ts:18](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/quat.ts#L18)

四元数分量存储数组（双精度浮点）。
直接操作此数组可提升计算性能，也可通过x/y/z/w访问器便捷操作

## Accessors

### w

#### Get Signature

> **get** **w**(): `number`

Defined in: [common/quat.ts:93](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/quat.ts#L93)

w分量访问器。
便捷操作elements[3]（实部w），兼顾易用性与性能

##### Returns

`number`

当前w分量值

#### Set Signature

> **set** **w**(`num`): `void`

Defined in: [common/quat.ts:101](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/quat.ts#L101)

w分量设置器。

##### Parameters

###### num

`number`

要设置的w分量值

##### Returns

`void`

***

### x

#### Get Signature

> **get** **x**(): `number`

Defined in: [common/quat.ts:42](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/quat.ts#L42)

x分量访问器。
便捷操作elements[0]（虚部x），兼顾易用性与性能

##### Returns

`number`

当前x分量值

#### Set Signature

> **set** **x**(`num`): `void`

Defined in: [common/quat.ts:50](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/quat.ts#L50)

x分量设置器。

##### Parameters

###### num

`number`

要设置的x分量值

##### Returns

`void`

***

### y

#### Get Signature

> **get** **y**(): `number`

Defined in: [common/quat.ts:59](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/quat.ts#L59)

y分量访问器。
便捷操作elements[1]（虚部y），兼顾易用性与性能

##### Returns

`number`

当前y分量值

#### Set Signature

> **set** **y**(`num`): `void`

Defined in: [common/quat.ts:67](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/quat.ts#L67)

y分量设置器。

##### Parameters

###### num

`number`

要设置的y分量值

##### Returns

`void`

***

### z

#### Get Signature

> **get** **z**(): `number`

Defined in: [common/quat.ts:76](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/quat.ts#L76)

z分量访问器。
便捷操作elements[2]（虚部z），兼顾易用性与性能

##### Returns

`number`

当前z分量值

#### Set Signature

> **set** **z**(`num`): `void`

Defined in: [common/quat.ts:84](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/quat.ts#L84)

z分量设置器。

##### Parameters

###### num

`number`

要设置的z分量值

##### Returns

`void`

## Methods

### init()

> **init**(`x`, `y`, `z`, `w`): `Quat`

Defined in: [common/quat.ts:114](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/quat.ts#L114)

重新初始化四元数分量。
用于复用已有Quat实例，避免频繁创建新对象，提升物理模拟性能

#### Parameters

##### x

`number`

虚部x分量

##### y

`number`

虚部y分量

##### z

`number`

虚部z分量

##### w

`number`

实部w分量

#### Returns

`Quat`

当前四元数实例（支持链式调用）
