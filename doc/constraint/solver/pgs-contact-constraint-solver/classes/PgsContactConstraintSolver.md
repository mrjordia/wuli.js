[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [constraint/solver/pgs-contact-constraint-solver](../README.md) / PgsContactConstraintSolver

# Class: PgsContactConstraintSolver

Defined in: [constraint/solver/pgs-contact-constraint-solver.ts:17](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/solver/pgs-contact-constraint-solver.ts#L17)

PGS接触约束求解器类。
基于投影梯度下降（Projected Gauss-Seidel, PGS）算法的接触约束求解器，
             是物理引擎中接触约束求解的核心实现类，完整实现了速度约束、位置约束的全生命周期求解流程：
             1. 速度约束：热启动 → 预计算质量数据 → 求解切向/法向冲量 → 应用速度修正
             2. 位置约束：分离冲量修正 → NGS迭代修正 → 刚体位置/旋转更新
             3. 收尾处理：冲量缓存、流形同步、接触冲量统计
             适配多接触点（MANIFOLD_POINTS）场景，支持摩擦约束、反弹约束、位置穿透修正

## Extends

- [`ConstraintSolver`](../../constraint-solver/classes/ConstraintSolver.md)

## Constructors

### Constructor

> **new PgsContactConstraintSolver**(`constraint`): `PgsContactConstraintSolver`

Defined in: [constraint/solver/pgs-contact-constraint-solver.ts:49](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/solver/pgs-contact-constraint-solver.ts#L49)

构造函数：初始化PGS接触约束求解器。
核心初始化逻辑：
             1. 调用父类ConstraintSolver构造函数
             2. 关联接触约束实例
             3. 初始化massData数组，为每个接触点预创建ContactSolverMassDataRow实例

#### Parameters

##### constraint

[`ContactConstraint`](../../../contact/contact-constraint/classes/ContactConstraint.md)

接触约束实例 - 必须传入有效的ContactConstraint实例

#### Returns

`PgsContactConstraintSolver`

#### Overrides

[`ConstraintSolver`](../../constraint-solver/classes/ConstraintSolver.md).[`constructor`](../../constraint-solver/classes/ConstraintSolver.md#constructor)

## Properties

### addedToIsland

> **addedToIsland**: `boolean` = `false`

Defined in: [constraint/solver/constraint-solver.ts:21](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/solver/constraint-solver.ts#L21)

是否已加入求解岛标记。
用于物理引擎的岛屿法（Island Method）优化：标记约束是否已被加入当前求解岛，
             避免重复处理，提升大规模约束求解的性能

#### Default

```ts
false
```

#### Inherited from

[`ConstraintSolver`](../../constraint-solver/classes/ConstraintSolver.md).[`addedToIsland`](../../constraint-solver/classes/ConstraintSolver.md#addedtoisland)

***

### constraint

> **constraint**: [`ContactConstraint`](../../../contact/contact-constraint/classes/ContactConstraint.md)

Defined in: [constraint/solver/pgs-contact-constraint-solver.ts:23](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/solver/pgs-contact-constraint-solver.ts#L23)

关联的接触约束实例。
存储接触流形、刚体/形状关联数据，是求解器的核心数据源，
             提供速度/位置约束的雅克比矩阵、接触点深度等关键信息

***

### info

> **info**: [`ContactSolverInfo`](../../../contact/contact-solver-info/classes/ContactSolverInfo.md)

Defined in: [constraint/solver/pgs-contact-constraint-solver.ts:31](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/solver/pgs-contact-constraint-solver.ts#L31)

接触求解信息容器。
存储约束求解的核心数据：雅克比矩阵、冲量、摩擦系数、rhs（约束方程右侧值）等，
             是求解器与接触约束之间的数据交互载体

#### Default

```ts
new ContactSolverInfo()
```

***

### massData

> **massData**: [`ContactSolverMassDataRow`](../../contact-solver-mass-data-row/classes/ContactSolverMassDataRow.md)[]

Defined in: [constraint/solver/pgs-contact-constraint-solver.ts:39](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/solver/pgs-contact-constraint-solver.ts#L39)

接触求解质量数据行数组。
每个元素对应一个接触点的质量数据（逆质量、逆转动惯量、有效质量），
             预分配固定长度数组以提升求解性能，避免运行时动态扩容

#### Default

```ts
长度为SETTING_MAX_MANIFOLD_POINTS的数组，元素为ContactSolverMassDataRow实例
```

## Methods

### postSolve()

> **postSolve**(): `void`

Defined in: [constraint/solver/pgs-contact-constraint-solver.ts:674](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/solver/pgs-contact-constraint-solver.ts#L674)

约束求解后置回调（核心收尾方法）。
整个约束求解流程的最终收尾逻辑，完成以下关键操作：
             1. 重构切向/副法向冲量的矢量形式（存储到impulse[4-6]）
             2. 累计接触冲量到刚体的linearContactImpulse/angularContactImpulse
                - 用于刚体的冲量统计、碰撞回调等业务逻辑
             3. 同步接触流形数据，确保流形与刚体最新位置一致
             注：冲量累计是物理引擎中碰撞反馈、力统计的核心数据来源

#### Returns

`void`

#### Overrides

[`ConstraintSolver`](../../constraint-solver/classes/ConstraintSolver.md).[`postSolve`](../../constraint-solver/classes/ConstraintSolver.md#postsolve)

***

### postSolveVelocity()

> **postSolveVelocity**(`timeStep`): `void`

Defined in: [constraint/solver/pgs-contact-constraint-solver.ts:64](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/solver/pgs-contact-constraint-solver.ts#L64)

速度约束求解后置处理（空实现）。
当前版本为空实现，预留扩展接口，可用于：
             1. 速度约束求解后的冲量校验
             2. 刚体速度的边界限制
             3. 求解器内部状态重置

#### Parameters

##### timeStep

[`TimeStep`](../../../../common/time-step/classes/TimeStep.md)

时间步实例

#### Returns

`void`

#### Overrides

[`ConstraintSolver`](../../constraint-solver/classes/ConstraintSolver.md).[`postSolveVelocity`](../../constraint-solver/classes/ConstraintSolver.md#postsolvevelocity)

***

### preSolvePosition()

> **preSolvePosition**(`timeStep`): `void`

Defined in: [constraint/solver/pgs-contact-constraint-solver.ts:315](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/solver/pgs-contact-constraint-solver.ts#L315)

位置约束求解前置处理。
位置求解前的初始化逻辑，完成以下操作：
             1. 同步接触流形数据（更新接触点深度和位置）
             2. 从接触约束构建位置求解信息（雅克比矩阵、rhs等）
             3. 提取刚体的逆质量、逆转动惯量矩阵
             4. 遍历所有接触点，预计算法向质量数据（仅法向，位置约束不处理切向）
             5. 重置位置冲量（impulse[3]）为0，初始化位置求解状态

#### Parameters

##### timeStep

[`TimeStep`](../../../../common/time-step/classes/TimeStep.md)

时间步实例

#### Returns

`void`

#### Overrides

[`ConstraintSolver`](../../constraint-solver/classes/ConstraintSolver.md).[`preSolvePosition`](../../constraint-solver/classes/ConstraintSolver.md#presolveposition)

***

### preSolveVelocity()

> **preSolveVelocity**(`timeStep`): `void`

Defined in: [constraint/solver/pgs-contact-constraint-solver.ts:81](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/solver/pgs-contact-constraint-solver.ts#L81)

速度约束求解前置处理（核心方法）。
速度求解前的核心初始化逻辑，完成以下关键操作：
             1. 从接触约束构建速度求解信息（雅克比矩阵、rhs、摩擦系数等）
             2. 关联求解器的刚体引用（_b1/_b2）
             3. 提取刚体的逆质量、逆转动惯量矩阵（缓存为局部变量提升计算效率）
             4. 遍历所有接触点，预计算质量数据（massData）：
                - 法向/切向/副法向的逆质量分量（invMLinN/T/B）
                - 法向/切向/副法向的逆转动惯量分量（invMAngN/T/B）
                - 法向有效质量（massN = 1/(J·M⁻¹·Jᵀ)）
                - 切向/副法向2x2有效质量矩阵（massTB）
             注：预计算质量数据是PGS求解的核心优化，避免迭代中重复计算

#### Parameters

##### timeStep

[`TimeStep`](../../../../common/time-step/classes/TimeStep.md)

时间步实例

#### Returns

`void`

#### Overrides

[`ConstraintSolver`](../../constraint-solver/classes/ConstraintSolver.md).[`preSolveVelocity`](../../constraint-solver/classes/ConstraintSolver.md#presolvevelocity)

***

### solvePositionNgs()

> **solvePositionNgs**(`timeStep`): `void`

Defined in: [constraint/solver/pgs-contact-constraint-solver.ts:413](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/solver/pgs-contact-constraint-solver.ts#L413)

NGS位置约束求解（核心方法）。
基于高斯-塞德尔（NGS）迭代的位置约束求解，完成以下核心操作：
             1. 同步接触流形，重建位置求解信息
             2. 预计算法向质量数据（同preSolvePosition）
             3. 计算位置冲量并限制≥0
             4. 应用位置冲量到刚体变换（tf1/tf2）：
                - 更新刚体位置（平移）
                - 计算旋转增量（四元数），更新刚体旋转矩阵
                - 重新计算刚体的世界空间逆转动惯量矩阵
             注：NGS位置求解直接修改刚体的位置/旋转，是高精度位置修正的核心方法，
                 包含四元数插值、旋转矩阵更新、惯量矩阵变换等关键几何计算

#### Parameters

##### timeStep

[`TimeStep`](../../../../common/time-step/classes/TimeStep.md)

时间步实例

#### Returns

`void`

#### Overrides

[`ConstraintSolver`](../../constraint-solver/classes/ConstraintSolver.md).[`solvePositionNgs`](../../constraint-solver/classes/ConstraintSolver.md#solvepositionngs)

***

### solvePositionSplitImpulse()

> **solvePositionSplitImpulse**(): `void`

Defined in: [constraint/solver/pgs-contact-constraint-solver.ts:361](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/solver/pgs-contact-constraint-solver.ts#L361)

分离冲量位置求解。
基于分离冲量（Split Impulse）的位置修正方法，核心逻辑：
             1. 提取刚体的伪速度（pseudoVel）和角伪速度（angPseudoVel）
             2. 遍历所有接触点，计算法向位置冲量（impulseP）：
                - 基于位置误差（row.rhs）和法向有效质量计算冲量
                - 乘以BAUMGARTE系数，控制位置修正强度
                - 限制冲量≥0（避免拉力）
             3. 应用冲量到伪速度/角伪速度（不影响真实速度）
             注：分离冲量将位置修正与速度修正解耦，避免速度/位置耦合导致的不稳定

#### Returns

`void`

#### Overrides

[`ConstraintSolver`](../../constraint-solver/classes/ConstraintSolver.md).[`solvePositionSplitImpulse`](../../constraint-solver/classes/ConstraintSolver.md#solvepositionsplitimpulse)

***

### solveVelocity()

> **solveVelocity**(): `void`

Defined in: [constraint/solver/pgs-contact-constraint-solver.ts:221](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/solver/pgs-contact-constraint-solver.ts#L221)

速度约束求解（核心方法）。
PGS算法的核心实现，分两步求解接触约束的速度修正：
             第一步：求解切向/副法向冲量（摩擦约束）
                1. 计算切向/副法向相对速度（rvt/rvb）
                2. 基于2x2有效质量矩阵计算切向/副法向冲量增量
                3. 应用摩擦锥限制（冲量长度不超过法向冲量×摩擦系数）
                4. 应用冲量增量到刚体线速度/角速度
             第二步：求解法向冲量（碰撞反弹/穿透约束）
                1. 计算法向相对速度（rvn）
                2. 基于法向有效质量计算法向冲量增量
                3. 限制法向冲量≥0（避免拉力）
                4. 应用冲量增量到刚体线速度/角速度
             注：先求解切向再求解法向是PGS算法的典型迭代顺序，保证约束收敛

#### Returns

`void`

#### Overrides

[`ConstraintSolver`](../../constraint-solver/classes/ConstraintSolver.md).[`solveVelocity`](../../constraint-solver/classes/ConstraintSolver.md#solvevelocity)

***

### warmStart()

> **warmStart**(`timeStep`): `void`

Defined in: [constraint/solver/pgs-contact-constraint-solver.ts:164](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/solver/pgs-contact-constraint-solver.ts#L164)

约束热启动（核心方法）。
利用上一帧的冲量数据预热当前帧求解，核心逻辑：
             1. 提取刚体当前的线速度/角速度（缓存为局部变量提升效率）
             2. 遍历所有接触点，读取历史冲量数据（法向/切向/副法向）
             3. 按时间步比例（dtRatio）缩放冲量，适配当前帧时间步
             4. 应用冲量到刚体的线速度/角速度，完成热启动
             注：热启动是PGS求解的关键优化，大幅提升收敛速度，减少帧间抖动

#### Parameters

##### timeStep

[`TimeStep`](../../../../common/time-step/classes/TimeStep.md)

时间步实例

#### Returns

`void`

#### Overrides

[`ConstraintSolver`](../../constraint-solver/classes/ConstraintSolver.md).[`warmStart`](../../constraint-solver/classes/ConstraintSolver.md#warmstart)
