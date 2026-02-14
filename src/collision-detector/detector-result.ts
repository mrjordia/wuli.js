import Vec3 from "../common/vec3";
import { CONSTANT } from "../constant";
import DetectorResultPoint from "./detector-result-point";

export default class DetectorResult {
	public numPoints = 0;
	public normal = new Vec3();
	public incremental = false;
	public points : DetectorResultPoint[] = new Array(CONSTANT.SETTING_MAX_MANIFOLD_POINTS);
	constructor() {
		let _g = 0, _g1 = CONSTANT.SETTING_MAX_MANIFOLD_POINTS;
		while (_g < _g1) this.points[_g++] = new DetectorResultPoint();
	}
	public getMaxDepth() : number {
		let max = 0;
		let _g = 0, _g1 = this.numPoints;
		while (_g < _g1) {
			const i = _g++;
			if (this.points[i].depth > max) {
				max = this.points[i].depth;
			}
		}
		return max;
	}
	public clear() : void {
		this.numPoints = 0;
		let _g = 0, _g1 = this.points;
		let v = null;
		while (_g < _g1.length) {
			let p = _g1[_g];
			++_g;
			v = p.position1.elements;
			v[0] = v[1] = v[2] = 0;
			v = p.position2.elements;
			v[0] = v[1] = v[2] = 0;
			p.depth = 0;
			p.id = 0;
		}
		v = this.normal.elements;
		v[0] = v[1] = v[2] = 0;
	}
}