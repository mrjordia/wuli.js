import ConvexGeometry from "./convex-geometry";
import { GEOMETRY_TYPE } from '../constant';
import Vec3 from "../common/vec3";
import Method from "../common/method";
import Aabb from "../common/aabb";
import Transform from "../common/transform";

/**
 * 凸包几何体类。
 * 实现基于顶点集的凸包几何体，支持任意凸多边形/多面体的碰撞体定义，
 * 是物理引擎中用于自定义复杂凸形状的核心类。内部管理原始顶点集和临时顶点缓存，
 * 自动计算包围盒、物理质量属性和GJK碰撞检测所需的支撑顶点。
 */
export default class ConvexHullGeometry extends ConvexGeometry {
	/**
	 * 凸包顶点数量。
	 * 构成凸包的顶点总数，由构造函数传入的顶点数组长度决定
	 */
	public numVertices: number;

	/**
	 * 凸包原始顶点集（局部坐标系）。
	 * 存储构成凸包的所有顶点，每个顶点为Vec3类型，只读不修改
	 */
	public vertices: Array<Vec3>;

	/**
	 * 凸包临时顶点缓存。
	 * 用于临时计算的顶点缓存，避免频繁创建Vec3对象以优化性能
	 */
	public tmpVertices: Array<Vec3>;

	/**
	 * 构造函数：创建凸包几何体实例。
	 * 初始化凸包顶点集，将输入的普通对象顶点转换为Vec3类型存储，
	 * 创建临时顶点缓存，启用GJK射线检测模式，并自动计算物理质量属性。
	 * 注意：输入的顶点集必须构成凸形状，非凸顶点集会导致碰撞检测异常。
	 * @param {Array<{ x: number, y: number, z: number }>} vertices - 凸包顶点数组（局部坐标系）
	 */
	constructor(vertices: Array<{ x: number, y: number, z: number }>) {
		super(GEOMETRY_TYPE.CONVEX_HULL);
		this.numVertices = vertices.length;
		this.vertices = new Array(this.numVertices);
		this.tmpVertices = new Array(this.numVertices);
		let _g = 0, _g1 = this.numVertices;
		while (_g < _g1) {
			let i = _g++;
			this.vertices[i] = new Vec3();
			Method.setXYZ(this.vertices[i], vertices[i].x, vertices[i].y, vertices[i].z);
			this.tmpVertices[i] = new Vec3();
		}
		this._useGjkRayCast = true; // 启用GJK射线检测（适配凸包复杂形状）
		this.updateMass();
	}

	/**
	 * 更新凸包的物理质量属性。
	 * 基于轴对齐包围盒近似计算凸包的体积和转动惯量系数：
	 * 1. 先遍历顶点集计算X/Y/Z轴的极值，得到包围盒尺寸；
	 * 2. 体积近似为包围盒体积（长×宽×高）；
	 * 3. 转动惯量系数基于包围盒公式计算，并补充质心偏移修正项；
	 * 注意：该方法为近似计算，高精度场景需使用凸包精确积分算法。
	 * @returns {void}
	 */
	public updateMass(): void {
		const icf = this.inertiaCoeff, vertices = this.vertices;
		this.volume = 1;
		icf[0] = 1; icf[1] = 0; icf[2] = 0;
		icf[3] = 0; icf[4] = 1; icf[5] = 0;
		icf[6] = 0; icf[7] = 0; icf[8] = 1;
		let es = vertices[0].elements;
		let minx = es[0], miny = es[1], minz = es[2];
		let maxx = es[0], maxy = es[1], maxz = es[2];
		let _g = 1, _g1 = this.numVertices;
		while (_g < _g1) {
			const i = _g++;
			es = vertices[i].elements;
			const vx = es[0], vy = es[1], vz = es[2];
			if (vx < minx) {
				minx = vx;
			} else if (vx > maxx) {
				maxx = vx;
			}
			if (vy < miny) {
				miny = vy;
			} else if (vy > maxy) {
				maxy = vy;
			}
			if (vz < minz) {
				minz = vz;
			} else if (vz > maxz) {
				maxz = vz;
			}
		}
		let sizex = maxx - minx, sizey = maxy - miny, sizez = maxz - minz;
		this.volume = sizex * sizey * sizez; // 近似为包围盒体积
		const diffCog = ((minx + maxx) * (minx + maxx) + (miny + maxy) * (miny + maxy) + (minz + maxz) * (minz + maxz)) * 0.25;
		sizex = sizex * sizex * 0.25; sizey = sizey * sizey * 0.25; sizez = sizez * sizez * 0.25;
		icf[0] = 0.33333333333333331 * (sizey + sizez) + diffCog; // X轴转动惯量系数
		icf[1] = 0;
		icf[2] = 0;
		icf[3] = 0;
		icf[4] = 0.33333333333333331 * (sizez + sizex) + diffCog; // Y轴转动惯量系数
		icf[5] = 0;
		icf[6] = 0;
		icf[7] = 0;
		icf[8] = 0.33333333333333331 * (sizex + sizey) + diffCog; // Z轴转动惯量系数
	}

	/**
	 * 计算凸包在指定变换下的世界坐标系AABB。
	 * 核心逻辑：
	 * 1. 将所有顶点应用变换矩阵转换到世界坐标系；
	 * 2. 遍历世界坐标系顶点计算X/Y/Z轴的极值；
	 * 3. 叠加GJK容差（margin）得到最终AABB，并同步到aabbComputed属性。
	 * @param {Aabb} _aabb - 输出参数，存储计算后的世界AABB
	 * @param {Transform} _tf - 凸包的变换矩阵（包含平移、旋转、缩放）
	 * @returns {void}
	 */
	public computeAabb(_aabb: Aabb, _tf: Transform): void {
		const gjm = this.gjkMargin, vertices = this.vertices;
		const aabb = _aabb.elements, tf = _tf.elements;
		const marginX = gjm, marginY = gjm, marginZ = gjm;
		let v = vertices[0].elements;
		let localVX = v[0], localVY = v[1], localVZ = v[2];
		let worldVX = tf[3] * localVX + tf[4] * localVY + tf[5] * localVZ;
		let worldVY = tf[6] * localVX + tf[7] * localVY + tf[8] * localVZ;
		let worldVZ = tf[9] * localVX + tf[10] * localVY + tf[11] * localVZ;
		worldVX += tf[0]; worldVY += tf[1]; worldVZ += tf[2];
		let minX = worldVX, minY = worldVY, minZ = worldVZ;
		let maxX = worldVX, maxY = worldVY, maxZ = worldVZ;
		let _g = 1, _g1 = this.numVertices;
		while (_g < _g1) {
			v = vertices[_g++].elements;
			localVX = v[0]; localVY = v[1]; localVZ = v[2];
			worldVX = tf[3] * localVX + tf[4] * localVY + tf[5] * localVZ;
			worldVY = tf[6] * localVX + tf[7] * localVY + tf[8] * localVZ;
			worldVZ = tf[9] * localVX + tf[10] * localVY + tf[11] * localVZ;
			worldVX += tf[0]; worldVY += tf[1]; worldVZ += tf[2];
			if (!(minX < worldVX)) minX = worldVX;
			if (!(minY < worldVY)) minY = worldVY;
			if (!(minZ < worldVZ)) minZ = worldVZ;
			if (!(maxX > worldVX)) maxX = worldVX;
			if (!(maxY > worldVY)) maxY = worldVY;
			if (!(maxZ > worldVZ)) maxZ = worldVZ;
		}
		aabb[0] = minX - marginX; aabb[1] = minY - marginY; aabb[2] = minZ - marginZ;
		aabb[3] = maxX + marginX; aabb[4] = maxY + marginY; aabb[5] = maxZ + marginZ;
		Method.copyElements(aabb, this.aabbComputed.elements);
	}

	/**
	 * 计算局部坐标系下沿指定方向的支撑顶点。
	 * 凸包支撑顶点计算核心逻辑：
	 * 1. 遍历所有顶点，计算顶点与指定方向的点积；
	 * 2. 选取点积最大的顶点作为支撑顶点（该顶点在指定方向上最远）；
	 * 3. 将支撑顶点坐标写入输出参数，是GJK/EPA碰撞检测的核心步骤。
	 * @param {Vec3} _dir - 采样方向向量（局部坐标系，无需归一化）
	 * @param {Vec3} _out - 输出参数，存储计算得到的支撑顶点
	 * @returns {void}
	 */
	public computeLocalSupportingVertex(_dir: Vec3, _out: Vec3): void {
		const dir = _dir.elements, out = _out.elements;
		let _this = this.vertices[0].elements;
		let maxDot = _this[0] * dir[0] + _this[1] * dir[1] + _this[2] * dir[2];
		let maxIndex = 0;
		let _g = 1, _g1 = this.numVertices;
		while (_g < _g1) {
			let i = _g++;
			_this = this.vertices[i].elements;
			const dot = _this[0] * dir[0] + _this[1] * dir[1] + _this[2] * dir[2];
			if (dot > maxDot) {
				maxDot = dot;
				maxIndex = i;
			}
		}
		const v = this.vertices[maxIndex].elements;
		out[0] = v[0]; out[1] = v[1]; out[2] = v[2];
	}
}

export { ConvexHullGeometry };