import Joint from './joint';
import { JOINT_TYPE } from "../../constant";
import BasisTracker from "./basis-tracker";
import Method from "../../common/method";
import CylindricalJointConfig from './cylindrical-joint-config';
import SpringDamper from './spring-damper';
import TranslationalLimitMotor from './translational-limit-motor';
import RotationalLimitMotor from './rotational-limit-motor';
import JointSolverInfo from './joint-solver-info';
import TimeStep from '../../common/time-step';
import { Nullable } from '../../common/nullable';

export default class CylindricalJoint extends Joint {
	public angularError = new Float64Array(3);
	public linearError = new Float64Array(3);

	private _basis: BasisTracker;
	private _translSd: SpringDamper;
	private _translLm: TranslationalLimitMotor;
	private _rotSd: SpringDamper;
	private _rotLm: RotationalLimitMotor;
	private _tM = new Float64Array(9);
	constructor(config: CylindricalJointConfig) {
		super(config, JOINT_TYPE.CYLINDRICAL);
		Method.copyElements(config.localAxis1.elements, this.localBasis1, 0, 0, 3);
		Method.copyElements(config.localAxis2.elements, this.localBasis2, 0, 0, 3);
		this.buildLocalBasesFromX();
		this._basis = new BasisTracker(this);
		this._translSd = config.translationalSpringDamper.clone();
		this._translLm = config.translationalLimitMotor.clone();
		this._rotSd = config.rotationalSpringDamper.clone();
		this._rotLm = config.rotationalLimitMotor.clone();
	}

	public get angle(): number { return this.angularError[0]; };
	public get angularErrorY(): number { return this.angularError[1]; };
	public get angularErrorZ(): number { return this.angularError[2]; };
	public set angle(n: number) { this.angularError[0] = n; };
	public set angularErrorY(n: number) { this.angularError[1] = n; };
	public set angularErrorZ(n: number) { this.angularError[2] = n; };

	public get translation(): number { return this.linearError[0]; };
	public get linearErrorY(): number { return this.linearError[1]; };
	public get linearErrorZ(): number { return this.linearError[2]; };
	public set translation(n: number) { this.linearError[0] = n; };
	public set linearErrorY(n: number) { this.linearError[1] = n; };
	public set linearErrorZ(n: number) { this.linearError[2] = n; };

	public getInfo(info: JointSolverInfo, timeStep: Nullable<TimeStep>, isPositionPart: boolean): void {
		const erp = this.getErp(timeStep, isPositionPart);
		const ae = this.angularError, le = this.linearError;
		const linRhsY = le[1] * erp;
		const linRhsZ = le[2] * erp;
		const angRhsY = ae[1] * erp;
		const angRhsZ = ae[2] * erp;
		let j: Float64Array;
		const translationalMotorMass = 1 / (this.rigidBody1.invMass + this.rigidBody2.invMass);
		const _basis = this._basis.elements;
		const rotationalMotorMass = this.computeEffectiveInertiaMoment(_basis[0], _basis[1], _basis[2]);
		if (this._translSd.frequency <= 0 || !isPositionPart) {
			const impulse = this.impulses[0];
			const row = info.rows[info.numRows++];
			this.resetRow(row, impulse);
			this.setSolverInfoRowLinear(row, le[0], this._translLm, translationalMotorMass, this._translSd, timeStep, isPositionPart);
			Method.setJacobian(_basis[0], _basis[1], _basis[2], this.relativeAnchor1, this.relativeAnchor2, row.jacobian.elements);
		}
		const impulse = this.impulses[1];
		const row = info.rows[info.numRows++];
		this.resetRow(row, impulse);
		row.rhs = linRhsY;
		row.cfm = 0;
		row.minImpulse = -1e65536;
		row.maxImpulse = 1e65536;
		Method.setJacobian(_basis[3], _basis[4], _basis[5], this.relativeAnchor1, this.relativeAnchor2, row.jacobian.elements);
		const impulse1 = this.impulses[2];
		const row1 = info.rows[info.numRows++];
		this.resetRow(row1, impulse1);
		row1.rhs = linRhsZ;
		row1.cfm = 0;
		row1.minImpulse = -1e65536;
		row1.maxImpulse = 1e65536;
		Method.setJacobian(_basis[6], _basis[7], _basis[8], this.relativeAnchor1, this.relativeAnchor2, row1.jacobian.elements);
		if (this._rotSd.frequency <= 0 || !isPositionPart) {
			const impulse = this.impulses[3];
			const row = info.rows[info.numRows++];
			this.resetRow(row, impulse);
			this.setSolverInfoRowAngular(row, ae[0], this._rotLm, rotationalMotorMass, this._rotSd, timeStep, isPositionPart);
			j = row.jacobian.elements;
			j[6] = _basis[0]; j[7] = _basis[1]; j[8] = _basis[2];
			j[9] = _basis[0]; j[10] = _basis[1]; j[11] = _basis[2];
		}
		const impulse2 = this.impulses[4];
		const row2 = info.rows[info.numRows++];
		this.resetRow(row2, impulse2);
		row2.rhs = angRhsY;
		row2.cfm = 0;
		row2.minImpulse = -1e65536;
		row2.maxImpulse = 1e65536;
		j = row2.jacobian.elements;
		j[6] = _basis[3]; j[7] = _basis[4]; j[8] = _basis[5];
		j[9] = _basis[3]; j[10] = _basis[4]; j[11] = _basis[5];
		const impulse3 = this.impulses[5];
		const row3 = info.rows[info.numRows++];
		this.resetRow(row3, impulse3);
		row3.rhs = angRhsZ;
		row3.cfm = 0;
		row3.minImpulse = -1e65536;
		row3.maxImpulse = 1e65536;
		j = row3.jacobian.elements;
		j[6] = _basis[6]; j[7] = _basis[7]; j[8] = _basis[8];
		j[9] = _basis[6]; j[10] = _basis[7]; j[11] = _basis[8];
	}
	public syncAnchors(): void {
		super.syncAnchors();
		const bt = this._basis;
		const m = this._tM, tv = this._tv;
		const bjb1 = bt.joint.basis1, bjb2 = bt.joint.basis2;
		const invM1 = bt.joint.rigidBody1.invMass;
		const invM2 = bt.joint.rigidBody2.invMass;
		const ae = this.angularError, le = this.linearError;
		let qX: number, qY: number, qZ: number, qW: number;
		let slerpQX: number, slerpQY: number, slerpQZ: number, slerpQW: number;
		let d = bjb1[0] * bjb2[0] + bjb1[1] * bjb2[1] + bjb1[2] * bjb2[2];
		if (d < -0.999999999) {
			Method.vecToQuat(bjb1[0], bjb1[1], bjb1[2], m);
			qX = m[0]; qY = m[1]; qZ = m[2]; qW = 0;
		} else {
			Method.crossVectors(bjb1[0], bjb1[1], bjb1[2], bjb2[0], bjb2[1], bjb2[2], m);
			const w = Math.sqrt((1 + d) * 0.5);
			d = 0.5 / w;
			m[0] *= d; m[1] *= d; m[2] *= d;
			qX = m[0]; qY = m[1]; qZ = m[2]; qW = w;
		}
		let q1X = 0, q1Y = 0, q1Z = 0, q1W = 1;
		let q2X = qX, q2Y = qY, q2Z = qZ, q2W = qW;
		let d1 = q1X * q2X + q1Y * q2Y + q1Z * q2Z + q1W * q2W;
		if (d1 < 0) {
			d1 = -d1;
			q2X = -q2X; q2Y = -q2Y; q2Z = -q2Z; q2W = -q2W;
		}
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
		Method.quatToMat3(slerpQX, slerpQY, slerpQZ, slerpQW, m);
		Method.rotateVecTo(bjb1[0], bjb1[1], bjb1[2], m, m);
		const newXX = m[0], newXY = m[1], newXZ = m[2];
		const es = bt.elements;
		const prevXX = es[0], prevXY = es[1], prevXZ = es[2];
		const prevYX = es[3], prevYY = es[4], prevYZ = es[5];
		let d2 = prevXX * newXX + prevXY * newXY + prevXZ * newXZ;
		if (d2 < -0.999999999) {
			Method.vecToQuat(prevXX, prevXY, prevXZ, m);
			slerpQX = m[0]; slerpQY = m[1]; slerpQZ = m[2]; slerpQW = 0;
		} else {
			let cX = prevXY * newXZ - prevXZ * newXY, cY = prevXZ * newXX - prevXX * newXZ, cZ = prevXX * newXY - prevXY * newXX;
			const w = Math.sqrt((1 + d2) * 0.5);
			d2 = 0.5 / w;
			cX *= d2; cY *= d2; cZ *= d2;
			slerpQX = cX; slerpQY = cY; slerpQZ = cZ; slerpQW = w;
		}
		Method.quatToMat3(slerpQX, slerpQY, slerpQZ, slerpQW, m);
		Method.rotateVecTo(prevYX, prevYY, prevYZ, m, m);
		let newYX = m[0], newYY = m[1], newYZ = m[2];
		let newZX = newXY * newYZ - newXZ * newYY, newZY = newXZ * newYX - newXX * newYZ, newZZ = newXX * newYY - newXY * newYX;
		if (newZX * newZX + newZY * newZY + newZZ * newZZ > 1e-6) {
			let l = newZX * newZX + newZY * newZY + newZZ * newZZ;
			if (l > 0) l = 1 / Math.sqrt(l);
			newZX *= l; newZY *= l; newZZ *= l;
		} else {
			Method.vecToQuat(newXX, newXY, newXZ, m);
			newZX = m[0]; newZY = m[1]; newZZ = m[2];
		}
		newYX = newZY * newXZ - newZZ * newXY; newYY = newZZ * newXX - newZX * newXZ; newYZ = newZX * newXY - newZY * newXX;
		Method.setM3X3(es, newXX, newXY, newXZ, newYX, newYY, newYZ, newXZ, newZY, newZZ);
		const bs1 = this.basis1, bs2 = this.basis2;
		Method.crossVectors(bs1[0], bs1[1], bs1[2], bs2[0], bs2[1], bs2[2], m);
		let angErrorX = m[0], angErrorY = m[1], angErrorZ = m[2];
		let cos = bs1[0] * bs2[0] + bs1[1] * bs2[1] + bs1[2] * bs2[2];
		const theta = cos <= -1 ? 3.14159265358979 : cos >= 1 ? 0 : Math.acos(cos);
		let l = angErrorX * angErrorX + angErrorY * angErrorY + angErrorZ * angErrorZ;
		if (l > 0) l = 1 / Math.sqrt(l);
		angErrorX *= l; angErrorY *= l; angErrorZ *= l;
		angErrorX *= theta; angErrorY *= theta; angErrorZ *= theta;
		ae[1] = angErrorX * es[3] + angErrorY * es[4] + angErrorZ * es[5];
		ae[2] = angErrorX * es[6] + angErrorY * es[7] + angErrorZ * es[8];
		Method.crossVectors(bs1[3], bs1[4], bs1[5], bs2[3], bs2[4], bs2[5], m);
		const perpCrossX = m[0], perpCrossY = m[1], perpCrossZ = m[2];
		cos = bs1[3] * bs2[3] + bs1[4] * bs2[4] + bs1[5] * bs2[5];
		ae[0] = cos <= -1 ? 3.14159265358979 : cos >= 1 ? 0 : Math.acos(cos);
		if (perpCrossX * es[0] + perpCrossY * es[1] + perpCrossZ * es[2] < 0) {
			ae[0] = -ae[0];
		}
		Method.subArray(this.anchor2, this.anchor1, tv, 0, 0, 0, 3);
		Method.rotateVecTo(tv[0], tv[1], tv[2], es, m);
		le[0] = m[0];
		le[1] = m[1];
		le[2] = m[2];
	}
	public getVelocitySolverInfo(timeStep: TimeStep, info: JointSolverInfo): void {
		super.getVelocitySolverInfo(timeStep, info);
		this.getInfo(info, timeStep, false);
	}
	public getPositionSolverInfo(info: JointSolverInfo): void {
		super.getPositionSolverInfo(info);
		this.getInfo(info, null, true);
	}

	public getAxis1To(out: { x: number, y: number, z: number }): void {
		Method.setXYZ(out, this.basis1[0], this.basis1[1], this.basis1[2]);
	}
	public getAxis2To(out: { x: number, y: number, z: number }): void {
		Method.setXYZ(out, this.basis2[0], this.basis2[1], this.basis2[2]);
	}

	public getLocalAxis1To(out: { x: number, y: number, z: number }): void {
		Method.setXYZ(out, this.localBasis1[0], this.localBasis1[1], this.localBasis1[2]);
	}
	public getLocalAxis2To(out: { x: number, y: number, z: number }): void {
		Method.setXYZ(out, this.localBasis2[0], this.localBasis2[1], this.localBasis2[2]);
	}
	public getTranslationalSpringDamper(): SpringDamper {
		return this._translSd;
	}
	public getRotationalSpringDamper(): SpringDamper {
		return this._rotSd;
	}
	public getTranslationalLimitMotor(): TranslationalLimitMotor {
		return this._translLm;
	}
	public getRotationalLimitMotor(): RotationalLimitMotor {
		return this._rotLm;
	}
	public getAngle(): number {
		return this.angularError[0];
	}
	public getTranslation(): number {
		return this.linearError[0];
	}
}