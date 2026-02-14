import PgsContactConstraintSolver from "../solver/pgs-contact-constraint-solver";
import { CONSTANT, POSITION_CORRECTION_ALGORITHM } from '../../constant';
import Manifold from "./manifold";
import TimeStep from "../../common/time-step";
import ContactSolverInfo from "./contact-solver-info";
import Shape from "../../shape/shape";
import Transform from "../../common/transform";
import RigidBody from "../../rigid-body/rigid-body";
import { Nullable } from "../../common/nullable";

export default class ContactConstraint {
	public solver: PgsContactConstraintSolver;
	public manifold: Manifold;
	public rigidBody1: Nullable<RigidBody>;
	public rigidBody2: Nullable<RigidBody>;
	public shape1: Nullable<Shape>;
	public shape2: Nullable<Shape>;
	public positionCorrectionAlgorithm: Nullable<POSITION_CORRECTION_ALGORITHM>;
	public transform1: Nullable<Transform>;
	public transform2: Nullable<Transform>;
	constructor(manifold: Manifold) {
		this.solver = new PgsContactConstraintSolver(this);
		this.manifold = manifold;
	}
	public getVelocitySolverInfo(timeStep: TimeStep, info: ContactSolverInfo): void {
		info.rigidBody1 = this.rigidBody1!;
		info.rigidBody2 = this.rigidBody2!;
		const normal = this.manifold.normal, tangent = this.manifold.tangent, binormal = this.manifold.binormal;
		const normalX = normal[0], normalY = normal[1], normalZ = normal[2];
		const tangentX = tangent[0], tangentY = tangent[1], tangentZ = tangent[2];
		const binormalX = binormal[0], binormalY = binormal[1], binormalZ = binormal[2];
		const friction = Math.sqrt(this.shape1!.friction * this.shape2!.friction);
		const restitution = Math.sqrt(this.shape1!.restitution * this.shape2!.restitution);
		const num = this.manifold.numPoints;
		info.numRows = 0;
		let _g = 0;
		while (_g < num) {
			const p = this.manifold.points[_g++];
			const relPos1 = p.relPos1, relPos2 = p.relPos2;
			if (p.depth < 0) {
				p.disabled = true;
				const _this = p.impulse.elements;
				_this[0] = _this[1] = _this[2] = _this[3] = _this[4] = _this[5] = _this[6] = 0;
				continue;
			} else {
				p.disabled = false;
			}
			const row = info.rows[info.numRows++];
			row.friction = friction;
			row.cfm = 0;
			let j = row.jacobianN.elements;
			j[0] = normalX; j[1] = normalY; j[2] = normalZ;
			j[3] = normalX; j[4] = normalY; j[5] = normalZ;
			j[6] = relPos1[1] * normalZ - relPos1[2] * normalY; j[7] = relPos1[2] * normalX - relPos1[0] * normalZ; j[8] = relPos1[0] * normalY - relPos1[1] * normalX;
			j[9] = relPos2[1] * normalZ - relPos2[2] * normalY; j[10] = relPos2[2] * normalX - relPos2[0] * normalZ; j[11] = relPos2[0] * normalY - relPos2[1] * normalX;
			j = row.jacobianT.elements;
			j[0] = tangentX; j[1] = tangentY; j[2] = tangentZ;
			j[3] = tangentX; j[4] = tangentY; j[5] = tangentZ;
			j[6] = relPos1[1] * tangentZ - relPos1[2] * tangentY; j[7] = relPos1[2] * tangentX - relPos1[0] * tangentZ; j[8] = relPos1[0] * tangentY - relPos1[1] * tangentX;
			j[9] = relPos2[1] * tangentZ - relPos2[2] * tangentY; j[10] = relPos2[2] * tangentX - relPos2[0] * tangentZ; j[11] = relPos2[0] * tangentY - relPos2[1] * tangentX;
			j = row.jacobianB.elements;
			j[0] = binormalX; j[1] = binormalY; j[2] = binormalZ;
			j[3] = binormalX; j[4] = binormalY; j[5] = binormalZ;
			j[6] = relPos1[1] * binormalZ - relPos1[2] * binormalY; j[7] = relPos1[2] * binormalX - relPos1[0] * binormalZ; j[8] = relPos1[0] * binormalY - relPos1[1] * binormalX;
			j[9] = relPos2[1] * binormalZ - relPos2[2] * binormalY; j[10] = relPos2[2] * binormalX - relPos2[0] * binormalZ; j[11] = relPos2[0] * binormalY - relPos2[1] * binormalX;
			const b1v = this.rigidBody1!.vel, b1a = this.rigidBody1!.angVel, b2v = this.rigidBody2!.vel, b2a = this.rigidBody2!.angVel;
			j = row.jacobianN.elements;
			const rvn = j[0] * b1v[0] + j[1] * b1v[1] + j[2] * b1v[2] + (j[6] * b1a[0] + j[7] * b1a[1] + j[8] * b1a[2]) -
				(j[3] * b2v[0] + j[4] * b2v[1] + j[5] * b2v[2] + (j[9] * b2a[0] + j[10] * b2a[1] + j[11] * b2a[2]));
			if (rvn < -CONSTANT.SETTING_CONTACT_ENABLE_BOUNCE_THRESHOLD && !p.warmStarted) {
				row.rhs = -rvn * restitution;
			} else {
				row.rhs = 0;
			}
			if (this.positionCorrectionAlgorithm === POSITION_CORRECTION_ALGORITHM.BAUMGARTE) {
				if (p.depth > CONSTANT.SETTING_LINEAR_SLOP) {
					const minRhs = (p.depth - CONSTANT.SETTING_LINEAR_SLOP) * CONSTANT.SETTING_VELOCITY_BAUMGARTE * timeStep.invDt;
					if (row.rhs < minRhs) {
						row.rhs = minRhs;
					}
				}
			}
			if (!p.warmStarted) {
				const _this = p.impulse.elements;
				_this[0] = _this[1] = _this[2] = _this[3] = _this[4] = _this[5] = _this[6] = 0;
			}
			row.impulse = p.impulse;
		}
	}
	public getPositionSolverInfo(info: ContactSolverInfo): void {
		info.rigidBody1 = this.rigidBody1!;
		info.rigidBody2 = this.rigidBody2!;
		const normal = this.manifold.normal;
		const normalX = normal[0], normalY = normal[1], normalZ = normal[2];
		const num = this.manifold.numPoints;
		info.numRows = 0;
		let _g = 0;
		while (_g < num) {
			const p = this.manifold.points[_g++];
			let relPos1 = p.relPos1, relPos2 = p.relPos2;
			if (p.disabled) {
				continue;
			}
			const row = info.rows[info.numRows++];
			const j = row.jacobianN.elements;
			j[0] = normalX; j[1] = normalY; j[2] = normalZ;
			j[3] = normalX; j[4] = normalY; j[5] = normalZ;
			j[6] = relPos1[1] * normalZ - relPos1[2] * normalY; j[7] = relPos1[2] * normalX - relPos1[0] * normalZ; j[8] = relPos1[0] * normalY - relPos1[1] * normalX;
			j[9] = relPos2[1] * normalZ - relPos2[2] * normalY; j[10] = relPos2[2] * normalX - relPos2[0] * normalZ; j[11] = relPos2[0] * normalY - relPos2[1] * normalX;
			row.rhs = p.depth - CONSTANT.SETTING_LINEAR_SLOP;
			if (row.rhs < 0) {
				row.rhs = 0;
			}
			row.impulse = p.impulse;
		}
	}
	public syncManifold(): void {
		this.manifold.updateDepthsAndPositions(this.transform1!, this.transform2!);
	}
	public isTouching(): boolean {
		let _g = 0, _g1 = this.manifold.numPoints;
		while (_g < _g1) if (this.manifold.points[_g++].depth >= 0) {
			return true;
		}
		return false;
	}
}