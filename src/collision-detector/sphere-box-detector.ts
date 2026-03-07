import Detector from "./detector";
import DetectorResult from "./detector-result";
import SphereGeometry from '../shape/sphere-geometry';
import BoxGeometry from '../shape/box-geometry';
import Transform from "../common/transform";
import CachedDetectorData from "./cached-detector-data";

/**
 * 球体-盒子碰撞检测器类。
 * 专用于检测球体（SphereGeometry）与轴对齐盒子（BoxGeometry）之间碰撞的检测器，继承自通用碰撞检测器抽象类；
 * 核心逻辑分为两种场景：
 * 1. 球心在盒子内部：计算球心到盒子最近面的距离作为穿透深度；
 * 2. 球心在盒子外部：计算球心到盒子的最近点，判断距离是否小于球半径；
 * 支持通过swapped参数交换检测对象顺序（盒子-球体），自动适配法线方向和碰撞点坐标。
 */
export default class SphereBoxDetector extends Detector<SphereGeometry, BoxGeometry> {
    /**
     * 球体-盒子检测器构造函数。
     * 初始化父类Detector，传入swapped标记，用于自动调整法线方向和碰撞点坐标的存储顺序。
     * @param {boolean} swapped - 是否交换检测对象顺序（true=盒子-球体，false=球体-盒子）
     */
    constructor(swapped: boolean) {
        super(swapped);
    }

    /**
     * 球体-盒子碰撞检测具体实现。
     * 核心检测流程：
     * 1. 转换球心到盒子局部坐标系，判断球心是否在盒子内部；
     * 2. 内部场景：计算到最近面的距离和法线，写入碰撞结果；
     * 3. 外部场景：计算球心到盒子的最近点，判断距离是否小于球半径，若碰撞则计算法线和穿透深度；
     * 关键优化：添加微小偏移（1e-9）避免浮点精度问题导致的误判。
     * @param {DetectorResult} result - 碰撞检测结果容器，存储法线、碰撞点、穿透深度等数据
     * @param {SphereGeometry} geom1 - 球体几何对象（若swapped为true则为盒子，false则为球体）
     * @param {BoxGeometry} geom2 - 盒子几何对象（若swapped为true则为球体，false则为盒子）
     * @param {Transform} _tf1 - 第一个对象的变换矩阵（位置、旋转、缩放）
     * @param {Transform} _tf2 - 第二个对象的变换矩阵（位置、旋转、缩放）
     * @param {CachedDetectorData} cachedData - 检测器缓存数据（当前算法未使用，预留扩展）
     * @returns {void}
     */
    protected detectImpl(result: DetectorResult, geom1: SphereGeometry, geom2: BoxGeometry, _tf1: Transform, _tf2: Transform, cachedData: CachedDetectorData): void {
        // 提取变换矩阵元素（列主序，tf1=球体变换，tf2=盒子变换）
        const tf1 = _tf1.elements, tf2 = _tf2.elements;
        const b = geom2;
        // 禁用增量检测，每次检测重新计算碰撞点
        result.incremental = false;
        // 提取盒子尺寸参数
        const bs = b.size;
        let ex = bs[0], ey = bs[1], ez = bs[2];
        let nex = -ex, ney = -ey, nez = -ez;
        // 提取球体半径
        const r = geom1.radius;
        // 计算球心相对于盒子中心的偏移向量（世界坐标系）
        const bsx = tf1[0] - tf2[0], bsy = tf1[1] - tf2[1], bsz = tf1[2] - tf2[2];
        // 将偏移向量转换到盒子局部坐标系（通过盒子变换矩阵的逆变换）
        const bix = tf2[3] * bsx + tf2[6] * bsy + tf2[9] * bsz, biy = tf2[4] * bsx + tf2[7] * bsy + tf2[10] * bsz, biz = tf2[5] * bsx + tf2[8] * bsy + tf2[11] * bsz;

        // ========== 场景1：球心在盒子内部 ==========
        if (nex < bix && ex > bix && ney < biy && ey > biy && nez < biz && ez > biz) {
            // 计算球心到盒子各面的垂直距离（取绝对值）
            let bfx = bix < 0 ? -bix : bix, bfy = biy < 0 ? -biy : biy, bfz = biz < 0 ? -biz : biz;
            // 转换为球心到盒子外表面的距离（盒子半长 - 球心到中心的距离）
            bfx = ex - bfx; bfy = ey - bfy; bfz = ez - bfz;
            let nbx: number, nby: number, nbz: number;
            const distX = bfx, distY = bfy, distZ = bfz;
            let depth: number;
            let projectionMaskX: number, projectionMaskY: number, projectionMaskZ: number;
            // 找到球心最近的盒子表面，确定碰撞法线方向
            if (distX < distY) {
                if (distX < distZ) {
                    // 最近面为X轴方向
                    nbx = bix > 0 ? 1 : -1; nby = 0; nbz = 0;
                    projectionMaskX = 0; projectionMaskY = 1; projectionMaskZ = 1;
                    depth = distX;
                } else {
                    // 最近面为Z轴方向
                    nbx = 0; nby = 0; nbz = biz > 0 ? 1 : -1;
                    projectionMaskX = 1; projectionMaskY = 1; projectionMaskZ = 0;
                    depth = distZ;
                }
            } else if (distY < distZ) {
                // 最近面为Y轴方向
                nbx = 0; nby = biy > 0 ? 1 : -1; nbz = 0;
                projectionMaskX = 1; projectionMaskY = 0; projectionMaskZ = 1;
                depth = distY;
            } else {
                // 最近面为Z轴方向
                nbx = 0; nby = 0; nbz = biz > 0 ? 1 : -1;
                projectionMaskX = 1; projectionMaskY = 1; projectionMaskZ = 0;
                depth = distZ;
            }
            // 计算碰撞点在盒子局部坐标系的位置
            const baseX = projectionMaskX * bix, baseY = projectionMaskY * biy, baseZ = projectionMaskZ * biz;
            let pix = nbx * ex, piy = nby * ey, piz = nbz * ez;
            pix += baseX; piy += baseY; piz += baseZ;
            // 将局部坐标转换为世界坐标
            const cpx = tf2[3] * pix + tf2[4] * piy + tf2[5] * piz, cpy = tf2[6] * pix + tf2[7] * piy + tf2[8] * piz, cpz = tf2[9] * pix + tf2[10] * piy + tf2[11] * piz;
            // 将局部法线转换为世界坐标系法线
            const nx = tf2[3] * nbx + tf2[4] * nby + tf2[5] * nbz, ny = tf2[6] * nbx + tf2[7] * nby + tf2[8] * nbz, nz = tf2[9] * nbx + tf2[10] * nby + tf2[11] * nbz;
            // 设置碰撞法线（自动处理swapped标记）
            this.setNormal(result, nx, ny, nz);
            // 计算球体表面和盒子表面的碰撞点世界坐标
            const pos1X = tf1[0] + nx * -r, pos1Y = tf1[1] + ny * -r, pos1Z = tf1[2] + nz * -r;
            const pos2X = tf2[0] + cpx, pos2Y = tf2[1] + cpy, pos2Z = tf2[2] + cpz;
            // 添加碰撞点到结果，穿透深度为球心到盒子表面的距离
            this.addPoint(result, pos1X, pos1Y, pos1Z, pos2X, pos2Y, pos2Z, depth, 0);
            return;
        }

        // ========== 场景2：球心在盒子外部 ==========
        // 调整盒子尺寸（减去微小偏移），避免浮点精度导致的边界误判
        ex -= 1e-9; ey -= 1e-9; ez -= 1e-9;
        nex += 1e-9; ney += 1e-9; nez += 1e-9;
        // 计算球心在盒子局部坐标系中投影到盒子表面的最近点
        let pix = bix < ex ? bix : ex, piy = biy < ey ? biy : ey, piz = biz < ez ? biz : ez;
        if (!(pix > nex)) {
            pix = nex;
        }
        if (!(piy > ney)) {
            piy = ney;
        }
        if (!(piz > nez)) {
            piz = nez;
        }
        // 计算球心到最近点的向量（局部坐标系）
        let psx = bix - pix, psy = biy - piy, psz = biz - piz;
        // 计算向量长度的平方，判断是否碰撞（距离平方 < 半径平方）
        let dist = psx * psx + psy * psy + psz * psz;
        if (dist >= r * r) {
            return; // 无碰撞，直接返回
        }
        // 计算实际距离
        dist = Math.sqrt(dist);
        // 将最近点从局部坐标系转换为世界坐标系
        let cpx = tf2[3] * pix + tf2[4] * piy + tf2[5] * piz, cpy = tf2[6] * pix + tf2[7] * piy + tf2[8] * piz, cpz = tf2[9] * pix + tf2[10] * piy + tf2[11] * piz;
        // 将球心到最近点的向量转换为世界坐标系
        let ptx = tf2[3] * psx + tf2[4] * psy + tf2[5] * psz, pty = tf2[6] * psx + tf2[7] * psy + tf2[8] * psz, ptz = tf2[9] * psx + tf2[10] * psy + tf2[11] * psz;
        // 计算向量长度，归一化得到碰撞法线
        let l = ptx * ptx + pty * pty + ptz * ptz;
        if (l > 0) {
            l = 1 / Math.sqrt(l);
        }
        const nx = ptx * l, ny = pty * l, nz = ptz * l;
        // 设置碰撞法线（自动处理swapped标记）
        this.setNormal(result, nx, ny, nz);
        // 计算球体表面和盒子表面的碰撞点世界坐标
        let pos1X = tf1[0] + nx * -r, pos1Y = tf1[1] + ny * -r, pos1Z = tf1[2] + nz * -r;
        let pos2X = tf2[0] + cpx, pos2Y = tf2[1] + cpy, pos2Z = tf2[2] + cpz;
        // 添加碰撞点到结果，穿透深度=球半径 - 实际距离
        this.addPoint(result, pos1X, pos1Y, pos1Z, pos2X, pos2Y, pos2Z, r - dist, 0);
    }
}

export { SphereBoxDetector };