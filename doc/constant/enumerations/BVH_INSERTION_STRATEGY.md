[**wuli.js API文档**](../../README.md)

***

[wuli.js API文档](../../modules.md) / [constant](../README.md) / BVH\_INSERTION\_STRATEGY

# Enumeration: BVH\_INSERTION\_STRATEGY

Defined in: [constant.ts:90](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constant.ts#L90)

BVH插入策略枚举。
BVH树中代理的插入策略，影响BVH构建效率

## Enumeration Members

### MINIMIZE\_SURFACE\_AREA

> **MINIMIZE\_SURFACE\_AREA**: `1`

Defined in: [constant.ts:94](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constant.ts#L94)

最小表面积插入（构建慢，查询效率高）

***

### SIMPLE

> **SIMPLE**: `0`

Defined in: [constant.ts:92](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/constant.ts#L92)

简单插入（快速，性能一般）
