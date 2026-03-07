import { Nullable } from "../../common/nullable";
import PhysicsProxy from "../physics-proxy";
import BvhNode from "./bvh-node";

/**
 * 边界体积层次树专用物理代理类。
 * 继承自基础PhysicsProxy，为BVH粗检测场景扩展专属属性，核心作用：
 * 1. 关联BVH树的叶子节点，建立物理代理与BVH空间索引的映射关系；
 * 2. 标记代理的移动状态，支持BVH树的增量更新（仅重检测移动的代理）；
 * 3. 复用基础PhysicsProxy的核心能力（AABB存储、ID、链表指针等）；
 * 核心特性：
 * - 轻量级扩展：仅新增叶子节点关联和移动标记，无额外性能开销；
 * - 适配BVH动态更新：通过moved标记减少不必要的树重构，提升性能；
 * 主要应用场景：BVHBroadphase粗检测中，管理物理形状与BVH树节点的关联关系。
 */
export default class BvhProxy extends PhysicsProxy {
    /**
     * 关联的BVH叶子节点。
     * 指向当前代理绑定的BVH树叶子节点；
     * - 叶子节点的proxy属性会反向指向当前BvhProxy实例；
     * - 代理未加入BVH树/已从树中移除时，该属性为null；
     * 核心作用：建立代理与BVH空间索引的双向关联，支持快速定位与更新。
     */
    public leaf: Nullable<BvhNode>;

    /**
     * 代理移动状态标记。
     * 标记代理是否发生位置/AABB变化：
     * - true：代理已移动，需触发BVH树的增量更新（重新插入/调整节点）；
     * - false：代理未移动，无需参与BVH树的重检测；
     * 初始值为false，移动物理代理时置为true，BVH更新完成后置为false。
     */
    public moved = false;
}

export { BvhProxy };