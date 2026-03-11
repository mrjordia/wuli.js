[**wuli.js API文档**](../../README.md)

***

[wuli.js API文档](../../modules.md) / [constant](../README.md) / POSITION\_CORRECTION\_ALGORITHM

# Enumeration: POSITION\_CORRECTION\_ALGORITHM

Defined in: [constant.ts:141](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constant.ts#L141)

位置修正算法枚举。
约束求解中位置修正的算法类型

## Enumeration Members

### BAUMGARTE

> **BAUMGARTE**: `0`

Defined in: [constant.ts:143](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constant.ts#L143)

鲍姆加特算法（经典，简单但可能引入能量）

***

### NGS

> **NGS**: `2`

Defined in: [constant.ts:147](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constant.ts#L147)

NGS算法（牛顿迭代法，高精度）

***

### SPLIT\_IMPULSE

> **SPLIT\_IMPULSE**: `1`

Defined in: [constant.ts:145](https://github.com/mrjordia/wuli.js/blob/3509599867d77e0e3754230f539293beafd55570/src/constant.ts#L145)

分离冲量（避免能量引入，更稳定）
