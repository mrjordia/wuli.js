import Joint from "./joint"
import { CONSTANT, JOINT_TYPE } from '../../constant';
import RotationalLimitMotor from "./rotational-limit-motor";
import Method from "../../common/method";
import RagdollJointConfig from "./ragdoll-joint-config";
import SpringDamper from "./spring-damper";
import JointSolverInfo from "./joint-solver-info";
import TimeStep from "../../common/time-step";
import { Nullable } from "../../common/nullable";

export default class RagdollJoint extends Joint {
	public dummySwingLm = new RotationalLimitMotor();
	public swingError = 0;
	public swingAxis = new Float64Array(3);
	public twistAxis = new Float64Array(3);
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
		Method.setXYZ(axis, this.basis2[0], this.basis2[1], this.basis2[2]);
	}

	public getLocalAxis1To(axis: { x: number, y: number, z: number }): void {
		Method.setXYZ(axis, this.localBasis1[0], this.localBasis1[1], this.localBasis1[2]);
	}
	public getLocalAxis2To(axis: { x: number, y: number, z: number }): void {
		Method.setXYZ(axis, this.localBasis2[0], this.localBasis2[1], this.localBasis2[2]);
	}
	public getTwistSpringDamper(): SpringDamper {
		return this._twistSd;
	}
	public getTwistLimitMotor(): RotationalLimitMotor {
		return this._twistLm;
	}
	public getSwingSpringDamper(): SpringDamper {
		return this._swingSd;
	}
	public getSwingAxisTo(axis: { x: number, y: number, z: number }): void {
		Method.setXYZ(axis, this.swingAxis[0], this.swingAxis[1], this.swingAxis[2]);
	}
	public getSwingAngle(): number {
		return this._swingAngle;
	}
	public getTwistAngle(): number {
		return this._twistAngle;
	}
}