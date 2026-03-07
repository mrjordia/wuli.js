import ContactSolverInfoRow from "./contact-solver-info-row";
import { CONSTANT } from '../../constant';
import RigidBody from "../../rigid-body/rigid-body";
import { Nullable } from "../../common/nullable";

/**
 * 接触约束求解信息类。
 * 物理引擎中管理单个碰撞接触所有求解数据的容器类，整合了碰撞的两个刚体、多个接触点的求解行数据（ContactSolverInfoRow），
 *              是约束求解器（Solver）处理单个碰撞接触的核心数据载体，预分配固定长度的求解行数组以优化性能
 */
export default class ContactSolverInfo {
	/**
	 * 第一个碰撞刚体。
	 * 指向碰撞中的第一个刚体实例，包含刚体的质量、惯性、速度等物理属性，是约束求解的核心输入数据
	 * @default null
	 */
	public rigidBody1: Nullable<RigidBody>;

	/**
	 * 第二个碰撞刚体。
	 * 指向碰撞中的第二个刚体实例，与rigidBody1配对，共同参与约束方程的构建和求解
	 * @default null
	 */
	public rigidBody2: Nullable<RigidBody>;

	/**
	 * 有效求解行数量。
	 * 标记当前接触中实际有效的ContactSolverInfoRow数量（≤ SETTING_MAX_MANIFOLD_POINTS），
	 *              求解器仅处理前numRows行数据，避免遍历空行
	 * @default 0
	 */
	public numRows = 0;

	/**
	 * 接触求解行数组。
	 * 预分配的ContactSolverInfoRow数组，长度等于最大接触点数量（SETTING_MAX_MANIFOLD_POINTS），
	 *              每个元素对应一个接触点的求解数据，初始化时自动创建所有行实例以避免运行时动态分配
	 */
	public rows: Array<ContactSolverInfoRow> = new Array(CONSTANT.SETTING_MAX_MANIFOLD_POINTS);

	/**
	 * 构造函数：初始化接触约束求解信息实例。
	 * 核心逻辑：预创建数组中所有ContactSolverInfoRow实例，长度由SETTING_MAX_MANIFOLD_POINTS决定，
	 *              避免运行时频繁创建/销毁对象，提升物理引擎的运行性能
	 */
	constructor() {
		let _g = 0, _g1 = this.rows.length;
		while (_g < _g1) this.rows[_g++] = new ContactSolverInfoRow();
	}
}

export { ContactSolverInfo };