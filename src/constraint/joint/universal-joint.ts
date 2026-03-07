import Joint from "./joint";
import { JOINT_TYPE } from "../../constant";
import Method from "../../common/method";
import UniversalJointConfig from "./universal-joint-config";
import SpringDamper from "./spring-damper";
import RotationalLimitMotor from "./rotational-limit-motor";
import JointSolverInfo from "./joint-solver-info";
import TimeStep from "../../common/time-step";
import { Nullable } from "../../common/nullable";

/**
 * 万向节实现类。
 * 继承自Joint基类，是万向节（Universal Joint）的具体实现，
 *              允许两个刚体绕两个正交的旋转轴做二维旋转（2个旋转自由度），完全限制平移和第三个旋转自由度，
 *              可分别为双旋转轴配置独立的弹簧阻尼（缓冲/复位）和限位驱动（角度限制/主动旋转），
 *              内置奇异状态检测机制避免计算异常，常用于模拟汽车传动轴、十字轴万向节、机器人双轴关节等场景，
 *              是连接单轴旋转关节和全轴球关节的核心中间型关节组件
 */
export default class UniversalJoint extends Joint {
	private _sd1: SpringDamper;
	private _sd2: SpringDamper;
	private _lm1: RotationalLimitMotor;
	private _lm2: RotationalLimitMotor;

	/**
	 * 角度数组。
	 * 存储万向节的旋转角度（3维），各索引含义：
	 *              - 0: 绕第一个旋转轴的旋转角度（核心运动参数）
	 *              - 1: 绕Y轴的角度误差（需约束为0，限制第三个旋转自由度）
	 *              - 2: 绕第二个旋转轴的旋转角度（核心运动参数）
	 */
	public angle = new Float64Array(3);

	/**
	 * 奇异状态标记数组。
	 * 标记各旋转轴是否处于奇异状态（计算失效），各索引含义：
	 *              - 0: 轴X奇异（长度为0，无法计算旋转约束）
	 *              - 1: 轴Y奇异（长度为0，无法计算旋转约束）
	 *              - 2: 轴Z奇异（长度为0，无法计算旋转约束）
	 *              奇异状态下会跳过对应轴的约束计算，避免数值异常
	 */
	public singular = [false, false, false];

	/**
	 * 线性误差数组。
	 * 存储关节锚点的线性偏移误差（X/Y/Z轴），所有分量需约束为0，
	 *              保证两个刚体仅绕双轴旋转，无位置偏移
	 */
	public linearError = new Float64Array(3);

	/**
	 * X轴方向的旋转轴向量。
	 * 万向节第一个旋转轴的世界空间向量，用于约束计算
	 */
	public axisX = new Float64Array(3);

	/**
	 * Y轴方向的约束轴向量。
	 * 用于限制第三个旋转自由度的约束轴向量，需保持正交
	 */
	public axisY = new Float64Array(3);

	/**
	 * Z轴方向的旋转轴向量。
	 * 万向节第二个旋转轴的世界空间向量，用于约束计算
	 */
	public axisZ = new Float64Array(3);

	/**
	 * 构造函数：初始化万向节。
	 * 核心初始化逻辑：
	 *              1. 调用父类构造函数，指定关节类型为UNIVERSAL；
	 *              2. 从配置中复制双本地旋转轴到关节本地基向量矩阵；
	 *              3. 基于X1Z2规则构建完整的本地基向量矩阵（适配双正交轴旋转特性）；
	 *              4. 克隆配置中的双弹簧阻尼器和双限位驱动实例（避免配置联动）；
	 * @param {UniversalJointConfig} config 万向节配置实例
	 */
	constructor(config: UniversalJointConfig) {
		super(config, JOINT_TYPE.UNIVERSAL);
		Method.copyElements(config.localAxis1.elements, this.localBasis1, 0, 0, 3);
		Method.copyElements(config.localAxis2.elements, this.localBasis2, 0, 0, 3);
		this.buildLocalBasesFromX1Z2();
		this._sd1 = config.springDamper1.clone();
		this._sd2 = config.springDamper2.clone();
		this._lm1 = config.limitMotor1.clone();
		this._lm2 = config.limitMotor2.clone();
	}

	/**
	 * 构建万向节的约束求解器信息。
	 * 核心逻辑：
	 *              1. 计算误差还原参数（erp），将线性/角度误差转换为约束修正量；
	 *              2. 构建X/Y/Z轴线性约束行：强制约束锚点偏移为0，设置极大力矩范围确保严格约束；
	 *              3. 计算双旋转轴的有效转动惯量（模拟旋转物理特性）；
	 *              4. 非奇异状态下，为双旋转轴构建角度约束行（配置弹簧阻尼和限位驱动）；
	 *              5. 为Y轴构建角度约束行：强制约束第三个旋转自由度为0；
	 *              注意：弹簧阻尼器启用时仅在速度约束阶段生效，位置阶段跳过
	 * @param {JointSolverInfo} info 待填充的求解器信息实例
	 * @param {Nullable<TimeStep>} timeStep 时间步信息（位置约束阶段为null）
	 * @param {boolean} isPositionPart 是否为位置约束阶段
	 */
	public getInfo(info: JointSolverInfo, timeStep: Nullable<TimeStep>, isPositionPart: boolean): void {
		const erp = this.getErp(timeStep, isPositionPart);
		const linearRhsX = this.linearError[0] * erp, linearRhsY = this.linearError[1] * erp, linearRhsZ = this.linearError[2] * erp;
		const angRhsY = this.angle[1] * erp;
		const ra1 = this.relativeAnchor1, ra2 = this.relativeAnchor2;
		const ax = this.axisX, ay = this.axisY, az = this.axisZ;
		const c100 = 0, c101 = ra1[2], c102 = -ra1[1];
		const c110 = -ra1[2], c111 = 0, c112 = ra1[0];
		const c120 = ra1[1], c121 = -ra1[0], c122 = 0;
		const c200 = 0, c201 = ra2[2], c202 = -ra2[1];
		const c210 = -ra2[2], c211 = 0, c212 = ra2[0];
		const c220 = ra2[1], c221 = -ra2[0], c222 = 0;
		const motorMassX = this.computeEffectiveInertiaMoment(ax[0], ax[1], ax[2]);
		const motorMassZ = this.computeEffectiveInertiaMoment(az[0], az[1], az[2]);

		// 构建X轴线性约束行（限制平移）
		const impulse = this.impulses[0];
		const row = info.rows[info.numRows++];
		this.resetRow(row, impulse);
		row.rhs = linearRhsX;
		row.cfm = 0;
		row.minImpulse = -1e65536;
		row.maxImpulse = 1e65536;
		Method.setJacobianElements(row.jacobian.elements, 1, 0, 0, 1, 0, 0, c100, c101, c102, c200, c201, c202);

		// 构建Y轴线性约束行（限制平移）
		const impulse1 = this.impulses[1];
		const row1 = info.rows[info.numRows++];
		this.resetRow(row1, impulse1);
		row1.rhs = linearRhsY;
		row1.cfm = 0;
		row1.minImpulse = -1e65536;
		row1.maxImpulse = 1e65536;
		Method.setJacobianElements(row1.jacobian.elements, 0, 1, 0, 0, 1, 0, c110, c111, c112, c210, c211, c212);

		// 构建Z轴线性约束行（限制平移）
		const impulse2 = this.impulses[2];
		const row2 = info.rows[info.numRows++];
		this.resetRow(row2, impulse2);
		row2.rhs = linearRhsZ;
		row2.cfm = 0;
		row2.minImpulse = -1e65536;
		row2.maxImpulse = 1e65536;
		Method.setJacobianElements(row2.jacobian.elements, 0, 0, 1, 0, 0, 1, c120, c121, c122, c220, c221, c222);

		// 构建X轴旋转约束行（第一个旋转轴）- 非奇异且弹簧阻尼允许时生效
		if (!this.singular[0] && (this._sd1.frequency <= 0 || !isPositionPart)) {
			const impulse = this.impulses[3];
			const row = info.rows[info.numRows++];
			this.resetRow(row, impulse);
			this.setSolverInfoRowAngular(row, this.angle[0], this._lm1, motorMassX, this._sd1, timeStep, isPositionPart);
			const j = row.jacobian.elements;
			j[6] = ax[0]; j[7] = ax[1]; j[8] = ax[2];
			j[9] = ax[0]; j[10] = ax[1]; j[11] = ax[2];
		}

		// 构建Y轴旋转约束行（限制第三个旋转自由度）- 非奇异时生效
		if (!this.singular[1]) {
			const impulse = this.impulses[4];
			const row = info.rows[info.numRows++];
			this.resetRow(row, impulse);
			row.rhs = angRhsY;
			row.cfm = 0;
			row.minImpulse = -1e65536;
			row.maxImpulse = 1e65536;
			const j = row.jacobian.elements;
			j[6] = ay[0]; j[7] = ay[1]; j[8] = ay[2];
			j[9] = ay[0]; j[10] = ay[1]; j[11] = ay[2];
		}

		// 构建Z轴旋转约束行（第二个旋转轴）- 非奇异且弹簧阻尼允许时生效
		if (!this.singular[2] && (this._sd2.frequency <= 0 || !isPositionPart)) {
			const impulse = this.impulses[5];
			const row = info.rows[info.numRows++];
			this.resetRow(row, impulse);
			this.setSolverInfoRowAngular(row, this.angle[2], this._lm2, motorMassZ, this._sd2, timeStep, isPositionPart);
			const j = row.jacobian.elements;
			j[6] = az[0]; j[7] = az[1]; j[8] = az[2];
			j[9] = az[0]; j[10] = az[1]; j[11] = az[2];
		}
	}

	/**
	 * 同步锚点和基向量，计算角度/线性误差与奇异状态。
	 * 核心逻辑（万向节物理核心计算步骤）：
	 *              1. 调用父类syncAnchors，同步锚点和基向量的世界坐标；
	 *              2. 基于双正交旋转轴构建万向节的基向量矩阵，更新轴X/Y/Z的世界空间向量；
	 *              3. 检测各轴的奇异状态（向量长度为0），标记后避免后续计算异常；
	 *              4. 计算双旋转轴的旋转角度和第三个旋转自由度的误差（需约束为0）；
	 *              5. 计算锚点间的线性偏移，更新linearError（需约束为0）；
	 *              该方法是万向节「双轴旋转、限制平移和第三旋转自由度」特性的核心保障
	 */
	public syncAnchors(): void {
		super.syncAnchors();
		const ax = this.axisX, ay = this.axisY, az = this.axisZ;
		const bs1 = this.basis1, bs2 = this.basis2;
		const tm = this._tm, tv = this._tv;

		// 构建万向节基向量矩阵
		Method.makeBasis(bs1[0], bs1[1], bs1[2], bs2[6], bs2[7], bs2[8], tm);
		Method.copyElements(tm, ax, 0, 0, 3);
		Method.copyElements(tm, ay, 3, 0, 3);
		Method.copyElements(tm, az, 6, 0, 3);

		// 检测奇异状态（轴向量长度为0）
		this.singular[0] = ax[0] * ax[0] + ax[1] * ax[1] + ax[2] * ax[2] === 0;
		this.singular[1] = ay[0] * ay[0] + ay[1] * ay[1] + ay[2] * ay[2] === 0;
		this.singular[2] = az[0] * az[0] + az[1] * az[1] + az[2] * az[2] === 0;

		// 计算相对旋转角度
		Method.multiplyBasis(bs2, bs1, tm);
		Method.mat3ToVec3(tm, tv);
		Method.copyElements(tv, this.angle, 0, 0, 3);

		// 计算线性偏移误差
		Method.subArray(this.anchor2, this.anchor1, this.linearError, 0, 0, 0, 3);
	}

	/**
	 * 构建速度约束求解器信息。
	 * 调用父类基础初始化，再通过getInfo构建速度约束参数（isPositionPart=false），
	 *              弹簧阻尼器的弹性/阻尼效果主要在该阶段生效，保证双轴旋转的平滑性
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
	 *              启用弹簧阻尼时该阶段会跳过对应轴的约束，仅做刚性约束时修正位置/角度偏移
	 * @param {JointSolverInfo} info 待填充的求解器信息实例
	 */
	public getPositionSolverInfo(info: JointSolverInfo): void {
		super.getPositionSolverInfo(info);
		this.getInfo(info, null, true);
	}

	/**
	 * 获取第一个旋转轴的世界空间向量。
	 * 将basis1中的第一个旋转轴世界坐标赋值到输出对象，用于物理调试或可视化
	 * @param {object} axis 输出对象（包含x/y/z属性）
	 */
	public getAxis1To(axis: { x: number, y: number, z: number }): void {
		Method.setXYZ(axis, this.basis1[0], this.basis1[1], this.basis1[2]);
	}

	/**
	 * 获取第二个旋转轴的世界空间向量。
	 * 将basis2中的第二个旋转轴世界坐标赋值到输出对象，用于物理调试或可视化
	 * @param {object} axis 输出对象（包含x/y/z属性）
	 */
	public getAxis2To(axis: { x: number, y: number, z: number }): void {
		Method.setXYZ(axis, this.basis2[6], this.basis2[7], this.basis2[8]);
	}

	/**
	 * 获取第一个旋转轴的本地空间向量。
	 * 将localBasis1中的第一个旋转轴本地坐标赋值到输出对象，用于配置调整
	 * @param {object} axis 输出对象（包含x/y/z属性）
	 */
	public getLocalAxis1To(axis: { x: number, y: number, z: number }): void {
		Method.setXYZ(axis, this.localBasis1[0], this.localBasis1[1], this.localBasis1[2]);
	}

	/**
	 * 获取第二个旋转轴的本地空间向量。
	 * 将localBasis2中的第二个旋转轴本地坐标赋值到输出对象，用于配置调整
	 * @param {object} axis 输出对象（包含x/y/z属性）
	 */
	public getLocalAxis2To(axis: { x: number, y: number, z: number }): void {
		Method.setXYZ(axis, this.localBasis2[6], this.localBasis2[7], this.localBasis2[8]);
	}

	/**
	 * 获取第一个旋转轴的弹簧阻尼器实例。
	 * 外部访问/修改第一个旋转轴弹性参数的接口，修改会实时影响关节物理特性
	 * @returns {SpringDamper} 内部弹簧阻尼器实例
	 */
	public getSpringDamper1(): SpringDamper {
		return this._sd1;
	}

	/**
	 * 获取第二个旋转轴的弹簧阻尼器实例。
	 * 外部访问/修改第二个旋转轴弹性参数的接口，修改会实时影响关节物理特性
	 * @returns {SpringDamper} 内部弹簧阻尼器实例
	 */
	public getSpringDamper2(): SpringDamper {
		return this._sd2;
	}

	/**
	 * 获取第一个旋转轴的限位驱动实例。
	 * 外部访问/修改第一个旋转轴限位/驱动参数的接口，修改会实时影响关节运动范围
	 * @returns {RotationalLimitMotor} 内部限位驱动实例
	 */
	public getLimitMotor1(): RotationalLimitMotor {
		return this._lm1;
	}

	/**
	 * 获取第二个旋转轴的限位驱动实例。
	 * 外部访问/修改第二个旋转轴限位/驱动参数的接口，修改会实时影响关节运动范围
	 * @returns {RotationalLimitMotor} 内部限位驱动实例
	 */
	public getLimitMotor2(): RotationalLimitMotor {
		return this._lm2;
	}

	/**
	 * 获取绕第一个旋转轴的旋转角度。
	 * 外部访问第一个旋转轴角度的快捷接口
	 * @returns {number} 当前旋转角度（弧度）
	 */
	public getAngle1(): number {
		return this.angle[0];
	}

	/**
	 * 获取绕第二个旋转轴的旋转角度。
	 * 外部访问第二个旋转轴角度的快捷接口
	 * @returns {number} 当前旋转角度（弧度）
	 */
	public getAngle2(): number {
		return this.angle[2];
	}
}

export { UniversalJoint };