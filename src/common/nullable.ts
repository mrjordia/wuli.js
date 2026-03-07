/**
 * 通用可空类型别名。
 * 扩展基础类型，支持 `null` 和 `undefined` 两种空值状态
 * 适用于物理引擎中允许"未定义/空值"的场景（如可选的碰撞回调参数、未初始化的几何数据等）
 * @template T 基础类型（可以是任意原始类型、对象、类实例等）
 */
export type Nullable<T> = T | null | undefined;