import ConstraintSolver from "./constraint-solver";
import ContactSolverInfo from "../contact/contact-solver-info";
import { CONSTANT } from '../../constant';
import ContactSolverMassDataRow from "./contact-solver-mass-data-row";
import TimeStep from "../../common/time-step";
import ContactConstraint from "../contact/contact-constraint";

/**
 * PGS接触约束求解器类。
 * 基于投影梯度下降（Projected Gauss-Seidel, PGS）算法的接触约束求解器，
 *              是物理引擎中接触约束求解的核心实现类，完整实现了速度约束、位置约束的全生命周期求解流程：
 *              1. 速度约束：热启动 → 预计算质量数据 → 求解切向/法向冲量 → 应用速度修正
 *              2. 位置约束：分离冲量修正 → NGS迭代修正 → 刚体位置/旋转更新
 *              3. 收尾处理：冲量缓存、流形同步、接触冲量统计
 *              适配多接触点（MANIFOLD_POINTS）场景，支持摩擦约束、反弹约束、位置穿透修正
 */
export default class PgsContactConstraintSolver extends ConstraintSolver {
	/**
	 * 关联的接触约束实例。
	 * 存储接触流形、刚体/形状关联数据，是求解器的核心数据源，
	 *              提供速度/位置约束的雅克比矩阵、接触点深度等关键信息
	 */
	public constraint: ContactConstraint;

	/**
	 * 接触求解信息容器。
	 * 存储约束求解的核心数据：雅克比矩阵、冲量、摩擦系数、rhs（约束方程右侧值）等，
	 *              是求解器与接触约束之间的数据交互载体
	 * @default new ContactSolverInfo()
	 */
	public info = new ContactSolverInfo();

	/**
	 * 接触求解质量数据行数组。
	 * 每个元素对应一个接触点的质量数据（逆质量、逆转动惯量、有效质量），
	 *              预分配固定长度数组以提升求解性能，避免运行时动态扩容
	 * @default 长度为SETTING_MAX_MANIFOLD_POINTS的数组，元素为ContactSolverMassDataRow实例
	 */
	public massData: Array<ContactSolverMassDataRow> = new Array(CONSTANT.SETTING_MAX_MANIFOLD_POINTS);

	/**
	 * 构造函数：初始化PGS接触约束求解器。
	 * 核心初始化逻辑：
	 *              1. 调用父类ConstraintSolver构造函数
	 *              2. 关联接触约束实例
	 *              3. 初始化massData数组，为每个接触点预创建ContactSolverMassDataRow实例
	 * @param {ContactConstraint} constraint 接触约束实例 - 必须传入有效的ContactConstraint实例
	 */
	constructor(constraint: ContactConstraint) {
		super();
		this.constraint = constraint;
		let _g = 0, _g1 = this.massData.length;
		while (_g < _g1) this.massData[_g++] = new ContactSolverMassDataRow();
	}

	/**
	 * 速度约束求解后置处理（空实现）。
	 * 当前版本为空实现，预留扩展接口，可用于：
	 *              1. 速度约束求解后的冲量校验
	 *              2. 刚体速度的边界限制
	 *              3. 求解器内部状态重置
	 * @param {TimeStep} timeStep 时间步实例
	 */
	public postSolveVelocity(timeStep: TimeStep): void {
	}

	/**
	 * 速度约束求解前置处理（核心方法）。
	 * 速度求解前的核心初始化逻辑，完成以下关键操作：
	 *              1. 从接触约束构建速度求解信息（雅克比矩阵、rhs、摩擦系数等）
	 *              2. 关联求解器的刚体引用（_b1/_b2）
	 *              3. 提取刚体的逆质量、逆转动惯量矩阵（缓存为局部变量提升计算效率）
	 *              4. 遍历所有接触点，预计算质量数据（massData）：
	 *                 - 法向/切向/副法向的逆质量分量（invMLinN/T/B）
	 *                 - 法向/切向/副法向的逆转动惯量分量（invMAngN/T/B）
	 *                 - 法向有效质量（massN = 1/(J·M⁻¹·Jᵀ)）
	 *                 - 切向/副法向2x2有效质量矩阵（massTB）
	 *              注：预计算质量数据是PGS求解的核心优化，避免迭代中重复计算
	 * @param {TimeStep} timeStep 时间步实例
	 */
	public preSolveVelocity(timeStep: TimeStep): void {
		this.constraint.getVelocitySolverInfo(timeStep, this.info);
		this._b1 = this.info.rigidBody1!;
		this._b2 = this.info.rigidBody2!;
		const invM1 = this._b1!.invMass;
		const invM2 = this._b2!.invMass;
		let tmp = this._b1!.invInertia;
		const invI100 = tmp[0], invI101 = tmp[1], invI102 = tmp[2], invI110 = tmp[3], invI111 = tmp[4], invI112 = tmp[5], invI120 = tmp[6], invI121 = tmp[7], invI122 = tmp[8];
		tmp = this._b2!.invInertia;
		const invI200 = tmp[0], invI201 = tmp[1], invI202 = tmp[2], invI210 = tmp[3], invI211 = tmp[4], invI212 = tmp[5], invI220 = tmp[6], invI221 = tmp[7], invI222 = tmp[8];
		let _g = 0, _g1 = this.info.numRows;
		while (_g < _g1) {
			const i = _g++;
			const row = this.info.rows[i];
			const md = this.massData[i].elements;
			const j = row.jacobianN.elements;
			md[0] = j[0] * invM1;
			md[1] = j[1] * invM1;
			md[2] = j[2] * invM1;
			md[3] = j[3] * invM2;
			md[4] = j[4] * invM2;
			md[5] = j[5] * invM2;
			md[6] = invI100 * j[6] + invI101 * j[7] + invI102 * j[8];
			md[7] = invI110 * j[6] + invI111 * j[7] + invI112 * j[8];
			md[8] = invI120 * j[6] + invI121 * j[7] + invI122 * j[8];
			md[9] = invI200 * j[9] + invI201 * j[10] + invI202 * j[11];
			md[10] = invI210 * j[9] + invI211 * j[10] + invI212 * j[11];
			md[11] = invI220 * j[9] + invI221 * j[10] + invI222 * j[11];
			md[36] = invM1 + invM2 + (md[6] * j[6] + md[7] * j[7] +
				md[8] * j[8]) + (md[9] * j[9] + md[10] * j[10] + md[11] * j[11]);
			if (md[36] !== 0) {
				md[36] = 1 / md[36];
			}
			const jt = row.jacobianT.elements;
			const jb = row.jacobianB.elements;
			md[12] = jt[0] * invM1;
			md[13] = jt[1] * invM1;
			md[14] = jt[2] * invM1;
			md[15] = jt[3] * invM2;
			md[16] = jt[4] * invM2;
			md[17] = jt[5] * invM2;
			md[24] = jb[0] * invM1;
			md[25] = jb[1] * invM1;
			md[26] = jb[2] * invM1;
			md[27] = jb[3] * invM2;
			md[28] = jb[4] * invM2;
			md[29] = jb[5] * invM2;
			md[18] = invI100 * jt[6] + invI101 * jt[7] + invI102 * jt[8];
			md[19] = invI110 * jt[6] + invI111 * jt[7] + invI112 * jt[8];
			md[20] = invI120 * jt[6] + invI121 * jt[7] + invI122 * jt[8];
			md[21] = invI200 * jt[9] + invI201 * jt[10] + invI202 * jt[11];
			md[22] = invI210 * jt[9] + invI211 * jt[10] + invI212 * jt[11];
			md[23] = invI220 * jt[9] + invI221 * jt[10] + invI222 * jt[11];
			md[30] = invI100 * jb[6] + invI101 * jb[7] + invI102 * jb[8];
			md[31] = invI110 * jb[6] + invI111 * jb[7] + invI112 * jb[8];
			md[32] = invI120 * jb[6] + invI121 * jb[7] + invI122 * jb[8];
			md[33] = invI200 * jb[9] + invI201 * jb[10] + invI202 * jb[11];
			md[34] = invI210 * jb[9] + invI211 * jb[10] + invI212 * jb[11];
			md[35] = invI220 * jb[9] + invI221 * jb[10] + invI222 * jb[11];
			const invMassTB00 = invM1 + invM2 + (md[18] * jt[6] + md[19] * jt[7] + md[20] * jt[8]) + (md[21] * jt[9] + md[22] * jt[10] + md[23] * jt[11]);
			const invMassTB01 = md[18] * jb[6] + md[19] * jb[7] + md[20] * jb[8] + (md[21] * jb[9] + md[22] * jb[10] + md[23] * jb[11]);
			const invMassTB11 = invM1 + invM2 + (md[30] * jb[6] + md[31] * jb[7] + md[32] * jb[8]) + (md[33] * jb[9] + md[34] * jb[10] + md[35] * jb[11]);
			let invDet = invMassTB00 * invMassTB11 - invMassTB01 * invMassTB01;
			if (invDet !== 0) {
				invDet = 1 / invDet;
			}
			md[37] = invMassTB11 * invDet;
			md[38] = -invMassTB01 * invDet;
			md[39] = -invMassTB01 * invDet;
			md[40] = invMassTB00 * invDet;
		}
	}

	/**
	 * 约束热启动（核心方法）。
	 * 利用上一帧的冲量数据预热当前帧求解，核心逻辑：
	 *              1. 提取刚体当前的线速度/角速度（缓存为局部变量提升效率）
	 *              2. 遍历所有接触点，读取历史冲量数据（法向/切向/副法向）
	 *              3. 按时间步比例（dtRatio）缩放冲量，适配当前帧时间步
	 *              4. 应用冲量到刚体的线速度/角速度，完成热启动
	 *              注：热启动是PGS求解的关键优化，大幅提升收敛速度，减少帧间抖动
	 * @param {TimeStep} timeStep 时间步实例
	 */
	public warmStart(timeStep: TimeStep): void {
		const b1v = this._b1!.vel, b1a = this._b1!.angVel;
		let lv1X = b1v[0], lv1Y = b1v[1], lv1Z = b1v[2];
		const b2v = this._b2!.vel, b2a = this._b2!.angVel;
		let lv2X = b2v[0], lv2Y = b2v[1], lv2Z = b2v[2];
		let av1X = b1a[0], av1Y = b1a[1], av1Z = b1a[2];
		let av2X = b2a[0], av2Y = b2a[1], av2Z = b2a[2];
		let _g = 0, _g1 = this.info.numRows, dtRatio = timeStep.dtRatio;
		while (_g < _g1) {
			const i = _g++;
			const row = this.info.rows[i];
			const imp = row.impulse!.elements;
			const md = this.massData[i].elements;
			const jt = row.jacobianT.elements;
			const jb = row.jacobianB.elements;
			const impulseN = imp[0];
			const impulseT = imp[4] * jt[0] + imp[5] * jt[1] + imp[6] * jt[2];
			const impulseB = imp[4] * jb[0] + imp[5] * jb[1] + imp[6] * jb[2];
			imp[1] = impulseT;
			imp[2] = impulseB;
			imp[0] *= dtRatio;
			imp[1] *= dtRatio;
			imp[2] *= dtRatio;
			lv1X += md[0] * impulseN; lv1Y += md[1] * impulseN; lv1Z += md[2] * impulseN;
			lv1X += md[12] * impulseT; lv1Y += md[13] * impulseT; lv1Z += md[14] * impulseT;
			lv1X += md[24] * impulseB; lv1Y += md[25] * impulseB; lv1Z += md[26] * impulseB;
			lv2X += md[3] * -impulseN; lv2Y += md[4] * -impulseN; lv2Z += md[5] * -impulseN;
			lv2X += md[15] * -impulseT; lv2Y += md[16] * -impulseT; lv2Z += md[17] * -impulseT;
			lv2X += md[27] * -impulseB; lv2Y += md[28] * -impulseB; lv2Z += md[29] * -impulseB;
			av1X += md[6] * impulseN; av1Y += md[7] * impulseN; av1Z += md[8] * impulseN;
			av1X += md[18] * impulseT; av1Y += md[19] * impulseT; av1Z += md[20] * impulseT;
			av1X += md[30] * impulseB; av1Y += md[31] * impulseB; av1Z += md[32] * impulseB;
			av2X += md[9] * -impulseN; av2Y += md[10] * -impulseN; av2Z += md[11] * -impulseN;
			av2X += md[21] * -impulseT; av2Y += md[22] * -impulseT; av2Z += md[23] * -impulseT;
			av2X += md[33] * -impulseB; av2Y += md[34] * -impulseB; av2Z += md[35] * -impulseB;
		}
		b1v[0] = lv1X; b1v[1] = lv1Y; b1v[2] = lv1Z;
		b2v[0] = lv2X; b2v[1] = lv2Y; b2v[2] = lv2Z;
		b1a[0] = av1X; b1a[1] = av1Y; b1a[2] = av1Z;
		b2a[0] = av2X; b2a[1] = av2Y; b2a[2] = av2Z;
	}

	/**
	 * 速度约束求解（核心方法）。
	 * PGS算法的核心实现，分两步求解接触约束的速度修正：
	 *              第一步：求解切向/副法向冲量（摩擦约束）
	 *                 1. 计算切向/副法向相对速度（rvt/rvb）
	 *                 2. 基于2x2有效质量矩阵计算切向/副法向冲量增量
	 *                 3. 应用摩擦锥限制（冲量长度不超过法向冲量×摩擦系数）
	 *                 4. 应用冲量增量到刚体线速度/角速度
	 *              第二步：求解法向冲量（碰撞反弹/穿透约束）
	 *                 1. 计算法向相对速度（rvn）
	 *                 2. 基于法向有效质量计算法向冲量增量
	 *                 3. 限制法向冲量≥0（避免拉力）
	 *                 4. 应用冲量增量到刚体线速度/角速度
	 *              注：先求解切向再求解法向是PGS算法的典型迭代顺序，保证约束收敛
	 */
	public solveVelocity(): void {
		const b1v = this._b1!.vel, b2v = this._b2!.vel;
		let lv1X = b1v[0], lv1Y = b1v[1], lv1Z = b1v[2];
		let lv2X = b2v[0], lv2Y = b2v[1], lv2Z = b2v[2];
		const b1a = this._b1!.angVel, b2a = this._b2!.angVel;
		let av1X = b1a[0], av1Y = b1a[1], av1Z = b1a[2];
		let av2X = b2a[0], av2Y = b2a[1], av2Z = b2a[2];
		let _g = 0, _g1 = this.info.numRows;
		while (_g < _g1) {
			const i = _g++;
			const row = this.info.rows[i];
			const md = this.massData[i].elements;
			const imp = row.impulse!.elements;
			let rvt = 0;
			let j = row.jacobianT.elements;
			rvt += lv1X * j[0] + lv1Y * j[1] + lv1Z * j[2];
			rvt -= lv2X * j[3] + lv2Y * j[4] + lv2Z * j[5];
			rvt += av1X * j[6] + av1Y * j[7] + av1Z * j[8];
			rvt -= av2X * j[9] + av2Y * j[10] + av2Z * j[11];
			let rvb = 0;
			j = row.jacobianB.elements;
			rvb += lv1X * j[0] + lv1Y * j[1] + lv1Z * j[2];
			rvb -= lv2X * j[3] + lv2Y * j[4] + lv2Z * j[5];
			rvb += av1X * j[6] + av1Y * j[7] + av1Z * j[8];
			rvb -= av2X * j[9] + av2Y * j[10] + av2Z * j[11];
			let impulseT = -(rvt * md[37] + rvb * md[38]);
			let impulseB = -(rvt * md[39] + rvb * md[40]);
			const oldImpulseT = imp[1];
			const oldImpulseB = imp[2];
			imp[1] += impulseT;
			imp[2] += impulseB;
			const maxImpulse = row.friction * imp[0];
			if (maxImpulse === 0) {
				imp[1] = 0;
				imp[2] = 0;
			} else {
				const impulseLengthSq = imp[1] * imp[1] + imp[2] * imp[2];
				if (impulseLengthSq > maxImpulse * maxImpulse) {
					const invL = maxImpulse / Math.sqrt(impulseLengthSq);
					imp[1] *= invL;
					imp[2] *= invL;
				}
			}
			impulseT = imp[1] - oldImpulseT;
			impulseB = imp[2] - oldImpulseB;
			lv1X += md[12] * impulseT; lv1Y += md[13] * impulseT; lv1Z += md[14] * impulseT;
			lv1X += md[24] * impulseB; lv1Y += md[25] * impulseB; lv1Z += md[26] * impulseB;
			lv2X += md[15] * -impulseT; lv2Y += md[16] * -impulseT; lv2Z += md[17] * -impulseT;
			lv2X += md[27] * -impulseB; lv2Y += md[28] * -impulseB; lv2Z += md[29] * -impulseB;
			av1X += md[18] * impulseT; av1Y += md[19] * impulseT; av1Z += md[20] * impulseT;
			av1X += md[30] * impulseB; av1Y += md[31] * impulseB; av1Z += md[32] * impulseB;
			av2X += md[21] * -impulseT; av2Y += md[22] * -impulseT; av2Z += md[23] * -impulseT;
			av2X += md[33] * -impulseB; av2Y += md[34] * -impulseB; av2Z += md[35] * -impulseB;
		}
		let _g2 = 0, _g3 = this.info.numRows;
		while (_g2 < _g3) {
			const i = _g2++;
			const row = this.info.rows[i];
			const md = this.massData[i].elements;
			const imp = row.impulse!.elements;
			let rvn = 0;
			const j = row.jacobianN.elements;
			rvn += lv1X * j[0] + lv1Y * j[1] + lv1Z * j[2];
			rvn -= lv2X * j[3] + lv2Y * j[4] + lv2Z * j[5];
			rvn += av1X * j[6] + av1Y * j[7] + av1Z * j[8];
			rvn -= av2X * j[9] + av2Y * j[10] + av2Z * j[11];
			let impulseN = (row.rhs - rvn) * md[36];
			const oldImpulseN = imp[0];
			imp[0] += impulseN;
			if (imp[0] < 0) {
				imp[0] = 0;
			}
			impulseN = imp[0] - oldImpulseN;
			lv1X += md[0] * impulseN; lv1Y += md[1] * impulseN; lv1Z += md[2] * impulseN;
			lv2X += md[3] * -impulseN; lv2Y += md[4] * -impulseN; lv2Z += md[5] * -impulseN;
			av1X += md[6] * impulseN; av1Y += md[7] * impulseN; av1Z += md[8] * impulseN;
			av2X += md[9] * -impulseN; av2Y += md[10] * -impulseN; av2Z += md[11] * -impulseN;
		}
		b1v[0] = lv1X; b1v[1] = lv1Y; b1v[2] = lv1Z;
		b2v[0] = lv2X; b2v[1] = lv2Y; b2v[2] = lv2Z;
		b1a[0] = av1X; b1a[1] = av1Y; b1a[2] = av1Z;
		b2a[0] = av2X; b2a[1] = av2Y; b2a[2] = av2Z;
	}

	/**
	 * 位置约束求解前置处理。
	 * 位置求解前的初始化逻辑，完成以下操作：
	 *              1. 同步接触流形数据（更新接触点深度和位置）
	 *              2. 从接触约束构建位置求解信息（雅克比矩阵、rhs等）
	 *              3. 提取刚体的逆质量、逆转动惯量矩阵
	 *              4. 遍历所有接触点，预计算法向质量数据（仅法向，位置约束不处理切向）
	 *              5. 重置位置冲量（impulse[3]）为0，初始化位置求解状态
	 * @param {TimeStep} timeStep 时间步实例
	 */
	public preSolvePosition(timeStep: TimeStep): void {
		this.constraint.syncManifold();
		this.constraint.getPositionSolverInfo(this.info);
		const invM1 = this._b1!.invMass;
		const invM2 = this._b2!.invMass;
		const ii1 = this._b1!.invInertia;
		const invI100 = ii1[0], invI101 = ii1[1], invI102 = ii1[2], invI110 = ii1[3], invI111 = ii1[4], invI112 = ii1[5], invI120 = ii1[6], invI121 = ii1[7], invI122 = ii1[8];
		const ii2 = this._b2!.invInertia;
		const invI200 = ii2[0], invI201 = ii2[1], invI202 = ii2[2], invI210 = ii2[3], invI211 = ii2[4], invI212 = ii2[5], invI220 = ii2[6], invI221 = ii2[7], invI222 = ii2[8];
		let _g = 0, _g1 = this.info.numRows;
		while (_g < _g1) {
			const i = _g++;
			const md = this.massData[i].elements;
			const j = this.info.rows[i].jacobianN.elements;
			md[0] = j[0] * invM1;
			md[1] = j[1] * invM1;
			md[2] = j[2] * invM1;
			md[3] = j[3] * invM2;
			md[4] = j[4] * invM2;
			md[5] = j[5] * invM2;
			md[6] = invI100 * j[6] + invI101 * j[7] + invI102 * j[8];
			md[7] = invI110 * j[6] + invI111 * j[7] + invI112 * j[8];
			md[8] = invI120 * j[6] + invI121 * j[7] + invI122 * j[8];
			md[9] = invI200 * j[9] + invI201 * j[10] + invI202 * j[11];
			md[10] = invI210 * j[9] + invI211 * j[10] + invI212 * j[11];
			md[11] = invI220 * j[9] + invI221 * j[10] + invI222 * j[11];
			md[36] = invM1 + invM2 + (md[6] * j[6] + md[7] * j[7] + md[8] * j[8]) + (md[9] * j[9] + md[10] * j[10] + md[11] * j[11]);
			if (md[36] !== 0) {
				md[36] = 1 / md[36];
			}
		}
		let _g2 = 0, _g3 = this.info.numRows;
		while (_g2 < _g3) this.info.rows[_g2++].impulse!.elements[3] = 0;
	}

	/**
	 * 分离冲量位置求解。
	 * 基于分离冲量（Split Impulse）的位置修正方法，核心逻辑：
	 *              1. 提取刚体的伪速度（pseudoVel）和角伪速度（angPseudoVel）
	 *              2. 遍历所有接触点，计算法向位置冲量（impulseP）：
	 *                 - 基于位置误差（row.rhs）和法向有效质量计算冲量
	 *                 - 乘以BAUMGARTE系数，控制位置修正强度
	 *                 - 限制冲量≥0（避免拉力）
	 *              3. 应用冲量到伪速度/角伪速度（不影响真实速度）
	 *              注：分离冲量将位置修正与速度修正解耦，避免速度/位置耦合导致的不稳定
	 */
	public solvePositionSplitImpulse(): void {
		const PSB = CONSTANT.SETTING_POSITION_SPLIT_IMPULSE_BAUMGARTE;
		const pv1 = this._b1!.pseudoVel, av1 = this._b1!.angPseudoVel;
		let lv1X = pv1[0], lv1Y = pv1[1], lv1Z = pv1[2];
		const pv2 = this._b2!.pseudoVel, av2 = this._b2!.angPseudoVel;
		let lv2X = pv2[0], lv2Y = pv2[1], lv2Z = pv2[2];
		let av1X = av1[0], av1Y = av1[1], av1Z = av1[2];
		let av2X = av2[0], av2Y = av2[1], av2Z = av2[2];
		let _g = 0, _g1 = this.info.numRows;
		while (_g < _g1) {
			const i = _g++;
			const row = this.info.rows[i];
			const md = this.massData[i].elements;
			const imp = row.impulse!.elements;
			const j = row.jacobianN.elements;
			let rvn = 0;
			rvn += lv1X * j[0] + lv1Y * j[1] + lv1Z * j[2];
			rvn -= lv2X * j[3] + lv2Y * j[4] + lv2Z * j[5];
			rvn += av1X * j[6] + av1Y * j[7] + av1Z * j[8];
			rvn -= av2X * j[9] + av2Y * j[10] + av2Z * j[11];
			let impulseP = (row.rhs - rvn) * md[36] * PSB;
			const oldImpulseP = imp[3];
			imp[3] += impulseP;
			if (imp[3] < 0) {
				imp[3] = 0;
			}
			impulseP = imp[3] - oldImpulseP;
			lv1X += md[0] * impulseP; lv1Y += md[1] * impulseP; lv1Z += md[2] * impulseP;
			lv2X += md[3] * -impulseP; lv2Y += md[4] * -impulseP; lv2Z += md[5] * -impulseP;
			av1X += md[6] * impulseP; av1Y += md[7] * impulseP; av1Z += md[8] * impulseP;
			av2X += md[9] * -impulseP; av2Y += md[10] * -impulseP; av2Z += md[11] * -impulseP;
		}
		pv1[0] = lv1X; pv1[1] = lv1Y; pv1[2] = lv1Z;
		pv2[0] = lv2X; pv2[1] = lv2Y; pv2[2] = lv2Z;
		av1[0] = av1X; av1[1] = av1Y; av1[2] = av1Z;
		av2[0] = av2X; av2[1] = av2Y; av2[2] = av2Z;
	}

	/**
	 * NGS位置约束求解（核心方法）。
	 * 基于高斯-塞德尔（NGS）迭代的位置约束求解，完成以下核心操作：
	 *              1. 同步接触流形，重建位置求解信息
	 *              2. 预计算法向质量数据（同preSolvePosition）
	 *              3. 计算位置冲量并限制≥0
	 *              4. 应用位置冲量到刚体变换（tf1/tf2）：
	 *                 - 更新刚体位置（平移）
	 *                 - 计算旋转增量（四元数），更新刚体旋转矩阵
	 *                 - 重新计算刚体的世界空间逆转动惯量矩阵
	 *              注：NGS位置求解直接修改刚体的位置/旋转，是高精度位置修正的核心方法，
	 *                  包含四元数插值、旋转矩阵更新、惯量矩阵变换等关键几何计算
	 * @param {TimeStep} timeStep 时间步实例
	 */
	public solvePositionNgs(timeStep: TimeStep): void {
		const PNB = CONSTANT.SETTING_POSITION_NGS_BAUMGARTE;
		this.constraint.syncManifold();
		this.constraint.getPositionSolverInfo(this.info);
		const invM1 = this._b1!.invMass, tf1 = this._b1!.transform.elements, il1 = this._b1!.invLocalInertia, ii1 = this._b1!.invInertia, rf1 = this._b1!.rotFactor.elements;
		const invM2 = this._b2!.invMass, tf2 = this._b2!.transform.elements, ii2 = this._b2!.invInertia, il2 = this._b2!.invLocalInertia, rf2 = this._b2!.rotFactor.elements;
		const invI100 = ii1[0], invI101 = ii1[1], invI102 = ii1[2], invI110 = ii1[3], invI111 = ii1[4], invI112 = ii1[5], invI120 = ii1[6], invI121 = ii1[7], invI122 = ii1[8];
		const invI200 = ii2[0], invI201 = ii2[1], invI202 = ii2[2], invI210 = ii2[3], invI211 = ii2[4], invI212 = ii2[5], invI220 = ii2[6], invI221 = ii2[7], invI222 = ii2[8];
		let _g = 0, _g1 = this.info.numRows;
		while (_g < _g1) {
			const i = _g++;
			const md = this.massData[i].elements;
			const j = this.info.rows[i].jacobianN.elements;
			md[0] = j[0] * invM1;
			md[1] = j[1] * invM1;
			md[2] = j[2] * invM1;
			md[3] = j[3] * invM2;
			md[4] = j[4] * invM2;
			md[5] = j[5] * invM2;
			md[6] = invI100 * j[6] + invI101 * j[7] + invI102 * j[8];
			md[7] = invI110 * j[6] + invI111 * j[7] + invI112 * j[8];
			md[8] = invI120 * j[6] + invI121 * j[7] + invI122 * j[8];
			md[9] = invI200 * j[9] + invI201 * j[10] + invI202 * j[11];
			md[10] = invI210 * j[9] + invI211 * j[10] + invI212 * j[11];
			md[11] = invI220 * j[9] + invI221 * j[10] + invI222 * j[11];
			md[36] = invM1 + invM2 + (md[6] * j[6] + md[7] * j[7] + md[8] * j[8]) + (md[9] * j[9] + md[10] * j[10] + md[11] * j[11]);
			if (md[36] !== 0) {
				md[36] = 1 / md[36];
			}
		}
		let lv1X = 0, lv1Y = 0, lv1Z = 0;
		let lv2X = 0, lv2Y = 0, lv2Z = 0;
		let av1X = 0, av1Y = 0, av1Z = 0;
		let av2X = 0, av2Y = 0, av2Z = 0;
		let _g2 = 0, _g3 = this.info.numRows;
		while (_g2 < _g3) {
			const i = _g2++;
			const row = this.info.rows[i];
			const md = this.massData[i].elements;
			const imp = row.impulse!.elements;
			const j = row.jacobianN.elements;
			let rvn = 0;
			rvn += lv1X * j[0] + lv1Y * j[1] + lv1Z * j[2];
			rvn -= lv2X * j[3] + lv2Y * j[4] + lv2Z * j[5];
			rvn += av1X * j[6] + av1Y * j[7] + av1Z * j[8];
			rvn -= av2X * j[9] + av2Y * j[10] + av2Z * j[11];
			let impulseP = (row.rhs - rvn) * md[36] * PNB;
			const oldImpulseP = imp[3];
			imp[3] += impulseP;
			if (imp[3] < 0) {
				imp[3] = 0;
			}
			impulseP = imp[3] - oldImpulseP;
			lv1X += md[0] * impulseP; lv1Y += md[1] * impulseP; lv1Z += md[2] * impulseP;
			lv2X += md[3] * -impulseP; lv2Y += md[4] * -impulseP; lv2Z += md[5] * -impulseP;
			av1X += md[6] * impulseP; av1Y += md[7] * impulseP; av1Z += md[8] * impulseP;
			av2X += md[9] * -impulseP; av2Y += md[10] * -impulseP; av2Z += md[11] * -impulseP;
		}
		tf1[0] += lv1X; tf1[1] += lv1Y; tf1[2] += lv1Z;
		tf2[0] += lv2X; tf2[1] += lv2Y; tf2[2] += lv2Z;
		const theta = Math.sqrt(av1X * av1X + av1Y * av1Y + av1Z * av1Z);
		const halfTheta = theta * 0.5;
		let rotationToSinAxisFactor: number;
		let cosHalfTheta: number;
		if (halfTheta < 0.5) {
			const ht2 = halfTheta * halfTheta;
			rotationToSinAxisFactor = 0.5 * (1 - ht2 * 0.16666666666666666 + ht2 * ht2 * 0.0083333333333333332);
			cosHalfTheta = 1 - ht2 * 0.5 + ht2 * ht2 * 0.041666666666666664;
		} else {
			rotationToSinAxisFactor = Math.sin(halfTheta) / theta;
			cosHalfTheta = Math.cos(halfTheta);
		}
		const sinAxisX = av1X * rotationToSinAxisFactor, sinAxisY = av1Y * rotationToSinAxisFactor, sinAxisZ = av1Z * rotationToSinAxisFactor;
		const dqX = sinAxisX, dqY = sinAxisY, dqZ = sinAxisZ, dqW = cosHalfTheta;
		let qX: number, qY: number, qZ: number, qW: number;

		const e00 = tf1[3];
		const e11 = tf1[7];
		const e22 = tf1[11];
		const t = e00 + e11 + e22;
		let s: number;
		if (t > 0) {
			s = Math.sqrt(t + 1);
			qW = 0.5 * s;
			s = 0.5 / s;
			qX = (tf1[10] - tf1[8]) * s; qY = (tf1[5] - tf1[9]) * s; qZ = (tf1[6] - tf1[4]) * s;
		} else if (e00 > e11) {
			if (e00 > e22) {
				s = Math.sqrt(e00 - e11 - e22 + 1);
				qX = 0.5 * s;
				s = 0.5 / s;
				qY = (tf1[4] + tf1[6]) * s; qZ = (tf1[5] + tf1[9]) * s; qW = (tf1[10] - tf1[8]) * s;
			} else {
				s = Math.sqrt(e22 - e00 - e11 + 1);
				qZ = 0.5 * s;
				s = 0.5 / s;
				qX = (tf1[5] + tf1[9]) * s; qY = (tf1[8] + tf1[10]) * s; qW = (tf1[6] - tf1[4]) * s;
			}
		} else if (e11 > e22) {
			s = Math.sqrt(e11 - e22 - e00 + 1);
			qY = 0.5 * s;
			s = 0.5 / s;
			qX = (tf1[4] + tf1[6]) * s; qZ = (tf1[8] + tf1[10]) * s; qW = (tf1[5] - tf1[9]) * s;
		} else {
			s = Math.sqrt(e22 - e00 - e11 + 1);
			qZ = 0.5 * s;
			s = 0.5 / s;
			qX = (tf1[5] + tf1[9]) * s; qY = (tf1[8] + tf1[10]) * s; qW = (tf1[6] - tf1[4]) * s;
		}
		qX = dqW * qX + dqX * qW + dqY * qZ - dqZ * qY;
		qY = dqW * qY - dqX * qZ + dqY * qW + dqZ * qX;
		qZ = dqW * qZ + dqX * qY - dqY * qX + dqZ * qW;
		qW = dqW * qW - dqX * qX - dqY * qY - dqZ * qZ;
		let l = qX * qX + qY * qY + qZ * qZ + qW * qW;
		if (l > 1e-32) {
			l = 1 / Math.sqrt(l);
		}
		qX *= l; qY *= l; qZ *= l; qW *= l;
		const x2 = 2 * qX, y2 = 2 * qY, z2 = 2 * qZ;
		const xx = qX * x2, yy = qY * y2, zz = qZ * z2;
		const xy = qX * y2, yz = qY * z2, xz = qX * z2;
		const wx = qW * x2, wy = qW * y2, wz = qW * z2;
		tf1[3] = 1 - yy - zz;
		tf1[4] = xy - wz;
		tf1[5] = xz + wy;
		tf1[6] = xy + wz;
		tf1[7] = 1 - xx - zz;
		tf1[8] = yz - wx;
		tf1[9] = xz - wy;
		tf1[10] = yz + wx;
		tf1[11] = 1 - xx - yy;
		ii1[0] = tf1[3] * il1[0] + tf1[4] * il1[3] + tf1[5] * il1[6];
		ii1[1] = tf1[3] * il1[1] + tf1[4] * il1[4] + tf1[5] * il1[7];
		ii1[2] = tf1[3] * il1[2] + tf1[4] * il1[5] + tf1[5] * il1[8];
		ii1[3] = tf1[6] * il1[0] + tf1[7] * il1[3] + tf1[8] * il1[6];
		ii1[4] = tf1[6] * il1[1] + tf1[7] * il1[4] + tf1[8] * il1[7];
		ii1[5] = tf1[6] * il1[2] + tf1[7] * il1[5] + tf1[8] * il1[8];
		ii1[6] = tf1[9] * il1[0] + tf1[10] * il1[3] + tf1[11] * il1[6];
		ii1[7] = tf1[9] * il1[1] + tf1[10] * il1[4] + tf1[11] * il1[7];
		ii1[8] = tf1[9] * il1[2] + tf1[10] * il1[5] + tf1[11] * il1[8];
		const __tmp__001 = ii1[0] * tf1[3] + ii1[1] * tf1[4] + ii1[2] * tf1[5];
		const __tmp__011 = ii1[0] * tf1[6] + ii1[1] * tf1[7] + ii1[2] * tf1[8];
		const __tmp__021 = ii1[0] * tf1[9] + ii1[1] * tf1[10] + ii1[2] * tf1[11];
		const __tmp__101 = ii1[3] * tf1[3] + ii1[4] * tf1[4] + ii1[5] * tf1[5];
		const __tmp__111 = ii1[3] * tf1[6] + ii1[4] * tf1[7] + ii1[5] * tf1[8];
		const __tmp__121 = ii1[3] * tf1[9] + ii1[4] * tf1[10] + ii1[5] * tf1[11];
		const __tmp__201 = ii1[6] * tf1[3] + ii1[7] * tf1[4] + ii1[8] * tf1[5];
		const __tmp__211 = ii1[6] * tf1[6] + ii1[7] * tf1[7] + ii1[8] * tf1[8];
		const __tmp__221 = ii1[6] * tf1[9] + ii1[7] * tf1[10] + ii1[8] * tf1[11];
		ii1[0] = __tmp__001; ii1[1] = __tmp__011; ii1[2] = __tmp__021;
		ii1[3] = __tmp__101; ii1[4] = __tmp__111; ii1[5] = __tmp__121;
		ii1[6] = __tmp__201; ii1[7] = __tmp__211; ii1[8] = __tmp__221;
		ii1[0] *= rf1[0]; ii1[1] *= rf1[0]; ii1[2] *= rf1[0];
		ii1[3] *= rf1[1]; ii1[4] *= rf1[1]; ii1[5] *= rf1[1];
		ii1[6] *= rf1[2]; ii1[7] *= rf1[2]; ii1[8] *= rf1[2];

		const theta1 = Math.sqrt(av2X * av2X + av2Y * av2Y + av2Z * av2Z);
		const halfTheta1 = theta1 * 0.5;
		let rotationToSinAxisFactor1: number;
		let cosHalfTheta1: number;
		if (halfTheta1 < 0.5) {
			const ht2 = halfTheta1 * halfTheta1;
			rotationToSinAxisFactor1 = 0.5 * (1 - ht2 * 0.16666666666666666 + ht2 * ht2 * 0.0083333333333333332);
			cosHalfTheta1 = 1 - ht2 * 0.5 + ht2 * ht2 * 0.041666666666666664;
		} else {
			rotationToSinAxisFactor1 = Math.sin(halfTheta1) / theta1;
			cosHalfTheta1 = Math.cos(halfTheta1);
		}
		const sinAxisX1 = av2X * rotationToSinAxisFactor1, sinAxisY1 = av2Y * rotationToSinAxisFactor1, sinAxisZ1 = av2Z * rotationToSinAxisFactor1;
		const dqX1 = sinAxisX1, dqY1 = sinAxisY1, dqZ1 = sinAxisZ1, dqW1 = cosHalfTheta1;
		let qX1: number, qY1: number, qZ1: number, qW1: number;
		const e001 = tf2[3];
		const e111 = tf2[7];
		const e221 = tf2[11];
		const t1 = e001 + e111 + e221;
		let s1: number;
		if (t1 > 0) {
			s1 = Math.sqrt(t1 + 1);
			qW1 = 0.5 * s1;
			s1 = 0.5 / s1;
			qX1 = (tf2[10] - tf2[8]) * s1; qY1 = (tf2[5] - tf2[9]) * s1; qZ1 = (tf2[6] - tf2[4]) * s1;
		} else if (e001 > e111) {
			if (e001 > e221) {
				s1 = Math.sqrt(e001 - e111 - e221 + 1);
				qX1 = 0.5 * s1;
				s1 = 0.5 / s1;
				qY1 = (tf2[4] + tf2[6]) * s1; qZ1 = (tf2[5] + tf2[9]) * s1; qW1 = (tf2[10] - tf2[8]) * s1;
			} else {
				s1 = Math.sqrt(e221 - e001 - e111 + 1);
				qZ1 = 0.5 * s1;
				s1 = 0.5 / s1;
				qX1 = (tf2[5] + tf2[9]) * s1; qY1 = (tf2[8] + tf2[10]) * s1; qW1 = (tf2[6] - tf2[4]) * s1;
			}
		} else if (e111 > e221) {
			s1 = Math.sqrt(e111 - e221 - e001 + 1);
			qY1 = 0.5 * s1;
			s1 = 0.5 / s1;
			qX1 = (tf2[4] + tf2[6]) * s1; qZ1 = (tf2[8] + tf2[10]) * s1; qW1 = (tf2[5] - tf2[9]) * s1;
		} else {
			s1 = Math.sqrt(e221 - e001 - e111 + 1);
			qZ1 = 0.5 * s1;
			s1 = 0.5 / s1;
			qX1 = (tf2[5] + tf2[9]) * s1; qY1 = (tf2[8] + tf2[10]) * s1; qW1 = (tf2[6] - tf2[4]) * s1;
		}
		qX1 = dqW1 * qX1 + dqX1 * qW1 + dqY1 * qZ1 - dqZ1 * qY1;
		qY1 = dqW1 * qY1 - dqX1 * qZ1 + dqY1 * qW1 + dqZ1 * qX1;
		qZ1 = dqW1 * qZ1 + dqX1 * qY1 - dqY1 * qX1 + dqZ1 * qW1;
		qW1 = dqW1 * qW1 - dqX1 * qX1 - dqY1 * qY1 - dqZ1 * qZ1;
		let l1 = qX1 * qX1 + qY1 * qY1 + qZ1 * qZ1 + qW1 * qW1;
		if (l1 > 1e-32) {
			l1 = 1 / Math.sqrt(l1);
		}
		qX1 *= l1; qY1 *= l1; qZ1 *= l1; qW1 *= l1;
		const x21 = 2 * qX1, y21 = 2 * qY1, z21 = 2 * qZ1;
		const xx1 = qX1 * x21, yy1 = qY1 * y21, zz1 = qZ1 * z21;
		const xy1 = qX1 * y21, yz1 = qY1 * z21, xz1 = qX1 * z21;
		const wx1 = qW1 * x21, wy1 = qW1 * y21, wz1 = qW1 * z21;
		tf2[3] = 1 - yy1 - zz1;
		tf2[4] = xy1 - wz1;
		tf2[5] = xz1 + wy1;
		tf2[6] = xy1 + wz1;
		tf2[7] = 1 - xx1 - zz1;
		tf2[8] = yz1 - wx1;
		tf2[9] = xz1 - wy1;
		tf2[10] = yz1 + wx1;
		tf2[11] = 1 - xx1 - yy1;
		ii2[0] = tf2[3] * il2[0] + tf2[4] * il2[3] + tf2[5] * il2[6];
		ii2[1] = tf2[3] * il2[1] + tf2[4] * il2[4] + tf2[5] * il2[7];
		ii2[2] = tf2[3] * il2[2] + tf2[4] * il2[5] + tf2[5] * il2[8];
		ii2[3] = tf2[6] * il2[0] + tf2[7] * il2[3] + tf2[8] * il2[6];
		ii2[4] = tf2[6] * il2[1] + tf2[7] * il2[4] + tf2[8] * il2[7];
		ii2[5] = tf2[6] * il2[2] + tf2[7] * il2[5] + tf2[8] * il2[8];
		ii2[6] = tf2[9] * il2[0] + tf2[10] * il2[3] + tf2[11] * il2[6];
		ii2[7] = tf2[9] * il2[1] + tf2[10] * il2[4] + tf2[11] * il2[7];
		ii2[8] = tf2[9] * il2[2] + tf2[10] * il2[5] + tf2[11] * il2[8];
		const __tmp__003 = ii2[0] * tf2[3] + ii2[1] * tf2[4] + ii2[2] * tf2[5];
		const __tmp__013 = ii2[0] * tf2[6] + ii2[1] * tf2[7] + ii2[2] * tf2[8];
		const __tmp__023 = ii2[0] * tf2[9] + ii2[1] * tf2[10] + ii2[2] * tf2[11];
		const __tmp__103 = ii2[3] * tf2[3] + ii2[4] * tf2[4] + ii2[5] * tf2[5];
		const __tmp__113 = ii2[3] * tf2[6] + ii2[4] * tf2[7] + ii2[5] * tf2[8];
		const __tmp__123 = ii2[3] * tf2[9] + ii2[4] * tf2[10] + ii2[5] * tf2[11];
		const __tmp__203 = ii2[6] * tf2[3] + ii2[7] * tf2[4] + ii2[8] * tf2[5];
		const __tmp__213 = ii2[6] * tf2[6] + ii2[7] * tf2[7] + ii2[8] * tf2[8];
		const __tmp__223 = ii2[6] * tf2[9] + ii2[7] * tf2[10] + ii2[8] * tf2[11];
		ii2[0] = __tmp__003; ii2[1] = __tmp__013; ii2[2] = __tmp__023;
		ii2[3] = __tmp__103; ii2[4] = __tmp__113; ii2[5] = __tmp__123;
		ii2[6] = __tmp__203; ii2[7] = __tmp__213; ii2[8] = __tmp__223;
		ii2[0] *= rf2[0]; ii2[1] *= rf2[0]; ii2[2] *= rf2[0];
		ii2[3] *= rf2[1]; ii2[4] *= rf2[1]; ii2[5] *= rf2[1];
		ii2[6] *= rf2[2]; ii2[7] *= rf2[2]; ii2[8] *= rf2[2];
	}

	/**
	 * 约束求解后置回调（核心收尾方法）。
	 * 整个约束求解流程的最终收尾逻辑，完成以下关键操作：
	 *              1. 重构切向/副法向冲量的矢量形式（存储到impulse[4-6]）
	 *              2. 累计接触冲量到刚体的linearContactImpulse/angularContactImpulse
	 *                 - 用于刚体的冲量统计、碰撞回调等业务逻辑
	 *              3. 同步接触流形数据，确保流形与刚体最新位置一致
	 *              注：冲量累计是物理引擎中碰撞反馈、力统计的核心数据来源
	 */
	public postSolve(): void {
		let lin1X = 0, lin1Y = 0, lin1Z = 0;
		let ang1X = 0, ang1Y = 0, ang1Z = 0;
		let ang2X = 0, ang2Y = 0, ang2Z = 0;
		let _g = 0, _g1 = this.info.numRows;
		while (_g < _g1) {
			const row = this.info.rows[_g++];
			const imp = row.impulse!.elements;
			const jn = row.jacobianN.elements;
			const jt = row.jacobianT.elements;
			const jb = row.jacobianB.elements;
			const impN = imp[0];
			const impT = imp[1];
			const impB = imp[2];
			let impulseLX = 0, impulseLY = 0, impulseLZ = 0;
			impulseLX += jt[0] * impT; impulseLY += jt[1] * impT; impulseLZ += jt[2] * impT;
			impulseLX += jb[0] * impB; impulseLY += jb[1] * impB; impulseLZ += jb[2] * impB;
			imp[4] = impulseLX;
			imp[5] = impulseLY;
			imp[6] = impulseLZ;
			lin1X += jn[0] * impN; lin1Y += jn[1] * impN; lin1Z += jn[2] * impN;
			ang1X += jn[6] * impN; ang1Y += jn[7] * impN; ang1Z += jn[8] * impN;
			ang2X += jn[9] * impN; ang2Y += jn[10] * impN; ang2Z += jn[11] * impN;
			lin1X += jt[0] * impT; lin1Y += jt[1] * impT; lin1Z += jt[2] * impT;
			ang1X += jt[6] * impT; ang1Y += jt[7] * impT; ang1Z += jt[8] * impT;
			ang2X += jt[9] * impT; ang2Y += jt[10] * impT; ang2Z += jt[11] * impT;
			lin1X += jb[0] * impB; lin1Y += jb[1] * impB; lin1Z += jb[2] * impB;
			ang1X += jb[6] * impB; ang1Y += jb[7] * impB; ang1Z += jb[8] * impB;
			ang2X += jb[9] * impB; ang2Y += jb[10] * impB; ang2Z += jb[11] * impB;
		}
		let tmp = this._b1!.linearContactImpulse;
		tmp[0] += lin1X; tmp[1] += lin1Y; tmp[2] += lin1Z;
		tmp = this._b1!.angularContactImpulse;
		tmp[0] += ang1X; tmp[1] += ang1Y; tmp[2] += ang1Z;
		tmp = this._b2!.linearContactImpulse;
		tmp[0] -= lin1X; tmp[1] -= lin1Y; tmp[2] -= lin1Z;
		tmp = this._b2!.angularContactImpulse;
		tmp[0] -= ang2X; tmp[1] -= ang2Y; tmp[2] -= ang2Z;
		this.constraint.syncManifold();
	}
}

export { PgsContactConstraintSolver };