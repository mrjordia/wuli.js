
import Vec3 from "../../common/vec3";
import Transform from "../../common/transform";
import EpaPolyhedron from "./epa-polyhedron";
import GjkCache from "./gjk-cache";
import EpaVertex from "./epa-vertex";
import { GJK_EPA_RESULT_STATE } from "../../constant";
import Method from "../../common/method";
import ConvexGeometry from "../../shape/convex-geometry";
import CachedDetectorData from "../cached-detector-data";
import RayCastHit from "../../shape/ray-cast-hit";
import EpaTriangle from "./epa-triangle";
import { Nullable } from "../../common/nullable";

export default class GjkEpa {
	public distance = 0;
	public simplexSize!: number;
	public s = [new Vec3(), new Vec3(), new Vec3(), new Vec3()];
	public w1 = [new Vec3(), new Vec3(), new Vec3(), new Vec3()];
	public w2 = [new Vec3(), new Vec3(), new Vec3(), new Vec3()];
	public baseDirs = [new Vec3(1, 0, 0), new Vec3(0, 1, 0), new Vec3(0, 0, 1)];
	public tl1 = new Vec3();
	public tl2 = new Vec3();
	public rayX = new Vec3();
	public rayR = new Vec3();
	public tempTransform = new Transform();
	public dir = new Vec3();
	public closest = new Vec3();
	public closestPoint1 = new Vec3();
	public closestPoint2 = new Vec3();
	public polyhedron = new EpaPolyhedron();
	public c1: Nullable<ConvexGeometry>;
	public c2: Nullable<ConvexGeometry>;
	public tf1!: Transform;
	public tf2!: Transform;
	public depth !: number;

	private _tv0 = new Float64Array(3);
	private _tv1 = new Float64Array(3);
	private _tv2 = new Float64Array(3);
	private _tv3 = new Float64Array(3);
	private _tv4 = new Float64Array(3);
	private _tv5 = new Float64Array(3);
	private _tv6 = new Float64Array(3);
	private _tv7 = new Float64Array(3);
	private _tv8 = new Float64Array(3);
	private _tv9 = new Float64Array(3);
	private _tv10 = new Float64Array(3);
	private _tv22 = new Float64Array(3);
	private _tv23 = new Float64Array(3);
	private _tv24 = new Float64Array(3);
	private _tv25 = new Float64Array(3);
	private _tv26 = new Float64Array(3);
	private _tv27 = new Float64Array(3);
	private _tv28 = new Float64Array(3);

	public static get instance(): GjkEpa {
		return INSTANCE;
	}
	public computeClosestPointsImpl(c1: ConvexGeometry, c2: ConvexGeometry, _tf1: Transform, _tf2: Transform, cache: Nullable<CachedDetectorData>, useEpa: boolean): number {
		this.c1 = c1;
		this.c2 = c2;
		this.tf1 = _tf1;
		this.tf2 = _tf2;
		const tf1 = _tf1.elements, tf2 = _tf2.elements;
		const s = this.s, w1 = this.w1, w2 = this.w2;
		const closest = this.closest.elements, dir = this.dir.elements;
		if (cache) {
			if (!cache.gjkCache) cache.gjkCache = new GjkCache();
			this._loadCache(cache.gjkCache);
		} else {
			Method.fillValue(dir, 0, 2, 0);
		}
		if (Method.multiplyArray(dir, dir, 0, 0, 3) === 0) {
			Method.subArray(tf2, tf1, dir, 0, 0, 0, 3);
			if (Method.multiplyArray(dir, dir, 0, 0, 3) < 1e-6) {
				Method.setElements(dir, 0, 1, 0, 0);
			}
		}
		this.simplexSize = 0;
		this._computeWitnessPoint1(false);
		this._computeWitnessPoint2(false);
		this._setSV(s, w1, w2);
		this.simplexSize = 1;
		let count = 0;
		while (count < 40) {
			const v = this._getVertexBits(s, closest);
			if (Method.multiplyArray(closest, closest, 0, 0, 3) < 1e-008) {
				if (!useEpa) {
					this.distance = 0;
					return 0;
				}
				switch (this.simplexSize) {
					case 1:
						this._pointToTetrahedron();
						break;
					case 2:
						this._lineToTetrahedron();
						break;
					case 3:
						this._triangleToTetrahedron();
						break;
				}
				if (this.simplexSize === 4) {
					const epaState = this._computeDepth(s, w1, w2);
					if (epaState !== 0) {
						this.distance = 0;
						return epaState;
					}
					this.distance = -this.depth;
					return 0;
				}
				this.distance = 0;
				return 1;
			}
			this._shrinkSimplex(v);
			Method.copyElements(closest, dir, 0, 0, 3);
			Method.scaleArray(dir, -1, dir, 0, 0, 3);
			this._computeWitnessPoint1(false);
			this._computeWitnessPoint2(false);
			this._setSV(s, w1, w2);
			if (Method.multiplyArray(dir, dir, 0, 0, 3) < 1e-008) {
				throw new Error("GjkEpa error: length of [dir] is zero!");
			}
			const _this1 = s[this.simplexSize].elements;
			if (Method.multiplyArray(_this1, dir) - Method.multiplyArray(closest, dir) < 1e-008) {
				this._interpolateClosestPoints();
				this.distance = Math.sqrt(Method.multiplyArray(closest, closest));
				if (cache && cache.gjkCache) {
					this._saveCache(cache.gjkCache);
				}
				return 0;
			}
			this.simplexSize++;
			++count;
		}
		return 2;
	}
	public computeClosestPoints(c1: ConvexGeometry, c2: ConvexGeometry, tf1: Transform, tf2: Transform, cache: CachedDetectorData): number {
		return this.computeClosestPointsImpl(c1, c2, tf1, tf2, cache, true);
	}
	public computeDistance(c1: ConvexGeometry, c2: ConvexGeometry, tf1: Transform, tf2: Transform, cache: CachedDetectorData): number {
		return this.computeClosestPointsImpl(c1, c2, tf1, tf2, cache, false);
	}
	public convexCast(c1: ConvexGeometry, c2: ConvexGeometry, tf1: Transform, tf2: Transform, tl1: Vec3, tl2: Vec3, hit: RayCastHit): boolean {
		return this._convexCastImpl(c1, c2, tf1, tf2, tl1, tl2, hit);
	}
	public rayCast(c: ConvexGeometry, tf: Transform, _begin: Vec3, _end: Vec3, hit: RayCastHit): boolean {
		const begin = _begin.elements, end = _end.elements;
		const _tf1 = this.tempTransform;
		const tf1 = _tf1.elements;
		tf1[0] = begin[0]; tf1[1] = begin[1]; tf1[2] = begin[2];
		const _tl1 = this.tl1, _tl2 = this.tl2;
		const tl1 = _tl1.elements, tl2 = _tl2.elements;
		tl1[0] = end[0]; tl1[1] = end[1]; tl1[2] = end[2];
		tl1[0] -= begin[0]; tl1[1] -= begin[1]; tl1[2] -= begin[2];
		tl2[0] = tl2[1] = tl2[2] = 0;
		return this._convexCastImpl(null, c, _tf1, tf, _tl1, _tl2, hit);
	}

	private _getVertexBits(s: Array<Vec3>, closest: Float64Array): number {
		let v = 0;
		const s0 = this._tv0, s1 = this._tv1, s2 = this._tv2, s3 = this._tv3;
		switch (this.simplexSize) {
			case 1:
				Method.copyElements(s[0].elements, closest, 0, 0, 3);
				v = 1;
				break;
			case 2:
				Method.copyElements(s[0].elements, s0, 0, 0, 3);
				Method.copyElements(s[1].elements, s1, 0, 0, 3);
				v = this._getMinInfo(s1, s0, this._tv4, closest);
				break;
			case 3:
				Method.copyElements(s[0].elements, s0, 0, 0, 3);
				Method.copyElements(s[1].elements, s1, 0, 0, 3);
				Method.copyElements(s[2].elements, s2, 0, 0, 3);
				const v121 = Method.subArray(s1, s0, this._tv4, 0, 0, 0, 3);
				const v23 = Method.subArray(s2, s1, this._tv5, 0, 0, 0, 3);
				const v31 = Method.subArray(s0, s2, this._tv6, 0, 0, 0, 3);
				const n = Method.crossVectors(v121[0], v121[1], v121[2], v23[0], v23[1], v23[2], this._tv7, 0);
				const n12 = Method.crossVectors(v121[0], v121[1], v121[2], n[0], n[1], n[2], this._tv8, 0);
				const n23 = Method.crossVectors(v23[0], v23[1], v23[2], n[0], n[1], n[2], this._tv9, 0);
				const n31 = Method.crossVectors(v31[0], v31[1], v31[2], n[0], n[1], n[2], this._tv10, 0);
				let mind = -1, mini = 0;
				const minv = this._tv4;
				if (Method.multiplyArray(s0, n12, 0, 0, 3) < 0) {
					mini = this._getMinInfo(s1, s0, this._tv5, closest);
					mind = Method.multiplyArray(closest, closest, 0, 0, 3);
					Method.copyElements(closest, minv, 0, 0, 3);
				}
				if (Method.multiplyArray(s1, n23, 0, 0, 3) < 0) {
					const b = this._getMinInfo(s2, s1, this._tv5, closest);
					const d = Method.multiplyArray(closest, closest, 0, 0, 3);
					if (mind < 0 || d < mind) {
						mini = b << 1;
						mind = d;
						Method.copyElements(closest, minv, 0, 0, 3);
					}
				}
				if (Method.multiplyArray(s2, n31, 0, 0, 3) < 0) {
					const b = this._getMinInfo(s2, s0, this._tv5, closest);
					const d = Method.multiplyArray(closest, closest, 0, 0, 3);
					if (mind < 0 || d < mind) {
						mini = b & 1 | (b & 2) << 1;
						mind = d;
						Method.copyElements(closest, minv, 0, 0, 3);
					}
				}
				v = this._checkMinD(mind, mini, minv, closest, n, s0);
				break;
			case 4:
				Method.copyElements(s[0].elements, s0, 0, 0, 3);
				Method.copyElements(s[1].elements, s1, 0, 0, 3);
				Method.copyElements(s[2].elements, s2, 0, 0, 3);
				Method.copyElements(s[3].elements, s3, 0, 0, 3);
				const v122 = Method.subArray(s1, s0, this._tv4, 0, 0, 0, 3);
				const v13 = Method.subArray(s2, s0, this._tv5, 0, 0, 0, 3);
				const v14 = Method.subArray(s3, s0, this._tv6, 0, 0, 0, 3);
				const v231 = Method.subArray(s2, s1, this._tv7, 0, 0, 0, 3);
				const v24 = Method.subArray(s3, s1, this._tv8, 0, 0, 0, 3);
				const n123 = Method.crossVectors(v122[0], v122[1], v122[2], v13[0], v13[1], v13[2], this._tv9, 0);
				const n134 = Method.crossVectors(v13[0], v13[1], v13[2], v14[0], v14[1], v14[2], this._tv10, 0);
				const n142 = Method.crossVectors(v14[0], v14[1], v14[2], v122[0], v122[1], v122[2], this._tv5, 0);
				const n243 = Method.crossVectors(v24[0], v24[1], v24[2], v231[0], v231[1], v231[2], this._tv6, 0);
				const sign = Method.multiplyArray(v122, n243, 0, 0, 3) > 0 ? 1 : -1;
				let mind1 = -1, mini1 = 0;
				const minv1 = this._tv4;
				if ((Method.multiplyArray(s0, n123, 0, 0, 3)) * sign < 0) {
					mini1 = this._getMin(s1, s0, s2, closest);
					mind1 = Method.multiplyArray(closest, closest, 0, 0, 3);
					Method.copyElements(closest, minv1, 0, 0, 3);
				}
				if ((Method.multiplyArray(s0, n134, 0, 0, 3)) * sign < 0) {
					const b = this._getMin(s2, s0, s3, closest);
					const d = Method.multiplyArray(closest, closest, 0, 0, 3);
					if (mind1 < 0 || d < mind1) {
						mini1 = b & 1 | (b & 6) << 1;
						mind1 = d;
						Method.copyElements(closest, minv1, 0, 0, 3);
					}
				}
				if ((Method.multiplyArray(s0, n142, 0, 0, 3)) * sign < 0) {
					const b = this._getMin(s1, s0, s3, closest);
					const d = Method.multiplyArray(closest, closest, 0, 0, 3);
					if (mind1 < 0 || d < mind1) {
						mini1 = b & 3 | (b & 4) << 1;
						mind1 = d;
						Method.copyElements(closest, minv1, 0, 0, 3);
					}
				}
				if ((Method.multiplyArray(s1, n243, 0, 0, 3)) * sign < 0) {
					const b = this._getMin(s2, s1, s3, closest);
					const d = Method.multiplyArray(closest, closest, 0, 0, 3);
					if (mind1 < 0 || d < mind1) {
						mini1 = b << 1;
						mind1 = d;
						Method.copyElements(closest, minv1, 0, 0, 3);
					}
				}
				if (mind1 > 0) {
					Method.copyElements(minv1, closest, 0, 0, 3);
					v = mini1;
				} else {
					Method.fillValue(closest, 0, 2, 0);
					v = 15;
				}
				break;
		}
		return v;
	}
	private _convexCastImpl(c1: Nullable<ConvexGeometry>, c2: ConvexGeometry, _tf1: Transform, _tf2: Transform, _tl1: Vec3, _tl2: Vec3, hit: RayCastHit): boolean {
		const tl1 = _tl1.elements, tl2 = _tl2.elements;
		this.c1 = c1;
		this.c2 = c2;
		this.tf1 = _tf1;
		this.tf2 = _tf2;
		const tf1 = _tf1.elements, tf2 = _tf2.elements;
		const s = this.s, w1 = this.w1, w2 = this.w2, closest = this.closest.elements, dir = this.dir.elements;
		Method.subArray(tf2, tf1, dir, 0, 0, 0, 3);
		if (Method.multiplyArray(dir, dir, 0, 0, 3) < 1e-6) {
			Method.setElements(dir, 0, 1, 0, 0);
		}
		this.simplexSize = 0;
		if (this.c1) {
			this._computeWitnessPoint1(true);
		} else {
			Method.copyElements(tf1, w1[this.simplexSize].elements, 0, 0, 3);
		}
		this._computeWitnessPoint2(true);
		this._setSV(s, w1, w2);
		this.simplexSize = 1;
		let count = 0, lambda = 0.0;
		const rayX = this.rayX.elements, rayR = this.rayR.elements;
		Method.setElements(rayX, 0, 0, 0, 0);
		Method.copyElements(tl2, rayR, 0, 0, 3);
		Method.subArray(rayR, tl1, rayR, 0, 0, 0, 3);
		while (count < 40) {
			let v = this._getVertexBits(s, closest);
			this._shrinkSimplex(v);
			if (Method.multiplyArray(closest, closest, 0, 0, 3) < 1e-008) {
				if (lambda === 0 || this.simplexSize === 4) {
					hit.fraction = lambda;
					return false;
				}
				this._interpolateClosestPoints();
				hit.fraction = lambda;
				let nor = hit.normal.elements;
				Method.copyElements(dir, nor, 0, 0, 3);
				Method.normalize(nor, 0, 3, 1);
				let pos = hit.position.elements, v = this.closestPoint1.elements;
				Method.copyElements(v, pos, 0, 0, 3);
				Method.scaleArray(tl1, lambda, this._tv1, 0, 0, 3);
				Method.addArray(pos, this._tv1, pos, 0, 0, 0, 3);
				return true;
			}
			Method.copyElements(closest, dir, 0, 0, 3);
			Method.scaleArray(dir, -1, dir, 0, 0, 3);
			if (this.c1) {
				this._computeWitnessPoint1(true);
			} else {
				Method.copyElements(this.tf1.elements, this.w1[this.simplexSize].elements, 0, 0, 3);
			}
			this._computeWitnessPoint2(true);
			this._setSV(s, w1, w2);
			const _s1 = s[this.simplexSize].elements;
			Method.subArray(_s1, rayX, _s1, 0, 0, 0, 3);
			if (Method.multiplyArray(dir, dir, 0, 0, 3) < 1e-008) {
				throw new Error("GjkEpa error: length of [dir] is zero!");
			}
			const pn = Method.multiplyArray(s[this.simplexSize].elements, dir, 0, 0, 3);
			if (pn < 0) {
				if (Method.multiplyArray(rayR, dir, 0, 0, 3) >= 0) {
					return false;
				}
				let dLambda = pn / Method.multiplyArray(rayR, dir, 0, 0, 3);
				lambda += dLambda;
				if (lambda >= 1) {
					return false;
				}
				Method.scaleArray(rayR, dLambda, this._tv1, 0, 0, 3);
				Method.addArray(rayX, this._tv1, rayX, 0, 0, 0, 3);
				let _g = 0, _g1 = this.simplexSize + 1;
				while (_g < _g1) {
					let _s = s[_g++].elements;
					Method.scaleArray(rayR, -dLambda, this._tv1, 0, 0, 3);
					Method.addArray(_s, this._tv1, _s, 0, 0, 0, 3);
				}
			}
			let duplicate = false;
			let _g = 0, _g1 = this.simplexSize;
			while (_g < _g1) {
				let i = _g++;
				let d = Method.subArray(s[i].elements, s[this.simplexSize].elements, this._tv2, 0, 0, 0, 3);
				if (Method.multiplyArray(d, d, 0, 0, 3) < 1e-008) {
					duplicate = true;
					break;
				}
			}
			if (!duplicate) {
				this.simplexSize++;
			}
			++count;
		}
		return false;
	}
	private _interpolateClosestPoints(): void {
		switch (this.simplexSize) {
			case 1:
				const cp1 = this.closestPoint1.elements, v = this.w1[0].elements;
				cp1[0] = v[0]; cp1[1] = v[1]; cp1[2] = v[2];
				const cp2 = this.closestPoint2.elements, v1 = this.w2[0].elements;
				cp2[0] = v1[0]; cp2[1] = v1[1]; cp2[2] = v1[2];
				break;
			case 2:
				const v2 = this.closest.elements;
				const v3 = this.s[0].elements, v4 = this.w1[0].elements, v5 = this.w2[0].elements, v6 = this.s[1].elements, v7 = this.w1[1].elements, v8 = this.w2[1].elements;
				const s01X = v6[0] - v3[0], s01Y = v6[1] - v3[1], s01Z = v6[2] - v3[2];
				let invDet = s01X * s01X + s01Y * s01Y + s01Z * s01Z;
				if (invDet !== 0) {
					invDet = 1 / invDet;
				}
				const s0cX = v2[0] - v3[0], s0cY = v2[1] - v3[1], s0cZ = v2[2] - v3[2];
				const t = (s0cX * s01X + s0cY * s01Y + s0cZ * s01Z) * invDet;
				let diffX = v7[0] - v4[0], diffY = v7[1] - v4[1], diffZ = v7[2] - v4[2];
				const cp1X = v4[0] + diffX * t, cp1Y = v4[1] + diffY * t, cp1Z = v4[2] + diffZ * t;
				diffX = v8[0] - v5[0]; diffY = v8[1] - v5[1]; diffZ = v8[2] - v5[2];
				const cp2X = v5[0] + diffX * t, cp2Y = v5[1] + diffY * t, cp2Z = v5[2] + diffZ * t;
				const v9 = this.closestPoint1.elements, v10 = this.closestPoint2.elements;
				v9[0] = cp1X; v9[1] = cp1Y; v9[2] = cp1Z;
				v10[0] = cp2X; v10[1] = cp2Y; v10[2] = cp2Z;
				break;
			case 3:
				const v11 = this.closest.elements;
				const v12 = this.s[0].elements, v13 = this.w1[0].elements, v14 = this.w2[0].elements, v15 = this.s[1].elements, v16 = this.w1[1].elements, v17 = this.w2[1].elements, v18 = this.s[2].elements, v19 = this.w1[2].elements, v20 = this.w2[2].elements;
				const s01X1 = v15[0] - v12[0], s01Y1 = v15[1] - v12[1], s01Z1 = v15[2] - v12[2];
				const s02X = v18[0] - v12[0], s02Y = v18[1] - v12[1], s02Z = v18[2] - v12[2];
				const s0cX1 = v11[0] - v12[0], s0cY1 = v11[1] - v12[1], s0cZ1 = v11[2] - v12[2];
				const d11 = s01X1 * s01X1 + s01Y1 * s01Y1 + s01Z1 * s01Z1;
				const d12 = s01X1 * s02X + s01Y1 * s02Y + s01Z1 * s02Z;
				const d22 = s02X * s02X + s02Y * s02Y + s02Z * s02Z;
				const d1c = s01X1 * s0cX1 + s01Y1 * s0cY1 + s01Z1 * s0cZ1;
				const d2c = s02X * s0cX1 + s02Y * s0cY1 + s02Z * s0cZ1;
				let invDet1 = d11 * d22 - d12 * d12;
				if (invDet1 !== 0) {
					invDet1 = 1 / invDet1;
				}
				const s = (d1c * d22 - d2c * d12) * invDet1;
				const t1 = (-d1c * d12 + d2c * d11) * invDet1;
				let diffX1 = v16[0] - v13[0], diffY1 = v16[1] - v13[1], diffZ1 = v16[2] - v13[2];
				let cp1X1 = v13[0] + diffX1 * s, cp1Y1 = v13[1] + diffY1 * s, cp1Z1 = v13[2] + diffZ1 * s;
				diffX1 = v19[0] - v13[0]; diffY1 = v19[1] - v13[1]; diffZ1 = v19[2] - v13[2];
				cp1X1 += diffX1 * t1; cp1Y1 += diffY1 * t1; cp1Z1 += diffZ1 * t1;
				diffX1 = v17[0] - v14[0]; diffY1 = v17[1] - v14[1]; diffZ1 = v17[2] - v14[2];
				let cp2X1 = v14[0] + diffX1 * s, cp2Y1 = v14[1] + diffY1 * s, cp2Z1 = v14[2] + diffZ1 * s;
				diffX1 = v20[0] - v14[0]; diffY1 = v20[1] - v14[1]; diffZ1 = v20[2] - v14[2];
				cp2X1 += diffX1 * t1; cp2Y1 += diffY1 * t1; cp2Z1 += diffZ1 * t1;
				const v21 = this.closestPoint1.elements, v22 = this.closestPoint2.elements;
				v21[0] = cp1X1; v21[1] = cp1Y1; v21[2] = cp1Z1;
				v22[0] = cp2X1; v22[1] = cp2Y1; v22[2] = cp2Z1;
				break;
			default:
				throw new Error("GjkEpa error: wrong simplexSize!");
		}
	}
	private _loadCache(gjkCache: GjkCache): void {
		const dir = this.dir.elements, v = gjkCache.prevClosestDir.elements;
		dir[0] = v[0]; dir[1] = v[1]; dir[2] = v[2];
	}
	private _saveCache(gjkCache: GjkCache): void {
		const dir = gjkCache.prevClosestDir.elements, v = this.closest.elements;
		dir[0] = -v[0]; dir[1] = -v[1]; dir[2] = -v[2];
	}
	private _shrinkSimplex(vertexBits: number): void {
		this.simplexSize = vertexBits;
		this.simplexSize = (this.simplexSize & 5) + (this.simplexSize >> 1 & 5);
		this.simplexSize = (this.simplexSize & 3) + (this.simplexSize >> 2 & 3);
		let ed: Float64Array, es: Float64Array, s = this.s, w1 = this.w1, w2 = this.w2;
		switch (vertexBits) {
			case 2:
				ed = s[0].elements; es = s[1].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				ed = w1[0].elements; es = w1[1].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				ed = w2[0].elements; es = w2[1].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				break;
			case 4:
				ed = s[0].elements; es = s[2].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				ed = w1[0].elements; es = w1[2].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				ed = w2[0].elements; es = w2[2].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				break;
			case 5:
				ed = s[1].elements; es = s[2].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				ed = w1[1].elements; es = w1[2].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				ed = w2[1].elements; es = w2[2].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				break;
			case 6:
				ed = s[0].elements; es = s[2].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				ed = w1[0].elements; es = w1[2].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				ed = w2[0].elements; es = w2[2].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				break;
			case 8:
				ed = s[0].elements; es = s[3].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				ed = w1[0].elements; es = w1[3].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				ed = w2[0].elements; es = w2[3].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				break;
			case 9:
				ed = s[1].elements; es = s[3].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				ed = w1[1].elements; es = w1[3].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				ed = w2[1].elements; es = w2[3].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				break;
			case 10:
				ed = s[0].elements; es = s[3].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				ed = w1[0].elements; es = w1[3].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				ed = w2[0].elements; es = w2[3].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				break;
			case 11:
				ed = s[2].elements; es = s[3].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				ed = w1[2].elements; es = w1[3].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				ed = w2[2].elements; es = w2[3].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				break;
			case 12:
				ed = s[0].elements; es = s[2].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				ed = w1[0].elements; es = w1[2].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				ed = w2[0].elements; es = w2[2].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				ed = s[1].elements; es = s[3].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				ed = w1[1].elements; es = w1[3].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				ed = w2[1].elements; es = w2[3].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				break;
			case 13:
				ed = s[1].elements; es = s[3].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				ed = w1[1].elements; es = w1[3].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				ed = w2[1].elements; es = w2[3].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				break;
			case 14:
				ed = s[0].elements; es = s[3].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				ed = w1[0].elements; es = w1[3].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				ed = w2[0].elements; es = w2[3].elements;
				ed[0] = es[0]; ed[1] = es[1]; ed[2] = es[2];
				break;
		}
	}
	private _computeWitnessPoint1(addMargin: boolean): void {
		const dir = this.dir.elements, tf1 = this.tf1.elements;
		const dx = dir[0], dy = dir[1], dz = dir[2];
		dir[0] = tf1[3] * dx + tf1[6] * dy + tf1[9] * dz; dir[1] = tf1[4] * dx + tf1[7] * dy + tf1[10] * dz; dir[2] = tf1[5] * dx + tf1[8] * dy + tf1[11] * dz;
		const w1 = this.w1, ss = this.simplexSize;
		this.c1!.computeLocalSupportingVertex(this.dir, w1[ss]);
		if (addMargin) {
			let invLen = Math.sqrt(dir[0] * dir[0] + dir[1] * dir[1] + dir[2] * dir[2]);
			if (invLen > 0) {
				invLen = 1 / invLen;
			}
			dir[0] *= invLen; dir[1] *= invLen; dir[2] *= invLen;
			const _this1 = w1[ss].elements;
			const s = this.c1!.gjkMargin;
			_this1[0] += dir[0] * s; _this1[1] += dir[1] * s; _this1[2] += dir[2] * s;
		}
		const v2 = w1[ss].elements;
		const tmpX = v2[0], tmpY = v2[1], tmpZ = v2[2];
		let iw1X = tf1[3] * tmpX + tf1[4] * tmpY + tf1[5] * tmpZ, iw1Y = tf1[6] * tmpX + tf1[7] * tmpY + tf1[8] * tmpZ, iw1Z = tf1[9] * tmpX + tf1[10] * tmpY + tf1[11] * tmpZ;
		iw1X += tf1[0]; iw1Y += tf1[1]; iw1Z += tf1[2];
		const v3 = w1[ss].elements;
		v3[0] = iw1X; v3[1] = iw1Y; v3[2] = iw1Z;
		dir[0] = dx; dir[1] = dy; dir[2] = dz;
	}
	private _computeWitnessPoint2(addMargin: boolean): void {
		const dir = this.dir.elements, tf2 = this.tf2.elements;
		const dx = dir[0], dy = dir[1], dz = dir[2];
		let d2x = tf2[3] * dx + tf2[6] * dy + tf2[9] * dz, d2y = tf2[4] * dx + tf2[7] * dy + tf2[10] * dz, d2z = tf2[5] * dx + tf2[8] * dy + tf2[11] * dz;
		d2x = -d2x; d2y = -d2y; d2z = -d2z;
		dir[0] = d2x; dir[1] = d2y; dir[2] = d2z;
		const w2 = this.w2, ss = this.simplexSize;
		this.c2!.computeLocalSupportingVertex(this.dir, w2[ss]);
		if (addMargin) {
			let invLen = Math.sqrt(dir[0] * dir[0] + dir[1] * dir[1] + dir[2] * dir[2]);
			if (invLen > 0) invLen = 1 / invLen;
			dir[0] *= invLen; dir[1] *= invLen; dir[2] *= invLen;
			const _this1 = w2[ss].elements;
			const s = this.c2!.gjkMargin;
			_this1[0] += dir[0] * s; _this1[1] += dir[1] * s; _this1[2] += dir[2] * s;
		}
		const v2 = w2[ss].elements;
		const tmpX = v2[0], tmpY = v2[1], tmpZ = v2[2];
		let iw2X = tf2[3] * tmpX + tf2[4] * tmpY + tf2[5] * tmpZ;
		let iw2Y = tf2[6] * tmpX + tf2[7] * tmpY + tf2[8] * tmpZ;
		let iw2Z = tf2[9] * tmpX + tf2[10] * tmpY + tf2[11] * tmpZ;
		iw2X += tf2[0]; iw2Y += tf2[1]; iw2Z += tf2[2];
		const v3 = w2[ss].elements;
		v3[0] = iw2X; v3[1] = iw2Y; v3[2] = iw2Z;
		dir[0] = dx; dir[1] = dy; dir[2] = dz;
	}
	private _pointToTetrahedron(): void {
		let _g = 0;
		while (_g < 3) {
			const dir = this.dir.elements, v = this.baseDirs[_g++].elements;
			dir[0] = v[0]; dir[1] = v[1]; dir[2] = v[2];
			this._computeWitnessPoint1(false);
			this._computeWitnessPoint2(false);
			const se = this.s[this.simplexSize].elements, v1 = this.w1[this.simplexSize].elements, v2 = this.w2[this.simplexSize].elements;
			se[0] = v1[0]; se[1] = v1[1]; se[2] = v1[2];
			se[0] -= v2[0]; se[1] -= v2[1]; se[2] -= v2[2];
			this.simplexSize++;
			this._lineToTetrahedron();
			if (this.simplexSize === 4) {
				break;
			}
			this.simplexSize--;
			dir[0] = -dir[0]; dir[1] = -dir[1]; dir[2] = -dir[2];
			this._computeWitnessPoint1(false);
			this._computeWitnessPoint2(false);
			const sv = this.s[this.simplexSize].elements, v3 = this.w1[this.simplexSize].elements, v4 = this.w2[this.simplexSize].elements;
			sv[0] = v3[0]; sv[1] = v3[1]; sv[2] = v3[2];
			sv[0] -= v4[0]; sv[1] -= v4[1]; sv[2] -= v4[2];
			this.simplexSize++;
			this._lineToTetrahedron();
			if (this.simplexSize === 4) {
				break;
			}
			this.simplexSize--;
		}
	}
	private _lineToTetrahedron(): void {
		const v = this.dir.elements, v1 = this.s[0].elements, v2 = this.s[1].elements;
		const oldDirX = v[0], oldDirY = v[1], oldDirZ = v[2];
		const lineDirX = v1[0] - v2[0], lineDirY = v1[1] - v2[1], lineDirZ = v1[2] - v2[2];
		let _g = 0;
		while (_g < 3) {
			const vb = this.baseDirs[_g++].elements;
			const baseDirX = vb[0], baseDirY = vb[1], baseDirZ = vb[2];
			v[0] = lineDirY * baseDirZ - lineDirZ * baseDirY; v[1] = lineDirZ * baseDirX - lineDirX * baseDirZ; v[2] = lineDirX * baseDirY - lineDirY * baseDirX;
			this._computeWitnessPoint1(false);
			this._computeWitnessPoint2(false);
			const _this = this.s[this.simplexSize].elements, v2 = this.w1[this.simplexSize].elements, v3 = this.w2[this.simplexSize].elements;
			_this[0] = v2[0]; _this[1] = v2[1]; _this[2] = v2[2];
			_this[0] -= v3[0]; _this[1] -= v3[1]; _this[2] -= v3[2];
			this.simplexSize++;
			this._triangleToTetrahedron();
			if (this.simplexSize === 4) {
				break;
			}
			this.simplexSize--;
			v[0] = -v[0]; v[1] = -v[1]; v[2] = -v[2];
			this._computeWitnessPoint1(false);
			this._computeWitnessPoint2(false);
			const _this2 = this.s[this.simplexSize].elements, v4 = this.w1[this.simplexSize].elements, v5 = this.w2[this.simplexSize].elements;
			_this2[0] = v4[0]; _this2[1] = v4[1]; _this2[2] = v4[2];
			_this2[0] -= v5[0]; _this2[1] -= v5[1]; _this2[2] -= v5[2];
			this.simplexSize++;
			this._triangleToTetrahedron();
			if (this.simplexSize === 4) {
				break;
			}
			this.simplexSize--;
		}
		v[0] = oldDirX; v[1] = oldDirY; v[2] = oldDirZ;
	}
	private _triangleToTetrahedron(): void {
		const v = this.dir.elements, vs = this.s[0].elements, v1 = this.s[1].elements, v2 = this.s[2].elements;
		const oldDirX = v[0], oldDirY = v[1], oldDirZ = v[2];
		const s01X = v1[0] - vs[0], s01Y = v1[1] - vs[1], s01Z = v1[2] - vs[2];
		const s02X = v2[0] - vs[0], s02Y = v2[1] - vs[1], s02Z = v2[2] - vs[2];
		v[0] = s01Y * s02Z - s01Z * s02Y; v[1] = s01Z * s02X - s01X * s02Z; v[2] = s01X * s02Y - s01Y * s02X;
		this._computeWitnessPoint1(false);
		this._computeWitnessPoint2(false);
		const _this = this.s[this.simplexSize].elements, v4 = this.w1[this.simplexSize].elements, v5 = this.w2[this.simplexSize].elements;
		_this[0] = v4[0]; _this[1] = v4[1]; _this[2] = v4[2];
		_this[0] -= v5[0]; _this[1] -= v5[1]; _this[2] -= v5[2];
		this.simplexSize++;
		if (!this._isValidTetrahedron()) {
			this.simplexSize--;
			v[0] = -v[0]; v[1] = -v[1]; v[2] = -v[2];
			this._computeWitnessPoint1(false);
			this._computeWitnessPoint2(false);
			const _this2 = this.s[this.simplexSize].elements, v6 = this.w1[this.simplexSize].elements, v7 = this.w2[this.simplexSize].elements;
			_this2[0] = v6[0]; _this2[1] = v6[1]; _this2[2] = v6[2];
			_this2[0] -= v7[0]; _this2[1] -= v7[1]; _this2[2] -= v7[2];
			this.simplexSize++;
			if (!this._isValidTetrahedron()) {
				this.simplexSize--;
			}
		}
		v[0] = oldDirX; v[1] = oldDirY; v[2] = oldDirZ;
	}
	private _isValidTetrahedron(): boolean {
		const s0 = this.s[0].elements, s1 = this.s[1].elements, s2 = this.s[2].elements, s3 = this.s[3].elements;
		const s10 = s1[0] - s0[0], s11 = s1[1] - s0[1], s12 = s1[2] - s0[2];
		const e10 = s2[0] - s0[0], e11 = s2[1] - s0[1], e12 = s2[2] - s0[2];
		const e20 = s3[0] - s0[0], e21 = s3[1] - s0[1], e22 = s3[2] - s0[2];
		const det = s10 * (e11 * e22 - e12 * e21) - s11 * (e10 * e22 - e12 * e20) + s12 * (e10 * e21 - e11 * e20);
		if (!(det > 1e-12)) {
			return det < -1e-12;
		} else {
			return true;
		}
	}
	private _setVertexPool(poly: EpaPolyhedron, initialV0: Vec3, initialV1: Vec3, initialV2: Vec3): EpaVertex {
		let first = poly.vertexPool;
		if (first) {
			poly.vertexPool = first.next;
			first.next = null;
		} else {
			first = new EpaVertex();
		}
		return first.init(initialV0, initialV1, initialV2);
	}

	private _computeDepth(initialPolyhedron: Array<Vec3>, initialPolyhedron1: Array<Vec3>, initialPolyhedron2: Array<Vec3>): GJK_EPA_RESULT_STATE {
		const poly = this.polyhedron;
		while (poly.numTriangles > 0) {
			poly.numTriangles--;
			const t = poly.triangleList!;
			const prev = t.prev, next = t.next;
			if (prev) prev.next = next;
			if (next) next.prev = prev;
			if (t === poly.triangleList) poly.triangleList = poly.triangleList!.next;
			if (t === poly.triangleListLast) poly.triangleListLast = poly.triangleListLast!.prev;
			t.next = t.prev = null;
			t.removeReferences();
			t.next = poly.trianglePool;
			poly.trianglePool = t;
		}
		while (poly.numVertices > 0) {
			const v = poly.vertices[--poly.numVertices];
			v.removeReferences();
			v._next = poly.vertexPool;
			poly.vertexPool = v;
		}
		const tmp1 = this._setVertexPool(poly, initialPolyhedron[0], initialPolyhedron1[0], initialPolyhedron2[0]);
		const tmp2 = this._setVertexPool(poly, initialPolyhedron[1], initialPolyhedron1[1], initialPolyhedron2[1]);
		const tmp3 = this._setVertexPool(poly, initialPolyhedron[2], initialPolyhedron1[2], initialPolyhedron2[2]);
		const tmp4 = this._setVertexPool(poly, initialPolyhedron[3], initialPolyhedron1[3], initialPolyhedron2[3]);
		if (!poly.init(tmp1, tmp2, tmp3, tmp4)) {
			return GJK_EPA_RESULT_STATE.EPA_FAILED_TO_INIT;
		}
		this.simplexSize = 0;
		const supportingVertex = this.s[0];
		const sup = supportingVertex.elements;
		const witness1 = this.w1[0], witness2 = this.w2[0];
		let count = 0;
		while (count < 40) {
			let f = poly.triangleList;
			let mind = 1e65536, mif!: EpaTriangle;
			while (f) {
				if (f.distanceSq < mind) {
					mind = f.distanceSq;
					mif = f;
				}
				f = f.next;
			}
			const d = this.dir.elements, v = mif.normal.elements;
			d[0] = v[0]; d[1] = v[1]; d[2] = v[2];
			let invLen = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
			if (invLen > 0) invLen = 1 / invLen;
			d[0] *= invLen; d[1] *= invLen; d[2] *= invLen;
			this._computeWitnessPoint1(false);
			this._computeWitnessPoint2(false);
			const vs = this.s[this.simplexSize].elements, v1 = this.w1[this.simplexSize].elements, v2 = this.w2[this.simplexSize].elements;
			vs[0] = v1[0]; vs[1] = v1[1]; vs[2] = v1[2];
			vs[0] -= v2[0]; vs[1] -= v2[1]; vs[2] -= v2[2];
			const v0 = mif.vertices[0]!, v11 = mif.vertices[1]!, v21 = mif.vertices[2]!;
			const ve = v0.v.elements;
			if (sup[0] * d[0] + sup[1] * d[1] + sup[2] * d[2] - (ve[0] * d[0] + ve[1] * d[1] + ve[2] * d[2]) < 1e-6 || count === 39) {
				const closest = this.closest.elements;
				closest[0] = d[0]; closest[1] = d[1]; closest[2] = d[2];
				const s = (d[0] * ve[0] + d[1] * ve[1] + d[2] * ve[2]) / (d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
				closest[0] *= s; closest[1] *= s; closest[2] *= s;
				const v4 = v0.w1.elements, v5 = v0.w2.elements;
				const v6 = v11.v.elements, v7 = v11.w1.elements, v8 = v11.w2.elements;
				const v9 = v21.v.elements, v10 = v21.w1.elements, v12 = v21.w2.elements;
				const s01X = v6[0] - ve[0], s01Y = v6[1] - ve[1], s01Z = v6[2] - ve[2];
				const s02X = v9[0] - ve[0], s02Y = v9[1] - ve[1], s02Z = v9[2] - ve[2];
				const s0cX = closest[0] - ve[0], s0cY = closest[1] - ve[1], s0cZ = closest[2] - ve[2];
				const d11 = s01X * s01X + s01Y * s01Y + s01Z * s01Z;
				const d12 = s01X * s02X + s01Y * s02Y + s01Z * s02Z;
				const d22 = s02X * s02X + s02Y * s02Y + s02Z * s02Z;
				const d1c = s01X * s0cX + s01Y * s0cY + s01Z * s0cZ;
				const d2c = s02X * s0cX + s02Y * s0cY + s02Z * s0cZ;
				let invDet = d11 * d22 - d12 * d12;
				if (invDet !== 0) {
					invDet = 1 / invDet;
				}
				const s1 = (d1c * d22 - d2c * d12) * invDet;
				const t = (-d1c * d12 + d2c * d11) * invDet;
				let diffX = v7[0] - v4[0], diffY = v7[1] - v4[1], diffZ = v7[2] - v4[2];
				let cp1X = v4[0] + diffX * s1, cp1Y = v4[1] + diffY * s1, cp1Z = v4[2] + diffZ * s1;
				diffX = v10[0] - v4[0]; diffY = v10[1] - v4[1]; diffZ = v10[2] - v4[2];
				cp1X += diffX * t; cp1Y += diffY * t; cp1Z += diffZ * t;
				diffX = v8[0] - v5[0]; diffY = v8[1] - v5[1]; diffZ = v8[2] - v5[2];
				let cp2X = v5[0] + diffX * s1, cp2Y = v5[1] + diffY * s1, cp2Z = v5[2] + diffZ * s1;
				diffX = v12[0] - v5[0]; diffY = v12[1] - v5[1]; diffZ = v12[2] - v5[2];
				cp2X += diffX * t; cp2Y += diffY * t; cp2Z += diffZ * t;
				const v13 = this.closestPoint1.elements;
				v13[0] = cp1X; v13[1] = cp1Y; v13[2] = cp1Z;
				const v14 = this.closestPoint2.elements;
				v14[0] = cp2X; v14[1] = cp2Y; v14[2] = cp2Z;
				this.depth = Math.sqrt(closest[0] * closest[0] + closest[1] * closest[1] + closest[2] * closest[2]);
				return GJK_EPA_RESULT_STATE.SUCCEEDED;
			}
			const epaVertex = this._setVertexPool(poly, supportingVertex, witness1, witness2);
			if (!poly.addVertex(epaVertex, mif)) {
				return GJK_EPA_RESULT_STATE.EPA_FAILED_TO_ADD_VERTEX;
			}
			++count;
		}
		return GJK_EPA_RESULT_STATE.EPA_DID_NOT_CONVERGE;
	}
	private _setSV(s: Array<Vec3>, w1: Array<Vec3>, w2: Array<Vec3>): void {
		const _this = s[this.simplexSize].elements, v = w1[this.simplexSize].elements, v1 = w2[this.simplexSize].elements;
		Method.copyElements(v, _this, 0, 0, 3);
		Method.subArray(_this, v1, _this, 0, 0, 0, 3);
	}
	private _getMinInfo(sf: Float64Array, ss: Float64Array, tv: Float64Array, closest: Float64Array): number {
		const v12 = Method.subArray(sf, ss, tv, 0, 0, 0, 3);
		let t = Method.multiplyArray(v12, ss, 0, 0, 3);
		t = -t / Method.multiplyArray(v12, v12, 0, 0, 3);
		let b: number;
		if (t < 0) {
			Method.copyElements(ss, closest, 0, 0, 3);
			b = 1;
		} else if (t > 1) {
			Method.copyElements(sf, closest, 0, 0, 3);
			b = 2;
		} else {
			Method.scaleArray(v12, t, v12, 0, 0, 3);
			Method.addArray(ss, v12, closest, 0, 0, 0, 3);
			b = 3;
		}
		return b;
	}
	private _checkMinD(mind: number, mini: number, minv: Float64Array, closest: Float64Array, n: Float64Array, s: Float64Array): number {
		let b: number;
		if (mind > 0) {
			Method.copyElements(minv, closest, 0, 0, 3);
			b = mini;
		} else {
			Method.normalize(n, 0, 3, 1);
			let l2 = Method.multiplyArray(n, n, 0, 0, 3);
			l2 = Method.multiplyArray(s, n, 0, 0, 3) / l2;
			Method.scaleArray(n, l2, minv, 0, 0, 3);
			Method.copyElements(minv, closest, 0, 0, 3);
			b = 7;
		}
		return b;
	}
	private _getMin(sf: Float64Array, ss: Float64Array, st: Float64Array, closest: Float64Array): number {
		const v12 = Method.subArray(sf, ss, this._tv22, 0, 0, 0, 3);
		const v23 = Method.subArray(st, sf, this._tv23, 0, 0, 0, 3);
		const v31 = Method.subArray(ss, st, this._tv24, 0, 0, 0, 3);
		const n = Method.crossVectors(v12[0], v12[1], v12[2], v23[0], v23[1], v23[2], this._tv25, 0);
		const n12 = Method.crossVectors(v12[0], v12[1], v12[2], n[0], n[1], n[2], this._tv26, 0);
		const n23 = Method.crossVectors(v23[0], v23[1], v23[2], n[0], n[1], n[2], this._tv27, 0);
		const n31 = Method.crossVectors(v31[0], v31[1], v31[2], n[0], n[1], n[2], this._tv28, 0);
		let mind = -1, mini = 0;
		const minv = this._tv22;
		if (Method.multiplyArray(ss, n12, 0, 0, 3) < 0) {
			mini = this._getMinInfo(sf, ss, this._tv23, closest);
			mind = Method.multiplyArray(closest, closest, 0, 0, 3);
			Method.copyElements(closest, minv, 0, 0, 3);
		}
		if (Method.multiplyArray(sf, n23, 0, 0, 3) < 0) {
			const b = this._getMinInfo(st, sf, this._tv23, closest);
			const d = Method.multiplyArray(closest, closest, 0, 0, 3);
			if (mind < 0 || d < mind) {
				mini = b << 1;
				mind = d;
				Method.copyElements(closest, minv, 0, 0, 3);
			}
		}
		if (Method.multiplyArray(st, n31, 0, 0, 3) < 0) {
			const b = this._getMinInfo(st, ss, this._tv23, closest);
			const d = Method.multiplyArray(closest, closest, 0, 0, 3);
			if (mind < 0 || d < mind) {
				mini = b & 1 | (b & 2) << 1;
				mind = d;
				Method.copyElements(closest, minv, 0, 0, 3);
			}
		}
		return this._checkMinD(mind, mini, minv, closest, n, ss);
	}

}

const INSTANCE = new GjkEpa();