import IncidentVertex from "./incident-vertex";
import Method from "../../common/method";

/**
 * 面裁剪器核心类。
 * 物理引擎中入射顶点集合的矩形边界裁剪与顶点简化工具类；
 * 核心能力：
 * 1. 按指定宽高的轴对齐矩形边界裁剪顶点集合（四边界顺序裁剪）；
 * 2. 对裁剪后的顶点集合进行极值简化，保留关键特征点；
 * 主要应用于碰撞接触面处理、形状边界约束、物理碰撞响应优化等场景。
 */
export default class FaceClipper {
    /**
     * 裁剪矩形的半宽度（X轴方向）。
     * 裁剪边界阈值：X轴有效范围为 [-w, w]，用于左/右边界的裁剪判断；
     * 初始值为0，需在裁剪前通过业务逻辑赋值。
     */
    public w = 0;

    /**
     * 裁剪矩形的半高度（Y轴方向）。
     * 裁剪边界阈值：Y轴有效范围为 [-h, h]，用于上/下边界的裁剪判断；
     * 初始值为0，需在裁剪前通过业务逻辑赋值。
     */
    public h = 0;

    /**
     * 当前有效顶点数量。
     * 标记vertices数组中实际存储的入射顶点数量；
     * 裁剪/简化操作会动态更新该值，初始值为0。
     */
    public numVertices = 0;

    /**
     * 临时顶点缓存数量。
     * 标记tmpVertices数组中临时存储的顶点数量；
     * 裁剪过程中作为中间数据计数，操作完成后重置为0。
     */
    public numTmpVertices = 0;

    /**
     * 入射顶点存储数组。
     * 固定长度8的顶点数组，存储待裁剪/已裁剪的入射顶点数据；
     * 数组元素为IncidentVertex实例，包含顶点2D坐标与3D法向量信息。
     */
    public vertices: Array<IncidentVertex> = new Array(8);

    /**
     * 临时顶点缓存数组。
     * 固定长度8的顶点缓存数组，用于裁剪过程中的数据交换与临时存储；
     * 与vertices数组配合完成裁剪数据的暂存与结果替换。
     */
    public tmpVertices: Array<IncidentVertex> = new Array(8);

    private _fv0 = new Float64Array(5);

    /**
     * 构造函数：初始化顶点数组。
     * 为vertices和tmpVertices数组预初始化8个IncidentVertex实例；
     * 核心作用：避免运行时动态创建实例，提升裁剪操作的执行效率。
     */
    constructor() {
        for (let i = 0; i < 8; i++) {
            this.vertices[i] = new IncidentVertex();
            this.tmpVertices[i] = new IncidentVertex();
        }
    }

    /**
     * 顶点矩形边界裁剪核心方法。
     * 按顺序对顶点集合执行四边界裁剪（左→右→下→上）；
     * 裁剪逻辑：
     * 1. 左边界：保留 X > -w 的顶点，跨边界时计算交点；
     * 2. 右边界：保留 X < w 的顶点，跨边界时计算交点；
     * 3. 下边界：保留 Y > -h 的顶点，跨边界时计算交点；
     * 4. 上边界：保留 Y < h 的顶点，跨边界时计算交点；
     * 每个边界裁剪完成后，交换顶点数组与临时数组，更新有效顶点数量。
     * @returns {void}
     */
    public clip(): void {
        let _g = 0, _g1 = this.numVertices;
        while (_g < _g1) {
            const i = _g++;
            const v1 = this.vertices[i].elements;
            const v2 = this.vertices[(i + 1) % _g1].elements;
            const s1 = this.w + v1[0];
            const s2 = this.w + v2[0];
            this._setVertex(s1, s2, v1, v2);
        }
        const tmp = this.vertices;
        this.vertices = this.tmpVertices;
        this.tmpVertices = tmp;
        this.numVertices = this.numTmpVertices;
        this.numTmpVertices = 0;
        let _g2 = 0, _g3 = this.numVertices;
        while (_g2 < _g3) {
            const i = _g2++;
            const v1 = this.vertices[i].elements;
            const v2 = this.vertices[(i + 1) % this.numVertices].elements;
            const s1 = this.w - v1[0];
            const s2 = this.w - v2[0];
            this._setVertex(s1, s2, v1, v2);
        }
        const tmp1 = this.vertices;
        this.vertices = this.tmpVertices;
        this.tmpVertices = tmp1;
        this.numVertices = this.numTmpVertices;
        this.numTmpVertices = 0;
        let _g4 = 0, _g5 = this.numVertices;
        while (_g4 < _g5) {
            const i = _g4++;
            const v1 = this.vertices[i].elements;
            const v2 = this.vertices[(i + 1) % this.numVertices].elements;
            const s1 = this.h + v1[1];
            const s2 = this.h + v2[1];
            this._setVertex(s1, s2, v1, v2);
        }
        const tmp2 = this.vertices;
        this.vertices = this.tmpVertices;
        this.tmpVertices = tmp2;
        this.numVertices = this.numTmpVertices;
        this.numTmpVertices = 0;
        let _g6 = 0, _g7 = this.numVertices;
        while (_g6 < _g7) {
            const i = _g6++;
            const v1 = this.vertices[i].elements;
            const v2 = this.vertices[(i + 1) % this.numVertices].elements;
            const s1 = this.h - v1[1];
            const s2 = this.h - v2[1];
            this._setVertex(s1, s2, v1, v2);
        }
        const tmp3 = this.vertices;
        this.vertices = this.tmpVertices;
        this.tmpVertices = tmp3;
        this.numVertices = this.numTmpVertices;
        this.numTmpVertices = 0;
    }

    /**
     * 顶点集合简化方法。
     * 对裁剪后的顶点集合进行极值简化，仅保留4个关键特征点；
     * 简化逻辑：
     * 1. 计算顶点在(1,1)、(-1,1)两个对角方向的投影值；
     * 2. 提取每个方向的最大值、最小值对应的顶点；
     * 3. 将4个极值顶点作为简化后的结果；
     * 注意：仅当顶点数量≥4时执行简化，否则直接返回。
     * @returns {void}
     */
    public reduce(): void {
        if (this.numVertices < 4) {
            return;
        }
        let max1 = -1e65536, min1 = 1e65536;
        let max2 = -1e65536, min2 = 1e65536;
        let max1V = null, min1V = null;
        let max2V = null, min2V = null;
        const e1x = 1, e1y = 1;
        const e2x = -1, e2y = 1;
        let _g = 0, _g1 = this.numVertices;
        while (_g < _g1) {
            const v = this.vertices[_g++].elements;
            const dot1 = v[0] * e1x + v[1] * e1y;
            const dot2 = v[0] * e2x + v[1] * e2y;
            if (dot1 > max1) {
                max1 = dot1;
                max1V = v;
            }
            if (dot1 < min1) {
                min1 = dot1;
                min1V = v;
            }
            if (dot2 > max2) {
                max2 = dot2;
                max2V = v;
            }
            if (dot2 < min2) {
                min2 = dot2;
                min2V = v;
            }
        }
        Method.copyElements(max1V!, this.tmpVertices[this.numTmpVertices++].elements, 0, 0, 5);
        Method.copyElements(max2V!, this.tmpVertices[this.numTmpVertices++].elements, 0, 0, 5);
        Method.copyElements(min1V!, this.tmpVertices[this.numTmpVertices++].elements, 0, 0, 5);
        Method.copyElements(min2V!, this.tmpVertices[this.numTmpVertices++].elements, 0, 0, 5);
        const tmp = this.vertices;
        this.vertices = this.tmpVertices;
        this.tmpVertices = tmp;
        this.numVertices = this.numTmpVertices;
        this.numTmpVertices = 0;
    }

    /**
     * 私有辅助方法：计算并添加插值顶点。
     * 当线段跨裁剪边界时，计算线段与边界的交点并添加到临时顶点数组；
     * 核心计算逻辑：
     * 1. 计算插值系数 t = s1 / (s1 - s2)；
     * 2. 计算向量差 d21 = v2 - v1 并按t缩放；
     * 3. 插值得到交点顶点：v1 + d21，添加到临时数组。
     * @param {number} s1 - 线段起点的裁剪判断值
     * @param {number} s2 - 线段终点的裁剪判断值
     * @param {Float64Array} v2 - 线段终点的顶点数据（包含坐标+法向量）
     * @param {Float64Array} v1 - 线段起点的顶点数据（包含坐标+法向量）
     * @returns {void}
     */
    private _addScaledVert(s1: number, s2: number, v2: Float64Array, v1: Float64Array): void {
        const t = s1 / (s1 - s2);
        const d21 = Method.subArray(v2, v1, this._fv0, 0, 0, 0, 5);
        Method.scaleArray(d21, t, d21, 0, 0, 5);
        Method.addArray(v1, d21, this.tmpVertices[this.numTmpVertices++].elements, 0, 0, 0, 5);
    }

    /**
     * 私有核心方法：处理裁剪顶点对。
     * 根据顶点对的裁剪状态，决定保留顶点或计算交点；
     * 处理规则：
     * 1. 两端都在区域内：保留起点顶点；
     * 2. 起点在区域内、终点在外：保留起点+计算交点；
     * 3. 起点在外、终点在内：仅计算交点；
     * 4. 两端都在外：不处理。
     * @param {number} s1 - 起点的裁剪判断值（>0表示在裁剪区域内）
     * @param {number} s2 - 终点的裁剪判断值（>0表示在裁剪区域内）
     * @param {Float64Array} v1 - 线段起点的顶点数据
     * @param {Float64Array} v2 - 线段终点的顶点数据
     * @returns {void}
     */
    private _setVertex(s1: number, s2: number, v1: Float64Array, v2: Float64Array): void {
        if (s1 > 0 && s2 > 0) {
            Method.copyElements(v1, this.tmpVertices[this.numTmpVertices++].elements, 0, 0, 5);
        } else if (s1 > 0 && s2 <= 0) {
            Method.copyElements(v1, this.tmpVertices[this.numTmpVertices++].elements, 0, 0, 5);
            this._addScaledVert(s1, s2, v2, v1);
        } else if (s1 <= 0 && s2 > 0) {
            this._addScaledVert(s1, s2, v2, v1);
        }
    }
}

export { FaceClipper };