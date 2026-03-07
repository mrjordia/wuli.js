import JointSolverInfoRow from "./joint-solver-info-row";
import { CONSTANT } from '../../constant';
import RigidBody from "../../rigid-body/rigid-body";
import { Nullable } from "../../common/nullable";

/**
 * 关节求解器核心信息容器类。
 * 物理引擎中关节约束求解的顶层数据容器，集中管理关节关联的刚体、约束行数量及所有单行约束信息，
 *              是连接关节与约束求解器的核心数据桥梁，速度/位置约束求解的所有核心参数均存储于此
 */
export default class JointSolverInfo {
    /**
     * 关节关联的第一个刚体。
     * 关节约束的第一个目标刚体，可为null（如关节仅关联单个刚体/世界）；
     *              是约束求解中计算雅可比矩阵、冲量的核心刚体对象
     */
    public rigidBody1: Nullable<RigidBody>;

    /**
     * 关节关联的第二个刚体。
     * 关节约束的第二个目标刚体，可为null（如关节关联静态刚体/世界）；
     *              与rigidBody1共同构成关节约束的两个主体，约束求解围绕这两个刚体的运动展开
     */
    public rigidBody2: Nullable<RigidBody>;

    /**
     * 有效约束行数量。
     * 当前关节实际生效的约束行总数，默认值0；
     *              小于等于SETTING_MAX_JACOBIAN_ROWS，仅前numRows行约束信息参与求解计算
     */
    public numRows = 0;

    /**
     * 约束行信息数组。
     * 预分配的约束行信息数组，长度由CONSTANT.SETTING_MAX_JACOBIAN_ROWS指定；
     *              数组中每个元素为JointSolverInfoRow实例，存储单行约束的完整求解信息，
     *              初始化时已创建所有实例，避免运行时动态分配内存
     */
    public rows: Array<JointSolverInfoRow> = new Array(CONSTANT.SETTING_MAX_JACOBIAN_ROWS);

    /**
     * 构造函数：初始化关节求解器信息容器。
     * 核心初始化逻辑：
     *              1. 基于SETTING_MAX_JACOBIAN_ROWS预分配约束行数组长度；
     *              2. 遍历数组为每个位置创建JointSolverInfoRow实例，完成初始化解码；
     *              预分配内存避免运行时GC开销，提升约束求解效率
     */
    constructor() {
        let _g = 0;
        const _g1 = this.rows.length;
        while (_g < _g1) this.rows[_g++] = new JointSolverInfoRow();
    }
}

export { JointSolverInfo };