import Joint from './joint';
import { CONSTANT, JOINT_TYPE } from '../../constant';
import Method from "../../common/method";
import SphericalJointConfig from './spherical-joint-config';
import SpringDamper from './spring-damper';
import JointSolverInfo from './joint-solver-info';
import TimeStep from '../../common/time-step';
import { Nullable } from '../../common/nullable';

/**
 * 球关节实现类。
 * 继承自Joint基类，是球关节（Spherical Joint）的具体实现，
 *              允许两个刚体绕共同锚点做全三维旋转（3个旋转自由度），仅限制锚点位置偏移（无平移自由度），
 *              支持弹簧阻尼器配置以添加旋转缓冲/复位效果，常用于模拟肩关节、髋关节、万向节等全向旋转场景，
 *              是刚体物理模拟中实现「球铰连接」的核心组件
 */
export default class SphericalJoint extends Joint {
	/**
	 * 旋转弹簧阻尼器实例。
	 * 从配置类克隆的弹簧阻尼器实例，独立存储避免配置联动修改，
	 *              用于为球关节的全向旋转添加弹性/阻尼效果（如肩关节的复位缓冲、球头连杆的减震），
	 *              频率设为0时仅限制锚点偏移，无弹性约束
	 */
	public springDamper: SpringDamper;

	/**
	 * 构造函数：初始化球关节。
	 * 核心初始化逻辑：
	 *              1. 调用父类构造函数，指定关节类型为SPHERICAL；
	 *              2. 克隆配置中的弹簧阻尼器实例（避免多个关节共享同一配置导致参数联动）；
	 * @param {SphericalJointConfig} config 球关节配置实例
	 */
	constructor(config: SphericalJointConfig) {
		super(config, JOINT_TYPE.SPHERICAL);
		this.springDamper = config.springDamper.clone();
	}

	/**
	 * 构建球关节的约束求解器信息。
	 * 核心逻辑：
	 *              1. 弹簧阻尼器启用且处于位置约束阶段时，直接返回（弹性约束仅在速度阶段生效）；
	 *              2. 计算锚点间的线性偏移误差（核心约束目标：误差需为0）；
	 *              3. 根据弹簧阻尼器配置计算CFM（Constraint Force Mixing）和ERP（Error Reduction Parameter）：
	 *                 - 启用弹簧阻尼：按频率/阻尼比计算弹性约束参数，模拟缓冲/复位效果；
	 *                 - 禁用弹簧阻尼：CFM=0，ERP使用默认值，强制锚点对齐；
	 *              4. 构建X/Y/Z轴线性约束行：设置极大的力矩范围（±1e65536），确保锚点严格对齐；
	 *              球关节无旋转约束，仅通过线性约束保证锚点重合，从而实现绕锚点的全向旋转
	 * @param {JointSolverInfo} info 待填充的求解器信息实例
	 * @param {Nullable<TimeStep>} timeStep 时间步信息（位置约束阶段为null）
	 * @param {boolean} isPositionPart 是否为位置约束阶段
	 */
	public getInfo(info: JointSolverInfo, timeStep: Nullable<TimeStep>, isPositionPart: boolean): void {
		const SDR = CONSTANT.SETTING_MIN_SPRING_DAMPER_DAMPING_RATIO;
		// 弹簧阻尼器启用且处于位置约束阶段时，跳过位置约束（弹性约束仅在速度阶段处理）
		if (this.springDamper.frequency > 0 && isPositionPart) {
			return;
		}
		const tv = this._tv;
		// 计算两个刚体锚点的线性偏移误差
		Method.subArray(this.anchor2, this.anchor1, tv, 0, 0, 0, 3);
		const errorX = tv[0], errorY = tv[1], errorZ = tv[2];
		let cfm: number; // 约束力混合参数（控制约束的"柔软度"）
		let erp: number; // 误差缩减参数（控制误差修正的速度）

		// 启用弹簧阻尼器时，计算弹性约束的CFM/ERP
		if (this.springDamper.frequency > 0 && timeStep) {
			const omega = 6.28318530717958 * this.springDamper.frequency; // 角频率（2πf）
			let zeta = this.springDamper.dampingRatio;
			// 阻尼比最小值校验（防止阻尼过小导致震荡）
			if (zeta < SDR) {
				zeta = SDR;
			}
			const h = timeStep.dt; // 时间步长
			const c = 2 * zeta * omega; // 阻尼系数
			const k = omega * omega; // 刚度系数

			// 两种数值积分方法的参数计算
			if (this.springDamper.useSymplecticEuler) {
				cfm = 1 / (h * c);
				erp = k / c;
			} else {
				cfm = 1 / (h * (h * k + c));
				erp = k / (h * k + c);
			}
			// 结合两个刚体的质量倒数调整CFM
			cfm *= this.rigidBody1.invMass + this.rigidBody2.invMass;
		} else {
			// 禁用弹簧阻尼器时，使用刚性约束参数
			cfm = 0; // 完全刚性约束
			erp = this.getErp(timeStep, isPositionPart); // 默认误差缩减参数
		}

		// 计算误差修正量（误差值 × 误差缩减参数）
		const linearRhsX = errorX * erp, linearRhsY = errorY * erp, linearRhsZ = errorZ * erp;
		const ra1 = this.relativeAnchor1, ra2 = this.relativeAnchor2;
		// 构建雅克比矩阵的角部系数（锚点力矩项）
		const c100 = 0, c101 = ra1[2], c102 = -ra1[1];
		const c110 = -ra1[2], c111 = 0, c112 = ra1[0];
		const c120 = ra1[1], c121 = -ra1[0], c122 = 0;
		const c200 = 0, c201 = ra2[2], c202 = -ra2[1];
		const c210 = -ra2[2], c211 = 0, c212 = ra2[0];
		const c220 = ra2[1], c221 = -ra2[0], c222 = 0;

		// 构建X轴线性约束行
		const impulse = this.impulses[0];
		const row = info.rows[info.numRows++];
		this.resetRow(row, impulse);
		row.rhs = linearRhsX;
		row.cfm = cfm;
		row.minImpulse = -1e65536; // 极大力矩下限，确保约束生效
		row.maxImpulse = 1e65536;  // 极大力矩上限，确保约束生效
		Method.setJacobianElements(row.jacobian.elements, 1, 0, 0, 1, 0, 0, c100, c101, c102, c200, c201, c202);

		// 构建Y轴线性约束行
		const impulse1 = this.impulses[1];
		const row1 = info.rows[info.numRows++];
		this.resetRow(row1, impulse1);
		row1.rhs = linearRhsY;
		row1.cfm = cfm;
		row1.minImpulse = -1e65536;
		row1.maxImpulse = 1e65536;
		Method.setJacobianElements(row1.jacobian.elements, 0, 1, 0, 0, 1, 0, c110, c111, c112, c210, c211, c212);

		// 构建Z轴线性约束行
		const impulse2 = this.impulses[2];
		const row2 = info.rows[info.numRows++];
		this.resetRow(row2, impulse2);
		row2.rhs = linearRhsZ;
		row2.cfm = cfm;
		row2.minImpulse = -1e65536;
		row2.maxImpulse = 1e65536;
		Method.setJacobianElements(row2.jacobian.elements, 0, 0, 1, 0, 0, 1, c120, c121, c122, c220, c221, c222);
	}

	/**
	 * 构建速度约束求解器信息。
	 * 调用父类基础初始化，再通过getInfo构建速度约束参数（isPositionPart=false），
	 *              弹簧阻尼器的弹性/阻尼效果主要在该阶段生效，保证旋转运动的平滑性
	 * @param {TimeStep} timeStep 时间步信息
	 * @param {JointSolverInfo} info 待填充的求解器信息实例
	 */
	public getVelocitySolverInfo(timeStep: TimeStep, info: JointSolverInfo): void {
		super.getVelocitySolverInfo(timeStep, info);
		this.getInfo(info, timeStep, false);
	}

	/**
	 * 构建位置约束求解器信息。
	 * 调用父类基础初始化，再通过getInfo构建位置约束参数（isPositionPart=true），
	 *              启用弹簧阻尼时该阶段会跳过，仅做刚性约束时修正锚点位置偏移
	 * @param {JointSolverInfo} info 待填充的求解器信息实例
	 */
	public getPositionSolverInfo(info: JointSolverInfo): void {
		super.getPositionSolverInfo(info);
		this.getInfo(info, null, true);
	}

	/**
	 * 获取弹簧阻尼器实例。
	 * 外部访问/修改球关节弹性参数的接口（如调整肩关节的复位力度），
	 *              直接返回内部实例，修改会实时影响关节的物理特性
	 * @returns {SpringDamper} 内部弹簧阻尼器实例
	 */
	public getSpringDamper(): SpringDamper {
		return this.springDamper;
	}
}

export { SphericalJoint };