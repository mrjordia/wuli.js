[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [common/nullable](../README.md) / Nullable

# Type Alias: Nullable\<T\>

> **Nullable**\<`T`\> = `T` \| `null` \| `undefined`

Defined in: [common/nullable.ts:7](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/common/nullable.ts#L7)

通用可空类型别名。
扩展基础类型，支持 `null` 和 `undefined` 两种空值状态
适用于物理引擎中允许"未定义/空值"的场景（如可选的碰撞回调参数、未初始化的几何数据等）

## Type Parameters

### T

`T`

基础类型（可以是任意原始类型、对象、类实例等）
