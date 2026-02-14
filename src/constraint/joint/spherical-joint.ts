import Joint from './joint';
import { CONSTANT, JOINT_TYPE } from '../../constant';
import Method from "../../common/method";
import SphericalJointConfig from './spherical-joint-config';
import SpringDamper from './spring-damper';
import JointSolverInfo from './joint-solver-info';
import TimeStep from '../../common/time-step';
import { Nullable } from '../../common/nullable';

export default class SphericalJoint extends Joint {
	public springDamper: SpringDamper;
	constructor(config: SphericalJointConfig) {
		super(config, JOINT_TYPE.SPHERICAL);
		this.springDamper = config.springDamper.clone();
	}
	public getInfo(info: JointSolverInfo, timeStep: Nullable<TimeStep>, isPositionPart: boolean): void {
		const SDR = CONSTANT.SETTING_MIN_SPRING_DAMPER_DAMPING_RATIO;
		if (this.springDamper.frequency > 0 && isPositionPart) {
			return;
		}
		const tv = this._tv;
		Method.subArray(this.anchor2, this.anchor1, tv, 0, 0, 0, 3);
		const errorX = tv[0], errorY = tv[1], errorZ = tv[2];
		let cfm: number;
		let erp: number;
		if (this.springDamper.frequency > 0 && timeStep) {
			const omega = 6.28318530717958 * this.springDamper.frequency;
			let zeta = this.springDamper.dampingRatio;
			if (zeta < SDR) {
				zeta = SDR;
			}
			const h = timeStep.dt;
			const c = 2 * zeta * omega;
			const k = omega * omega;
			if (this.springDamper.useSymplecticEuler) {
				cfm = 1 / (h * c);
				erp = k / c;
			} else {
				cfm = 1 / (h * (h * k + c));
				erp = k / (h * k + c);
			}
			cfm *= this.rigidBody1.invMass + this.rigidBody2.invMass;
		} else {
			cfm = 0;
			erp = this.getErp(timeStep, isPositionPart);
		}
		const linearRhsX = errorX * erp, linearRhsY = errorY * erp, linearRhsZ = errorZ * erp;
		const ra1 = this.relativeAnchor1, ra2 = this.relativeAnchor2;
		const c100 = 0, c101 = ra1[2], c102 = -ra1[1];
		const c110 = -ra1[2], c111 = 0, c112 = ra1[0];
		const c120 = ra1[1], c121 = -ra1[0], c122 = 0;
		const c200 = 0, c201 = ra2[2], c202 = -ra2[1];
		const c210 = -ra2[2], c211 = 0, c212 = ra2[0];
		const c220 = ra2[1], c221 = -ra2[0], c222 = 0;
		const impulse = this.impulses[0];
		const row = info.rows[info.numRows++];
		this.resetRow(row, impulse);
		row.rhs = linearRhsX;
		row.cfm = cfm;
		row.minImpulse = -1e65536;
		row.maxImpulse = 1e65536;
		Method.setJacobianElements(row.jacobian.elements, 1, 0, 0, 1, 0, 0, c100, c101, c102, c200, c201, c202);
		const impulse1 = this.impulses[1];
		const row1 = info.rows[info.numRows++];
		this.resetRow(row1, impulse1);
		row1.rhs = linearRhsY;
		row1.cfm = cfm;
		row1.minImpulse = -1e65536;
		row1.maxImpulse = 1e65536;
		Method.setJacobianElements(row1.jacobian.elements, 0, 1, 0, 0, 1, 0, c110, c111, c112, c210, c211, c212);
		const impulse2 = this.impulses[2];
		const row2 = info.rows[info.numRows++];
		this.resetRow(row2, impulse2);
		row2.rhs = linearRhsZ;
		row2.cfm = cfm;
		row2.minImpulse = -1e65536;
		row2.maxImpulse = 1e65536;
		Method.setJacobianElements(row2.jacobian.elements, 0, 0, 1, 0, 0, 1, c120, c121, c122, c220, c221, c222);
	}
	public getVelocitySolverInfo(timeStep: TimeStep, info: JointSolverInfo): void {
		super.getVelocitySolverInfo(timeStep, info);
		this.getInfo(info, timeStep, false);
	}
	public getPositionSolverInfo(info: JointSolverInfo): void {
		super.getPositionSolverInfo(info);
		this.getInfo(info, null, true);
	}
	public getSpringDamper(): SpringDamper {
		return this.springDamper;
	}
}