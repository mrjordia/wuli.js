import IncidentVertex from "./incident-vertex";
import Method from "../../common/method";


export default class FaceClipper {
	public w = 0;
	public h = 0;
	public numVertices = 0;
	public numTmpVertices = 0;
	public vertices: Array<IncidentVertex> = new Array(8);
	public tmpVertices: Array<IncidentVertex> = new Array(8);

	private _fv0 = new Float64Array(5);

	constructor() {
		for (let i = 0; i < 8; i++) {
			this.vertices[i] = new IncidentVertex();
			this.tmpVertices[i] = new IncidentVertex();
		}
	}

	public clip(): void {
		let _g = 0, _g1 = this.numVertices;
		while (_g < _g1) {
			const i = _g++;
			const v1 = this.vertices[i].elements;
			const v2 = this.vertices[(i + 1) % _g1].elements;
			const s1 = this.w + v1[0];
			const s2 = this.w + v2[0];
			this._setVertex(s1, s2, v1, v2);
		}
		const tmp = this.vertices;
		this.vertices = this.tmpVertices;
		this.tmpVertices = tmp;
		this.numVertices = this.numTmpVertices;
		this.numTmpVertices = 0;
		let _g2 = 0, _g3 = this.numVertices;
		while (_g2 < _g3) {
			const i = _g2++;
			const v1 = this.vertices[i].elements;
			const v2 = this.vertices[(i + 1) % this.numVertices].elements;
			const s1 = this.w - v1[0];
			const s2 = this.w - v2[0];
			this._setVertex(s1, s2, v1, v2);
		}
		const tmp1 = this.vertices;
		this.vertices = this.tmpVertices;
		this.tmpVertices = tmp1;
		this.numVertices = this.numTmpVertices;
		this.numTmpVertices = 0;
		let _g4 = 0, _g5 = this.numVertices;
		while (_g4 < _g5) {
			const i = _g4++;
			const v1 = this.vertices[i].elements;
			const v2 = this.vertices[(i + 1) % this.numVertices].elements;
			const s1 = this.h + v1[1];
			const s2 = this.h + v2[1];
			this._setVertex(s1, s2, v1, v2);
		}
		const tmp2 = this.vertices;
		this.vertices = this.tmpVertices;
		this.tmpVertices = tmp2;
		this.numVertices = this.numTmpVertices;
		this.numTmpVertices = 0;
		let _g6 = 0, _g7 = this.numVertices;
		while (_g6 < _g7) {
			const i = _g6++;
			const v1 = this.vertices[i].elements;
			const v2 = this.vertices[(i + 1) % this.numVertices].elements;
			const s1 = this.h - v1[1];
			const s2 = this.h - v2[1];
			this._setVertex(s1, s2, v1, v2);
		}
		const tmp3 = this.vertices;
		this.vertices = this.tmpVertices;
		this.tmpVertices = tmp3;
		this.numVertices = this.numTmpVertices;
		this.numTmpVertices = 0;
	}
	public reduce(): void {
		if (this.numVertices < 4) {
			return;
		}
		let max1 = -1e65536, min1 = 1e65536;
		let max2 = -1e65536, min2 = 1e65536;
		let max1V = null, min1V = null;
		let max2V = null, min2V = null;
		const e1x = 1, e1y = 1;
		const e2x = -1, e2y = 1;
		let _g = 0, _g1 = this.numVertices;
		while (_g < _g1) {
			const v = this.vertices[_g++].elements;
			const dot1 = v[0] * e1x + v[1] * e1y;
			const dot2 = v[0] * e2x + v[1] * e2y;
			if (dot1 > max1) {
				max1 = dot1;
				max1V = v;
			}
			if (dot1 < min1) {
				min1 = dot1;
				min1V = v;
			}
			if (dot2 > max2) {
				max2 = dot2;
				max2V = v;
			}
			if (dot2 < min2) {
				min2 = dot2;
				min2V = v;
			}
		}
		Method.copyElements(max1V!, this.tmpVertices[this.numTmpVertices++].elements, 0, 0, 5);
		Method.copyElements(max2V!, this.tmpVertices[this.numTmpVertices++].elements, 0, 0, 5);
		Method.copyElements(min1V!, this.tmpVertices[this.numTmpVertices++].elements, 0, 0, 5);
		Method.copyElements(min2V!, this.tmpVertices[this.numTmpVertices++].elements, 0, 0, 5);
		const tmp = this.vertices;
		this.vertices = this.tmpVertices;
		this.tmpVertices = tmp;
		this.numVertices = this.numTmpVertices;
		this.numTmpVertices = 0;
	}

	private _addScaledVert(s1: number, s2: number, v2: Float64Array, v1: Float64Array): void {
		const t = s1 / (s1 - s2);
		const d21 = Method.subArray(v2, v1, this._fv0, 0, 0, 0, 5);
		Method.scaleArray(d21, t, d21, 0, 0, 5);
		Method.addArray(v1, d21, this.tmpVertices[this.numTmpVertices++].elements, 0, 0, 0, 5);
	}
	private _setVertex(s1: number, s2: number, v1: Float64Array, v2: Float64Array): void {
		if (s1 > 0 && s2 > 0) {
			Method.copyElements(v1, this.tmpVertices[this.numTmpVertices++].elements, 0, 0, 5);
		} else if (s1 > 0 && s2 <= 0) {
			Method.copyElements(v1, this.tmpVertices[this.numTmpVertices++].elements, 0, 0, 5);
			this._addScaledVert(s1, s2, v2, v1);
		} else if (s1 <= 0 && s2 > 0) {
			this._addScaledVert(s1, s2, v2, v1);
		}
	}
}