[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [constraint/contact/contact-solver-info](../README.md) / ContactSolverInfo

# Class: ContactSolverInfo

Defined in: [constraint/contact/contact-solver-info.ts:11](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/contact/contact-solver-info.ts#L11)

接触约束求解信息类。
物理引擎中管理单个碰撞接触所有求解数据的容器类，整合了碰撞的两个刚体、多个接触点的求解行数据（ContactSolverInfoRow），
             是约束求解器（Solver）处理单个碰撞接触的核心数据载体，预分配固定长度的求解行数组以优化性能

## Constructors

### Constructor

> **new ContactSolverInfo**(): `ContactSolverInfo`

Defined in: [constraint/contact/contact-solver-info.ts:46](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/contact/contact-solver-info.ts#L46)

构造函数：初始化接触约束求解信息实例。
核心逻辑：预创建数组中所有ContactSolverInfoRow实例，长度由SETTING_MAX_MANIFOLD_POINTS决定，
             避免运行时频繁创建/销毁对象，提升物理引擎的运行性能

#### Returns

`ContactSolverInfo`

## Properties

### numRows

> **numRows**: `number` = `0`

Defined in: [constraint/contact/contact-solver-info.ts:32](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/contact/contact-solver-info.ts#L32)

有效求解行数量。
标记当前接触中实际有效的ContactSolverInfoRow数量（≤ SETTING_MAX_MANIFOLD_POINTS），
             求解器仅处理前numRows行数据，避免遍历空行

#### Default

```ts
0
```

***

### rigidBody1

> **rigidBody1**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`RigidBody`](../../../../rigid-body/rigid-body/classes/RigidBody.md)\>

Defined in: [constraint/contact/contact-solver-info.ts:17](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/contact/contact-solver-info.ts#L17)

第一个碰撞刚体。
指向碰撞中的第一个刚体实例，包含刚体的质量、惯性、速度等物理属性，是约束求解的核心输入数据

#### Default

```ts
null
```

***

### rigidBody2

> **rigidBody2**: [`Nullable`](../../../../common/nullable/type-aliases/Nullable.md)\<[`RigidBody`](../../../../rigid-body/rigid-body/classes/RigidBody.md)\>

Defined in: [constraint/contact/contact-solver-info.ts:24](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/contact/contact-solver-info.ts#L24)

第二个碰撞刚体。
指向碰撞中的第二个刚体实例，与rigidBody1配对，共同参与约束方程的构建和求解

#### Default

```ts
null
```

***

### rows

> **rows**: [`ContactSolverInfoRow`](../../contact-solver-info-row/classes/ContactSolverInfoRow.md)[]

Defined in: [constraint/contact/contact-solver-info.ts:39](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constraint/contact/contact-solver-info.ts#L39)

接触求解行数组。
预分配的ContactSolverInfoRow数组，长度等于最大接触点数量（SETTING_MAX_MANIFOLD_POINTS），
             每个元素对应一个接触点的求解数据，初始化时自动创建所有行实例以避免运行时动态分配
