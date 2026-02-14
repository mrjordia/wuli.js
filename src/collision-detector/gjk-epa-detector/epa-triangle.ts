import Vec3 from "../../common/vec3";
import { CONSTANT } from "../../constant";
import Method from "../../common/method";
import EpaVertex from "./epa-vertex";
import { Nullable } from "../../common/nullable";

export default class EpaTriangle {
	public id = ++CONSTANT.EPA_TRIANGLE_COUNT;
	public next: Nullable<EpaTriangle>;
	public prev: Nullable<EpaTriangle>;
	public normal = new Vec3();
	public distanceSq = 0;
	public tmpDfsId = 0;
	public tmpDfsVisible = false;
	public vertices: Array<Nullable<EpaVertex>> = new Array(3);
	public adjacentTriangles: Array<Nullable<EpaTriangle>> = new Array(3);
	public adjacentPairIndex = new Int8Array(3);
	public tmp = new Vec3();
	public nextIndex = Method.setElements(new Int8Array(3) as any, 0, 1, 2, 0);

	private _ev0 = new Float64Array(3);
	private _ev1 = new Float64Array(3);
	private _ev2 = new Float64Array(3);
	private _ev3 = new Float64Array(3);
	private _ev4 = new Float64Array(3);
	private _ev5 = new Float64Array(3);
	private _ev6 = new Float64Array(3);
	private _ev7 = new Float64Array(3);
	private _ev8 = new Float64Array(3);
	private _ev9 = new Float64Array(3);
	private _ev10 = new Float64Array(3);
	private _evv0 = new Float64Array(3);
	private _evv1 = new Float64Array(3);
	private _evv2 = new Float64Array(3);

	public init(vertex1: EpaVertex, vertex2: EpaVertex, vertex3: EpaVertex, center: Vec3, autoCheck: boolean): boolean {
		if (!autoCheck) {
			autoCheck = false;
		}
		const vertices = this.vertices;
		const v1 = Method.copyElements(vertex1.v.elements, this._ev0, 0, 0, 3);
		const v2 = Method.copyElements(vertex2.v.elements, this._ev1, 0, 0, 3);
		const v3 = Method.copyElements(vertex3.v.elements, this._ev2, 0, 0, 3);
		const vc = Method.copyElements(center.elements, this._ev3, 0, 0, 3);
		const v12 = Method.subArray(v2, v1, this._ev4, 0, 0, 0, 3);
		const v13 = Method.subArray(v3, v1, this._ev5, 0, 0, 0, 3);
		const vc1 = Method.subArray(v1, vc, this._ev6, 0, 0, 0, 3);
		const inr = Method.crossVectors(v12[0], v12[1], v12[2], v13[0], v13[1], v13[2], this._ev7, 0);
		let inverted = false;
		if (Method.multiplyArray(vc1, inr, 0, 0, 3) < 0) {
			if (autoCheck) {
				const tmp = vertex2;
				vertex2 = vertex3;
				vertex3 = tmp;
				inr[0] *= -1; inr[1] *= -1; inr[2] *= -1;
			} else {
				inverted = true;
			}
		}
		Method.setElements(vertices, 0, vertex1, vertex2, vertex3);
		Method.copyElements(inr, this.normal.elements, 0, 0, 3);
		const vec1 = vertex1.v.elements;
		const vec2 = vertex2.v.elements;
		const vec3 = vertex3.v.elements;
		const out = this.tmp.elements;
		const v11 = Method.copyElements(vec1, this._ev0, 0, 0, 3);
		const v21 = Method.copyElements(vec2, this._ev1, 0, 0, 3);
		const v31 = Method.copyElements(vec3, this._ev2, 0, 0, 3);
		const v121 = Method.subArray(v21, v11, this._ev3, 0, 0, 0, 3);
		const v23 = Method.subArray(v31, v21, this._ev4, 0, 0, 0, 3);
		const v311 = Method.subArray(v11, v31, this._ev5, 0, 0, 0, 3);
		const n = Method.crossVectors(v121[0], v121[1], v121[2], v23[0], v23[1], v23[2], this._ev6, 0);
		const n12 = Method.crossVectors(v121[0], v121[1], v121[2], n[0], n[1], n[2], this._ev7, 0);
		const n23 = Method.crossVectors(v23[0], v23[1], v23[2], n[0], n[1], n[2], this._ev8, 0);
		const n31 = Method.crossVectors(v311[0], v311[1], v311[2], n[0], n[1], n[2], this._ev9, 0);
		let mind = -1;
		const miv = Method.setElements(this._ev10, 0, 0, 0, 0);
		if (Method.multiplyArray(v11, n12, 0, 0, 3) < 0) {
			mind = this._getMiv(vec1, vec2, out);
			Method.copyElements(out, miv, 0, 0, 3);
		}
		if (Method.multiplyArray(v21, n23, 0, 0, 3) < 0) {
			const d = this._getMiv(vec2, vec3, out);
			if (mind < 0 || d < mind) {
				mind = d;
				Method.copyElements(out, miv, 0, 0, 3);
			}
		}
		if (Method.multiplyArray(v31, n31, 0, 0, 3) < 0) {
			const d = this._getMiv(vec1, vec3, out);
			if (mind < 0 || d < mind) {
				mind = d;
				Method.copyElements(out, miv, 0, 0, 3);
			}
		}
		if (mind > 0) {
			Method.copyElements(miv, out, 0, 0, 3);
		} else {
			let l = Method.multiplyArray(n, n, 0, 0, 3);
			if (l > 0) l = 1 / Math.sqrt(l);
			Method.scaleArray(n, l, n, 0, 0, 3);
			let l2 = Method.multiplyArray(n, n, 0, 0, 3);
			l2 = Method.multiplyArray(v11, n, 0, 0, 3) / l2;
			Method.scaleArray(n, l2, miv, 0, 0, 3);
			Method.copyElements(miv, out, 0, 0, 3);
		}
		const tmp = this.tmp.elements;
		this.distanceSq = Method.multiplyArray(tmp, tmp, 0, 0, 3);
		Method.fillValue(this.adjacentTriangles, 0, 2, null);
		Method.fillValue(this.adjacentPairIndex, 0, 2, -1);
		return !inverted;
	}
	public setAdjacentTriangle(triangle: EpaTriangle): boolean {
		const hv = this.vertices, hat = this.adjacentTriangles, hai = this.adjacentPairIndex, ni = this.nextIndex;
		const tv = triangle.vertices, tat = triangle.adjacentTriangles, tai = triangle.adjacentPairIndex;
		let count = 0;
		if (hv[0] === tv[ni[0]] && hv[ni[0]] === tv[0]) {
			hat[0] = triangle;
			hai[0] = 0;
			tat[0] = this;
			tai[0] = 0;
			count = 1;
		}
		if (hv[0] === tv[ni[1]] && hv[ni[0]] === tv[1]) {
			hat[0] = triangle;
			hai[0] = 1;
			tat[1] = this;
			tai[1] = 0;
			++count;
		}
		if (hv[0] === tv[ni[2]] && hv[ni[0]] === tv[2]) {
			hat[0] = triangle;
			hai[0] = 2;
			tat[2] = this;
			tai[2] = 0;
			++count;
		}
		if (hv[1] === tv[ni[0]] && hv[ni[1]] === tv[0]) {
			hat[1] = triangle;
			hai[1] = 0;
			tat[0] = this;
			tai[0] = 1;
			++count;
		}
		if (hv[1] === tv[ni[1]] && hv[ni[1]] === tv[1]) {
			hat[1] = triangle;
			hai[1] = 1;
			tat[1] = this;
			tai[1] = 1;
			++count;
		}
		if (hv[1] === tv[ni[2]] && hv[ni[1]] === tv[2]) {
			hat[1] = triangle;
			hai[1] = 2;
			tat[2] = this;
			tai[2] = 1;
			++count;
		}
		if (hv[2] === tv[ni[0]] && hv[ni[2]] === tv[0]) {
			hat[2] = triangle;
			hai[2] = 0;
			tat[0] = this;
			tai[0] = 2;
			++count;
		}
		if (hv[2] === tv[ni[1]] && hv[ni[2]] === tv[1]) {
			hat[2] = triangle;
			hai[2] = 1;
			tat[1] = this;
			tai[1] = 2;
			++count;
		}
		if (hv[2] === tv[ni[2]] && hv[ni[2]] === tv[2]) {
			hat[2] = triangle;
			hai[2] = 2;
			tat[2] = this;
			tai[2] = 2;
			++count;
		}
		return count === 1;
	}
	public removeAdjacentTriangles(): void {
		const adt = this.adjacentTriangles, adi = this.adjacentPairIndex;
		const triangle = adt[0];
		if (triangle) {
			const pairIndex = adi[0];
			triangle.adjacentTriangles[pairIndex] = null;
			triangle.adjacentPairIndex[pairIndex] = -1;
			adt[0] = null;
			adi[0] = -1;
		}
		const triangle1 = adt[1];
		if (triangle1) {
			const pairIndex = adi[1];
			triangle1.adjacentTriangles[pairIndex] = null;
			triangle1.adjacentPairIndex[pairIndex] = -1;
			adt[1] = null;
			adi[1] = -1;
		}
		const triangle2 = adt[2];
		if (triangle2) {
			const pairIndex = adi[2];
			triangle2.adjacentTriangles[pairIndex] = null;
			triangle2.adjacentPairIndex[pairIndex] = -1;
			adt[2] = null;
			adi[2] = -1;
		}
	}
	public removeReferences(): void {
		this.next = null;
		this.prev = null;
		this.tmpDfsId = 0;
		this.tmpDfsVisible = false;
		this.distanceSq = 0;
		Method.fillValue(this.vertices, 0, 2, null);
		Method.fillValue(this.adjacentTriangles, 0, 2, null);
		Method.fillValue(this.adjacentPairIndex, 0, 2, 0);
	}

	private _getMiv(vec1: Float64Array, vec2: Float64Array, out: Float64Array): number {
		const v1 = Method.copyElements(vec1, this._evv0, 0, 0, 3);
		const v2 = Method.copyElements(vec2, this._evv1, 0, 0, 3);
		const v12 = Method.subArray(v2, v1, this._evv2, 0, 0, 0, 3);
		let t = Method.multiplyArray(v12, v1, 0, 0, 3);
		t = -t / Method.multiplyArray(v12, v12, 0, 0, 3);
		if (t < 0) {
			Method.copyElements(v1, out, 0, 0, 3);
		} else if (t > 1) {
			Method.copyElements(v2, out, 0, 0, 3);
		} else {
			Method.scaleArray(v12, t, v12, 0, 0, 3);
			Method.addArray(v1, v12, out, 0, 0, 0, 3);
		}
		return Method.multiplyArray(out, out, 0, 0, 3);
	}

}