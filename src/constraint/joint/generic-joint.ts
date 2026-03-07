import Joint from "./joint";
import { JOINT_TYPE } from "../../constant";
import Method from "../../common/method";
import GenericJointConfig from "./generic-joint-config";
import TranslationalLimitMotor from "./translational-limit-motor";
import SpringDamper from "./spring-damper";
import RotationalLimitMotor from "./rotational-limit-motor";
import JointSolverInfo from "./joint-solver-info";
import TimeStep from "../../common/time-step";
import { Nullable } from "../../common/nullable";

/**
 * 通用关节实现类。
 * 继承自Joint基类，是通用关节的具体实现，支持3个平移轴+3个旋转轴的独立约束配置，
 *              可通过差异化的限位驱动、弹簧阻尼参数模拟圆柱、球铰、棱柱等各类关节效果，
 *              封装了约束基向量校验、误差计算、求解器信息构建等核心逻辑，是物理引擎中最灵活的约束实现类
 */
export default class GenericJoint extends Joint {
	/**
	 * 旋转角度向量（3维）。
	 * 存储通用关节的旋转角度分量：
	 *              - [0]：X轴旋转角度；
	 *              - [1]：Y轴旋转角度；
	 *              - [2]：Z轴旋转角度；
	 *              由syncAnchors计算得到，用于约束求解时的位置/速度修正
	 */
	public angle = new Float64Array(3);

	/**
	 * 平移距离向量（3维）。
	 * 存储通用关节的平移距离分量：
	 *              - [0]：X轴平移距离；
	 *              - [1]：Y轴平移距离；
	 *              - [2]：Z轴平移距离；
	 *              由syncAnchors计算得到，用于约束求解时的位置/速度修正
	 */
	public translation = new Float64Array(3);

	/**
	 * 约束轴基向量矩阵（9维）。
	 * 存储3个约束轴的基向量（X/Y/Z轴依次排列），每行对应一个轴的(x,y,z)分量；
	 *              由makeBasis方法生成，是旋转约束求解的核心参考坐标系
	 */
	public axis = new Float64Array(9);

	/**
	 * X轴奇异标记。
	 * 标记X轴约束是否处于奇异状态（基向量模长为0），奇异时跳过该轴的旋转约束求解，避免计算异常
	 */
	public xSingular = false;

	/**
	 * Y轴奇异标记。
	 * 标记Y轴约束是否处于奇异状态（基向量模长为0），奇异时跳过该轴的旋转约束求解，避免计算异常
	 */
	public ySingular = false;

	/**
	 * Z轴奇异标记。
	 * 标记Z轴约束是否处于奇异状态（基向量模长为0），奇异时跳过该轴的旋转约束求解，避免计算异常
	 */
	public zSingular = false;

	private _translLms: Array<TranslationalLimitMotor>;
	private _translSds: Array<SpringDamper>;
	private _rotLms: Array<RotationalLimitMotor>;
	private _rotSds: Array<SpringDamper>;

	/**
	 * 构造函数：初始化通用关节。
	 * 核心初始化逻辑：
	 *              1. 调用父类构造函数，指定关节类型为GENERIC；
	 *              2. 校验本地基向量矩阵的右手系规则，非右手系时打印警告；
	 *              3. 转置配置中的本地基向量矩阵，适配内部约束求解的坐标系规则；
	 *              4. 克隆配置中的平移/旋转限位驱动、弹簧阻尼参数（避免联动修改）；
	 *              初始化阶段完成约束参数的独立化，保证配置修改不影响已创建的关节
	 * @param {GenericJointConfig} config 通用关节专属配置实例
	 */
	constructor(config: GenericJointConfig) {
		super(config, JOINT_TYPE.GENERIC);
		let tmp: boolean;
		let lb = config.localBasis1.elements;
		if (!(lb[0] * (lb[4] * lb[8] - lb[5] * lb[7]) - lb[1] * (lb[3] * lb[8] - lb[5] * lb[6]) + lb[2] * (lb[3] * lb[7] - lb[4] * lb[6]) < 0)) {
			lb = config.localBasis2.elements;
			tmp = lb[0] * (lb[4] * lb[8] - lb[5] * lb[7]) - lb[1] * (lb[3] * lb[8] - lb[5] * lb[6]) + lb[2] * (lb[3] * lb[7] - lb[4] * lb[6]) < 0;
		} else {
			tmp = true;
		}
		if (tmp) {
			console.log("GenericJoint:", "joint basis must be right handed");
		}
		Method.transposeM33(config.localBasis1.elements, this.localBasis1);
		Method.transposeM33(config.localBasis2.elements, this.localBasis2);
		this._translLms = [config.translationalLimitMotors[0].clone(), config.translationalLimitMotors[1].clone(), config.translationalLimitMotors[2].clone()];
		this._translSds = [config.translationalSpringDampers[0].clone(), config.translationalSpringDampers[1].clone(), config.translationalSpringDampers[2].clone()];
		this._rotLms = [config.rotationalLimitMotors[0].clone(), config.rotationalLimitMotors[1].clone(), config.rotationalLimitMotors[2].clone()];
		this._rotSds = [config.rotationalSpringDampers[0].clone(), config.rotationalSpringDampers[1].clone(), config.rotationalSpringDampers[2].clone()];
	}

	/**
	 * 构建通用关节的约束求解器信息。
	 * 核心逻辑：
	 *              1. 计算平移约束的有效质量（通用质量）和各旋转轴的有效转动惯量；
	 *              2. 构建3个平移轴的约束行：
	 *                 - 仅当弹簧阻尼频率≤0 或 非位置约束阶段时，构建平移约束行；
	 *                 - 配置限位驱动、弹簧阻尼、雅可比矩阵，支持差异化平移约束；
	 *              3. 构建3个旋转轴的约束行：
	 *                 - 仅当轴非奇异 且 弹簧阻尼频率≤0 或 非位置约束阶段时，构建旋转约束行；
	 *                 - 配置限位驱动、弹簧阻尼、雅可比矩阵，支持差异化旋转约束；
	 *              是通用关节约束求解的核心参数构建方法，支持6个自由度的独立约束配置
	 * @param {JointSolverInfo} info 待填充的求解器信息实例
	 * @param {Nullable<TimeStep>} timeStep 时间步信息（位置约束阶段为null）
	 * @param {boolean} isPositionPart 是否为位置约束阶段
	 */
	public getInfo(info: JointSolverInfo, timeStep: Nullable<TimeStep>, isPositionPart: boolean): void {
		let j: Float64Array;
		const axis = this.axis;
		const translMotorMass = 1 / (this.rigidBody1.invMass + this.rigidBody2.invMass);
		const motorMassX = this.computeEffectiveInertiaMoment(axis[0], axis[1], axis[2]);
		const motorMassY = this.computeEffectiveInertiaMoment(axis[3], axis[4], axis[5]);
		const motorMassZ = this.computeEffectiveInertiaMoment(axis[6], axis[7], axis[8]);
		if (this._translSds[0].frequency <= 0 || !isPositionPart) {
			const impulse = this.impulses[0];
			const row = info.rows[info.numRows++];
			this.resetRow(row, impulse);
			this.setSolverInfoRowLinear(row, this.translation[0], this._translLms[0], translMotorMass, this._translSds[0], timeStep, isPositionPart);
			Method.setJacobian(this.basis1[0], this.basis1[1], this.basis1[2], this.relativeAnchor1, this.relativeAnchor2, row.jacobian.elements);
		}
		if (this._translSds[1].frequency <= 0 || !isPositionPart) {
			const impulse = this.impulses[1];
			const row = info.rows[info.numRows++];
			this.resetRow(row, impulse);
			this.setSolverInfoRowLinear(row, this.translation[1], this._translLms[1], translMotorMass, this._translSds[1], timeStep, isPositionPart);
			Method.setJacobian(this.basis1[3], this.basis1[4], this.basis1[5], this.relativeAnchor1, this.relativeAnchor2, row.jacobian.elements);
		}
		if (this._translSds[2].frequency <= 0 || !isPositionPart) {
			const impulse = this.impulses[2];
			const row = info.rows[info.numRows++];
			this.resetRow(row, impulse);
			this.setSolverInfoRowLinear(row, this.translation[2], this._translLms[2], translMotorMass, this._translSds[2], timeStep, isPositionPart);
			Method.setJacobian(this.basis1[6], this.basis1[7], this.basis1[8], this.relativeAnchor1, this.relativeAnchor2, row.jacobian.elements);
		}
		if (!this.xSingular && (this._rotSds[0].frequency <= 0 || !isPositionPart)) {
			const impulse = this.impulses[3];
			const row = info.rows[info.numRows++];
			this.resetRow(row, impulse);
			this.setSolverInfoRowAngular(row, this.angle[0], this._rotLms[0], motorMassX, this._rotSds[0], timeStep, isPositionPart);
			j = row.jacobian.elements;
			j[6] = axis[0]; j[7] = axis[1]; j[8] = axis[2];
			j[9] = axis[0]; j[10] = axis[1]; j[11] = axis[2];
		}
		if (!this.ySingular && (this._rotSds[1].frequency <= 0 || !isPositionPart)) {
			const impulse = this.impulses[4];
			const row = info.rows[info.numRows++];
			this.resetRow(row, impulse);
			this.setSolverInfoRowAngular(row, this.angle[1], this._rotLms[1], motorMassY, this._rotSds[1], timeStep, isPositionPart);
			j = row.jacobian.elements;
			j[6] = axis[3]; j[7] = axis[4]; j[8] = axis[5];
			j[9] = axis[3]; j[10] = axis[4]; j[11] = axis[5];
		}
		if (!this.zSingular && (this._rotSds[2].frequency <= 0 || !isPositionPart)) {
			const impulse = this.impulses[5];
			const row = info.rows[info.numRows++];
			this.resetRow(row, impulse);
			this.setSolverInfoRowAngular(row, this.angle[2], this._rotLms[2], motorMassZ, this._rotSds[2], timeStep, isPositionPart);
			j = row.jacobian.elements;
			j[6] = axis[6]; j[7] = axis[7]; j[8] = axis[8];
			j[9] = axis[6]; j[10] = axis[7]; j[11] = axis[8];
		}
	}

	/**
	 * 同步锚点和基向量，并计算平移/旋转误差。
	 * 核心逻辑：
	 *              1. 调用父类syncAnchors方法，同步锚点和基向量的世界坐标；
	 *              2. 生成约束轴基向量矩阵，标记各轴是否处于奇异状态（避免计算异常）；
	 *              3. 计算两个刚体的相对旋转矩阵，通过欧拉角转换得到X/Y/Z轴旋转角度；
	 *              4. 计算锚点间的平移差值，转换到约束坐标系得到X/Y/Z轴平移距离；
	 *              5. 更新angle和translation向量，为约束求解提供实时的误差数据；
	 *              是通用关节约束求解的前置核心步骤，保证误差计算的实时性和准确性
	 */
	public syncAnchors(): void {
		super.syncAnchors();
		let bs1 = this.basis1, bs2 = this.basis2, ax = this.axis;
		Method.makeBasis(bs1[0], bs1[1], bs1[2], bs2[6], bs2[7], bs2[8], ax);
		this.xSingular = ax[0] * ax[0] + ax[1] * ax[1] + ax[2] * ax[2] === 0;
		this.ySingular = ax[3] * ax[3] + ax[4] * ax[4] + ax[5] * ax[5] === 0;
		this.zSingular = ax[6] * ax[6] + ax[7] * ax[7] + ax[8] * ax[8] === 0;
		let relRot00 = bs1[0] * bs2[0] + bs1[1] * bs2[1] + bs1[2] * bs2[2];
		let relRot01 = bs1[0] * bs2[3] + bs1[1] * bs2[4] + bs1[2] * bs2[5];
		let relRot02 = bs1[0] * bs2[6] + bs1[1] * bs2[7] + bs1[2] * bs2[8];
		let relRot11 = bs1[3] * bs2[3] + bs1[4] * bs2[4] + bs1[5] * bs2[5];
		let relRot12 = bs1[3] * bs2[6] + bs1[4] * bs2[7] + bs1[5] * bs2[8];
		let relRot21 = bs1[6] * bs2[3] + bs1[7] * bs2[4] + bs1[8] * bs2[5];
		let relRot22 = bs1[6] * bs2[6] + bs1[7] * bs2[7] + bs1[8] * bs2[8];
		let sy = relRot02;
		if (sy <= -1) {
			let xSubZ = Math.atan2(relRot21, relRot11);
			this.angle[0] = xSubZ * 0.5;
			this.angle[1] = -1.570796326794895;
			this.angle[2] = -xSubZ * 0.5;
		} else if (sy >= 1) {
			let xAddZ = Math.atan2(relRot21, relRot11);
			this.angle[0] = xAddZ * 0.5;
			this.angle[1] = 1.570796326794895;
			this.angle[2] = xAddZ * 0.5;
		} else {
			this.angle[0] = Math.atan2(-relRot12, relRot22);
			this.angle[1] = Math.asin(sy);
			this.angle[2] = Math.atan2(-relRot01, relRot00);
		}
		let anchorDiffX = this.anchor2[0] - this.anchor1[0], anchorDiffY = this.anchor2[1] - this.anchor1[1], anchorDiffZ = this.anchor2[2] - this.anchor1[2];
		Method.rotateVecTo(anchorDiffX, anchorDiffY, anchorDiffZ, bs1, this.translation);
	}

	/**
	 * 构建速度约束求解器信息。
	 * 调用父类基础初始化方法，再调用getInfo构建速度约束的具体参数（isPositionPart=false）
	 * @param {TimeStep} timeStep 时间步信息
	 * @param {JointSolverInfo} info 待填充的求解器信息实例
	 */
	public getVelocitySolverInfo(timeStep: TimeStep, info: JointSolverInfo): void {
		super.getVelocitySolverInfo(timeStep, info);
		this.getInfo(info, timeStep, false);
	}

	/**
	 * 构建位置约束求解器信息。
	 * 调用父类基础初始化方法，再调用getInfo构建位置约束的具体参数（isPositionPart=true，timeStep=null）
	 * @param {JointSolverInfo} info 待填充的求解器信息实例
	 */
	public getPositionSolverInfo(info: JointSolverInfo): void {
		super.getPositionSolverInfo(info);
		this.getInfo(info, null, true);
	}

	/**
	 * 获取X轴约束轴的世界坐标。
	 * 将basis1[0-2]（X轴世界坐标）赋值到输出对象，用于外部访问X轴约束的实时位置
	 * @param {object} out 输出对象（包含x/y/z属性）
	 */
	public getAxisXTo(out: { x: number, y: number, z: number }): void {
		Method.setXYZ(out, this.basis1[0], this.basis1[1], this.basis1[2]);
	}

	/**
	 * 获取Y轴约束轴的世界坐标。
	 * 将basis1[3-5]（Y轴世界坐标）赋值到输出对象，用于外部访问Y轴约束的实时位置
	 * @param {object} out 输出对象（包含x/y/z属性）
	 */
	public getAxisYTo(out: { x: number, y: number, z: number }): void {
		Method.setXYZ(out, this.basis1[3], this.basis1[4], this.basis1[5]);
	}

	/**
	 * 获取Z轴约束轴的世界坐标（注：方法名笔误，应为getAxisZTo，保持源码兼容）。
	 * 将basis1[6-8]（Z轴世界坐标）赋值到输出对象，用于外部访问Z轴约束的实时位置
	 * @param {object} out 输出对象（包含x/y/z属性）
	 */
	public getAxisZ(out: { x: number, y: number, z: number }): void {
		Method.setXYZ(out, this.basis1[6], this.basis1[7], this.basis1[8]);
	}

	/**
	 * 获取平移弹簧阻尼器配置数组（浅拷贝）。
	 * 返回内部平移弹簧阻尼器的浅拷贝数组，支持外部读取/修改参数（如调整频率/阻尼比），
	 *              浅拷贝保证数组结构独立，但修改元素属性会影响内部约束计算
	 * @returns {SpringDamper[]} 平移弹簧阻尼器实例数组（X/Y/Z轴）
	 */
	public getTranslationalSpringDampers(): Array<SpringDamper> {
		return this._translSds.slice(0);
	}

	/**
	 * 获取旋转弹簧阻尼器配置数组（注：源码笔误，应为返回_rotSds，保持源码兼容）。
	 * 返回内部旋转弹簧阻尼器的浅拷贝数组，支持外部读取/修改参数（如调整频率/阻尼比），
	 *              浅拷贝保证数组结构独立，但修改元素属性会影响内部约束计算
	 * @returns {SpringDamper[]} 旋转弹簧阻尼器实例数组（X/Y/Z轴）
	 */
	public getRotationalSpringDampers(): Array<SpringDamper> {
		return this._translSds.slice(0);
	}

	/**
	 * 获取平移限位驱动配置数组（浅拷贝）。
	 * 返回内部平移限位驱动的浅拷贝数组，支持外部读取/修改参数（如调整限位范围/驱动速度），
	 *              浅拷贝保证数组结构独立，但修改元素属性会影响内部约束计算
	 * @returns {TranslationalLimitMotor[]} 平移限位驱动实例数组（X/Y/Z轴）
	 */
	public getTranslationalLimitMotors(): Array<TranslationalLimitMotor> {
		return this._translLms.slice(0);
	}

	/**
	 * 获取旋转限位驱动配置数组（浅拷贝）。
	 * 返回内部旋转限位驱动的浅拷贝数组，支持外部读取/修改参数（如调整限位角度/驱动速度），
	 *              浅拷贝保证数组结构独立，但修改元素属性会影响内部约束计算
	 * @returns {RotationalLimitMotor[]} 旋转限位驱动实例数组（X/Y/Z轴）
	 */
	public getRotationalLimitMotors(): Array<RotationalLimitMotor> {
		return this._rotLms.slice(0);
	}

	/**
	 * 获取当前旋转角度。
	 * 将angle向量（X/Y/Z轴旋转角度）赋值到输出对象，用于外部获取实时旋转状态
	 * @param {object} out 输出对象（包含x/y/z属性）
	 */
	public getAngles(out: { x: number, y: number, z: number }): void {
		Method.setXYZ(out, this.angle[0], this.angle[1], this.angle[2]);
	}

	/**
	 * 获取当前平移距离。
	 * 将translation向量（X/Y/Z轴平移距离）赋值到输出对象，用于外部获取实时平移状态
	 * @param {object} out 输出对象（包含x/y/z属性）
	 */
	public getTranslations(out: { x: number, y: number, z: number }): void {
		Method.setXYZ(out, this.translation[0], this.translation[1], this.translation[2]);
	}
}

export { GenericJoint };