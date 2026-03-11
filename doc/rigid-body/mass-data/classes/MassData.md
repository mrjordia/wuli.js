[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [rigid-body/mass-data](../README.md) / MassData

# Class: MassData

Defined in: [rigid-body/mass-data.ts:11](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/rigid-body/mass-data.ts#L11)

物理引擎刚体质量数据类。
用于存储刚体的核心质量属性，包含总质量和本地坐标系下的转动惯量矩阵，
是刚体物理模拟（受力、旋转、动量计算）的核心数据载体
设计说明：
- 所有属性基于刚体本地坐标系（质心）计算，保证转动惯量的物理正确性
- 转动惯量矩阵使用3x3矩阵存储，支持非对称刚体的物理模拟

## Constructors

### Constructor

> **new MassData**(): `MassData`

#### Returns

`MassData`

## Properties

### localInertia

> **localInertia**: [`Mat3`](../../../common/mat3/classes/Mat3.md)

Defined in: [rigid-body/mass-data.ts:30](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/rigid-body/mass-data.ts#L30)

本地坐标系下的转动惯量矩阵（单位：kg·m²）。
3x3对称矩阵，描述刚体绕质心各轴的转动惯性分布，核心作用：
1. 计算角加速度（角加速度 = 合外力矩 × 转动惯量矩阵的逆）
2. 模拟刚体旋转时的惯性阻力（不同轴的旋转难易程度）
矩阵结构（行主序）：
[ Ixx, Ixy, Ixz ]
[ Iyx, Iyy, Iyz ]
[ Izx, Izy, Izz ]
注：物理上转动惯量矩阵为对称矩阵，Ixy=Iyx、Ixz=Izx、Iyz=Izy

***

### mass

> **mass**: `number` = `0`

Defined in: [rigid-body/mass-data.ts:17](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/rigid-body/mass-data.ts#L17)

刚体总质量（单位：千克/kg）。
计算逻辑：所有关联Shape的质量之和（质量 = 密度 × 体积）
默认值0表示静态刚体（无质量，不受力影响）
