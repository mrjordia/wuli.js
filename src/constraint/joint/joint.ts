import { CONSTANT, CONSTRAINT_SOLVER_TYPE, JOINT_TYPE, POSITION_CORRECTION_ALGORITHM } from '../../constant';
import JointLink from "./joint-link";
import PgsJointConstraintSolver from "../solver/pgs-joint-constraint-solver";
import DirectJointConstraintSolver from "../solver/direct/direct-joint-constraint-solver";
import JointImpulse from "./joint-impulse";
import Mat3 from "../../common/mat3";
import Method from "../../common/method";
import { World } from '../../world';
import RigidBody from '../../rigid-body/rigid-body';
import ConstraintSolver from '../solver/constraint-solver';
import JointConfig from './joint-config';
import SpringDamper from './spring-damper';
import JointSolverInfoRow from './joint-solver-info-row';
import TimeStep from '../../common/time-step';
import TranslationalLimitMotor from './translational-limit-motor';
import RotationalLimitMotor from './rotational-limit-motor';
import JointSolverInfo from './joint-solver-info';
import { Nullable } from '../../common/nullable';

/**
 * 物理引擎核心关节类。
 * 所有关节类型（如球铰、铰链、滑块关节）的基类，封装关节的核心属性、约束求解逻辑、锚点/基向量同步、限位/驱动配置等能力，
 *              是连接两个刚体并施加运动约束的核心抽象，负责约束求解器的绑定、冲量计算、位置/速度约束的构建与执行
 */
export default class Joint {
    /**
     * 关联第一个刚体的链表节点。
     * 用于将当前关节挂载到rigidBody1的关节链表中，通过双向链表实现刚体关联关节的高效遍历
     */
    public link1: JointLink;

    /**
     * 关联第二个刚体的链表节点。
     * 用于将当前关节挂载到rigidBody2的关节链表中，与link1配合实现两个刚体的关节关联管理
     */
    public link2: JointLink;

    /**
     * 关节类型（只读）。
     * 标识当前关节的具体类型（如球铰、铰链、滑块等），构造时赋值且不可修改，用于约束求解时的类型区分
     */
    public readonly type: JOINT_TYPE;

    /**
     * 关节所属的物理世界。
     * 关联的物理世界实例，可为null（未添加到世界时）；用于关节销毁、约束求解时的全局参数访问
     */
    public world: Nullable<World>;

    /**
     * 关节关联的第一个刚体（只读）。
     * 关节约束的第一个目标刚体，由JointConfig初始化赋值且不可修改，是约束求解的核心刚体对象之一
     */
    public readonly rigidBody1: RigidBody;

    /**
     * 关节关联的第二个刚体（只读）。
     * 关节约束的第二个目标刚体，由JointConfig初始化赋值且不可修改；若为静态刚体则作为关节的固定端
     */
    public readonly rigidBody2: RigidBody;

    /**
     * 是否允许关联刚体碰撞。
     * 关节约束下两个刚体的碰撞开关，默认继承JointConfig的配置；禁用可避免锚点处的穿透和异常碰撞反馈
     */
    public allowCollision: boolean;

    /**
     * 关节断裂的力阈值。
     * 触发关节断裂的合外力平方阈值，默认0（永不因受力断裂）；当appliedForce的模长平方超过该值时，关节会被从世界中移除
     */
    public breakForce: number;

    /**
     * 关节断裂的力矩阈值。
     * 触发关节断裂的合外力矩平方阈值，默认0（永不因力矩断裂）；当appliedTorque的模长平方超过该值时，关节会被从世界中移除
     */
    public breakTorque: number;

    /**
     * 关节约束求解器实例。
     * 根据JointConfig的solverType初始化（迭代式Pgs/直接式Direct），负责具体的约束冲量求解；可为null（未初始化时）
     */
    public solver: Nullable<ConstraintSolver>;

    /**
     * 第一个刚体的本地锚点（3维向量）。
     * 相对于rigidBody1本地坐标系的关节锚点，长度为3的浮点数组，存储x/y/z坐标，由JointConfig初始化
     */
    public localAnchor1 = new Float64Array(3);

    /**
     * 第二个刚体的本地锚点（3维向量）。
     * 相对于rigidBody2本地坐标系的关节锚点，长度为3的浮点数组，存储x/y/z坐标，由JointConfig初始化
     */
    public localAnchor2 = new Float64Array(3);

    /**
     * 第一个刚体的相对锚点（3维向量）。
     * rigidBody1本地坐标系到锚点的相对位置，由localAnchor1经坐标变换得到，用于约束求解中的位置计算
     */
    public relativeAnchor1 = new Float64Array(3);

    /**
     * 第二个刚体的相对锚点（3维向量）。
     * rigidBody2本地坐标系到锚点的相对位置，由localAnchor2经坐标变换得到，用于约束求解中的位置计算
     */
    public relativeAnchor2 = new Float64Array(3);

    /**
     * 第一个刚体锚点的世界坐标（3维向量）。
     * rigidBody1锚点在世界坐标系中的位置，由relativeAnchor1经坐标变换得到，实时同步刚体运动
     */
    public anchor1 = new Float64Array(3);

    /**
     * 第二个刚体锚点的世界坐标（3维向量）。
     * rigidBody2锚点在世界坐标系中的位置，由relativeAnchor2经坐标变换得到，实时同步刚体运动
     */
    public anchor2 = new Float64Array(3);

    /**
     * 第一个刚体的本地基向量矩阵（9维数组）。
     * 相对于rigidBody1本地坐标系的3x3基向量矩阵，存储X/Y/Z轴方向，用于约束的方向计算
     */
    public localBasis1 = new Float64Array(9);

    /**
     * 第一个刚体基向量矩阵的世界坐标（9维数组）。
     * rigidBody1本地基向量矩阵变换到世界坐标系的结果，实时同步刚体旋转
     */
    public basis1 = new Float64Array(9);

    /**
     * 第二个刚体的本地基向量矩阵（9维数组）。
     * 相对于rigidBody2本地坐标系的3x3基向量矩阵，存储X/Y/Z轴方向，用于约束的方向计算
     */
    public localBasis2 = new Float64Array(9);

    /**
     * 第二个刚体基向量矩阵的世界坐标（9维数组）。
     * rigidBody2本地基向量矩阵变换到世界坐标系的结果，实时同步刚体旋转
     */
    public basis2 = new Float64Array(9);

    /**
     * 关节当前承受的合外力（3维向量）。
     * 存储关节约束施加到刚体上的合外力，用于判断是否触发breakForce断裂阈值
     */
    public appliedForce = new Float64Array(3);

    /**
     * 关节当前承受的合外力矩（3维向量）。
     * 存储关节约束施加到刚体上的合外力矩，用于判断是否触发breakTorque断裂阈值
     */
    public appliedTorque = new Float64Array(3);

    /**
     * 物理世界中关节链表的前驱节点。
     * 用于构建世界级的关节双向链表，高效遍历所有关节实例
     */
    public prev: Nullable<Joint>;

    /**
     * 物理世界中关节链表的后继节点。
     * 用于构建世界级的关节双向链表，高效遍历所有关节实例
     */
    public next: Nullable<Joint>;

    /**
     * 关节约束冲量数组。
     * 长度为SETTING_MAX_JACOBIAN_ROWS的冲量数组，每个元素对应单行约束的速度/驱动/位置冲量，预分配内存提升求解效率
     */
    public impulses: Array<JointImpulse>;

    /**
     * 位置修正算法类型。
     * 指定关节位置误差的修正算法，默认值为SETTING_DEFAULT_JOINT_POSITION_CORRECTION_ALGORITHM，
     *              可选Baumgarte、分离冲量等算法，用于消除关节穿透
     */
    public positionCorrectionAlgorithm = CONSTANT.SETTING_DEFAULT_JOINT_POSITION_CORRECTION_ALGORITHM;

    protected _tv = new Float64Array(4);
    protected _tm = new Float64Array(9);
    private _tva = new Float64Array(4);
    private _tvb = new Float64Array(4);
    private _tvc = new Float64Array(4);
    private _tvd = new Float64Array(4);

    /**
     * 构造函数：初始化关节基类。
     * 核心初始化逻辑：
     *              1. 创建关联两个刚体的JointLink节点；
     *              2. 赋值关节类型、关联刚体、碰撞开关、断裂阈值等基础参数；
     *              3. 根据solverType初始化约束求解器（Pgs/Direct）；
     *              4. 拷贝本地锚点数据，预分配冲量数组并初始化所有JointImpulse实例；
     * @param {JointConfig} config 关节配置实例，包含刚体关联、锚点、求解器类型等核心参数
     * @param {JOINT_TYPE} type 关节具体类型（如球铰、铰链）
     */
    constructor(config: JointConfig, type: JOINT_TYPE) {
        this.link1 = new JointLink(this);
        this.link2 = new JointLink(this);
        this.type = type;
        this.rigidBody1 = config.rigidBody1;
        this.rigidBody2 = config.rigidBody2;
        this.allowCollision = config.allowCollision;
        this.breakForce = config.breakForce;
        this.breakTorque = config.breakTorque;
        switch (config.solverType) {
            case CONSTRAINT_SOLVER_TYPE.ITERATIVE:
                this.solver = new PgsJointConstraintSolver(this);
                break;
            case CONSTRAINT_SOLVER_TYPE.DIRECT:
                this.solver = new DirectJointConstraintSolver(this);
                break;
        }
        Method.copyElements(config.localAnchor1.elements, this.localAnchor1);
        Method.copyElements(config.localAnchor2.elements, this.localAnchor2);
        let _g1 = CONSTANT.SETTING_MAX_JACOBIAN_ROWS;
        this.impulses = new Array(_g1);
        let _g = 0;
        while (_g < _g1) this.impulses[_g++] = new JointImpulse();
    }

    /**
     * 基于X轴构建本地基向量矩阵。
     * 以X轴为基准构建rigidBody1/rigidBody2的本地基向量矩阵，自动计算Y/Z轴方向，
     *              保证基向量的正交性，用于依赖单轴约束的关节（如铰链关节）
     */
    public buildLocalBasesFromX(): void {
        const b1 = this.localBasis1, b2 = this.localBasis2;
        const tv = this._tv, tm = this._tm;
        this._setAxis(b1, 0, 1, 0, 0);
        this._setAxis(b2, 0, 1, 0, 0);
        Method.setRotFromTwoVec3(b1[0], b1[1], b1[2], b2[0], b2[1], b2[2], tv, tm);
        Method.vecToQuat(b1[0], b1[1], b1[2], tv);
        Method.setElements(b1, 3, tv[0], tv[1], tv[2]);
        Method.setElements(b1, 6, b1[1] * b1[5] - b1[2] * b1[4], b1[2] * b1[3] - b1[0] * b1[5], b1[0] * b1[4] - b1[1] * b1[3]);
        Method.multiplyBasis(tm, b1, b2);
    }

    /**
     * 基于X/Y轴构建本地基向量矩阵。
     * 以X/Y轴为基准构建rigidBody1/rigidBody2的本地基向量矩阵，通过叉乘计算Z轴方向，
     *              保证基向量的正交归一性，用于依赖双轴约束的关节（如滑块关节）
     */
    public buildLocalBasesFromXY(): void {
        const bs1 = this.localBasis1, bs2 = this.localBasis2;
        this._setAxis(bs1, 0, 1, 0, 0);
        this._setAxis(bs2, 0, 1, 0, 0);
        Method.crossVectors(bs1[0], bs1[1], bs1[2], bs1[3], bs1[4], bs1[5], bs1, 6);
        Method.crossVectors(bs2[0], bs2[1], bs2[2], bs2[3], bs2[4], bs2[5], bs2, 6);
        this._setAxisYZ(bs1);
        this._setAxisYZ(bs2);
    }

    /**
     * 基于刚体1的X轴和刚体2的Z轴构建本地基向量矩阵。
     * 混合两个刚体的不同轴构建基向量矩阵，解决跨刚体的约束方向对齐问题，
     *              用于万向节、球铰等需要多轴耦合约束的关节
     */
    public buildLocalBasesFromX1Z2(): void {
        const bs1 = this.localBasis1, bs2 = this.localBasis2;
        this._setAxis(bs1, 0, 1, 0, 0);
        this._setAxis(bs2, 6, 0, 0, 1);
        const tf1 = this.rigidBody1.transform.elements;
        const tf2 = this.rigidBody2.transform.elements;
        const wX1 = this._tv, wZ2 = this._tva, wY = this._tvb, wZ1 = this._tvc, wX2 = this._tvd;
        Method.transformVec3(tf1, bs1, 1, wX1, 0);
        Method.transformVec3(tf2, bs2, 1, wZ2, 6);
        Method.crossVectors(wZ2[0], wZ2[1], wZ2[2], wX1[0], wX1[1], wX1[2], wY, 0);
        if (wY[0] * wY[0] + wY[1] * wY[1] + wY[2] * wY[2] === 0) {
            Method.vecToQuat(wX1[0], wX1[1], wX1[2], wY);
        }
        Method.crossVectors(wX1[0], wX1[1], wX1[2], wY[0], wY[1], wY[2], wZ1, 0);
        Method.crossVectors(wY[0], wY[1], wY[2], wZ2[0], wZ2[1], wZ2[2], wX2, 0);
        Method.inverseTransformVec3(tf1, wX1, 1, bs1, 0, 0);
        Method.inverseTransformVec3(tf1, wY, 1, bs1, 0, 3);
        Method.inverseTransformVec3(tf1, wZ1, 1, bs1, 0, 6);
        Method.inverseTransformVec3(tf2, wX2, 1, bs2, 0, 0);
        Method.inverseTransformVec3(tf2, wY, 1, bs2, 0, 3);
        Method.inverseTransformVec3(tf2, wZ2, 1, bs2, 0, 6);
    }

    /**
     * 基于刚体1的XY轴和刚体2的X轴构建本地基向量矩阵。
     * 适配非正交轴约束场景的基向量构建方法，保证约束方向的准确性，
     *              用于自定义关节或复杂耦合约束
     */
    public buildLocalBasesFromXY1X2(): void {
        const bs1 = this.localBasis1, bs2 = this.localBasis2;
        const tv = this._tv, tm = this._tm;
        this._setAxis(bs1, 0, 1, 0, 0);
        Method.crossVectors(bs1[0], bs1[1], bs1[2], bs1[3], bs1[4], bs1[5], bs1, 6);
        this._setAxisYZ(bs1);
        Method.setRotFromTwoVec3(bs1[0], bs1[1], bs1[2], bs2[0], bs2[1], bs2[2], tv, tm);
        Method.multiplyBasis(tm, bs1, bs2);
    }

    /**
     * 配置平移约束求解器单行信息。
     * 核心逻辑：
     *              1. 计算弹簧阻尼器的CFM/ERP参数；
     *              2. 配置驱动速度/最大冲量；
     *              3. 根据位移误差和限位配置，设置约束行的冲量范围、CFM、RHS等核心参数；
     * @param {JointSolverInfoRow} row 待配置的约束行实例
     * @param {number} diff 平移位移误差（当前值与目标值的差值）
     * @param {TranslationalLimitMotor} lm 平移限位驱动配置
     * @param {number} mass 约束行的有效质量
     * @param {SpringDamper} sd 弹簧阻尼器配置
     * @param {Nullable<TimeStep>} timeStep 时间步信息（可为null）
     * @param {boolean} isPositionPart 是否为位置约束阶段
     */
    public setSolverInfoRowLinear(row: JointSolverInfoRow, diff: number, lm: TranslationalLimitMotor, mass: number, sd: SpringDamper, timeStep: Nullable<TimeStep>, isPositionPart: boolean): void {
        const SLS = CONSTANT.SETTING_LINEAR_SLOP;
        const SDR = CONSTANT.SETTING_MIN_SPRING_DAMPER_DAMPING_RATIO;
        let tv = this._tv;
        this._setMotor(isPositionPart, sd, row, timeStep, lm, SLS, SDR, lm.motorForce, tv);
        let cfmFactor = tv[0];
        let erp = tv[1];
        let slop = tv[2];
        let lower = lm.lowerLimit;
        let upper = lm.upperLimit;
        this._setRowImpulseInfo(row, lm, diff, slop, cfmFactor, erp, mass, lower, upper);
    }

    /**
     * 配置旋转约束求解器单行信息。
     * 核心逻辑：
     *              1. 对角度误差进行归一化处理（-π~π）；
     *              2. 计算弹簧阻尼器的CFM/ERP参数；
     *              3. 配置驱动速度/最大冲量；
     *              4. 根据角度误差和限位配置，设置约束行的冲量范围、CFM、RHS等核心参数；
     * @param {JointSolverInfoRow} row 待配置的约束行实例
     * @param {number} diff 旋转角度误差（当前值与目标值的差值）
     * @param {RotationalLimitMotor} lm 旋转限位驱动配置
     * @param {number} mass 约束行的有效质量
     * @param {SpringDamper} sd 弹簧阻尼器配置
     * @param {Nullable<TimeStep>} timeStep 时间步信息（可为null）
     * @param {boolean} isPositionPart 是否为位置约束阶段
     */
    public setSolverInfoRowAngular(row: JointSolverInfoRow, diff: number, lm: RotationalLimitMotor, mass: number, sd: SpringDamper, timeStep: Nullable<TimeStep>, isPositionPart: boolean): void {
        const SAS = CONSTANT.SETTING_ANGULAR_SLOP;
        const SDR = CONSTANT.SETTING_MIN_SPRING_DAMPER_DAMPING_RATIO;
        let tv = this._tv;
        this._setMotor(isPositionPart, sd, row, timeStep, lm, SAS, SDR, lm.motorTorque, tv);
        let cfmFactor = tv[0];
        let erp = tv[1];
        let slop = tv[2];
        let lower = lm.lowerLimit;
        let upper = lm.upperLimit;
        let mid = (lower + upper) * 0.5;
        diff -= mid;
        diff = ((diff + 3.14159265358979) % 6.28318530717958 + 6.28318530717958) % 6.28318530717958 - 3.14159265358979;
        diff += mid;
        this._setRowImpulseInfo(row, lm, diff, slop, cfmFactor, erp, mass, lower, upper);
    }

    /**
     * 计算位置修正算法的ERP（Error Reduction Parameter）参数。
     * ERP用于控制约束误差的修正速度：
     *              1. 位置约束阶段返回1（全量修正）；
     *              2. 速度约束阶段且使用Baumgarte算法时，返回timeStep.invDt * SETTING_VELOCITY_BAUMGARTE；
     *              3. 其他场景返回0（不修正）；
     * @param {Nullable<TimeStep>} timeStep 时间步信息（可为null）
     * @param {boolean} isPositionPart 是否为位置约束阶段
     * @returns {number} ERP参数值（0~1）
     */
    public getErp(timeStep: Nullable<TimeStep>, isPositionPart: boolean): number {
        const PCB = POSITION_CORRECTION_ALGORITHM.BAUMGARTE;
        const SVB = CONSTANT.SETTING_VELOCITY_BAUMGARTE;
        if (isPositionPart) {
            return 1;
        } else if (this.positionCorrectionAlgorithm === PCB && timeStep) {
            return timeStep.invDt * SVB;
        } else {
            return 0;
        }
    }

    /**
     * 计算指定轴的有效转动惯量。
     * 结合两个刚体的逆惯性张量、相对锚点位置计算有效转动惯量，是旋转约束冲量计算的核心参数
     * @param {number} axisX 旋转轴X分量
     * @param {number} axisY 旋转轴Y分量
     * @param {number} axisZ 旋转轴Z分量
     * @returns {number} 有效转动惯量（0表示无转动惯量）
     */
    public computeEffectiveInertiaMoment(axisX: number, axisY: number, axisZ: number): number {
        const ii1 = this.rigidBody1.invInertia, ii2 = this.rigidBody2.invInertia;
        const ra1 = this.relativeAnchor1, ra2 = this.relativeAnchor2;
        const ia1 = this._tv, ia2 = this._tva;
        Method.rotateVecTo(axisX, axisY, axisZ, ii1, ia1);
        Method.rotateVecTo(axisX, axisY, axisZ, ii2, ia2);
        const invI1 = Method.inverseInertia(axisX, axisY, axisZ, ia1, ra1, this.rigidBody1.invMass, this.rigidBody1.mass);
        const invI2 = Method.inverseInertia(axisX, axisY, axisZ, ia2, ra2, this.rigidBody2.invMass, this.rigidBody2.mass);
        return (invI1 + invI2 === 0) ? 0 : 1 / (invI1 + invI2);
    }

    /**
     * 计算两个指定轴的有效转动惯量（双轴场景）。
     * 适配双轴耦合约束场景的有效转动惯量计算，用于万向节、球铰等多轴旋转关节
     * @param {number} axis1X 第一个旋转轴X分量
     * @param {number} axis1Y 第一个旋转轴Y分量
     * @param {number} axis1Z 第一个旋转轴Z分量
     * @param {number} axis2X 第二个旋转轴X分量
     * @param {number} axis2Y 第二个旋转轴Y分量
     * @param {number} axis2Z 第二个旋转轴Z分量
     * @returns {number} 有效转动惯量（0表示无转动惯量）
     */
    public computeEffectiveInertiaMoment2(axis1X: number, axis1Y: number, axis1Z: number, axis2X: number, axis2Y: number, axis2Z: number): number {
        const ii1 = this.rigidBody1.invInertia, ii2 = this.rigidBody2.invInertia;
        const ra1 = this.relativeAnchor1, ra2 = this.relativeAnchor2;
        const ia1 = this._tv, ia2 = this._tva;
        Method.rotateVecTo(axis1X, axis1Y, axis1Z, ii1, ia1);
        Method.rotateVecTo(axis2X, axis2Y, axis2Z, ii2, ia2);
        const invI1 = Method.inverseInertia(axis1X, axis1Y, axis1Z, ia1, ra1, this.rigidBody1.invMass, this.rigidBody1.mass);
        const invI2 = Method.inverseInertia(axis2X, axis2Y, axis2Z, ia2, ra2, this.rigidBody2.invMass, this.rigidBody2.mass);
        return (invI1 + invI2 === 0) ? 0 : 1 / (invI1 + invI2);
    }

    /**
     * 同步锚点和基向量的世界坐标。
     * 核心同步逻辑：
     *              1. 将本地锚点转换为刚体相对锚点；
     *              2. 将相对锚点转换为世界坐标；
     *              3. 将本地基向量矩阵转换为世界坐标；
     *              保证锚点和基向量与刚体运动实时同步，是约束求解的前置必要步骤
     */
    public syncAnchors(): void {
        const bs1 = this.localBasis1, la1 = this.localAnchor1, ra1 = this.relativeAnchor1, a1 = this.anchor1, b1 = this.basis1;
        const bs2 = this.localBasis2, la2 = this.localAnchor2, ra2 = this.relativeAnchor2, a2 = this.anchor2, b2 = this.basis2;
        const tf1 = this.rigidBody1.transform.elements, tf2 = this.rigidBody2.transform.elements;
        Method.transformVec3(tf1, la1, 1, ra1);
        Method.transformVec3(tf2, la2, 1, ra2);
        Method.transformVec3(tf1, ra1, 2, a1);
        Method.transformVec3(tf2, ra2, 2, a2);
        Method.transformM3(tf1, bs1, b1);
        Method.transformM3(tf2, bs2, b2);
    }

    /**
     * 构建速度约束求解器信息。
     * 初始化速度约束求解的基础信息（关联刚体、约束行数量），子类需重写此方法补充具体的约束行配置
     * @param {TimeStep} timeStep 时间步信息
     * @param {JointSolverInfo} info 待填充的求解器信息实例
     */
    public getVelocitySolverInfo(timeStep: TimeStep, info: JointSolverInfo): void {
        info.rigidBody1 = this.rigidBody1;
        info.rigidBody2 = this.rigidBody2;
        info.numRows = 0;
    }

    /**
     * 构建位置约束求解器信息。
     * 初始化位置约束求解的基础信息（关联刚体、约束行数量），子类需重写此方法补充具体的约束行配置
     * @param {JointSolverInfo} info 待填充的求解器信息实例
     */
    public getPositionSolverInfo(info: JointSolverInfo): void {
        info.rigidBody1 = this.rigidBody1;
        info.rigidBody2 = this.rigidBody2;
        info.numRows = 0;
    }

    /**
     * 检查关节是否满足断裂条件。
     * 核心逻辑：
     *              1. 计算合外力/力矩的平方值；
     *              2. 若超过breakForce/breakTorque阈值，将关节从物理世界中移除；
     *              保证关节在受力/力矩过载时自动断裂，提升物理仿真的真实感
     */
    public checkDestruction(): void {
        const at = this.appliedTorque, af = this.appliedForce, bf = this.breakForce, bt = this.breakTorque;
        const torqueSq = at[0] * at[0] + at[1] * at[1] + at[2] * at[2];
        if (bf > 0 && af[0] * af[0] + af[1] * af[1] + af[2] * af[2] > bf * bf) {
            this.world!.removeJoint(this);
            return;
        }
        if (bt > 0 && torqueSq > bt * bt) {
            this.world!.removeJoint(this);
        }
    }

    /**
     * 获取关节类型。
     * 只读访问关节类型，用于约束求解器区分不同关节的处理逻辑
     * @returns {JOINT_TYPE} 关节具体类型（如球铰、铰链）
     */
    public getType(): JOINT_TYPE {
        return this.type;
    }

    /**
     * 获取第一个刚体锚点的世界坐标。
     * 将anchor1的世界坐标赋值到传入的对象中，避免创建新数组，提升性能
     * @param {object} anchor 输出对象（包含x/y/z属性）
     */
    public getAnchor1To(anchor: { x: number, y: number, z: number }): void {
        Method.setXYZ(anchor, this.anchor1[0], this.anchor1[1], this.anchor1[2]);
    }

    /**
     * 获取第二个刚体锚点的世界坐标。
     * 将anchor2的世界坐标赋值到传入的对象中，避免创建新数组，提升性能
     * @param {object} anchor 输出对象（包含x/y/z属性）
     */
    public getAnchor2To(anchor: { x: number, y: number, z: number }): void {
        Method.setXYZ(anchor, this.anchor2[0], this.anchor2[1], this.anchor2[2]);
    }

    /**
     * 获取第一个刚体的本地锚点坐标。
     * 将localAnchor1的坐标赋值到传入的对象中，用于外部访问本地锚点配置
     * @param {object} localAnchor 输出对象（包含x/y/z属性）
     */
    public getLocalAnchor1To(localAnchor: { x: number, y: number, z: number }): void {
        Method.setXYZ(localAnchor, this.localAnchor1[0], this.localAnchor1[1], this.localAnchor1[2]);
    }

    /**
     * 获取第二个刚体的本地锚点坐标。
     * 将localAnchor2的坐标赋值到传入的对象中，用于外部访问本地锚点配置
     * @param {object} localAnchor 输出对象（包含x/y/z属性）
     */
    public getLocalAnchor2To(localAnchor: { x: number, y: number, z: number }): void {
        Method.setXYZ(localAnchor, this.localAnchor2[0], this.localAnchor2[1], this.localAnchor2[2]);
    }

    /**
     * 获取第一个刚体基向量矩阵的世界坐标。
     * 将basis1的世界坐标矩阵赋值到传入的Mat3对象中，用于外部访问基向量配置
     * @param {Mat3} basis 输出Mat3矩阵实例
     */
    public getBasis1To(basis: Mat3): void {
        const b = this.basis1;
        Method.setM3X3(basis.elements, b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7], b[8]);
    }

    /**
     * 获取第二个刚体基向量矩阵的世界坐标。
     * 将basis2的世界坐标矩阵赋值到传入的Mat3对象中，用于外部访问基向量配置
     * @param {Mat3} basis 输出Mat3矩阵实例
     */
    public getBasis2To(basis: Mat3): void {
        const b = this.basis2;
        Method.setM3X3(basis.elements, b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7], b[8]);
    }

    /**
     * 获取关节当前承受的合外力。
     * 将appliedForce的合外力值赋值到传入的对象中，用于外部监测关节受力状态
     * @param {object} appliedForce 输出对象（包含x/y/z属性）
     */
    public getAppliedForceTo(appliedForce: { x: number, y: number, z: number }): void {
        Method.setXYZ(appliedForce, this.appliedForce[0], this.appliedForce[1], this.appliedForce[2]);
    }

    /**
     * 获取关节当前承受的合外力矩。
     * 将appliedTorque的合外力矩值赋值到传入的对象中，用于外部监测关节受力矩状态
     * @param {object} appliedTorque 输出对象（包含x/y/z属性）
     */
    public getAppliedTorqueTo(appliedTorque: { x: number, y: number, z: number }): void {
        Method.setXYZ(appliedTorque, this.appliedTorque[0], this.appliedTorque[1], this.appliedTorque[2]);
    }

    /**
     * 重置约束行信息。
     * 清空约束行的雅可比矩阵、RHS、CFM、冲量限制等参数，绑定冲量实例，
     *              为约束求解的新一轮迭代做准备
     * @param {JointSolverInfoRow} row 待重置的约束行实例
     * @param {JointImpulse} impulse 关联的冲量实例
     */
    protected resetRow(row: JointSolverInfoRow, impulse: JointImpulse) {
        Method.fillValue(row.jacobian.elements, 0, 11, 0);
        row.rhs = 0;
        row.cfm = 0;
        row.minImpulse = 0;
        row.maxImpulse = 0;
        row.motorSpeed = 0;
        row.motorMaxImpulse = 0;
        row.impulse = null;
        row.impulse = impulse;
    }

    /**
     * 标准化Y/Z轴基向量（内部方法）。
     * 保证Y/Z轴的正交归一性，若Z轴长度为0则重新计算，避免零向量导致的约束求解异常
     * @param {Float64Array} els 基向量矩阵数组（9维）
     */
    private _setAxisYZ(els: Float64Array): void {
        const tv = this._tv;
        const l = els[6] * els[6] + els[7] * els[7] + els[8] * els[8];
        if (l === 0) {
            Method.vecToQuat(els[0], els[1], els[2], tv);
            Method.setElements(els, 3, tv[0], tv[1], tv[2]);
            Method.crossVectors(els[0], els[1], els[2], els[3], els[4], els[5], els, 6);
        } else {
            Method.scaleArray(els, l > 0 ? 1 / Math.sqrt(l) : l, els, 6, 6, 3);
            Method.crossVectors(els[6], els[7], els[8], els[0], els[1], els[2], els, 3);
        }
    }

    /**
     * 标准化指定轴基向量（内部方法）。
     * 若指定轴向量长度为0则使用默认值，否则归一化，保证基向量的长度为1
     * @param {Float64Array} els 基向量矩阵数组（9维）
     * @param {number} start 轴起始索引（0=X轴，3=Y轴，6=Z轴）
     * @param {number} x 默认X分量（默认1）
     * @param {number} y 默认Y分量（默认0）
     * @param {number} z 默认Z分量（默认0）
     */
    private _setAxis(els: Float64Array, start = 0, x = 1, y = 0, z = 0): void {
        const l = els[start] * els[start] + els[start + 1] * els[start + 1] + els[start + 2] * els[start + 2];
        if (l === 0) {
            Method.setElements(els, start, x, y, z);
        } else {
            Method.scaleArray(els, l > 0 ? 1 / Math.sqrt(l) : l, els, start, start, 3);
        }
    }

    /**
     * 配置约束行的驱动参数（内部方法）。
     * 核心逻辑：
     *              1. 位置约束阶段直接使用默认参数；
     *              2. 速度约束阶段根据弹簧阻尼器配置计算CFM/ERP；
     *              3. 配置驱动速度和最大冲量（仅当驱动值>0时生效）；
     * @param {boolean} isPositionPart 是否为位置约束阶段
     * @param {SpringDamper} sd 弹簧阻尼器配置
     * @param {JointSolverInfoRow} row 约束行实例
     * @param {Nullable<TimeStep>} timeStep 时间步信息
     * @param {TranslationalLimitMotor | RotationalLimitMotor} lm 限位驱动配置
     * @param {number} slopDefault 默认松弛值（线性/角度）
     * @param {number} zetaDefault 默认阻尼比下限
     * @param {number} value 驱动最大力/力矩
     * @param {Float64Array} out 输出数组（存储cfmFactor/erp/slop）
     */
    private _setMotor(isPositionPart: boolean, sd: SpringDamper, row: JointSolverInfoRow, timeStep: Nullable<TimeStep>, lm: TranslationalLimitMotor | RotationalLimitMotor, slopDefault: number, zetaDefault: number, value: number, out: Float64Array): void {
        let cfmFactor: number, erp: number;
        let slop = slopDefault;
        if (isPositionPart) {
            cfmFactor = 0;
            erp = 1;
        } else if (timeStep) {
            if (sd.frequency > 0) {
                slop = 0;
                const omega = 6.28318530717958 * sd.frequency;
                let zeta = sd.dampingRatio;
                if (zeta < zetaDefault) {
                    zeta = zetaDefault;
                }
                const h = timeStep.dt;
                const c = 2 * zeta * omega;
                const k = omega * omega;
                if (sd.useSymplecticEuler) {
                    cfmFactor = 1 / (h * c);
                    erp = k / c;
                } else {
                    cfmFactor = 1 / (h * (h * k + c));
                    erp = k / (h * k + c);
                }
            } else {
                cfmFactor = 0;
                erp = this.getErp(timeStep, false);
            }
            if (value > 0) {
                row.motorSpeed = lm.motorSpeed;
                row.motorMaxImpulse = value * timeStep.dt;
            } else {
                row.motorSpeed = 0;
                row.motorMaxImpulse = 0;
            }
        } else {
            cfmFactor = 0;
            erp = 1;
        }
        out[0] = cfmFactor;
        out[1] = erp;
        out[2] = slop;
    }

    /**
     * 配置约束行的冲量信息（内部方法）。
     * 核心逻辑：
     *              1. 根据限位配置计算冲量范围（min/maxImpulse）和误差值；
     *              2. 计算约束行的CFM和RHS参数；
     *              是约束求解的核心参数配置步骤
     * @param {JointSolverInfoRow} row 约束行实例
     * @param {TranslationalLimitMotor | RotationalLimitMotor} lm 限位驱动配置
     * @param {number} diff 位移/角度误差
     * @param {number} slop 松弛值
     * @param {number} cfmFactor CFM系数
     * @param {number} erp ERP系数
     * @param {number} mass 有效质量
     * @param {number} lower 限位下限
     * @param {number} upper 限位上限
     */
    private _setRowImpulseInfo(row: JointSolverInfoRow, lm: TranslationalLimitMotor | RotationalLimitMotor, diff: number, slop: number, cfmFactor: number, erp: number, mass: number, lower: number, upper: number): void {
        let minImp: number, maxImp: number, error: number;
        if (lower > upper) {
            minImp = maxImp = error = 0;
        } else if (lower === upper) {
            minImp = -1e65536;
            maxImp = 1e65536;
            error = diff - lower;
        } else if (diff < lower) {
            minImp = -1e65536;
            maxImp = 0;
            error = diff - lower + slop;
            if (error > 0) {
                error = 0;
            }
        } else if (diff > upper) {
            minImp = 0;
            maxImp = 1e65536;
            error = diff - upper - slop;
            if (error < 0) {
                error = 0;
            }
        } else {
            minImp = maxImp = error = 0;
        }
        row.minImpulse = minImp;
        row.maxImpulse = maxImp;
        row.cfm = cfmFactor * (mass === 0 ? 0 : 1 / mass);
        row.rhs = error * erp;
    }
}

export { Joint };