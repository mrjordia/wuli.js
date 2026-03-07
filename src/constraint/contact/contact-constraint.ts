import PgsContactConstraintSolver from "../solver/pgs-contact-constraint-solver";
import { CONSTANT, POSITION_CORRECTION_ALGORITHM } from '../../constant';
import Manifold from "./manifold";
import TimeStep from "../../common/time-step";
import ContactSolverInfo from "./contact-solver-info";
import Shape from "../../shape/shape";
import Transform from "../../common/transform";
import RigidBody from "../../rigid-body/rigid-body";
import { Nullable } from "../../common/nullable";

/**
 * 接触约束类。
 * 物理引擎中单个碰撞接触的约束求解核心类，负责构建速度/位置约束的求解数据、同步接触流形数据、判断接触状态，
 *              整合了PGS求解器、接触流形（Manifold）、刚体/形状关联数据，是约束求解的核心载体
 */
export default class ContactConstraint {
    /**
     * PGS接触约束求解器实例。
     * 基于投影梯度下降（PGS）算法的约束求解器，负责实际的速度/位置约束求解计算
     */
    public solver: PgsContactConstraintSolver;

    /**
     * 关联的接触流形。
     * 存储接触点、法向、穿透深度等核心数据，是约束构建的数据源
     */
    public manifold: Manifold;

    /**
     * 第一个碰撞刚体。
     * 约束关联的第一个刚体，提供速度、角速度、质量等物理属性，用于约束方程构建
     * @default null
     */
    public rigidBody1: Nullable<RigidBody>;

    /**
     * 第二个碰撞刚体。
     * 约束关联的第二个刚体，与rigidBody1配对，共同参与约束方程计算
     * @default null
     */
    public rigidBody2: Nullable<RigidBody>;

    /**
     * 第一个碰撞形状。
     * 关联的第一个几何形状，提供摩擦系数、恢复系数等接触属性
     * @default null
     */
    public shape1: Nullable<Shape>;

    /**
     * 第二个碰撞形状。
     * 关联的第二个几何形状，与shape1配对计算接触属性（如摩擦系数取几何平均）
     * @default null
     */
    public shape2: Nullable<Shape>;

    /**
     * 位置修正算法类型。
     * 标记使用的位置修正算法（如BAUMGARTE），决定位置约束的构建方式
     * @default null
     */
    public positionCorrectionAlgorithm: Nullable<POSITION_CORRECTION_ALGORITHM>;

    /**
     * 第一个刚体的变换矩阵。
     * 存储刚体1的位置、旋转信息，用于计算接触点的世界坐标和相对位置
     * @default null
     */
    public transform1: Nullable<Transform>;

    /**
     * 第二个刚体的变换矩阵。
     * 存储刚体2的变换信息，与transform1配合计算接触点的深度和位置
     * @default null
     */
    public transform2: Nullable<Transform>;

    /**
     * 构造函数：初始化接触约束实例。
     * 初始化时创建PGS求解器实例并关联当前约束，绑定接触流形
     * @param {Manifold} manifold 接触流形实例 - 必须传入有效的Manifold实例，作为约束数据的核心来源
     */
    constructor(manifold: Manifold) {
        this.solver = new PgsContactConstraintSolver(this);
        this.manifold = manifold;
    }

    /**
     * 构建速度约束求解数据（核心方法）。
     * 速度约束构建完整流程：
     *              1. 关联求解信息的刚体引用
     *              2. 计算接触属性（摩擦系数、恢复系数取几何平均）
     *              3. 遍历所有接触点，过滤无效点（depth < 0）：
     *                 - 无效点：标记disabled=true，重置冲量
     *                 - 有效点：构建法向/切向/副法向雅克比矩阵
     *              4. 计算法向相对速度（rvn），根据反弹阈值设置rhs：
     *                 - 速度低于阈值：rhs=0（无反弹）
     *                 - 速度高于阈值：rhs=-rvn*restitution（带反弹）
     *              5. 若使用BAUMGARTE算法，根据穿透深度调整rhs（位置误差反馈）
     *              6. 关联接触点冲量到求解行，支持热启动（warmStarted）
     *              注：雅克比矩阵包含线速度和角速度分量，是约束方程 J·v = rhs 的核心
     * @param {TimeStep} timeStep 时间步实例 - 包含帧时间、逆时间步等时间相关参数
     * @param {ContactSolverInfo} info 求解信息容器 - 用于存储构建后的约束求解数据
     */
    public getVelocitySolverInfo(timeStep: TimeStep, info: ContactSolverInfo): void {
        info.rigidBody1 = this.rigidBody1!;
        info.rigidBody2 = this.rigidBody2!;
        const normal = this.manifold.normal, tangent = this.manifold.tangent, binormal = this.manifold.binormal;
        const normalX = normal[0], normalY = normal[1], normalZ = normal[2];
        const tangentX = tangent[0], tangentY = tangent[1], tangentZ = tangent[2];
        const binormalX = binormal[0], binormalY = binormal[1], binormalZ = binormal[2];
        const friction = Math.sqrt(this.shape1!.friction * this.shape2!.friction);
        const restitution = Math.sqrt(this.shape1!.restitution * this.shape2!.restitution);
        const num = this.manifold.numPoints;
        info.numRows = 0;
        let _g = 0;
        while (_g < num) {
            const p = this.manifold.points[_g++];
            const relPos1 = p.relPos1, relPos2 = p.relPos2;
            if (p.depth < 0) {
                p.disabled = true;
                const _this = p.impulse.elements;
                _this[0] = _this[1] = _this[2] = _this[3] = _this[4] = _this[5] = _this[6] = 0;
                continue;
            } else {
                p.disabled = false;
            }
            const row = info.rows[info.numRows++];
            row.friction = friction;
            row.cfm = 0;
            let j = row.jacobianN.elements;
            j[0] = normalX; j[1] = normalY; j[2] = normalZ;
            j[3] = normalX; j[4] = normalY; j[5] = normalZ;
            j[6] = relPos1[1] * normalZ - relPos1[2] * normalY; j[7] = relPos1[2] * normalX - relPos1[0] * normalZ; j[8] = relPos1[0] * normalY - relPos1[1] * normalX;
            j[9] = relPos2[1] * normalZ - relPos2[2] * normalY; j[10] = relPos2[2] * normalX - relPos2[0] * normalZ; j[11] = relPos2[0] * normalY - relPos2[1] * normalX;
            j = row.jacobianT.elements;
            j[0] = tangentX; j[1] = tangentY; j[2] = tangentZ;
            j[3] = tangentX; j[4] = tangentY; j[5] = tangentZ;
            j[6] = relPos1[1] * tangentZ - relPos1[2] * tangentY; j[7] = relPos1[2] * tangentX - relPos1[0] * tangentZ; j[8] = relPos1[0] * tangentY - relPos1[1] * tangentX;
            j[9] = relPos2[1] * tangentZ - relPos2[2] * tangentY; j[10] = relPos2[2] * tangentX - relPos2[0] * tangentZ; j[11] = relPos2[0] * tangentY - relPos2[1] * tangentX;
            j = row.jacobianB.elements;
            j[0] = binormalX; j[1] = binormalY; j[2] = binormalZ;
            j[3] = binormalX; j[4] = binormalY; j[5] = binormalZ;
            j[6] = relPos1[1] * binormalZ - relPos1[2] * binormalY; j[7] = relPos1[2] * binormalX - relPos1[0] * binormalZ; j[8] = relPos1[0] * binormalY - relPos1[1] * binormalX;
            j[9] = relPos2[1] * binormalZ - relPos2[2] * binormalY; j[10] = relPos2[2] * binormalX - relPos2[0] * binormalZ; j[11] = relPos2[0] * binormalY - relPos2[1] * binormalX;
            const b1v = this.rigidBody1!.vel, b1a = this.rigidBody1!.angVel, b2v = this.rigidBody2!.vel, b2a = this.rigidBody2!.angVel;
            j = row.jacobianN.elements;
            const rvn = j[0] * b1v[0] + j[1] * b1v[1] + j[2] * b1v[2] + (j[6] * b1a[0] + j[7] * b1a[1] + j[8] * b1a[2]) -
                (j[3] * b2v[0] + j[4] * b2v[1] + j[5] * b2v[2] + (j[9] * b2a[0] + j[10] * b2a[1] + j[11] * b2a[2]));
            if (rvn < -CONSTANT.SETTING_CONTACT_ENABLE_BOUNCE_THRESHOLD && !p.warmStarted) {
                row.rhs = -rvn * restitution;
            } else {
                row.rhs = 0;
            }
            if (this.positionCorrectionAlgorithm === POSITION_CORRECTION_ALGORITHM.BAUMGARTE) {
                if (p.depth > CONSTANT.SETTING_LINEAR_SLOP) {
                    const minRhs = (p.depth - CONSTANT.SETTING_LINEAR_SLOP) * CONSTANT.SETTING_VELOCITY_BAUMGARTE * timeStep.invDt;
                    if (row.rhs < minRhs) {
                        row.rhs = minRhs;
                    }
                }
            }
            if (!p.warmStarted) {
                const _this = p.impulse.elements;
                _this[0] = _this[1] = _this[2] = _this[3] = _this[4] = _this[5] = _this[6] = 0;
            }
            row.impulse = p.impulse;
        }
    }

    /**
     * 构建位置约束求解数据。
     * 位置约束构建逻辑：
     *              1. 关联求解信息的刚体引用
     *              2. 遍历有效接触点（非disabled），仅构建法向雅克比矩阵（位置约束仅关注法向穿透）
     *              3. 计算rhs：穿透深度 - 线性容差（LINEAR_SLOP），确保rhs≥0
     *              4. 关联接触点冲量，用于位置修正的冲量累加
     *              注：位置约束仅处理法向穿透修正，不涉及切向/摩擦约束
     * @param {ContactSolverInfo} info 求解信息容器 - 用于存储构建后的位置约束数据
     */
    public getPositionSolverInfo(info: ContactSolverInfo): void {
        info.rigidBody1 = this.rigidBody1!;
        info.rigidBody2 = this.rigidBody2!;
        const normal = this.manifold.normal;
        const normalX = normal[0], normalY = normal[1], normalZ = normal[2];
        const num = this.manifold.numPoints;
        info.numRows = 0;
        let _g = 0;
        while (_g < num) {
            const p = this.manifold.points[_g++];
            let relPos1 = p.relPos1, relPos2 = p.relPos2;
            if (p.disabled) {
                continue;
            }
            const row = info.rows[info.numRows++];
            const j = row.jacobianN.elements;
            j[0] = normalX; j[1] = normalY; j[2] = normalZ;
            j[3] = normalX; j[4] = normalY; j[5] = normalZ;
            j[6] = relPos1[1] * normalZ - relPos1[2] * normalY; j[7] = relPos1[2] * normalX - relPos1[0] * normalZ; j[8] = relPos1[0] * normalY - relPos1[1] * normalX;
            j[9] = relPos2[1] * normalZ - relPos2[2] * normalY; j[10] = relPos2[2] * normalX - relPos2[0] * normalZ; j[11] = relPos2[0] * normalY - relPos2[1] * normalX;
            row.rhs = p.depth - CONSTANT.SETTING_LINEAR_SLOP;
            if (row.rhs < 0) {
                row.rhs = 0;
            }
            row.impulse = p.impulse;
        }
    }

    /**
     * 同步接触流形数据。
     * 根据刚体的最新变换（transform1/transform2），更新接触流形中所有接触点的穿透深度和世界坐标，
     *              确保流形数据与刚体当前位置同步，为约束求解提供最新的接触数据
     */
    public syncManifold(): void {
        this.manifold.updateDepthsAndPositions(this.transform1!, this.transform2!);
    }

    /**
     * 判断是否处于有效接触状态。
     * 遍历所有接触点，只要存在一个深度≥0的有效接触点，就判定为处于接触状态，
     *              是判断是否需要执行约束求解的核心依据
     * @returns {boolean} 是否有效接触：true=至少有一个接触点深度≥0，false=所有接触点无效
     */
    public isTouching(): boolean {
        let _g = 0, _g1 = this.manifold.numPoints;
        while (_g < _g1) if (this.manifold.points[_g++].depth >= 0) {
            return true;
        }
        return false;
    }
}

export { ContactConstraint };