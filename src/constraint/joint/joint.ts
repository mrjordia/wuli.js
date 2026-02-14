import { CONSTANT, CONSTRAINT_SOLVER_TYPE, JOINT_TYPE, POSITION_CORRECTION_ALGORITHM } from '../../constant';
import JointLink from "./joint-link";
import PgsJointConstraintSolver from "../solver/pgs-joint-constraint-solver";
import DirectJointConstraintSolver from "../solver/direct/direct-joint-constraint-solver";
import JointImpulse from "./joint-impulse";
import Mat3 from "../../common/mat3";
import Method from "../../common/method";
import { World } from '../../world';
import RigidBody from '../../rigid-body/rigid-body';
import ConstraintSolver from '../solver/constraint-solver';
import JointConfig from './joint-config';
import SpringDamper from './spring-damper';
import JointSolverInfoRow from './joint-solver-info-row';
import TimeStep from '../../common/time-step';
import TranslationalLimitMotor from './translational-limit-motor';
import RotationalLimitMotor from './rotational-limit-motor';
import JointSolverInfo from './joint-solver-info';
import { Nullable } from '../../common/nullable';

export default class Joint {
	public link1: JointLink;
	public link2: JointLink;
	public readonly type: JOINT_TYPE;
	public world: Nullable<World>;
	public readonly rigidBody1: RigidBody;
	public readonly rigidBody2: RigidBody;
	public allowCollision: boolean;
	public breakForce: number;
	public breakTorque: number;
	public solver: Nullable<ConstraintSolver>;
	public localAnchor1 = new Float64Array(3);
	public localAnchor2 = new Float64Array(3);
	public relativeAnchor1 = new Float64Array(3);
	public relativeAnchor2 = new Float64Array(3);
	public anchor1 = new Float64Array(3);
	public anchor2 = new Float64Array(3);
	public localBasis1 = new Float64Array(9);
	public basis1 = new Float64Array(9);
	public localBasis2 = new Float64Array(9);
	public basis2 = new Float64Array(9);
	public appliedForce = new Float64Array(3);
	public appliedTorque = new Float64Array(3);
	public prev: Nullable<Joint>;
	public next: Nullable<Joint>;
	public impulses: Array<JointImpulse>;
	public positionCorrectionAlgorithm = CONSTANT.SETTING_DEFAULT_JOINT_POSITION_CORRECTION_ALGORITHM;

	protected _tv = new Float64Array(4);
	protected _tm = new Float64Array(9);
	private _tva = new Float64Array(4);
	private _tvb = new Float64Array(4);
	private _tvc = new Float64Array(4);
	private _tvd = new Float64Array(4);

	constructor(config: JointConfig, type: JOINT_TYPE) {
		this.link1 = new JointLink(this);
		this.link2 = new JointLink(this);
		this.type = type;
		this.rigidBody1 = config.rigidBody1;
		this.rigidBody2 = config.rigidBody2;
		this.allowCollision = config.allowCollision;
		this.breakForce = config.breakForce;
		this.breakTorque = config.breakTorque;
		switch (config.solverType) {
			case CONSTRAINT_SOLVER_TYPE.ITERATIVE:
				this.solver = new PgsJointConstraintSolver(this);
				break;
			case CONSTRAINT_SOLVER_TYPE.DIRECT:
				this.solver = new DirectJointConstraintSolver(this);
				break;
		}
		Method.copyElements(config.localAnchor1.elements, this.localAnchor1);
		Method.copyElements(config.localAnchor2.elements, this.localAnchor2);
		let _g1 = CONSTANT.SETTING_MAX_JACOBIAN_ROWS;
		this.impulses = new Array(_g1);
		let _g = 0;
		while (_g < _g1) this.impulses[_g++] = new JointImpulse();
	}
	public buildLocalBasesFromX(): void {
		const b1 = this.localBasis1, b2 = this.localBasis2;
		const tv = this._tv, tm = this._tm;
		this._setAxis(b1, 0, 1, 0, 0);
		this._setAxis(b2, 0, 1, 0, 0);
		Method.setRotFromTwoVec3(b1[0], b1[1], b1[2], b2[0], b2[1], b2[2], tv, tm);
		Method.vecToQuat(b1[0], b1[1], b1[2], tv);
		Method.setElements(b1, 3, tv[0], tv[1], tv[2]);
		Method.setElements(b1, 6, b1[1] * b1[5] - b1[2] * b1[4], b1[2] * b1[3] - b1[0] * b1[5], b1[0] * b1[4] - b1[1] * b1[3]);
		Method.multiplyBasis(tm, b1, b2);
	}

	public buildLocalBasesFromXY(): void {
		const bs1 = this.localBasis1, bs2 = this.localBasis2;
		this._setAxis(bs1, 0, 1, 0, 0);
		this._setAxis(bs2, 0, 1, 0, 0);
		Method.crossVectors(bs1[0], bs1[1], bs1[2], bs1[3], bs1[4], bs1[5], bs1, 6);
		Method.crossVectors(bs2[0], bs2[1], bs2[2], bs2[3], bs2[4], bs2[5], bs2, 6);
		this._setAxisYZ(bs1);
		this._setAxisYZ(bs2);
	}
	public buildLocalBasesFromX1Z2(): void {
		const bs1 = this.localBasis1, bs2 = this.localBasis2;
		this._setAxis(bs1, 0, 1, 0, 0);
		this._setAxis(bs2, 6, 0, 0, 1);
		const tf1 = this.rigidBody1.transform.elements;
		const tf2 = this.rigidBody2.transform.elements;
		const wX1 = this._tv, wZ2 = this._tva, wY = this._tvb, wZ1 = this._tvc, wX2 = this._tvd;
		Method.transformVec3(tf1, bs1, 1, wX1, 0);
		Method.transformVec3(tf2, bs2, 1, wZ2, 6);
		Method.crossVectors(wZ2[0], wZ2[1], wZ2[2], wX1[0], wX1[1], wX1[2], wY, 0);
		if (wY[0] * wY[0] + wY[1] * wY[1] + wY[2] * wY[2] === 0) {
			Method.vecToQuat(wX1[0], wX1[1], wX1[2], wY);
		}
		Method.crossVectors(wX1[0], wX1[1], wX1[2], wY[0], wY[1], wY[2], wZ1, 0);
		Method.crossVectors(wY[0], wY[1], wY[2], wZ2[0], wZ2[1], wZ2[2], wX2, 0);
		Method.inverseTransformVec3(tf1, wX1, 1, bs1, 0, 0);
		Method.inverseTransformVec3(tf1, wY, 1, bs1, 0, 3);
		Method.inverseTransformVec3(tf1, wZ1, 1, bs1, 0, 6);
		Method.inverseTransformVec3(tf2, wX2, 1, bs2, 0, 0);
		Method.inverseTransformVec3(tf2, wY, 1, bs2, 0, 3);
		Method.inverseTransformVec3(tf2, wZ2, 1, bs2, 0, 6);
	}
	public buildLocalBasesFromXY1X2(): void {
		const bs1 = this.localBasis1, bs2 = this.localBasis2;
		const tv = this._tv, tm = this._tm;
		this._setAxis(bs1, 0, 1, 0, 0);
		Method.crossVectors(bs1[0], bs1[1], bs1[2], bs1[3], bs1[4], bs1[5], bs1, 6);
		this._setAxisYZ(bs1);
		Method.setRotFromTwoVec3(bs1[0], bs1[1], bs1[2], bs2[0], bs2[1], bs2[2], tv, tm);
		Method.multiplyBasis(tm, bs1, bs2);
	}
	public setSolverInfoRowLinear(row: JointSolverInfoRow, diff: number, lm: TranslationalLimitMotor, mass: number, sd: SpringDamper, timeStep: Nullable<TimeStep>, isPositionPart: boolean): void {
		const SLS = CONSTANT.SETTING_LINEAR_SLOP;
		const SDR = CONSTANT.SETTING_MIN_SPRING_DAMPER_DAMPING_RATIO;
		let tv = this._tv;
		this._setMotor(isPositionPart, sd, row, timeStep, lm, SLS, SDR, lm.motorForce, tv);
		let cfmFactor = tv[0];
		let erp = tv[1];
		let slop = tv[2];
		let lower = lm.lowerLimit;
		let upper = lm.upperLimit;
		this._setRowImpulseInfo(row, lm, diff, slop, cfmFactor, erp, mass, lower, upper);
	}
	public setSolverInfoRowAngular(row: JointSolverInfoRow, diff: number, lm: RotationalLimitMotor, mass: number, sd: SpringDamper, timeStep: Nullable<TimeStep>, isPositionPart: boolean): void {
		const SAS = CONSTANT.SETTING_ANGULAR_SLOP;
		const SDR = CONSTANT.SETTING_MIN_SPRING_DAMPER_DAMPING_RATIO;
		let tv = this._tv;
		this._setMotor(isPositionPart, sd, row, timeStep, lm, SAS, SDR, lm.motorTorque, tv);
		let cfmFactor = tv[0];
		let erp = tv[1];
		let slop = tv[2];
		let lower = lm.lowerLimit;
		let upper = lm.upperLimit;
		let mid = (lower + upper) * 0.5;
		diff -= mid;
		diff = ((diff + 3.14159265358979) % 6.28318530717958 + 6.28318530717958) % 6.28318530717958 - 3.14159265358979;
		diff += mid;
		this._setRowImpulseInfo(row, lm, diff, slop, cfmFactor, erp, mass, lower, upper);
	}
	public getErp(timeStep: Nullable<TimeStep>, isPositionPart: boolean): number {
		const PCB = POSITION_CORRECTION_ALGORITHM.BAUMGARTE;
		const SVB = CONSTANT.SETTING_VELOCITY_BAUMGARTE;
		if (isPositionPart) {
			return 1;
		} else if (this.positionCorrectionAlgorithm === PCB && timeStep) {
			return timeStep.invDt * SVB;
		} else {
			return 0;
		}
	}
	public computeEffectiveInertiaMoment(axisX: number, axisY: number, axisZ: number): number {
		const ii1 = this.rigidBody1.invInertia, ii2 = this.rigidBody2.invInertia;
		const ra1 = this.relativeAnchor1, ra2 = this.relativeAnchor2;
		const ia1 = this._tv, ia2 = this._tva;
		Method.rotateVecTo(axisX, axisY, axisZ, ii1, ia1);
		Method.rotateVecTo(axisX, axisY, axisZ, ii2, ia2);
		const invI1 = Method.inverseInertia(axisX, axisY, axisZ, ia1, ra1, this.rigidBody1.invMass, this.rigidBody1.mass);
		const invI2 = Method.inverseInertia(axisX, axisY, axisZ, ia2, ra2, this.rigidBody2.invMass, this.rigidBody2.mass);
		return (invI1 + invI2 === 0) ? 0 : 1 / (invI1 + invI2);
	}
	public computeEffectiveInertiaMoment2(axis1X: number, axis1Y: number, axis1Z: number, axis2X: number, axis2Y: number, axis2Z: number): number {
		const ii1 = this.rigidBody1.invInertia, ii2 = this.rigidBody2.invInertia;
		const ra1 = this.relativeAnchor1, ra2 = this.relativeAnchor2;
		const ia1 = this._tv, ia2 = this._tva;
		Method.rotateVecTo(axis1X, axis1Y, axis1Z, ii1, ia1);
		Method.rotateVecTo(axis2X, axis2Y, axis2Z, ii2, ia2);
		const invI1 = Method.inverseInertia(axis1X, axis1Y, axis1Z, ia1, ra1, this.rigidBody1.invMass, this.rigidBody1.mass);
		const invI2 = Method.inverseInertia(axis2X, axis2Y, axis2Z, ia2, ra2, this.rigidBody2.invMass, this.rigidBody2.mass);
		return (invI1 + invI2 === 0) ? 0 : 1 / (invI1 + invI2);
	}
	public syncAnchors(): void {
		const bs1 = this.localBasis1, la1 = this.localAnchor1, ra1 = this.relativeAnchor1, a1 = this.anchor1, b1 = this.basis1;
		const bs2 = this.localBasis2, la2 = this.localAnchor2, ra2 = this.relativeAnchor2, a2 = this.anchor2, b2 = this.basis2;
		const tf1 = this.rigidBody1.transform.elements, tf2 = this.rigidBody2.transform.elements;
		Method.transformVec3(tf1, la1, 1, ra1);
		Method.transformVec3(tf2, la2, 1, ra2);
		Method.transformVec3(tf1, ra1, 2, a1);
		Method.transformVec3(tf2, ra2, 2, a2);
		Method.transformM3(tf1, bs1, b1);
		Method.transformM3(tf2, bs2, b2);
	}
	public getVelocitySolverInfo(timeStep: TimeStep, info: JointSolverInfo): void {
		info.rigidBody1 = this.rigidBody1;
		info.rigidBody2 = this.rigidBody2;
		info.numRows = 0;
	}
	public getPositionSolverInfo(info: JointSolverInfo): void {
		info.rigidBody1 = this.rigidBody1;
		info.rigidBody2 = this.rigidBody2;
		info.numRows = 0;
	}

	public checkDestruction(): void {
		const at = this.appliedTorque, af = this.appliedForce, bf = this.breakForce, bt = this.breakTorque;
		const torqueSq = at[0] * at[0] + at[1] * at[1] + at[2] * at[2];
		if (bf > 0 && af[0] * af[0] + af[1] * af[1] + af[2] * af[2] > bf * bf) {
			this.world!.removeJoint(this);
			return;
		}
		if (bt > 0 && torqueSq > bt * bt) {
			this.world!.removeJoint(this);
		}
	}

	public getType(): JOINT_TYPE {
		return this.type;
	}

	public getAnchor1To(anchor: { x: number, y: number, z: number }): void {
		Method.setXYZ(anchor, this.anchor1[0], this.anchor1[1], this.anchor1[2]);
	}
	public getAnchor2To(anchor: { x: number, y: number, z: number }): void {
		Method.setXYZ(anchor, this.anchor2[0], this.anchor2[1], this.anchor2[2]);
	}

	public getLocalAnchor1To(localAnchor: { x: number, y: number, z: number }): void {
		Method.setXYZ(localAnchor, this.localAnchor1[0], this.localAnchor1[1], this.localAnchor1[2]);
	}
	public getLocalAnchor2To(localAnchor: { x: number, y: number, z: number }): void {
		Method.setXYZ(localAnchor, this.localAnchor2[0], this.localAnchor2[1], this.localAnchor2[2]);
	}

	public getBasis1To(basis: Mat3): void {
		const b = this.basis1;
		Method.setM3X3(basis.elements, b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7], b[8]);
	}
	public getBasis2To(basis: Mat3): void {
		const b = this.basis2;
		Method.setM3X3(basis.elements, b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7], b[8]);
	}

	public getAppliedForceTo(appliedForce: { x: number, y: number, z: number }): void {
		Method.setXYZ(appliedForce, this.appliedForce[0], this.appliedForce[1], this.appliedForce[2]);
	}

	public getAppliedTorqueTo(appliedTorque: { x: number, y: number, z: number }): void {
		Method.setXYZ(appliedTorque, this.appliedTorque[0], this.appliedTorque[1], this.appliedTorque[2]);
	}

	protected resetRow(row: JointSolverInfoRow, impulse: JointImpulse) {
		Method.fillValue(row.jacobian.elements, 0, 11, 0);
		row.rhs = 0;
		row.cfm = 0;
		row.minImpulse = 0;
		row.maxImpulse = 0;
		row.motorSpeed = 0;
		row.motorMaxImpulse = 0;
		row.impulse = null;
		row.impulse = impulse;
	}
	private _setAxisYZ(els: Float64Array): void {
		const tv = this._tv;
		const l = els[6] * els[6] + els[7] * els[7] + els[8] * els[8];
		if (l === 0) {
			Method.vecToQuat(els[0], els[1], els[2], tv);
			Method.setElements(els, 3, tv[0], tv[1], tv[2]);
			Method.crossVectors(els[0], els[1], els[2], els[3], els[4], els[5], els, 6);
		} else {
			Method.scaleArray(els, l > 0 ? 1 / Math.sqrt(l) : l, els, 6, 6, 3);
			Method.crossVectors(els[6], els[7], els[8], els[0], els[1], els[2], els, 3);
		}
	}
	private _setAxis(els: Float64Array, start = 0, x = 1, y = 0, z = 0): void {
		const l = els[start] * els[start] + els[start + 1] * els[start + 1] + els[start + 2] * els[start + 2];
		if (l === 0) {
			Method.setElements(els, start, x, y, z);
		} else {
			Method.scaleArray(els, l > 0 ? 1 / Math.sqrt(l) : l, els, start, start, 3);
		}
	}
	private _setMotor(isPositionPart: boolean, sd: SpringDamper, row: JointSolverInfoRow, timeStep: Nullable<TimeStep>, lm: TranslationalLimitMotor | RotationalLimitMotor, slopDefault: number, zetaDefault: number, value: number, out: Float64Array): void {
		let cfmFactor: number, erp: number;
		let slop = slopDefault;
		if (isPositionPart) {
			cfmFactor = 0;
			erp = 1;
		} else if (timeStep) {
			if (sd.frequency > 0) {
				slop = 0;
				const omega = 6.28318530717958 * sd.frequency;
				let zeta = sd.dampingRatio;
				if (zeta < zetaDefault) {
					zeta = zetaDefault;
				}
				const h = timeStep.dt;
				const c = 2 * zeta * omega;
				const k = omega * omega;
				if (sd.useSymplecticEuler) {
					cfmFactor = 1 / (h * c);
					erp = k / c;
				} else {
					cfmFactor = 1 / (h * (h * k + c));
					erp = k / (h * k + c);
				}
			} else {
				cfmFactor = 0;
				erp = this.getErp(timeStep, false);
			}
			if (value > 0) {
				row.motorSpeed = lm.motorSpeed;
				row.motorMaxImpulse = value * timeStep.dt;
			} else {
				row.motorSpeed = 0;
				row.motorMaxImpulse = 0;
			}
		} else {
			cfmFactor = 0;
			erp = 1;
		}
		out[0] = cfmFactor;
		out[1] = erp;
		out[2] = slop;
	}
	private _setRowImpulseInfo(row: JointSolverInfoRow, lm: TranslationalLimitMotor | RotationalLimitMotor, diff: number, slop: number, cfmFactor: number, erp: number, mass: number, lower: number, upper: number): void {
		let minImp: number, maxImp: number, error: number;
		if (lower > upper) {
			minImp = maxImp = error = 0;
		} else if (lower === upper) {
			minImp = -1e65536;
			maxImp = 1e65536;
			error = diff - lower;
		} else if (diff < lower) {
			minImp = -1e65536;
			maxImp = 0;
			error = diff - lower + slop;
			if (error > 0) {
				error = 0;
			}
		} else if (diff > upper) {
			minImp = 0;
			maxImp = 1e65536;
			error = diff - upper - slop;
			if (error < 0) {
				error = 0;
			}
		} else {
			minImp = maxImp = error = 0;
		}
		row.minImpulse = minImp;
		row.maxImpulse = maxImp;
		row.cfm = cfmFactor * (mass === 0 ? 0 : 1 / mass);
		row.rhs = error * erp;
	}

}