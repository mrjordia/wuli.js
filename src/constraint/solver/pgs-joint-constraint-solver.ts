import ConstraintSolver from "./constraint-solver";
import JointSolverInfo from "../joint/joint-solver-info";
import { CONSTANT, POSITION_CORRECTION_ALGORITHM } from '../../constant';
import JointSolverMassDataRow from "../joint/joint-solver-mass-data-row";
import Joint from "../joint/joint";
import TimeStep from "../../common/time-step";

export default class PgsJointConstraintSolver extends ConstraintSolver {
	public joint: Joint;
	public info = new JointSolverInfo();
	public massData: Array<JointSolverMassDataRow> = new Array(CONSTANT.SETTING_MAX_JACOBIAN_ROWS);
	constructor(joint: Joint) {
		super();
		this.joint = joint;
		let _g = 0, _g1 = this.massData.length;
		while (_g < _g1) this.massData[_g++] = new JointSolverMassDataRow();
	}
	public preSolveVelocity(timeStep: TimeStep): void {
		this.joint.syncAnchors();
		this.joint.getVelocitySolverInfo(timeStep, this.info);
		this._b1 = this.info.rigidBody1!;
		const invM1 = this._b1.invMass, ii1 = this._b1.invInertia;
		this._b2 = this.info.rigidBody2!;
		const invM2 = this._b2.invMass, ii2 = this._b2.invInertia;
		const invI100 = ii1[0], invI101 = ii1[1], invI102 = ii1[2];
		const invI110 = ii1[3], invI111 = ii1[4], invI112 = ii1[5];
		const invI120 = ii1[6], invI121 = ii1[7], invI122 = ii1[8];
		const invI200 = ii2[0], invI201 = ii2[1], invI202 = ii2[2];
		const invI210 = ii2[3], invI211 = ii2[4], invI212 = ii2[5];
		const invI220 = ii2[6], invI221 = ii2[7], invI222 = ii2[8];
		let _g = 0, _g1 = this.info.numRows;
		while (_g < _g1) {
			const i = _g++;
			const row = this.info.rows[i];
			const md = this.massData[i].elements;
			let j = row.jacobian;
			j.updateSparsity();
			const je = j.elements;
			if ((je[12] & 1) !== 0) {
				md[0] = je[0] * invM1; md[1] = je[1] * invM1; md[2] = je[2] * invM1;
				md[3] = je[3] * invM2; md[4] = je[4] * invM2; md[5] = je[5] * invM2;
			} else {
				md[0] = md[1] = md[2] = md[3] = md[4] = md[5] = 0;
			}
			if ((je[12] & 2) !== 0) {
				md[6] = invI100 * je[6] + invI101 * je[7] + invI102 * je[8];
				md[7] = invI110 * je[6] + invI111 * je[7] + invI112 * je[8];
				md[8] = invI120 * je[6] + invI121 * je[7] + invI122 * je[8];
				md[9] = invI200 * je[9] + invI201 * je[10] + invI202 * je[11];
				md[10] = invI210 * je[9] + invI211 * je[10] + invI212 * je[11];
				md[11] = invI220 * je[9] + invI221 * je[10] + invI222 * je[11];
			} else {
				md[6] = md[7] = md[8] = md[9] = md[10] = md[11] = 0;
			}
			md[13] = md[0] * je[0] + md[1] * je[1] + md[2] * je[2] +
				(md[3] * je[3] + md[4] * je[4] + md[5] * je[5]) +
				(md[6] * je[6] + md[7] * je[7] + md[8] * je[8]) +
				(md[9] * je[9] + md[10] * je[10] + md[11] * je[11]);
			md[12] = md[13] + row.cfm;
			if (md[13] !== 0) {
				md[13] = 1 / md[13];
			}
			if (md[12] !== 0) {
				md[12] = 1 / md[12];
			}
		}
	}
	public warmStart(timeStep: TimeStep): void {
		const PCB = POSITION_CORRECTION_ALGORITHM.BAUMGARTE;
		const WSB = CONSTANT.SETTING_JOINT_WARM_STARTING_FACTOR_FOR_BAUNGARTE;
		const WSF = CONSTANT.SETTING_JOINT_WARM_STARTING_FACTOR;
		let factor = this.joint.positionCorrectionAlgorithm === PCB ? WSB : WSF;
		factor *= timeStep.dtRatio;
		if (factor <= 0) {
			let _g = 0, _g1 = this.info.numRows;
			while (_g < _g1) {
				const _this = this.info.rows[_g++].impulse!;
				_this.impulse = _this.impulseM = _this.impulseP = 0;
			}
			return;
		}
		const b1v = this._b1!.vel;
		const b2v = this._b2!.vel;
		const b1a = this._b1!.angVel;
		const b2a = this._b2!.angVel;
		let lv1X = b1v[0], lv1Y = b1v[1], lv1Z = b1v[2];
		let lv2X = b2v[0], lv2Y = b2v[1], lv2Z = b2v[2];
		let av1X = b1a[0], av1Y = b1a[1], av1Z = b1a[2];
		let av2X = b2a[0], av2Y = b2a[1], av2Z = b2a[2];
		let _g = 0, _g1 = this.info.numRows;
		while (_g < _g1) {
			const i = _g++;
			const md = this.massData[i].elements;
			const imp = this.info.rows[i].impulse!;
			imp.impulse *= factor;
			imp.impulseM *= factor;
			const impulse = imp.impulse + imp.impulseM;
			lv1X += md[0] * impulse; lv1Y += md[1] * impulse; lv1Z += md[2] * impulse;
			lv2X += md[3] * -impulse; lv2Y += md[4] * -impulse; lv2Z += md[5] * -impulse;
			av1X += md[6] * impulse; av1Y += md[7] * impulse; av1Z += md[8] * impulse;
			av2X += md[9] * -impulse; av2Y += md[10] * -impulse; av2Z += md[11] * -impulse;
		}
		b1v[0] = lv1X; b1v[1] = lv1Y; b1v[2] = lv1Z;
		b2v[0] = lv2X; b2v[1] = lv2Y; b2v[2] = lv2Z;
		b1a[0] = av1X; b1a[1] = av1Y; b1a[2] = av1Z;
		b2a[0] = av2X; b2a[1] = av2Y; b2a[2] = av2Z;
	}
	public solveVelocity(): void {
		const b1v = this._b1!.vel, b1a = this._b1!.angVel;
		const b2v = this._b2!.vel, b2a = this._b2!.angVel;
		let lv1X = b1v[0], lv1Y = b1v[1], lv1Z = b1v[2];
		let lv2X = b2v[0], lv2Y = b2v[1], lv2Z = b2v[2];
		let av1X = b1a[0], av1Y = b1a[1], av1Z = b1a[2];
		let av2X = b2a[0], av2Y = b2a[1], av2Z = b2a[2];
		let _g = 0, _g1 = this.info.numRows;
		while (_g < _g1) {
			const i = _g++;
			const row = this.info.rows[i];
			const md = this.massData[i].elements;
			const imp = row.impulse!;
			const j = row.jacobian.elements;
			if (row.motorMaxImpulse === 0) {
				continue;
			}
			let rv = 0;
			rv += lv1X * j[0] + lv1Y * j[1] + lv1Z * j[2];
			rv -= lv2X * j[3] + lv2Y * j[4] + lv2Z * j[5];
			rv += av1X * j[6] + av1Y * j[7] + av1Z * j[8];
			rv -= av2X * j[9] + av2Y * j[10] + av2Z * j[11];
			let impulseM = (-row.motorSpeed - rv) * md[13];
			const oldImpulseM = imp.impulseM;
			imp.impulseM += impulseM;
			if (imp.impulseM < -row.motorMaxImpulse) {
				imp.impulseM = -row.motorMaxImpulse;
			} else if (imp.impulseM > row.motorMaxImpulse) {
				imp.impulseM = row.motorMaxImpulse;
			}
			impulseM = imp.impulseM - oldImpulseM;
			if ((j[12] & 1) !== 0) {
				lv1X += md[0] * impulseM; lv1Y += md[1] * impulseM; lv1Z += md[2] * impulseM;
				lv2X += md[3] * -impulseM; lv2Y += md[4] * -impulseM; lv2Z += md[5] * -impulseM;
			}
			if ((j[12] & 2) !== 0) {
				av1X += md[6] * impulseM; av1Y += md[7] * impulseM; av1Z += md[8] * impulseM;
				av2X += md[9] * -impulseM; av2Y += md[10] * -impulseM; av2Z += md[11] * -impulseM;
			}
		}
		let _g2 = 0, _g3 = this.info.numRows;
		while (_g2 < _g3) {
			const i = _g2++;
			const row = this.info.rows[i];
			const md = this.massData[i].elements;
			const imp = row.impulse!;
			const j = row.jacobian.elements;
			let rv = 0;
			rv += lv1X * j[0] + lv1Y * j[1] + lv1Z * j[2];
			rv -= lv2X * j[3] + lv2Y * j[4] + lv2Z * j[5];
			rv += av1X * j[6] + av1Y * j[7] + av1Z * j[8];
			rv -= av2X * j[9] + av2Y * j[10] + av2Z * j[11];
			let impulse = (row.rhs - rv - imp.impulse * row.cfm) * md[12];
			const oldImpulse = imp.impulse;
			imp.impulse += impulse;
			if (imp.impulse < row.minImpulse) {
				imp.impulse = row.minImpulse;
			} else if (imp.impulse > row.maxImpulse) {
				imp.impulse = row.maxImpulse;
			}
			impulse = imp.impulse - oldImpulse;
			if ((j[12] & 1) !== 0) {
				lv1X += md[0] * impulse; lv1Y += md[1] * impulse; lv1Z += md[2] * impulse;
				lv2X += md[3] * -impulse; lv2Y += md[4] * -impulse; lv2Z += md[5] * -impulse;
			}
			if ((j[12] & 2) !== 0) {
				av1X += md[6] * impulse; av1Y += md[7] * impulse; av1Z += md[8] * impulse;
				av2X += md[9] * -impulse; av2Y += md[10] * -impulse; av2Z += md[11] * -impulse;
			}
		}
		b1v[0] = lv1X; b1v[1] = lv1Y; b1v[2] = lv1Z;
		b2v[0] = lv2X; b2v[1] = lv2Y; b2v[2] = lv2Z;
		b1a[0] = av1X; b1a[1] = av1Y; b1a[2] = av1Z;
		b2a[0] = av2X; b2a[1] = av2Y; b2a[2] = av2Z;
	}
	public postSolveVelocity(timeStep: TimeStep): void {
		let linX = 0, linY = 0, linZ = 0;
		let angX = 0, angY = 0, angZ = 0;
		let _g = 0, _g1 = this.info.numRows;
		while (_g < _g1) {
			const row = this.info.rows[_g++];
			const imp = row.impulse!.impulse;
			const j = row.jacobian.elements;
			if ((j[12] & 1) !== 0) {
				linX += j[0] * imp; linY += j[1] * imp; linZ += j[2] * imp;
			} else if ((j[12] & 2) !== 0) {
				angX += j[6] * imp; angY += j[7] * imp; angZ += j[8] * imp;
			}
		}
		const invDt = timeStep.invDt, appliedForce = this.joint.appliedForce, appliedTorque = this.joint.appliedTorque;
		appliedForce[0] = linX * invDt; appliedForce[1] = linY * invDt; appliedForce[2] = linZ * invDt;
		appliedTorque[0] = angX * invDt; appliedTorque[1] = angY * invDt; appliedTorque[2] = angZ * invDt;
	}
	public preSolvePosition(timeStep: TimeStep): void {
		this.joint.syncAnchors();
		this.joint.getPositionSolverInfo(this.info);
		this._b1 = this.info.rigidBody1!;
		const invM1 = this._b1.invMass, ii1 = this._b1.invInertia;
		this._b2 = this.info.rigidBody2!;
		const invM2 = this._b2.invMass, ii2 = this._b2.invInertia;
		const invI100 = ii1[0], invI101 = ii1[1], invI102 = ii1[2];
		const invI110 = ii1[3], invI111 = ii1[4], invI112 = ii1[5];
		const invI120 = ii1[6], invI121 = ii1[7], invI122 = ii1[8];
		const invI200 = ii2[0], invI201 = ii2[1], invI202 = ii2[2];
		const invI210 = ii2[3], invI211 = ii2[4], invI212 = ii2[5];
		const invI220 = ii2[6], invI221 = ii2[7], invI222 = ii2[8];
		let _g = 0, _g1 = this.info.numRows;
		while (_g < _g1) {
			const i = _g++;
			const md = this.massData[i].elements;
			const j = this.info.rows[i].jacobian.elements;
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
			md[12] = md[0] * j[0] + md[1] * j[1] + md[2] * j[2] +
				(md[3] * j[3] + md[4] * j[4] + md[5] * j[5]) +
				(md[6] * j[6] + md[7] * j[7] + md[8] * j[8]) +
				(md[9] * j[9] + md[10] * j[10] + md[11] * j[11]);
			if (md[12] !== 0) {
				md[12] = 1 / md[12];
			}
		}
		let _g2 = 0, _g3 = this.info.numRows;
		while (_g2 < _g3) this.info.rows[_g2++].impulse!.impulseP = 0;
	}
	public solvePositionSplitImpulse(): void {
		const PIB = CONSTANT.SETTING_POSITION_SPLIT_IMPULSE_BAUMGARTE;
		const pv1 = this._b1!.pseudoVel, av1 = this._b1!.angPseudoVel;
		const pv2 = this._b2!.pseudoVel, av2 = this._b2!.angPseudoVel;
		let lv1X = pv1[0], lv1Y = pv1[1], lv1Z = pv1[2];
		let lv2X = pv2[0], lv2Y = pv2[1], lv2Z = pv2[2];
		let av1X = av1[0], av1Y = av1[1], av1Z = av1[2];
		let av2X = av2[0], av2Y = av2[1], av2Z = av2[2];
		let _g = 0, _g1 = this.info.numRows;
		while (_g < _g1) {
			const i = _g++;
			const row = this.info.rows[i];
			const md = this.massData[i].elements;
			const imp = row.impulse!;
			const j = row.jacobian.elements;
			let rv = lv1X * j[0] + lv1Y * j[1] + lv1Z * j[2];
			rv -= lv2X * j[3] + lv2Y * j[4] + lv2Z * j[5];
			rv += av1X * j[6] + av1Y * j[7] + av1Z * j[8];
			rv -= av2X * j[9] + av2Y * j[10] + av2Z * j[11];
			let impulseP = (row.rhs * PIB - rv) * md[12];
			const oldImpulseP = imp.impulseP;
			imp.impulseP += impulseP;
			if (imp.impulseP < row.minImpulse) {
				imp.impulseP = row.minImpulse;
			} else if (imp.impulseP > row.maxImpulse) {
				imp.impulseP = row.maxImpulse;
			}
			impulseP = imp.impulseP - oldImpulseP;
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
	public solvePositionNgs(timeStep: TimeStep): void {
		const PNB = CONSTANT.SETTING_POSITION_NGS_BAUMGARTE;
		this.joint.syncAnchors();
		this.joint.getPositionSolverInfo(this.info);
		this._b1 = this.info.rigidBody1!;
		const invM1 = this._b1.invMass, ii1 = this._b1.invInertia, tf1 = this._b1.transform.elements, il1 = this._b1.invLocalInertia, rf1 = this._b1.rotFactor.elements;
		this._b2 = this.info.rigidBody2!;
		const invM2 = this._b2.invMass, ii2 = this._b2.invInertia, tf2 = this._b2.transform.elements, il2 = this._b2.invLocalInertia, rf2 = this._b2.rotFactor.elements;
		const invI100 = ii1[0], invI101 = ii1[1], invI102 = ii1[2];
		const invI110 = ii1[3], invI111 = ii1[4], invI112 = ii1[5];
		const invI120 = ii1[6], invI121 = ii1[7], invI122 = ii1[8];
		const invI200 = ii2[0], invI201 = ii2[1], invI202 = ii2[2];
		const invI210 = ii2[3], invI211 = ii2[4], invI212 = ii2[5];
		const invI220 = ii2[6], invI221 = ii2[7], invI222 = ii2[8];
		let _g = 0, _g1 = this.info.numRows;
		while (_g < _g1) {
			const i = _g++;
			const md = this.massData[i].elements;
			const j = this.info.rows[i].jacobian.elements;
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
			md[12] = md[0] * j[0] + md[1] * j[1] + md[2] * j[2] +
				(md[3] * j[3] + md[4] * j[4] + md[5] * j[5]) +
				(md[6] * j[6] + md[7] * j[7] + md[8] * j[8]) +
				(md[9] * j[9] + md[10] * j[10] + md[11] * j[11]);
			if (md[12] !== 0) {
				md[12] = 1 / md[12];
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
			const imp = row.impulse!;
			const j = row.jacobian.elements;
			let rv = 0;
			rv += lv1X * j[0] + lv1Y * j[1] + lv1Z * j[2];
			rv -= lv2X * j[3] + lv2Y * j[4] + lv2Z * j[5];
			rv += av1X * j[6] + av1Y * j[7] + av1Z * j[8];
			rv -= av2X * j[9] + av2Y * j[10] + av2Z * j[11];
			let impulseP = (row.rhs * PNB - rv) * md[12];
			const oldImpulseP = imp.impulseP;
			imp.impulseP += impulseP;
			if (imp.impulseP < row.minImpulse) {
				imp.impulseP = row.minImpulse;
			} else if (imp.impulseP > row.maxImpulse) {
				imp.impulseP = row.maxImpulse;
			}
			impulseP = imp.impulseP - oldImpulseP;
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
	public postSolve(): void {
		this.joint.syncAnchors();
		this.joint.checkDestruction();
	}
}