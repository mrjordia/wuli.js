[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [constraint/joint/joint-solver-info](../README.md) / JointSolverInfo

# Class: JointSolverInfo

Defined in: [constraint/joint/joint-solver-info.ts:11](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/joint-solver-info.ts#L11)

关节求解器核心信息容器类。
物理引擎中关节约束求解的顶层数据容器，集中管理关节关联的刚体、约束行数量及所有单行约束信息，
             是连接关节与约束求解器的核心数据桥梁，速度/位置约束求解的所有核心参数均存储于此

## Constructors

### Constructor

> **new JointSolverInfo**(): `JointSolverInfo`

Defined in: [constraint/joint/joint-solver-info.ts:48](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/joint-solver-info.ts#L48)

构造函数：初始化关节求解器信息容器。
核心初始化逻辑：
             1. 基于SETTING_MAX_JACOBIAN_ROWS预分配约束行数组长度；
             2. 遍历数组为每个位置创建JointSolverInfoRow实例，完成初始化解码；
             预分配内存避免运行时GC开销，提升约束求解效率

#### Returns

`JointSolverInfo`

## Properties

### numRows

> **numRows**: `number` = `0`

Defined in: [constraint/joint/joint-solver-info.ts:31](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/joint-solver-info.ts#L31)

有效约束行数量。
当前关节实际生效的约束行总数，默认值0；
             小于等于SETTING_MAX_JACOBIAN_ROWS，仅前numRows行约束信息参与求解计算

***

### rigidBody1

> **rigidBody1**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`RigidBody`](../../../../rigid-body/rigid-body/classes/RigidBody.md)\>

Defined in: [constraint/joint/joint-solver-info.ts:17](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/joint-solver-info.ts#L17)

关节关联的第一个刚体。
关节约束的第一个目标刚体，可为null（如关节仅关联单个刚体/世界）；
             是约束求解中计算雅可比矩阵、冲量的核心刚体对象

***

### rigidBody2

> **rigidBody2**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`RigidBody`](../../../../rigid-body/rigid-body/classes/RigidBody.md)\>

Defined in: [constraint/joint/joint-solver-info.ts:24](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/joint-solver-info.ts#L24)

关节关联的第二个刚体。
关节约束的第二个目标刚体，可为null（如关节关联静态刚体/世界）；
             与rigidBody1共同构成关节约束的两个主体，约束求解围绕这两个刚体的运动展开

***

### rows

> **rows**: [`JointSolverInfoRow`](../../joint-solver-info-row/classes/JointSolverInfoRow.md)[]

Defined in: [constraint/joint/joint-solver-info.ts:39](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/joint/joint-solver-info.ts#L39)

约束行信息数组。
预分配的约束行信息数组，长度由CONSTANT.SETTING_MAX_JACOBIAN_ROWS指定；
             数组中每个元素为JointSolverInfoRow实例，存储单行约束的完整求解信息，
             初始化时已创建所有实例，避免运行时动态分配内存
