import JointSolverInfo from "../../joint/joint-solver-info";
import JointSolverMassDataRow from "../../joint/joint-solver-mass-data-row";


export default class MassMatrix {
	private _size: number;

	public invMassWithoutCfm: Array<Float64Array>;
	public cacheComputed: Array<boolean>;
	public cachedSubmatrices: Array<Array<Float64Array>>;
	public tmpMatrix: Array<Float64Array>;
	public invMass: Array<Float64Array>;
	public maxSubmatrixId: number;

	constructor(size: number) {
		this._size = size;
		this.tmpMatrix = new Array(this._size);
		this.invMass = new Array(this._size);
		this.invMassWithoutCfm = new Array(this._size);
		let _g = 0, _g1 = this._size;
		while (_g < _g1) {
			const i = _g++;
			this.tmpMatrix[i] = new Float64Array(this._size);
			this.invMass[i] = new Float64Array(this._size);
			this.invMassWithoutCfm[i] = new Float64Array(this._size);
			let _g1 = 0, _g2 = this._size;
			while (_g1 < _g2) {
				const j = _g1++;
				this.tmpMatrix[i][j] = 0;
				this.invMass[i][j] = 0;
				this.invMassWithoutCfm[i][j] = 0;
			}
		}
		this.maxSubmatrixId = 1 << this._size;
		this.cacheComputed = new Array(this.maxSubmatrixId);
		this.cachedSubmatrices = new Array(this.maxSubmatrixId);
		let _g2 = 0, _g3 = this.maxSubmatrixId;
		while (_g2 < _g3) {
			const i = _g2++;
			let t = (i & 85) + (i >> 1 & 85);
			t = (t & 51) + (t >> 2 & 51);
			t = (t & 15) + (t >> 4 & 15);
			const matrixSize = t;
			const subMatrix = new Array(matrixSize);
			let _g = 0;
			while (_g < matrixSize) {
				const j = _g++;
				subMatrix[j] = new Array(matrixSize);
				let _g1 = 0;
				while (_g1 < matrixSize) subMatrix[j][_g1++] = 0;
			}
			this.cacheComputed[i] = false;
			this.cachedSubmatrices[i] = subMatrix;
		}
	}
	public computeSubmatrix(id: number, indices: Int8Array, size: number): void {
		let _g = 0;
		while (_g < size) {
			const i = _g++;
			const ii = indices[i];
			let _g1 = 0;
			while (_g1 < size) {
				const j = _g1++;
				this.tmpMatrix[i][j] = this.invMass[ii][indices[j]];
			}
		}
		const src = this.tmpMatrix;
		const dst = this.cachedSubmatrices[id];
		let srci: Float64Array, dsti: Float64Array, srcj: Float64Array, dstj: Float64Array, diag: number;
		switch (size) {
			case 4:
				srci = src[0];
				dsti = dst[0];
				diag = 1 / srci[0];
				dsti[0] = diag;
				srci[1] *= diag; srci[2] *= diag; srci[3] *= diag;
				srcj = src[1];
				dstj = dst[1];
				dstj[0] = -diag * srcj[0];
				srcj[1] -= srci[1] * srcj[0]; srcj[2] -= srci[2] * srcj[0]; srcj[3] -= srci[3] * srcj[0];
				srcj = src[2];
				dstj = dst[2];
				dstj[0] = -diag * srcj[0];
				srcj[1] -= srci[1] * srcj[0]; srcj[2] -= srci[2] * srcj[0]; srcj[3] -= srci[3] * srcj[0];
				srcj = src[3];
				dstj = dst[3];
				dstj[0] = -diag * srcj[0];
				srcj[1] -= srci[1] * srcj[0]; srcj[2] -= srci[2] * srcj[0]; srcj[3] -= srci[3] * srcj[0];
				srci = src[1];
				dsti = dst[1];
				diag = 1 / srci[1];
				dsti[1] = diag;
				dsti[0] *= diag;
				srci[2] *= diag; srci[3] *= diag;
				srcj = src[0];
				dstj = dst[0];
				dstj[0] -= dsti[0] * srcj[1];
				srcj[2] -= srci[2] * srcj[1]; srcj[3] -= srci[3] * srcj[1];
				srcj = src[2];
				dstj = dst[2];
				dstj[0] -= dsti[0] * srcj[1];
				dstj[1] = -diag * srcj[1];
				srcj[2] -= srci[2] * srcj[1]; srcj[3] -= srci[3] * srcj[1];
				srcj = src[3];
				dstj = dst[3];
				dstj[0] -= dsti[0] * srcj[1];
				dstj[1] = -diag * srcj[1];
				srcj[2] -= srci[2] * srcj[1]; srcj[3] -= srci[3] * srcj[1];
				srci = src[2];
				dsti = dst[2];
				diag = 1 / srci[2];
				dsti[2] = diag;
				dsti[0] *= diag; dsti[1] *= diag;
				srci[3] *= diag;
				srcj = src[0];
				dstj = dst[0];
				dstj[0] -= dsti[0] * srcj[2];
				srcj[3] -= srci[3] * srcj[2];
				srcj = src[1];
				dstj = dst[1];
				dstj[0] -= dsti[0] * srcj[2]; dstj[1] -= dsti[1] * srcj[2];
				srcj[3] -= srci[3] * srcj[2];
				srcj = src[3];
				dstj = dst[3];
				dstj[0] -= dsti[0] * srcj[2]; dstj[1] -= dsti[1] * srcj[2];
				dstj[2] = -diag * srcj[2];
				srcj[3] -= srci[3] * srcj[2];
				srci = src[3];
				dsti = dst[3];
				diag = 1 / srci[3];
				dsti[3] = diag;
				dsti[0] *= diag; dsti[1] *= diag; dsti[2] *= diag;
				srcj = src[0];
				dstj = dst[0];
				dstj[0] -= dsti[0] * srcj[3];
				srcj = src[1];
				dstj = dst[1];
				dstj[0] -= dsti[0] * srcj[3]; dstj[1] -= dsti[1] * srcj[3];
				srcj = src[2];
				dstj = dst[2];
				dstj[0] -= dsti[0] * srcj[3]; dstj[1] -= dsti[1] * srcj[3]; dstj[2] -= dsti[2] * srcj[3];
				dsti = dst[1];
				dst[0][1] = dsti[0];
				dsti = dst[2];
				dst[0][2] = dsti[0]; dst[1][2] = dsti[1];
				dsti = dst[3];
				dst[0][3] = dsti[0]; dst[1][3] = dsti[1]; dst[2][3] = dsti[2];
				break;
			case 5:
				srci = src[0];
				dsti = dst[0];
				diag = 1 / srci[0];
				dsti[0] = diag;
				srci[1] *= diag; srci[2] *= diag; srci[3] *= diag; srci[4] *= diag;
				srcj = src[1];
				dstj = dst[1];
				dstj[0] = -diag * srcj[0];
				srcj[1] -= srci[1] * srcj[0]; srcj[2] -= srci[2] * srcj[0]; srcj[3] -= srci[3] * srcj[0]; srcj[4] -= srci[4] * srcj[0];
				srcj = src[2];
				dstj = dst[2];
				dstj[0] = -diag * srcj[0];
				srcj[1] -= srci[1] * srcj[0]; srcj[2] -= srci[2] * srcj[0]; srcj[3] -= srci[3] * srcj[0]; srcj[4] -= srci[4] * srcj[0];
				srcj = src[3];
				dstj = dst[3];
				dstj[0] = -diag * srcj[0];
				srcj[1] -= srci[1] * srcj[0]; srcj[2] -= srci[2] * srcj[0]; srcj[3] -= srci[3] * srcj[0]; srcj[4] -= srci[4] * srcj[0];
				srcj = src[4];
				dstj = dst[4];
				dstj[0] = -diag * srcj[0];
				srcj[1] -= srci[1] * srcj[0]; srcj[2] -= srci[2] * srcj[0]; srcj[3] -= srci[3] * srcj[0]; srcj[4] -= srci[4] * srcj[0];
				srci = src[1];
				dsti = dst[1];
				diag = 1 / srci[1];
				dsti[1] = diag;
				dsti[0] *= diag;
				srci[2] *= diag; srci[3] *= diag; srci[4] *= diag;
				srcj = src[0];
				dstj = dst[0];
				dstj[0] -= dsti[0] * srcj[1];
				srcj[2] -= srci[2] * srcj[1]; srcj[3] -= srci[3] * srcj[1]; srcj[4] -= srci[4] * srcj[1];
				srcj = src[2];
				dstj = dst[2];
				dstj[0] -= dsti[0] * srcj[1];
				dstj[1] = -diag * srcj[1];
				srcj[2] -= srci[2] * srcj[1]; srcj[3] -= srci[3] * srcj[1]; srcj[4] -= srci[4] * srcj[1];
				srcj = src[3];
				dstj = dst[3];
				dstj[0] -= dsti[0] * srcj[1];
				dstj[1] = -diag * srcj[1];
				srcj[2] -= srci[2] * srcj[1]; srcj[3] -= srci[3] * srcj[1]; srcj[4] -= srci[4] * srcj[1];
				srcj = src[4];
				dstj = dst[4];
				dstj[0] -= dsti[0] * srcj[1];
				dstj[1] = -diag * srcj[1];
				srcj[2] -= srci[2] * srcj[1]; srcj[3] -= srci[3] * srcj[1]; srcj[4] -= srci[4] * srcj[1];
				srci = src[2];
				dsti = dst[2];
				diag = 1 / srci[2];
				dsti[2] = diag;
				dsti[0] *= diag; dsti[1] *= diag;
				srci[3] *= diag; srci[4] *= diag;
				srcj = src[0];
				dstj = dst[0];
				dstj[0] -= dsti[0] * srcj[2];
				srcj[3] -= srci[3] * srcj[2]; srcj[4] -= srci[4] * srcj[2];
				srcj = src[1];
				dstj = dst[1];
				dstj[0] -= dsti[0] * srcj[2]; dstj[1] -= dsti[1] * srcj[2];
				srcj[3] -= srci[3] * srcj[2]; srcj[4] -= srci[4] * srcj[2];
				srcj = src[3];
				dstj = dst[3];
				dstj[0] -= dsti[0] * srcj[2]; dstj[1] -= dsti[1] * srcj[2];
				dstj[2] = -diag * srcj[2];
				srcj[3] -= srci[3] * srcj[2]; srcj[4] -= srci[4] * srcj[2];
				srcj = src[4];
				dstj = dst[4];
				dstj[0] -= dsti[0] * srcj[2]; dstj[1] -= dsti[1] * srcj[2];
				dstj[2] = -diag * srcj[2];
				srcj[3] -= srci[3] * srcj[2]; srcj[4] -= srci[4] * srcj[2];
				srci = src[3];
				dsti = dst[3];
				diag = 1 / srci[3];
				dsti[3] = diag;
				dsti[0] *= diag; dsti[1] *= diag; dsti[2] *= diag; srci[4] *= diag;
				srcj = src[0];
				dstj = dst[0];
				dstj[0] -= dsti[0] * srcj[3];
				srcj[4] -= srci[4] * srcj[3];
				srcj = src[1];
				dstj = dst[1];
				dstj[0] -= dsti[0] * srcj[3]; dstj[1] -= dsti[1] * srcj[3];
				srcj[4] -= srci[4] * srcj[3];
				srcj = src[2];
				dstj = dst[2];
				dstj[0] -= dsti[0] * srcj[3]; dstj[1] -= dsti[1] * srcj[3]; dstj[2] -= dsti[2] * srcj[3];
				srcj[4] -= srci[4] * srcj[3];
				srcj = src[4];
				dstj = dst[4];
				dstj[0] -= dsti[0] * srcj[3]; dstj[1] -= dsti[1] * srcj[3]; dstj[2] -= dsti[2] * srcj[3];
				dstj[3] = -diag * srcj[3];
				srcj[4] -= srci[4] * srcj[3];
				srci = src[4];
				dsti = dst[4];
				diag = 1 / srci[4];
				dsti[4] = diag;
				dsti[0] *= diag; dsti[1] *= diag; dsti[2] *= diag; dsti[3] *= diag;
				srcj = src[0];
				dstj = dst[0];
				dstj[0] -= dsti[0] * srcj[4];
				srcj = src[1];
				dstj = dst[1];
				dstj[0] -= dsti[0] * srcj[4]; dstj[1] -= dsti[1] * srcj[4];
				srcj = src[2];
				dstj = dst[2];
				dstj[0] -= dsti[0] * srcj[4]; dstj[1] -= dsti[1] * srcj[4]; dstj[2] -= dsti[2] * srcj[4];
				srcj = src[3];
				dstj = dst[3];
				dstj[0] -= dsti[0] * srcj[4]; dstj[1] -= dsti[1] * srcj[4]; dstj[2] -= dsti[2] * srcj[4]; dstj[3] -= dsti[3] * srcj[4];
				dsti = dst[1];
				dst[0][1] = dsti[0];
				dsti = dst[2];
				dst[0][2] = dsti[0]; dst[1][2] = dsti[1];
				dsti = dst[3];
				dst[0][3] = dsti[0]; dst[1][3] = dsti[1]; dst[2][3] = dsti[2];
				dsti = dst[4];
				dst[0][4] = dsti[0]; dst[1][4] = dsti[1]; dst[2][4] = dsti[2]; dst[3][4] = dsti[3];
				break;
			case 6:
				srci = src[0];
				dsti = dst[0];
				diag = 1 / srci[0];
				dsti[0] = diag;
				srci[1] *= diag; srci[2] *= diag; srci[3] *= diag; srci[4] *= diag; srci[5] *= diag;
				srcj = src[1];
				dstj = dst[1];
				dstj[0] = -diag * srcj[0];
				srcj[1] -= srci[1] * srcj[0]; srcj[2] -= srci[2] * srcj[0]; srcj[3] -= srci[3] * srcj[0]; srcj[4] -= srci[4] * srcj[0]; srcj[5] -= srci[5] * srcj[0];
				srcj = src[2];
				dstj = dst[2];
				dstj[0] = -diag * srcj[0];
				srcj[1] -= srci[1] * srcj[0]; srcj[2] -= srci[2] * srcj[0]; srcj[3] -= srci[3] * srcj[0]; srcj[4] -= srci[4] * srcj[0]; srcj[5] -= srci[5] * srcj[0];
				srcj = src[3];
				dstj = dst[3];
				dstj[0] = -diag * srcj[0];
				srcj[1] -= srci[1] * srcj[0]; srcj[2] -= srci[2] * srcj[0]; srcj[3] -= srci[3] * srcj[0]; srcj[4] -= srci[4] * srcj[0]; srcj[5] -= srci[5] * srcj[0];
				srcj = src[4];
				dstj = dst[4];
				dstj[0] = -diag * srcj[0];
				srcj[1] -= srci[1] * srcj[0]; srcj[2] -= srci[2] * srcj[0]; srcj[3] -= srci[3] * srcj[0]; srcj[4] -= srci[4] * srcj[0]; srcj[5] -= srci[5] * srcj[0];
				srcj = src[5];
				dstj = dst[5];
				dstj[0] = -diag * srcj[0];
				srcj[1] -= srci[1] * srcj[0]; srcj[2] -= srci[2] * srcj[0]; srcj[3] -= srci[3] * srcj[0]; srcj[4] -= srci[4] * srcj[0]; srcj[5] -= srci[5] * srcj[0];
				srci = src[1];
				dsti = dst[1];
				diag = 1 / srci[1];
				dsti[1] = diag;
				dsti[0] *= diag;
				srci[2] *= diag; srci[3] *= diag; srci[4] *= diag; srci[5] *= diag;
				srcj = src[0];
				dstj = dst[0];
				dstj[0] -= dsti[0] * srcj[1];
				srcj[2] -= srci[2] * srcj[1]; srcj[3] -= srci[3] * srcj[1]; srcj[4] -= srci[4] * srcj[1]; srcj[5] -= srci[5] * srcj[1];
				srcj = src[2];
				dstj = dst[2];
				dstj[0] -= dsti[0] * srcj[1];
				dstj[1] = -diag * srcj[1];
				srcj[2] -= srci[2] * srcj[1]; srcj[3] -= srci[3] * srcj[1]; srcj[4] -= srci[4] * srcj[1]; srcj[5] -= srci[5] * srcj[1];
				srcj = src[3];
				dstj = dst[3];
				dstj[0] -= dsti[0] * srcj[1];
				dstj[1] = -diag * srcj[1];
				srcj[2] -= srci[2] * srcj[1]; srcj[3] -= srci[3] * srcj[1]; srcj[4] -= srci[4] * srcj[1]; srcj[5] -= srci[5] * srcj[1];
				srcj = src[4];
				dstj = dst[4];
				dstj[0] -= dsti[0] * srcj[1];
				dstj[1] = -diag * srcj[1];
				srcj[2] -= srci[2] * srcj[1]; srcj[3] -= srci[3] * srcj[1]; srcj[4] -= srci[4] * srcj[1]; srcj[5] -= srci[5] * srcj[1];
				srcj = src[5];
				dstj = dst[5];
				dstj[0] -= dsti[0] * srcj[1];
				dstj[1] = -diag * srcj[1];
				srcj[2] -= srci[2] * srcj[1]; srcj[3] -= srci[3] * srcj[1]; srcj[4] -= srci[4] * srcj[1]; srcj[5] -= srci[5] * srcj[1];
				srci = src[2];
				dsti = dst[2];
				diag = 1 / srci[2];
				dsti[2] = diag;
				dsti[0] *= diag; dsti[1] *= diag;
				srci[3] *= diag; srci[4] *= diag; srci[5] *= diag;
				srcj = src[0];
				dstj = dst[0];
				dstj[0] -= dsti[0] * srcj[2];
				srcj[3] -= srci[3] * srcj[2]; srcj[4] -= srci[4] * srcj[2]; srcj[5] -= srci[5] * srcj[2];
				srcj = src[1];
				dstj = dst[1];
				dstj[0] -= dsti[0] * srcj[2]; dstj[1] -= dsti[1] * srcj[2];
				srcj[3] -= srci[3] * srcj[2]; srcj[4] -= srci[4] * srcj[2]; srcj[5] -= srci[5] * srcj[2];
				srcj = src[3];
				dstj = dst[3];
				dstj[0] -= dsti[0] * srcj[2]; dstj[1] -= dsti[1] * srcj[2];
				dstj[2] = -diag * srcj[2];
				srcj[3] -= srci[3] * srcj[2]; srcj[4] -= srci[4] * srcj[2]; srcj[5] -= srci[5] * srcj[2];
				srcj = src[4];
				dstj = dst[4];
				dstj[0] -= dsti[0] * srcj[2]; dstj[1] -= dsti[1] * srcj[2];
				dstj[2] = -diag * srcj[2];
				srcj[3] -= srci[3] * srcj[2]; srcj[4] -= srci[4] * srcj[2]; srcj[5] -= srci[5] * srcj[2];
				srcj = src[5];
				dstj = dst[5];
				dstj[0] -= dsti[0] * srcj[2]; dstj[1] -= dsti[1] * srcj[2];
				dstj[2] = -diag * srcj[2];
				srcj[3] -= srci[3] * srcj[2]; srcj[4] -= srci[4] * srcj[2]; srcj[5] -= srci[5] * srcj[2];
				srci = src[3];
				dsti = dst[3];
				diag = 1 / srci[3];
				dsti[3] = diag;
				dsti[0] *= diag; dsti[1] *= diag; dsti[2] *= diag;
				srci[4] *= diag; srci[5] *= diag;
				srcj = src[0];
				dstj = dst[0];
				dstj[0] -= dsti[0] * srcj[3];
				srcj[4] -= srci[4] * srcj[3]; srcj[5] -= srci[5] * srcj[3];
				srcj = src[1];
				dstj = dst[1];
				dstj[0] -= dsti[0] * srcj[3]; dstj[1] -= dsti[1] * srcj[3];
				srcj[4] -= srci[4] * srcj[3]; srcj[5] -= srci[5] * srcj[3];
				srcj = src[2];
				dstj = dst[2];
				dstj[0] -= dsti[0] * srcj[3]; dstj[1] -= dsti[1] * srcj[3]; dstj[2] -= dsti[2] * srcj[3];
				srcj[4] -= srci[4] * srcj[3]; srcj[5] -= srci[5] * srcj[3];
				srcj = src[4];
				dstj = dst[4];
				dstj[0] -= dsti[0] * srcj[3]; dstj[1] -= dsti[1] * srcj[3]; dstj[2] -= dsti[2] * srcj[3];
				dstj[3] = -diag * srcj[3];
				srcj[4] -= srci[4] * srcj[3]; srcj[5] -= srci[5] * srcj[3];
				srcj = src[5];
				dstj = dst[5];
				dstj[0] -= dsti[0] * srcj[3]; dstj[1] -= dsti[1] * srcj[3]; dstj[2] -= dsti[2] * srcj[3];
				dstj[3] = -diag * srcj[3];
				srcj[4] -= srci[4] * srcj[3]; srcj[5] -= srci[5] * srcj[3];
				srci = src[4];
				dsti = dst[4];
				diag = 1 / srci[4];
				dsti[4] = diag;
				dsti[0] *= diag; dsti[1] *= diag; dsti[2] *= diag; dsti[3] *= diag;
				srci[5] *= diag;
				srcj = src[0];
				dstj = dst[0];
				dstj[0] -= dsti[0] * srcj[4];
				srcj[5] -= srci[5] * srcj[4];
				srcj = src[1];
				dstj = dst[1];
				dstj[0] -= dsti[0] * srcj[4]; dstj[1] -= dsti[1] * srcj[4];
				srcj[5] -= srci[5] * srcj[4];
				srcj = src[2];
				dstj = dst[2];
				dstj[0] -= dsti[0] * srcj[4]; dstj[1] -= dsti[1] * srcj[4]; dstj[2] -= dsti[2] * srcj[4];
				srcj[5] -= srci[5] * srcj[4];
				srcj = src[3];
				dstj = dst[3];
				dstj[0] -= dsti[0] * srcj[4]; dstj[1] -= dsti[1] * srcj[4]; dstj[2] -= dsti[2] * srcj[4]; dstj[3] -= dsti[3] * srcj[4];
				srcj[5] -= srci[5] * srcj[4];
				srcj = src[5];
				dstj = dst[5];
				dstj[0] -= dsti[0] * srcj[4]; dstj[1] -= dsti[1] * srcj[4]; dstj[2] -= dsti[2] * srcj[4]; dstj[3] -= dsti[3] * srcj[4];
				dstj[4] = -diag * srcj[4];
				srcj[5] -= srci[5] * srcj[4];
				srci = src[5];
				dsti = dst[5];
				diag = 1 / srci[5];
				dsti[5] = diag;
				dsti[0] *= diag; dsti[1] *= diag; dsti[2] *= diag; dsti[3] *= diag; dsti[4] *= diag;
				srcj = src[0];
				dstj = dst[0];
				dstj[0] -= dsti[0] * srcj[5];
				srcj = src[1];
				dstj = dst[1];
				dstj[0] -= dsti[0] * srcj[5]; dstj[1] -= dsti[1] * srcj[5];
				srcj = src[2];
				dstj = dst[2];
				dstj[0] -= dsti[0] * srcj[5]; dstj[1] -= dsti[1] * srcj[5]; dstj[2] -= dsti[2] * srcj[5];
				srcj = src[3];
				dstj = dst[3];
				dstj[0] -= dsti[0] * srcj[5]; dstj[1] -= dsti[1] * srcj[5]; dstj[2] -= dsti[2] * srcj[5]; dstj[3] -= dsti[3] * srcj[5];
				srcj = src[4];
				dstj = dst[4];
				dstj[0] -= dsti[0] * srcj[5]; dstj[1] -= dsti[1] * srcj[5]; dstj[2] -= dsti[2] * srcj[5]; dstj[3] -= dsti[3] * srcj[5]; dstj[4] -= dsti[4] * srcj[5];
				dsti = dst[1];
				dst[0][1] = dsti[0];
				dsti = dst[2];
				dst[0][2] = dsti[0]; dst[1][2] = dsti[1];
				dsti = dst[3];
				dst[0][3] = dsti[0]; dst[1][3] = dsti[1]; dst[2][3] = dsti[2];
				dsti = dst[4];
				dst[0][4] = dsti[0]; dst[1][4] = dsti[1]; dst[2][4] = dsti[2]; dst[3][4] = dsti[3];
				dsti = dst[5];
				dst[0][5] = dsti[0]; dst[1][5] = dsti[1]; dst[2][5] = dsti[2]; dst[3][5] = dsti[3]; dst[4][5] = dsti[4];
				break;
			default:
				let _g1 = 0;
				while (_g1 < size) {
					const i = _g1++;
					srci = src[i];
					dsti = dst[i];
					const diag = 1 / srci[i];
					dsti[i] = diag;
					let _g = 0;
					while (_g < i) dsti[_g++] *= diag;
					let _g2 = i + 1;
					while (_g2 < size) srci[_g2++] *= diag;
					let _g3 = 0;
					while (_g3 < i) {
						const j = _g3++;
						srcj = src[j];
						dstj = dst[j];
						let _g = 0;
						let _g1 = j + 1;
						while (_g < _g1) {
							const k = _g++;
							dstj[k] -= dsti[k] * srcj[i];
						}
						let _g2 = i + 1;
						while (_g2 < size) {
							const k = _g2++;
							srcj[k] -= srci[k] * srcj[i];
						}
					}
					let _g4 = i + 1;
					while (_g4 < size) {
						const j = _g4++;
						srcj = src[j];
						dstj = dst[j];
						let _g = 0;
						while (_g < i) {
							const k = _g++;
							dstj[k] -= dsti[k] * srcj[i];
						}
						dstj[i] = -diag * srcj[i];
						let _g1 = i + 1;
						while (_g1 < size) {
							const k = _g1++;
							srcj[k] -= srci[k] * srcj[i];
						}
					}
				}
				let _g2 = 1;
				while (_g2 < size) {
					const i = _g2++;
					dsti = dst[i];
					let _g = 0;
					while (_g < i) {
						const j = _g++;
						dst[j][i] = dsti[j];
					}
				}
		}
	}
	public computeInvMass(info: JointSolverInfo, massData: JointSolverMassDataRow[]): void {
		const invMass = this.invMass;
		const invMassWithoutCfm = this.invMassWithoutCfm;
		const numRows = info.numRows;
		const b1 = info.rigidBody1!;
		const invM1 = b1.invMass, ii1 = b1.invInertia;
		const b2 = info.rigidBody2!;
		const invM2 = b2.invMass, ii2 = b2.invInertia;
		const invI100 = ii1[0], invI101 = ii1[1], invI102 = ii1[2];
		const invI110 = ii1[3], invI111 = ii1[4], invI112 = ii1[5];
		const invI120 = ii1[6], invI121 = ii1[7], invI122 = ii1[8];
		const invI200 = ii2[0], invI201 = ii2[1], invI202 = ii2[2];
		const invI210 = ii2[3], invI211 = ii2[4], invI212 = ii2[5];
		const invI220 = ii2[6], invI221 = ii2[7], invI222 = ii2[8];
		let _g = 0;
		while (_g < numRows) {
			const i = _g++;
			const jc = info.rows[i].jacobian;
			jc.updateSparsity();
			const j = jc.elements;
			const md = massData[i].elements;
			if ((j[12] & 1) !== 0) {
				md[0] = j[0] * invM1; md[1] = j[1] * invM1; md[2] = j[2] * invM1;
				md[3] = j[3] * invM2; md[4] = j[4] * invM2; md[5] = j[5] * invM2;
			} else {
				md[0] = md[1] = md[2] = md[3] = md[4] = md[5] = 0;
			}
			if ((j[12] & 2) !== 0) {
				md[6] = invI100 * j[6] + invI101 * j[7] + invI102 * j[8];
				md[7] = invI110 * j[6] + invI111 * j[7] + invI112 * j[8];
				md[8] = invI120 * j[6] + invI121 * j[7] + invI122 * j[8];
				md[9] = invI200 * j[9] + invI201 * j[10] + invI202 * j[11];
				md[10] = invI210 * j[9] + invI211 * j[10] + invI212 * j[11];
				md[11] = invI220 * j[9] + invI221 * j[10] + invI222 * j[11];
			} else {
				md[6] = md[7] = md[8] = md[9] = md[10] = md[11] = 0;
			}
		}
		let _g1 = 0;
		while (_g1 < numRows) {
			const i = _g1++;
			const j1 = info.rows[i].jacobian.elements;
			let _g = i;
			while (_g < numRows) {
				const j = _g++;
				const md2 = massData[j].elements;
				const val = j1[0] * md2[0] + j1[1] * md2[1] + j1[2] * md2[2] +
					(j1[6] * md2[6] + j1[7] * md2[7] + j1[8] * md2[8]) +
					(j1[3] * md2[3] + j1[4] * md2[4] + j1[5] * md2[5]) +
					(j1[9] * md2[9] + j1[10] * md2[10] + j1[11] * md2[11]);
				if (i === j) {
					invMass[i][j] = val + info.rows[i].cfm;
					invMassWithoutCfm[i][j] = val;
					md2[12] = val + info.rows[i].cfm;
					md2[13] = val;
					if (md2[12] !== 0) {
						md2[12] = 1 / md2[12];
					}
					if (md2[13] !== 0) {
						md2[13] = 1 / md2[13];
					}
				} else {
					invMass[i][j] = val;
					invMass[j][i] = val;
					invMassWithoutCfm[i][j] = val;
					invMassWithoutCfm[j][i] = val;
				}
			}
		}
		let _g2 = 0;
		const _g3 = this.maxSubmatrixId;
		while (_g2 < _g3) this.cacheComputed[_g2++] = false;
	}
}