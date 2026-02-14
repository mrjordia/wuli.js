import { CONSTANT } from '../../../constant';
import JointSolverInfo from '../../joint/joint-solver-info';
import BoundaryBuildInfo from './boundary-build-info';
import MassMatrix from './mass-matrix';

export default class Boundary {
	public iBounded : Int8Array;
	public iUnbounded : Int8Array;
	public signs : Int8Array;
	public b : Float64Array;
	public numBounded = 0;
	public numUnbounded = 0;
	public matrixId = 0;
	constructor(maxRows : number) {
		this.iBounded = new Int8Array(maxRows);
		this.iUnbounded = new Int8Array(maxRows);
		this.signs = new Int8Array(maxRows);
		this.b = new Float64Array(maxRows);
	}

	public init(buildInfo : BoundaryBuildInfo) : void {
		this.numBounded = buildInfo.numBounded;
		let _g = 0, _g1 = this.numBounded;
		while (_g < _g1) {
			let i = _g++;
			this.iBounded[i] = buildInfo.iBounded[i];
			this.signs[i] = buildInfo.signs[i];
		}
		this.numUnbounded = buildInfo.numUnbounded;
		this.matrixId = 0;
		let _g2 = 0, _g3 = this.numUnbounded;
		while (_g2 < _g3) {
			const i = _g2++;
			const idx = buildInfo.iUnbounded[i];
			this.iUnbounded[i] = idx;
			this.matrixId |= 1 << idx;
		}
	}
	public computeImpulses(info : JointSolverInfo, mass : MassMatrix, relVels : Float64Array, impulses : Float64Array, dImpulses : Float64Array, impulseFactor : number, noCheck : boolean) : boolean {
		const MSE = CONSTANT.SETTING_DIRECT_MLCP_SOLVER_EPS;
		let _g = 0, _g1 = this.numUnbounded;
		while (_g < _g1) {
			const idx = this.iUnbounded[_g++];
			const row = info.rows[idx];
			this.b[idx] = row.rhs * impulseFactor - relVels[idx] - row.cfm * impulses[idx];
		}
		const invMassWithoutCfm = mass.invMassWithoutCfm;
		let _g2 = 0, _g3 = this.numBounded;
		while (_g2 < _g3) {
			const i = _g2++;
			const idx = this.iBounded[i];
			const sign = this.signs[i];
			const row = info.rows[idx];
			const dImpulse = (sign < 0 ? row.minImpulse : sign > 0 ? row.maxImpulse : 0) - impulses[idx];
			dImpulses[idx] = dImpulse;
			if (dImpulse !== 0) {
				let _g = 0, _g1 = this.numUnbounded;
				while (_g < _g1) {
					let idx2 = this.iUnbounded[_g++];
					this.b[idx2] -= invMassWithoutCfm[idx][idx2] * dImpulse;
				}
			}
		}
		const indices = this.iUnbounded;
		const n = this.numUnbounded;
		let id = 0;
		let _g4 = 0;
		while (_g4 < n) id |= 1 << indices[_g4++];
		let massMatrix : Float64Array[];
		if (mass.cacheComputed[id]) {
			massMatrix = mass.cachedSubmatrices[id];
		} else {
			mass.computeSubmatrix(id, indices, n);
			mass.cacheComputed[id] = true;
			massMatrix = mass.cachedSubmatrices[id];
		}
		let ok = true;
		let _g5 = 0, _g6 = this.numUnbounded;
		while (_g5 < _g6) {
			const i = _g5++;
			const idx = this.iUnbounded[i];
			const row = info.rows[idx];
			const oldImpulse = impulses[idx];
			let impulse = oldImpulse;
			let _g = 0, _g1 = this.numUnbounded;
			while (_g < _g1) {
				const j = _g++;
				impulse += this.b[this.iUnbounded[j]] * massMatrix[i][j];
			}
			if (impulse < row.minImpulse - MSE || impulse > row.maxImpulse + MSE) {
				ok = false;
				break;
			}
			dImpulses[idx] = impulse - oldImpulse;
		}
		if (noCheck) {
			return true;
		}
		if (!ok) {
			return false;
		}
		let _g7 = 0, _g8 = this.numBounded;
		while (_g7 < _g8) {
			const i = _g7++;
			const idx = this.iBounded[i];
			const row = info.rows[idx];
			const sign = this.signs[i];
			let error = 0;
			const newImpulse = impulses[idx] + dImpulses[idx];
			let relVel = relVels[idx];
			let _g = 0, _g1 = info.numRows;
			while (_g < _g1) {
				let j = _g++;
				relVel += invMassWithoutCfm[idx][j] * dImpulses[j];
			}
			error = row.rhs * impulseFactor - relVel - row.cfm * newImpulse;
			if (sign < 0 && error > MSE || sign > 0 && error < -MSE) {
				ok = false;
				break;
			}
		}
		return ok;
	}
}