import CollisionMatrix from "../../collision-detector/collision-matrix";
import Contact from "./contact";
import { RIGID_BODY_TYPE } from "../../constant";
import BroadPhase from "../../broad-phase/broad-phase";
import ContactLink from "./contact-link";
import Shape from "../../shape/shape";
import JointLink from "../joint/joint-link";
import RigidBody from "../../rigid-body/rigid-body";
import { Nullable } from "../../common/nullable";

/**
 * 碰撞接触管理器类。
 * 物理引擎中碰撞接触的全局管理核心类，负责接触的创建、销毁、更新全生命周期管理，
 *              整合了宽相位检测结果、碰撞矩阵、接触池、接触链表等核心组件，是连接宽相位检测与接触约束求解的关键枢纽
 */
export default class ContactManager {
    /**
     * 宽相位碰撞检测实例。
     * 提供潜在碰撞对（proxyPairList）的数据源，是接触创建的基础
     */
    public broadPhase: BroadPhase;

    /**
     * 碰撞检测器矩阵。
     * 存储不同几何形状组合对应的碰撞检测器，用于为接触匹配正确的检测器实例
     */
    public collisionMatrix = new CollisionMatrix();

    /**
     * 当前有效接触的数量。
     * 标记接触链表（contactList）中实际有效的Contact实例数量，用于性能统计和遍历控制
     * @default 0
     */
    public numContacts = 0;

    /**
     * 接触链表的头节点。
     * 存储所有当前有效接触的双向链表头节点，遍历从该节点开始
     */
    public contactList!: Contact;

    /**
     * 接触链表的尾节点。
     * 接触双向链表的尾节点，用于快速添加新接触到链表末尾
     */
    public contactListLast!: Contact

    /**
     * 接触对象池。
     * 复用已销毁的Contact实例的对象池，避免频繁创建/销毁对象导致的性能开销，
     *              采用链表结构管理空闲Contact实例
     */
    public contactPool!: Contact;

    /**
     * 构造函数：初始化碰撞接触管理器。
     * 初始化时关联宽相位检测实例，初始化碰撞矩阵和接触池等核心属性
     * @param {BroadPhase} broadPhase 宽相位检测实例 - 必须传入有效的BroadPhase实例，作为潜在碰撞对的数据源
     */
    constructor(broadPhase: BroadPhase) {
        this.broadPhase = broadPhase;
    }

    /**
     * 创建新的碰撞接触（核心方法）。
     * 基于宽相位检测的潜在碰撞对，创建/更新Contact实例，核心流程：
     *              1. 遍历宽相位的proxyPairList，获取所有潜在碰撞的形状对
     *              2. 过滤无效碰撞对（通过shouldCollide判断）
     *              3. 检查碰撞对是否已有对应的Contact实例：
     *                 - 已有：标记为latest=true（最新接触）
     *                 - 无：从对象池获取或新建Contact实例，初始化并加入接触链表
     *              4. 关联Contact与刚体的ContactLink链表，更新接触计数
     *              注：优先遍历接触链接少的刚体，优化查找性能
     */
    public createContacts(): void {
        let pp = this.broadPhase.proxyPairList;
        while (pp) {
            const n = pp.next;
            let s1: Shape, s2: Shape;
            if (pp.proxy1!.id < pp.proxy2!.id) {
                s1 = pp.proxy1!.userData!;
                s2 = pp.proxy2!.userData!;
            } else {
                s1 = pp.proxy2!.userData!;
                s2 = pp.proxy1!.userData!;
            }
            if (this.shouldCollide(s1, s2)) {
                const b1 = s1.rigidBody!, b2 = s2.rigidBody!;
                let l: Nullable<ContactLink>;
                if (b1.numContactLinks < b2.numContactLinks) {
                    l = b1.contactLinkList;
                } else {
                    l = b2.contactLinkList;
                }
                const id1 = s1.id, id2 = s2.id;
                let found = false;
                while (l) {
                    const c = l.contact!;
                    if (c.shape1!.id === id1 && c.shape2!.id === id2) {
                        c.latest = true;
                        found = true;
                        break;
                    }
                    l = l.next;
                }
                if (!found) {
                    let first = this.contactPool;
                    if (first) {
                        this.contactPool = first.next!;
                        first.next = null;
                    } else {
                        first = new Contact();
                    }
                    const c = first;
                    if (!this.contactList) {
                        this.contactList = this.contactListLast = c;
                    } else {
                        this.contactListLast.next = c;
                        c.prev = this.contactListLast;
                        this.contactListLast = c;
                    }
                    c.latest = true;
                    const detector = this.collisionMatrix.getDetector(s1.geometry.type, s2.geometry.type);
                    c.shape1 = s1;
                    c.shape2 = s2;
                    c.rigidBody1 = s1.rigidBody;
                    c.rigidBody2 = s2.rigidBody;
                    c.touching = false;
                    if (!c.rigidBody1!.contactLinkList) {
                        c.rigidBody1!.contactLinkList = c.rigidBody1!.contactLinkListLast = c.link1;
                    } else {
                        c.rigidBody1!.contactLinkListLast!.next = c.link1;
                        c.link1.prev = c.rigidBody1!.contactLinkListLast;
                        c.rigidBody1!.contactLinkListLast = c.link1;
                    }
                    if (!c.rigidBody2!.contactLinkList) {
                        c.rigidBody2!.contactLinkList = c.rigidBody2!.contactLinkListLast = c.link2;
                    } else {
                        c.rigidBody2!.contactLinkListLast!.next = c.link2;
                        c.link2.prev = c.rigidBody2!.contactLinkListLast;
                        c.rigidBody2!.contactLinkListLast = c.link2;
                    }
                    c.rigidBody1!.numContactLinks++;
                    c.rigidBody2!.numContactLinks++;
                    c.link1.other = c.rigidBody2;
                    c.link2.other = c.rigidBody1;
                    c.link1.contact = c.link2.contact = c;
                    c.detector = detector;
                    const _this = c.contactConstraint;
                    _this.shape1 = s1;
                    _this.shape2 = s2;
                    _this.rigidBody1 = _this.shape1.rigidBody;
                    _this.rigidBody2 = _this.shape2.rigidBody;
                    _this.transform1 = _this.rigidBody1!.transform;
                    _this.transform2 = _this.rigidBody2!.transform;
                    this.numContacts++;
                }
            }
            pp = n;
        }
    }

    /**
     * 销毁过期/无效的碰撞接触。
     * 清理无效的Contact实例，核心逻辑分两种模式：
     *              1. 非增量模式（incremental=false）：
     *                 - 直接销毁所有未标记为latest的Contact
     *              2. 增量模式（incremental=true）：
     *                 - 跳过休眠/静态刚体的接触（标记shouldBeSkipped=true）
     *                 - 检查AABB是否重叠，不重叠则销毁
     *                 - 检查碰撞规则（shouldCollide），不满足则销毁
     *              销毁流程：
     *              - 从接触链表移除
     *              - 触发endContact回调（若处于touching状态）
     *              - 从刚体的ContactLink链表移除
     *              - 重置Contact所有属性
     *              - 回收至对象池（contactPool）
     *              - 减少有效接触计数（numContacts）
     */
    public destroyOutdatedContacts(): void {
        const RBS = RIGID_BODY_TYPE.STATIC;
        const incremental = this.broadPhase.incremental;
        let c: Nullable<Contact> = this.contactList;
        while (c) {
            let n: Nullable<Contact> = c.next;
            if (c.latest) {
                c.latest = c.shouldBeSkipped = false;
            } else {
                if (!incremental) {
                    const prev = c.prev, next = c.next;
                    if (prev) prev.next = next;
                    if (next) next.prev = prev;
                    if (c === this.contactList) this.contactList = this.contactList.next!;
                    if (c === this.contactListLast) this.contactListLast = this.contactListLast.prev!;
                    c.next = c.prev = null;
                    if (c.touching) {
                        let cc1 = c.shape1!.contactCallback, cc2 = c.shape2!.contactCallback;
                        if (cc1 === cc2) cc2 = null;
                        if (cc1) cc1.endContact(c);
                        if (cc2) cc2.endContact(c);
                    }
                    const prev1 = c.link1.prev, next1 = c.link1.next;
                    if (prev1) prev1.next = next1;
                    if (next1) next1.prev = prev1;
                    if (c.link1 === c.rigidBody1!.contactLinkList) c.rigidBody1!.contactLinkList = c.rigidBody1!.contactLinkList.next;
                    if (c.link1 === c.rigidBody1!.contactLinkListLast) c.rigidBody1!.contactLinkListLast = c.rigidBody1!.contactLinkListLast.prev;
                    c.link1.next = c.link1.prev = null;
                    const prev2 = c.link2.prev, next2 = c.link2.next;
                    if (prev2) prev2.next = next2;
                    if (next2) next2.prev = prev2;
                    if (c.link2 === c.rigidBody2!.contactLinkList) c.rigidBody2!.contactLinkList = c.rigidBody2!.contactLinkList.next;
                    if (c.link2 === c.rigidBody2!.contactLinkListLast) c.rigidBody2!.contactLinkListLast = c.rigidBody2!.contactLinkListLast.prev;
                    c.link2.next = c.link2.prev = null;
                    c.rigidBody1!.numContactLinks--;
                    c.rigidBody2!.numContactLinks--;
                    c.link1.other = c.link2.other = null;
                    c.link1.contact = c.link2.contact = null;
                    c.shape1 = c.shape2 = null;
                    c.rigidBody1 = c.rigidBody2 = null;
                    c.touching = false;
                    c.cachedDetectorData.clear();
                    c.manifold.clear();
                    c.detector = null;
                    const _this = c.contactConstraint;
                    _this.shape1 = _this.shape2 = null;
                    _this.rigidBody1 = _this.rigidBody2 = null;
                    _this.transform1 = _this.transform2 = null;
                    c.next = this.contactPool;
                    this.contactPool = c;
                    this.numContacts--;
                } else {
                    const s1 = c.shape1!, s2 = c.shape2!;
                    const r1 = s1.rigidBody!, r2 = s2.rigidBody!;
                    if (!(!r1.sleeping && r1.type !== RBS) && !(!r2.sleeping && r2.type !== RBS)) {
                        c.shouldBeSkipped = true;
                    } else {
                        const ab1 = s1.aabb.elements, ab2 = s2.aabb.elements;
                        const px1 = s1.proxy!.size, px2 = s2.proxy!.size;
                        if (!(px1[0] < px2[3] && px1[3] > px2[0] && px1[1] < px2[4] && px1[4] > px2[1] && px1[2] < px2[5] && px1[5] > px2[2]) ||
                            !this.shouldCollide(s1, s2)) {
                            const prev = c.prev, next = c.next;
                            if (prev) prev.next = next;
                            if (next) next.prev = prev;
                            if (c === this.contactList) this.contactList = this.contactList.next!;
                            if (c === this.contactListLast) this.contactListLast = this.contactListLast.prev!;
                            c.next = c.prev = null;
                            if (c.touching) {
                                let cc1 = c.shape1!.contactCallback, cc2 = c.shape2!.contactCallback;
                                if (cc1 === cc2) cc2 = null;
                                if (cc1) cc1.endContact(c);
                                if (cc2) cc2.endContact(c);
                            }
                            const prev1 = c.link1.prev, next1 = c.link1.next;
                            if (prev1) prev1.next = next1;
                            if (next1) next1.prev = prev1;
                            if (c.link1 === c.rigidBody1!.contactLinkList) c.rigidBody1!.contactLinkList = c.rigidBody1!.contactLinkList.next;
                            if (c.link1 === c.rigidBody1!.contactLinkListLast) c.rigidBody1!.contactLinkListLast = c.rigidBody1!.contactLinkListLast.prev;
                            c.link1.next = c.link1.prev = null;
                            const prev2 = c.link2.prev, next2 = c.link2.next;
                            if (prev2) prev2.next = next2;
                            if (next2) next2.prev = prev2;
                            if (c.link2 === c.rigidBody2!.contactLinkList) c.rigidBody2!.contactLinkList = c.rigidBody2!.contactLinkList.next;
                            if (c.link2 === c.rigidBody2!.contactLinkListLast) c.rigidBody2!.contactLinkListLast = c.rigidBody2!.contactLinkListLast.prev;
                            c.link2.next = c.link2.prev = null;
                            c.rigidBody1!.numContactLinks--;
                            c.rigidBody2!.numContactLinks--;
                            c.link1.other = c.link2.other = null;
                            c.link1.contact = c.link2.contact = null;
                            c.shape1 = c.shape2 = null;
                            c.rigidBody1 = c.rigidBody2 = null;
                            c.touching = false;
                            c.cachedDetectorData.clear();
                            c.manifold.clear();
                            c.detector = null;
                            const _this = c.contactConstraint;
                            _this.shape1 = _this.shape2 = null;
                            _this.rigidBody1 = _this.rigidBody2 = null;
                            _this.transform1 = _this.transform2 = null;
                            c.next = this.contactPool;
                            this.contactPool = c;
                            this.numContacts--;
                        } else {
                            c.shouldBeSkipped = !(ab1[0] < ab2[3] && ab1[3] > ab2[0] && ab1[1] < ab2[4] && ab1[4] > ab2[1] && ab1[2] < ab2[5] && ab1[5] > ab2[2]);
                        }
                    }
                }
            }
            c = n;
        }
    }

    /**
     * 判断两个形状是否应该发生碰撞。
     * 碰撞过滤规则（按优先级）：
     *              1. 同一刚体的形状不碰撞（r1 === r2）
     *              2. 两个非动态刚体不碰撞（均为静态/运动学刚体）
     *              3. 碰撞组/掩码不匹配则不碰撞（collisionGroup & collisionMask === 0）
     *              4. 关节禁止碰撞（joint.allowCollision=false）则不碰撞
     *              注：优先遍历关节链接少的刚体，优化查找性能
     * @param {Shape} s1 第一个碰撞形状 - 非空的Shape实例
     * @param {Shape} s2 第二个碰撞形状 - 非空的Shape实例
     * @returns {boolean} 是否允许碰撞：true=允许，false=禁止
     */
    public shouldCollide(s1: Shape, s2: Shape): boolean {
        const RBD = RIGID_BODY_TYPE.DYNAMIC;
        const r1 = s1.rigidBody!, r2 = s2.rigidBody!;
        if (r1 === r2) {
            return false;
        }
        if (r1.type !== RBD && r2.type !== RBD) {
            return false;
        }
        if ((s1.collisionGroup & s2.collisionMask) === 0 || (s2.collisionGroup & s1.collisionMask) === 0) {
            return false;
        }
        let jl: JointLink, other: RigidBody;
        if (r1.numJointLinks < r2.numJointLinks) {
            jl = r1.jointLinkList!;
            other = r2;
        } else {
            jl = r2.jointLinkList!;
            other = r1;
        }
        while (jl) {
            if (jl.other === other && !jl.joint.allowCollision) {
                return false;
            }
            jl = jl.next!;
        }
        return true;
    }

    /**
     * 更新所有碰撞接触（对外暴露的核心入口）。
     * 接触更新完整流程：
     *              1. 宽相位检测：collectPairs() 收集潜在碰撞对
     *              2. 创建接触：createContacts() 基于潜在碰撞对创建/更新Contact
     *              3. 销毁无效接触：destroyOutdatedContacts() 清理过期/无效Contact
     *              注：该方法是接触管理的主入口，建议每帧调用一次
     */
    public updateContacts(): void {
        this.broadPhase.collectPairs();
        this.createContacts();
        this.destroyOutdatedContacts();
    }

    /**
     * 触发所有接触的postSolve回调。
     * 遍历所有有效接触，对处于touching状态的Contact触发postSolve回调，
     *              用于处理碰撞求解后的自定义逻辑（如播放音效、扣血、触发特效等）
     */
    public postSolve(): void {
        let c: Nullable<Contact> = this.contactList;
        while (c) {
            const n: Nullable<Contact> = c.next;
            if (c.touching) {
                c.postSolve();
            }
            c = n;
        }
    }
}

export { ContactManager };