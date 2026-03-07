[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [constraint/joint/joint-solver-mass-data-row](../README.md) / JointSolverMassDataRow

# Class: JointSolverMassDataRow

Defined in: [constraint/joint/joint-solver-mass-data-row.ts:6](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint-solver-mass-data-row.ts#L6)

关节求解器质量数据单行类。
物理引擎中关节约束求解的单行质量数据容器，存储单个约束行对应的刚体逆质量/逆惯性张量、约束质量等核心物理参数，
             所有参数按固定索引存储在Float64Array数组中，保证高精度和内存连续性，是冲量计算的核心质量数据载体

## Constructors

### Constructor

> **new JointSolverMassDataRow**(): `JointSolverMassDataRow`

#### Returns

`JointSolverMassDataRow`

## Properties

### elements

> **elements**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/joint-solver-mass-data-row.ts:20](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint-solver-mass-data-row.ts#L20)

质量数据数组（Float64Array类型）。
长度为14的浮点数组，按固定索引存储单行约束的所有质量相关参数，索引定义如下：
             [
                 invMLin1X, invMLin1Y, invMLin1Z,  // 0-2: 刚体1的线性逆质量分量
                 invMLin2X, invMLin2Y, invMLin2Z,  // 3-5: 刚体2的线性逆质量分量
                 invMAng1X, invMAng1Y, invMAng1Z,  // 6-8: 刚体1的角逆质量（逆惯性张量）分量
                 invMAng2X, invMAng2Y, invMAng2Z,  // 9-11: 刚体2的角逆质量（逆惯性张量）分量
                 mass,                             // 12: 当前约束行的综合质量值（核心计算参数）
                 massWithoutCfm                    // 13: 不含CFM（约束软化）的综合质量值
             ]
             采用Float64Array保证物理计算的高精度，固定索引布局提升内存访问效率

## Accessors

### mass

#### Get Signature

> **get** **mass**(): `number`

Defined in: [constraint/joint/joint-solver-mass-data-row.ts:27](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint-solver-mass-data-row.ts#L27)

当前约束行的综合质量值。
获取elements[12]存储的综合质量值，该值是约束冲量计算的核心参数，
             由刚体逆质量/逆惯性张量和雅可比矩阵共同计算得出

##### Returns

`number`

#### Set Signature

> **set** **mass**(`n`): `void`

Defined in: [constraint/joint/joint-solver-mass-data-row.ts:34](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint-solver-mass-data-row.ts#L34)

当前约束行的综合质量值。
设置elements[12]存储的综合质量值，直接影响约束冲量的计算结果，
             需在质量矩阵计算完成后赋值

##### Parameters

###### n

`number`

##### Returns

`void`
