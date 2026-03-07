import Detector from "../detector";
import FaceClipper from "./face-clipper";
import { CONSTANT } from '../../constant';
import Method from "../../common/method";
import BoxGeometry from "../../shape/box-geometry";
import DetectorResult from "../detector-result";
import Transform from "../../common/transform";
import CachedDetectorData from "../cached-detector-data";

/**
 * 盒体-盒体碰撞检测核心类。
 * 物理引擎中轴对齐/旋转盒体（BoxGeometry）间的精确碰撞检测实现类；
 * 继承自通用Detector抽象类，专注于两个盒体的碰撞检测，核心能力：
 * 1. 基于分离轴定理（SAT）检测两个盒体是否相交；
 * 2. 计算碰撞深度、碰撞法向量、接触点等关键碰撞数据；
 * 3. 结合FaceClipper完成接触点的裁剪与简化，输出高精度碰撞结果；
 * 主要应用于刚体物理碰撞、碰撞响应、接触点生成等场景。
 */
export default class BoxBoxDetector extends Detector<BoxGeometry, BoxGeometry> {
    /**
     * 面裁剪器实例。
     * 用于碰撞接触点的矩形边界裁剪与顶点简化；
     * 在detectImpl中初始化裁剪参数并执行裁剪/简化操作。
     */
    public clipper = new FaceClipper();

    private _bv0 = new Float64Array(3);
    private _bv1 = new Float64Array(3);
    private _bv2 = new Float64Array(3);
    private _bv3 = new Float64Array(3);
    private _bv4 = new Float64Array(3);
    private _bv5 = new Float64Array(3);
    private _bv6 = new Float64Array(3);
    private _bv7 = new Float64Array(3);
    private _bv8 = new Float64Array(3);
    private _bv9 = new Float64Array(3);
    private _bv10 = new Float64Array(3);
    private _bv11 = new Float64Array(3);
    private _bv12 = new Float64Array(3);
    private _bv13 = new Float64Array(3);
    private _bv14 = new Float64Array(3);
    private _bv15 = new Float64Array(3);
    private _bv16 = new Float64Array(3);
    private _bv17 = new Float64Array(3);
    private _bv18 = new Float64Array(3);
    private _bv19 = new Float64Array(3);
    private _bv20 = new Float64Array(3);
    private _bv21 = new Float64Array(3);
    private _bv22 = new Float64Array(3);
    private _vv0 = new Float64Array(3);
    private _vv1 = new Float64Array(3);
    private _vv2 = new Float64Array(3);

    /**
     * 构造函数：初始化盒体碰撞检测器。
     * 调用父类Detector的构造函数，设置非增量检测模式；
     * 初始化FaceClipper实例，为后续接触点裁剪做准备。
     */
    constructor() {
        super(false);
    }

    /**
     * 私有方法：检测单一分离轴。
     * 基于分离轴定理（SAT）检测指定轴是否为分离轴；
     * 核心逻辑：
     * 1. 计算盒体在该轴上的投影范围；
     * 2. 计算两个盒体投影的重叠度（碰撞深度）；
     * 3. 若重叠度>0则更新最小碰撞深度和对应轴，返回相交；否则返回分离。
     * @param {number} siz - 盒体在该轴上的尺寸（半长）
     * @param {Float64Array} dis - 输出参数：碰撞深度、轴ID、方向符号
     * @param {number} rd - 当前最小碰撞深度（用于更新最小深度）
     * @param {number} id - 分离轴唯一标识ID
     * @param {Float64Array} mAxis - 输出参数：最小深度对应的分离轴
     * @param {Float64Array} ax - 当前检测的分离轴向量
     * @param {Float64Array} sx - 盒体X轴缩放向量
     * @param {Float64Array} sy - 盒体Y轴缩放向量
     * @param {Float64Array} sz - 盒体Z轴缩放向量
     * @param {Float64Array} c - 两个盒体的中心差值向量
     * @returns {boolean} - 是否分离：true=未分离（相交），false=分离（无碰撞）
     */
    private _checkAxis(siz: number, dis: Float64Array, rd: number, id: number, mAxis: Float64Array, ax: Float64Array, sx: Float64Array, sy: Float64Array, sz: Float64Array, c: Float64Array): boolean {
        const pr = siz;
        const d = Method.setElements(this._vv0, 0, Method.multiplyArray(ax, sx), Method.multiplyArray(ax, sy), Method.multiplyArray(ax, sz));
        Method.absArray(d, d, 0, 0, 3, 1);
        const prj = d[0] + d[1] + d[2];
        const prc = Method.multiplyArray(ax, c, 0, 0, 3);
        const sum = pr + prj;
        const neg = prc < 0;
        const abs = neg ? -prc : prc;
        if (abs < sum) {
            const depth = sum - abs;
            if (depth < rd) {
                dis[0] = depth;
                dis[1] = id;
                Method.copyElements(ax, mAxis, 0, 0, 3);
                dis[2] = neg ? -1 : 1;
            }
            return true;
        } else {
            return false;
        }
    }

    /**
     * 私有方法：检测边-边分离轴。
     * 检测两个盒体边向量叉乘得到的分离轴，适用于旋转盒体的碰撞检测；
     * 核心逻辑：
     * 1. 计算边向量的叉乘得到潜在分离轴并单位化；
     * 2. 计算两个盒体在该轴上的投影范围；
     * 3. 判断投影是否重叠，更新最小碰撞深度和对应轴。
     * @param {Float64Array} a1 - 第一个盒体的边向量
     * @param {Float64Array} a2 - 第二个盒体的边向量
     * @param {Float64Array} prj - 临时投影值存储数组
     * @param {Float64Array} dis - 输出参数：碰撞深度、轴ID、方向符号
     * @param {number} id - 边-边分离轴唯一标识ID
     * @param {Float64Array} mAxis - 输出参数：最小深度对应的分离轴
     * @param {Float64Array} sf1 - 第一个盒体的缩放向量1
     * @param {Float64Array} sb1 - 第一个盒体的缩放向量2
     * @param {Float64Array} sf2 - 第二个盒体的缩放向量1
     * @param {Float64Array} sb2 - 第二个盒体的缩放向量2
     * @param {Float64Array} c12 - 两个盒体的中心差值向量
     * @returns {boolean} - 是否分离：true=未分离（相交），false=分离（无碰撞）
     */
    private _checkEdge(a1: Float64Array, a2: Float64Array, prj: Float64Array, dis: Float64Array, id: number, mAxis: Float64Array, sf1: Float64Array, sb1: Float64Array, sf2: Float64Array, sb2: Float64Array, c12: Float64Array): boolean {
        const eAx = Method.crossVectors(a1[0], a1[1], a1[2], a2[0], a2[1], a2[2], this._vv0, 0);
        if (!(eAx[0] === 0 && eAx[1] === 0 && eAx[2] === 0)) {
            let l = Method.multiplyArray(eAx, eAx, 0, 0, 3);
            if (l > 0) {
                l = 1 / Math.sqrt(l);
            }
            eAx[0] *= l; eAx[1] *= l; eAx[2] *= l;
            const d = Method.setElements(this._vv1, 0, Method.multiplyArray(eAx, sf1), Method.multiplyArray(eAx, sb1), 0);
            Method.absArray(d, d, 0, 0, 3, 1);
            prj[0] = d[0] + d[1];
            const d1 = Method.setElements(this._vv2, 0, Method.multiplyArray(eAx, sf2), Method.multiplyArray(eAx, sb2), 0);
            Method.absArray(d1, d1, 0, 0, 3, 1);
            prj[1] = d1[0] + d1[1];
            prj[2] = Method.multiplyArray(eAx, c12, 0, 0, 3);
            const sum = prj[0] + prj[1];
            const neg = prj[2] < 0;
            const abs = neg ? -prj[2] : prj[2];
            if (abs < sum) {
                const depth = sum - abs;
                if (depth < dis[0]) {
                    dis[0] = depth;
                    dis[1] = id;
                    Method.copyElements(eAx, mAxis, 0, 0, 3);
                    dis[2] = neg ? -1 : 1;
                }
            } else {
                return false;
            }
        }
        return true;
    }

    /**
     * 私有方法：计算盒体碰撞点。
     * 根据分离轴和盒体轴向量，计算盒体表面的碰撞点；
     * 核心逻辑：
     * 1. 根据轴向量与分离轴的点乘符号判断方向；
     * 2. 通过向量加减计算盒体表面的碰撞点坐标。
     * @param {Float64Array} d1 - 临时向量缓存
     * @param {Float64Array} a1 - 盒体的轴向量
     * @param {Float64Array} mAxis - 最小深度分离轴
     * @param {Float64Array} sf1 - 盒体缩放向量1
     * @param {Float64Array} sb1 - 盒体缩放向量2
     * @param {Float64Array} p1 - 输出参数：计算得到的碰撞点坐标
     * @returns {void}
     */
    private _computePoint(d1: Float64Array, a1: Float64Array, mAxis: Float64Array, sf1: Float64Array, sb1: Float64Array, p1: Float64Array): void {
        Method.copyElements(a1, d1, 0, 0, 3);
        const signY = Method.multiplyArray(sf1, mAxis, 0, 0, 3) > 0;
        if (Method.multiplyArray(sb1, mAxis, 0, 0, 3) > 0) {
            if (signY) {
                Method.addArray(sb1, sf1, p1, 0, 0, 0, 3);
            } else {
                Method.subArray(sb1, sf1, p1, 0, 0, 0, 3);
            }
        } else if (signY) {
            Method.subArray(sf1, sb1, p1, 0, 0, 0, 3);
        } else {
            Method.addArray(sb1, sf1, p1, 0, 0, 0, 3);
            Method.scaleArray(p1, -1, p1, 0, 0, 3);
        }
    }

    /**
     * 私有方法：交换两个向量数据。
     * 交换两个Float64Array向量的内容，用于盒体数据交换场景；
     * 避免直接赋值导致的引用问题，保证数据独立性。
     * @param {Float64Array} a1 - 向量1
     * @param {Float64Array} a2 - 向量2
     * @param {Float64Array} tmp - 临时向量缓存（用于交换）
     * @returns {void}
     */
    private _swap(a1: Float64Array, a2: Float64Array, tmp: Float64Array): void {
        Method.copyElements(a1, tmp, 0, 0, 3);
        Method.copyElements(a2, a1, 0, 0, 3);
        Method.copyElements(tmp, a2, 0, 0, 3);
    }

    /**
     * 私有方法：设置裁剪器宽高与参考数据。
     * 初始化FaceClipper的裁剪参数（宽高）和参考坐标系（中心、法向量、轴）；
     * 为后续接触点裁剪提供基础数据。
     * @param {Float64Array} refCent - 输出参数：参考中心向量
     * @param {Float64Array} sa1 - 缩放向量
     * @param {Float64Array} refNom - 输出参数：参考法向量
     * @param {Float64Array} a1 - 轴向量
     * @param {Float64Array} refA - 输出参数：参考轴A
     * @param {Float64Array} b1 - 轴向量B
     * @param {Float64Array} refB - 输出参数：参考轴B
     * @param {Float64Array} c1 - 轴向量C
     * @param {Float64Array} refWH - 输出参数：裁剪器宽高
     * @param {number} h1 - 盒体高度
     * @param {number} d1 - 盒体深度
     * @returns {void}
     */
    private _setWH(refCent: Float64Array, sa1: Float64Array, refNom: Float64Array, a1: Float64Array, refA: Float64Array, b1: Float64Array, refB: Float64Array, c1: Float64Array, refWH: Float64Array, h1: number, d1: number): void {
        Method.copyElements(sa1, refCent, 0, 0, 3);
        Method.copyElements(a1, refNom, 0, 0, 3);
        Method.copyElements(b1, refA, 0, 0, 3);
        Method.copyElements(c1, refB, 0, 0, 3);
        refWH[0] = h1;
        refWH[1] = d1;
    }

    /**
     * 私有方法：向量运算（加+加）。
     * 执行向量运算：out = c + (a + b)（可选取反）；
     * 专用于盒体顶点坐标计算场景。
     * @param {Float64Array} a - 向量A
     * @param {Float64Array} b - 向量B
     * @param {Float64Array} out - 输出参数：运算结果向量
     * @param {boolean} [inv=false] - 是否取反结果
     * @returns {void}
     */
    private _AA(a: Float64Array, b: Float64Array, c: Float64Array, out: Float64Array, inv = false): void {
        Method.addArray(a, b, out, 0, 0, 0, 3);
        if (inv) Method.scaleArray(out, -1, out, 0, 0, 3);
        Method.addArray(c, out, out, 0, 0, 0, 3);
    }

    /**
     * 私有方法：向量运算（减+加）。
     * 执行向量运算：out = c + (a - b)（可选取反）；
     * 专用于盒体顶点坐标计算场景。
     * @param {Float64Array} a - 向量A
     * @param {Float64Array} b - 向量B
     * @param {Float64Array} out - 输出参数：运算结果向量
     * @param {boolean} [inv=false] - 是否取反结果
     * @returns {void}
     */
    private _SA(a: Float64Array, b: Float64Array, c: Float64Array, out: Float64Array, inv = false): void {
        Method.subArray(a, b, out, 0, 0, 0, 3);
        if (inv) Method.scaleArray(out, -1, out, 0, 0, 3);
        Method.addArray(c, out, out, 0, 0, 0, 3);
    }

    /**
     * 私有方法：向量运算（减-减）。
     * 执行向量运算：out = (a - b) - c（可选取反）；
     * 专用于盒体顶点坐标计算场景。
     * @param {Float64Array} a - 向量A
     * @param {Float64Array} b - 向量B
     * @param {Float64Array} out - 输出参数：运算结果向量
     * @param {boolean} [inv=false] - 是否取反结果
     * @returns {void}
     */
    private _SS(a: Float64Array, b: Float64Array, c: Float64Array, out: Float64Array, inv = false): void {
        Method.subArray(a, b, out, 0, 0, 0, 3);
        if (inv) Method.scaleArray(out, -1, out, 0, 0, 3);
        Method.subArray(out, c, out, 0, 0, 0, 3);
    }

    /**
     * 私有方法：向量运算（加-减）。
     * 执行向量运算：out = (a + b) - c（可选取反）；
     * 专用于盒体顶点坐标计算场景。
     * @param {Float64Array} a - 向量A
     * @param {Float64Array} b - 向量B
     * @param {Float64Array} out - 输出参数：运算结果向量
     * @param {boolean} [inv=false] - 是否取反结果
     * @returns {void}
     */
    private _AS(a: Float64Array, b: Float64Array, c: Float64Array, out: Float64Array, inv = false): void {
        Method.addArray(a, b, out, 0, 0, 0, 3);
        if (inv) Method.scaleArray(out, -1, out, 0, 0, 3);
        Method.subArray(out, c, out, 0, 0, 0, 3);
    }

    /**
     * 核心检测实现方法。
     * 实现盒体-盒体碰撞检测的核心逻辑，完整流程：
     * 1. 解析盒体的变换矩阵、尺寸、轴向量等基础数据；
     * 2. 基于分离轴定理（SAT）检测主轴（X/Y/Z）是否分离；
     * 3. 检测边-边分离轴，覆盖旋转盒体的碰撞场景；
     * 4. 计算碰撞深度、法向量，生成初始接触点；
     * 5. 利用FaceClipper裁剪并简化接触点，输出最终碰撞结果；
     * 注意：
     * - 支持轴对齐和旋转盒体的碰撞检测；
     * - 碰撞深度会扣除线性容差（SLS），接触点会过滤低于持久化阈值（CPT）的无效点。
     * @param {DetectorResult} result - 输出参数：碰撞检测结果（法向量、接触点、深度等）
     * @param {BoxGeometry} geom1 - 第一个盒体的几何数据
     * @param {BoxGeometry} geom2 - 第二个盒体的几何数据
     * @param {Transform} _tf1 - 第一个盒体的变换矩阵（位置、旋转）
     * @param {Transform} _tf2 - 第二个盒体的变换矩阵（位置、旋转）
     * @param {CachedDetectorData} cachedData - 缓存的检测数据（优化重复检测）
     * @returns {void}
     */
    protected detectImpl(result: DetectorResult, geom1: BoxGeometry, geom2: BoxGeometry, _tf1: Transform, _tf2: Transform, cachedData: CachedDetectorData): void {
        const SLS = CONSTANT.SETTING_LINEAR_SLOP;
        const CPT = CONSTANT.SETTING_CONTACT_PERSISTENCE_THRESHOLD;
        const b1 = geom1, b2 = geom2;
        const tf1 = _tf1.elements, tf2 = _tf2.elements;
        result.incremental = false;
        const c1 = Method.setElements(this._bv4, 0, tf1[0], tf1[1], tf1[2]);
        const c2 = Method.setElements(this._bv1, 0, tf2[0], tf2[1], tf2[2]);
        const c12 = Method.subArray(c2, c1, this._bv2, 0, 0, 0, 3);
        const x1 = Method.setElements(this._bv3, 0, tf1[3], tf1[6], tf1[9]);
        const y1 = Method.setElements(this._bv5, 0, tf1[4], tf1[7], tf1[10]);
        const z1 = Method.setElements(this._bv6, 0, tf1[5], tf1[8], tf1[11]);
        const x2 = Method.setElements(this._bv7, 0, tf2[3], tf2[6], tf2[9]);
        const y2 = Method.setElements(this._bv8, 0, tf2[4], tf2[7], tf2[10]);
        const z2 = Method.setElements(this._bv9, 0, tf2[5], tf2[8], tf2[11]);
        const b1s = b1.size, b2s = b2.size;
        let w1 = b1s[0], h1 = b1s[1], d1 = b1s[2];
        const w2 = b2s[0], h2 = b2s[1], d2 = b2s[2];
        const sx1 = Method.setElements(this._bv10, 0, x1[0] * w1, x1[1] * w1, x1[2] * w1);
        const sy1 = Method.setElements(this._bv11, 0, y1[0] * h1, y1[1] * h1, y1[2] * h1);
        const sz1 = Method.setElements(this._bv12, 0, z1[0] * d1, z1[1] * d1, z1[2] * d1);
        const sx2 = Method.setElements(this._bv13, 0, x2[0] * w2, x2[1] * w2, x2[2] * w2);
        const sy2 = Method.setElements(this._bv14, 0, y2[0] * h2, y2[1] * h2, y2[2] * h2);
        const sz2 = Method.setElements(this._bv15, 0, z2[0] * d2, z2[1] * d2, z2[2] * d2);
        const dis = Method.setElements(this._bv0, 0, 1e65536, -1, 0);
        const mAxis = this._bv16;
        if (!this._checkAxis(w1, dis, 1e65536, 0, mAxis, x1, sx2, sy2, sz2, c12)) return;
        if (!this._checkAxis(h1, dis, dis[0], 1, mAxis, y1, sx2, sy2, sz2, c12)) return;
        if (!this._checkAxis(d1, dis, dis[0], 2, mAxis, z1, sx2, sy2, sz2, c12)) return;
        if (dis[0] > SLS) {
            dis[0] -= SLS;
        } else {
            dis[0] = 0;
        }
        if (!this._checkAxis(w2, dis, dis[0], 3, mAxis, x2, sx1, sy1, sz1, c12)) return;
        if (!this._checkAxis(h2, dis, dis[0], 4, mAxis, y2, sx1, sy1, sz1, c12)) return;
        if (!this._checkAxis(d2, dis, dis[0], 5, mAxis, z2, sx1, sy1, sz1, c12)) return;
        const prj = this._bv17;
        if (dis[0] > SLS) {
            dis[0] -= SLS;
        } else {
            dis[0] = 0;
        }
        if (!this._checkEdge(x1, x2, prj, dis, 6, mAxis, sy1, sz1, sy2, sz2, c12)) return;
        if (!this._checkEdge(x1, y2, prj, dis, 7, mAxis, sy1, sz1, sx2, sz2, c12)) return;
        if (!this._checkEdge(x1, z2, prj, dis, 8, mAxis, sy1, sz1, sx2, sy2, c12)) return;
        if (!this._checkEdge(y1, x2, prj, dis, 9, mAxis, sx1, sz1, sy2, sz2, c12)) return;
        if (!this._checkEdge(y1, y2, prj, dis, 10, mAxis, sx1, sz1, sx2, sz2, c12)) return;
        if (!this._checkEdge(y1, z2, prj, dis, 11, mAxis, sx1, sz1, sx2, sy2, c12)) return;
        if (!this._checkEdge(z1, x2, prj, dis, 12, mAxis, sx1, sy1, sy2, sz2, c12)) return;
        if (!this._checkEdge(z1, y2, prj, dis, 13, mAxis, sx1, sy1, sx2, sz2, c12)) return;
        if (!this._checkEdge(z1, z2, prj, dis, 14, mAxis, sx1, sy1, sx2, sy2, c12)) return;

        if (dis[1] >= 6) {
            Method.scaleArray(mAxis, dis[2], mAxis, 0, 0, 3);
            const id1 = (dis[1] - 6) / 3 | 0;
            const id2 = dis[1] - 6 - id1 * 3;
            // const p1 = this._bv18;
            const p1 = this._bv17;
            const p2 = this._bv19;
            const d1 = this._bv20;
            const d2 = this._bv21;
            switch (id1) {
                case 0:
                    this._computePoint(d1, x1, mAxis, sz1, sy1, p1);
                    break;
                case 1:
                    this._computePoint(d1, y1, mAxis, sz1, sx1, p1);
                    break;
                default:
                    this._computePoint(d1, z1, mAxis, sy1, sx1, p1);
            }
            Method.addArray(c1, p1, p1, 0, 0, 0, 3);
            switch (id2) {
                case 0:
                    this._computePoint(d2, x2, mAxis, sz2, sy2, p2);
                    break;
                case 1:
                    this._computePoint(d2, y2, mAxis, sz2, sx2, p2);
                    break;
                default:
                    this._computePoint(d2, z2, mAxis, sy2, sx2, p2);
            }
            Method.subArray(c2, p2, p2, 0, 0, 0, 3);
            const r = Method.subArray(p1, p2, this._bv18, 0, 0, 0, 3);
            const dot12 = Method.multiplyArray(d1, d2, 0, 0, 3);
            const dot1r = Method.multiplyArray(d1, r, 0, 0, 3);
            const dot2r = Method.multiplyArray(d2, r, 0, 0, 3);
            const invDet = 1 / (1 - dot12 * dot12);
            const t1 = (dot12 * dot2r - dot1r) * invDet;
            const t2 = (dot2r - dot12 * dot1r) * invDet;
            const cp1 = Method.scaleArray(d1, t1, this._bv18, 0, 0, 3);
            Method.addArray(cp1, p1, cp1, 0, 0, 0, 3);
            const cp2 = Method.scaleArray(d2, t2, this._bv22, 0, 0, 3);
            Method.addArray(cp2, p2, cp2, 0, 0, 0, 3);
            this.setNormal(result, -mAxis[0], -mAxis[1], -mAxis[2]);
            this.addPoint(result, cp1[0], cp1[1], cp1[2], cp2[0], cp2[1], cp2[2], dis[0], 4);
            return;
        }
        const tmp = this._bv18;
        let swapped: boolean;
        if (dis[1] >= 3) {
            dis[2] = -dis[2];
            Method.scaleArray(c12, -1, c12, 0, 0, 3);
            w1 = w2; h1 = h2; d1 = d2;
            Method.copyElements(c2, c1, 0, 0, 3);
            this._swap(x1, x2, tmp);
            this._swap(y1, y2, tmp);
            this._swap(z1, z2, tmp);
            this._swap(sx1, sx2, tmp);
            this._swap(sy1, sy2, tmp);
            this._swap(sz1, sz2, tmp);
            dis[1] -= 3;
            swapped = true;
        } else {
            swapped = false;
        }
        const refCent = this._bv1;
        const refNom = this._bv16;
        const refX = this._bv17;
        const refY = this._bv19;
        const refWH = this._bv21;
        switch (dis[1]) {
            case 0:
                this._setWH(refCent, sx1, refNom, x1, refX, y1, refY, z1, refWH, h1, d1);
                break;
            case 1:
                this._setWH(refCent, sy1, refNom, y1, refX, z1, refY, x1, refWH, d1, w1);
                break;
            default:
                this._setWH(refCent, sz1, refNom, z1, refX, x1, refY, y1, refWH, w1, h1);
        }
        if (dis[2] < 0) {
            Method.scaleArray(refCent, -1, refCent, 0, 0, 3);
            Method.scaleArray(refNom, -1, refNom, 0, 0, 3);
            this._swap(refX, refY, tmp);
            let tp = refWH[0];
            refWH[0] = refWH[1];
            refWH[1] = tp;
        }
        Method.addArray(refCent, c1, refCent, 0, 0, 0, 3);
        let minIncDot = 1;
        let incId = 0;
        let incDot = Method.multiplyArray(refNom, x2, 0, 0, 3);
        if (incDot < minIncDot) {
            minIncDot = incDot;
            incId = 0;
        }
        if (-incDot < minIncDot) {
            minIncDot = -incDot;
            incId = 1;
        }
        incDot = Method.multiplyArray(refNom, y2, 0, 0, 3);
        if (incDot < minIncDot) {
            minIncDot = incDot;
            incId = 2;
        }
        if (-incDot < minIncDot) {
            minIncDot = -incDot;
            incId = 3;
        }
        incDot = Method.multiplyArray(refNom, z2, 0, 0, 3);
        if (incDot < minIncDot) {
            minIncDot = incDot;
            incId = 4;
        }
        if (-incDot < minIncDot) {
            incId = 5;
        }
        const incV1 = this._bv3;
        const incV2 = this._bv5;
        const incV3 = this._bv6;
        const incV4 = this._bv7;
        switch (incId) {
            case 0:
                this._AA(sx2, sy2, sz2, incV1, false);
                this._SA(sx2, sy2, sz2, incV2, false);
                this._SS(sx2, sy2, sz2, incV3, false);
                this._AS(sx2, sy2, sz2, incV4, false);
                break;
            case 1:
                this._SA(sy2, sx2, sz2, incV1, false);
                this._SS(sy2, sx2, sz2, incV2, false);
                this._AS(sx2, sy2, sz2, incV3, true);
                this._AA(sx2, sy2, sz2, incV4, true);
                break;
            case 2:
                this._AA(sx2, sy2, sz2, incV1, false);
                this._AS(sx2, sy2, sz2, incV2, false);
                this._SS(sy2, sx2, sz2, incV3, false);
                this._SA(sy2, sx2, sz2, incV4, false);
                break;
            case 3:
                this._SA(sx2, sy2, sz2, incV1, false);
                this._AA(sx2, sy2, sz2, incV2, true);
                this._AS(sx2, sy2, sz2, incV3, true);
                this._SS(sx2, sy2, sz2, incV4, false);
                break;
            case 4:
                this._AA(sx2, sy2, sz2, incV1, false);
                this._SA(sy2, sx2, sz2, incV2, false);
                this._AA(sx2, sy2, sz2, incV3, true);
                this._SA(sx2, sy2, sz2, incV4, false);
                break;
            default:
                this._AS(sx2, sy2, sz2, incV1, false);
                this._SS(sx2, sy2, sz2, incV2, false);
                this._AS(sx2, sy2, sz2, incV3, true);
                this._SS(sy2, sx2, sz2, incV4, false);
        }
        Method.addArray(c12, incV1, incV1, 0, 0, 0, 3);
        Method.addArray(c12, incV2, incV2, 0, 0, 0, 3);
        Method.addArray(c12, incV3, incV3, 0, 0, 0, 3);
        Method.addArray(c12, incV4, incV4, 0, 0, 0, 3);
        const clipper = this.clipper;
        clipper.w = refWH[0];
        clipper.h = refWH[1];
        clipper.numVertices = 0;
        clipper.numTmpVertices = 0;
        let vertex = clipper.vertices[clipper.numVertices++].elements;
        Method.setIncidentVertex(vertex, Method.multiplyArray(incV1, refX), Method.multiplyArray(incV1, refY), incV1[0], incV1[1], incV1[2]);
        vertex = clipper.vertices[clipper.numVertices++].elements;
        Method.setIncidentVertex(vertex, Method.multiplyArray(incV2, refX), Method.multiplyArray(incV2, refY), incV2[0], incV2[1], incV2[2]);
        vertex = clipper.vertices[clipper.numVertices++].elements;
        Method.setIncidentVertex(vertex, Method.multiplyArray(incV3, refX), Method.multiplyArray(incV3, refY), incV3[0], incV3[1], incV3[2]);
        vertex = clipper.vertices[clipper.numVertices++].elements;
        Method.setIncidentVertex(vertex, Method.multiplyArray(incV4, refX), Method.multiplyArray(incV4, refY), incV4[0], incV4[1], incV4[2]);
        clipper.clip();
        clipper.reduce();
        const nm = this._bv2;
        if (swapped) {
            nm[0] = refNom[0]; nm[1] = refNom[1]; nm[2] = refNom[2];
        } else {
            nm[0] = -refNom[0]; nm[1] = -refNom[1]; nm[2] = -refNom[2];
        }
        this.setNormal(result, nm[0], nm[1], nm[2]);
        let _g = 0, _g1 = clipper.numVertices;
        while (_g < _g1) {
            const i = _g++;
            const v = clipper.vertices[i].elements;
            const clpV = Method.copyElements(v, this._bv2, 2, 0, 3);
            Method.addArray(c1, clpV, clpV, 0, 0, 0, 3);
            const vertToCent = Method.subArray(refCent, clpV, this._bv3, 0, 0, 0, 3);
            const depth = Method.multiplyArray(vertToCent, refNom, 0, 0, 3);
            const refDir = Method.scaleArray(refNom, depth, this._bv5, 0, 0, 3);
            const vertOnFc = Method.addArray(clpV, refDir, this._bv6, 0, 0, 0, 3);
            if (depth > -CPT) {
                if (swapped) {
                    this.addPoint(result, clpV[0], clpV[1], clpV[2], vertOnFc[0], vertOnFc[1], vertOnFc[2], depth, i);
                } else {
                    this.addPoint(result, vertOnFc[0], vertOnFc[1], vertOnFc[2], clpV[0], clpV[1], clpV[2], depth, i);
                }
            }
        }
    }
}

export { BoxBoxDetector };