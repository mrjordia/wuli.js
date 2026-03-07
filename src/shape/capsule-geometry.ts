import ConvexGeometry from "./convex-geometry";
import { GEOMETRY_TYPE } from '../constant';
import Aabb from "../common/aabb";
import Transform from "../common/transform";
import Vec3 from "../common/vec3";
import RayCastHit from "./ray-cast-hit";
import Method from "../common/method";

/**
 * 胶囊体凸几何体类。
 * 实现基于胶囊体的凸几何体，胶囊体由中间圆柱体和两端半球体组成，
 * 是物理引擎中常用的碰撞体（如角色控制器、柔性物体碰撞），兼具球体和圆柱体的碰撞特性，
 * 支持物理属性自动计算、世界坐标系AABB生成、GJK碰撞检测支撑顶点计算和高精度射线检测。
 */
export default class CapsuleGeometry extends ConvexGeometry {
	/**
	 * 胶囊体的半径（圆柱体和半球体共用半径）。
	 * 胶囊体径向尺寸，同时作为GJK碰撞检测的容差（margin）
	 */
	public radius: number;

	/**
	 * 胶囊体的半高度（仅指中间圆柱体部分的半高度，不含两端半球体）。
	 * 胶囊体轴向（Y轴）的半高度，完整圆柱体高度为 2 × halfHeight
	 */
	public halfHeight: number;

	/**
	 * 构造函数：创建胶囊体几何体实例。
	 * 初始化胶囊体的半径和半高度，将GJK容差设为半径值（适配胶囊体碰撞特性），
	 * 并自动计算胶囊体的物理质量属性（体积、转动惯量系数）。
	 * @param {number} radius - 胶囊体半径（必须大于0）
	 * @param {number} halfHeight - 胶囊体圆柱体部分的半高度（必须大于等于0）
	 */
	constructor(radius: number, halfHeight: number) {
		super(GEOMETRY_TYPE.CAPSULE);
		this.radius = radius;
		this.halfHeight = halfHeight;
		this.gjkMargin = this.radius;
		this.updateMass();
	}

	/**
	 * 更新胶囊体的物理质量属性。
	 * 分别计算圆柱体和两端半球体的体积，求和得到胶囊体总体积，
	 * 并基于均匀密度假设计算转动惯量系数：
	 * 1. 体积计算：圆柱体体积 + 球体体积（两端半球体合并为一个完整球体）
	 * 2. 转动惯量：区分X/Z轴（径向）和Y轴（轴向），分别结合圆柱体和球体的转动惯量公式计算。
	 * @returns {void}
	 */
	public updateMass(): void {
		const r = this.radius, hh = this.halfHeight;
		const r2 = r * r;
		const hh2 = hh * hh;
		const cylinderVolume = 6.28318530717958 * r2 * hh; // 2πr²h（6.283... = 2×π）
		const sphereVolume = 3.14159265358979 * r2 * r * 4 / 3; // 4/3πr³（3.141... = π）
		this.volume = cylinderVolume + sphereVolume;
		const invVolume = this.volume === 0 ? 0 : 1 / this.volume;
		const inertiaXZ = invVolume * (cylinderVolume * (r2 * 0.25 + hh2 / 3) + sphereVolume * (r2 * 0.4 + hh * r * 0.75 + hh2));
		const icf = this.inertiaCoeff;
		icf[0] = inertiaXZ;
		icf[1] = 0;
		icf[2] = 0;
		icf[3] = 0;
		icf[4] = invVolume * (cylinderVolume * r2 * 0.5 + sphereVolume * r2 * 0.4);
		icf[5] = 0;
		icf[6] = 0;
		icf[7] = 0;
		icf[8] = inertiaXZ;
	}

	public computeAabb(_aabb: Aabb, _tf: Transform): void {
		const tf = _tf.elements, aabb = _aabb.elements, r = this.radius, hh = this.halfHeight;
		let radVecX = r, radVecY = r, radVecZ = r;
		const ax = tf[4], ay = tf[7], az = tf[10];
		let axisX = ax > 0 ? ax : -ax, axisY = ay > 0 ? ay : -ay, axisZ = az > 0 ? az : -az;
		axisX = axisX * hh; axisY = axisY * hh; axisZ = axisZ * hh;
		radVecX += axisX; radVecY += axisY; radVecZ += axisZ;
		aabb[0] = tf[0] - radVecX; aabb[1] = tf[1] - radVecY; aabb[2] = tf[2] - radVecZ;
		aabb[3] = tf[0] + radVecX; aabb[4] = tf[1] + radVecY; aabb[5] = tf[2] + radVecZ;
		Method.copyElements(aabb, this.aabbComputed.elements);
	}

	/**
	 * 计算局部坐标系下沿指定方向的支撑顶点。
	 * 胶囊体的支撑顶点为轴向（Y轴）方向上的端点（±halfHeight, 0, 0），
	 * 是GJK/EPA碰撞检测算法的核心计算步骤，径向的半径部分由GJK容差（margin）补充。
	 * @param {Vec3} dir - 采样方向向量（局部坐标系，无需归一化）
	 * @param {Vec3} out - 输出参数，存储计算得到的支撑顶点
	 * @returns {void}
	 */
	public computeLocalSupportingVertex(dir: Vec3, out: Vec3): void {
		const oe = out.elements;
		if (dir.y > 0) {
			oe[1] = this.halfHeight;
			oe[0] = oe[2] = 0;
		} else {
			oe[1] = -this.halfHeight;
			oe[0] = oe[2] = 0;
		}
	}

	/**
	 * 局部坐标系下的射线-胶囊体相交检测。
	 * 分两步检测射线与胶囊体的相交：
	 * 1. 先检测射线与中间圆柱体的相交（XZ平面投影的圆相交 + Y轴范围判断）；
	 * 2. 若未命中圆柱体，则检测射线与两端半球体（球体）的相交；
	 * 最终返回第一个有效相交点，并填充法向量、交点位置和相交比例。
	 * @param {number} beginX - 射线起点X坐标（局部坐标系）
	 * @param {number} beginY - 射线起点Y坐标（局部坐标系）
	 * @param {number} beginZ - 射线起点Z坐标（局部坐标系）
	 * @param {number} endX - 射线终点X坐标（局部坐标系）
	 * @param {number} endY - 射线终点Y坐标（局部坐标系）
	 * @param {number} endZ - 射线终点Z坐标（局部坐标系）
	 * @param {RayCastHit} hit - 输出参数，存储射线检测结果（交点、法向量、相交比例）
	 * @returns {boolean} 射线是否与胶囊体相交（true：相交，false：未相交）
	 */
	public rayCastLocal(beginX: number, beginY: number, beginZ: number, endX: number, endY: number, endZ: number, hit: RayCastHit): boolean {
		const halfH = this.halfHeight;
		const dx = endX - beginX;
		const dz = endZ - beginZ;
		let tminxz = 0;
		let tmaxxz: number;
		let a = dx * dx + dz * dz;
		let b = beginX * dx + beginZ * dz;
		let c = beginX * beginX + beginZ * beginZ - this.radius * this.radius;
		let D = b * b - a * c;
		if (D < 0) {
			return false;
		}
		if (a > 0) {
			const sqrtD = Math.sqrt(D);
			tminxz = (-b - sqrtD) / a;
			tmaxxz = (-b + sqrtD) / a;
			if (tminxz >= 1 || tmaxxz <= 0) {
				return false;
			}
		} else {
			if (c >= 0) {
				return false;
			}
			tminxz = 0;
		}
		const crossY = beginY + (endY - beginY) * tminxz;
		let min: number;
		if (crossY > -halfH && crossY < halfH) {
			if (tminxz > 0) {
				min = tminxz;
				const ne = hit.normal.elements;
				ne[0] = beginX + dx * min; ne[1] = 0; ne[2] = beginZ + dz * min;
				let invLen = Math.sqrt(ne[0] * ne[0] + ne[1] * ne[1] + ne[2] * ne[2]);
				if (invLen > 0) {
					invLen = 1 / invLen;
				}
				ne[0] *= invLen; ne[1] *= invLen; ne[2] *= invLen;
				const pe = hit.position.elements;
				pe[0] = beginX + min * dx; pe[1] = crossY; pe[2] = beginZ + min * dz;
				hit.fraction = min;
				return true;
			}
			return false;
		}
		const spherePosX = 0, spherePosY = crossY < 0 ? -halfH : halfH, spherePosZ = 0;
		const sphereToBeginX = beginX - spherePosX, sphereToBeginY = beginY - spherePosY, sphereToBeginZ = beginZ - spherePosZ;
		let dX = endX - beginX, dY = endY - beginY, dZ = endZ - beginZ;
		a = dX * dX + dY * dY + dZ * dZ;
		b = sphereToBeginX * dX + sphereToBeginY * dY + sphereToBeginZ * dZ;
		c = sphereToBeginX * sphereToBeginX + sphereToBeginY * sphereToBeginY + sphereToBeginZ * sphereToBeginZ - this.radius * this.radius;
		D = b * b - a * c;
		if (D < 0) {
			return false;
		}
		const t = (-b - Math.sqrt(D)) / a;
		if (t < 0 || t > 1) {
			return false;
		}
		let hitPosX = sphereToBeginX + dX * t, hitPosY = sphereToBeginY + dY * t, hitPosZ = sphereToBeginZ + dZ * t;
		let l = hitPosX * hitPosX + hitPosY * hitPosY + hitPosZ * hitPosZ;
		if (l > 0) {
			l = 1 / Math.sqrt(l);
		}
		const hitNormalX = hitPosX * l, hitNormalY = hitPosY * l, hitNormalZ = hitPosZ * l;
		hitPosX += spherePosX; hitPosY += spherePosY; hitPosZ += spherePosZ;
		const v = hit.position.elements;
		v[0] = hitPosX; v[1] = hitPosY; v[2] = hitPosZ;
		const v1 = hit.normal.elements;
		v1[0] = hitNormalX; v1[1] = hitNormalY; v1[2] = hitNormalZ;
		hit.fraction = t;
		return true;
	}
}

export { CapsuleGeometry };