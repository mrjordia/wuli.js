[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [constraint/joint/joint-solver-info-row](../README.md) / JointSolverInfoRow

# Class: JointSolverInfoRow

Defined in: [constraint/joint/joint-solver-info-row.ts:10](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint-solver-info-row.ts#L10)

关节求解器单行约束信息类。
物理引擎中关节约束求解的核心单行约束数据容器，存储单条约束行的雅可比矩阵、约束参数、驱动参数、冲量限制等完整信息，
             每个约束维度（如平移/旋转约束）对应一个该类实例，是速度/位置约束求解过程中单行约束计算的核心数据单元

## Constructors

### Constructor

> **new JointSolverInfoRow**(): `JointSolverInfoRow`

#### Returns

`JointSolverInfoRow`

## Properties

### cfm

> **cfm**: `number` = `0`

Defined in: [constraint/joint/joint-solver-info-row.ts:30](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint-solver-info-row.ts#L30)

约束力混合系数（Constraint Force Mixing）。
用于软化约束的系数，默认值0；非零值可让约束具备“弹性”（允许微小穿透/偏移），
             平衡约束的刚性要求与求解稳定性，值越大约束越“软”

***

### impulse

> **impulse**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`JointImpulse`](../../joint-impulse/classes/JointImpulse.md)\>

Defined in: [constraint/joint/joint-solver-info-row.ts:65](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint-solver-info-row.ts#L65)

约束行的冲量数据引用。
关联的冲量存储实例，可为null（未初始化/无冲量数据时）；用于记录当前约束行的速度约束、驱动、位置约束冲量值，
             是约束求解过程中冲量累计和更新的核心关联对象

***

### jacobian

> **jacobian**: [`JacobianRow`](../../../solver/jacobian-row/classes/JacobianRow.md)

Defined in: [constraint/joint/joint-solver-info-row.ts:16](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint-solver-info-row.ts#L16)

约束行的雅可比矩阵行。
描述当前约束行的雅可比矩阵数据，包含刚体速度/位置与约束的映射关系，是约束求解的核心数学基础，
             用于计算约束方程的系数矩阵

***

### maxImpulse

> **maxImpulse**: `number` = `0`

Defined in: [constraint/joint/joint-solver-info-row.ts:44](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint-solver-info-row.ts#L44)

冲量上限。
当前约束行允许的最大冲量值，默认值0，与minImpulse共同限制约束冲量的取值区间，
             常见于有最大受力/力矩限制的关节（如滑块关节的最大驱动力限制）

***

### minImpulse

> **minImpulse**: `number` = `0`

Defined in: [constraint/joint/joint-solver-info-row.ts:37](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint-solver-info-row.ts#L37)

冲量下限。
当前约束行允许的最小冲量值，默认值0，与maxImpulse配合限定冲量范围，
             防止冲量过小/过大导致刚体运动异常（如铰链关节的最小扭矩限制）

***

### motorMaxImpulse

> **motorMaxImpulse**: `number` = `0`

Defined in: [constraint/joint/joint-solver-info-row.ts:58](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint-solver-info-row.ts#L58)

驱动最大冲量。
关节约束驱动允许输出的最大冲量值，默认值0；值为0时表示禁用驱动功能，
             非零值限制驱动的最大作用力/力矩，防止驱动过载导致刚体运动失控

***

### motorSpeed

> **motorSpeed**: `number` = `0`

Defined in: [constraint/joint/joint-solver-info-row.ts:51](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint-solver-info-row.ts#L51)

驱动目标速度。
关节约束驱动的目标速度，默认值0；仅在motorMaxImpulse>0时生效，
             用于控制关节按指定速度旋转/平移（如门铰链的自动开合速度）

***

### rhs

> **rhs**: `number` = `0`

Defined in: [constraint/joint/joint-solver-info-row.ts:23](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/joint-solver-info-row.ts#L23)

约束方程右侧值（Right Hand Side）。
约束方程 $J \cdot v = rhs$ 中的右侧目标值，默认值0，用于定义约束的目标状态（如速度约束的目标相对速度），
             直接决定冲量计算的方向和大小
