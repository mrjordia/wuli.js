import Joint from "./joint";
import { JOINT_TYPE } from "../../constant";
import Method from "../../common/method";
import UniversalJointConfig from "./universal-joint-config";
import SpringDamper from "./spring-damper";
import RotationalLimitMotor from "./rotational-limit-motor";
import JointSolverInfo from "./joint-solver-info";
import TimeStep from "../../common/time-step";
import { Nullable } from "../../common/nullable";

export default class UniversalJoint extends Joint {
	private _sd1: SpringDamper;
	private _sd2: SpringDamper;
	private _lm1: RotationalLimitMotor;
	private _lm2: RotationalLimitMotor;

	public angle = new Float64Array(3);
	public singular = [false, false, false];
	public linearError = new Float64Array(3);
	public axisX = new Float64Array(3);
	public axisY = new Float64Array(3);
	public axisZ = new Float64Array(3);
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
		if (!this.singular[0] && (this._sd1.frequency <= 0 || !isPositionPart)) {
			const impulse = this.impulses[3];
			const row = info.rows[info.numRows++];
			this.resetRow(row, impulse);
			this.setSolverInfoRowAngular(row, this.angle[0], this._lm1, motorMassX, this._sd1, timeStep, isPositionPart);
			const j = row.jacobian.elements;
			j[6] = ax[0]; j[7] = ax[1]; j[8] = ax[2];
			j[9] = ax[0]; j[10] = ax[1]; j[11] = ax[2];
		}
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
	public syncAnchors(): void {
		super.syncAnchors();
		const ax = this.axisX, ay = this.axisY, az = this.axisZ;
		const bs1 = this.basis1, bs2 = this.basis2;
		const tm = this._tm, tv = this._tv;
		Method.makeBasis(bs1[0], bs1[1], bs1[2], bs2[6], bs2[7], bs2[8], tm);
		Method.copyElements(tm, ax, 0, 0, 3);
		Method.copyElements(tm, ay, 3, 0, 3);
		Method.copyElements(tm, az, 6, 0, 3);
		this.singular[0] = ax[0] * ax[0] + ax[1] * ax[1] + ax[2] * ax[2] === 0;
		this.singular[1] = ay[0] * ay[0] + ay[1] * ay[1] + ay[2] * ay[2] === 0;
		this.singular[2] = az[0] * az[0] + az[1] * az[1] + az[2] * az[2] === 0;
		Method.multiplyBasis(bs2, bs1, tm);
		Method.mat3ToVec3(tm, tv);
		Method.copyElements(tv, this.angle, 0, 0, 3);
		Method.subArray(this.anchor2, this.anchor1, this.linearError, 0, 0, 0, 3);
	}
	public getVelocitySolverInfo(timeStep: TimeStep, info: JointSolverInfo): void {
		super.getVelocitySolverInfo(timeStep, info);
		this.getInfo(info, timeStep, false);
	}
	public getPositionSolverInfo(info: JointSolverInfo): void {
		super.getPositionSolverInfo(info);
		this.getInfo(info, null, true);
	}

	public getAxis1To(axis: { x: number, y: number, z: number }): void {
		Method.setXYZ(axis, this.basis1[0], this.basis1[1], this.basis1[2]);
	}
	public getAxis2To(axis: { x: number, y: number, z: number }): void {
		Method.setXYZ(axis, this.basis2[6], this.basis2[7], this.basis2[8]);
	}

	public getLocalAxis1To(axis: { x: number, y: number, z: number }): void {
		Method.setXYZ(axis, this.localBasis1[0], this.localBasis1[1], this.localBasis1[2]);

	}
	public getLocalAxis2To(axis: { x: number, y: number, z: number }): void {
		Method.setXYZ(axis, this.localBasis2[6], this.localBasis2[7], this.localBasis2[8]);
	}
	public getSpringDamper1(): SpringDamper {
		return this._sd1;
	}
	public getSpringDamper2(): SpringDamper {
		return this._sd2;
	}
	public getLimitMotor1(): RotationalLimitMotor {
		return this._lm1;
	}
	public getLimitMotor2(): RotationalLimitMotor {
		return this._lm2;
	}
	public getAngle1(): number {
		return this.angle[0];
	}
	public getAngle2(): number {
		return this.angle[2];
	}
}