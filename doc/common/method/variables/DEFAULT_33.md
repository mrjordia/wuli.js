[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [common/method](../README.md) / DEFAULT\_33

# Variable: DEFAULT\_33

> `const` **DEFAULT\_33**: `number`[]

Defined in: [common/method.ts:8](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/method.ts#L8)

默认3x3单位矩阵（行主序）。
用于初始化旋转/变换矩阵的基础值，无旋转、无缩放的恒等变换状态：
数组结构 [1,0,0, 0,1,0, 0,0,1] 对应3x3单位矩阵的行主序存储，是矩阵运算的基准状态。
