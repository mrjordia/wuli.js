[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [constraint/joint/basis-tracker](../README.md) / BasisTracker

# Class: BasisTracker

Defined in: [constraint/joint/basis-tracker.ts:8](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/basis-tracker.ts#L8)

基向量追踪器类。
用于追踪关节关联刚体的基向量（坐标系）变化，存储3x3基向量矩阵的9个元素，
             核心作用是实时记录刚体坐标系的X/Y/Z轴方向向量，为关节约束求解、坐标变换提供基础数据

## Constructors

### Constructor

> **new BasisTracker**(`joint`): `BasisTracker`

Defined in: [constraint/joint/basis-tracker.ts:34](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/basis-tracker.ts#L34)

构造函数：初始化基向量追踪器。
核心初始化逻辑：
             1. 绑定目标关节，建立追踪器与关节的关联关系
             2. 初始化长度为9的Float64Array数组，用于存储3x3基向量矩阵

#### Parameters

##### joint

[`Joint`](../../joint/classes/Joint.md)

待绑定的关节实例

#### Returns

`BasisTracker`

## Properties

### elements

> **elements**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [constraint/joint/basis-tracker.ts:25](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/basis-tracker.ts#L25)

3x3基向量矩阵的元素数组（Float64Array类型）。
长度为9的浮点数组，按行优先顺序存储基向量矩阵：
             [
                 xX, xY, xZ,  // X轴方向向量（第0-2位）
                 yX, yY, yZ,  // Y轴方向向量（第3-5位）
                 zX, zY, zZ   // Z轴方向向量（第6-8位）
             ]
             采用Float64Array以保证高精度，适配物理引擎的数值计算需求

***

### joint

> **joint**: [`Joint`](../../joint/classes/Joint.md)

Defined in: [constraint/joint/basis-tracker.ts:13](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constraint/joint/basis-tracker.ts#L13)

当前追踪器绑定的关节实例。
关联的目标关节，追踪器基于该关节的刚体状态更新基向量数据
