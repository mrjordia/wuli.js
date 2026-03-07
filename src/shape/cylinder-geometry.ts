import ConvexGeometry from "./convex-geometry";
import { GEOMETRY_TYPE } from '../constant';
import Aabb from "../common/aabb";
import Transform from "../common/transform";
import Vec3 from "../common/vec3";
import RayCastHit from "./ray-cast-hit";
import Method from "../common/method";

/**
 * 圆柱体凸几何体类。
 * 实现基于轴向圆柱体的凸几何体（沿Y轴延伸），是物理引擎中常用的基础碰撞体，
 * 支持自定义半径/高度、物理属性自动计算、世界坐标系AABB生成、GJK碰撞检测支撑顶点计算
 * 以及高精度的射线-圆柱体相交检测，适用于圆柱状物体（如柱子、车轮、管道）的碰撞模拟。
 */
export default class CylinderGeometry extends ConvexGeometry {
	/**
	 * 圆柱体底面半径（XZ平面）。
	 * 圆柱体径向尺寸，决定XZ平面内圆形截面的大小
	 */
	public radius: number;

	/**
	 * 圆柱体的半高度（仅沿Y轴方向）。
	 * 圆柱体轴向半高度，完整高度 = 2 × halfHeight，中心在局部坐标系原点
	 */
	public halfHeight: number;

	/**
	 * 构造函数：创建圆柱体几何体实例。
	 * 初始化圆柱体的半径和半高度，自动计算物理质量属性（体积、转动惯量系数），
	 * 圆柱体默认沿Y轴延伸，底面位于XZ平面。
	 * @param {number} radius - 圆柱体底面半径（必须大于0）
	 * @param {number} halfHeight - 圆柱体半高度（必须大于等于0）
	 */
	constructor(radius: number, halfHeight: number) {
		super(GEOMETRY_TYPE.CYLINDER);
		this.radius = radius;
		this.halfHeight = halfHeight;
		this.updateMass();
	}

	/**
	 * 更新圆柱体的物理质量属性。
	 * 基于均匀密度假设计算圆柱体的体积和转动惯量系数：
	 * 1. 体积计算：V = πr²H（H为完整高度=2×halfHeight，3.14159265358979 = π）
	 * 2. 转动惯量：
	 *    - X/Z轴（径向）：0.083333333333333329 × (3r² + H²)（即 1/12 × (3r² + H²)）
	 *    - Y轴（轴向）：0.5 × r²（即 1/2 × r²）
	 * @returns {void}
	 */
	public updateMass(): void {
		const r = this.radius, h = this.halfHeight;
		const r2 = r * r;
		const h2 = h * h * 4; // 完整高度的平方 (2h)²
		this.volume = 3.14159265358979 * r2 * h * 2; // πr²×2h = πr²H
		const icf = this.inertiaCoeff;
		icf[0] = 0.083333333333333329 * (3 * r2 + h2); // X轴转动惯量系数 (1/12)
		icf[1] = 0;
		icf[2] = 0;
		icf[3] = 0;
		icf[4] = 0.5 * r2; // Y轴转动惯量系数 (1/2)
		icf[5] = 0;
		icf[6] = 0;
		icf[7] = 0;
		icf[8] = 0.083333333333333329 * (3 * r2 + h2); // Z轴转动惯量系数 (1/12)
	}

	/**
	 * 计算圆柱体在指定变换下的世界坐标系AABB。
	 * 核心逻辑：
	 * 1. 结合圆柱体半径（径向）和半高度（轴向），计算变换后各轴的投影范围；
	 * 2. 基于旋转分量计算径向/轴向在世界坐标系的最大扩展；
	 * 3. 叠加平移分量得到最终AABB，并同步到aabbComputed属性。
	 * @param {Aabb} _aabb - 输出参数，存储计算后的世界AABB
	 * @param {Transform} _tf - 圆柱体的变换矩阵（包含平移、旋转、缩放）
	 * @returns {void}
	 */
	public computeAabb(_aabb: Aabb, _tf: Transform): void {
		const r = this.radius, h = this.halfHeight;
		const aabb = _aabb.elements, tf = _tf.elements;
		const ax = tf[4], ay = tf[7], az = tf[10];
		const axisX = ax > 0 ? ax : -ax, axisY = ay > 0 ? ay : -ay, axisZ = az > 0 ? az : -az;
		const axis2X = axisX * axisX, axis2Y = axisY * axisY, axis2Z = axisZ * axisZ;
		let erX = Math.sqrt(1 - axis2X), erY = Math.sqrt(1 - axis2Y), erZ = Math.sqrt(1 - axis2Z);
		erX *= r; erY *= r; erZ *= r;
		const ehX = axisX * h, ehY = axisY * h, ehZ = axisZ * h;
		const maxX = erX + ehX, maxY = erY + ehY, maxZ = erZ + ehZ;
		aabb[0] = tf[0] - maxX; aabb[1] = tf[1] - maxY; aabb[2] = tf[2] - maxZ;
		aabb[3] = tf[0] + maxX; aabb[4] = tf[1] + maxY; aabb[5] = tf[2] + maxZ;
		Method.copyElements(aabb, this.aabbComputed.elements);
	}

	/**
	 * 计算局部坐标系下沿指定方向的支撑顶点。
	 * 圆柱体支撑顶点计算逻辑（GJK/EPA碰撞检测核心）：
	 * 1. 径向（XZ平面）：沿采样方向的径向分量取半径极值（扣除GJK容差）；
	 * 2. 轴向（Y轴）：沿采样方向的Y分量正负取半高度极值（扣除GJK容差）；
	 * 3. 扣除GJK容差以保证碰撞检测的稳定性。
	 * @param {Vec3} _dir - 采样方向向量（局部坐标系，无需归一化）
	 * @param {Vec3} _out - 输出参数，存储计算得到的支撑顶点
	 * @returns {void}
	 */
	public computeLocalSupportingVertex(_dir: Vec3, _out: Vec3): void {
		const dir = _dir.elements, out = _out.elements;
		const rx = dir[0];
		const rz = dir[2];
		const len = rx * rx + rz * rz;
		let coreRadius = this.radius - this.gjkMargin;
		if (coreRadius < 0) coreRadius = 0;
		const invLen = len > 0 ? coreRadius / Math.sqrt(len) : 0;
		let coreHeight = this.halfHeight - this.gjkMargin;
		if (coreHeight < 0) coreHeight = 0;
		out[0] = rx * invLen;
		out[1] = dir[1] > 0 ? coreHeight : -coreHeight;
		out[2] = rz * invLen;
	}

	/**
	 * 局部坐标系下的射线-圆柱体相交检测。
	 * 分两步检测射线与圆柱体的相交：
	 * 1. 先检测射线是否在圆柱体的Y轴高度范围内；
	 * 2. 再检测射线与圆柱体侧面（XZ平面圆形截面）的相交；
	 * 最终返回第一个有效相交点，区分命中顶面/底面（Y轴法向量）和侧面（径向法向量）。
	 * @param {number} beginX - 射线起点X坐标（局部坐标系）
	 * @param {number} beginY - 射线起点Y坐标（局部坐标系）
	 * @param {number} beginZ - 射线起点Z坐标（局部坐标系）
	 * @param {number} endX - 射线终点X坐标（局部坐标系）
	 * @param {number} endY - 射线终点Y坐标（局部坐标系）
	 * @param {number} endZ - 射线终点Z坐标（局部坐标系）
	 * @param {RayCastHit} hit - 输出参数，存储射线检测结果（交点、法向量、相交比例）
	 * @returns {boolean} 射线是否与圆柱体相交（true：相交，false：未相交）
	 */
	public rayCastLocal(beginX: number, beginY: number, beginZ: number, endX: number, endY: number, endZ: number, hit: RayCastHit): boolean {
		const halfH = this.halfHeight;
		const dx = endX - beginX, dy = endY - beginY, dz = endZ - beginZ;
		let tminy = 0, tmaxy = 1;
		if (dy > -1e-6 && dy < 1e-6) {
			if (beginY <= -halfH || beginY >= halfH) return false;
		} else {
			const invDy = 1 / dy;
			let t1 = (-halfH - beginY) * invDy;
			let t2 = (halfH - beginY) * invDy;
			if (t1 > t2) {
				const tmp = t1;
				t1 = t2;
				t2 = tmp;
			}
			if (t1 > 0) tminy = t1;
			if (t2 < 1) tmaxy = t2;
		}
		if (tminy >= 1 || tmaxy <= 0) return false;
		let tminxz = 0;
		let tmaxxz: number;
		const a = dx * dx + dz * dz;
		const b = beginX * dx + beginZ * dz;
		const c = beginX * beginX + beginZ * beginZ - this.radius * this.radius;
		const D = b * b - a * c;
		if (D < 0) return false;
		if (a > 0) {
			const sqrtD = Math.sqrt(D);
			tminxz = (-b - sqrtD) / a;
			tmaxxz = (-b + sqrtD) / a;
			if (tminxz >= 1 || tmaxxz <= 0) return false;
		} else {
			if (c >= 0) return false;
			tminxz = 0;
			tmaxxz = 1;
		}
		let min: number;
		if (tmaxxz <= tminy || tmaxy <= tminxz) return false;
		const normal = hit.normal.elements;
		const position = hit.position.elements;
		if (tminxz < tminy) {
			min = tminy;
			if (min === 0) return false;
			normal[0] = 0; normal[1] = dy > 0 ? -1 : 1; normal[2] = 0;
		} else {
			min = tminxz;
			if (min === 0) return false;
			normal[0] = beginX + dx * min; normal[1] = 0; normal[2] = beginZ + dz * min;
			let invLen = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]);
			if (invLen > 0) {
				invLen = 1 / invLen;
			}
			normal[0] *= invLen; normal[1] *= invLen; normal[2] *= invLen;
		}
		position[0] = beginX + min * dx; position[1] = beginY + min * dy; position[2] = beginZ + min * dz;
		hit.fraction = min;
		return true;
	}
}

export { CylinderGeometry };