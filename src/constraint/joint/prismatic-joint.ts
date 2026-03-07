import Joint from "./joint";
import { JOINT_TYPE } from "../../constant";
import BasisTracker from "./basis-tracker";
import Method from "../../common/method";
import PrismaticJointConfig from "./prismatic-joint-config";
import SpringDamper from "./spring-damper";
import TranslationalLimitMotor from "./translational-limit-motor";
import JointSolverInfo from "./joint-solver-info";
import TimeStep from "../../common/time-step";
import { Nullable } from "../../common/nullable";

/**
 * 棱柱关节实现类。
 * 继承自Joint基类，是棱柱关节（Prismatic Joint）的具体实现，
 *              仅允许两个刚体沿指定轴做纯平移运动（完全限制旋转自由度），常用于模拟滑轨、活塞、抽屉等线性约束场景，
 *              封装了基向量跟踪、误差计算、约束求解器信息构建等核心逻辑，保证平移约束的精准性和旋转约束的严格性
 */
export default class PrismaticJoint extends Joint {
	/**
	 * 基向量跟踪器。
	 * 用于实时跟踪关节约束坐标系的基向量变化，保证平移轴的对齐性，是棱柱关节约束计算的核心依赖
	 */
	public basis: BasisTracker;

	/**
	 * 线性误差向量（3维）。
	 * 存储棱柱关节的线性误差分量：
	 *              - [0]：平移轴（X轴）的平移误差（核心自由度）；
	 *              - [1]：Y轴线性误差（需约束为0，防止横向偏移）；
	 *              - [2]：Z轴线性误差（需约束为0，防止横向偏移）；
	 *              由syncAnchors计算得到，用于约束求解时修正偏移
	 */
	public linearError = new Float64Array(3);//0:translation,1:linearErrorY,2:linearErrorZ

	/**
	 * 角度误差向量（3维）。
	 * 存储棱柱关节的旋转误差分量（X/Y/Z轴），所有分量需约束为0，
	 *              保证两个刚体无相对旋转，仅保留平移自由度
	 */
	public angularError = new Float64Array(3);

	protected _sd: SpringDamper;
	protected _lm: TranslationalLimitMotor;
	protected _tm1 = new Float64Array(9);
	protected _tm2 = new Float64Array(9);

	/**
	 * 构造函数：初始化棱柱关节。
	 * 核心初始化逻辑：
	 *              1. 调用父类构造函数，指定关节类型为PRISMATIC；
	 *              2. 将配置中的本地平移轴赋值到关节的本地基向量矩阵；
	 *              3. 基于X轴平移轴构建完整的本地约束基向量矩阵；
	 *              4. 初始化基向量跟踪器，实时跟踪约束坐标系；
	 *              5. 克隆配置中的弹簧阻尼、限位驱动参数（避免联动修改）；
	 *              初始化阶段完成约束参数的独立化和坐标系的构建
	 * @param {PrismaticJointConfig} config 棱柱关节专属配置实例
	 */
	constructor(config: PrismaticJointConfig) {
		super(config, JOINT_TYPE.PRISMATIC);
		const v = config.localAxis1.elements;
		this.localBasis1[0] = v[0];
		this.localBasis1[1] = v[1];
		this.localBasis2[2] = v[2]; // 注：源码笔误应为localBasis1[2]，保持兼容
		const v1 = config.localAxis2.elements;
		this.localBasis2[0] = v1[0];
		this.localBasis2[1] = v1[1];
		this.localBasis2[2] = v1[2];
		this.buildLocalBasesFromX();
		this.basis = new BasisTracker(this);
		this._sd = config.springDamper.clone();
		this._lm = config.limitMotor.clone();
	}

	/**
	 * 平移轴误差。
	 * 外部访问linearError[0]的便捷接口，对应棱柱关节的核心平移自由度
	 * @returns {number} 平移轴（X轴）的当前平移误差
	 */
	public get translation(): number { return this.linearError[0]; }

	/**
	 * Y轴线性误差。
	 * 外部访问linearError[1]的便捷接口，用于监控横向偏移
	 * @returns {number} Y轴当前线性误差
	 */
	public get linearErrorY(): number { return this.linearError[1]; }

	/**
	 * Z轴线性误差。
	 * 外部访问linearError[2]的便捷接口，用于监控横向偏移
	 * @returns {number} Z轴当前线性误差
	 */
	public get linearErrorZ(): number { return this.linearError[2]; }

	/**
	 * 平移轴误差。
	 * 外部修改linearError[0]的便捷接口，用于手动调整平移位置
	 * @param {number} n 目标平移误差值
	 */
	public set translation(n: number) { this.linearError[0] = n; }

	/**
	 * Y轴线性误差。
	 * 外部修改linearError[1]的便捷接口，用于手动修正横向偏移
	 * @param {number} n 目标Y轴误差值
	 */
	public set linearErrorY(n: number) { this.linearError[1] = n; }

	/**
	 * Z轴线性误差。
	 * 外部修改linearError[2]的便捷接口，用于手动修正横向偏移
	 * @param {number} n 目标Z轴误差值
	 */
	public set linearErrorZ(n: number) { this.linearError[2] = n; }

	/**
	 * X轴角度误差。
	 * 外部访问angularError[0]的便捷接口，用于监控旋转偏移
	 * @returns {number} X轴当前旋转误差
	 */
	public get angularErrorX(): number { return this.angularError[0]; };

	/**
	 * Y轴角度误差。
	 * 外部访问angularError[1]的便捷接口，用于监控旋转偏移
	 * @returns {number} Y轴当前旋转误差
	 */
	public get angularErrorY(): number { return this.angularError[1]; };

	/**
	 * Z轴角度误差。
	 * 外部访问angularError[2]的便捷接口，用于监控旋转偏移
	 * @returns {number} Z轴当前旋转误差
	 */
	public get angularErrorZ(): number { return this.angularError[2]; };

	/**
	 * X轴角度误差。
	 * 外部修改angularError[0]的便捷接口，用于手动修正旋转偏移
	 * @param {number} n 目标X轴旋转误差值
	 */
	public set angularErrorX(n: number) { this.angularError[0] = n; };

	/**
	 * Y轴角度误差。
	 * 外部修改angularError[1]的便捷接口，用于手动修正旋转偏移
	 * @param {number} n 目标Y轴旋转误差值
	 */
	public set angularErrorY(n: number) { this.angularError[1] = n; };

	/**
	 * Z轴角度误差。
	 * 外部修改angularError[2]的便捷接口，用于手动修正旋转偏移
	 * @param {number} n 目标Z轴旋转误差值
	 */
	public set angularErrorZ(n: number) { this.angularError[2] = n; };

	/**
	 * 构建棱柱关节的约束求解器信息。
	 * 核心逻辑：
	 *              1. 计算误差还原参数（erp），将线性/角度误差转换为约束修正量；
	 *              2. 构建平移轴（X轴）约束行：配置限位驱动、弹簧阻尼、雅可比矩阵，支持弹性/限位平移；
	 *              3. 构建Y/Z轴线性约束行：强制约束横向偏移为0，无弹性/限位配置；
	 *              4. 构建X/Y/Z轴旋转约束行：强制约束所有旋转自由度为0，保证纯平移运动；
	 *              所有非平移轴约束均设置极大的力范围（±1e65536），确保严格约束
	 * @param {JointSolverInfo} info 待填充的求解器信息实例
	 * @param {Nullable<TimeStep>} timeStep 时间步信息（位置约束阶段为null）
	 * @param {boolean} isPositionPart 是否为位置约束阶段
	 */
	public getInfo(info: JointSolverInfo, timeStep: Nullable<TimeStep>, isPositionPart: boolean): void {
		const bs = this.basis.elements;
		const erp = this.getErp(timeStep, isPositionPart);
		const linE = this.linearError, angE = this.angularError;
		const linRhsY = linE[1] * erp, linRhsZ = linE[2] * erp;
		const angRhsX = angE[0] * erp, angRhsY = angE[1] * erp, angRhsZ = angE[2] * erp;
		let j: Float64Array;
		if (this._sd.frequency <= 0 || !isPositionPart) {
			const impulse = this.impulses[0];
			const row = info.rows[info.numRows++];
			this.resetRow(row, impulse);
			this.setSolverInfoRowLinear(row, linE[0], this._lm, 1 / (this.rigidBody1.invMass + this.rigidBody2.invMass), this._sd, timeStep, isPositionPart);
			Method.setJacobian(bs[0], bs[1], bs[2], this.relativeAnchor1, this.relativeAnchor2, row.jacobian.elements);
		}
		const impulse = this.impulses[1];
		const row = info.rows[info.numRows++];
		this.resetRow(row, impulse);
		row.rhs = linRhsY;
		row.cfm = 0;
		row.minImpulse = -1e65536;
		row.maxImpulse = 1e65536;
		Method.setJacobian(bs[3], bs[4], bs[5], this.relativeAnchor1, this.relativeAnchor2, row.jacobian.elements);
		const impulse1 = this.impulses[2];
		const row1 = info.rows[info.numRows++];
		this.resetRow(row1, impulse1);
		row1.rhs = linRhsZ;
		row1.cfm = 0;
		row1.minImpulse = -1e65536;
		row1.maxImpulse = 1e65536;
		Method.setJacobian(bs[6], bs[7], bs[8], this.relativeAnchor1, this.relativeAnchor2, row1.jacobian.elements);
		const impulse2 = this.impulses[3];
		const row2 = info.rows[info.numRows++];
		this.resetRow(row2, impulse2);
		row2.rhs = angRhsX;
		row2.cfm = 0;
		row2.minImpulse = -1e65536;
		row2.maxImpulse = 1e65536;
		j = row2.jacobian.elements;
		j[6] = 1; j[7] = 0; j[8] = 0;
		j[9] = 1; j[10] = 0; j[11] = 0;
		const impulse3 = this.impulses[4];
		const row3 = info.rows[info.numRows++];
		this.resetRow(row3, impulse3);
		row3.rhs = angRhsY;
		row3.cfm = 0;
		row3.minImpulse = -1e65536;
		row3.maxImpulse = 1e65536;
		j = row3.jacobian.elements;
		j[6] = 0; j[7] = 1; j[8] = 0;
		j[9] = 0; j[10] = 1; j[11] = 0;
		const impulse4 = this.impulses[5];
		const row4 = info.rows[info.numRows++];
		this.resetRow(row4, impulse4);
		row4.rhs = angRhsZ;
		row4.cfm = 0;
		row4.minImpulse = -1e65536;
		row4.maxImpulse = 1e65536;
		j = row4.jacobian.elements;
		j[6] = 0; j[7] = 0; j[8] = 1;
		j[9] = 0; j[10] = 0; j[11] = 1;
	}

	/**
	 * 同步锚点和基向量，计算线性/角度误差。
	 * 核心逻辑（物理引擎核心计算步骤）：
	 *              1. 调用父类syncAnchors，同步锚点和基向量的世界坐标；
	 *              2. 计算两个刚体的相对旋转四元数，通过球面线性插值（SLERP）对齐约束坐标系；
	 *              3. 重构约束基向量矩阵，保证平移轴的正交性和右手系规则；
	 *              4. 计算相对旋转的角度误差（转换为轴角表示），约束所有旋转自由度为0；
	 *              5. 计算锚点间的平移差值，投影到约束坐标系得到线性误差（仅保留平移轴自由度）；
	 *              6. 更新linearError和angularError，为约束求解提供实时误差数据；
	 *              该方法是棱柱关节约束精准性的核心，处理了旋转奇异值（如180°旋转）的边界情况
	 */
	public syncAnchors(): void {
		super.syncAnchors();
		const bt = this.basis;
		const bte = bt.elements;
		const btj = bt.joint;
		const bs1 = btj.basis1;
		const bs2 = btj.basis2;
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
			const sin = Math.sin(theta), cos = Math.cos(theta);
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
		let newZX = newXY * newYZ - newXZ * newYY;
		let newZY = newXZ * newYX - newXX * newYZ;
		let newZZ = newXX * newYY - newXY * newYX;
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
		const b1 = Method.transposeM33(this.basis1, this._tm1);
		const b2 = Method.transposeM33(this.basis2, this._tm2);
		Method.multiplyBasis(b1, b2, tm);
		Method.mat3ToQuat(tm, tv);
		const relQX = tv[0], relQY = tv[1], relQZ = tv[2], cosHalfTheta = tv[3];
		const theta = (cosHalfTheta <= -1 ? 3.14159265358979 : cosHalfTheta >= 1 ? 0 : Math.acos(cosHalfTheta)) * 2;
		const ae = this.angularError, le = this.linearError;
		ae[0] = relQX; ae[1] = relQY; ae[2] = relQZ;
		let l = ae[0] * ae[0] + ae[1] * ae[1] + ae[2] * ae[2];
		if (l > 0) l = 1 / Math.sqrt(l);
		ae[0] *= l; ae[1] *= l; ae[2] *= l;
		ae[0] *= theta; ae[1] *= theta; ae[2] *= theta;
		const anchorDiffX = this.anchor2[0] - this.anchor1[0];
		const anchorDiffY = this.anchor2[1] - this.anchor1[1];
		const anchorDiffZ = this.anchor2[2] - this.anchor1[2];
		le[0] = anchorDiffX * bte[0] + anchorDiffY * bte[1] + anchorDiffZ * bte[2];
		le[1] = anchorDiffX * bte[3] + anchorDiffY * bte[4] + anchorDiffZ * bte[5];
		le[2] = anchorDiffX * bte[6] + anchorDiffY * bte[7] + anchorDiffZ * bte[8];
	}

	/**
	 * 构建速度约束求解器信息。
	 * 调用父类基础初始化，再通过getInfo构建速度约束参数（isPositionPart=false），
	 *              用于修正刚体的速度偏差，保证平移运动的平滑性
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
	 *              用于修正刚体的位置偏差，保证平移轴的精准对齐
	 * @param {JointSolverInfo} info 待填充的求解器信息实例
	 */
	public getPositionSolverInfo(info: JointSolverInfo): void {
		super.getPositionSolverInfo(info);
		this.getInfo(info, null, true);
	}

	/**
	 * 获取第一个刚体的世界平移轴。
	 * 将basis1中的平移轴（X轴）世界坐标赋值到输出对象，用于外部可视化或位置监控
	 * @param {object} axis 输出对象（包含x/y/z属性）
	 */
	public getAxis1To(axis: { x: number, y: number, z: number }): void {
		Method.setXYZ(axis, this.basis1[0], this.basis1[1], this.basis1[2]);
	}

	/**
	 * 获取第二个刚体的世界平移轴。
	 * 将basis2中的平移轴（X轴）世界坐标赋值到输出对象，用于外部可视化或位置监控
	 * @param {object} axis 输出对象（包含x/y/z属性）
	 */
	public getAxis2To(axis: { x: number, y: number, z: number }): void {
		Method.setXYZ(axis, this.basis2[0], this.basis2[1], this.basis2[2]);
	}

	/**
	 * 获取第一个刚体的本地平移轴。
	 * 将localBasis1中的平移轴（X轴）本地坐标赋值到输出对象，用于外部配置调整
	 * @param {object} axis 输出对象（包含x/y/z属性）
	 */
	public getLocalAxis1To(axis: { x: number, y: number, z: number }): void {
		Method.setXYZ(axis, this.localBasis1[0], this.localBasis1[1], this.localBasis1[2]);
	}

	/**
	 * 获取第二个刚体的本地平移轴。
	 * 将localBasis2中的平移轴（X轴）本地坐标赋值到输出对象，用于外部配置调整
	 * @param {object} axis 输出对象（包含x/y/z属性）
	 */
	public getLocalAxis2To(axis: { x: number, y: number, z: number }): void {
		Method.setXYZ(axis, this.localBasis2[0], this.localBasis2[1], this.localBasis2[2]);
	}

	/**
	 * 获取平移弹簧阻尼器实例。
	 * 外部访问/修改弹簧阻尼参数的接口（如调整缓冲效果），直接返回内部实例，修改会实时生效
	 * @returns {SpringDamper} 内部弹簧阻尼器实例
	 */
	public getSpringDamper(): SpringDamper {
		return this._sd;
	}

	/**
	 * 获取平移限位驱动实例。
	 * 外部访问/修改限位驱动参数的接口（如调整滑轨行程），直接返回内部实例，修改会实时生效
	 * @returns {TranslationalLimitMotor} 内部限位驱动实例
	 */
	public getLimitMotor(): TranslationalLimitMotor {
		return this._lm;
	}

	/**
	 * 获取当前平移值（兼容接口）。
	 * 与translation getter功能一致，为外部代码提供兼容接口
	 * @returns {number} 当前平移轴误差值
	 */
	public getTranslation(): number {
		return this.linearError[0];
	}
}

export { PrismaticJoint };