import ConvexGeometry from "./convex-geometry";
import Vec3 from "../common/vec3";
import { GEOMETRY_TYPE } from "../constant";
import Aabb from "../common/aabb";
import Transform from "../common/transform";
import RayCastHit from "./ray-cast-hit";
import Method from "../common/method";

/**
 * 立方体凸几何体类。
 * 实现基于轴向立方体的凸几何体，是物理引擎中最常用的基础碰撞体之一。
 * 支持自定义尺寸、物理属性自动计算、世界坐标系AABB生成、GJK碰撞检测支撑顶点计算
 * 以及高精度的射线-立方体相交检测，内部采用紧凑的 Float64Array 存储数据以优化性能。
 */
export default class BoxGeometry extends ConvexGeometry {
	/**
	 * 立方体尺寸与轴向量数据（紧凑存储的 Float64Array）。
	 * 数组内存布局（共12个元素）：
	 * | 索引 | 含义                | 说明                     |
	 * |------|---------------------|--------------------------|
	 * | 0    | _halfExtentsX       | X轴半宽度                |
	 * | 1    | _halfExtentsY       | Y轴半高度                |
	 * | 2    | _halfExtentsZ       | Z轴半深度                |
	 * | 3-5  | _halfAxisXX/XY/XZ   | X轴半长轴向量（X/Y/Z分量）|
	 * | 6-8  | _halfAxisYX/YY/YZ   | Y轴半长轴向量（X/Y/Z分量）|
	 * | 9-11 | _halfAxisZX/ZY/ZZ   | Z轴半长轴向量（X/Y/Z分量）|
	 */
	public size: Float64Array;

	/**
	 * 构造函数：创建立方体几何体实例。
	 * 初始化立方体半尺寸和轴向量，自动计算物理质量属性，并限制GJK容差不超过
	 * 最小半尺寸的20%，避免碰撞检测时因容差过大导致的精度问题。
	 * @param {number} [width=1] - 立方体宽度（X轴完整尺寸，默认1）
	 * @param {number} [height=1] - 立方体高度（Y轴完整尺寸，默认1）
	 * @param {number} [depth=1] - 立方体深度（Z轴完整尺寸，默认1）
	 */
	constructor(width = 1, height = 1, depth = 1) {
		super(GEOMETRY_TYPE.BOX);
		let w = width * 0.5;
		let h = height * 0.5;
		let d = depth * 0.5;
		this.size = new Float64Array([w, h, d, w, 0, 0, 0, h, 0, 0, 0, d]);
		this.updateMass();
		let minHalfExtents = w < h ? d < w ? d : w : d < h ? d : h;
		if (this.gjkMargin > minHalfExtents * 0.2) {
			this.gjkMargin = minHalfExtents * 0.2;
		}
	}

	/**
	 * 获取立方体X轴半宽度
	 * @returns {number} X轴半宽度值（size[0]）
	 */
	public get halfWidth(): number {
		return this.size[0];
	}

	/**
	 * 获取立方体Y轴半高度
	 * @returns {number} Y轴半高度值（size[1]）
	 */
	public get halfHeight(): number {
		return this.size[1];
	}

	/**
	 * 获取立方体Z轴半深度
	 * @returns {number} Z轴半深度值（size[2]）
	 */
	public get halfDepth(): number {
		return this.size[2];
	}

	/**
	 * 将立方体半尺寸写入目标对象。
	 * 复用传入的对象存储半尺寸数据，避免创建新对象以提升性能。
	 * @param {Object} halfExtents - 输出对象（需包含x/y/z属性）
	 * @param {number} halfExtents.x - X轴半尺寸输出字段
	 * @param {number} halfExtents.y - Y轴半尺寸输出字段
	 * @param {number} halfExtents.z - Z轴半尺寸输出字段
	 * @returns {Object} 填充了半尺寸数据的目标对象
	 */
	public getHalfExtentsTo(halfExtents: { x: number, y: number, z: number }): { x: number, y: number, z: number } {
		const es = this.size;
		Method.setXYZ(halfExtents, es[0], es[1], es[2]);
		return halfExtents;
	}

	/**
	 * 更新立方体的物理质量属性。
	 * 计算立方体的体积和转动惯量系数：
	 * 1. 体积 = 8 × 半宽 × 半高 × 半深（完整立方体体积）
	 * 2. 转动惯量系数：基于均匀密度立方体公式 I = (1/3)×(r₁² + r₂²)，
	 *    此处 0.33333333333333331 为 1/3 的高精度浮点表示。
	 * @returns {void}
	 */
	public updateMass(): void {
		const es = this.size;
		this.volume = 8 * (es[0] * es[1] * es[2]);
		const sqX = es[0] * es[0];
		const sqY = es[1] * es[1];
		const sqZ = es[2] * es[2];
		const ic = this.inertiaCoeff;
		ic[0] = 0.33333333333333331 * (sqY + sqZ);
		ic[1] = 0;
		ic[2] = 0;
		ic[3] = 0;
		ic[4] = 0.33333333333333331 * (sqZ + sqX);
		ic[5] = 0;
		ic[6] = 0;
		ic[7] = 0;
		ic[8] = 0.33333333333333331 * (sqX + sqY);
	}

	public computeAabb(_aabb: Aabb, _tf: Transform): void {
		const tf = _tf.elements, aabb = _aabb.elements, es = this.size;
		const xx = tf[3] * es[3] + tf[4] * es[4] + tf[5] * es[5];
		const xy = tf[6] * es[3] + tf[7] * es[4] + tf[8] * es[5];
		const xz = tf[9] * es[3] + tf[10] * es[4] + tf[11] * es[5];
		const yx = tf[3] * es[6] + tf[4] * es[7] + tf[5] * es[8];
		const yy = tf[6] * es[6] + tf[7] * es[7] + tf[8] * es[8];
		const yz = tf[9] * es[6] + tf[10] * es[7] + tf[11] * es[8];
		const zx = tf[3] * es[9] + tf[4] * es[10] + tf[5] * es[11];
		const zy = tf[6] * es[9] + tf[7] * es[10] + tf[8] * es[11];
		const zz = tf[9] * es[9] + tf[10] * es[10] + tf[11] * es[11];
		const tfxX = xx > 0 ? xx : -xx;
		const tfxY = xy > 0 ? xy : -xy;
		const tfxZ = xz > 0 ? xz : -xz;
		const tfyX = yx > 0 ? yx : -yx;
		const tfyY = yy > 0 ? yy : -yy;
		const tfyZ = yz > 0 ? yz : -yz;
		const tfzX = zx > 0 ? zx : -zx;
		const tfzY = zy > 0 ? zy : -zy;
		const tfzZ = zz > 0 ? zz : -zz;
		let tfsX = tfxX + tfyX, tfsY = tfxY + tfyY, tfsZ = tfxZ + tfyZ;
		tfsX += tfzX; tfsY += tfzY; tfsZ += tfzZ;
		aabb[0] = tf[0] - tfsX; aabb[1] = tf[1] - tfsY; aabb[2] = tf[2] - tfsZ;
		aabb[3] = tf[0] + tfsX; aabb[4] = tf[1] + tfsY; aabb[5] = tf[2] + tfsZ;
		Method.copyElements(aabb, this.aabbComputed.elements);
	}

	public computeLocalSupportingVertex(_dir: Vec3, _out: Vec3): void {
		const dir = _dir.elements, out = _out.elements, es = this.size;
		let gjkMarginsX = this.gjkMargin, gjkMarginsY = this.gjkMargin, gjkMarginsZ = this.gjkMargin;
		if (!(gjkMarginsX < es[0])) gjkMarginsX = es[0];
		if (!(gjkMarginsY < es[1])) gjkMarginsY = es[1];
		if (!(gjkMarginsZ < es[2])) gjkMarginsZ = es[2];
		const coreExtentsX = es[0] - gjkMarginsX, coreExtentsY = es[1] - gjkMarginsY, coreExtentsZ = es[2] - gjkMarginsZ;
		out[0] = dir[0] > 0 ? coreExtentsX : -coreExtentsX;
		out[1] = dir[1] > 0 ? coreExtentsY : -coreExtentsY;
		out[2] = dir[2] > 0 ? coreExtentsZ : -coreExtentsZ;
	}

	/**
	 * 局部坐标系下的射线-立方体相交检测。
	 * 采用Slab算法实现高精度射线检测，支持处理射线平行于坐标轴的边界情况，
	 * 计算相交点、法向量和相交比例，过滤起点在立方体内的无效检测。
	 * @param {number} beginX - 射线起点X坐标（局部坐标系）
	 * @param {number} beginY - 射线起点Y坐标（局部坐标系）
	 * @param {number} beginZ - 射线起点Z坐标（局部坐标系）
	 * @param {number} endX - 射线终点X坐标（局部坐标系）
	 * @param {number} endY - 射线终点Y坐标（局部坐标系）
	 * @param {number} endZ - 射线终点Z坐标（局部坐标系）
	 * @param {RayCastHit} hit - 输出参数，存储射线检测结果
	 * @returns {boolean} 射线是否与立方体相交（true：相交，false：未相交）
	 */
	public rayCastLocal(beginX: number, beginY: number, beginZ: number, endX: number, endY: number, endZ: number, hit: RayCastHit): boolean {
		const es = this.size;
		const halfW = es[0], halfH = es[1], halfD = es[2];
		const dx = endX - beginX, dy = endY - beginY, dz = endZ - beginZ;
		let tminx = 0, tminy = 0, tminz = 0;
		let tmaxx = 1, tmaxy = 1, tmaxz = 1;
		if (dx > -1e-6 && dx < 1e-6) {
			if (beginX <= -halfW || beginX >= halfW) {
				return false;
			}
		} else {
			const invDx = 1 / dx;
			let t1 = (-halfW - beginX) * invDx;
			let t2 = (halfW - beginX) * invDx;
			if (t1 > t2) {
				const tmp = t1;
				t1 = t2;
				t2 = tmp;
			}
			if (t1 > 0) {
				tminx = t1;
			}
			if (t2 < 1) {
				tmaxx = t2;
			}
		}
		if (dy > -1e-6 && dy < 1e-6) {
			if (beginY <= -halfH || beginY >= halfH) {
				return false;
			}
		} else {
			const invDy = 1 / dy;
			let t1 = (-halfH - beginY) * invDy;
			let t2 = (halfH - beginY) * invDy;
			if (t1 > t2) {
				const tmp = t1;
				t1 = t2;
				t2 = tmp;
			}
			if (t1 > 0) {
				tminy = t1;
			}
			if (t2 < 1) {
				tmaxy = t2;
			}
		}
		if (dz > -1e-6 && dz < 1e-6) {
			if (beginZ <= -halfD || beginZ >= halfD) {
				return false;
			}
		} else {
			const invDz = 1 / dz;
			let t1 = (-halfD - beginZ) * invDz;
			let t2 = (halfD - beginZ) * invDz;
			if (t1 > t2) {
				const tmp = t1;
				t1 = t2;
				t2 = tmp;
			}
			if (t1 > 0) {
				tminz = t1;
			}
			if (t2 < 1) {
				tmaxz = t2;
			}
		}
		if (tminx >= 1 || tminy >= 1 || tminz >= 1 || tmaxx <= 0 || tmaxy <= 0 || tmaxz <= 0) {
			return false;
		}
		let min = tminx;
		let max = tmaxx;
		let hitDirection = 0;
		if (tminy > min) {
			min = tminy;
			hitDirection = 1;
		}
		if (tminz > min) {
			min = tminz;
			hitDirection = 2;
		}
		if (tmaxy < max) {
			max = tmaxy;
		}
		if (tmaxz < max) {
			max = tmaxz;
		}
		if (min > max) {
			return false;
		}
		if (min === 0) {
			return false;
		}
		const ne = hit.normal.elements;
		switch (hitDirection) {
			case 0:
				ne[0] = dx > 0 ? -1 : 1;
				ne[1] = ne[2] = 0;
				break;
			case 1:
				ne[1] = dy > 0 ? -1 : 1;
				ne[0] = ne[2] = 0;
				break;
			case 2:
				ne[2] = dz > 0 ? -1 : 1;
				ne[0] = ne[1] = 0;
				break;
		}
		const pe = hit.position.elements;
		pe[0] = beginX + min * dx; pe[1] = beginY + min * dy; pe[2] = beginZ + min * dz;
		hit.fraction = min;
		return true;
	}
}

export { BoxGeometry };