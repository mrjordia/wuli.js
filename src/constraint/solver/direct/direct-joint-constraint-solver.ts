import ConstraintSolver from "../constraint-solver";
import JointSolverInfo from "../../joint/joint-solver-info";
import { CONSTANT, POSITION_CORRECTION_ALGORITHM } from '../../../constant';
import MassMatrix from "./mass-matrix";
import BoundaryBuilder from "./boundary-builder";
import JointSolverMassDataRow from "../../joint/joint-solver-mass-data-row";
import BoundarySelector from "./boundary-selector";
import Joint from "../../joint/joint";
import TimeStep from "../../../common/time-step";

/**
 * 直接关节约束求解器类。
 * 继承自基础约束求解器，采用直接求解策略处理关节的速度/位置约束，核心职责包括：
 *              1. 初始化关节求解所需的质量矩阵、边界构建器、冲量数组等核心数据结构
 *              2. 处理关节约束的预热启动（Warm Start），复用上一帧冲量提升求解稳定性
 *              3. 求解速度约束，计算满足关节限制的冲量并更新刚体速度
 *              4. 求解位置约束（分离冲量/NGS算法），修正刚体位置以消除关节穿透
 *              5. 完成求解后同步关节锚点并检查关节销毁状态
 *              是物理引擎中关节约束响应计算的核心实现类
 */
export default class DirectJointConstraintSolver extends ConstraintSolver {
	/**
	 * 当前求解器绑定的关节实例。
	 * 求解器唯一关联的关节对象，所有约束求解逻辑均围绕该关节展开
	 */
	public joint: Joint;

	/**
	 * 关节求解器核心信息容器。
	 * 存储关节求解所需的雅可比矩阵、冲量限制、电机参数、刚体引用等核心数据，是约束求解的核心数据源
	 */
	public info = new JointSolverInfo();

	/**
	 * 质量矩阵实例。
	 * 用于存储和计算刚体的逆质量/逆惯性张量相关数据，是约束冲量计算的核心矩阵
	 */
	public massMatrix: MassMatrix;

	/**
	 * 边界构建器实例。
	 * 用于构建约束的边界条件（如冲量上下限），生成求解所需的边界约束集合
	 */
	public boundaryBuilder: BoundaryBuilder;

	/**
	 * 关节求解器质量数据行数组。
	 * 预分配固定长度的质量数据行数组，每行对应一个约束行的质量相关数据（逆质量、逆惯性张量等），
	 *              长度由CONSTANT.SETTING_MAX_JACOBIAN_ROWS指定
	 */
	public massData: Array<JointSolverMassDataRow>;

	/**
	 * 速度约束的边界选择器。
	 * 用于选择速度约束求解时需要处理的边界约束，优化求解效率
	 */
	public velBoundarySelector: BoundarySelector;

	/**
	 * 位置约束的边界选择器。
	 * 用于选择位置约束求解时需要处理的边界约束，优化求解效率
	 */
	public posBoundarySelector: BoundarySelector;

	/**
	 * 相对速度数组。
	 * 长度为SETTING_MAX_JACOBIAN_ROWS的浮点数组，存储每个约束行计算出的刚体相对速度
	 */
	public relVels: Float64Array;

	/**
	 * 冲量数组。
	 * 长度为SETTING_MAX_JACOBIAN_ROWS的浮点数组，存储每个约束行的当前冲量值
	 */
	public impulses: Float64Array;

	/**
	 * 冲量增量数组。
	 * 长度为SETTING_MAX_JACOBIAN_ROWS的浮点数组，存储每次迭代中冲量的变化量
	 */
	public dImpulses: Float64Array;

	/**
	 * 总冲量增量数组。
	 * 长度为SETTING_MAX_JACOBIAN_ROWS的浮点数组，存储累计的冲量变化量
	 */
	public dTotalImpulses: Float64Array;

	/**
	 * 构造函数：初始化关节约束求解器。
	 * 核心初始化逻辑：
	 *              1. 绑定目标关节，初始化父类
	 *              2. 基于最大雅可比行数预分配质量矩阵、边界构建器、质量数据行数组
	 *              3. 初始化速度/位置边界选择器，预分配冲量相关浮点数组并置0
	 *              所有数组均预分配内存，避免运行时动态创建，减少GC开销
	 * @param {Joint} joint 待求解的关节实例
	 */
	constructor(joint: Joint) {
		super();
		this.joint = joint;
		let maxRows = CONSTANT.SETTING_MAX_JACOBIAN_ROWS;
		this.massMatrix = new MassMatrix(maxRows);
		this.boundaryBuilder = new BoundaryBuilder(maxRows);
		this.massData = new Array(maxRows);
		let _g = 0;
		let _g1 = this.massData.length;
		while (_g < _g1) this.massData[_g++] = new JointSolverMassDataRow();
		const numMaxBoundaries = this.boundaryBuilder.boundaries.length;
		this.velBoundarySelector = new BoundarySelector(numMaxBoundaries);
		this.posBoundarySelector = new BoundarySelector(numMaxBoundaries);
		this.relVels = new Float64Array(maxRows);
		this.impulses = new Float64Array(maxRows);
		this.dImpulses = new Float64Array(maxRows);
		this.dTotalImpulses = new Float64Array(maxRows);
		let _g2 = 0;
		while (_g2 < maxRows) {
			const i = _g2++;
			this.relVels[i] = 0;
			this.impulses[i] = 0;
			this.dImpulses[i] = 0;
			this.dTotalImpulses[i] = 0;
		}
	}

	/**
	 * 速度约束求解前置处理。
	 * 速度求解前的准备工作：
	 *              1. 同步关节锚点坐标，确保锚点与刚体当前位置一致
	 *              2. 获取关节速度求解信息，为父类的_b1/_b2赋值（缓存关联的两个刚体）
	 *              3. 计算逆质量矩阵并填充massData数组
	 *              4. 重置边界构建器状态，递归构建约束边界
	 *              5. 调整边界选择器的索引顺序，优化后续求解效率
	 * @param {TimeStep} timeStep 时间步信息 - 包含dt、dtRatio等时间相关参数
	 */
	public preSolveVelocity(timeStep: TimeStep): void {
		this.joint.syncAnchors();
		this.joint.getVelocitySolverInfo(timeStep, this.info);
		this._b1 = this.info.rigidBody1!;
		this._b2 = this.info.rigidBody2!;
		this.massMatrix.computeInvMass(this.info, this.massData);
		const _this = this.boundaryBuilder;
		_this.numBoundaries = 0;
		const _this1 = _this.bbInfo;
		_this1.numBounded = 0;
		_this1.numUnbounded = 0;
		_this.buildBoundariesRecursive(this.info, 0);
		const _this2 = this.velBoundarySelector;
		const size = this.boundaryBuilder.numBoundaries;
		let numSmaller = 0;
		let numGreater = 0;
		let _g = 0;
		let _g1 = _this2.n;
		while (_g < _g1) {
			const idx = _this2.indices[_g++];
			if (idx < size) {
				_this2.tmpIndices[numSmaller] = idx;
				++numSmaller;
			} else {
				_this2.tmpIndices[size + numGreater] = idx;
				++numGreater;
			}
		}
		const tmp = _this2.indices;
		_this2.indices = _this2.tmpIndices;
		_this2.tmpIndices = tmp;
	}

	/**
	 * 约束求解预热启动。
	 * 复用上一帧的冲量数据，提升约束求解的稳定性和收敛速度：
	 *              1. 根据位置修正算法类型（Baumgarte/普通）计算预热因子
	 *              2. 若因子无效则重置所有冲量为0，否则按因子缩放上一帧冲量
	 *              3. 基于缩放后的冲量更新刚体的线速度/角速度，完成预热
	 * @param {TimeStep} timeStep 时间步信息 - 包含dt、dtRatio等时间相关参数
	 */
	public warmStart(timeStep: TimeStep): void {
		const PCB = POSITION_CORRECTION_ALGORITHM.BAUMGARTE;
		const WSB = CONSTANT.SETTING_JOINT_WARM_STARTING_FACTOR_FOR_BAUNGARTE;
		const WSF = CONSTANT.SETTING_JOINT_WARM_STARTING_FACTOR;
		let factor = this.joint.positionCorrectionAlgorithm === PCB ? WSB : WSF;
		factor *= timeStep.dtRatio;
		if (factor <= 0) {
			let _g = 0;
			let _g1 = this.info.numRows;
			while (_g < _g1) {
				const _this = this.info.rows[_g++].impulse!;
				_this.impulse = 0;
				_this.impulseM = 0;
				_this.impulseP = 0;
			}
			return;
		}
		let _g = 0;
		let _g1 = this.info.numRows;
		while (_g < _g1) {
			const i = _g++;
			const row = this.info.rows[i];
			const imp = row.impulse!;
			let impulse = imp.impulse * factor;
			if (impulse < row.minImpulse) {
				impulse = row.minImpulse;
			} else if (impulse > row.maxImpulse) {
				impulse = row.maxImpulse;
			}
			imp.impulse = impulse;
			if (row.motorMaxImpulse > 0) {
				let impulseM = imp.impulseM * factor;
				const max = row.motorMaxImpulse;
				if (impulseM < -max) {
					impulseM = -max;
				} else if (impulseM > max) {
					impulseM = max;
				}
				imp.impulseM = impulseM;
			} else {
				imp.impulseM = 0;
			}
			this.dImpulses[i] = imp.impulse + imp.impulseM;
		}
		const impulses = this.dImpulses;
		let linearSet = false;
		let angularSet = false;
		const b1v = this._b1!.vel;
		let lv1X = b1v[0], lv1Y = b1v[1], lv1Z = b1v[2];
		const b2v = this._b2!.vel;
		let lv2X = b2v[0], lv2Y = b2v[1], lv2Z = b2v[2];
		const b1a = this._b1!.angVel;
		let av1X = b1a[0], av1Y = b1a[1], av1Z = b1a[2];
		const b2a = this._b2!.angVel;
		let av2X = b2a[0], av2Y = b2a[1], av2Z = b2a[2];
		let _g2 = 0;
		let _g3 = this.info.numRows;
		while (_g2 < _g3) {
			const i = _g2++;
			const j = this.info.rows[i].jacobian.elements;
			const md = this.massData[i].elements;
			const imp = impulses[i];
			if ((j[12] & 1) !== 0) {
				lv1X += md[0] * imp; lv1Y += md[1] * imp; lv1Z += md[2] * imp;
				lv2X += md[3] * -imp; lv2Y += md[4] * -imp; lv2Z += md[5] * -imp;
				linearSet = true;
			}
			if ((j[12] & 2) !== 0) {
				av1X += md[6] * imp; av1Y += md[7] * imp; av1Z += md[8] * imp;
				av2X += md[9] * -imp; av2Y += md[10] * -imp; av2Z += md[11] * -imp;
				angularSet = true;
			}
		}
		if (linearSet) {
			b1v[0] = lv1X; b1v[1] = lv1Y; b1v[2] = lv1Z;
			b2v[0] = lv2X; b2v[1] = lv2Y; b2v[2] = lv2Z;
		}
		if (angularSet) {
			b1a[0] = av1X; b1a[1] = av1Y; b1a[2] = av1Z;
			b2a[0] = av2X; b2a[1] = av2Y; b2a[2] = av2Z;
		}
	}

	/**
	 * 速度约束求解核心逻辑。
	 * 计算满足关节速度约束的冲量并更新刚体速度：
	 *              1. 计算每个约束行的刚体相对速度，初始化冲量相关数组
	 *              2. 处理电机约束，计算电机冲量并更新相对速度
	 *              3. 通过边界选择器求解约束冲量，更新刚体线速度/角速度
	 *              4. 若求解失败则输出日志提示
	 */
	public solveVelocity(): void {
		const numRows = this.info.numRows;
		const b1v = this._b1!.vel;
		const lv1X = b1v[0], lv1Y = b1v[1], lv1Z = b1v[2];
		const b2v = this._b2!.vel;
		const lv2X = b2v[0], lv2Y = b2v[1], lv2Z = b2v[2];
		const b1a = this._b1!.angVel;
		const av1X = b1a[0], av1Y = b1a[1], av1Z = b1a[2];
		const b2a = this._b2!.angVel;
		const av2X = b2a[0], av2Y = b2a[1], av2Z = b2a[2];
		let i = 0;
		while (i < numRows) {
			const row = this.info.rows[i];
			const j = row.jacobian.elements;
			let relVel = 0;
			relVel += lv1X * j[0] + lv1Y * j[1] + lv1Z * j[2];
			relVel -= lv2X * j[3] + lv2Y * j[4] + lv2Z * j[5];
			relVel += av1X * j[6] + av1Y * j[7] + av1Z * j[8];
			relVel -= av2X * j[9] + av2Y * j[10] + av2Z * j[11];
			this.relVels[i] = relVel;
			this.impulses[i] = row.impulse!.impulse;
			this.dTotalImpulses[i] = 0;
			i++;
		}
		const invMass = this.massMatrix.invMassWithoutCfm;
		i = 0;
		while (i < numRows) {
			const row = this.info.rows[i];
			const imp = row.impulse!;
			if (row.motorMaxImpulse > 0) {
				const oldImpulseM = imp.impulseM;
				let impulseM = oldImpulseM + this.massData[i].elements[13] * (-row.motorSpeed - this.relVels[i]);
				const maxImpulseM = row.motorMaxImpulse;
				if (impulseM < -maxImpulseM) {
					impulseM = -maxImpulseM;
				} else if (impulseM > maxImpulseM) {
					impulseM = maxImpulseM;
				}
				imp.impulseM = impulseM;
				const dImpulseM = impulseM - oldImpulseM;
				this.dTotalImpulses[i] = dImpulseM;
				let j = 0;
				while (j < numRows) {
					this.relVels[j] += dImpulseM * invMass[i][j];
					j++;
				}
			}
			i++;
		}
		let solved = false;
		let _g2 = 0;
		let _g3 = this.boundaryBuilder.numBoundaries;
		while (_g2 < _g3) {
			const idx = this.velBoundarySelector.indices[_g2++];
			if (this.boundaryBuilder.boundaries[idx].computeImpulses(this.info, this.massMatrix, this.relVels, this.impulses, this.dImpulses, 1, false)) {
				let j = 0;
				while (j < numRows) {
					const dimp = this.dImpulses[j];
					this.info.rows[j].impulse!.impulse += dimp;
					this.dTotalImpulses[j] += dimp;
					j++;
				}
				const impulses = this.dTotalImpulses;
				let linearSet = false;
				let angularSet = false;
				let lv1X = b1v[0], lv1Y = b1v[1], lv1Z = b1v[2];
				let lv2X = b2v[0], lv2Y = b2v[1], lv2Z = b2v[2];
				let av1X = b1a[0], av1Y = b1a[1], av1Z = b1a[2];
				let av2X = b2a[0], av2Y = b2a[1], av2Z = b2a[2];
				i = 0;
				let _g2 = this.info.numRows;
				while (i < _g2) {
					const j = this.info.rows[i].jacobian.elements;
					const md = this.massData[i].elements;
					const imp = impulses[i];
					if ((j[12] & 1) !== 0) {
						lv1X += md[0] * imp; lv1Y += md[1] * imp; lv1Z += md[2] * imp;
						lv2X += md[3] * -imp; lv2Y += md[4] * -imp; lv2Z += md[5] * -imp;
						linearSet = true;
					}
					if ((j[12] & 2) !== 0) {
						av1X += md[6] * imp; av1Y += md[7] * imp; av1Z += md[8] * imp;
						av2X += md[9] * -imp; av2Y += md[10] * -imp; av2Z += md[11] * -imp;
						angularSet = true;
					}
					i++;
				}
				if (linearSet) {
					b1v[0] = lv1X; b1v[1] = lv1Y; b1v[2] = lv1Z;
					b2v[0] = lv2X; b2v[1] = lv2Y; b2v[2] = lv2Z;
				}
				if (angularSet) {
					b1a[0] = av1X; b1a[1] = av1Y; b1a[2] = av1Z;
					b2a[0] = av2X; b2a[1] = av2Y; b2a[2] = av2Z;
				}
				const _this = this.velBoundarySelector;
				i = 0;
				while (_this.indices[i] !== idx) ++i;
				while (i > 0) {
					const tmp = _this.indices[i];
					_this.indices[i] = _this.indices[i - 1];
					_this.indices[i - 1] = tmp;
					--i;
				}
				solved = true;
				break;
			}
		}
		if (!solved) {
			console.log("DirectJointConstraintSolver:", "could not find solution. (velocity)");
		}
	}

	/**
	 * 速度约束求解后置处理。
	 * 计算并更新关节的合外力/合外力矩：
	 *              1. 累加所有约束行的冲量对应的力/力矩分量
	 *              2. 基于时间步倒数将冲量转换为力/力矩，赋值给关节的appliedForce/appliedTorque
	 * @param {TimeStep} timeStep 时间步信息 - 包含invDt（时间步倒数）等参数
	 */
	public postSolveVelocity(timeStep: TimeStep): void {
		let linX = 0, linY = 0, linZ = 0;
		let angX = 0, angY = 0, angZ = 0;
		let _g = 0, _g1 = this.info.numRows;
		while (_g < _g1) {
			const row = this.info.rows[_g++];
			const imp = row.impulse!;
			const j = row.jacobian.elements;
			if ((j[12] & 1) !== 0) {
				linX += j[0] * imp.impulse; linY += j[1] * imp.impulse; linZ += j[2] * imp.impulse;
			} else if ((j[12] & 2) !== 0) {
				angX += j[6] * imp.impulse; angY += j[7] * imp.impulse; angZ += j[8] * imp.impulse;
			}
		}
		const jof = this.joint.appliedForce, jot = this.joint.appliedTorque, invDt = timeStep.invDt;
		jof[0] = linX * invDt; jof[1] = linY * invDt; jof[2] = linZ * invDt;
		jot[0] = angX * invDt; jot[1] = angY * invDt; jot[2] = angZ * invDt;
	}

	/**
	 * 位置约束求解前置处理。
	 * 位置求解前的准备工作：
	 *              1. 同步关节锚点坐标，确保锚点与刚体当前位置一致
	 *              2. 获取关节位置求解信息，为父类的_b1/_b2赋值（缓存关联的两个刚体）
	 *              3. 计算逆质量矩阵并填充massData数组
	 *              4. 重置边界构建器状态，递归构建约束边界
	 *              5. 调整边界选择器的索引顺序，重置位置冲量为0
	 * @param {TimeStep} timeStep 时间步信息 - 包含dt、dtRatio等时间相关参数
	 */
	public preSolvePosition(timeStep: TimeStep): void {
		this.joint.syncAnchors();
		this.joint.getPositionSolverInfo(this.info);
		this._b1 = this.info.rigidBody1!;
		this._b2 = this.info.rigidBody2!;
		this.massMatrix.computeInvMass(this.info, this.massData);
		const _this = this.boundaryBuilder;
		_this.numBoundaries = 0;
		const _this1 = _this.bbInfo;
		_this1.numBounded = 0;
		_this1.numUnbounded = 0;
		_this.buildBoundariesRecursive(this.info, 0);
		const _this2 = this.posBoundarySelector;
		const size = this.boundaryBuilder.numBoundaries;
		let numSmaller = 0;
		let numGreater = 0;
		let _g = 0;
		let _g1 = _this2.n;
		while (_g < _g1) {
			const idx = _this2.indices[_g++];
			if (idx < size) {
				_this2.tmpIndices[numSmaller] = idx;
				++numSmaller;
			} else {
				_this2.tmpIndices[size + numGreater] = idx;
				++numGreater;
			}
		}
		const tmp = _this2.indices;
		_this2.indices = _this2.tmpIndices;
		_this2.tmpIndices = tmp;
		let _g2 = 0;
		let _g3 = this.info.numRows;
		while (_g2 < _g3) this.info.rows[_g2++].impulse!.impulseP = 0;
	}

	/**
	 * 分离冲量法求解位置约束。
	 * 基于分离冲量算法修正刚体位置，消除关节穿透：
	 *              1. 计算每个约束行的刚体伪速度（位置修正用速度）
	 *              2. 通过边界选择器求解位置约束冲量
	 *              3. 基于冲量更新刚体的线伪速度/角伪速度，完成位置修正
	 *              4. 若求解失败则输出日志提示
	 */
	public solvePositionSplitImpulse(): void {
		const PSB = CONSTANT.SETTING_POSITION_SPLIT_IMPULSE_BAUMGARTE;
		const numRows = this.info.numRows;
		const pv1 = this._b1!.pseudoVel;
		const lv1X = pv1[0], lv1Y = pv1[1], lv1Z = pv1[2];
		const pv2 = this._b2!.pseudoVel;
		const lv2X = pv2[0], lv2Y = pv2[1], lv2Z = pv2[2];
		const av1 = this._b1!.angPseudoVel;
		const av1X = av1[0], av1Y = av1[1], av1Z = av1[2];
		const av2 = this._b2!.angPseudoVel;
		const av2X = av2[0], av2Y = av2[1], av2Z = av2[2];
		let i = 0;
		while (i < numRows) {
			const row = this.info.rows[i];
			const j = row.jacobian.elements;
			let relVel = 0;
			relVel += lv1X * j[0] + lv1Y * j[1] + lv1Z * j[2];
			relVel -= lv2X * j[3] + lv2Y * j[4] + lv2Z * j[5];
			relVel += av1X * j[6] + av1Y * j[7] + av1Z * j[8];
			relVel -= av2X * j[9] + av2Y * j[10] + av2Z * j[11];
			this.relVels[i] = relVel;
			this.impulses[i] = row.impulse!.impulseP;
			i++;
		}
		let solved = false;
		let _g1 = 0;
		let _g2 = this.boundaryBuilder.numBoundaries;
		while (_g1 < _g2) {
			const idx = this.posBoundarySelector.indices[_g1++];
			if (this.boundaryBuilder.boundaries[idx].computeImpulses(this.info, this.massMatrix, this.relVels, this.impulses, this.dImpulses, PSB, false)) {
				let j = 0;
				while (j < numRows) {
					this.info.rows[j].impulse!.impulseP += this.dImpulses[j];
					j++;
				}
				const impulses = this.dImpulses;
				let linearSet = false;
				let angularSet = false;
				let lv1X = pv1[0], lv1Y = pv1[1], lv1Z = pv1[2];
				let lv2X = pv2[0], lv2Y = pv2[1], lv2Z = pv2[2];
				let av1X = av1[0], av1Y = av1[1], av1Z = av1[2];
				let av2X = av2[0], av2Y = av2[1], av2Z = av2[2];
				i = 0;
				let _g2 = this.info.numRows;
				while (i < _g2) {
					const j = this.info.rows[i].jacobian.elements;
					const md = this.massData[i].elements;
					const imp = impulses[i];
					if ((j[12] & 1) !== 0) {
						lv1X += md[0] * imp; lv1Y += md[1] * imp; lv1Z += md[2] * imp;
						lv2X += md[3] * -imp; lv2Y += md[4] * -imp; lv2Z += md[5] * -imp;
						linearSet = true;
					}
					if ((j[12] & 2) !== 0) {
						av1X += md[6] * imp; av1Y += md[7] * imp; av1Z += md[8] * imp;
						av2X += md[9] * -imp; av2Y += md[10] * -imp; av2Z += md[11] * -imp;
						angularSet = true;
					}
					i++;
				}
				if (linearSet) {
					pv1[0] = lv1X; pv1[1] = lv1Y; pv1[2] = lv1Z;
					pv2[0] = lv2X; pv2[1] = lv2Y; pv2[2] = lv2Z;
				}
				if (angularSet) {
					av1[0] = av1X; av1[1] = av1Y; av1[2] = av1Z;
					av2[0] = av2X; av2[1] = av2Y; av2[2] = av2Z;
				}
				const _this = this.posBoundarySelector;
				i = 0;
				while (_this.indices[i] !== idx) ++i;
				while (i > 0) {
					const tmp = _this.indices[i];
					_this.indices[i] = _this.indices[i - 1];
					_this.indices[i - 1] = tmp;
					--i;
				}
				solved = true;
				break;
			}
		}
		if (!solved) {
			console.log("DirectJointConstraintSolver:", "could not find solution. (split impulse)");
		}
	}

	/**
	 * NGS算法求解位置约束。
	 * 基于NGS（Normalized Gauss-Seidel）算法修正刚体位置：
	 *              1. 同步关节锚点，重新获取位置求解信息并计算逆质量矩阵
	 *              2. 初始化冲量/相对速度数组，通过边界选择器求解约束冲量
	 *              3. 基于冲量更新刚体的位置和旋转（更新变换矩阵、逆惯性张量）
	 *              4. 若求解失败则输出日志提示
	 * @param {TimeStep} timeStep 时间步信息 - 包含dt、dtRatio等时间相关参数
	 */
	public solvePositionNgs(timeStep: TimeStep): void {
		const PNB = CONSTANT.SETTING_POSITION_NGS_BAUMGARTE;
		this.joint.syncAnchors();
		this.joint.getPositionSolverInfo(this.info);
		this._b1 = this.info.rigidBody1!;
		this._b2 = this.info.rigidBody2!;
		const tf1 = this._b1.transform.elements, ii1 = this._b1.invInertia, il1 = this._b1.invLocalInertia, rf1 = this._b1.rotFactor.elements;
		const tf2 = this._b2.transform.elements, ii2 = this._b2.invInertia, il2 = this._b2.invLocalInertia, rf2 = this._b2.rotFactor.elements;
		this.massMatrix.computeInvMass(this.info, this.massData);
		const _this = this.boundaryBuilder;
		_this.numBoundaries = 0;
		const _this1 = _this.bbInfo;
		_this1.numBounded = 0;
		_this1.numUnbounded = 0;
		_this.buildBoundariesRecursive(this.info, 0);
		const _this2 = this.posBoundarySelector;
		const size = this.boundaryBuilder.numBoundaries;
		let numSmaller = 0;
		let numGreater = 0;
		let _g = 0, _g1 = _this2.n;
		while (_g < _g1) {
			const idx = _this2.indices[_g++];
			if (idx < size) {
				_this2.tmpIndices[numSmaller] = idx;
				++numSmaller;
			} else {
				_this2.tmpIndices[size + numGreater] = idx;
				++numGreater;
			}
		}
		const tmp = _this2.indices;
		_this2.indices = _this2.tmpIndices;
		_this2.tmpIndices = tmp;
		const numRows = this.info.numRows;
		let i = 0;
		while (i < numRows) {
			const imp = this.info.rows[i].impulse!;
			this.relVels[i] = 0;
			this.impulses[i] = imp.impulseP;
			i++;
		}
		let solved = false;
		let _g3 = 0, _g4 = this.boundaryBuilder.numBoundaries;
		while (_g3 < _g4) {
			const idx = this.posBoundarySelector.indices[_g3++];
			if (this.boundaryBuilder.boundaries[idx].computeImpulses(this.info, this.massMatrix, this.relVels, this.impulses, this.dImpulses, PNB, false)) {
				let _g = 0;
				while (_g < numRows) {
					const j = _g++;
					this.info.rows[j].impulse!.impulseP += this.dImpulses[j];
				}
				const impulses = this.dImpulses;
				let linearSet = false;
				let angularSet = false;
				let lv1X = 0, lv1Y = 0, lv1Z = 0;
				let lv2X = 0, lv2Y = 0, lv2Z = 0;
				let av1X = 0, av1Y = 0, av1Z = 0;
				let av2X = 0, av2Y = 0, av2Z = 0;
				let _g1 = 0;
				let _g2 = this.info.numRows;
				while (_g1 < _g2) {
					const i = _g1++;
					const j = this.info.rows[i].jacobian.elements;
					const md = this.massData[i].elements;
					const imp = impulses[i];
					if ((j[12] & 1) !== 0) {
						lv1X += md[0] * imp; lv1Y += md[1] * imp; lv1Z += md[2] * imp;
						lv2X += md[3] * -imp; lv2Y += md[4] * -imp; lv2Z += md[5] * -imp;
						linearSet = true;
					}
					if ((j[12] & 2) !== 0) {
						av1X += md[6] * imp; av1Y += md[7] * imp; av1Z += md[8] * imp;
						av2X += md[9] * -imp; av2Y += md[10] * -imp; av2Z += md[11] * -imp;
						angularSet = true;
					}
				}
				if (linearSet) {
					tf1[0] += lv1X; tf1[1] += lv1Y; tf1[2] += lv1Z;
					tf2[0] += lv2X; tf2[1] += lv2Y; tf2[2] += lv2Z;
				}
				if (angularSet) {
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
					qX = dqW * qX + dqX * qW + dqY * qZ - dqZ * qY; qY = dqW * qY - dqX * qZ + dqY * qW + dqZ * qX; qZ = dqW * qZ + dqX * qY - dqY * qX + dqZ * qW; qW = dqW * qW - dqX * qX - dqY * qY - dqZ * qZ;
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
					qX1 = dqW1 * qX1 + dqX1 * qW1 + dqY1 * qZ1 - dqZ1 * qY1; qY1 = dqW1 * qY1 - dqX1 * qZ1 + dqY1 * qW1 + dqZ1 * qX1; qZ1 = dqW1 * qZ1 + dqX1 * qY1 - dqY1 * qX1 + dqZ1 * qW1; qW1 = dqW1 * qW1 - dqX1 * qX1 - dqY1 * qY1 - dqZ1 * qZ1;
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
				const _this = this.posBoundarySelector;
				let i = 0;
				while (_this.indices[i] !== idx) ++i;
				while (i > 0) {
					const tmp = _this.indices[i];
					_this.indices[i] = _this.indices[i - 1];
					_this.indices[i - 1] = tmp;
					--i;
				}
				solved = true;
				break;
			}
		}
		if (!solved) {
			console.log("DirectJointConstraintSolver:", "could not find solution. (NGS)");
		}
	}

	/**
	 * 约束求解后置处理。
	 * 完成所有约束求解后的收尾工作：
	 *              1. 同步关节锚点坐标，确保锚点与刚体最终位置一致
	 *              2. 检查关节是否满足销毁条件，触发销毁逻辑（若有）
	 */
	public postSolve(): void {
		this.joint.syncAnchors();
		this.joint.checkDestruction();
	}
}

export { DirectJointConstraintSolver };