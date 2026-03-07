[**wuli.js API文档**](../../../../README.md)

***

[wuli.js API文档](../../../../modules.md) / [collision-detector/box-box-detector/face-clipper](../README.md) / FaceClipper

# Class: FaceClipper

Defined in: [collision-detector/box-box-detector/face-clipper.ts:12](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/box-box-detector/face-clipper.ts#L12)

面裁剪器核心类。
物理引擎中入射顶点集合的矩形边界裁剪与顶点简化工具类；
核心能力：
1. 按指定宽高的轴对齐矩形边界裁剪顶点集合（四边界顺序裁剪）；
2. 对裁剪后的顶点集合进行极值简化，保留关键特征点；
主要应用于碰撞接触面处理、形状边界约束、物理碰撞响应优化等场景。

## Constructors

### Constructor

> **new FaceClipper**(): `FaceClipper`

Defined in: [collision-detector/box-box-detector/face-clipper.ts:62](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/box-box-detector/face-clipper.ts#L62)

构造函数：初始化顶点数组。
为vertices和tmpVertices数组预初始化8个IncidentVertex实例；
核心作用：避免运行时动态创建实例，提升裁剪操作的执行效率。

#### Returns

`FaceClipper`

## Properties

### h

> **h**: `number` = `0`

Defined in: [collision-detector/box-box-detector/face-clipper.ts:25](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/box-box-detector/face-clipper.ts#L25)

裁剪矩形的半高度（Y轴方向）。
裁剪边界阈值：Y轴有效范围为 [-h, h]，用于上/下边界的裁剪判断；
初始值为0，需在裁剪前通过业务逻辑赋值。

***

### numTmpVertices

> **numTmpVertices**: `number` = `0`

Defined in: [collision-detector/box-box-detector/face-clipper.ts:39](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/box-box-detector/face-clipper.ts#L39)

临时顶点缓存数量。
标记tmpVertices数组中临时存储的顶点数量；
裁剪过程中作为中间数据计数，操作完成后重置为0。

***

### numVertices

> **numVertices**: `number` = `0`

Defined in: [collision-detector/box-box-detector/face-clipper.ts:32](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/box-box-detector/face-clipper.ts#L32)

当前有效顶点数量。
标记vertices数组中实际存储的入射顶点数量；
裁剪/简化操作会动态更新该值，初始值为0。

***

### tmpVertices

> **tmpVertices**: [`IncidentVertex`](../../incident-vertex/classes/IncidentVertex.md)[]

Defined in: [collision-detector/box-box-detector/face-clipper.ts:53](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/box-box-detector/face-clipper.ts#L53)

临时顶点缓存数组。
固定长度8的顶点缓存数组，用于裁剪过程中的数据交换与临时存储；
与vertices数组配合完成裁剪数据的暂存与结果替换。

***

### vertices

> **vertices**: [`IncidentVertex`](../../incident-vertex/classes/IncidentVertex.md)[]

Defined in: [collision-detector/box-box-detector/face-clipper.ts:46](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/box-box-detector/face-clipper.ts#L46)

入射顶点存储数组。
固定长度8的顶点数组，存储待裁剪/已裁剪的入射顶点数据；
数组元素为IncidentVertex实例，包含顶点2D坐标与3D法向量信息。

***

### w

> **w**: `number` = `0`

Defined in: [collision-detector/box-box-detector/face-clipper.ts:18](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/box-box-detector/face-clipper.ts#L18)

裁剪矩形的半宽度（X轴方向）。
裁剪边界阈值：X轴有效范围为 [-w, w]，用于左/右边界的裁剪判断；
初始值为0，需在裁剪前通过业务逻辑赋值。

## Methods

### clip()

> **clip**(): `void`

Defined in: [collision-detector/box-box-detector/face-clipper.ts:80](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/box-box-detector/face-clipper.ts#L80)

顶点矩形边界裁剪核心方法。
按顺序对顶点集合执行四边界裁剪（左→右→下→上）；
裁剪逻辑：
1. 左边界：保留 X > -w 的顶点，跨边界时计算交点；
2. 右边界：保留 X < w 的顶点，跨边界时计算交点；
3. 下边界：保留 Y > -h 的顶点，跨边界时计算交点；
4. 上边界：保留 Y < h 的顶点，跨边界时计算交点；
每个边界裁剪完成后，交换顶点数组与临时数组，更新有效顶点数量。

#### Returns

`void`

***

### reduce()

> **reduce**(): `void`

Defined in: [collision-detector/box-box-detector/face-clipper.ts:149](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/collision-detector/box-box-detector/face-clipper.ts#L149)

顶点集合简化方法。
对裁剪后的顶点集合进行极值简化，仅保留4个关键特征点；
简化逻辑：
1. 计算顶点在(1,1)、(-1,1)两个对角方向的投影值；
2. 提取每个方向的最大值、最小值对应的顶点；
3. 将4个极值顶点作为简化后的结果；
注意：仅当顶点数量≥4时执行简化，否则直接返回。

#### Returns

`void`
