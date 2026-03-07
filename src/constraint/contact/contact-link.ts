import { Nullable } from "../../common/nullable";
import RigidBody from "../../rigid-body/rigid-body";
import Contact from "./contact";

/**
 * 接触链接类。
 * 用于关联刚体（RigidBody）与碰撞接触（Contact）的双向链表节点，
 *              是物理引擎中高效管理"刚体-接触"关联关系的核心数据结构，每个Contact实例会通过link1/link2关联两个刚体的ContactLink链表
 */
export default class ContactLink {
    /**
     * 接触链接链表的上一个节点。
     * 双向链表的前驱节点，用于遍历当前刚体的所有接触链接
     * @default null
     */
    public prev: Nullable<ContactLink>;

    /**
     * 接触链接链表的下一个节点。
     * 双向链表的后继节点，与prev配合实现链表的遍历、插入、删除操作
     * @default null
     */
    public next: Nullable<ContactLink>;

    /**
     * 关联的碰撞接触实例。
     * 指向当前链接对应的Contact实例，通过该属性可从刚体快速定位到具体的碰撞接触数据
     * @default null
     */
    public contact: Nullable<Contact>;

    /**
     * 关联的另一个刚体。
     * 指向碰撞中的另一个刚体（非当前链表所属的刚体），用于快速获取碰撞配对的刚体，避免反向查找
     * @default null
     */
    public other: Nullable<RigidBody>;
}

export { ContactLink };