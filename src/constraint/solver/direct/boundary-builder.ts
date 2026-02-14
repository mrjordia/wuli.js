import BoundaryBuildInfo from "./boundary-build-info";
import Boundary from "./boundary";
import JointSolverInfo from "../../joint/joint-solver-info";

export default class BoundaryBuilder {
	public maxRows : number;
	public numBoundaries = 0;
	public boundaries : Array<Boundary>;
	public bbInfo : BoundaryBuildInfo;
	constructor(maxRows : number) {
		this.maxRows = maxRows;
		this.boundaries = new Array(1 << maxRows);
		this.bbInfo = new BoundaryBuildInfo(maxRows);
	}
	public buildBoundariesRecursive(info : JointSolverInfo, i : number) : void {
		if (i === info.numRows) {
			if (!this.boundaries[this.numBoundaries]) {
				this.boundaries[this.numBoundaries] = new Boundary(this.maxRows);
			}
			this.boundaries[this.numBoundaries++].init(this.bbInfo);
			return;
		}
		const row = info.rows[i];
		const lowerLimitEnabled = row.minImpulse > -1e65536;
		const upperLimitEnabled = row.maxImpulse < 1e65536;
		if (row.minImpulse === 0 && row.maxImpulse === 0) {
			const _this = this.bbInfo;
			_this.iBounded[_this.numBounded] = i;
			_this.signs[_this.numBounded] = 0;
			_this.numBounded++;
			this.buildBoundariesRecursive(info, i + 1);
			this.bbInfo.numBounded--;
			return;
		}
		const _this = this.bbInfo;
		_this.iUnbounded[_this.numUnbounded] = i;
		_this.numUnbounded++;
		this.buildBoundariesRecursive(info, i + 1);
		this.bbInfo.numUnbounded--;
		if (lowerLimitEnabled) {
			const _this = this.bbInfo;
			_this.iBounded[_this.numBounded] = i;
			_this.signs[_this.numBounded] = -1;
			_this.numBounded++;
			this.buildBoundariesRecursive(info, i + 1);
			this.bbInfo.numBounded--;
		}
		if (upperLimitEnabled) {
			const _this = this.bbInfo;
			_this.iBounded[_this.numBounded] = i;
			_this.signs[_this.numBounded] = 1;
			_this.numBounded++;
			this.buildBoundariesRecursive(info, i + 1);
			this.bbInfo.numBounded--;
		}
	}
	public buildBoundaries(info : JointSolverInfo) : void {
		this.numBoundaries = 0;
		const _this = this.bbInfo;
		_this.numBounded = 0;
		_this.numUnbounded = 0;
		this.buildBoundariesRecursive(info, 0);
	}
}