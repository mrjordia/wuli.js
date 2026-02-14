import Vec3 from "../../common/vec3";
import { CONSTANT } from "../../constant";
import EpaTriangle from "./epa-triangle";
import Method from "../../common/method";
import EpaVertex from "./epa-vertex";
import { Nullable } from "../../common/nullable";


export default class EpaPolyhedron {
	public vertices = new Array(CONSTANT.SETTING_MAX_EPA_VERTICES);
	public center = new Vec3();
	public numVertices = 0;
	public triangleList: Nullable<EpaTriangle>;
	public triangleListLast: Nullable<EpaTriangle>;
	public numTriangles = 0;
	public trianglePool: Nullable<EpaTriangle>;
	public vertexPool: Nullable<EpaVertex>;
	public status: Nullable<number>;

	public validate(): boolean {
		let t: Nullable<EpaTriangle> = this.triangleList!;
		const tv = t.vertices, tai = t.adjacentPairIndex, tat = t.adjacentTriangles;
		while (t) {
			tv[0]!.tmpEdgeLoopOuterTriangle = null;
			tv[0]!.tmpEdgeLoopNext = null;
			if (tai[0] === -1) {
				this.status = 2;
				return false;
			}
			if (!tat[0]) {
				this.status = 3;
				return false;
			}
			tv[1]!.tmpEdgeLoopOuterTriangle = null;
			tv[1]!.tmpEdgeLoopNext = null;
			if (tai[1] === -1) {
				this.status = 2;
				return false;
			}
			if (!tat[1]) {
				this.status = 3;
				return false;
			}
			tv[2]!.tmpEdgeLoopOuterTriangle = null;
			tv[2]!.tmpEdgeLoopNext = null;
			if (tai[2] === -1) {
				this.status = 2;
				return false;
			}
			if (!tat[2]) {
				this.status = 3;
				return false;
			}
			t = t.next;
		}
		return true;
	}
	public findEdgeLoop(id: number, base: EpaTriangle, _from: Vec3): void {
		if (base.tmpDfsId === id) return;
		base.tmpDfsId = id;
		const from = _from.elements;
		const bse = base.tmp.elements, v = base.vertices[0]!.v.elements, v1 = base.normal.elements;
		Method.copyElements(from, bse, 0, 0, 3);
		Method.subArray(bse, v, bse, 0, 0, 0, 3);
		let vis = base.tmpDfsVisible = Method.multiplyArray(bse, v1, 0, 0, 3) > 0;
		if (!vis) {
			this.status = 6;
			return;
		}
		let _g = 0;
		while (_g < 3) {
			const i = _g++;
			const t = base.adjacentTriangles[i];
			if (!t) continue;
			const tes = t.tmp.elements, v = t.vertices[0]!.v.elements, v1 = t.normal.elements;
			Method.copyElements(from, tes, 0, 0, 3);
			Method.subArray(tes, v, tes, 0, 0, 0, 3);
			vis = t.tmpDfsVisible = Method.multiplyArray(tes, v1, 0, 0, 3) > 0;
			if (vis) {
				this.findEdgeLoop(id, t, _from);
			} else {
				const v1 = base.vertices[i]!;
				v1.tmpEdgeLoopNext = base.vertices[base.nextIndex[i]];
				v1.tmpEdgeLoopOuterTriangle = t;
			}
		}
		let triangle = base.adjacentTriangles[0];
		if (triangle) {
			const pairIndex = base.adjacentPairIndex[0];
			triangle.adjacentTriangles[pairIndex] = null;
			triangle.adjacentPairIndex[pairIndex] = -1;
			base.adjacentTriangles[0] = null;
			base.adjacentPairIndex[0] = -1;
		}
		triangle = base.adjacentTriangles[1];
		if (triangle) {
			const pairIndex = base.adjacentPairIndex[1];
			triangle.adjacentTriangles[pairIndex] = null;
			triangle.adjacentPairIndex[pairIndex] = -1;
			base.adjacentTriangles[1] = null;
			base.adjacentPairIndex[1] = -1;
		}
		triangle = base.adjacentTriangles[2];
		if (triangle) {
			const pairIndex = base.adjacentPairIndex[2];
			triangle.adjacentTriangles[pairIndex] = null;
			triangle.adjacentPairIndex[pairIndex] = -1;
			base.adjacentTriangles[2] = null;
			base.adjacentPairIndex[2] = -1;
		}
		this.numTriangles--;
		const prev = base.prev, next = base.next;
		if (prev) prev.next = next;
		if (next) next.prev = prev;
		if (base === this.triangleList) this.triangleList = this.triangleList.next;
		if (base === this.triangleListLast) this.triangleListLast = this.triangleListLast.prev;
		base.next = null;
		base.prev = null;
		base.removeReferences();
		base.next = this.trianglePool;
		this.trianglePool = base;
	}
	public init(v1: EpaVertex, v2: EpaVertex, v3: EpaVertex, v4: EpaVertex): boolean {
		this.status = 0;
		this.numVertices = 4;
		Method.setElements<Array<EpaVertex>, EpaVertex>(this.vertices, 0, v1, v2, v3, v4);
		const ces = this.center.elements;
		const v = v1.v.elements, v5 = v2.v.elements, v6 = v3.v.elements, v7 = v4.v.elements;
		Method.setElements(ces, v[0] + v5[0] + v6[0] + v7[0], v[1] + v5[1] + v6[1] + v7[1], v[2] + v5[2] + v6[2] + v7[2]);
		Method.scaleArray(ces, 0.25, ces, 0, 0, 3);
		const t1 = this._getTriangle();
		const t2 = this._getTriangle();
		const t3 = this._getTriangle();
		const t4 = this._getTriangle();
		if (!t1.init(v1, v2, v3, this.center, true)) this.status = 1;
		if (!t2.init(v1, v2, v4, this.center, true)) this.status = 1;
		if (!t3.init(v1, v3, v4, this.center, true)) this.status = 1;
		if (!t4.init(v2, v3, v4, this.center, true)) this.status = 1;
		if (!t1.setAdjacentTriangle(t2)) this.status = 1;
		if (!t1.setAdjacentTriangle(t3)) this.status = 1;
		if (!t1.setAdjacentTriangle(t4)) this.status = 1;
		if (!t2.setAdjacentTriangle(t3)) this.status = 1;
		if (!t2.setAdjacentTriangle(t4)) this.status = 1;
		if (!t3.setAdjacentTriangle(t4)) this.status = 1;
		this._setTriangleList(t1);
		this._setTriangleList(t2);
		this._setTriangleList(t3);
		this._setTriangleList(t4);
		return this.status === 0;
	}
	public addVertex(vertex: EpaVertex, base: EpaTriangle): boolean {
		this.vertices[this.numVertices++] = vertex;
		const v1 = base.vertices[0]!;
		this.findEdgeLoop(this.numVertices, base, vertex.v);
		if (this.status !== 0) return false;
		let v = v1;
		let prevT = null, firstT = null;
		while (true) {
			if (!v.tmpEdgeLoopNext) {
				this.status = 4;
				return false;
			}
			if (!v.tmpEdgeLoopOuterTriangle) {
				this.status = 5;
				return false;
			}
			let first = this.trianglePool;
			if (first) {
				this.trianglePool = first.next;
				first.next = null;
			} else {
				first = new EpaTriangle();
			}
			const t = first;
			if (!firstT) firstT = t;
			if (!t.init(v, v.tmpEdgeLoopNext, vertex, this.center, false)) this.status = 1;
			if (this.status !== 0) return false;
			this._setTriangleList(t);
			if (!t.setAdjacentTriangle(v.tmpEdgeLoopOuterTriangle)) this.status = 1;
			if (prevT) {
				if (!t.setAdjacentTriangle(prevT)) this.status = 1;
			}
			prevT = t;
			v = v.tmpEdgeLoopNext;
			if (!(v !== v1)) break;
		}
		if (!prevT.setAdjacentTriangle(firstT)) this.status = 1;
		if (this.status === 0) {
			return this.validate();
		} else {
			return false;
		}
	}

	private _getTriangle(): EpaTriangle {
		let t = this.trianglePool;
		if (t) {
			this.trianglePool = t.next;
			t.next = null;
		} else {
			t = new EpaTriangle();
		}
		return t;
	}
	private _setTriangleList(t1: EpaTriangle): void {
		this.numTriangles++;
		if (!this.triangleList) {
			this.triangleList = this.triangleListLast = t1;
		} else {
			this.triangleListLast!.next = t1;
			t1.prev = this.triangleListLast;
			this.triangleListLast = t1;
		}
	}

}