[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [common/method](../README.md) / TRANSFORM\_OPTION

# Enumeration: TRANSFORM\_OPTION

Defined in: [common/method.ts:20](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/method.ts#L20)

变换操作选项枚举。
控制向量/矩阵变换时的操作范围，适配物理引擎中不同坐标空间转换场景：
- 平移+旋转：完整的空间变换（默认）；
- 仅旋转：剔除平移的纯姿态变换；
- 仅平移：剔除旋转的纯位置变换。

## Enumeration Members

### ROTATE

> **ROTATE**: `1`

Defined in: [common/method.ts:24](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/method.ts#L24)

仅执行旋转变换，适配纯姿态调整（如刚体朝向修改）

***

### TRANSLATE

> **TRANSLATE**: `2`

Defined in: [common/method.ts:26](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/method.ts#L26)

仅执行平移变换，适配纯位置调整（如刚体平移）

***

### TRANSLATE\_ROTATE

> **TRANSLATE\_ROTATE**: `0`

Defined in: [common/method.ts:22](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/common/method.ts#L22)

同时执行平移+旋转变换（默认），适配局部→世界空间的完整转换
