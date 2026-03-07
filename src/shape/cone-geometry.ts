import ConvexGeometry from "./convex-geometry";
import { GEOMETRY_TYPE } from '../constant';
import Aabb from "../common/aabb";
import Transform from "../common/transform";
import Vec3 from "../common/vec3";
import RayCastHit from "./ray-cast-hit";
import Method from "../common/method";

/**
 * 锥体凸几何体类。
 * 实现基于圆锥体的凸几何体，锥体沿Y轴方向延伸（顶点在+Y轴，底面在-Y轴），
 * 支持物理属性自动计算、世界坐标系AABB生成、GJK碰撞检测支撑顶点计算和高精度射线检测，
 * 是物理引擎中用于锥形碰撞体（如子弹、锥形障碍物）的核心实现。
 */
export default class ConeGeometry extends ConvexGeometry {
	/**
	 * 锥体底面半径。
	 * 锥体底部圆形的半径，决定锥体的径向尺寸
	 */
	public radius: number;

	/**
	 * 锥体的半高度（完整高度的1/2）。
	 * 锥体沿Y轴的半高度，完整高度 = 2 × halfHeight，顶点位于 (0, halfHeight, 0)
	 */
	public halfHeight: number;

	/**
	 * 锥体母线与Y轴夹角的正弦值。
	 * sin(θ)，θ为锥体母线与中心轴（Y轴）的夹角，预计算以优化碰撞检测性能
	 */
	public sinTheta: number;

	/**
	 * 锥体母线与Y轴夹角的余弦值。
	 * cos(θ)，θ为锥体母线与中心轴（Y轴）的夹角，预计算以优化碰撞检测性能
	 */
	public cosTheta: number;

	/**
	 * 构造函数：创建锥体几何体实例。
	 * 初始化锥体的半径和半高度，预计算母线与中心轴夹角的正弦/余弦值（优化后续计算），
	 * 并自动计算锥体的物理质量属性（体积、转动惯量系数）。
	 * @param {number} radius - 锥体底面半径（必须大于0）
	 * @param {number} height - 锥体完整高度（必须大于0）
	 */
	constructor(radius: number, height: number) {
		super(GEOMETRY_TYPE.CONE);
		this.radius = radius;
		const hh = height * 0.5;
		this.halfHeight = hh;
		this.sinTheta = radius / Math.sqrt(radius * radius + 4 * hh * hh);
		this.cosTheta = 2 * hh / Math.sqrt(radius * radius + 4 * hh * hh);
		this.updateMass();
	}

	/**
	 * 更新锥体的物理质量属性。
	 * 基于均匀密度假设计算锥体的体积和转动惯量系数：
	 * 1. 体积计算：V = (1/3)πr²H（H为完整高度，此处 3.14159265358979 = π）
	 * 2. 转动惯量：区分径向（X/Z轴）和轴向（Y轴），使用锥体转动惯量公式计算，
	 *    0.05/0.3 为公式中的常数系数（对应 1/20、3/10）。
	 * @returns {void}
	 */
	public updateMass(): void {
		const r = this.radius, hh = this.halfHeight;
		const r2 = r * r;
		const h2 = hh * hh * 4; // 完整高度的平方 (2hh)²
		this.volume = 3.14159265358979 * r2 * hh * 2 / 3; // (1/3)πr²×2hh = (1/3)πr²H
		const icf = this.inertiaCoeff;
		icf[0] = 0.05 * (3 * r2 + 2 * h2); // X轴转动惯量系数
		icf[1] = 0;
		icf[2] = 0;
		icf[3] = 0;
		icf[4] = 0.3 * r2; // Y轴转动惯量系数
		icf[5] = 0;
		icf[6] = 0;
		icf[7] = 0;
		icf[8] = 0.05 * (3 * r2 + 2 * h2); // Z轴转动惯量系数
	}

	/**
	 * 计算锥体在指定变换下的世界坐标系AABB。
	 * 核心逻辑：
	 * 1. 基于锥体的半径和半高度，结合变换矩阵的旋转分量计算径向/轴向投影范围；
	 * 2. 综合径向和轴向的极值，计算世界坐标系下的AABB最小/最大边界；
	 * 3. 将计算结果同步到aabbComputed属性。
	 * @param {Aabb} _aabb - 输出参数，存储计算后的世界AABB
	 * @param {Transform} _tf - 锥体的变换矩阵（包含平移、旋转、缩放）
	 * @returns {void}
	 */
	public computeAabb(_aabb: Aabb, _tf: Transform): void {
		const aabb = _aabb.elements, tf = _tf.elements, r = this.radius, hh = this.halfHeight;
		const axisX = tf[4], axisY = tf[7], axisZ = tf[10];
		const axis2X = axisX * axisX, axis2Y = axisY * axisY, axis2Z = axisZ * axisZ;
		let erX = Math.sqrt(1 - axis2X), erY = Math.sqrt(1 - axis2Y), erZ = Math.sqrt(1 - axis2Z);
		erX *= r; erY *= r; erZ *= r;
		const ehX = axisX * hh, ehY = axisY * hh, ehZ = axisZ * hh;
		let rminX = -ehX, rminY = -ehY, rminZ = -ehZ;
		rminX -= erX; rminY -= erY; rminZ -= erZ;
		let rmaxX = -ehX, rmaxY = -ehY, rmaxZ = -ehZ;
		rmaxX += erX; rmaxY += erY; rmaxZ += erZ;
		let maxX = rminX > rmaxX ? rminX : rmaxX, maxY = rminY > rmaxY ? rminY : rmaxY, maxZ = rminZ > rmaxZ ? rminZ : rmaxZ;
		if (!(maxX > ehX)) maxX = ehX;
		if (!(maxY > ehY)) maxY = ehY;
		if (!(maxZ > ehZ)) maxZ = ehZ;
		let minX = rminX < rmaxX ? rminX : rmaxX, minY = rminY < rmaxY ? rminY : rmaxY, minZ = rminZ < rmaxZ ? rminZ : rmaxZ;
		if (!(minX < ehX)) minX = ehX;
		if (!(minY < ehY)) minY = ehY;
		if (!(minZ < ehZ)) minZ = ehZ;
		aabb[0] = tf[0] + minX;
		aabb[1] = tf[1] + minY;
		aabb[2] = tf[2] + minZ;
		aabb[3] = tf[0] + maxX;
		aabb[4] = tf[1] + maxY;
		aabb[5] = tf[2] + maxZ;
		Method.copyElements(aabb, this.aabbComputed.elements);
	}

	/**
	 * 计算局部坐标系下沿指定方向的支撑顶点。
	 * 锥体的支撑顶点分两种情况计算（GJK/EPA碰撞检测核心步骤）：
	 * 1. 方向偏向Y轴正方向：支撑顶点为锥体顶点（扣除GJK容差）；
	 * 2. 其他方向：支撑顶点为锥体底面沿该方向的极值点（扣除GJK容差）；
	 * 计算时扣除GJK容差以保证碰撞检测的稳定性。
	 * @param {Vec3} _dir - 采样方向向量（局部坐标系，无需归一化）
	 * @param {Vec3} _out - 输出参数，存储计算得到的支撑顶点
	 * @returns {void}
	 */
	public computeLocalSupportingVertex(_dir: Vec3, _out: Vec3): void {
		const dir = _dir.elements, out = _out.elements;
		const sinTheta = this.sinTheta, hh = this.halfHeight, gjm = this.gjkMargin;
		const dx = dir[0], dy = dir[1], dz = dir[2];
		if (dy > 0 && dy * dy > sinTheta * sinTheta * (dx * dx + dy * dy + dz * dz)) {
			out[1] = hh - gjm / sinTheta;
			out[0] = out[2] = 0;
			if (out[1] < 0) out[1] = 0;
			return;
		}
		const rx = dir[0];
		const rz = dir[2];
		const len = rx * rx + rz * rz;
		const height = 2 * hh;
		let coreRadius = (height - gjm) / height * this.radius - gjm / this.cosTheta;
		if (coreRadius < 0) coreRadius = 0;
		const invLen = len > 0 ? coreRadius / Math.sqrt(len) : 0;
		let coreHalfHeight = hh - gjm;
		if (coreHalfHeight < 0) coreHalfHeight = 0;
		out[0] = rx * invLen; out[1] = -coreHalfHeight; out[2] = rz * invLen;
	}

	/**
	 * 局部坐标系下的射线-锥体相交检测。
	 * 分两步检测射线与锥体的相交：
	 * 1. 先检测射线是否在锥体的Y轴高度范围内；
	 * 2. 再检测射线与锥体侧面/底面的相交，计算相交点和法向量；
	 * 最终返回第一个有效相交点，并填充法向量、交点位置和相交比例。
	 * @param {number} beginX - 射线起点X坐标（局部坐标系）
	 * @param {number} beginY - 射线起点Y坐标（局部坐标系）
	 * @param {number} beginZ - 射线起点Z坐标（局部坐标系）
	 * @param {number} endX - 射线终点X坐标（局部坐标系）
	 * @param {number} endY - 射线终点Y坐标（局部坐标系）
	 * @param {number} endZ - 射线终点Z坐标（局部坐标系）
	 * @param {RayCastHit} hit - 输出参数，存储射线检测结果（交点、法向量、相交比例）
	 * @returns {boolean} 射线是否与锥体相交（true：相交，false：未相交）
	 */
	public rayCastLocal(beginX: number, beginY: number, beginZ: number, endX: number, endY: number, endZ: number, hit: RayCastHit): boolean {
		let p1y: number;
		const halfH = this.halfHeight, cosTheta = this.cosTheta;
		const dx = endX - beginX, dy = endY - beginY, dz = endZ - beginZ;
		let tminy = 0, tmaxy = 1;
		if (dy > -1e-6 && dy < 1e-6) {
			if (beginY <= -halfH || beginY >= halfH) return false;
		} else {
			const invDy = 1 / dy;
			let t1 = (-halfH - beginY) * invDy;
			let t2 = (halfH - beginY) * invDy;
			if (t1 > t2) {
				let tmp = t1;
				t1 = t2;
				t2 = tmp;
			}
			if (t1 > 0) tminy = t1;
			if (t2 < 1) tmaxy = t2;
		}
		if (tminy >= 1 || tmaxy <= 0) return false;
		let tminxz = 0, tmaxxz = 0;
		p1y = beginY - halfH;
		const cos2 = cosTheta * cosTheta;
		const a = cos2 * (dx * dx + dy * dy + dz * dz) - dy * dy;
		const b = cos2 * (beginX * dx + p1y * dy + beginZ * dz) - p1y * dy;
		const c = cos2 * (beginX * beginX + p1y * p1y + beginZ * beginZ) - p1y * p1y;
		const D = b * b - a * c;
		if (a !== 0) {
			if (D < 0) return false;
			const sqrtD = Math.sqrt(D);
			if (a < 0) {
				if (dy > 0) {
					tminxz = 0;
					tmaxxz = (-b + sqrtD) / a;
					if (tmaxxz <= 0) return false;
				} else {
					tminxz = (-b - sqrtD) / a;
					tmaxxz = 1;
					if (tminxz >= 1) return false;
				}
			} else {
				tminxz = (-b - sqrtD) / a;
				tmaxxz = (-b + sqrtD) / a;
				if (tminxz >= 1 || tmaxxz <= 0) return false;
			}
		} else {
			const t = -c / (2 * b);
			if (b > 0) {
				tminxz = 0;
				tmaxxz = t;
				if (t <= 0) return false;
			} else {
				tminxz = t;
				tmaxxz = 1;
				if (t >= 1) return false;
			}
		}
		p1y += halfH;
		let min: number;
		const normal = hit.normal.elements, position = hit.position.elements;
		if (tmaxxz <= tminy || tmaxy <= tminxz) return false;
		if (tminxz < tminy) {
			min = tminy;
			if (min === 0) return false;
			normal[0] = 0; normal[1] = dy > 0 ? -1 : 1; normal[2] = 0;
		} else {
			min = tminxz;
			if (min === 0) return false;
			normal[0] = beginX + dx * min; normal[1] = 0; normal[2] = beginZ + dz * min;
			let invLen = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]);
			if (invLen > 0) invLen = 1 / invLen;
			normal[0] *= invLen; normal[1] *= invLen; normal[2] *= invLen;
			const s = cosTheta;
			normal[0] *= s; normal[1] *= s; normal[2] *= s;
			normal[1] += this.sinTheta;
		}
		position[0] = beginX + min * dx; position[1] = p1y + min * dy; position[2] = beginZ + min * dz;
		hit.fraction = min;
		return true;
	}
}

export { ConeGeometry };