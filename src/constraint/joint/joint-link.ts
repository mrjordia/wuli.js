import { Nullable } from "../../common/nullable";
import RigidBody from "../../rigid-body/rigid-body";
import Joint from "./joint";

/**
 * 刚体-关节关联链表节点类。
 * 物理引擎中用于管理刚体与关节关联关系的双向链表节点，核心作用是：
 *              1. 记录刚体关联的关节实例及对应的另一关联刚体；
 *              2. 通过prev/next指针构建双向链表，高效遍历刚体的所有关联关节；
 *              是刚体与关节之间关联关系的核心数据载体
 */
export default class JointLink {
    /**
     * 当前链表节点关联的关节实例。
     * 节点绑定的目标关节，是链表节点的核心关联对象，通过构造函数初始化赋值
     */
    public joint: Joint;

    /**
     * 关节关联的另一个刚体。
     * 相对于当前链表所属刚体的“另一刚体”，可为null（如关节关联静态刚体/世界），
     *              用于快速获取关节约束的另一个主体，避免重复查询
     */
    public other: Nullable<RigidBody>;

    /**
     * 链表前驱节点。
     * 双向链表的上一个节点，默认值null，用于向前遍历刚体的所有关联关节
     */
    public prev: Nullable<JointLink>;

    /**
     * 链表后继节点。
     * 双向链表的下一个节点，默认值null，用于向后遍历刚体的所有关联关节
     */
    public next: Nullable<JointLink>;

    /**
     * 构造函数：初始化关节链表节点。
     * 核心初始化逻辑：绑定目标关节，prev/next/other默认值为null（后续由刚体/关节管理逻辑赋值）
     * @param {Joint} joint 关联的关节实例
     */
    constructor(joint: Joint) {
        this.joint = joint;
    }
}

export { JointLink };