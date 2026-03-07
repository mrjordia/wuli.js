import ContactLink from "./contact-link";
import CachedDetectorData from "../../collision-detector/cached-detector-data";
import DetectorResult from "../../collision-detector/detector-result";
import Manifold from "./manifold";
import ManifoldUpdater from "./manifold-updater";
import ContactConstraint from "./contact-constraint";
import { CONSTANT } from "../../constant";
import Shape from "../../shape/shape";
import RigidBody from "../../rigid-body/rigid-body";
import Detector from "../../collision-detector/detector";
import { Nullable } from "../../common/nullable";

/**
 * 碰撞接触类。
 * 物理引擎中两个刚体之间碰撞接触的核心管理类，整合了碰撞检测、接触流形（Manifold）、接触约束、回调事件等所有相关数据和逻辑，
 *              是连接碰撞检测与物理约束求解的关键桥梁
 */
export default class Contact {
    /**
     * 接触链表的下一个节点。
     * 用于将多个Contact实例组织成双向链表，方便批量管理（如场景中所有碰撞接触）
     * @default null
     */
    public next: Nullable<Contact>;

    /**
     * 接触链表的上一个节点。
     * 双向链表的前驱节点，与next配合实现链表的遍历和管理
     * @default null
     */
    public prev: Nullable<Contact>;

    /**
     * 第一个碰撞物体的接触链接信息。
     * 关联第一个刚体/形状的接触元数据，用于快速索引和管理
     */
    public link1 = new ContactLink();

    /**
     * 第二个碰撞物体的接触链接信息。
     * 关联第二个刚体/形状的接触元数据，与link1对称
     */
    public link2 = new ContactLink();

    /**
     * 第一个碰撞物体的形状。
     * 参与碰撞的第一个几何形状（如球体、盒子），必须非空才能进行碰撞检测
     * @default null
     */
    public shape1: Nullable<Shape>;

    /**
     * 第二个碰撞物体的形状。
     * 参与碰撞的第二个几何形状，与shape1配对进行碰撞检测
     * @default null
     */
    public shape2: Nullable<Shape>;

    /**
     * 第一个碰撞的刚体。
     * 关联的第一个物理刚体，包含质量、变换、速度等物理属性，用于后续约束求解
     * @default null
     */
    public rigidBody1: Nullable<RigidBody>;

    /**
     * 第二个碰撞的刚体。
     * 关联的第二个物理刚体，与rigidBody1配对进行碰撞响应计算
     * @default null
     */
    public rigidBody2: Nullable<RigidBody>;

    /**
     * 碰撞检测器实例。
     * 用于检测shape1和shape2是否碰撞的检测器，不同形状组合对应不同的检测器实现
     * @default null
     */
    public detector: Nullable<Detector>;

    /**
     * 碰撞检测器的缓存数据。
     * 存储检测器的中间计算结果，避免重复计算，提升碰撞检测性能
     */
    public cachedDetectorData = new CachedDetectorData();

    /**
     * 碰撞检测结果。
     * 存储每次碰撞检测的输出结果，包括接触点、法向、穿透深度等核心数据
     */
    public detectorResult = new DetectorResult();

    /**
     * 是否为最新的接触。
     * 标记该接触是否是当前帧最新检测到的，用于过滤无效/过期的接触
     * @default false
     */
    public latest = false;

    /**
     * 是否应跳过该接触。
     * 标记该接触是否需要跳过约束求解，true时将不参与物理响应计算
     * @default false
     */
    public shouldBeSkipped = false;

    /**
     * 碰撞接触流形。
     * 存储该碰撞接触的所有接触点、法向/切向基向量等核心数据，是约束求解的核心数据源
     */
    public manifold = new Manifold();

    /**
     * 流形更新器。
     * 用于更新manifold数据的工具类实例，负责接触点的添加、移除、热启动等逻辑
     */
    public updater: ManifoldUpdater;

    /**
     * 接触约束。
     * 基于manifold数据构建的物理约束，用于求解碰撞后的速度、位置修正
     */
    public contactConstraint: ContactConstraint;

    /**
     * 是否处于接触状态。
     * 标记两个物体是否实际接触（有有效接触点），true表示碰撞中，false表示已分离
     * @default false
     */
    public touching = false;

    /**
     * 构造函数：初始化碰撞接触实例。
     * 初始化时自动创建ManifoldUpdater和ContactConstraint实例，关联当前Contact的manifold
     */
    constructor() {
        this.updater = new ManifoldUpdater(this.manifold);
        this.contactConstraint = new ContactConstraint(this.manifold);
    }

    /**
     * 更新碰撞接触流形数据（核心方法）。
     * 完整的接触更新流程，包含以下核心步骤：
     *              1. 执行碰撞检测，获取最新的接触点、法向等数据
     *              2. 更新touching状态（是否有有效接触点）
     *              3. 构建接触流形的法向基向量
     *              4. 根据穿透深度选择位置修正算法
     *              5. 增量/全量更新接触流形数据
     *              6. 触发接触生命周期回调（beginContact/endContact/preSolve）
     *              注：若detector为null则直接返回，不执行任何更新
     */
    public updateManifold(): void {
        if (!this.detector) {
            return;
        }
        const ptouching = this.touching;
        const result = this.detectorResult;
        this.detector.detect(result, this.shape1!.geometry, this.shape2!.geometry, this.shape1!.transform, this.shape2!.transform, this.cachedDetectorData);
        this.touching = result.numPoints > 0;
        if (this.touching) {
            this.manifold.buildBasis(result.normal);
            if (result.getMaxDepth() > CONSTANT.SETTING_CONTACT_USE_ALTERNATIVE_POSITION_CORRECTION_ALGORITHM_DEPTH_THRESHOLD) {
                this.contactConstraint.positionCorrectionAlgorithm = CONSTANT.SETTING_ALTERNATIVE_CONTACT_POSITION_CORRECTION_ALGORITHM;
            } else {
                this.contactConstraint.positionCorrectionAlgorithm = CONSTANT.SETTING_DEFAULT_CONTACT_POSITION_CORRECTION_ALGORITHM;
            }
            if (result.incremental) {
                this.updater.incrementalUpdate(result, this.rigidBody1!.transform, this.rigidBody2!.transform);
            } else {
                this.updater.totalUpdate(result, this.rigidBody1!.transform, this.rigidBody2!.transform);
            }
        } else {
            this.manifold.clear();
        }
        if (this.touching && !ptouching) {
            const cc1 = this.shape1!.contactCallback;
            let cc2 = this.shape2!.contactCallback;
            if (cc1 === cc2) {
                cc2 = null;
            }
            if (cc1) {
                cc1.beginContact(this);
            }
            if (cc2) {
                cc2.beginContact(this);
            }
        }
        if (!this.touching && ptouching) {
            const cc1 = this.shape1!.contactCallback;
            let cc2 = this.shape2!.contactCallback;
            if (cc1 === cc2) {
                cc2 = null;
            }
            if (cc1) {
                cc1.endContact(this);
            }
            if (cc2) {
                cc2.endContact(this);
            }
        }
        if (this.touching) {
            const cc1 = this.shape1!.contactCallback;
            let cc2 = this.shape2!.contactCallback;
            if (cc1 === cc2) {
                cc2 = null;
            }
            if (cc1) {
                cc1.preSolve(this);
            }
            if (cc2) {
                cc2.preSolve(this);
            }
        }
    }

    /**
     * 碰撞约束求解后触发的回调方法。
     * 在接触约束求解完成后调用，触发两个碰撞形状的postSolve回调函数，
     *              用于处理碰撞后的自定义逻辑（如播放音效、扣血、触发特效等）
     *              注：会避免重复触发相同的回调（cc1和cc2相同时仅触发一次）
     */
    public postSolve(): void {
        const cc1 = this.shape1!.contactCallback;
        let cc2 = this.shape2!.contactCallback;
        if (cc1 === cc2) {
            cc2 = null;
        }
        if (cc1) {
            cc1.postSolve(this);
        }
        if (cc2) {
            cc2.postSolve(this);
        }
    }
}

export { Contact };