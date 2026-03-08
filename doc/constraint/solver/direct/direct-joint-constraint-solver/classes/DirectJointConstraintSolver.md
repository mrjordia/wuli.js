[**wuli.js API文档**](../../../../../README.md)

***

[wuli.js API文档](../../../../../modules.md) / [constraint/solver/direct/direct-joint-constraint-solver](../README.md) / DirectJointConstraintSolver

# Class: DirectJointConstraintSolver

Defined in: [constraint/solver/direct/direct-joint-constraint-solver.ts:21](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/direct-joint-constraint-solver.ts#L21)

直接关节约束求解器类。
继承自基础约束求解器，采用直接求解策略处理关节的速度/位置约束，核心职责包括：
             1. 初始化关节求解所需的质量矩阵、边界构建器、冲量数组等核心数据结构
             2. 处理关节约束的预热启动（Warm Start），复用上一帧冲量提升求解稳定性
             3. 求解速度约束，计算满足关节限制的冲量并更新刚体速度
             4. 求解位置约束（分离冲量/NGS算法），修正刚体位置以消除关节穿透
             5. 完成求解后同步关节锚点并检查关节销毁状态
             是物理引擎中关节约束响应计算的核心实现类

## Extends

- [`ConstraintSolver`](../../../constraint-solver/classes/ConstraintSolver.md)

## Constructors

### Constructor

> **new DirectJointConstraintSolver**(`joint`): `DirectJointConstraintSolver`

Defined in: [constraint/solver/direct/direct-joint-constraint-solver.ts:98](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/direct-joint-constraint-solver.ts#L98)

构造函数：初始化关节约束求解器。
核心初始化逻辑：
             1. 绑定目标关节，初始化父类
             2. 基于最大雅可比行数预分配质量矩阵、边界构建器、质量数据行数组
             3. 初始化速度/位置边界选择器，预分配冲量相关浮点数组并置0
             所有数组均预分配内存，避免运行时动态创建，减少GC开销

#### Parameters

##### joint

[`Joint`](../../../../joint/joint/classes/Joint.md)

待求解的关节实例

#### Returns

`DirectJointConstraintSolver`

#### Overrides

[`ConstraintSolver`](../../../constraint-solver/classes/ConstraintSolver.md).[`constructor`](../../../constraint-solver/classes/ConstraintSolver.md#constructor)

## Properties

### addedToIsland

> **addedToIsland**: `boolean` = `false`

Defined in: [constraint/solver/constraint-solver.ts:21](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/constraint-solver.ts#L21)

是否已加入求解岛标记。
用于物理引擎的岛屿法（Island Method）优化：标记约束是否已被加入当前求解岛，
             避免重复处理，提升大规模约束求解的性能

#### Default

```ts
false
```

#### Inherited from

[`ConstraintSolver`](../../../constraint-solver/classes/ConstraintSolver.md).[`addedToIsland`](../../../constraint-solver/classes/ConstraintSolver.md#addedtoisland)

***

### boundaryBuilder

> **boundaryBuilder**: [`BoundaryBuilder`](../../boundary-builder/classes/BoundaryBuilder.md)

Defined in: [constraint/solver/direct/direct-joint-constraint-solver.ts:44](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/direct-joint-constraint-solver.ts#L44)

边界构建器实例。
用于构建约束的边界条件（如冲量上下限），生成求解所需的边界约束集合

***

### dImpulses

> **dImpulses**: `Float64Array`

Defined in: [constraint/solver/direct/direct-joint-constraint-solver.ts:81](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/direct-joint-constraint-solver.ts#L81)

冲量增量数组。
长度为SETTING_MAX_JACOBIAN_ROWS的浮点数组，存储每次迭代中冲量的变化量

***

### dTotalImpulses

> **dTotalImpulses**: `Float64Array`

Defined in: [constraint/solver/direct/direct-joint-constraint-solver.ts:87](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/direct-joint-constraint-solver.ts#L87)

总冲量增量数组。
长度为SETTING_MAX_JACOBIAN_ROWS的浮点数组，存储累计的冲量变化量

***

### impulses

> **impulses**: `Float64Array`

Defined in: [constraint/solver/direct/direct-joint-constraint-solver.ts:75](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/direct-joint-constraint-solver.ts#L75)

冲量数组。
长度为SETTING_MAX_JACOBIAN_ROWS的浮点数组，存储每个约束行的当前冲量值

***

### info

> **info**: [`JointSolverInfo`](../../../../joint/joint-solver-info/classes/JointSolverInfo.md)

Defined in: [constraint/solver/direct/direct-joint-constraint-solver.ts:32](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/direct-joint-constraint-solver.ts#L32)

关节求解器核心信息容器。
存储关节求解所需的雅可比矩阵、冲量限制、电机参数、刚体引用等核心数据，是约束求解的核心数据源

***

### joint

> **joint**: [`Joint`](../../../../joint/joint/classes/Joint.md)

Defined in: [constraint/solver/direct/direct-joint-constraint-solver.ts:26](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/direct-joint-constraint-solver.ts#L26)

当前求解器绑定的关节实例。
求解器唯一关联的关节对象，所有约束求解逻辑均围绕该关节展开

***

### massData

> **massData**: [`JointSolverMassDataRow`](../../../../joint/joint-solver-mass-data-row/classes/JointSolverMassDataRow.md)[]

Defined in: [constraint/solver/direct/direct-joint-constraint-solver.ts:51](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/direct-joint-constraint-solver.ts#L51)

关节求解器质量数据行数组。
预分配固定长度的质量数据行数组，每行对应一个约束行的质量相关数据（逆质量、逆惯性张量等），
             长度由CONSTANT.SETTING_MAX_JACOBIAN_ROWS指定

***

### massMatrix

> **massMatrix**: [`MassMatrix`](../../mass-matrix/classes/MassMatrix.md)

Defined in: [constraint/solver/direct/direct-joint-constraint-solver.ts:38](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/direct-joint-constraint-solver.ts#L38)

质量矩阵实例。
用于存储和计算刚体的逆质量/逆惯性张量相关数据，是约束冲量计算的核心矩阵

***

### posBoundarySelector

> **posBoundarySelector**: [`BoundarySelector`](../../boundary-selector/classes/BoundarySelector.md)

Defined in: [constraint/solver/direct/direct-joint-constraint-solver.ts:63](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/direct-joint-constraint-solver.ts#L63)

位置约束的边界选择器。
用于选择位置约束求解时需要处理的边界约束，优化求解效率

***

### relVels

> **relVels**: `Float64Array`

Defined in: [constraint/solver/direct/direct-joint-constraint-solver.ts:69](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/direct-joint-constraint-solver.ts#L69)

相对速度数组。
长度为SETTING_MAX_JACOBIAN_ROWS的浮点数组，存储每个约束行计算出的刚体相对速度

***

### velBoundarySelector

> **velBoundarySelector**: [`BoundarySelector`](../../boundary-selector/classes/BoundarySelector.md)

Defined in: [constraint/solver/direct/direct-joint-constraint-solver.ts:57](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/direct-joint-constraint-solver.ts#L57)

速度约束的边界选择器。
用于选择速度约束求解时需要处理的边界约束，优化求解效率

## Methods

### postSolve()

> **postSolve**(): `void`

Defined in: [constraint/solver/direct/direct-joint-constraint-solver.ts:844](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/direct-joint-constraint-solver.ts#L844)

约束求解后置处理。
完成所有约束求解后的收尾工作：
             1. 同步关节锚点坐标，确保锚点与刚体最终位置一致
             2. 检查关节是否满足销毁条件，触发销毁逻辑（若有）

#### Returns

`void`

#### Overrides

[`ConstraintSolver`](../../../constraint-solver/classes/ConstraintSolver.md).[`postSolve`](../../../constraint-solver/classes/ConstraintSolver.md#postsolve)

***

### postSolveVelocity()

> **postSolveVelocity**(`timeStep`): `void`

Defined in: [constraint/solver/direct/direct-joint-constraint-solver.ts:387](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/direct-joint-constraint-solver.ts#L387)

速度约束求解后置处理。
计算并更新关节的合外力/合外力矩：
             1. 累加所有约束行的冲量对应的力/力矩分量
             2. 基于时间步倒数将冲量转换为力/力矩，赋值给关节的appliedForce/appliedTorque

#### Parameters

##### timeStep

[`TimeStep`](../../../../../common/time-step/classes/TimeStep.md)

时间步信息 - 包含invDt（时间步倒数）等参数

#### Returns

`void`

#### Overrides

[`ConstraintSolver`](../../../constraint-solver/classes/ConstraintSolver.md).[`postSolveVelocity`](../../../constraint-solver/classes/ConstraintSolver.md#postsolvevelocity)

***

### preSolvePosition()

> **preSolvePosition**(`timeStep`): `void`

Defined in: [constraint/solver/direct/direct-joint-constraint-solver.ts:416](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/direct-joint-constraint-solver.ts#L416)

位置约束求解前置处理。
位置求解前的准备工作：
             1. 同步关节锚点坐标，确保锚点与刚体当前位置一致
             2. 获取关节位置求解信息，为父类的_b1/_b2赋值（缓存关联的两个刚体）
             3. 计算逆质量矩阵并填充massData数组
             4. 重置边界构建器状态，递归构建约束边界
             5. 调整边界选择器的索引顺序，重置位置冲量为0

#### Parameters

##### timeStep

[`TimeStep`](../../../../../common/time-step/classes/TimeStep.md)

时间步信息 - 包含dt、dtRatio等时间相关参数

#### Returns

`void`

#### Overrides

[`ConstraintSolver`](../../../constraint-solver/classes/ConstraintSolver.md).[`preSolvePosition`](../../../constraint-solver/classes/ConstraintSolver.md#presolveposition)

***

### preSolveVelocity()

> **preSolveVelocity**(`timeStep`): `void`

Defined in: [constraint/solver/direct/direct-joint-constraint-solver.ts:135](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/direct-joint-constraint-solver.ts#L135)

速度约束求解前置处理。
速度求解前的准备工作：
             1. 同步关节锚点坐标，确保锚点与刚体当前位置一致
             2. 获取关节速度求解信息，为父类的_b1/_b2赋值（缓存关联的两个刚体）
             3. 计算逆质量矩阵并填充massData数组
             4. 重置边界构建器状态，递归构建约束边界
             5. 调整边界选择器的索引顺序，优化后续求解效率

#### Parameters

##### timeStep

[`TimeStep`](../../../../../common/time-step/classes/TimeStep.md)

时间步信息 - 包含dt、dtRatio等时间相关参数

#### Returns

`void`

#### Overrides

[`ConstraintSolver`](../../../constraint-solver/classes/ConstraintSolver.md).[`preSolveVelocity`](../../../constraint-solver/classes/ConstraintSolver.md#presolvevelocity)

***

### solvePositionNgs()

> **solvePositionNgs**(`timeStep`): `void`

Defined in: [constraint/solver/direct/direct-joint-constraint-solver.ts:555](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/direct-joint-constraint-solver.ts#L555)

NGS算法求解位置约束。
基于NGS（Normalized Gauss-Seidel）算法修正刚体位置：
             1. 同步关节锚点，重新获取位置求解信息并计算逆质量矩阵
             2. 初始化冲量/相对速度数组，通过边界选择器求解约束冲量
             3. 基于冲量更新刚体的位置和旋转（更新变换矩阵、逆惯性张量）
             4. 若求解失败则输出日志提示

#### Parameters

##### timeStep

[`TimeStep`](../../../../../common/time-step/classes/TimeStep.md)

时间步信息 - 包含dt、dtRatio等时间相关参数

#### Returns

`void`

#### Overrides

[`ConstraintSolver`](../../../constraint-solver/classes/ConstraintSolver.md).[`solvePositionNgs`](../../../constraint-solver/classes/ConstraintSolver.md#solvepositionngs)

***

### solvePositionSplitImpulse()

> **solvePositionSplitImpulse**(): `void`

Defined in: [constraint/solver/direct/direct-joint-constraint-solver.ts:460](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/direct-joint-constraint-solver.ts#L460)

分离冲量法求解位置约束。
基于分离冲量算法修正刚体位置，消除关节穿透：
             1. 计算每个约束行的刚体伪速度（位置修正用速度）
             2. 通过边界选择器求解位置约束冲量
             3. 基于冲量更新刚体的线伪速度/角伪速度，完成位置修正
             4. 若求解失败则输出日志提示

#### Returns

`void`

#### Overrides

[`ConstraintSolver`](../../../constraint-solver/classes/ConstraintSolver.md).[`solvePositionSplitImpulse`](../../../constraint-solver/classes/ConstraintSolver.md#solvepositionsplitimpulse)

***

### solveVelocity()

> **solveVelocity**(): `void`

Defined in: [constraint/solver/direct/direct-joint-constraint-solver.ts:267](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/direct-joint-constraint-solver.ts#L267)

速度约束求解核心逻辑。
计算满足关节速度约束的冲量并更新刚体速度：
             1. 计算每个约束行的刚体相对速度，初始化冲量相关数组
             2. 处理电机约束，计算电机冲量并更新相对速度
             3. 通过边界选择器求解约束冲量，更新刚体线速度/角速度
             4. 若求解失败则输出日志提示

#### Returns

`void`

#### Overrides

[`ConstraintSolver`](../../../constraint-solver/classes/ConstraintSolver.md).[`solveVelocity`](../../../constraint-solver/classes/ConstraintSolver.md#solvevelocity)

***

### warmStart()

> **warmStart**(`timeStep`): `void`

Defined in: [constraint/solver/direct/direct-joint-constraint-solver.ts:176](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constraint/solver/direct/direct-joint-constraint-solver.ts#L176)

约束求解预热启动。
复用上一帧的冲量数据，提升约束求解的稳定性和收敛速度：
             1. 根据位置修正算法类型（Baumgarte/普通）计算预热因子
             2. 若因子无效则重置所有冲量为0，否则按因子缩放上一帧冲量
             3. 基于缩放后的冲量更新刚体的线速度/角速度，完成预热

#### Parameters

##### timeStep

[`TimeStep`](../../../../../common/time-step/classes/TimeStep.md)

时间步信息 - 包含dt、dtRatio等时间相关参数

#### Returns

`void`

#### Overrides

[`ConstraintSolver`](../../../constraint-solver/classes/ConstraintSolver.md).[`warmStart`](../../../constraint-solver/classes/ConstraintSolver.md#warmstart)
