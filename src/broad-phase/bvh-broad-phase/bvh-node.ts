import { Nullable } from "../../common/nullable";
import BvhProxy from "./bvh-proxy";

/**
 * BVH树节点核心类。
 * 物理引擎中BVH树的核心节点结构，核心作用：
 * 1. 构建分层的空间索引结构，用于高效的碰撞粗检测、射线检测、AABB查询；
 * 2. 每个节点存储AABB包围盒数据，非叶子节点包含子节点，叶子节点关联物理代理（BvhProxy）；
 * 3. 通过双向链表维护叶子节点，支持快速遍历所有代理；
 * 核心特性：
 * - 支持二叉树结构（children数组长度为2），适配BVH树的二分划分逻辑；
 * - 维护节点高度、父子索引等拓扑信息，支持树的动态更新（插入/删除/移动）；
 * - 预分配临时缓存（tmp数组），优化节点AABB计算的内存开销；
 * 主要应用场景：BVHBroadphase粗检测、动态场景的高效空间查询、大规模几何体的碰撞筛选。
 */
export default class BvhNode {
    /**
     * 节点单向链表后继节点。
     * 指向BVH树节点链表中的下一个节点；
     * 用于遍历整棵BVH树的所有节点，初始值为null，链表尾节点保持null。
     */
    public next: Nullable<BvhNode>;

    /**
     * 叶子节点双向链表前驱节点。
     * 仅叶子节点有效，指向叶子节点链表中的上一个叶子节点；
     * 核心作用：快速遍历所有关联物理代理的叶子节点，非叶子节点该属性为null。
     */
    public prevLeaf: Nullable<BvhNode>;

    /**
     * 叶子节点双向链表后继节点。
     * 仅叶子节点有效，指向叶子节点链表中的下一个叶子节点；
     * 与prevLeaf配合构成叶子节点双向链表，非叶子节点该属性为null。
     */
    public nextLeaf: Nullable<BvhNode>;

    /**
     * 子节点数组（二叉树）。
     * 长度为2的数组，存储当前节点的左右子节点；
     * - 非叶子节点：children[0]/children[1]指向子节点，用于构建BVH分层结构；
     * - 叶子节点：children数组元素均为null，无下级节点；
     * 初始值为长度2的空数组，元素默认值为null。
     */
    public children: Array<Nullable<BvhNode>> = new Array(2);

    /**
     * 节点在父节点中的索引。
     * 标记当前节点是父节点children数组的第几个元素（0/1）；
     * 用于BVH树更新时快速定位节点在父节点中的位置，初始值为0。
     */
    public childIndex = 0;

    /**
     * 父节点引用。
     * 指向当前节点的父节点；
     * 根节点的parent为null，用于BVH树的向上遍历与AABB更新，初始值为null。
     */
    public parent: Nullable<BvhNode>;

    /**
     * 节点高度。
     * 标记当前节点在BVH树中的高度；
     * - 叶子节点：height=0；
     * - 非叶子节点：height=1 + 左右子节点的最大高度；
     * 用于BVH树的平衡优化，初始值为0。
     */
    public height = 0;

    /**
     * 关联的BVH代理。
     * 仅叶子节点有效，指向关联的BvhProxy实例；
     * 非叶子节点该属性为null，核心作用：将BVH节点与物理代理（形状）关联。
     */
    public proxy: Nullable<BvhProxy>;

    /**
     * 节点AABB包围盒数据。
     * 长度为6的浮点数组，存储AABB包围盒的最小/最大边界值，数组结构：
     *      [
     *          aabbMinX,aabbMinY,aabbMinZ,              0
     *          aabbMaxX,aabbMaxY,aabbMaxZ,              3
     *      ]
     * 采用Float64Array保证高精度计算，非叶子节点的AABB为子节点AABB的合并结果。
     */
    public size = new Float64Array(6);

    /**
     * 临时向量缓存。
     * 长度为3的浮点数组，用于节点AABB计算的临时向量存储；
     * 如AABB扩展、中心点计算等场景，避免频繁创建数组，提升计算效率。
     */
    public tmp = new Float64Array(3);
}

export { BvhNode };