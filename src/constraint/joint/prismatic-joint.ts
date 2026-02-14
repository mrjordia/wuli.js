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

export default class PrismaticJoint extends Joint {
	public basis: BasisTracker;
	public linearError = new Float64Array(3);//0:translation,1:linearErrorY,2:linearErrorZ
	public angularError = new Float64Array(3);

	protected _sd: SpringDamper;
	protected _lm: TranslationalLimitMotor;
	protected _tm1 = new Float64Array(9);
	protected _tm2 = new Float64Array(9);
	constructor(config: PrismaticJointConfig) {
		super(config, JOINT_TYPE.PRISMATIC);
		const v = config.localAxis1.elements;
		this.localBasis1[0] = v[0];
		this.localBasis1[1] = v[1];
		this.localBasis1[2] = v[2];
		const v1 = config.localAxis2.elements;
		this.localBasis2[0] = v1[0];
		this.localBasis2[1] = v1[1];
		this.localBasis2[2] = v1[2];
		this.buildLocalBasesFromX();
		this.basis = new BasisTracker(this);
		this._sd = config.springDamper.clone();
		this._lm = config.limitMotor.clone();
	}

	public get translation(): number { return this.linearError[0]; }
	public get linearErrorY(): number { return this.linearError[1]; }
	public get linearErrorZ(): number { return this.linearError[2]; }
	public set translation(n: number) { this.linearError[0] = n; }
	public set linearErrorY(n: number) { this.linearError[1] = n; }
	public set linearErrorZ(n: number) { this.linearError[2] = n; }

	public get angularErrorX(): number { return this.angularError[0]; };
	public get angularErrorY(): number { return this.angularError[1]; };
	public get angularErrorZ(): number { return this.angularError[2]; };
	public set angularErrorX(n: number) { this.angularError[0] = n; };
	public set angularErrorY(n: number) { this.angularError[1] = n; };
	public set angularErrorZ(n: number) { this.angularError[2] = n; };

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
	public getSpringDamper(): SpringDamper {
		return this._sd;
	}
	public getLimitMotor(): TranslationalLimitMotor {
		return this._lm;
	}
	public getTranslation(): number {
		return this.linearError[0];
	}
}