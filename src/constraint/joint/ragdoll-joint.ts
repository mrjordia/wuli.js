import Joint from "./joint"
import { CONSTANT, JOINT_TYPE } from '../../constant';
import RotationalLimitMotor from "./rotational-limit-motor";
import Method from "../../common/method";
import RagdollJointConfig from "./ragdoll-joint-config";
import SpringDamper from "./spring-damper";
import JointSolverInfo from "./joint-solver-info";
import TimeStep from "../../common/time-step";
import { Nullable } from "../../common/nullable";

/**
 * 布娃娃关节实现类。
 * 继承自Joint基类，是布娃娃关节（Ragdoll Joint）的具体实现，
 *              专为角色物理模拟设计，支持「扭转（Twist）+ 双轴摆动（Swing）」的人体关节运动约束，
 *              可精准限制关节旋转范围、添加弹性阻尼效果，完美模拟肩膀、髋关节、膝关节等人体关节的物理特性，
 *              是角色布娃娃物理系统的核心组件
 */
export default class RagdollJoint extends Joint {
	/**
	 * 摆动限位驱动（占位）。
	 * 摆动约束的占位限位驱动实例，仅用于适配约束求解器接口，
	 *              实际摆动范围由maxSwingAngle1/2控制，该实例固定lowerLimit=-1、upperLimit=0
	 */
	public dummySwingLm = new RotationalLimitMotor();

	/**
	 * 摆动误差值。
	 * 摆动角度超出限制范围的误差值（仅当超出时为正），
	 *              用于约束求解器修正过度摆动，保证关节在设定范围内运动
	 */
	public swingError = 0;

	/**
	 * 摆动轴向量。
	 * 实时计算的摆动约束轴（3维），指向摆动超限的方向，
	 *              用于约束求解器施加修正力矩，限制过度摆动
	 */
	public swingAxis = new Float64Array(3);

	/**
	 * 扭转轴向量。
	 * 实时计算的扭转约束轴（3维），与关节扭转轴对齐，
	 *              用于约束求解器处理扭转旋转的限位和弹性
	 */
	public twistAxis = new Float64Array(3);

	/**
	 * 线性误差向量。
	 * 关节锚点的线性偏移误差（X/Y/Z轴），所有分量需约束为0，
	 *              保证两个刚体仅绕关节旋转，无位置偏移（模拟人体关节的固定连接）
	 */
	public linearError = new Float64Array(3);

	private _swingAngle = 0;
	private _twistAngle = 0;
	private _tm1 = new Float64Array(9);
	private _tv1 = new Float64Array(4);
	private _twistSd: SpringDamper;
	private _twistLm: RotationalLimitMotor;
	private _swingSd: SpringDamper;
	private _maxSwingAngle1: number;
	private _maxSwingAngle2: number;

	/**
	 * 构造函数：初始化布娃娃关节。
	 * 核心初始化逻辑：
	 *              1. 调用父类构造函数，指定关节类型为RAG_DOLL；
	 *              2. 将配置中的本地扭转轴/摆动轴赋值到关节的本地基向量矩阵；
	 *              3. 基于XY轴构建完整的本地约束基向量矩阵，适配人体关节坐标系；
	 *              4. 克隆配置中的弹簧阻尼、限位驱动参数（避免联动修改）；
	 *              5. 校验并修正最大摆动角度（确保不小于系统最小值）；
	 *              6. 初始化占位摆动限位驱动的参数，适配求解器接口；
	 *              初始化阶段完成约束参数的独立化和坐标系的构建
	 * @param {RagdollJointConfig} config 布娃娃关节专属配置实例
	 */
	constructor(config: RagdollJointConfig) {
		super(config, JOINT_TYPE.RAG_DOLL);
		Method.copyElements(config.localTwistAxis1.elements, this.localBasis1, 0, 0, 3);
		Method.copyElements(config.localSwingAxis1.elements, this.localBasis1, 0, 3, 3);
		Method.copyElements(config.localTwistAxis2.elements, this.localBasis2, 0, 0, 3);
		this.buildLocalBasesFromXY1X2();
		this._twistSd = config.twistSpringDamper.clone();
		this._twistLm = config.twistLimitMotor.clone();
		this._swingSd = config.swingSpringDamper.clone();
		this._maxSwingAngle1 = config.maxSwingAngle1;
		this._maxSwingAngle2 = config.maxSwingAngle2;
		if (this._maxSwingAngle1 < CONSTANT.SETTING_MIN_RAG_DOLL_MAX_SWING_ANGLE) {
			this._maxSwingAngle1 = CONSTANT.SETTING_MIN_RAG_DOLL_MAX_SWING_ANGLE;
		}
		if (this._maxSwingAngle2 < CONSTANT.SETTING_MIN_RAG_DOLL_MAX_SWING_ANGLE) {
			this._maxSwingAngle2 = CONSTANT.SETTING_MIN_RAG_DOLL_MAX_SWING_ANGLE;
		}
		this.dummySwingLm.lowerLimit = -1;
		this.dummySwingLm.upperLimit = 0;
	}

	/**
	 * 构建布娃娃关节的约束求解器信息。
	 * 核心逻辑：
	 *              1. 计算误差还原参数（erp），将线性误差转换为约束修正量；
	 *              2. 构建X/Y/Z轴线性约束行：强制约束锚点偏移为0，无弹性/限位配置，
	 *                 设置极大的力矩范围（±1e65536）确保严格约束；
	 *              3. 计算摆动/扭转约束的有效转动惯量（模拟人体关节的转动特性）；
	 *              4. 构建摆动约束行：仅当摆动超限且满足条件时，添加摆动约束，
	 *                 配置弹簧阻尼和占位限位驱动，修正过度摆动；
	 *              5. 构建扭转约束行：配置扭转限位驱动和弹簧阻尼，处理扭转旋转的约束；
	 *              该方法是布娃娃关节物理特性的核心，兼顾了「固定连接」和「可控旋转」的人体关节特性
	 * @param {JointSolverInfo} info 待填充的求解器信息实例
	 * @param {Nullable<TimeStep>} timeStep 时间步信息（位置约束阶段为null）
	 * @param {boolean} isPositionPart 是否为位置约束阶段
	 */
	public getInfo(info: JointSolverInfo, timeStep: Nullable<TimeStep>, isPositionPart: boolean): void {
		const erp = this.getErp(timeStep, isPositionPart);
		const le = this.linearError;
		const ra1 = this.relativeAnchor1, ra2 = this.relativeAnchor2;
		const bs1 = this.basis1, bs2 = this.basis2;
		const sa = this.swingAxis, ta = this.twistAxis;
		const linearRhsX = le[0] * erp, linearRhsY = le[1] * erp, linearRhsZ = le[2] * erp;
		const c100 = 0, c101 = ra1[2], c102 = -ra1[1];
		const c110 = -ra1[2], c111 = 0, c112 = ra1[0];
		const c120 = ra1[1], c121 = -ra1[0], c122 = 0;
		const c200 = 0, c201 = ra2[2], c202 = -ra2[1];
		const c210 = -ra2[2], c211 = 0, c212 = ra2[0];
		const c220 = ra2[1], c221 = -ra2[0], c222 = 0;
		const swingMass = this.computeEffectiveInertiaMoment(sa[0], sa[1], sa[2]);
		const twistMass = this.computeEffectiveInertiaMoment(bs2[0], bs2[1], bs2[2]);
		const impulse = this.impulses[0];
		const row = info.rows[info.numRows++];
		this.resetRow(row, impulse);
		row.rhs = linearRhsX;
		row.cfm = 0;
		row.minImpulse = -1e65536;
		row.maxImpulse = 1e65536;
		Method.setJacobianElements(row.jacobian.elements, 1, 0, 0, 1, 0, 0, c100, c101, c102, c200, c201, c202);
		const impulse1 = this.impulses[1];
		const row1 = info.rows[info.numRows++];
		this.resetRow(row1, impulse1);
		row1.rhs = linearRhsY;
		row1.cfm = 0;
		row1.minImpulse = -1e65536;
		row1.maxImpulse = 1e65536;
		Method.setJacobianElements(row1.jacobian.elements, 0, 1, 0, 0, 1, 0, c110, c111, c112, c210, c211, c212);
		const impulse2 = this.impulses[2];
		const row2 = info.rows[info.numRows++];
		this.resetRow(row2, impulse2);
		row2.rhs = linearRhsZ;
		row2.cfm = 0;
		row2.minImpulse = -1e65536;
		row2.maxImpulse = 1e65536;
		Method.setJacobianElements(row2.jacobian.elements, 0, 0, 1, 0, 0, 1, c120, c121, c122, c220, c221, c222);
		if (this.swingError > 0 && (this._swingSd.frequency <= 0 || !isPositionPart)) {
			const impulse = this.impulses[3];
			const row = info.rows[info.numRows++];
			this.resetRow(row, impulse);
			this.setSolverInfoRowAngular(row, this.swingError, this.dummySwingLm, swingMass, this._swingSd, timeStep, isPositionPart);
			const j = row.jacobian.elements;
			j[6] = sa[0]; j[7] = sa[1]; j[8] = sa[2];
			j[9] = sa[0]; j[10] = sa[1]; j[11] = sa[2];
		}
		if (this._twistSd.frequency <= 0 || !isPositionPart) {
			const impulse = this.impulses[4];
			const row = info.rows[info.numRows++];
			this.resetRow(row, impulse);
			this.setSolverInfoRowAngular(row, this._twistAngle, this._twistLm, twistMass, this._twistSd, timeStep, isPositionPart);
			const j = row.jacobian.elements;
			j[6] = ta[0]; j[7] = ta[1]; j[8] = ta[2];
			j[9] = ta[0]; j[10] = ta[1]; j[11] = ta[2];
		}
	}

	/**
	 * 同步锚点和基向量，计算摆动/扭转角度及误差。
	 * 核心逻辑（角色物理核心计算步骤）：
	 *              1. 调用父类syncAnchors，同步锚点和基向量的世界坐标；
	 *              2. 计算两个刚体的相对旋转，转换为摆动角度和扭转角度（适配人体关节运动）；
	 *              3. 基于椭圆约束算法（maxSwingAngle1/2为椭圆半轴）判断摆动是否超限：
	 *                 - 未超限：swingError=0，无摆动约束；
	 *                 - 超限：计算摆动误差和修正轴，用于约束求解；
	 *              4. 计算扭转轴向量并归一化，为扭转约束提供参考轴；
	 *              5. 计算锚点间的线性偏移，更新linearError（需约束为0）；
	 *              该方法是布娃娃关节「人体化运动」的核心，采用椭圆约束模拟人体关节的自然摆动范围
	 */
	public syncAnchors(): void {
		super.syncAnchors();
		const sa = this.swingAxis, ta = this.twistAxis;
		const le = this.linearError;
		const bs1 = this.basis1, bs2 = this.basis2;
		const tv = this._tv, tm = this._tm, tm1 = this._tm1, tv1 = this._tv1;
		Method.setRotFromTwoVec3(bs1[0], bs1[1], bs1[2], bs2[0], bs2[1], bs2[2], tv, tm);
		Method.transposeM33(bs1, tm1);
		this._swingAngle = (tv[3] <= -1 ? 3.14159265358979 : tv[3] >= 1 ? 0 : Math.acos(tv[3])) * 2;
		Method.setElements(tv1, 0, bs2[3], bs2[4], bs2[5]);
		Method.inverseRotateVec3(tv1, tm);
		this._twistAngle = Math.atan2(bs1[6] * tv1[0] + bs1[7] * tv1[1] + bs1[8] * tv1[2], bs1[3] * tv1[0] + bs1[4] * tv1[1] + bs1[5] * tv1[2]);
		Method.addArray(bs1, bs2, ta, 0, 0, 0, 3);
		Method.normalize(ta, 0, 3);
		Method.normalize(tv, 0, 3, this._swingAngle);

		Method.inverseRotateVec3(tv, tm1);
		const x1 = tv[1];
		const y1 = tv[2];
		const a = this._maxSwingAngle1;
		const b = this._maxSwingAngle2;
		const invA2 = 1 / (a * a);
		const invB2 = 1 / (b * b);
		const w1 = x1 * x1 * invA2 + y1 * y1 * invB2;
		if (w1 === 0) {
			Method.fillValue(sa, 0, 2, 0);
			this.swingError = 0;
		} else {
			const t = Math.sqrt(1 / w1);
			const x0 = x1 * t;
			const y0 = y1 * t;
			let nx = x0 * invA2;
			let ny = y0 * invB2;
			const invLen = 1 / Math.sqrt(nx * nx + ny * ny);
			nx *= invLen;
			ny *= invLen;
			const depth = (x1 - x0) * nx + (y1 - y0) * ny;
			if (depth > 0) {
				this.swingError = depth;
				Method.setElements(sa, 0, 0, nx, ny);
				Method.rotateVec3(sa, tm1);
				Method.rotateVec3(sa, tm);
			} else {
				this.swingError = 0;
			}
		}
		Method.subArray(this.anchor2, this.anchor1, le, 0, 0, 0, 3);
	}

	/**
	 * 构建速度约束求解器信息。
	 * 调用父类基础初始化，再通过getInfo构建速度约束参数（isPositionPart=false），
	 *              用于修正关节旋转/平移的速度偏差，保证角色运动的平滑性
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
	 *              用于修正关节的位置/角度偏差，保证角色关节的精准约束
	 * @param {JointSolverInfo} info 待填充的求解器信息实例
	 */
	public getPositionSolverInfo(info: JointSolverInfo): void {
		super.getPositionSolverInfo(info);
		this.getInfo(info, null, true);
	}

	/**
	 * 获取第一个刚体的世界扭转轴。
	 * 将basis1中的扭转轴世界坐标赋值到输出对象，用于角色骨骼可视化或调试
	 * @param {object} axis 输出对象（包含x/y/z属性）
	 */
	public getAxis1To(axis: { x: number, y: number, z: number }): void {
		Method.setXYZ(axis, this.basis1[0], this.basis1[1], this.basis1[2]);
	}

	/**
	 * 获取第二个刚体的世界扭转轴。
	 * 将basis2中的扭转轴世界坐标赋值到输出对象，用于角色骨骼可视化或调试
	 * @param {object} axis 输出对象（包含x/y/z属性）
	 */
	public getAxis2To(axis: { x: number, y: number, z: number }): void {
		Method.setXYZ(axis, this.basis2[0], this.basis2[1], this.basis2[2]);
	}

	/**
	 * 获取第一个刚体的本地扭转轴。
	 * 将localBasis1中的扭转轴本地坐标赋值到输出对象，用于角色骨骼配置调整
	 * @param {object} axis 输出对象（包含x/y/z属性）
	 */
	public getLocalAxis1To(axis: { x: number, y: number, z: number }): void {
		Method.setXYZ(axis, this.localBasis1[0], this.localBasis1[1], this.localBasis1[2]);
	}

	/**
	 * 获取第二个刚体的本地扭转轴。
	 * 将localBasis2中的扭转轴本地坐标赋值到输出对象，用于角色骨骼配置调整
	 * @param {object} axis 输出对象（包含x/y/z属性）
	 */
	public getLocalAxis2To(axis: { x: number, y: number, z: number }): void {
		Method.setXYZ(axis, this.localBasis2[0], this.localBasis2[1], this.localBasis2[2]);
	}

	/**
	 * 获取扭转弹簧阻尼器实例。
	 * 外部访问/修改扭转弹性参数的接口（如调整关节复位力度），
	 *              直接返回内部实例，修改会实时影响关节物理特性
	 * @returns {SpringDamper} 内部扭转弹簧阻尼器实例
	 */
	public getTwistSpringDamper(): SpringDamper {
		return this._twistSd;
	}

	/**
	 * 获取扭转限位驱动实例。
	 * 外部访问/修改扭转限位参数的接口（如限制肘关节扭转范围），
	 *              直接返回内部实例，修改会实时影响关节运动范围
	 * @returns {RotationalLimitMotor} 内部扭转限位驱动实例
	 */
	public getTwistLimitMotor(): RotationalLimitMotor {
		return this._twistLm;
	}

	/**
	 * 获取摆动弹簧阻尼器实例。
	 * 外部访问/修改摆动弹性参数的接口（如调整肩关节缓冲效果），
	 *              直接返回内部实例，修改会实时影响关节物理特性
	 * @returns {SpringDamper} 内部摆动弹簧阻尼器实例
	 */
	public getSwingSpringDamper(): SpringDamper {
		return this._swingSd;
	}

	/**
	 * 获取当前摆动轴。
	 * 将实时计算的摆动轴向量赋值到输出对象，用于角色关节运动状态监控
	 * @param {object} axis 输出对象（包含x/y/z属性）
	 */
	public getSwingAxisTo(axis: { x: number, y: number, z: number }): void {
		Method.setXYZ(axis, this.swingAxis[0], this.swingAxis[1], this.swingAxis[2]);
	}

	/**
	 * 获取当前摆动角度。
	 * 外部访问内部_swingAngle的接口，用于角色关节运动状态监控或逻辑判断
	 * @returns {number} 当前摆动角度（弧度）
	 */
	public getSwingAngle(): number {
		return this._swingAngle;
	}

	/**
	 * 获取当前扭转角度。
	 * 外部访问内部_twistAngle的接口，用于角色关节运动状态监控或逻辑判断
	 * @returns {number} 当前扭转角度（弧度）
	 */
	public getTwistAngle(): number {
		return this._twistAngle;
	}
}

export { RagdollJoint };