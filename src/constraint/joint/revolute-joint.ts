import Joint from "./joint";
import { JOINT_TYPE } from '../../constant';
import BasisTracker from "./basis-tracker";
import Method from "../../common/method";
import RevoluteJointConfig from "./revolute-joint-config";
import SpringDamper from "./spring-damper";
import RotationalLimitMotor from "./rotational-limit-motor";
import JointSolverInfo from "./joint-solver-info";
import TimeStep from "../../common/time-step";
import { Nullable } from "../../common/nullable";

/**
 * 旋转关节实现类。
 * 继承自Joint基类，是旋转关节（Revolute Joint）的具体实现，
 *              仅允许两个刚体绕指定轴做纯旋转运动（完全限制平移和其他方向旋转自由度），
 *              支持旋转角度限位、弹簧阻尼缓冲，可精准模拟门轴、车轮、铰链、机械臂关节等场景的物理特性，
 *              是刚体物理模拟中最常用的关节类型之一
 */
export default class RevoluteJoint extends Joint {
	/**
	 * 角度误差数组。
	 * 存储旋转关节的角度误差（3维），各索引含义：
	 *              - 0: 绕旋转轴的旋转角度（核心运动参数）
	 *              - 1: Y轴方向角度误差（需约束为0，限制非目标轴旋转）
	 *              - 2: Z轴方向角度误差（需约束为0，限制非目标轴旋转）
	 */
	public angularError = new Float64Array(3);

	/**
	 * 线性误差数组。
	 * 存储关节锚点的线性偏移误差（X/Y/Z轴），所有分量需约束为0，
	 *              保证两个刚体仅绕关节轴旋转，无位置偏移（模拟铰链的固定连接特性）
	 */
	public linearError = new Float64Array(3);

	private _basis: BasisTracker;
	private _sd: SpringDamper;
	private _lm: RotationalLimitMotor;

	/**
	 * 构造函数：初始化旋转关节。
	 * 核心初始化逻辑：
	 *              1. 调用父类构造函数，指定关节类型为REVOLUTE；
	 *              2. 从配置中复制本地旋转轴到关节本地基向量矩阵；
	 *              3. 基于X轴构建完整的本地基向量矩阵（适配旋转关节的单轴旋转特性）；
	 *              4. 初始化基向量追踪器，用于后续基向量更新；
	 *              5. 克隆配置中的弹簧阻尼器和限位驱动实例（避免配置联动）；
	 * @param {RevoluteJointConfig} config 旋转关节配置实例
	 */
	constructor(config: RevoluteJointConfig) {
		super(config, JOINT_TYPE.REVOLUTE);
		Method.copyElements(config.localAxis1.elements, this.localBasis1, 0, 0, 3);
		Method.copyElements(config.localAxis2.elements, this.localBasis2, 0, 0, 3);
		this.buildLocalBasesFromX();
		this._basis = new BasisTracker(this);
		this._sd = config.springDamper.clone();
		this._lm = config.limitMotor.clone();
	}

	/**
	 * 绕旋转轴的旋转角度
	 * @returns {number} 当前旋转角度（弧度）
	 */
	public get angle(): number { return this.angularError[0]; }

	/**
	 * Y轴方向角度误差
	 * @returns {number} Y轴角度误差值
	 */
	public get angularErrorY(): number { return this.angularError[1]; }

	/**
	 * Z轴方向角度误差
	 * @returns {number} Z轴角度误差值
	 */
	public get angularErrorZ(): number { return this.angularError[2]; }

	/**
	 * 绕旋转轴的旋转角度
	 * @param {number} n 目标旋转角度（弧度）
	 */
	public set angle(n: number) { this.angularError[0] = n; }

	/**
	 * Y轴方向角度误差
	 * @param {number} n 目标Y轴角度误差值
	 */
	public set angularErrorY(n: number) { this.angularError[1] = n; }

	/**
	 * Z轴方向角度误差
	 * @param {number} n 目标Z轴角度误差值
	 */
	public set angularErrorZ(n: number) { this.angularError[2] = n; }

	/**
	 * X轴线性误差
	 * @returns {number} X轴线性偏移误差值
	 */
	public get linearErrorX(): number { return this.linearError[0]; }

	/**
	 * Y轴线性误差
	 * @returns {number} Y轴线性偏移误差值
	 */
	public get linearErrorY(): number { return this.linearError[1]; }

	/**
	 * Z轴线性误差
	 * @returns {number} Z轴线性偏移误差值
	 */
	public get linearErrorZ(): number { return this.linearError[2]; }

	/**
	 * X轴线性误差
	 * @param {number} n 目标X轴线性误差值
	 */
	public set linearErrorX(n: number) { this.linearError[0] = n; }

	/**
	 * Y轴线性误差
	 * @param {number} n 目标Y轴线性误差值
	 */
	public set linearErrorY(n: number) { this.linearError[1] = n; }

	/**
	 * Z轴线性误差
	 * @param {number} n 目标Z轴线性误差值
	 */
	public set linearErrorZ(n: number) { this.linearError[2] = n; }

	/**
	 * 构建旋转关节的约束求解器信息。
	 * 核心逻辑：
	 *              1. 计算误差还原参数（erp），将线性/角度误差转换为约束修正量；
	 *              2. 构建X/Y/Z轴线性约束行：强制约束锚点偏移为0，设置极大力矩范围（±1e65536）确保严格约束；
	 *              3. 构建Y/Z轴角度约束行：强制约束非目标轴旋转为0，限制刚体绕非指定轴的旋转；
	 *              4. 计算旋转驱动的有效转动惯量（模拟刚体旋转的物理特性）；
	 *              5. 构建旋转轴约束行：配置弹簧阻尼和限位驱动，处理绕目标轴的旋转约束；
	 *              该方法是旋转关节物理约束的核心，确保仅绕指定轴旋转且无位置偏移
	 * @param {JointSolverInfo} info 待填充的求解器信息实例
	 * @param {Nullable<TimeStep>} timeStep 时间步信息（位置约束阶段为null）
	 * @param {boolean} isPositionPart 是否为位置约束阶段
	 */
	public getInfo(info: JointSolverInfo, timeStep: Nullable<TimeStep>, isPositionPart: boolean): void {
		const erp = this.getErp(timeStep, isPositionPart);
		const le = this.linearError, ae = this.angularError;
		const linearRhsX = le[0] * erp, linearRhsY = le[1] * erp, linearRhsZ = le[2] * erp;
		const angRhsY = ae[1] * erp, angRhsZ = ae[2] * erp;
		const ra1 = this.relativeAnchor1, ra2 = this.relativeAnchor2;
		const c100 = 0, c101 = ra1[2], c102 = -ra1[1];
		const c110 = -ra1[2], c111 = 0, c112 = ra1[0];
		const c120 = ra1[1], c121 = -ra1[0], c122 = 0;
		const c200 = 0, c201 = ra2[2], c202 = -ra2[1];
		const c210 = -ra2[2], c211 = 0, c212 = ra2[0];
		const c220 = ra2[1], c221 = -ra2[0], c222 = 0;
		const bte = this._basis.elements;
		const motorMass = this.computeEffectiveInertiaMoment(bte[0], bte[1], bte[2]);
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
		let j: Float64Array;
		if (this._sd.frequency <= 0 || !isPositionPart) {
			const impulse = this.impulses[3];
			const row = info.rows[info.numRows++];
			this.resetRow(row, impulse);
			this.setSolverInfoRowAngular(row, this.angle, this._lm, motorMass, this._sd, timeStep, isPositionPart);
			j = row.jacobian.elements;
			j[6] = bte[0]; j[7] = bte[1]; j[8] = bte[2];
			j[9] = bte[0]; j[10] = bte[1]; j[11] = bte[2];
		}
		const impulse3 = this.impulses[4];
		const row3 = info.rows[info.numRows++];
		this.resetRow(row3, impulse3);
		row3.rhs = angRhsY;
		row3.cfm = 0;
		row3.minImpulse = -1e65536;
		row3.maxImpulse = 1e65536;
		j = row3.jacobian.elements;
		j[6] = bte[3]; j[7] = bte[4]; j[8] = bte[5];
		j[9] = bte[3]; j[10] = bte[4]; j[11] = bte[5];
		const impulse4 = this.impulses[5];
		const row4 = info.rows[info.numRows++];
		this.resetRow(row4, impulse4);
		row4.rhs = angRhsZ;
		row4.cfm = 0;
		row4.minImpulse = -1e65536;
		row4.maxImpulse = 1e65536;
		j = row4.jacobian.elements;
		j[6] = bte[6]; j[7] = bte[7]; j[8] = bte[8];
		j[9] = bte[6]; j[10] = bte[7]; j[11] = bte[8];
	}

	/**
	 * 同步锚点和基向量，计算角度/线性误差。
	 * 核心逻辑（旋转关节物理核心计算步骤）：
	 *              1. 调用父类syncAnchors，同步锚点和基向量的世界坐标；
	 *              2. 通过四元数球面插值（Slerp）计算刚体间的相对旋转，保证旋转计算的平滑性；
	 *              3. 更新基向量追踪器的基向量矩阵，确保旋转轴始终对齐；
	 *              4. 计算绕目标轴的旋转角度（核心运动参数）和非目标轴的角度误差（需约束为0）；
	 *              5. 计算锚点间的线性偏移，更新linearError（需约束为0）；
	 *              该方法是旋转关节「纯旋转、无平移」特性的核心保障，通过高精度的四元数计算确保旋转约束的准确性
	 */
	public syncAnchors(): void {
		super.syncAnchors();
		const bt = this._basis;
		const btj = bt.joint;
		const bs1 = btj.basis1, bs2 = btj.basis2;
		const bte = bt.elements;
		const invM1 = btj.rigidBody1.invMass;
		const invM2 = btj.rigidBody2.invMass;
		const tv = this._tv, tm = this._tm;
		let q2X: number, q2Y: number, q2Z: number, q2W: number;
		let d = bs1[0] * bs2[0] + bs1[1] * bs2[1] + bs1[2] * bs2[2];
		if (d < -0.999999999) {
			Method.vecToQuat(bs1[0], bs1[1], bs1[2], tv);
			q2X = tv[0]; q2Y = tv[1]; q2Z = tv[2]; q2W = 0;
		} else {
			let cX = bs1[1] * bs2[2] - bs1[2] * bs2[1];
			let cY = bs1[2] * bs2[0] - bs1[0] * bs2[2];
			let cZ = bs1[0] * bs2[1] - bs1[1] * bs2[0];
			const w = Math.sqrt((1 + d) * 0.5);
			d = 0.5 / w;
			cX *= d; cY *= d; cZ *= d;
			q2X = cX; q2Y = cY; q2Z = cZ; q2W = w;
		}
		let q1X = 0, q1Y = 0, q1Z = 0, q1W = 1;
		let d1 = q1X * q2X + q1Y * q2Y + q1Z * q2Z + q1W * q2W;
		if (d1 < 0) {
			d1 = -d1;
			q2X = -q2X; q2Y = -q2Y; q2Z = -q2Z; q2W = -q2W;
		}
		let slerpQX: number, slerpQY: number, slerpQZ: number, slerpQW: number;
		if (d1 > 0.999999) {
			const dqX = q2X - q1X, dqY = q2Y - q1Y, dqZ = q2Z - q1Z, dqW = q2W - q1W;
			q2X = q1X + dqX * (invM1 / (invM1 + invM2));
			q2Y = q1Y + dqY * (invM1 / (invM1 + invM2));
			q2Z = q1Z + dqZ * (invM1 / (invM1 + invM2));
			q2W = q1W + dqW * (invM1 / (invM1 + invM2));
			let l = q2X * q2X + q2Y * q2Y + q2Z * q2Z + q2W * q2W;
			if (l > 1e-32) l = 1 / Math.sqrt(l);
			slerpQX = q2X * l; slerpQY = q2Y * l; slerpQZ = q2Z * l; slerpQW = q2W * l;
		} else {
			const theta = invM1 / (invM1 + invM2) * Math.acos(d1);
			q2X += q1X * -d1; q2Y += q1Y * -d1; q2Z += q1Z * -d1; q2W += q1W * -d1;
			let l = q2X * q2X + q2Y * q2Y + q2Z * q2Z + q2W * q2W;
			if (l > 1e-32) l = 1 / Math.sqrt(l);
			q2X *= l; q2Y *= l; q2Z *= l; q2W *= l;
			const sin = Math.sin(theta);
			const cos = Math.cos(theta);
			q1X *= cos; q1Y *= cos; q1Z *= cos; q1W *= cos;
			slerpQX = q1X + q2X * sin; slerpQY = q1Y + q2Y * sin; slerpQZ = q1Z + q2Z * sin; slerpQW = q1W + q2W * sin;
		}
		Method.quatToMat3(slerpQX, slerpQY, slerpQZ, slerpQW, tm);
		tv[0] = bs1[0]; tv[1] = bs1[1]; tv[2] = bs1[2];
		Method.rotateVec3(tv, tm);
		const newXX = tv[0], newXY = tv[1], newXZ = tv[2];
		const prevXX = bte[0], prevXY = bte[1], prevXZ = bte[2];
		const prevYX = bte[3], prevYY = bte[4], prevYZ = bte[5];
		let d2 = prevXX * newXX + prevXY * newXY + prevXZ * newXZ;
		if (d2 < -0.999999999) {
			Method.vecToQuat(prevXX, prevXY, prevXZ, tv);
			slerpQX = tv[0]; slerpQY = tv[1]; slerpQZ = tv[2]; slerpQW = 0;
		} else {
			let cX = prevXY * newXZ - prevXZ * newXY, cY = prevXZ * newXX - prevXX * newXZ, cZ = prevXX * newXY - prevXY * newXX;
			const w = Math.sqrt((1 + d2) * 0.5);
			d2 = 0.5 / w;
			cX *= d2; cY *= d2; cZ *= d2;
			slerpQX = cX; slerpQY = cY; slerpQZ = cZ; slerpQW = w;
		}
		Method.quatToMat3(slerpQX, slerpQY, slerpQZ, slerpQW, tm);
		tv[0] = prevYX; tv[1] = prevYY; tv[2] = prevYZ;
		Method.rotateVec3(tv, tm);
		let newYX = tv[0], newYY = tv[1], newYZ = tv[2];
		let newZX = newXY * newYZ - newXZ * newYY, newZY = newXZ * newYX - newXX * newYZ, newZZ = newXX * newYY - newXY * newYX;
		if (newZX * newZX + newZY * newZY + newZZ * newZZ > 1e-6) {
			let l = newZX * newZX + newZY * newZY + newZZ * newZZ;
			if (l > 0) l = 1 / Math.sqrt(l);
			newZX *= l; newZY *= l; newZZ *= l;
		} else {
			Method.vecToQuat(newXX, newXY, newXZ, tv);
			newZX = tv[0]; newZY = tv[1]; newZZ = tv[2];
		}
		newYX = newZY * newXZ - newZZ * newXY; newYY = newZZ * newXX - newZX * newXZ; newYZ = newZX * newXY - newZY * newXX;
		Method.setM3X3(bte, newXX, newXY, newXZ, newYX, newYY, newYZ, newZX, newZY, newZZ);
		const b1 = this.basis1, b2 = this.basis2;
		let angErrorX = b1[1] * b2[2] - b1[2] * b2[1];
		let angErrorY = b1[2] * b2[0] - b1[0] * b2[2];
		let angErrorZ = b1[0] * b2[1] - b1[1] * b2[0];
		let cos = b1[0] * b2[0] + b1[1] * b2[1] + b1[2] * b2[2];
		const theta = cos <= -1 ? 3.14159265358979 : cos >= 1 ? 0 : Math.acos(cos);
		let l = angErrorX * angErrorX + angErrorY * angErrorY + angErrorZ * angErrorZ;
		if (l > 0) l = 1 / Math.sqrt(l);
		angErrorX *= l; angErrorY *= l; angErrorZ *= l;
		angErrorX *= theta; angErrorY *= theta; angErrorZ *= theta;
		const ae = this.angularError, le = this.linearError;
		ae[1] = angErrorX * bte[3] + angErrorY * bte[4] + angErrorZ * bte[5];
		ae[2] = angErrorX * bte[6] + angErrorY * bte[7] + angErrorZ * bte[8];
		const perpCrossX = b1[4] * b2[5] - b1[5] * b2[4];
		const perpCrossY = b1[5] * b2[3] - b1[3] * b2[5];
		const perpCrossZ = b1[3] * b2[4] - b1[4] * b2[3];
		cos = b1[3] * b2[3] + b1[4] * b2[4] + b1[5] * b2[5];
		ae[0] = cos <= -1 ? 3.14159265358979 : cos >= 1 ? 0 : Math.acos(cos);
		if (perpCrossX * bte[0] + perpCrossY * bte[1] + perpCrossZ * bte[2] < 0) {
			ae[0] = -ae[0];
		}
		Method.subArray(this.anchor2, this.anchor1, this.linearError, 0, 0, 0, 3);
	}

	/**
	 * 构建速度约束求解器信息。
	 * 调用父类基础初始化，再通过getInfo构建速度约束参数（isPositionPart=false），
	 *              用于修正旋转/平移的速度偏差，保证旋转运动的平滑性
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
	 *              用于修正位置/角度偏差，保证旋转约束的精准性
	 * @param {JointSolverInfo} info 待填充的求解器信息实例
	 */
	public getPositionSolverInfo(info: JointSolverInfo): void {
		super.getPositionSolverInfo(info);
		this.getInfo(info, null, true);
	}

	/**
	 * 获取第一个刚体的世界旋转轴。
	 * 将basis1中的旋转轴世界坐标赋值到输出对象，用于物理调试或可视化
	 * @param {object} axis 输出对象（包含x/y/z属性）
	 */
	public getAxis1To(axis: { x: number, y: number, z: number }): void {
		Method.setXYZ(axis, this.basis1[0], this.basis1[1], this.basis1[2]);
	}

	/**
	 * 获取第二个刚体的世界旋转轴。
	 * 将basis2中的旋转轴世界坐标赋值到输出对象，用于物理调试或可视化
	 * @param {object} axis 输出对象（包含x/y/z属性）
	 */
	public getAxis2To(axis: { x: number, y: number, z: number }): void {
		Method.setXYZ(axis, this.basis2[0], this.basis2[1], this.basis2[2]);
	}

	/**
	 * 获取第一个刚体的本地旋转轴。
	 * 将localBasis1中的旋转轴本地坐标赋值到输出对象，用于配置调整
	 * @param {object} axis 输出对象（包含x/y/z属性）
	 */
	public getLocalAxis1To(axis: { x: number, y: number, z: number }): void {
		Method.setXYZ(axis, this.localBasis1[0], this.localBasis1[1], this.localBasis1[2]);
	}

	/**
	 * 获取第二个刚体的本地旋转轴。
	 * 将localBasis2中的旋转轴本地坐标赋值到输出对象，用于配置调整
	 * @param {object} axis 输出对象（包含x/y/z属性）
	 */
	public getLocalAxis2To(axis: { x: number, y: number, z: number }): void {
		Method.setXYZ(axis, this.localBasis2[0], this.localBasis2[1], this.localBasis2[2]);
	}

	/**
	 * 获取弹簧阻尼器实例。
	 * 外部访问/修改旋转弹性参数的接口（如调整门的缓冲力度），
	 *              直接返回内部实例，修改会实时影响关节物理特性
	 * @returns {SpringDamper} 内部弹簧阻尼器实例
	 */
	public getSpringDamper(): SpringDamper {
		return this._sd;
	}

	/**
	 * 获取旋转限位驱动实例。
	 * 外部访问/修改旋转限位参数的接口（如限制门的开合角度），
	 *              直接返回内部实例，修改会实时影响关节运动范围
	 * @returns {RotationalLimitMotor} 内部旋转限位驱动实例
	 */
	public getLimitMotor(): RotationalLimitMotor {
		return this._lm;
	}

	/**
	 * 获取当前旋转角度。
	 * 外部访问旋转角度的快捷接口，与angle getter功能一致，兼容不同调用习惯
	 * @returns {number} 当前绕旋转轴的旋转角度（弧度）
	 */
	public getAngle(): number {
		return this.angularError[0];
	}
}

export { RevoluteJoint };