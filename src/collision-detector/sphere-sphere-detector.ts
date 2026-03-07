import Transform from "../common/transform";
import SphereGeometry from "../shape/sphere-geometry";
import CachedDetectorData from "./cached-detector-data";
import Detector from "./detector";
import DetectorResult from "./detector-result";

/**
 * 球体-球体碰撞检测器类。
 * 专用于检测两个球体（SphereGeometry）之间碰撞的检测器，继承自通用碰撞检测器抽象类；
 * 核心算法：计算两个球心之间的距离，判断是否小于“两球半径之和”，若满足则判定为碰撞；
 * 是物理引擎中最基础、高效的碰撞检测器，无需交换检测对象顺序（swapped固定为false）。
 */
export default class SphereSphereDetector extends Detector<SphereGeometry, SphereGeometry> {
	/**
	 * 球体-球体检测器构造函数。
	 * 初始化父类Detector，固定设置swapped为false（球体碰撞无方向依赖，无需交换检测顺序）。
	 */
	constructor() {
		super(false);
	}

	/**
	 * 球体-球体碰撞检测具体实现。
	 * 核心检测流程：
	 * 1. 计算两个球心在世界坐标系中的偏移向量；
	 * 2. 计算偏移向量长度的平方，判断是否碰撞（距离平方 < 两半径之和的平方）；
	 * 3. 若碰撞，计算归一化的碰撞法线、两个球体表面的碰撞点和穿透深度；
	 * 性能优化：先判断距离平方（避免开方运算），提升检测效率。
	 * @param {DetectorResult} result - 碰撞检测结果容器，存储法线、碰撞点、穿透深度等数据
	 * @param {SphereGeometry} geom1 - 第一个球体几何对象
	 * @param {SphereGeometry} geom2 - 第二个球体几何对象
	 * @param {Transform} _tf1 - 第一个球体的变换矩阵（核心取位置分量）
	 * @param {Transform} _tf2 - 第二个球体的变换矩阵（核心取位置分量）
	 * @param {CachedDetectorData} cachedData - 检测器缓存数据（当前算法未使用，预留扩展）
	 * @returns {void}
	 */
	protected detectImpl(result: DetectorResult, geom1: SphereGeometry, geom2: SphereGeometry, _tf1: Transform, _tf2: Transform, cachedData: CachedDetectorData): void {
		// 提取变换矩阵元素（列主序，[0,1,2]为球心世界坐标）
		const tf1 = _tf1.elements, tf2 = _tf2.elements;
		// 禁用增量检测，每次检测重新计算碰撞点
		result.incremental = false;

		// 1. 计算两个球心之间的偏移向量（世界坐标系）
		const dX = tf1[0] - tf2[0], dY = tf1[1] - tf2[1], dZ = tf1[2] - tf2[2];
		// 提取两个球体的半径
		const r1 = geom1.radius, r2 = geom2.radius;

		// 2. 计算偏移向量长度的平方（避免开方，提升性能），判断是否碰撞
		const len2 = dX * dX + dY * dY + dZ * dZ;
		if (len2 >= (r1 + r2) * (r1 + r2)) {
			return; // 距离≥两半径之和，无碰撞，直接返回
		}

		// 3. 计算偏移向量的实际长度（开方）
		const len = Math.sqrt(len2);
		// 4. 计算碰撞法线（归一化的偏移向量，从第二个球心指向第一个球心）
		let nX: number, nY: number, nZ: number;
		if (len > 0) {
			// 向量归一化（避免除零）
			nX = dX * (1 / len); nY = dY * (1 / len); nZ = dZ * (1 / len);
		} else {
			// 两球心重合时，默认X轴为法线方向
			nX = 1; nY = 0; nZ = 0;
		}

		// 5. 设置碰撞法线（自动处理swapped标记，此处固定为false）
		this.setNormal(result, nX, nY, nZ);

		// 6. 计算两个球体表面的碰撞点世界坐标
		const pos1X = tf1[0] + nX * -r1, pos1Y = tf1[1] + nY * -r1, pos1Z = tf1[2] + nZ * -r1; // 第一个球体表面碰撞点
		const pos2X = tf2[0] + nX * r2, pos2Y = tf2[1] + nY * r2, pos2Z = tf2[2] + nZ * r2;     // 第二个球体表面碰撞点

		// 7. 添加碰撞点到结果，穿透深度=两半径之和-实际距离
		this.addPoint(result, pos1X, pos1Y, pos1Z, pos2X, pos2Y, pos2Z, r1 + r2 - len, 0);
	}
}

export { SphereSphereDetector };