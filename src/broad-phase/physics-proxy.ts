import { Nullable } from "../common/nullable";
import Shape from "../shape/shape";

/**
 * 物理代理核心类。
 * 物理引擎中用于封装碰撞形状（Shape）的代理类，核心作用：
 * 1. 存储形状的AABB包围盒数据，用于碰撞检测的粗测阶段；
 * 2. 维护形状的唯一标识ID和用户数据关联；
 * 3. 通过双向链表（prev/next）管理代理实例，支持高效的空间查询；
 * 主要应用于物理世界的碰撞粗检测、形状管理、空间分区（如Broadphase）等场景。
 */
export default class PhysicsProxy {
    /**
     * 关联的物理形状实例。
     * 指向代理所封装的Shape对象（如盒体、球体、凸包等）；
     * 类型为Nullable，支持空值表示代理未关联有效形状。
     */
    public userData: Nullable<Shape>;

    /**
     * AABB包围盒尺寸数据。
     * 长度为6的浮点数组，存储AABB包围盒的最小/最大边界值，数组结构：
     * [
     *   aabbMinX,aabbMinY,aabbMinZ,    // 索引0-2：AABB包围盒最小点坐标
     *   aabbMaxX,aabbMaxY,aabbMaxZ     // 索引3-5：AABB包围盒最大点坐标
     * ]
     * 采用Float64Array保证高精度计算，适配物理引擎的数值精度需求。
     */
    public size = new Float64Array(6);

    /**
     * 代理唯一标识ID。
     * 物理代理的全局唯一ID，用于区分不同的代理实例；
     * 在构造函数中初始化，通常由物理世界统一分配和管理。
     */
    public id: number;

    /**
     * 双向链表前驱节点。
     * 指向链表中当前代理的上一个节点；
     * 类型为Nullable，链表头节点的prev为null，用于代理实例的链表管理。
     */
    public prev: Nullable<PhysicsProxy>;

    /**
     * 双向链表后继节点。
     * 指向链表中当前代理的下一个节点；
     * 类型为Nullable，链表尾节点的next为null，用于代理实例的链表管理。
     */
    public next: Nullable<PhysicsProxy>;

    /**
     * 构造函数：初始化物理代理。
     * 核心初始化逻辑：
     * 1. 绑定传入的Shape对象到userData属性；
     * 2. 初始化代理唯一ID；
     * 3. size数组默认初始化为长度6的Float64Array，AABB数据需后续赋值；
     * 4. prev/next默认为null，需通过链表操作赋值。
     * @param {Shape} userData - 关联的物理形状实例（非空）
     * @param {number} id - 代理的唯一标识ID
     */
    constructor(userData: Shape, id: number) {
        this.userData = userData;
        this.id = id;
    }
}

export { PhysicsProxy };