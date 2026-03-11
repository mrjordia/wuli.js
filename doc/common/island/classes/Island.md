[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [common/island](../README.md) / Island

# Class: Island

Defined in: [common/island.ts:14](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/island.ts#L14)

物理引擎岛屿类。
物理引擎核心优化机制，将相互关联的刚体和约束划分为独立“岛屿”并行求解，
避免对整个物理世界的刚体进行全局求解，大幅提升计算效率；
一个岛屿包含：相互接触/约束的刚体、对应的约束求解器、岛屿级重力向量。

## Constructors

### Constructor

> **new Island**(): `Island`

#### Returns

`Island`

## Properties

### gravity

> **gravity**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [common/island.ts:32](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/island.ts#L32)

岛屿级重力向量 [x, y, z]，作用于岛屿内所有刚体

***

### numRigidBodies

> **numRigidBodies**: `number` = `0`

Defined in: [common/island.ts:24](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/island.ts#L24)

岛屿内刚体的实际数量（数组有效元素个数）

***

### numSolvers

> **numSolvers**: `number` = `0`

Defined in: [common/island.ts:26](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/island.ts#L26)

岛屿内约束求解器的实际数量（solvers数组有效元素个数）

***

### numSolversNgs

> **numSolversNgs**: `number` = `0`

Defined in: [common/island.ts:30](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/island.ts#L30)

solversNgs数组中有效约束求解器数量

***

### numSolversSi

> **numSolversSi**: `number` = `0`

Defined in: [common/island.ts:28](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/island.ts#L28)

solversSi数组中有效约束求解器数量

***

### rigidBodies

> **rigidBodies**: [`Nullable`](../../nullable/type-aliases/Nullable.md)\<[`RigidBody`](../../../rigid-body/rigid-body/classes/RigidBody.md)\>[]

Defined in: [common/island.ts:16](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/island.ts#L16)

岛屿内的刚体数组（初始容量由SETTING_ISLAND_INITIAL_RIGID_BODY_ARRAY_SIZE定义）

***

### solvers

> **solvers**: [`Nullable`](../../nullable/type-aliases/Nullable.md)\<[`ConstraintSolver`](../../../constraint/solver/constraint-solver/classes/ConstraintSolver.md)\>[]

Defined in: [common/island.ts:18](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/island.ts#L18)

岛屿内所有约束求解器（不分位置修正算法）

***

### solversNgs

> **solversNgs**: [`Nullable`](../../nullable/type-aliases/Nullable.md)\<[`ConstraintSolver`](../../../constraint/solver/constraint-solver/classes/ConstraintSolver.md)\>[]

Defined in: [common/island.ts:22](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/island.ts#L22)

采用NGS（高斯赛德尔）位置修正的约束求解器

***

### solversSi

> **solversSi**: [`Nullable`](../../nullable/type-aliases/Nullable.md)\<[`ConstraintSolver`](../../../constraint/solver/constraint-solver/classes/ConstraintSolver.md)\>[]

Defined in: [common/island.ts:20](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/island.ts#L20)

采用SPLIT_IMPULSE（分离冲量）位置修正的约束求解器

## Methods

### addConstraintSolver()

> **addConstraintSolver**(`solver`, `positionCorrection`): `void`

Defined in: [common/island.ts:78](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/island.ts#L78)

向岛屿添加约束求解器（按位置修正算法分类存储）。
核心逻辑：
1. solvers数组存储所有求解器（容量不足时2倍扩容）；
2. 根据算法类型将求解器分类存入solversSi/ solversNgs数组；
3. 标记求解器`addedToIsland`为true，避免重复添加。

#### Parameters

##### solver

[`ConstraintSolver`](../../../constraint/solver/constraint-solver/classes/ConstraintSolver.md)

待添加的约束求解器

##### positionCorrection

[`POSITION_CORRECTION_ALGORITHM`](../../../constant/enumerations/POSITION_CORRECTION_ALGORITHM.md)

位置修正算法类型

#### Returns

`void`

***

### addRigidBody()

> **addRigidBody**(`rigidBody`): `void`

Defined in: [common/island.ts:54](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/island.ts#L54)

向岛屿添加刚体。
核心逻辑：
1. 数组容量不足时自动扩容（2倍扩容）；
2. 标记刚体`addedToIsland`为true，避免重复添加；
3. 将刚体存入数组并递增计数。

#### Parameters

##### rigidBody

[`RigidBody`](../../../rigid-body/rigid-body/classes/RigidBody.md)

待添加的刚体实例

#### Returns

`void`

***

### clear()

> **clear**(): `void`

Defined in: [common/island.ts:39](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/island.ts#L39)

清空岛屿所有数据（重置数组和计数）。
释放刚体/求解器引用（置null），重置所有计数为0；
避免内存泄漏，岛屿复用前必须调用该方法。

#### Returns

`void`

***

### step()

> **step**(`timeStep`, `numVelocityIterations`, `numPositionIterations`): `void`

Defined in: [common/island.ts:240](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/island.ts#L240)

岛屿整体步进更新（核心物理求解逻辑）。
核心流程（物理引擎单帧求解）：
1. 预处理：重置刚体状态，检测岛屿是否满足整体休眠条件；
2. 休眠判断：全岛刚体满足休眠条件则标记休眠并返回；
3. 速度求解：预求解→热启动→迭代求解→后求解；
4. 积分：更新刚体变换（速度→位置）；
5. 位置修正：SPLIT_IMPULSE求解→伪速度积分→NGS求解；
6. 后处理：更新所有形状的变换/AABB，移动宽相位代理。

#### Parameters

##### timeStep

[`TimeStep`](../../time-step/classes/TimeStep.md)

时间步信息

##### numVelocityIterations

`number`

速度求解迭代次数

##### numPositionIterations

`number`

位置求解迭代次数

#### Returns

`void`

***

### stepSingleRigidBody()

> **stepSingleRigidBody**(`timeStep`, `rb`): `void`

Defined in: [common/island.ts:130](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/island.ts#L130)

单刚体步进更新（独立更新单个刚体的物理状态）。
核心逻辑：
1. 重置刚体接触冲量和预测变换；
2. 自动休眠检测（速度阈值+时间阈值）；
3. 动态刚体：计算阻尼、加速度、速度更新、积分变换；
4. 更新刚体所有形状的变换和AABB（合并预测/实际变换的AABB）；
5. 移动形状的宽相位代理（若存在）。

#### Parameters

##### timeStep

[`TimeStep`](../../time-step/classes/TimeStep.md)

时间步信息（包含dt等）

##### rb

[`RigidBody`](../../../rigid-body/rigid-body/classes/RigidBody.md)

待更新的刚体

#### Returns

`void`
