[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [constraint/solver/jacobian-row](../README.md) / JacobianRow

# Class: JacobianRow

Defined in: [constraint/solver/jacobian-row.ts:6](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/jacobian-row.ts#L6)

雅克比矩阵行类。
物理引擎中约束求解的核心数据结构，存储单个约束方程的雅克比矩阵行数据，
             包含两个刚体的线速度/角速度分量和稀疏性标记，是构建约束方程 J·v = b 的基础单元

## Constructors

### Constructor

> **new JacobianRow**(): `JacobianRow`

#### Returns

`JacobianRow`

## Properties

### elements

> **elements**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/solver/jacobian-row.ts:18](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/jacobian-row.ts#L18)

雅克比行的原始数据数组。
雅克比行数据数组（长度13），存储线速度、角速度分量和稀疏性标记，
             内存布局如下：       
             索引 0-2: lin1x, lin1y, lin1z  → 第一个刚体的线速度分量                        
             索引 3-5: lin2x, lin2y, lin2z  → 第二个刚体的线速度分量                          
             索引 6-8: ang1x, ang1y, ang1z  → 第一个刚体的角速度分量                        
             索引 9-11: ang2x, ang2y, ang2z → 第二个刚体的角速度分量                        
             索引 12: flag                  → 稀疏性标记位（bit0=线速度非零，bit1=角速度非零）

#### Default

```ts
new Float64Array(13)
```

## Accessors

### flag

#### Get Signature

> **get** **flag**(): `number`

Defined in: [constraint/solver/jacobian-row.ts:25](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/jacobian-row.ts#L25)

获取稀疏性标记位（flag）。
只读访问elements[12]，通过位运算可判断哪些分量有效，用于优化约束求解性能

##### Returns

`number`

标记位数值（bit0=1表示线速度分量非零，bit1=2表示角速度分量非零）

#### Set Signature

> **set** **flag**(`n`): `void`

Defined in: [constraint/solver/jacobian-row.ts:34](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/jacobian-row.ts#L34)

设置稀疏性标记位（flag）。
直接修改elements[12]，通常无需手动调用，由updateSparsity()管理

##### Parameters

###### n

`number`

标记位数值 - 建议通过updateSparsity()自动计算，而非手动设置

##### Returns

`void`

## Methods

### updateSparsity()

> **updateSparsity**(): `void`

Defined in: [constraint/solver/jacobian-row.ts:46](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/jacobian-row.ts#L46)

更新稀疏性标记位（核心方法）。
根据线速度/角速度分量的数值自动计算flag标记位，规则：
             1. 初始化flag为0
             2. 若任意线速度分量（0-5）非零 → flag |= 1（bit0置1）
             3. 若任意角速度分量（6-11）非零 → flag |= 2（bit1置1）
             注：稀疏性标记用于求解器跳过零分量计算，大幅提升约束求解效率

#### Returns

`void`
