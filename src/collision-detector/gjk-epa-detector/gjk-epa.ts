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

/**
 * GJK/EPA算法核心实现类（单例模式）。
 * 集成GJK（Gilbert-Johnson-Keerthi）和EPA（Expanding Polytope Algorithm）算法的核心实现，
 * 提供凸几何体的碰撞检测、距离计算、连续碰撞检测（ConvexCast）、射线检测（RayCast）能力；
 * 核心原理：
 * 1. GJK算法：通过构建Minkowski差空间的单纯形（Simplex），迭代逼近原点，判断凸几何体是否碰撞；
 * 2. EPA算法：在GJK基础上扩展多面体，计算精确的碰撞法线、穿透深度和接触点；
 * 适用场景：所有凸几何体（凸多面体、球体、胶囊体等）的碰撞检测与距离计算。
 */
export default class GjkEpa {
	/** 两个凸几何体之间的最短距离（正数=分离，负数=穿透） */
	public distance = 0;
	/** 当前单纯形（Simplex）的顶点数量（1=点，2=线，3=三角形，4=四面体） */
	public simplexSize!: number;
	/** GJK单纯形顶点数组（Minkowski差空间中的顶点，最多4个） */
	public s = [new Vec3(), new Vec3(), new Vec3(), new Vec3()];
	/** 第一个几何体在世界空间中的支撑点数组（对应s的每个顶点） */
	public w1 = [new Vec3(), new Vec3(), new Vec3(), new Vec3()];
	/** 第二个几何体在世界空间中的支撑点数组（对应s的每个顶点） */
	public w2 = [new Vec3(), new Vec3(), new Vec3(), new Vec3()];
	/** 基础方向向量（X/Y/Z轴，用于初始化单纯形搜索方向） */
	public baseDirs = [new Vec3(1, 0, 0), new Vec3(0, 1, 0), new Vec3(0, 0, 1)];
	/** 临时向量1（用于ConvexCast/RayCast的变换计算） */
	public tl1 = new Vec3();
	/** 临时向量2（用于ConvexCast/RayCast的变换计算） */
	public tl2 = new Vec3();
	/** 射线X向量（ConvexCast内部计算） */
	public rayX = new Vec3();
	/** 射线R向量（ConvexCast内部计算） */
	public rayR = new Vec3();
	/** 临时变换对象（RayCast内部构建临时几何体变换） */
	public tempTransform = new Transform();
	/** 当前搜索方向向量（GJK迭代的核心方向） */
	public dir = new Vec3();
	/** 单纯形到原点的最近点（GJK迭代目标） */
	public closest = new Vec3();
	/** 第一个几何体的最近点（世界空间） */
	public closestPoint1 = new Vec3();
	/** 第二个几何体的最近点（世界空间） */
	public closestPoint2 = new Vec3();
	/** EPA算法的多面体对象（用于扩展计算精确碰撞信息） */
	public polyhedron = new EpaPolyhedron();
	/** 第一个凸几何体（碰撞检测目标1） */
	public c1: Nullable<ConvexGeometry>;
	/** 第二个凸几何体（碰撞检测目标2） */
	public c2: Nullable<ConvexGeometry>;
	/** 第一个几何体的变换（位置/旋转/缩放） */
	public tf1!: Transform;
	/** 第二个几何体的变换（位置/旋转/缩放） */
	public tf2!: Transform;
	/** 碰撞穿透深度（EPA算法计算结果） */
	public depth !: number;

	// ---------------- 私有临时变量（避免频繁创建对象，优化性能） ----------------
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

	/**
	 * 获取GjkEpa单例实例（全局唯一，避免重复创建）。
	 * @returns {GjkEpa} 单例实例
	 */
	public static get instance(): GjkEpa {
		return INSTANCE;
	}

	/**
	 * GJK/EPA核心实现：计算两个凸几何体的最近点（内部接口）。
	 * 核心逻辑：
	 * 1. 初始化算法参数，加载缓存（若启用）；
	 * 2. 初始化单纯形，迭代构建/收缩单纯形逼近原点；
	 * 3. 单纯形包含原点时，启用EPA计算精确碰撞信息；
	 * 4. 迭代收敛后，插值计算最近点，保存缓存（若启用）；
	 * 5. 返回算法执行状态。
	 * @param {ConvexGeometry} c1 - 第一个凸几何体
	 * @param {ConvexGeometry} c2 - 第二个凸几何体
	 * @param {Transform} _tf1 - 第一个几何体的变换
	 * @param {Transform} _tf2 - 第二个几何体的变换
	 * @param {Nullable<CachedDetectorData>} cache - 检测器缓存（启用GJK缓存优化）
	 * @param {boolean} useEpa - 是否启用EPA算法（true=计算精确碰撞，false=仅GJK距离）
	 * @returns {number} 算法状态码（0=成功，1=EPA初始化失败，2=迭代未收敛）
	 */
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

	/**
	 * 计算两个凸几何体的最近点（启用EPA，返回精确碰撞信息）。
	 * @param {ConvexGeometry} c1 - 第一个凸几何体
	 * @param {ConvexGeometry} c2 - 第二个凸几何体
	 * @param {Transform} tf1 - 第一个几何体的变换
	 * @param {Transform} tf2 - 第二个几何体的变换
	 * @param {CachedDetectorData} cache - 检测器缓存
	 * @returns {number} 算法状态码（0=成功，其他=失败）
	 */
	public computeClosestPoints(c1: ConvexGeometry, c2: ConvexGeometry, tf1: Transform, tf2: Transform, cache: CachedDetectorData): number {
		return this.computeClosestPointsImpl(c1, c2, tf1, tf2, cache, true);
	}

	/**
	 * 计算两个凸几何体的最短距离（仅GJK，不启用EPA）。
	 * @param {ConvexGeometry} c1 - 第一个凸几何体
	 * @param {ConvexGeometry} c2 - 第二个凸几何体
	 * @param {Transform} tf1 - 第一个几何体的变换
	 * @param {Transform} tf2 - 第二个几何体的变换
	 * @param {CachedDetectorData} cache - 检测器缓存
	 * @returns {number} 算法状态码（0=成功，其他=失败）
	 */
	public computeDistance(c1: ConvexGeometry, c2: ConvexGeometry, tf1: Transform, tf2: Transform, cache: CachedDetectorData): number {
		return this.computeClosestPointsImpl(c1, c2, tf1, tf2, cache, false);
	}

	/**
	 * 凸几何体连续碰撞检测（ConvexCast）。
	 * @param {ConvexGeometry} c1 - 第一个凸几何体
	 * @param {ConvexGeometry} c2 - 第二个凸几何体
	 * @param {Transform} tf1 - 第一个几何体的初始变换
	 * @param {Transform} tf2 - 第二个几何体的初始变换
	 * @param {Vec3} tl1 - 第一个几何体的运动向量
	 * @param {Vec3} tl2 - 第二个几何体的运动向量
	 * @param {RayCastHit} hit - 碰撞结果（输出参数）
	 * @returns {boolean} 是否检测到碰撞
	 */
	public convexCast(c1: ConvexGeometry, c2: ConvexGeometry, tf1: Transform, tf2: Transform, tl1: Vec3, tl2: Vec3, hit: RayCastHit): boolean {
		return this._convexCastImpl(c1, c2, tf1, tf2, tl1, tl2, hit);
	}

	/**
	 * 射线与凸几何体碰撞检测（RayCast）。
	 * 核心逻辑：将射线检测转换为ConvexCast，
	 * 把射线起点作为移动的点几何体，与目标凸几何体进行连续碰撞检测。
	 * @param {ConvexGeometry} c - 凸几何体
	 * @param {Transform} tf - 几何体的变换
	 * @param {Vec3} _begin - 射线起点
	 * @param {Vec3} _end - 射线终点
	 * @param {RayCastHit} hit - 碰撞结果（输出参数）
	 * @returns {boolean} 是否检测到碰撞
	 */
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

	/**
	 * 计算单纯形到原点的最近点，并返回顶点掩码（GJK核心步骤）。
	 * 根据单纯形大小（1/2/3/4），分别计算最近点：
	 * 1. 点（size=1）：最近点就是点本身；
	 * 2. 线（size=2）：计算点到线段的最近点；
	 * 3. 三角形（size=3）：计算点到三角形的最近点；
	 * 4. 四面体（size=4）：计算点到四面体的最近点；
	 * 返回的顶点掩码用于后续收缩单纯形。
	 * @param {Array<Vec3>} s - 单纯形顶点数组
	 * @param {Float64Array} closest - 输出：单纯形到原点的最近点
	 * @returns {number} 顶点掩码（标记需要保留的单纯形顶点）
	 */
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

	/**
	 * 连续碰撞检测核心实现（ConvexCast）。
	 * 基于GJK算法扩展，迭代计算运动过程中的单纯形，
	 * 检测几何体在运动路径上是否碰撞，并返回碰撞点、法线、时间比例。
	 * @param {Nullable<ConvexGeometry>} c1 - 第一个凸几何体（可为null，代表点）
	 * @param {ConvexGeometry} c2 - 第二个凸几何体
	 * @param {Transform} _tf1 - 第一个几何体的初始变换
	 * @param {Transform} _tf2 - 第二个几何体的初始变换
	 * @param {Vec3} _tl1 - 第一个几何体的运动向量
	 * @param {Vec3} _tl2 - 第二个几何体的运动向量
	 * @param {RayCastHit} hit - 碰撞结果（输出参数）
	 * @returns {boolean} 是否检测到碰撞
	 */
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

	/**
	 * 插值计算两个几何体的最近点（世界空间）。
	 * 根据单纯形大小（1/2/3），分别插值计算：
	 * 1. 点（size=1）：直接取支撑点；
	 * 2. 线（size=2）：线性插值线段上的最近点；
	 * 3. 三角形（size=3）：双线性插值三角形内的最近点；
	 * 结果写入closestPoint1/closestPoint2。
	 * @returns {void}
	 */
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

	/**
	 * 加载GJK缓存（上一次的搜索方向）。
	 * 将缓存的prevClosestDir赋值给当前dir，作为初始搜索方向，加速迭代收敛。
	 * @param {GjkCache} gjkCache - GJK缓存对象
	 * @returns {void}
	 */
	private _loadCache(gjkCache: GjkCache): void {
		const dir = this.dir.elements, v = gjkCache.prevClosestDir.elements;
		dir[0] = v[0]; dir[1] = v[1]; dir[2] = v[2];
	}

	/**
	 * 保存GJK缓存（当前的最近方向）。
	 * 将当前closest取反后赋值给缓存的prevClosestDir，供下一次迭代使用。
	 * @param {GjkCache} gjkCache - GJK缓存对象
	 * @returns {void}
	 */
	private _saveCache(gjkCache: GjkCache): void {
		const dir = gjkCache.prevClosestDir.elements, v = this.closest.elements;
		dir[0] = -v[0]; dir[1] = -v[1]; dir[2] = -v[2];
	}

	/**
	 * 收缩单纯形（GJK核心步骤）。
	 * 根据顶点掩码，移除单纯形中不需要的顶点，
	 * 保留能逼近原点的最小单纯形，减少后续计算量。
	 * @param {number} vertexBits - 顶点掩码（标记需要保留的顶点）
	 * @returns {void}
	 */
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

	/**
* 计算第一个几何体的支撑点（GJK/EPA核心）。
* 核心逻辑：
* 1. 将搜索方向转换到几何体局部空间；
* 2. 调用几何体的computeLocalSupportingVertex获取局部支撑点；
* 3. （可选）添加Margin，避免边缘检测误差；
* 4. 将局部支撑点转换回世界空间，存入w1数组。
* @param {boolean} addMargin - 是否添加GJK Margin（边缘容差）
* @returns {void}
*/
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

	/**
	 * 计算第二个几何体的支撑点（GJK/EPA核心）。
	 * 逻辑与_computeWitnessPoint1一致，但搜索方向取反（Minkowski差空间特性）。
	 * @param {boolean} addMargin - 是否添加GJK Margin（边缘容差）
	 * @returns {void}
	 */
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

	/**
	 * 将点单纯形扩展为四面体（EPA初始化）。
	 * 沿X/Y/Z轴正负方向添加支撑点，将点扩展为线，再调用_lineToTetrahedron扩展为四面体。
	 * @returns {void}
	 */
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

	/**
	 * 将线单纯形扩展为四面体（EPA初始化）。
	 * 计算线段的垂直方向，添加支撑点将线扩展为三角形，再调用_triangleToTetrahedron扩展为四面体。
	 * @returns {void}
	 */
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

	/**
	 * 将三角形单纯形扩展为四面体（EPA初始化）。
	 * 计算三角形的法向量方向，添加支撑点扩展为四面体，
	 * 并调用_isValidTetrahedron验证四面体的有效性。
	 * @returns {void}
	 */
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

	/**
	 * 验证四面体的有效性（体积非零）。
	 * 计算四面体的体积（行列式），若行列式绝对值大于阈值，说明四面体有效（非退化）。
	 * @returns {boolean} 是否为有效四面体
	 */
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

	/**
	 * 从顶点池获取/创建EPA顶点（内存复用）。
	 * 优先从顶点池获取复用顶点，池为空时创建新顶点，优化内存分配性能。
	 * @param {EpaPolyhedron} poly - EPA多面体
	 * @param {Vec3} initialV0 - Minkowski差空间顶点
	 * @param {Vec3} initialV1 - 第一个几何体的支撑点
	 * @param {Vec3} initialV2 - 第二个几何体的支撑点
	 * @returns {EpaVertex} EPA顶点实例
	 */
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

	/**
	* 计算两个凸多面体之间的穿透深度（核心EPA算法实现）。
	* 核心流程：
	* 1. 清理并重置多面体缓存（三角形池、顶点池）
	* 2. 初始化多面体初始顶点
	* 3. 迭代扩展多面体，寻找最近的面
	* 4. 计算搜索方向，获取新的支持点
	* 5. 检查收敛条件，计算最终的穿透深度和最近点
	* @param initialPolyhedron - 初始多面体顶点数组（差值顶点，即形状A - 形状B）
	* @param initialPolyhedron1 - 第一个凸多面体的顶点数组
	* @param initialPolyhedron2 - 第二个凸多面体的顶点数组
	* @returns GJK_EPA_RESULT_STATE - EPA算法执行结果状态
	*/
	private _computeDepth(
		initialPolyhedron: Array<Vec3>,
		initialPolyhedron1: Array<Vec3>,
		initialPolyhedron2: Array<Vec3>
	): GJK_EPA_RESULT_STATE {
		// 重置多面体：清空所有三角形
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

		// 重置多面体：清空所有顶点
		while (poly.numVertices > 0) {
			const v = poly.vertices[--poly.numVertices];
			v.removeReferences();
			v._next = poly.vertexPool;
			poly.vertexPool = v;
		}

		// 初始化多面体的初始四个顶点（四面体）
		const tmp1 = this._setVertexPool(poly, initialPolyhedron[0], initialPolyhedron1[0], initialPolyhedron2[0]);
		const tmp2 = this._setVertexPool(poly, initialPolyhedron[1], initialPolyhedron1[1], initialPolyhedron2[1]);
		const tmp3 = this._setVertexPool(poly, initialPolyhedron[2], initialPolyhedron1[2], initialPolyhedron2[2]);
		const tmp4 = this._setVertexPool(poly, initialPolyhedron[3], initialPolyhedron1[3], initialPolyhedron2[3]);

		// 初始化多面体失败则返回错误状态
		if (!poly.init(tmp1, tmp2, tmp3, tmp4)) {
			return GJK_EPA_RESULT_STATE.EPA_FAILED_TO_INIT;
		}

		// 重置单纯形大小和支持向量
		this.simplexSize = 0;
		const supportingVertex = this.s[0];
		const sup = supportingVertex.elements;
		const witness1 = this.w1[0], witness2 = this.w2[0];
		let count = 0;

		// EPA迭代主循环（最多40次迭代保证收敛）
		while (count < 40) {
			// 找到多面体中距离原点最近的三角形
			let f = poly.triangleList;
			let mind = 1e65536, mif!: EpaTriangle;
			while (f) {
				if (f.distanceSq < mind) {
					mind = f.distanceSq;
					mif = f;
				}
				f = f.next;
			}

			// 计算该三角形法向量作为新的搜索方向（单位化）
			const d = this.dir.elements, v = mif.normal.elements;
			d[0] = v[0]; d[1] = v[1]; d[2] = v[2];
			let invLen = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
			if (invLen > 0) invLen = 1 / invLen;
			d[0] *= invLen; d[1] *= invLen; d[2] *= invLen;

			// 计算两个物体的见证点
			this._computeWitnessPoint1(false);
			this._computeWitnessPoint2(false);

			// 更新支持向量（差值向量 = 物体1见证点 - 物体2见证点）
			const vs = this.s[this.simplexSize].elements, v1 = this.w1[this.simplexSize].elements, v2 = this.w2[this.simplexSize].elements;
			vs[0] = v1[0]; vs[1] = v1[1]; vs[2] = v1[2];
			vs[0] -= v2[0]; vs[1] -= v2[1]; vs[2] -= v2[2];

			// 获取最近三角形的三个顶点
			const v0 = mif.vertices[0]!, v11 = mif.vertices[1]!, v21 = mif.vertices[2]!;
			const ve = v0.v.elements;

			// 收敛条件检查：新支持点与当前顶点投影差小于阈值 或 达到最大迭代次数
			if (sup[0] * d[0] + sup[1] * d[1] + sup[2] * d[2] - (ve[0] * d[0] + ve[1] * d[1] + ve[2] * d[2]) < 1e-6 || count === 39) {
				// 计算原点到三角形的最近点（穿透向量）
				const closest = this.closest.elements;
				closest[0] = d[0]; closest[1] = d[1]; closest[2] = d[2];
				const s = (d[0] * ve[0] + d[1] * ve[1] + d[2] * ve[2]) / (d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
				closest[0] *= s; closest[1] *= s; closest[2] *= s;

				// 计算两个物体上的精确最近点（使用重心坐标插值）
				const v4 = v0.w1.elements, v5 = v0.w2.elements;
				const v6 = v11.v.elements, v7 = v11.w1.elements, v8 = v11.w2.elements;
				const v9 = v21.v.elements, v10 = v21.w1.elements, v12 = v21.w2.elements;

				// 计算重心坐标
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

				// 计算插值系数
				const s1 = (d1c * d22 - d2c * d12) * invDet;
				const t = (-d1c * d12 + d2c * d11) * invDet;

				// 插值计算第一个物体的最近点
				let diffX = v7[0] - v4[0], diffY = v7[1] - v4[1], diffZ = v7[2] - v4[2];
				let cp1X = v4[0] + diffX * s1, cp1Y = v4[1] + diffY * s1, cp1Z = v4[2] + diffZ * s1;
				diffX = v10[0] - v4[0]; diffY = v10[1] - v4[1]; diffZ = v10[2] - v4[2];
				cp1X += diffX * t; cp1Y += diffY * t; cp1Z += diffZ * t;

				// 插值计算第二个物体的最近点
				diffX = v8[0] - v5[0]; diffY = v8[1] - v5[1]; diffZ = v8[2] - v5[2];
				let cp2X = v5[0] + diffX * s1, cp2Y = v5[1] + diffY * s1, cp2Z = v5[2] + diffZ * s1;
				diffX = v12[0] - v5[0]; diffY = v12[1] - v5[1]; diffZ = v12[2] - v5[2];
				cp2X += diffX * t; cp2Y += diffY * t; cp2Z += diffZ * t;

				// 保存最近点结果
				const v13 = this.closestPoint1.elements;
				v13[0] = cp1X; v13[1] = cp1Y; v13[2] = cp1Z;
				const v14 = this.closestPoint2.elements;
				v14[0] = cp2X; v14[1] = cp2Y; v14[2] = cp2Z;

				// 计算最终的穿透深度（最近点向量的长度）
				this.depth = Math.sqrt(closest[0] * closest[0] + closest[1] * closest[1] + closest[2] * closest[2]);

				// 返回成功状态
				return GJK_EPA_RESULT_STATE.SUCCEEDED;
			}

			// 添加新的支持顶点到多面体
			const epaVertex = this._setVertexPool(poly, supportingVertex, witness1, witness2);
			if (!poly.addVertex(epaVertex, mif)) {
				return GJK_EPA_RESULT_STATE.EPA_FAILED_TO_ADD_VERTEX;
			}

			// 迭代计数+1
			++count;
		}

		// 迭代次数耗尽仍未收敛
		return GJK_EPA_RESULT_STATE.EPA_DID_NOT_CONVERGE;
	}

	/**
	 * 设置支持向量（差值向量）。
	 * 核心逻辑：
	 * 1. 将w1的当前见证点复制到s的当前位置
	 * 2. 计算差值：s = w1 - w2（即物体1顶点 - 物体2顶点）
	 * @param s - 支持向量数组（存储差值向量）
	 * @param w1 - 第一个物体的见证点数组
	 * @param w2 - 第二个物体的见证点数组
	 */
	private _setSV(s: Array<Vec3>, w1: Array<Vec3>, w2: Array<Vec3>): void {
		const _this = s[this.simplexSize].elements,
			v = w1[this.simplexSize].elements,
			v1 = w2[this.simplexSize].elements;

		// 复制w1的见证点到支持向量
		Method.copyElements(v, _this, 0, 0, 3);
		// 计算差值：s = w1 - w2
		Method.subArray(_this, v1, _this, 0, 0, 0, 3);
	}

	/**
	 * 计算线段上到原点最近的点。
	 * 核心算法：
	 * 1. 计算线段方向向量 v12 = sf - ss
	 * 2. 计算投影参数 t = -(ss · v12) / (v12 · v12)
	 * 3. 根据t的范围判断最近点位置并计算坐标
	 * @param sf - 线段终点
	 * @param ss - 线段起点
	 * @param tv - 临时向量缓存
	 * @param closest - 输出参数：存储最近点坐标
	 * @returns number - 最近点位置标记：
	 *          1 = 最近点是起点ss
	 *          2 = 最近点是终点sf
	 *          3 = 最近点在线段内部
	 */
	private _getMinInfo(sf: Float64Array, ss: Float64Array, tv: Float64Array, closest: Float64Array): number {
		// 计算线段方向向量：v12 = sf - ss
		const v12 = Method.subArray(sf, ss, tv, 0, 0, 0, 3);
		// 计算投影参数t
		let t = Method.multiplyArray(v12, ss, 0, 0, 3);
		t = -t / Method.multiplyArray(v12, v12, 0, 0, 3);

		let b: number;
		// t < 0：最近点是起点ss
		if (t < 0) {
			Method.copyElements(ss, closest, 0, 0, 3);
			b = 1;
		}
		// t > 1：最近点是终点sf
		else if (t > 1) {
			Method.copyElements(sf, closest, 0, 0, 3);
			b = 2;
		}
		// 0 ≤ t ≤ 1：最近点在线段内部
		else {
			Method.scaleArray(v12, t, v12, 0, 0, 3);
			Method.addArray(ss, v12, closest, 0, 0, 0, 3);
			b = 3;
		}
		return b;
	}

	/**
	 * 检查并确定最小距离点。
	 * 逻辑说明：
	 * 1. 如果找到有效最小距离（mind > 0），直接使用该点
	 * 2. 如果未找到有效点，计算原点到三角形所在平面的投影点
	 * @param mind - 当前最小距离平方值（负数表示未找到有效点）
	 * @param mini - 最小点位置标记
	 * @param minv - 最小点坐标缓存
	 * @param closest - 输出参数：最终最近点坐标
	 * @param n - 三角形法向量
	 * @param s - 参考点向量
	 * @returns number - 最终的最近点位置标记
	 */
	private _checkMinD(mind: number, mini: number, minv: Float64Array, closest: Float64Array, n: Float64Array, s: Float64Array): number {
		let b: number;
		// 找到有效最小距离点
		if (mind > 0) {
			Method.copyElements(minv, closest, 0, 0, 3);
			b = mini;
		}
		// 未找到有效点，计算平面投影点
		else {
			// 单位化法向量
			Method.normalize(n, 0, 3, 1);
			// 计算投影参数
			let l2 = Method.multiplyArray(n, n, 0, 0, 3);
			l2 = Method.multiplyArray(s, n, 0, 0, 3) / l2;
			// 计算投影点
			Method.scaleArray(n, l2, minv, 0, 0, 3);
			Method.copyElements(minv, closest, 0, 0, 3);
			b = 7;
		}
		return b;
	}

	/**
	 * 计算三角形上到原点最近的点。
	 * 核心算法（重心坐标法）：
	 * 1. 计算三角形边向量和法向量
	 * 2. 检查原点是否在三角形边的外侧，若是则计算边上最近点
	 * 3. 比较所有候选最近点，选择距离最小的点
	 * 4. 最终确定最近点并返回位置标记
	 * @param sf - 三角形顶点1
	 * @param ss - 三角形顶点2
	 * @param st - 三角形顶点3
	 * @param closest - 输出参数：存储最近点坐标
	 * @returns number - 最近点位置标记
	 */
	private _getMin(sf: Float64Array, ss: Float64Array, st: Float64Array, closest: Float64Array): number {
		// 计算三角形边向量
		const v12 = Method.subArray(sf, ss, this._tv22, 0, 0, 0, 3);
		const v23 = Method.subArray(st, sf, this._tv23, 0, 0, 0, 3);
		const v31 = Method.subArray(ss, st, this._tv24, 0, 0, 0, 3);

		// 计算三角形法向量
		const n = Method.crossVectors(v12[0], v12[1], v12[2], v23[0], v23[1], v23[2], this._tv25, 0);

		// 计算各边的法向量（用于判断原点位置）
		const n12 = Method.crossVectors(v12[0], v12[1], v12[2], n[0], n[1], n[2], this._tv26, 0);
		const n23 = Method.crossVectors(v23[0], v23[1], v23[2], n[0], n[1], n[2], this._tv27, 0);
		const n31 = Method.crossVectors(v31[0], v31[1], v31[2], n[0], n[1], n[2], this._tv28, 0);

		// 初始化最小距离和位置标记
		let mind = -1, mini = 0;
		const minv = this._tv22;

		// 检查顶点ss所在边的外侧
		if (Method.multiplyArray(ss, n12, 0, 0, 3) < 0) {
			mini = this._getMinInfo(sf, ss, this._tv23, closest);
			mind = Method.multiplyArray(closest, closest, 0, 0, 3);
			Method.copyElements(closest, minv, 0, 0, 3);
		}

		// 检查顶点sf所在边的外侧
		if (Method.multiplyArray(sf, n23, 0, 0, 3) < 0) {
			const b = this._getMinInfo(st, sf, this._tv23, closest);
			const d = Method.multiplyArray(closest, closest, 0, 0, 3);
			if (mind < 0 || d < mind) {
				mini = b << 1;
				mind = d;
				Method.copyElements(closest, minv, 0, 0, 3);
			}
		}

		// 检查顶点st所在边的外侧
		if (Method.multiplyArray(st, n31, 0, 0, 3) < 0) {
			const b = this._getMinInfo(st, ss, this._tv23, closest);
			const d = Method.multiplyArray(closest, closest, 0, 0, 3);
			if (mind < 0 || d < mind) {
				mini = b & 1 | (b & 2) << 1;
				mind = d;
				Method.copyElements(closest, minv, 0, 0, 3);
			}
		}

		// 最终确定最近点
		return this._checkMinD(mind, mini, minv, closest, n, ss);
	}
}

// 创建GJK/EPA算法单例实例
const INSTANCE = new GjkEpa();

export { GjkEpa };