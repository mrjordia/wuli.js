import Transform from "../common/transform";
import CapsuleGeometry from "../shape/capsule-geometry";
import SphereGeometry from "../shape/sphere-geometry";
import CachedDetectorData from "./cached-detector-data";
import Detector from "./detector";
import DetectorResult from "./detector-result";

/**
 * 球体-胶囊体碰撞检测器类。
 * 专用于检测球体（SphereGeometry）与胶囊体（CapsuleGeometry）之间碰撞的检测器，继承自通用碰撞检测器抽象类；
 * 核心算法：计算球心到胶囊体轴线的最近点，判断两点距离是否小于“球半径+胶囊体半径”，若满足则判定为碰撞；
 * 支持通过swapped参数交换检测对象顺序（胶囊体-球体），自动适配法线方向和碰撞点坐标。
 */
export default class SphereCapsuleDetector extends Detector<SphereGeometry, CapsuleGeometry> {
	/**
	 * 球体-胶囊体检测器构造函数。
	 * 初始化父类Detector，传入swapped标记，用于自动调整法线方向和碰撞点坐标的存储顺序。
	 * @param {boolean} swapped - 是否交换检测对象顺序（true=胶囊体-球体，false=球体-胶囊体）
	 */
	constructor(swapped: boolean) {
		super(swapped);
	}

	/**
	 * 球体-胶囊体碰撞检测具体实现。
	 * 核心检测流程：
	 * 1. 提取球体、胶囊体的核心参数（半径、半高、轴线方向）；
	 * 2. 计算胶囊体轴线的两个端点世界坐标；
	 * 3. 求解球心到胶囊体轴线的最近点；
	 * 4. 判断最近点与球心的距离是否小于两半径之和，若碰撞则计算法线、碰撞点和穿透深度；
	 * 数学原理：基于点到线段的最近点算法，结合半径扩展判断碰撞。
	 * @param {DetectorResult} result - 碰撞检测结果容器，存储法线、碰撞点、穿透深度等数据
	 * @param {SphereGeometry} geom1 - 球体几何对象（若swapped为true则为胶囊体，false则为球体）
	 * @param {CapsuleGeometry} geom2 - 胶囊体几何对象（若swapped为true则为球体，false则为胶囊体）
	 * @param {Transform} _tf1 - 第一个对象的变换矩阵（位置、旋转、缩放）
	 * @param {Transform} _tf2 - 第二个对象的变换矩阵（位置、旋转、缩放）
	 * @param {CachedDetectorData} cachedData - 检测器缓存数据（当前算法未使用，预留扩展）
	 * @returns {void}
	 */
	protected detectImpl(result: DetectorResult, geom1: SphereGeometry, geom2: CapsuleGeometry, _tf1: Transform, _tf2: Transform, cachedData: CachedDetectorData): void {
		// 提取变换矩阵元素（列主序，tf1=球体变换，tf2=胶囊体变换）
		const tf1 = _tf1.elements, tf2 = _tf2.elements;
		// 禁用增量检测，每次检测重新计算碰撞点
		result.incremental = false;

		// 1. 提取胶囊体和球体的核心参数
		const hh2 = geom2.halfHeight; // 胶囊体半高
		const r1 = geom1.radius, r2 = geom2.radius; // 球体半径、胶囊体半径
		const axis2X = tf2[4], axis2Y = tf2[7], axis2Z = tf2[10]; // 胶囊体轴线方向（变换矩阵Y轴）
		const cp1X = tf1[0], cp1Y = tf1[1], cp1Z = tf1[2]; // 球心世界坐标

		// 2. 计算胶囊体轴线的两个端点世界坐标（p2=起点，q2=终点）
		const p2X = tf2[0] + axis2X * -hh2, p2Y = tf2[1] + axis2Y * -hh2, p2Z = tf2[2] + axis2Z * -hh2;
		const q2X = tf2[0] + axis2X * hh2, q2Y = tf2[1] + axis2Y * hh2, q2Z = tf2[2] + axis2Z * hh2;

		// 3. 求解球心到胶囊体轴线的最近点参数t（0<=t<=1，对应线段上的位置）
		const p12X = cp1X - p2X, p12Y = cp1Y - p2Y, p12Z = cp1Z - p2Z; // 球心到胶囊体轴线起点的向量
		const d2X = q2X - p2X, d2Y = q2Y - p2Y, d2Z = q2Z - p2Z; // 胶囊体轴线向量（p2->q2）
		const d22 = hh2 * hh2 * 4; // 胶囊体轴线向量长度的平方

		// 计算t参数（投影到轴线的位置），限制在[0,1]范围内
		let t = p12X * d2X + p12Y * d2Y + p12Z * d2Z;
		if (t < 0) {
			t = 0; // 最近点为轴线起点p2
		} else if (t > d22) {
			t = 1; // 最近点为轴线终点q2
		} else {
			t /= d22; // 最近点在轴线中间
		}

		// 4. 计算胶囊体轴线上的最近点世界坐标
		const cp2X = p2X + d2X * t, cp2Y = p2Y + d2Y * t, cp2Z = p2Z + d2Z * t;

		// 5. 判断是否碰撞：球心到最近点的距离平方 < 两半径之和的平方
		const dX = cp1X - cp2X, dY = cp1Y - cp2Y, dZ = cp1Z - cp2Z; // 球心到最近点的向量
		const len2 = dX * dX + dY * dY + dZ * dZ; // 距离平方
		if (len2 >= (r1 + r2) * (r1 + r2)) {
			return; // 无碰撞，直接返回
		}

		// 6. 计算碰撞法线（单位向量，从胶囊体最近点指向球心）
		const len = Math.sqrt(len2); // 实际距离
		let nX: number, nY: number, nZ: number;
		if (len > 0) {
			// 法线向量归一化
			nX = dX * (1 / len); nY = dY * (1 / len); nZ = dZ * (1 / len);
		} else {
			// 距离为0时，默认X轴为法线方向（避免除零）
			nX = 1; nY = 0; nZ = 0;
		}

		// 7. 设置碰撞法线（自动处理swapped标记）
		this.setNormal(result, nX, nY, nZ);

		// 8. 计算球体表面和胶囊体表面的碰撞点世界坐标
		const pos1X = cp1X + nX * -r1, pos1Y = cp1Y + nY * -r1, pos1Z = cp1Z + nZ * -r1; // 球体表面碰撞点
		const pos2X = cp2X + nX * r2, pos2Y = cp2Y + nY * r2, pos2Z = cp2Z + nZ * r2;     // 胶囊体表面碰撞点

		// 9. 添加碰撞点到结果，穿透深度=两半径之和-实际距离
		this.addPoint(result, pos1X, pos1Y, pos1Z, pos2X, pos2Y, pos2Z, r1 + r2 - len, 0);
	}
}

export { SphereCapsuleDetector };