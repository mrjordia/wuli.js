[**wuli.js API文档**](../../README.md)

***

[wuli.js API文档](../../modules.md) / [constant](../README.md) / BROAD\_PHASE\_TYPE

# Enumeration: BROAD\_PHASE\_TYPE

Defined in: [constant.ts:77](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constant.ts#L77)

宽相位检测类型枚举。
标识宽相位碰撞检测的实现类型

## Enumeration Members

### BRUTE\_FORCE

> **BRUTE\_FORCE**: `5001`

Defined in: [constant.ts:81](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constant.ts#L81)

暴力检测（遍历所有代理对，性能低）

***

### BVH

> **BVH**: `5002`

Defined in: [constant.ts:83](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constant.ts#L83)

BVH检测（二叉体积层次树，高性能）

***

### NULL

> **NULL**: `5000`

Defined in: [constant.ts:79](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/constant.ts#L79)

空类型（无效）
