[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [common/method](../README.md) / Method

# Class: Method

Defined in: [common/method.ts:41](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L41)

物理引擎核心工具方法类。
物理引擎的底层数值计算核心类，封装所有通用的高性能数值操作，核心定位：
1. 统一管理矩阵/向量/四元数/AABB/变换的基础运算，保证计算逻辑的一致性；
2. 基于Float64Array实现双精度浮点运算，避免物理计算的精度丢失；
3. 采用「out参数输出」「复用临时数组」等设计，最小化内存分配开销；
核心设计原则：
- 无状态：所有方法均为静态方法，无需实例化，避免对象创建开销；
- 行主序：矩阵/变换数据统一采用行主序存储，与引擎其他模块保持一致；
- 高性能：避免冗余计算，优先使用逐元素遍历、直接数组操作等高效逻辑；
主要应用场景：刚体动力学计算、碰撞检测、约束求解、坐标空间转换。

## Constructors

### Constructor

> **new Method**(): `Method`

#### Returns

`Method`

## Methods

### absArray()

> `static` **absArray**(`a`, `out`, `aStart?`, `outStart?`, `length?`, `fac?`): `Float64Array`

Defined in: [common/method.ts:54](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L54)

计算数组元素的绝对值并缩放。
核心逻辑：遍历数组指定范围，先取元素绝对值，再乘以缩放因子后写入输出数组。

#### Parameters

##### a

`Float64Array`

输入数组（原始数值）

##### out

`Float64Array`

输出数组（结果写入此数组，避免新建数组）

##### aStart?

`number` = `0`

输入数组起始索引，默认从0开始

##### outStart?

`number` = `0`

输出数组起始索引，默认从0开始

##### length?

`number` = `3`

计算长度，默认3（适配Vec3的3元素结构）

##### fac?

`number` = `1`

缩放因子，绝对值计算后乘以该值，默认1（无缩放）

#### Returns

`Float64Array`

输出数组out（与入参out指向同一数组）

***

### addArray()

> `static` **addArray**(`a`, `b`, `out`, `startA?`, `startB?`, `startOut?`, `length?`): `Float64Array`

Defined in: [common/method.ts:74](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L74)

两个数组逐元素相加。
核心逻辑：遍历指定长度，将a[i] + b[i]的结果写入out[i]，支持不同起始索引的数组片段相加。

#### Parameters

##### a

`Float64Array`

第一个输入数组

##### b

`Float64Array`

第二个输入数组

##### out

`Float64Array`

输出数组（结果写入此数组）

##### startA?

`number` = `0`

数组a的起始索引

##### startB?

`number` = `0`

数组b的起始索引

##### startOut?

`number` = `0`

输出数组的起始索引

##### length?

`number` = `3`

计算长度，默认3（适配Vec3）

#### Returns

`Float64Array`

输出数组out

***

### boxContainsBox()

> `static` **boxContainsBox**(`b0`, `b1`): `boolean`

Defined in: [common/method.ts:105](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L105)

检测第一个AABB是否完全包含第二个AABB。
核心逻辑：检测b1的所有边界是否都在b0的边界范围内，是则判定为包含。

#### Parameters

##### b0

`Float64Array`

容器AABB数组，结构[minX,minY,minZ,maxX,maxY,maxZ]

##### b1

`Float64Array`

被检测AABB数组，结构同b0

#### Returns

`boolean`

包含返回true，否则false

***

### boxIntersectsBox()

> `static` **boxIntersectsBox**(`b0`, `b1`): `boolean`

Defined in: [common/method.ts:92](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L92)

检测两个AABB包围盒是否相交（轴对齐检测）。
核心逻辑：基于轴对齐包围盒的分离轴定理（SAT），检测三个轴向上是否存在重叠，全部重叠则相交。

#### Parameters

##### b0

`Float64Array`

第一个AABB数组，结构[minX,minY,minZ,maxX,maxY,maxZ]

##### b1

`Float64Array`

第二个AABB数组，结构同b0

#### Returns

`boolean`

相交返回true，否则false

***

### boxUnionBox()

> `static` **boxUnionBox**(`b1`, `b2`, `out`): `Float64Array`

Defined in: [common/method.ts:119](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L119)

计算两个AABB的并集（包围两个AABB的最小AABB）。
核心逻辑：取两个AABB的最小min值和最大max值，构成新的包围盒。

#### Parameters

##### b1

`Float64Array`

第一个AABB数组，结构[minX,minY,minZ,maxX,maxY,maxZ]

##### b2

`Float64Array`

第二个AABB数组，结构同b1

##### out

`Float64Array`

输出并集AABB的数组，结构同b1

#### Returns

`Float64Array`

输出数组out

***

### combineMat3Vec3ToTransform()

> `static` **combineMat3Vec3ToTransform**(`vec3`, `mat3`, `transform`): `void`

Defined in: [common/method.ts:152](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L152)

将Vec3（位置）和Mat3（旋转/缩放）合并为Transform变换数组。
核心逻辑：将位置向量写入变换数组前3位，3x3矩阵写入后9位，完成平移+旋转的变换整合。

#### Parameters

##### vec3

`Float64Array`

位置向量数组，结构[x,y,z]

##### mat3

`Float64Array`

3x3矩阵数组（行优先），结构[m00,m01,m02,m10,m11,m12,m20,m21,m22]

##### transform

`Float64Array`

输出变换数组（长度12），结构[x,y,z, m00,m01,m02, m10,m11,m12, m20,m21,m22]

#### Returns

`void`

***

### copyElements()

> `static` **copyElements**(`src`, `dst`, `startSrc?`, `startDst?`, `length?`): `Float64Array`

Defined in: [common/method.ts:170](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L170)

拷贝数组元素（支持指定起始索引和长度）。
核心逻辑：遍历指定长度，将src[startSrc+i]的值直接赋值给dst[startDst+i]，支持数组片段拷贝。

#### Parameters

##### src

`Float64Array`

源数组（待拷贝的原始数据）

##### dst

`Float64Array`

目标数组（拷贝结果写入此数组）

##### startSrc?

`number` = `0`

源数组起始索引

##### startDst?

`number` = `0`

目标数组起始索引

##### length?

`number` = `0`

拷贝长度，0则取两数组最小长度

#### Returns

`Float64Array`

目标数组dst

***

### crossVectors()

> `static` **crossVectors**(`x0`, `y0`, `z0`, `x1`, `y1`, `z1`, `out`, `start?`): `Float64Array`

Defined in: [common/method.ts:138](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L138)

计算两个三维向量的叉乘（向量积）。
核心公式：叉乘结果 = (y0*z1 - z0*y1, z0*x1 - x0*z1, x0*y1 - y0*x1)，适配物理引擎中法向量、力矩计算场景。

#### Parameters

##### x0

`number`

第一个向量x分量

##### y0

`number`

第一个向量y分量

##### z0

`number`

第一个向量z分量

##### x1

`number`

第二个向量x分量

##### y1

`number`

第二个向量y分量

##### z1

`number`

第二个向量z分量

##### out

`Float64Array`

输出叉乘结果的数组

##### start?

`number` = `0`

输出数组的起始索引，默认0

#### Returns

`Float64Array`

输出数组out

***

### expandBoxByPoint()

> `static` **expandBoxByPoint**(`box`, `x`, `y`, `z`): `void`

Defined in: [common/method.ts:239](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L239)

按指定点扩展AABB包围盒（仅扩展到包含该点）。
核心逻辑：仅当点超出当前AABB范围时，调整对应min/max值，保证包围盒最小且包含该点。

#### Parameters

##### box

`Float64Array`

AABB数组，结构[minX,minY,minZ,maxX,maxY,maxZ]

##### x

`number`

点的x坐标

##### y

`number`

点的y坐标

##### z

`number`

点的z坐标

#### Returns

`void`

***

### expandBoxByScale()

> `static` **expandBoxByScale**(`box`, `scale`): `void`

Defined in: [common/method.ts:226](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L226)

按指定缩放值扩展AABB包围盒（各方向同时扩展）。
核心逻辑：min分量减去scale，max分量加上scale，实现包围盒各方向的均匀扩展/收缩。

#### Parameters

##### box

`Float64Array`

AABB数组，结构[minX,minY,minZ,maxX,maxY,maxZ]

##### scale

`number`

扩展值（正数向外扩展，负数向内收缩）

#### Returns

`void`

***

### extractQuatFromTransform()

> `static` **extractQuatFromTransform**(`transform`, `out`): `void`

Defined in: [common/method.ts:186](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L186)

从Transform变换数组中提取四元数（旋转部分）。
核心逻辑：从变换数组的3x3旋转矩阵部分，通过矩阵转四元数的标准算法提取旋转信息，忽略平移分量。

#### Parameters

##### transform

`Float64Array`

变换数组（长度12），结构[x,y,z, m00,m01,m02, m10,m11,m12, m20,m21,m22]

##### out

`Float64Array`

输出四元数数组，结构[x,y,z,w]

#### Returns

`void`

***

### fillValue()

> `static` **fillValue**\<`T`, `E`\>(`tar`, `start`, `end`, `value`): `T`

Defined in: [common/method.ts:257](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L257)

填充数组指定范围的元素为指定值。
核心逻辑：遍历数组从start到end的索引，将所有元素赋值为指定value，超出数组长度则终止。

#### Type Parameters

##### T

`T` = `Float64Array`\<`ArrayBufferLike`\>

数组类型（默认Float64Array）

##### E

`E` = `number`

元素类型（默认number）

#### Parameters

##### tar

`T`

目标数组

##### start

`number`

起始索引

##### end

`number`

结束索引（包含）

##### value

`E`

填充值

#### Returns

`T`

填充后的目标数组

***

### inverseInertia()

> `static` **inverseInertia**(`axisX`, `axisY`, `axisZ`, `rv`, `ra`, `invMass`, `mass`): `number`

Defined in: [common/method.ts:277](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L277)

计算惯性张量的逆值（物理引擎中刚体旋转惯性计算）。
核心逻辑：基于刚体的惯性轴、旋转速度和质量，计算旋转惯性的逆值，适配刚体旋转动力学求解。

#### Parameters

##### axisX

`number`

惯性轴x分量

##### axisY

`number`

惯性轴y分量

##### axisZ

`number`

惯性轴z分量

##### rv

`Float64Array`

旋转速度向量，结构[x,y,z]

##### ra

`Float64Array`

旋转轴向量，结构[x,y,z]

##### invMass

`number`

质量的倒数（1/质量）

##### mass

`number`

刚体质量

#### Returns

`number`

惯性张量逆值

***

### inverseRotateVec3()

> `static` **inverseRotateVec3**(`_v`, `_rot`): `void`

Defined in: [common/method.ts:339](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L339)

对三维向量执行逆旋转变换。
核心逻辑：通过旋转矩阵的转置（逆）对向量执行旋转变换，适配局部→世界空间的逆旋转。

#### Parameters

##### \_v

`Float64Array`

输入/输出向量数组（直接修改原数组），结构[x,y,z]

##### \_rot

`Float64Array`

3x3旋转矩阵（行优先），结构[m00,m01,m02,m10,m11,m12,m20,m21,m22]

#### Returns

`void`

***

### inverseTransformM3()

> `static` **inverseTransformM3**(`tf`, `wb`, `out?`): `void`

Defined in: [common/method.ts:300](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L300)

对3x3矩阵执行变换的逆操作（物理引擎中坐标空间转换）。
核心逻辑：基于变换数组的旋转矩阵部分，对输入3x3矩阵执行逆变换，适配世界→局部空间的矩阵转换。

#### Parameters

##### tf

`Float64Array`

变换数组（长度12），结构[x,y,z, m00,m01,m02, m10,m11,m12, m20,m21,m22]

##### wb

`Float64Array`

输入3x3矩阵（行优先），结构[m00,m01,m02,m10,m11,m12,m20,m21,m22]

##### out?

`Float64Array`\<`ArrayBufferLike`\>

输出数组（默认新建Float64Array(9)）

#### Returns

`void`

***

### inverseTransformVec3()

> `static` **inverseTransformVec3**(`_tf`, `vec3`, `op`, `out`, `vecStart?`, `outStart?`): `void`

Defined in: [common/method.ts:357](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L357)

对三维向量执行逆变换（从世界空间转换到局部空间）。
核心逻辑：先扣除平移分量（可选），再执行逆旋转变换，完成世界→局部空间的向量转换。

#### Parameters

##### \_tf

`Float64Array`

变换数组（长度12），结构[x,y,z, m00,m01,m02, m10,m11,m12, m20,m21,m22]

##### vec3

`Float64Array`

输入向量数组，结构[x,y,z]

##### op

变换选项：0=平移+旋转，1=仅旋转

`0` | `1`

##### out

`Float64Array`

输出向量数组

##### vecStart?

`number` = `0`

输入向量起始索引

##### outStart?

`number` = `0`

输出向量起始索引

#### Returns

`void`

***

### isArray()

> `static` **isArray**(`obj`): `boolean`

Defined in: [common/method.ts:321](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L321)

判断对象是否为数组（兼容Float64Array等类数组对象）。
核心逻辑：先判断是否为对象类型，再通过Array.isArray或索引访问特性判定是否为数组/类数组。

#### Parameters

##### obj

`any`

待判断对象

#### Returns

`boolean`

是数组/类数组返回true，否则false

***

### makeBasis()

> `static` **makeBasis**(`x0`, `y0`, `z0`, `x1`, `y1`, `z1`, `outElements`): `void`

Defined in: [common/method.ts:501](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L501)

从两个轴向量创建正交基矩阵（归一化）。
核心逻辑：通过叉乘生成正交轴，归一化后构建正交基矩阵，适配刚体局部坐标系创建场景。

#### Parameters

##### x0

`number`

第一个轴x分量

##### y0

`number`

第一个轴y分量

##### z0

`number`

第一个轴z分量

##### x1

`number`

第二个轴x分量

##### y1

`number`

第二个轴y分量

##### z1

`number`

第二个轴z分量

##### outElements

`Float64Array`

输出3x3基矩阵（行优先）

#### Returns

`void`

***

### mat3ToQuat()

> `static` **mat3ToQuat**(`m3`, `out`): `void`

Defined in: [common/method.ts:407](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L407)

将3x3旋转矩阵转换为四元数。
核心逻辑：基于矩阵的迹（对角线元素和）选择最优计算路径，将旋转矩阵转换为四元数，避免数值不稳定。

#### Parameters

##### m3

`Float64Array`

3x3矩阵数组（行优先），结构[m00,m01,m02,m10,m11,m12,m20,m21,m22]

##### out

`Float64Array`

输出四元数数组，结构[x,y,z,w]

#### Returns

`void`

***

### mat3ToVec3()

> `static` **mat3ToVec3**(`bs`, `out`): `void`

Defined in: [common/method.ts:463](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L463)

将3x3旋转矩阵转换为欧拉角（弧度）。
核心逻辑：从旋转矩阵中提取各轴旋转角度，处理边界情况（如万向锁），转换为欧拉角表示。

#### Parameters

##### bs

`Float64Array`

3x3矩阵数组（行优先）

##### out

`Float64Array`

输出欧拉角数组，结构[x,y,z]（俯仰、偏航、滚转）

#### Returns

`void`

***

### multiplyArray()

> `static` **multiplyArray**(`a`, `b`, `startA?`, `startB?`, `length?`, `out?`, `outStart?`): `number`

Defined in: [common/method.ts:558](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L558)

两个数组逐元素相乘并返回累加和（点积计算）。
核心逻辑：遍历数组计算a[i]*b[i]，可选写入输出数组，同时累加结果得到点积，适配向量点积、矩阵行×列计算。

#### Parameters

##### a

`Float64Array`

第一个数组

##### b

`Float64Array`

第二个数组

##### startA?

`number` = `0`

数组a起始索引

##### startB?

`number` = `0`

数组b起始索引

##### length?

`number` = `3`

计算长度，默认3（适配Vec3）

##### out?

[`Nullable`](../../nullable/type-aliases/Nullable.md)\<`Float64Array`\<`ArrayBufferLike`\>\> = `null`

输出逐元素乘积的数组（可选）

##### outStart?

`number` = `0`

输出数组起始索引

#### Returns

`number`

逐元素乘积的累加和（点积结果）

***

### multiplyBasis()

> `static` **multiplyBasis**(`b0`, `b1`, `out`): `void`

Defined in: [common/method.ts:533](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L533)

两个3x3矩阵相乘（b0 * b1）。
核心逻辑：按矩阵乘法规则，计算行×列的点积，生成乘积矩阵，适配旋转矩阵复合运算。

#### Parameters

##### b0

`Float64Array`

第一个3x3矩阵（行优先）

##### b1

`Float64Array`

第二个3x3矩阵（行优先）

##### out

`Float64Array`

输出乘积矩阵（行优先）

#### Returns

`void`

***

### multiplyTransform()

> `static` **multiplyTransform**(`_src`, `_m`, `_dst`): `void`

Defined in: [common/method.ts:380](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L380)

合并两个变换数组（src变换应用到m变换上）。
核心逻辑：先计算旋转矩阵的乘积，再计算平移分量的变换，完成两个变换的复合运算。

#### Parameters

##### \_src

`Float64Array`

源变换数组（长度12）

##### \_m

`Float64Array`

目标变换数组（长度12）

##### \_dst

`Float64Array`

输出变换数组（长度12）

#### Returns

`void`

***

### normalize()

> `static` **normalize**(`ary`, `start`, `length`, `scale?`): `void`

Defined in: [common/method.ts:580](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L580)

归一化数组（向量）为单位长度。
核心逻辑：先计算向量模长，再将每个元素除以模长（非零），得到单位向量，适配方向向量标准化。

#### Parameters

##### ary

`Float64Array`

输入数组（向量）

##### start

`number`

起始索引

##### length

`number`

计算长度

##### scale?

`number` = `1`

归一化后的缩放因子，默认1（单位长度）

#### Returns

`void`

***

### quatToMat3()

> `static` **quatToMat3**(`x`, `y`, `z`, `w`, `out`): `void`

Defined in: [common/method.ts:601](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L601)

将四元数转换为3x3旋转矩阵。
核心逻辑：通过四元数转旋转矩阵的标准公式，将四元数的旋转信息转换为矩阵表示，适配旋转计算。

#### Parameters

##### x

`number`

四元数x分量

##### y

`number`

四元数y分量

##### z

`number`

四元数z分量

##### w

`number`

四元数w分量

##### out

`Float64Array`

输出3x3矩阵（行优先）

#### Returns

`void`

***

### rotateTransform()

> `static` **rotateTransform**(`_tf`, `_rot`): `void`

Defined in: [common/method.ts:624](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L624)

对变换数组执行旋转变换（更新旋转矩阵部分）。
核心逻辑：将旋转矩阵与变换数组的现有旋转矩阵相乘，更新变换的旋转部分，平移部分保持不变。

#### Parameters

##### \_tf

`Float64Array`

变换数组（长度12）

##### \_rot

`Float64Array`

3x3旋转矩阵（行优先）

#### Returns

`void`

***

### rotateVec3()

> `static` **rotateVec3**(`_v`, `_rot`): `void`

Defined in: [common/method.ts:652](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L652)

对三维向量执行旋转变换。
核心逻辑：将向量与旋转矩阵相乘，完成向量的旋转变换，适配局部→世界空间的方向转换。

#### Parameters

##### \_v

`Float64Array`

输入/输出向量数组（直接修改原数组），结构[x,y,z]

##### \_rot

`Float64Array`

3x3旋转矩阵（行优先）

#### Returns

`void`

***

### rotateVecTo()

> `static` **rotateVecTo**(`x`, `y`, `z`, `rot`, `out`): `void`

Defined in: [common/method.ts:669](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L669)

将向量按指定旋转矩阵旋转后输出。
核心逻辑：与rotateVec3逻辑一致，区别为输入是独立分量，输出到新数组，不修改原数据。

#### Parameters

##### x

`number`

输入向量x分量

##### y

`number`

输入向量y分量

##### z

`number`

输入向量z分量

##### rot

`Float64Array`

3x3旋转矩阵（行优先）

##### out

`Float64Array`

输出旋转后的向量数组，结构[x,y,z]

#### Returns

`void`

***

### scaleArray()

> `static` **scaleArray**(`a`, `s`, `out`, `startA?`, `startOut?`, `length?`): `Float64Array`

Defined in: [common/method.ts:877](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L877)

数组元素缩放（乘以指定因子）。
核心逻辑：遍历数组指定范围，将每个元素乘以缩放因子后写入输出数组，适配向量缩放、矩阵缩放场景。

#### Parameters

##### a

`Float64Array`

输入数组

##### s

`number`

缩放因子

##### out

`Float64Array`

输出数组（结果写入此数组）

##### startA?

`number` = `0`

输入数组起始索引

##### startOut?

`number` = `0`

输出数组起始索引

##### length?

`number` = `3`

计算长度，默认3（适配Vec3）

#### Returns

`Float64Array`

输出数组out

***

### setBox()

> `static` **setBox**(`x1`, `y1`, `z1`, `x2`, `y2`, `z2`, `out`): `void`

Defined in: [common/method.ts:941](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L941)

创建AABB轴对齐包围盒（从两个对角点坐标）。
AABB包围盒是轴对齐的，通过比较两个点的坐标得到最小/最大值

#### Parameters

##### x1

`number`

第一个点x坐标 - 包围盒对角点1的X坐标

##### y1

`number`

第一个点y坐标 - 包围盒对角点1的Y坐标

##### z1

`number`

第一个点z坐标 - 包围盒对角点1的Z坐标

##### x2

`number`

第二个点x坐标 - 包围盒对角点2的X坐标

##### y2

`number`

第二个点y坐标 - 包围盒对角点2的Y坐标

##### z2

`number`

第二个点z坐标 - 包围盒对角点2的Z坐标

##### out

`Float64Array`

输出AABB数组 [minX,minY,minZ,maxX,maxY,maxZ] - 存储包围盒的最小/最大坐标，需长度为6

#### Returns

`void`

#### Throws

当输出数组长度小于6时抛出

***

### setElements()

> `static` **setElements**\<`T`, `E`\>(`ele`, `start`, ...`es`): `T`

Defined in: [common/method.ts:714](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L714)

批量设置数组元素值。
核心逻辑：从start索引开始，依次将es中的值赋值给数组元素，适配多元素快速赋值场景。

#### Type Parameters

##### T

`T` = `Float64Array`\<`ArrayBufferLike`\>

数组类型（默认Float64Array）

##### E

`E` = `number`

元素类型（默认number）

#### Parameters

##### ele

`T`

目标数组

##### start

`number`

起始索引

##### es

...`E`[]

要设置的元素值列表

#### Returns

`T`

修改后的数组

***

### setIncidentVertex()

> `static` **setIncidentVertex**(`obj`, `x`, `y`, `wx`, `wy`, `wz`, `start?`): `void`

Defined in: [common/method.ts:732](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L732)

设置入射顶点数据（碰撞检测专用）。
核心逻辑：按「坐标+法向量」的结构批量设置顶点数据，适配碰撞检测中入射顶点的存储。

#### Parameters

##### obj

`Float64Array`

顶点数据数组

##### x

`number`

点的x坐标

##### y

`number`

点的y坐标

##### wx

`number`

法向量x分量

##### wy

`number`

法向量y分量

##### wz

`number`

法向量z分量

##### start?

`number` = `0`

起始索引

#### Returns

`void`

***

### setJacobian()

> `static` **setJacobian**(`basisX`, `basisY`, `basisZ`, `vec1Elements`, `vec2Elements`, `outElements`): `void`

Defined in: [common/method.ts:825](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L825)

设置雅可比矩阵（约束求解专用）。
核心逻辑：基于约束基向量和刚体位置向量，构建雅可比矩阵，适配物理引擎的约束求解（如接触约束、关节约束）。

#### Parameters

##### basisX

`number`

基向量x分量

##### basisY

`number`

基向量y分量

##### basisZ

`number`

基向量z分量

##### vec1Elements

`Float64Array`

第一个向量数组

##### vec2Elements

`Float64Array`

第二个向量数组

##### outElements

`Float64Array`

输出雅可比矩阵数组（长度12）

#### Returns

`void`

***

### setJacobianElements()

> `static` **setJacobianElements**(`jab`, `l1x`, `l1y`, `l1z`, `l2x`, `l2y`, `l2z`, `a1x`, `a1y`, `a1z`, `a2x`, `a2y`, `a2z`): `void`

Defined in: [common/method.ts:858](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L858)

批量设置雅可比矩阵元素（约束求解专用）。
核心逻辑：按「线性项+角向项」的结构，批量赋值雅可比矩阵的12个元素，适配约束求解的矩阵初始化。

#### Parameters

##### jab

`Float64Array`

雅可比矩阵数组（长度12）

##### l1x

`number`

第一个线性项x分量

##### l1y

`number`

第一个线性项y分量

##### l1z

`number`

第一个线性项z分量

##### l2x

`number`

第二个线性项x分量

##### l2y

`number`

第二个线性项y分量

##### l2z

`number`

第二个线性项z分量

##### a1x

`number`

第一个角向项x分量

##### a1y

`number`

第一个角向项y分量

##### a1z

`number`

第一个角向项z分量

##### a2x

`number`

第二个角向项x分量

##### a2y

`number`

第二个角向项y分量

##### a2z

`number`

第二个角向项z分量

#### Returns

`void`

***

### setM3X3()

> `static` **setM3X3**(`obj`, `e00`, `e01`, `e02`, `e10`, `e11`, `e12`, `e20`, `e21`, `e22`, `start?`): `void`

Defined in: [common/method.ts:755](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L755)

设置3x3矩阵元素（行优先）。
核心逻辑：按行优先顺序，将9个矩阵元素批量赋值到数组指定位置，适配矩阵快速初始化。

#### Parameters

##### obj

`Float64Array`

矩阵数组

##### e00

`number`

第一行第一列

##### e01

`number`

第一行第二列

##### e02

`number`

第一行第三列

##### e10

`number`

第二行第一列

##### e11

`number`

第二行第二列

##### e12

`number`

第二行第三列

##### e20

`number`

第三行第一列

##### e21

`number`

第三行第二列

##### e22

`number`

第三行第三列

##### start?

`number` = `0`

起始索引

#### Returns

`void`

***

### setRotFromTwoVec3()

> `static` **setRotFromTwoVec3**(`axis1X`, `axis1Y`, `axis1Z`, `axis2X`, `axis2Y`, `axis2Z`, `outQuat`, `outMat3`): `void`

Defined in: [common/method.ts:900](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L900)

从两个三维向量计算旋转（输出四元数和3x3旋转矩阵）。
算法原理：通过向量点积计算夹角，叉积计算旋转轴，处理共线特殊情况

#### Parameters

##### axis1X

`number`

第一个轴x分量 - 源向量X轴分量

##### axis1Y

`number`

第一个轴y分量 - 源向量Y轴分量

##### axis1Z

`number`

第一个轴z分量 - 源向量Z轴分量

##### axis2X

`number`

第二个轴x分量 - 目标向量X轴分量

##### axis2Y

`number`

第二个轴y分量 - 目标向量Y轴分量

##### axis2Z

`number`

第二个轴z分量 - 目标向量Z轴分量

##### outQuat

`Float64Array`

输出四元数数组 [x,y,z,w] - 存储计算出的旋转四元数，需长度为4

##### outMat3

`Float64Array`

输出3x3旋转矩阵（行优先） - 存储对应的旋转矩阵，需长度为9

#### Returns

`void`

#### Throws

当输出数组长度不足时抛出

***

### setTransformOrientation()

> `static` **setTransformOrientation**(`_tf`, `_quat`): `void`

Defined in: [common/method.ts:780](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L780)

设置变换数组的朝向（从四元数转换为旋转矩阵）。
核心逻辑：先将四元数转换为旋转矩阵（复用全局临时数组tf0），再赋值到变换数组的旋转部分。

#### Parameters

##### \_tf

`Float64Array`

变换数组（长度12）

##### \_quat

`Float64Array`

四元数数组，结构[x,y,z,w]

#### Returns

`void`

***

### setTransformRotation()

> `static` **setTransformRotation**(`tf`, `rt`): `void`

Defined in: [common/method.ts:767](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L767)

设置变换数组的旋转部分（替换3x3矩阵）。
核心逻辑：将旋转矩阵直接赋值到变换数组的3-11索引位，替换原有旋转信息，平移部分保持不变。

#### Parameters

##### tf

`Float64Array`

变换数组（长度12）

##### rt

`Float64Array`

3x3旋转矩阵（行优先）

#### Returns

`void`

***

### setXYZ()

> `static` **setXYZ**(`obj`, `x`, `y`, `z`): `object`

Defined in: [common/method.ts:686](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L686)

设置对象的x/y/z属性。
核心逻辑：直接赋值对象的x/y/z属性，返回原对象，适配向量对象的属性快速设置。

#### Parameters

##### obj

目标对象（如Vec3实例）

###### x

`number`

###### y

`number`

###### z

`number`

##### x

`number`

x值

##### y

`number`

y值

##### z

`number`

z值

#### Returns

`object`

修改后的对象

##### x

> **x**: `number`

##### y

> **y**: `number`

##### z

> **z**: `number`

***

### setXYZW()

> `static` **setXYZW**(`obj`, `x`, `y`, `z`, `w`): `void`

Defined in: [common/method.ts:700](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L700)

设置对象的x/y/z/w属性（适配四元数对象）。
核心逻辑：直接赋值对象的x/y/z/w属性，适配四元数对象的属性快速设置。

#### Parameters

##### obj

目标对象（如Quat实例）

###### w

`number`

###### x

`number`

###### y

`number`

###### z

`number`

##### x

`number`

x值

##### y

`number`

y值

##### z

`number`

z值

##### w

`number`

w值

#### Returns

`void`

***

### subArray()

> `static` **subArray**(`a`, `b`, `out`, `startA?`, `startB?`, `startOut?`, `length?`): `Float64Array`

Defined in: [common/method.ts:807](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L807)

两个数组逐元素相减。
核心逻辑：遍历指定长度，将a[i] - b[i]的结果写入out[i]，支持不同起始索引的数组片段相减。

#### Parameters

##### a

`Float64Array`

被减数数组

##### b

`Float64Array`

减数数组

##### out

`Float64Array`

输出数组（结果写入此数组）

##### startA?

`number` = `0`

数组a起始索引

##### startB?

`number` = `0`

数组b起始索引

##### startOut?

`number` = `0`

输出数组起始索引

##### length?

`number` = `3`

计算长度，默认3（适配Vec3）

#### Returns

`Float64Array`

输出数组out

***

### transformM3()

> `static` **transformM3**(`tf`, `lb`, `out`): `void`

Defined in: [common/method.ts:1014](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L1014)

对3x3矩阵执行旋转变换操作（矩阵乘法）。
算法：使用变换数组中的旋转部分（后9个元素）与输入矩阵进行矩阵乘法

#### Parameters

##### tf

`Float64Array`

变换数组（长度12） - 变换矩阵 [tx,ty,tz, r00,r01,r02, r10,r11,r12, r20,r21,r22]

##### lb

`Float64Array`

输入3x3矩阵（行优先） - 待变换的源矩阵，长度需为9

##### out

`Float64Array`

输出变换后的3x3矩阵（行优先） - 存储变换结果的矩阵，长度需为9

#### Returns

`void`

#### Throws

当输入/输出矩阵长度不足9或变换数组长度不足12时抛出

***

### transformVec3()

> `static` **transformVec3**(`_tf`, `vec3`, `op?`, `out`, `vecStart?`, `outStart?`): `void`

Defined in: [common/method.ts:973](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L973)

对三维向量执行空间变换（从局部空间转换到世界空间）。
变换公式：
             仅旋转: v' = R * v
             仅平移: v' = v + T
             两者都有: v' = R * v + T

#### Parameters

##### \_tf

`Float64Array`

变换数组（长度12） - 变换矩阵 [tx,ty,tz, r00,r01,r02, r10,r11,r12, r20,r21,r22]
                         前3个元素是平移分量，后9个是3x3旋转矩阵（行优先）

##### vec3

`Float64Array`

输入向量数组 [x,y,z] - 待变换的局部空间向量

##### op?

[`TRANSFORM_OPTION`](../enumerations/TRANSFORM_OPTION.md) = `TRANSFORM_OPTION.TRANSLATE_ROTATE`

变换选项 - 控制应用的变换类型

##### out

`Float64Array`

输出向量数组 - 存储变换后的世界空间向量，需长度至少3

##### vecStart?

`number` = `0`

输入向量起始索引 - 输入向量在数组中的起始位置

##### outStart?

`number` = `0`

输出向量起始索引 - 输出向量在数组中的起始位置

#### Returns

`void`

#### Throws

当变换数组/向量数组不是Float64Array类型时抛出

#### Throws

当变换数组长度不足12或向量数组长度不足3时抛出

***

### transposeM33()

> `static` **transposeM33**(`src`, `dst`): `Float64Array`

Defined in: [common/method.ts:1045](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L1045)

3x3矩阵转置（行优先转列优先）。
矩阵转置：将矩阵的行和列互换，M[i][j] = M[j][i]

#### Parameters

##### src

`Float64Array`

输入3x3矩阵（行优先） - 源矩阵，长度需为9

##### dst

`Float64Array`

输出转置后的3x3矩阵（行优先） - 存储转置结果的矩阵，长度需为9

#### Returns

`Float64Array`

转置后的矩阵（即dst） - 便于链式调用

#### Throws

当输入/输出矩阵长度不足9时抛出

***

### vecToQuat()

> `static` **vecToQuat**(`x`, `y`, `z`, `out`): `void`

Defined in: [common/method.ts:1074](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L1074)

将三维向量转换为四元数（用于表示旋转轴，无旋转角度）。
算法原理：找到与输入向量垂直的向量作为旋转轴，用于处理180度旋转的特殊情况
             输出四元数的w分量为0，表示旋转角度为180度

#### Parameters

##### x

`number`

向量x分量 - 输入向量的X轴分量

##### y

`number`

向量y分量 - 输入向量的Y轴分量

##### z

`number`

向量z分量 - 输入向量的Z轴分量

##### out

`Float64Array`

输出四元数数组 [x,y,z,w] - 存储转换结果的四元数，长度需为4

#### Returns

`void`

#### Throws

当输出数组长度不足4时抛出
