import ConvexGeometry from "./convex-geometry";
import { GEOMETRY_TYPE } from '../constant';
import Aabb from "../common/aabb";
import Transform from "../common/transform";
import Vec3 from "../common/vec3";
import RayCastHit from "./ray-cast-hit";
import Method from "../common/method";

/**
 * 球体凸几何体类。
 * 实现基于球体的凸几何体，是物理引擎中最基础的碰撞体之一，
 * 具有各向同性的物理特性（所有轴向的转动惯量相同），支持物理属性自动计算、
 * 世界坐标系AABB生成、GJK碰撞检测支撑顶点计算和高精度射线-球体相交检测，
 * 适用于球状物体（如弹珠、球类、粒子碰撞）的碰撞模拟。
 */
export default class SphereGeometry extends ConvexGeometry {
	/**
	 * 球体半径。
	 * 球体的径向尺寸，同时作为GJK碰撞检测的容差（margin），
	 * 决定球体的物理体积和碰撞范围
	 */
	public radius: number;

	/**
	 * 构造函数：创建球体几何体实例。
	 * 初始化球体半径，将GJK容差设为半径值（适配球体各向同性的碰撞特性），
	 * 并自动计算球体的物理质量属性（体积、转动惯量系数）。
	 * @param {number} radius - 球体半径（必须大于0）
	 */
	constructor(radius: number) {
		super(GEOMETRY_TYPE.SPHERE);
		this.radius = radius;
		this.gjkMargin = this.radius; // 球体GJK容差等于半径，简化碰撞检测
		this.updateMass();
	}

	/**
	 * 更新球体的物理质量属性。
	 * 基于均匀密度假设计算球体的体积和转动惯量系数：
	 * 1. 体积计算：V = (4/3)πr³（4.1887902047863861 = 4/3×π）
	 * 2. 转动惯量：球体为各向同性，所有轴向转动惯量系数均为 0.4×r²（即 2/5×r²）。
	 * @returns {void}
	 */
	public updateMass(): void {
		const rsq = this.radius * this.radius;
		this.volume = 4.1887902047863861 * rsq * this.radius; // (4/3)πr³
		const prs = 0.4 * rsq; // 转动惯量系数 (2/5)r²
		const icf = this.inertiaCoeff;
		icf[0] = prs; // X轴转动惯量
		icf[1] = 0;
		icf[2] = 0;
		icf[3] = 0;
		icf[4] = prs; // Y轴转动惯量
		icf[5] = 0;
		icf[6] = 0;
		icf[7] = 0;
		icf[8] = prs; // Z轴转动惯量
	}

	/**
	 * 计算球体在指定变换下的世界坐标系AABB。
	 * 核心逻辑：
	 * 1. 球体的AABB为轴对齐立方体，边长为 2×半径；
	 * 2. 基于变换矩阵的平移分量（tf[0]/tf[1]/tf[2]）为中心，向各轴扩展半径得到AABB；
	 * 3. 将计算结果同步到aabbComputed属性。
	 * @param {Aabb} _aabb - 输出参数，存储计算后的世界AABB
	 * @param {Transform} _tf - 球体的变换矩阵（主要使用平移分量，旋转/缩放不影响球体AABB）
	 * @returns {void}
	 */
	public computeAabb(_aabb: Aabb, _tf: Transform): void {
		const aabb = _aabb.elements, tf = _tf.elements;
		const r = this.radius;
		aabb[0] = tf[0] - r; aabb[1] = tf[1] - r; aabb[2] = tf[2] - r; // AABB最小值
		aabb[3] = tf[0] + r; aabb[4] = tf[1] + r; aabb[5] = tf[2] + r; // AABB最大值
		Method.copyElements(aabb, this.aabbComputed.elements);
	}

	/**
	 * 计算局部坐标系下沿指定方向的支撑顶点。
	 * 特殊说明：该方法当前实现为返回原点（0,0,0），
	 * 球体的实际支撑顶点逻辑由GJK容差（margin=radius）补充实现——
	 * GJK算法会自动将原点沿采样方向扩展半径，得到球体的真实支撑顶点（dir.normalize()×radius）。
	 * 此设计简化了代码，利用GJK容差特性实现球体各向同性的支撑顶点计算。
	 * @param {Vec3} dir - 采样方向向量（局部坐标系，无需归一化）
	 * @param {Vec3} out - 输出参数，存储计算得到的支撑顶点
	 * @returns {void}
	 */
	public computeLocalSupportingVertex(dir: Vec3, out: Vec3): void {
		let es = out.elements;
		es[0] = es[1] = es[2] = 0; // 返回原点，由GJK margin补充半径偏移
	}

	/**
	 * 局部坐标系下的射线-球体相交检测。
	 * 基于几何公式的射线-球体相交检测：
	 * 1. 构建射线与球体的相交方程，计算判别式D判断是否相交；
	 * 2. 计算最近相交点的参数t（0≤t≤1表示在射线段内）；
	 * 3. 计算相交点坐标和法向量（法向量为相交点指向原点的归一化向量）；
	 * 4. 填充射线检测结果（位置、法向量、相交比例）并返回。
	 * @param {number} beginX - 射线起点X坐标（局部坐标系，球体中心为原点）
	 * @param {number} beginY - 射线起点Y坐标（局部坐标系）
	 * @param {number} beginZ - 射线起点Z坐标（局部坐标系）
	 * @param {number} endX - 射线终点X坐标（局部坐标系）
	 * @param {number} endY - 射线终点Y坐标（局部坐标系）
	 * @param {number} endZ - 射线终点Z坐标（局部坐标系）
	 * @param {RayCastHit} hit - 输出参数，存储射线检测结果（交点、法向量、相交比例）
	 * @returns {boolean} 射线是否与球体相交（true：相交，false：未相交）
	 */
	public rayCastLocal(beginX: number, beginY: number, beginZ: number, endX: number, endY: number, endZ: number, hit: RayCastHit): boolean {
		const dX = endX - beginX, dY = endY - beginY, dZ = endZ - beginZ;
		const a = dX * dX + dY * dY + dZ * dZ; // 射线方向向量长度的平方
		const b = beginX * dX + beginY * dY + beginZ * dZ; // 起点到原点向量与方向向量的点积
		const D = b * b - a * (beginX * beginX + beginY * beginY + beginZ * beginZ - this.radius * this.radius); // 判别式
		if (D < 0) {
			return false; // 无相交
		}
		const t = (-b - Math.sqrt(D)) / a; // 最近相交点的参数t
		if (t < 0 || t > 1) {
			return false; // 相交点不在射线段内
		}
		const hitPosX = beginX + dX * t, hitPosY = beginY + dY * t, hitPosZ = beginZ + dZ * t; // 相交点坐标
		let l = hitPosX * hitPosX + hitPosY * hitPosY + hitPosZ * hitPosZ; // 相交点到原点距离的平方
		if (l > 0) {
			l = 1 / Math.sqrt(l); // 归一化系数
		}
		const hitNormalX = hitPosX * l, hitNormalY = hitPosY * l, hitNormalZ = hitPosZ * l; // 相交点法向量（指向原点）
		const v = hit.position.elements;
		v[0] = hitPosX; v[1] = hitPosY; v[2] = hitPosZ;
		const v1 = hit.normal.elements;
		v1[0] = hitNormalX; v1[1] = hitNormalY; v1[2] = hitNormalZ;
		hit.fraction = t; // 相交比例（0~1）
		return true;
	}
}

export { SphereGeometry };