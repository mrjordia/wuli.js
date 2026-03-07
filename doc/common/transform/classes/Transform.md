[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [common/transform](../README.md) / Transform

# Class: Transform

Defined in: [common/transform.ts:13](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/transform.ts#L13)

3D空间变换核心类。
物理引擎中描述刚体/几何形状空间姿态的核心类，核心作用：
1. 统一封装3D空间的平移（位置）和旋转/缩放（3x3矩阵）变换，整合为单一数据结构；
2. 采用Float64Array存储数据，保证双精度浮点精度，适配物理模拟的高精度需求；
3. 固定内存布局（12元素数组），便于内存连续访问和跨模块数据传递；
核心特性：
- 内存高效：12个双精度浮点数（96字节），无冗余字段，适配SIMD优化；
- 布局规范：位置+矩阵的固定结构，符合物理引擎空间变换的工程惯例；
- 默认安全：初始化时设为单位变换（原点+无旋转/缩放），避免未初始化错误；
主要应用场景：刚体的空间姿态表示、几何形状的局部-世界坐标转换、碰撞检测的变换计算。

## Constructors

### Constructor

> **new Transform**(): `Transform`

Defined in: [common/transform.ts:36](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/transform.ts#L36)

构造函数：初始化单位变换。
核心初始化逻辑：
1. 位置分量（索引0-2）：设为(0,0,0)，表示3D空间原点；
2. 矩阵分量（索引3-11）：设为3x3单位矩阵，表示无旋转、无缩放的恒等变换；
工程意义：默认构造的Transform为「单位变换」，是空间变换的基础状态，避免未初始化的非法变换。

#### Returns

`Transform`

## Properties

### elements

> **elements**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [common/transform.ts:27](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/transform.ts#L27)

变换数据存储数组（双精度浮点）。
固定长度12的Float64Array，内存布局严格定义：
| 索引范围 | 数据含义                | 详细说明                          | 默认值  |
|----------|-------------------------|-----------------------------------|---------|
| 0-2      | 位置向量（Vec3）        | 0=x, 1=y, 2=z（3D空间平移分量）   | (0,0,0) |
| 3-11     | 3x3变换矩阵（Mat3）     | 行主序存储（旋转/缩放分量）       | 单位矩阵|
矩阵行主序索引映射：
- 第一行：3(e00), 4(e01), 5(e02)
- 第二行：6(e10), 7(e11), 8(e12)
- 第三行：9(e20), 10(e21), 11(e22)
设计优势：连续内存布局，便于CPU缓存命中，提升矩阵/向量运算效率。
