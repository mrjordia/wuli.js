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


export default class RevoluteJoint extends Joint {
	public angularError = new Float64Array(3);//0:angle,1:angularErrorY,2:angularErrorZ
	public linearError = new Float64Array(3);

	private _basis: BasisTracker;
	private _sd: SpringDamper;
	private _lm: RotationalLimitMotor;
	constructor(config: RevoluteJointConfig) {
		super(config, JOINT_TYPE.REVOLUTE);
		Method.copyElements(config.localAxis1.elements, this.localBasis1, 0, 0, 3);
		Method.copyElements(config.localAxis2.elements, this.localBasis2, 0, 0, 3);
		this.buildLocalBasesFromX();
		this._basis = new BasisTracker(this);
		this._sd = config.springDamper.clone();
		this._lm = config.limitMotor.clone();
	}

	public get angle(): number { return this.angularError[0]; }
	public get angularErrorY(): number { return this.angularError[1]; }
	public get angularErrorZ(): number { return this.angularError[2]; }
	public set angle(n: number) { this.angularError[0] = n; }
	public set angularErrorY(n: number) { this.angularError[1] = n; }
	public set angularErrorZ(n: number) { this.angularError[2] = n; }

	public get linearErrorX(): number { return this.linearError[0]; }
	public get linearErrorY(): number { return this.linearError[1]; }
	public get linearErrorZ(): number { return this.linearError[2]; }
	public set linearErrorX(n: number) { this.linearError[0] = n; }
	public set linearErrorY(n: number) { this.linearError[1] = n; }
	public set linearErrorZ(n: number) { this.linearError[2] = n; }

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
	public getLimitMotor(): RotationalLimitMotor {
		return this._lm;
	}
	public getAngle(): number {
		return this.angularError[0];
	}
}