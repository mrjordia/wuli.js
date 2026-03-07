import Detector from "../detector";
import GjkEpa from "./gjk-epa";
import { CONSTANT, GJK_EPA_RESULT_STATE } from "../../constant";
import ConvexGeometry from "../../shape/convex-geometry";
import DetectorResult from "../detector-result";
import Transform from "../../common/transform";
import CachedDetectorData from "../cached-detector-data";

/**
 * GJK/EPA碰撞检测器类（凸几何体精确碰撞检测）。
 * 基于GJK（快速碰撞检测）+ EPA（精确距离/法线计算）算法的凸几何体碰撞检测器；
 * 核心功能：
 * 1. 检测两个凸几何体是否碰撞，并计算精确的碰撞法线、穿透深度、接触点；
 * 2. 支持GJK缓存优化，提升连续帧碰撞检测性能；
 * 3. 处理几何体的GJK Margin（边缘容差），保证碰撞检测的稳定性；
 * 适用场景：所有凸几何体（如凸多面体、球体、胶囊体等）的精确碰撞检测。
 */
export default class GjkEpaDetector extends Detector<ConvexGeometry, ConvexGeometry> {
    /**
     * GJK/EPA碰撞检测器构造函数。
     * 调用父类构造函数，设置检测器为非连续检测模式（false）；
     * 非连续检测：仅检测当前帧几何体是否碰撞，不检测运动过程中的碰撞（CCD）。
     */
    constructor() {
        super(false);
    }

    /**
     * 碰撞检测核心实现方法（重写父类抽象方法）。
     * 核心逻辑：
     * 1. 调用GJK/EPA核心算法计算两个凸几何体的最近点；
     * 2. 判断算法执行状态，失败则打印日志并返回；
     * 3. 判断几何体是否碰撞（距离≤两个几何体的Margin之和）；
     * 4. 计算碰撞法线（归一化），处理穿透时的法线方向；
     * 5. 计算接触点（修正Margin后的精确位置）；
     * 6. 将碰撞法线、接触点、穿透深度写入检测结果。
     * @param {DetectorResult} result - 碰撞检测结果对象（输出参数，存储碰撞信息）
     * @param {ConvexGeometry} geom1 - 第一个凸几何体
     * @param {ConvexGeometry} geom2 - 第二个凸几何体
     * @param {Transform} tf1 - 第一个几何体的变换（位置/旋转/缩放）
     * @param {Transform} tf2 - 第二个几何体的变换（位置/旋转/缩放）
     * @param {CachedDetectorData} cachedData - 检测器缓存数据（用于GJK迭代优化）
     * @returns {void}
     */
    protected detectImpl(result: DetectorResult, geom1: ConvexGeometry, geom2: ConvexGeometry, tf1: Transform, tf2: Transform, cachedData: CachedDetectorData): void {
        // 获取GJK/EPA单例实例（避免重复创建，优化性能）
        const gjkEpa = GjkEpa.instance;
        const g1 = geom1;
        const g2 = geom2;

        // 调用GJK/EPA核心算法计算最近点。
        // 参数说明：几何体1、几何体2、变换1、变换2、缓存数据（可选）、是否计算精确接触点
        const status = gjkEpa.computeClosestPointsImpl(g1, g2, tf1, tf2, CONSTANT.SETTING_ENABLE_GJK_CACHING ? cachedData : null, true);

        // 标记结果为增量检测（连续帧优化）
        result.incremental = true;

        // GJK/EPA算法执行失败，打印日志并返回
        if (status !== GJK_EPA_RESULT_STATE.SUCCEEDED) {
            console.log("GjkEpaDetector:", "GJK/EPA failed: status=" + status);
            return;
        }

        // 几何体未碰撞（距离>两个Margin之和），直接返回
        if (gjkEpa.distance > g1.gjkMargin + g2.gjkMargin) {
            return;
        }

        // 提取第一个几何体的最近点坐标
        const v = gjkEpa.closestPoint1.elements;
        let pos1X = v[0], pos1Y = v[1], pos1Z = v[2];
        // 提取第二个几何体的最近点坐标
        const v1 = gjkEpa.closestPoint2.elements;
        let pos2X = v1[0], pos2Y = v1[1], pos2Z = v1[2];

        // 计算原始碰撞法线（geom1最近点 - geom2最近点）
        let normalX = pos1X - pos2X, normalY = pos1Y - pos2Y, normalZ = pos1Z - pos2Z;

        // 法线向量长度为0（两点重合），无有效碰撞信息，返回
        if (normalX * normalX + normalY * normalY + normalZ * normalZ === 0) {
            return;
        }

        // 几何体穿透（distance<0），反转法线方向（保证法线指向从geom2到geom1）
        if (gjkEpa.distance < 0) {
            normalX = -normalX; normalY = -normalY; normalZ = -normalZ;
        }

        // 法线向量归一化（单位向量）
        let l = normalX * normalX + normalY * normalY + normalZ * normalZ;
        if (l > 0) {
            l = 1 / Math.sqrt(l);
        }
        normalX *= l; normalY *= l; normalZ *= l;

        // 将归一化后的碰撞法线写入检测结果
        this.setNormal(result, normalX, normalY, normalZ);

        // 修正接触点位置（考虑几何体的GJK Margin，避免边缘检测误差）
        pos1X += normalX * -g1.gjkMargin; pos1Y += normalY * -g1.gjkMargin; pos1Z += normalZ * -g1.gjkMargin;
        pos2X += normalX * g2.gjkMargin; pos2Y += normalY * g2.gjkMargin; pos2Z += normalZ * g2.gjkMargin;

        // 将接触点、穿透深度写入检测结果。
        // 穿透深度计算：(g1.Margin + g2.Margin) - gjkEpa.distance（distance<0时为正，代表穿透量）
        this.addPoint(result, pos1X, pos1Y, pos1Z, pos2X, pos2Y, pos2Z, g1.gjkMargin + g2.gjkMargin - gjkEpa.distance, 0);
    }
}

export { GjkEpaDetector };