[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [constraint/solver/pgs-joint-constraint-solver](../README.md) / PgsJointConstraintSolver

# Class: PgsJointConstraintSolver

Defined in: [constraint/solver/pgs-joint-constraint-solver.ts:21](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/solver/pgs-joint-constraint-solver.ts#L21)

PGS（Projected Gauss-Seidel）关节约束求解器。
物理引擎中基于PGS迭代算法的关节约束核心求解类，核心作用：
1. 实现关节约束的速度求解（含电机控制），保证刚体运动符合关节动力学约束；
2. 完成关节位置误差修正，解决约束漂移问题，保证模拟稳定性；
3. 封装PGS算法的完整流程，包括热启动、冲量投影、Baumgarte稳定化等核心优化；
核心特性：
- 分阶段求解：速度求解与位置求解分离，先保证动力学正确性，再修正位置误差；
- 工程化优化：热启动加速迭代收敛、稀疏性优化减少计算量、小角度近似降低三角函数开销；
- 鲁棒性设计：冲量投影保证约束满足不等式限制，CFM参数适配不同柔度的约束场景；
- 完整生命周期：覆盖约束求解全流程（前置处理→核心求解→后置处理），适配物理引擎流水线；
主要应用场景：刚体关节（如球铰、铰链、滑块关节）的约束求解，适配固定/动态帧率的物理模拟场景。

## Extends

- [`ConstraintSolver`](../../constraint-solver/classes/ConstraintSolver.md)

## Constructors

### Constructor

> **new PgsJointConstraintSolver**(`joint`): `PgsJointConstraintSolver`

Defined in: [constraint/solver/pgs-joint-constraint-solver.ts:60](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/solver/pgs-joint-constraint-solver.ts#L60)

构造函数：初始化PGS关节约束求解器。
核心初始化逻辑：
1. 调用父类构造函数，继承基础约束求解器能力；
2. 绑定目标关节实例，作为求解器的核心操作对象；
3. 预初始化massData数组：按最大约束行数创建JointSolverMassDataRow实例，避免运行时动态扩容；
工程化设计：内存预分配符合物理引擎“空间换时间”的优化思路，减少GC开销。

#### Parameters

##### joint

[`Joint`](../../../joint/joint/classes/Joint.md)

目标关节实例（必传，物理引擎保证非空）

#### Returns

`PgsJointConstraintSolver`

#### Overrides

[`ConstraintSolver`](../../constraint-solver/classes/ConstraintSolver.md).[`constructor`](../../constraint-solver/classes/ConstraintSolver.md#constructor)

## Properties

### addedToIsland

> **addedToIsland**: `boolean` = `false`

Defined in: [constraint/solver/constraint-solver.ts:21](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/solver/constraint-solver.ts#L21)

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

### info

> **info**: [`JointSolverInfo`](../../../joint/joint-solver-info/classes/JointSolverInfo.md)

Defined in: [constraint/solver/pgs-joint-constraint-solver.ts:39](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/solver/pgs-joint-constraint-solver.ts#L39)

关节求解器信息容器。
存储约束求解的核心参数集合，核心作用：
1. 承载雅可比矩阵、RHS（右手项）、冲量限制等约束核心数据；
2. 统一管理速度/位置求解的差异化参数（如CFM、Baumgarte因子）；
3. 作为关节与求解器之间的数据传输载体，解耦数据与求解逻辑；
初始值为新创建的JointSolverInfo实例，求解过程中动态更新。

***

### joint

> **joint**: [`Joint`](../../../joint/joint/classes/Joint.md)

Defined in: [constraint/solver/pgs-joint-constraint-solver.ts:29](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/solver/pgs-joint-constraint-solver.ts#L29)

当前求解的关节实例。
绑定的目标关节对象，是约束求解的核心操作载体：
- 求解过程中从该关节获取刚体、锚点、雅可比矩阵等核心数据；
- 求解结果（冲量、力/力矩）最终作用于该关节关联的刚体；
初始值由构造函数注入，不可为空（物理引擎保证关节实例有效性）。

***

### massData

> **massData**: [`JointSolverMassDataRow`](../../../joint/joint-solver-mass-data-row/classes/JointSolverMassDataRow.md)[]

Defined in: [constraint/solver/pgs-joint-constraint-solver.ts:49](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/solver/pgs-joint-constraint-solver.ts#L49)

约束行质量数据数组。
每个元素对应一行约束的质量矩阵衍生计算结果，核心作用：
1. 预计算有效质量、质量矩阵与雅可比的乘积等，避免求解过程中重复计算；
2. 存储平动/转动部分的质量系数，适配不同维度的约束求解；
3. 数组长度由SETTING_MAX_JACOBIAN_ROWS常量限定，适配最大约束行数；
初始化逻辑：构造函数中按最大行数创建JointSolverMassDataRow实例，保证内存预分配。

## Methods

### postSolve()

> **postSolve**(): `void`

Defined in: [constraint/solver/pgs-joint-constraint-solver.ts:697](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/solver/pgs-joint-constraint-solver.ts#L697)

约束求解后置处理。
整个约束求解流程的最终收尾逻辑，核心作用：
1. 同步关节锚点：将关节锚点更新到刚体最新的位置/旋转，保证下一帧求解的初始数据准确；
2. 检查关节销毁条件：判断关节是否满足销毁规则（如刚体销毁、生命周期结束），触发销毁逻辑；
工程化价值：
- 保证求解器与关节状态的一致性，避免数据不同步导致的模拟错误；
- 自动化销毁检查，减少手动管理关节生命周期的成本；
执行时机：速度求解+位置求解全部完成后，物理引擎单次模拟循环结束前。

#### Returns

`void`

#### Overrides

[`ConstraintSolver`](../../constraint-solver/classes/ConstraintSolver.md).[`postSolve`](../../constraint-solver/classes/ConstraintSolver.md#postsolve)

***

### postSolveVelocity()

> **postSolveVelocity**(`timeStep`): `void`

Defined in: [constraint/solver/pgs-joint-constraint-solver.ts:288](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/solver/pgs-joint-constraint-solver.ts#L288)

速度求解后置处理。
速度求解完成后的收尾逻辑，核心作用：
1. 累加所有约束冲量，计算关节在当前时间步内受到的合外力和合外力矩；
2. 将冲量转换为力/力矩（冲量/时间=力），存储到关节的appliedForce/appliedTorque属性；
3. 为物理引擎的力反馈、调试工具、关节受力分析提供数据支撑；
核心逻辑：
- 按雅可比稀疏标记分别累加平动力和力矩分量；
- 利用invDt（1/dt）将冲量转换为持续力，符合物理公式定义；
工程化价值：解耦求解逻辑与受力分析，保证核心求解流程的纯净性。

#### Parameters

##### timeStep

[`TimeStep`](../../../../common/time-step/classes/TimeStep.md)

时间步长管理实例（用于冲量转力的计算）

#### Returns

`void`

#### Overrides

[`ConstraintSolver`](../../constraint-solver/classes/ConstraintSolver.md).[`postSolveVelocity`](../../constraint-solver/classes/ConstraintSolver.md#postsolvevelocity)

***

### preSolvePosition()

> **preSolvePosition**(`timeStep`): `void`

Defined in: [constraint/solver/pgs-joint-constraint-solver.ts:321](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/solver/pgs-joint-constraint-solver.ts#L321)

位置求解前置处理。
位置求解阶段的前置初始化逻辑，核心作用：
1. 同步关节锚点：更新锚点到刚体当前位置，保证位置约束数据的准确性；
2. 获取位置求解信息：从关节读取位置约束的雅可比矩阵、RHS等参数；
3. 重新计算质量数据：适配位置约束的求解需求（无CFM项，简化计算）；
4. 重置位置冲量（impulseP）：避免上一帧的位置冲量干扰当前求解；
核心差异（与preSolveVelocity对比）：
- 位置求解无需稀疏性优化，全维度计算保证位置修正精度；
- 质量数据仅计算有效质量（md[12]），无电机相关的md[13]；
- 无CFM项计算，位置约束更刚性，依赖Baumgarte稳定化；
工程化设计：与速度求解前置逻辑保持结构一致，降低维护成本。

#### Parameters

##### timeStep

[`TimeStep`](../../../../common/time-step/classes/TimeStep.md)

时间步长管理实例（传递时间上下文）

#### Returns

`void`

#### Overrides

[`ConstraintSolver`](../../constraint-solver/classes/ConstraintSolver.md).[`preSolvePosition`](../../constraint-solver/classes/ConstraintSolver.md#presolveposition)

***

### preSolveVelocity()

> **preSolveVelocity**(`timeStep`): `void`

Defined in: [constraint/solver/pgs-joint-constraint-solver.ts:80](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/solver/pgs-joint-constraint-solver.ts#L80)

速度求解前置处理。
速度求解阶段的前置初始化逻辑，核心作用：
1. 同步关节锚点：更新关节锚点到刚体当前位置，保证约束数据的时效性；
2. 获取求解信息：从关节读取速度求解所需的雅可比矩阵、RHS、CFM等参数；
3. 预计算质量数据：基于刚体质量/转动惯量，计算每个约束行的有效质量、质量系数等；
4. 稀疏性优化：根据雅可比矩阵稀疏标记，跳过无效维度的计算，减少浮点运算；
工程化优化：
- 局部变量缓存刚体属性（如invMass、invInertia），减少对象属性访问开销；
- 预计算有效质量倒数，将除法转换为乘法，提升求解效率；
- 包含CFM（约束力混合）项计算，适配不同柔度的约束场景。

#### Parameters

##### timeStep

[`TimeStep`](../../../../common/time-step/classes/TimeStep.md)

时间步长管理实例（含dt、invDt等核心时间参数）

#### Returns

`void`

#### Overrides

[`ConstraintSolver`](../../constraint-solver/classes/ConstraintSolver.md).[`preSolveVelocity`](../../constraint-solver/classes/ConstraintSolver.md#presolvevelocity)

***

### solvePositionNgs()

> **solvePositionNgs**(`timeStep`): `void`

Defined in: [constraint/solver/pgs-joint-constraint-solver.ts:431](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/solver/pgs-joint-constraint-solver.ts#L431)

NGS（Normalized Gauss-Seidel）位置求解。
直接修正刚体位置/旋转的NGS位置求解算法，核心作用：
1. 高精度修正关节位置误差，适用于对位置精度要求高的场景（如机械臂、精密装配）；
2. 直接更新刚体的变换矩阵（位置+旋转），无需伪速度中转；
3. 完整的旋转矩阵更新逻辑，保证刚体旋转的正交性和数值稳定性；
核心流程：
- 计算位置/旋转增量：基于约束误差求解冲量，转换为位置/旋转增量；
- 位置更新：直接累加位置增量到刚体变换矩阵；
- 旋转更新：增量转四元数→四元数乘法→四元数转旋转矩阵→更新转动惯量；
工程化优化：
- 小角度近似：避免三角函数计算，提升旋转更新效率；
- 四元数归一化：保证旋转矩阵的正交性，防止数值漂移；
- 转动惯量重新计算：适配旋转变化，保证后续求解的准确性；
适用场景：对位置精度要求高于速度流畅度的场景，如静态约束、精密模拟。

#### Parameters

##### timeStep

[`TimeStep`](../../../../common/time-step/classes/TimeStep.md)

时间步长管理实例（传递时间上下文）

#### Returns

`void`

#### Overrides

[`ConstraintSolver`](../../constraint-solver/classes/ConstraintSolver.md).[`solvePositionNgs`](../../constraint-solver/classes/ConstraintSolver.md#solvepositionngs)

***

### solvePositionSplitImpulse()

> **solvePositionSplitImpulse**(): `void`

Defined in: [constraint/solver/pgs-joint-constraint-solver.ts:375](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/solver/pgs-joint-constraint-solver.ts#L375)

分离冲量位置求解。
基于分离冲量（Split Impulse）的位置修正算法，核心作用：
1. 修正关节位置误差，解决约束漂移问题，保证模拟的长期稳定性；
2. 分离速度冲量和位置冲量，避免位置修正干扰速度求解的动力学正确性；
3. 利用伪速度（pseudoVel）进行位置修正，不影响刚体的真实速度；
核心逻辑：
- 计算伪速度的约束误差，结合Baumgarte因子求解位置冲量；
- 冲量投影到约束限制范围内，保证位置修正符合物理规则；
- 更新刚体伪速度，最终由物理引擎将伪速度转换为位置增量；
工程化价值：分离冲量是解决“位置修正导致速度突变”问题的经典方案，提升模拟流畅度。

#### Returns

`void`

#### Overrides

[`ConstraintSolver`](../../constraint-solver/classes/ConstraintSolver.md).[`solvePositionSplitImpulse`](../../constraint-solver/classes/ConstraintSolver.md#solvepositionsplitimpulse)

***

### solveVelocity()

> **solveVelocity**(): `void`

Defined in: [constraint/solver/pgs-joint-constraint-solver.ts:200](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/solver/pgs-joint-constraint-solver.ts#L200)

速度约束核心求解。
PGS算法的核心实现，分两阶段完成速度约束求解：
第一阶段：电机约束求解（关节马达控制）
- 计算电机目标速度与实际速度的偏差，求解所需电机冲量；
- 冲量投影到电机最大冲量限制范围内，保证电机输出符合物理限制；
第二阶段：常规约束求解（限位、接触等）
- 计算约束速度误差，求解满足RHS的约束冲量；
- 冲量投影到min/max限制范围内，符合PGS“投影到可行域”的核心思想；
工程化设计：
- 局部变量缓存速度值，减少对象属性访问的性能开销；
- 按雅可比稀疏标记跳过无效计算，提升求解效率；
- 冲量增量计算避免重复赋值，保证数值稳定性；
核心输出：更新刚体的线速度/角速度，使其满足关节约束的速度限制。

#### Returns

`void`

#### Overrides

[`ConstraintSolver`](../../constraint-solver/classes/ConstraintSolver.md).[`solveVelocity`](../../constraint-solver/classes/ConstraintSolver.md#solvevelocity)

***

### warmStart()

> **warmStart**(`timeStep`): `void`

Defined in: [constraint/solver/pgs-joint-constraint-solver.ts:144](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/solver/pgs-joint-constraint-solver.ts#L144)

约束求解热启动。
PGS算法的核心优化手段，核心作用：
1. 复用上一帧的约束冲量值，作为当前帧的初始冲量，大幅减少迭代收敛次数；
2. 按时间步长比率缩放冲量，适配动态帧率场景下的时间缩放；
3. 将热启动冲量转换为刚体速度增量，初始化求解器状态；
核心逻辑：
- 按位置修正算法类型选择热启动因子（BAUMGARTE/常规）；
- 因子无效时重置冲量，避免无效值干扰求解；
- 局部变量缓存速度值，减少对象属性访问开销；
工程化价值：热启动可将PGS迭代次数减少50%以上，是物理引擎高性能的关键优化。

#### Parameters

##### timeStep

[`TimeStep`](../../../../common/time-step/classes/TimeStep.md)

时间步长管理实例（用于计算时间缩放因子）

#### Returns

`void`

#### Overrides

[`ConstraintSolver`](../../constraint-solver/classes/ConstraintSolver.md).[`warmStart`](../../constraint-solver/classes/ConstraintSolver.md#warmstart)
