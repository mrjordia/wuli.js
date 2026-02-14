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


export default class GenericJoint extends Joint {
	public angle = new Float64Array(3);
	public translation = new Float64Array(3);
	public axis = new Float64Array(9);
	public xSingular = false;
	public ySingular = false;
	public zSingular = false;

	private _translLms: Array<TranslationalLimitMotor>;
	private _translSds: Array<SpringDamper>;
	private _rotLms: Array<RotationalLimitMotor>;
	private _rotSds: Array<SpringDamper>;

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
	public getVelocitySolverInfo(timeStep: TimeStep, info: JointSolverInfo): void {
		super.getVelocitySolverInfo(timeStep, info);
		this.getInfo(info, timeStep, false);
	}
	public getPositionSolverInfo(info: JointSolverInfo): void {
		super.getPositionSolverInfo(info);
		this.getInfo(info, null, true);
	}
	public getAxisXTo(out: { x: number, y: number, z: number }): void {
		Method.setXYZ(out, this.basis1[0], this.basis1[1], this.basis1[2]);
	}
	public getAxisYTo(out: { x: number, y: number, z: number }): void {
		Method.setXYZ(out, this.basis1[3], this.basis1[4], this.basis1[5]);
	}
	public getAxisZ(out: { x: number, y: number, z: number }): void {
		Method.setXYZ(out, this.basis1[6], this.basis1[7], this.basis1[8]);
	}
	public getTranslationalSpringDampers(): Array<SpringDamper> {
		return this._translSds.slice(0);
	}
	public getRotationalSpringDampers(): Array<SpringDamper> {
		return this._translSds.slice(0);
	}
	public getTranslationalLimitMotors(): Array<TranslationalLimitMotor> {
		return this._translLms.slice(0);
	}
	public getRotationalLimitMotors(): Array<RotationalLimitMotor> {
		return this._rotLms.slice(0);
	}
	public getAngles(out: { x: number, y: number, z: number }): void {
		Method.setXYZ(out, this.angle[0], this.angle[1], this.angle[2]);
	}
	public getTranslations(out: { x: number, y: number, z: number }): void {
		Method.setXYZ(out, this.translation[0], this.translation[1], this.translation[2]);
	}
}