import Vec3 from "../common/vec3";
import { CONSTANT } from "../constant";
import DetectorResultPoint from "./detector-result-point";

/**
 * 碰撞检测结果类。
 * 物理引擎碰撞检测的结果容器，用于存储两个几何形状碰撞的核心数据，
 * 包含碰撞点列表、碰撞法线、最大穿透深度等关键信息，支持结果清空和深度计算。
 */
export default class DetectorResult {
    /**
     * 有效碰撞点数量。
     * 标记points数组中实际有效的碰撞点个数，初始值为0
     */
    public numPoints = 0;

    /**
     * 碰撞法线向量。
     * 表示碰撞接触的法线方向（指向第一个几何对象的外侧），初始化为零向量
     */
    public normal = new Vec3();

    /**
     * 增量检测标记。
     * 标记是否启用增量碰撞检测：
     * - true：保留上一帧的碰撞点，仅补充新的碰撞点；
     * - false：每次检测清空所有碰撞点（默认）；
     */
    public incremental = false;

    /**
     * 碰撞点数组。
     * 存储碰撞点详情的数组，长度由最大碰撞点数常量限制，
     * 每个元素包含两个几何对象的碰撞位置、穿透深度、标识ID等信息
     */
    public points: DetectorResultPoint[] = new Array(CONSTANT.SETTING_MAX_MANIFOLD_POINTS);

    /**
     * 碰撞检测结果构造函数。
     * 初始化碰撞点数组，为每个元素创建DetectorResultPoint实例，
     * 确保数组长度符合最大碰撞点数限制，避免后续使用时出现空指针。
     */
    constructor() {
        let _g = 0, _g1 = CONSTANT.SETTING_MAX_MANIFOLD_POINTS;
        while (_g < _g1) this.points[_g++] = new DetectorResultPoint();
    }

    /**
     * 获取最大穿透深度。
     * 遍历所有有效碰撞点，筛选出最大的depth值，用于判断碰撞的严重程度，
     * 无有效碰撞点时返回0（初始值）。
     * @returns {number} 所有有效碰撞点中的最大深度值
     */
    public getMaxDepth(): number {
        let max = 0;
        let _g = 0, _g1 = this.numPoints;
        while (_g < _g1) {
            const i = _g++;
            if (this.points[i].depth > max) {
                max = this.points[i].depth;
            }
        }
        return max;
    }

    /**
     * 清空碰撞检测结果。
     * 重置所有碰撞相关数据至初始状态：
     * 1. 重置有效碰撞点数量为0；
     * 2. 清空所有碰撞点的坐标、深度、ID；
     * 3. 重置碰撞法线为零向量；
     * 用于下一次碰撞检测前的状态初始化。
     * @returns {void}
     */
    public clear(): void {
        this.numPoints = 0;
        let _g = 0, _g1 = this.points;
        let v = null;
        while (_g < _g1.length) {
            let p = _g1[_g];
            ++_g;
            v = p.position1.elements;
            v[0] = v[1] = v[2] = 0;
            v = p.position2.elements;
            v[0] = v[1] = v[2] = 0;
            p.depth = 0;
            p.id = 0;
        }
        v = this.normal.elements;
        v[0] = v[1] = v[2] = 0;
    }
}

export { DetectorResult };