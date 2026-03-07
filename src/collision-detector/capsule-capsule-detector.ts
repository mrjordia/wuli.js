import Transform from "../common/transform";
import CapsuleGeometry from "../shape/capsule-geometry";
import CachedDetectorData from "./cached-detector-data";
import Detector from "./detector";
import DetectorResult from "./detector-result";

/**
 * 胶囊体-胶囊体碰撞检测器类。
 * 专用于检测两个胶囊体（CapsuleGeometry）之间碰撞的检测器，继承自通用碰撞检测器抽象类；
 * 核心算法：通过计算两个胶囊体轴线的最近点对，判断是否相交，并计算碰撞法线、穿透深度和碰撞点；
 * 仅处理胶囊体与胶囊体的碰撞场景，不兼容其他几何类型。
 */
export default class CapsuleCapsuleDetector extends Detector<CapsuleGeometry, CapsuleGeometry> {
	/**
	 * 胶囊体-胶囊体检测器构造函数。
	 * 初始化父类Detector，设置swapped为false（不交换检测对象顺序），
	 * 胶囊体碰撞检测无需默认交换顺序，可通过外部逻辑调整。
	 */
	constructor() {
		super(false);
	}

	/**
	 * 胶囊体-胶囊体碰撞检测具体实现。
	 * 核心检测流程：
	 * 1. 解析胶囊体的变换矩阵，计算轴线端点的世界坐标；
	 * 2. 求解两个胶囊体轴线的最近点对（t1/t2参数化计算）；
	 * 3. 计算最近点之间的距离，判断是否发生碰撞（距离 < 两半径之和）；
	 * 4. 若碰撞，计算碰撞法线、碰撞点坐标和穿透深度，写入检测结果；
	 * 数学原理：基于线段最近点对算法，结合胶囊体的半径扩展判断碰撞。
	 * @param {DetectorResult} result - 碰撞检测结果容器，用于存储碰撞法线、碰撞点、穿透深度等数据
	 * @param {CapsuleGeometry} geom1 - 第一个胶囊体几何对象
	 * @param {CapsuleGeometry} geom2 - 第二个胶囊体几何对象
	 * @param {Transform} _tf1 - 第一个胶囊体的变换矩阵（位置、旋转、缩放）
	 * @param {Transform} _tf2 - 第二个胶囊体的变换矩阵（位置、旋转、缩放）
	 * @param {CachedDetectorData} cachedData - 检测器缓存数据（当前算法未使用，预留扩展）
	 * @returns {void}
	 */
	protected detectImpl(
		result: DetectorResult,
		geom1: CapsuleGeometry,
		geom2: CapsuleGeometry,
		_tf1: Transform,
		_tf2: Transform,
		cachedData: CachedDetectorData
	): void {
		// 提取变换矩阵元素（列主序，[0,1,2]为位置，[4,7,10]为Y轴/胶囊体轴线方向）
		const tf1 = _tf1.elements, tf2 = _tf2.elements;
		const c1 = geom1, c2 = geom2;

		// 禁用增量检测，每次检测重新计算碰撞点
		result.incremental = false;

		// 1. 提取胶囊体轴线方向（变换矩阵的Y轴）
		const axis1X = tf1[4], axis1Y = tf1[7], axis1Z = tf1[10];
		const axis2X = tf2[4], axis2Y = tf2[7], axis2Z = tf2[10];

		// 提取胶囊体半高和半径
		const hh1 = c1.halfHeight, hh2 = c2.halfHeight;
		const r1 = c1.radius, r2 = c2.radius;

		// 2. 计算胶囊体轴线的两个端点世界坐标（p1/q1为第一个胶囊体，p2/q2为第二个）
		const p1X = tf1[0] + axis1X * -hh1, p1Y = tf1[1] + axis1Y * -hh1, p1Z = tf1[2] + axis1Z * -hh1;
		const q1X = tf1[0] + axis1X * hh1, q1Y = tf1[1] + axis1Y * hh1, q1Z = tf1[2] + axis1Z * hh1;
		const p2X = tf2[0] + axis2X * -hh2, p2Y = tf2[1] + axis2Y * -hh2, p2Z = tf2[2] + axis2Z * -hh2;
		const q2X = tf2[0] + axis2X * hh2, q2Y = tf2[1] + axis2Y * hh2, q2Z = tf2[2] + axis2Z * hh2;

		// 3. 计算向量和点积，为求解最近点对做准备
		const p12X = p1X - p2X, p12Y = p1Y - p2Y, p12Z = p1Z - p2Z; // p1 -> p2 的向量
		const d1X = q1X - p1X, d1Y = q1Y - p1Y, d1Z = q1Z - p1Z;   // 第一个胶囊体轴线向量（p1->q1）
		const d2X = q2X - p2X, d2Y = q2Y - p2Y, d2Z = q2Z - p2Z;   // 第二个胶囊体轴线向量（p2->q2）

		const p21d1 = -(p12X * d1X + p12Y * d1Y + p12Z * d1Z);     // 点积：(p2-p1) · d1
		const p12d2 = p12X * d2X + p12Y * d2Y + p12Z * d2Z;        // 点积：(p1-p2) · d2
		const d11 = hh1 * hh1 * 4;                                 // d1 · d1（轴线向量长度平方）
		const d12 = d1X * d2X + d1Y * d2Y + d1Z * d2Z;             // 点积：d1 · d2
		const d22 = hh2 * hh2 * 4;                                 // d2 · d2（轴线向量长度平方）

		// 4. 求解两个线段的最近点对参数t1/t2（0<=t<=1，对应线段上的位置）
		let t1: number, t2: number;
		if (d11 === 0 && d22 === 0) {
			// 特殊情况：两个胶囊体退化为球体（轴线长度为0）
			t1 = t2 = 0;
		} else if (d11 === 0) {
			// 第一个胶囊体退化为球体，仅计算第二个线段的最近点
			t1 = 0;
			if (p12d2 < 0) {
				t2 = 0;
			} else if (p12d2 > d22) {
				t2 = 1;
			} else {
				t2 = p12d2 / d22;
			}
		} else if (d22 === 0) {
			// 第二个胶囊体退化为球体，仅计算第一个线段的最近点
			t2 = 0;
			if (p21d1 < 0) {
				t1 = 0;
			} else if (p21d1 > d11) {
				t1 = 1;
			} else {
				t1 = p21d1 / d11;
			}
		} else {
			// 通用情况：求解两个线段的最近点对（基于参数化线段的投影计算）
			const det = d11 * d22 - d12 * d12; // 行列式，判断线段是否平行
			if (det === 0) {
				t1 = 0; // 线段平行，取第一个线段起点
			} else {
				t1 = d12 * p12d2 + d22 * p21d1;
				// 限制t1在[0,1]范围内（线段端点外的点无意义）
				if (t1 < 0) {
					t1 = 0;
				} else if (t1 > det) {
					t1 = 1;
				} else {
					t1 /= det;
				}
			}

			// 计算t2，并限制在[0,1]范围内
			t2 = t1 * d12 + p12d2;
			if (t2 < 0) {
				t2 = 0;
				// t2越界，重新计算t1
				if (p21d1 < 0) {
					t1 = 0;
				} else if (p21d1 > d11) {
					t1 = 1;
				} else {
					t1 = p21d1 / d11;
				}
			} else if (t2 > d22) {
				t2 = 1;
				// t2越界，重新计算t1
				t1 = d12 + p21d1;
				if (t1 < 0) {
					t1 = 0;
				} else if (t1 > d11) {
					t1 = 1;
				} else {
					t1 /= d11;
				}
			} else {
				t2 /= d22;
			}
		}

		// 5. 计算两个线段上的最近点坐标
		const cp1X = p1X + d1X * t1, cp1Y = p1Y + d1Y * t1, cp1Z = p1Z + d1Z * t1; // 第一个胶囊体轴线上的最近点
		const cp2X = p2X + d2X * t2, cp2Y = p2Y + d2Y * t2, cp2Z = p2Z + d2Z * t2; // 第二个胶囊体轴线上的最近点

		// 6. 判断是否碰撞：最近点距离的平方 < 两半径之和的平方
		const dX = cp1X - cp2X, dY = cp1Y - cp2Y, dZ = cp1Z - cp2Z;
		const len2 = dX * dX + dY * dY + dZ * dZ; // 最近点距离的平方
		if (len2 >= (r1 + r2) * (r1 + r2)) {
			return; // 无碰撞，直接返回
		}

		// 7. 计算碰撞法线（单位向量，从第二个胶囊体指向第一个）
		const len = Math.sqrt(len2); // 最近点实际距离
		let nX: number, nY: number, nZ: number;
		if (len > 0) {
			nX = dX * (1 / len); nY = dY * (1 / len); nZ = dZ * (1 / len); // 归一化法线
		} else {
			nX = 1; nY = 0; nZ = 0; // 距离为0时，默认X轴为法线方向
		}

		// 8. 设置碰撞法线（自动处理swapped标记）
		this.setNormal(result, nX, nY, nZ);

		// 9. 计算碰撞点坐标（胶囊体表面的接触点）
		const pos1X = cp1X + nX * -r1, pos1Y = cp1Y + nY * -r1, pos1Z = cp1Z + nZ * -r1; // 第一个胶囊体表面点
		const pos2X = cp2X + nX * r2, pos2Y = cp2Y + nY * r2, pos2Z = cp2Z + nZ * r2;     // 第二个胶囊体表面点

		// 10. 添加碰撞点到结果（穿透深度 = 两半径之和 - 最近点距离）
		this.addPoint(result, pos1X, pos1Y, pos1Z, pos2X, pos2Y, pos2Z, r1 + r2 - len, 0);
	}
}

export { CapsuleCapsuleDetector };