import { CONSTANT } from "../../constant";
import ManifoldPoint from "./manifold-point";
import Vec3 from "../../common/vec3";
import Transform from "../../common/transform";

/**
 * 碰撞流形类。
 * 用于存储两个碰撞物体之间的完整接触信息，包括接触法向/切向/副法向基向量、所有接触点（ManifoldPoint）集合，
 *              并提供接触数据的清空、基向量构建、深度和位置更新等核心方法，是物理引擎中碰撞响应计算的核心数据结构
 */
export default class Manifold {
    /**
     * 碰撞接触法向向量（世界坐标系）。
     * 长度为3的浮点数组，格式 [x, y, z]，表示两个碰撞物体接触区域的主法向方向，单位向量，指向从物体2到物体1的方向
     */
    public normal = new Float64Array(3);

    /**
     * 碰撞接触切向向量（世界坐标系）。
     * 长度为3的浮点数组，格式 [x, y, z]，与法向垂直的切向单位向量，构成接触基的第二个轴
     */
    public tangent = new Float64Array(3);

    /**
     * 碰撞接触副法向向量（世界坐标系）。
     * 长度为3的浮点数组，格式 [x, y, z]，与法向、切向都垂直的副法向单位向量，构成接触基的第三个轴（法向×切向）
     */
    public binormal = new Float64Array(3);

    /**
     * 当前有效接触点数量。
     * 范围 0 ~ SETTING_MAX_MANIFOLD_POINTS，标识points数组中实际有效的接触点个数
     * @default 0
     */
    public numPoints = 0;

    /**
     * 碰撞接触点数组。
     * 预分配固定长度的ManifoldPoint数组，长度由CONSTANT.SETTING_MAX_MANIFOLD_POINTS指定，
     *              存储该碰撞流形下的所有接触点信息，实际有效数量由numPoints标识
     */
    public points: Array<ManifoldPoint> = new Array(CONSTANT.SETTING_MAX_MANIFOLD_POINTS);

    /**
     * 构造函数：初始化接触点数组。
     * 创建Manifold实例时，自动初始化points数组，为每个元素创建ManifoldPoint实例，避免运行时动态创建
     */
    constructor() {
        let _g = 0;
        const _g1 = CONSTANT.SETTING_MAX_MANIFOLD_POINTS;
        while (_g < _g1) this.points[_g++] = new ManifoldPoint();
    }

    /**
     * 清空碰撞流形的所有接触点数据。
     * 将所有有效接触点的坐标、深度、冲量、状态等数据重置为初始值，并将有效接触点数量置0，
     *              保留数组内存避免频繁GC，仅重置数据内容
     */
    public clear(): void {
        let _g = 0;
        const _g1 = this.numPoints;
        while (_g < _g1) {
            const mp = this.points[_g++];
            const localPos1 = mp.localPos1, localPos2 = mp.localPos2, relPos1 = mp.relPos1, relPos2 = mp.relPos2, pos1 = mp.pos1, pos2 = mp.pos2;
            localPos1[0] = localPos1[1] = localPos1[2] = 0;
            localPos2[0] = localPos2[1] = localPos2[2] = 0;
            relPos1[0] = relPos1[1] = relPos1[2] = 0;
            relPos2[0] = relPos2[1] = relPos2[2] = 0;
            pos1[0] = pos1[1] = pos1[2] = 0;
            pos2[0] = pos2[1] = pos2[2] = 0;
            mp.depth = 0;
            const imp = mp.impulse.elements;
            imp[0] = imp[1] = imp[2] = imp[3] = imp[4] = imp[5] = imp[6] = 0;
            mp.warmStarted = false;
            mp.disabled = false;
            mp.id = -1;
        }
        this.numPoints = 0;
    }

    /**
     * 基于输入法向构建接触基向量（法向、切向、副法向）。
     * 算法原理：
     *              1. 将输入法向赋值给当前流形的normal属性
     *              2. 找到法向中最小分量的轴，构造垂直的切向向量（保证数值稳定性）
     *              3. 通过法向与切向的叉积计算副法向，形成正交的接触基
     *              所有向量最终均为单位向量，构成右手坐标系
     * @param {Vec3} _normal 输入法向向量 - 碰撞接触的主法向（Vec3实例），用于推导切向和副法向
     */
    public buildBasis(_normal: Vec3): void {
        const tn = this.normal, tt = this.tangent, tb = this.binormal;
        const normal = _normal.elements;
        tn[0] = normal[0]; tn[1] = normal[1]; tn[2] = normal[2];
        const nx = normal[0], ny = normal[1], nz = normal[2];
        const nx2 = nx * nx, ny2 = ny * ny, nz2 = nz * nz;
        let tx: number, ty: number, tz: number;
        let bx: number, by: number, bz: number;
        if (nx2 < ny2) {
            if (nx2 < nz2) {
                const invL = 1 / Math.sqrt(ny2 + nz2);
                tx = 0; ty = -nz * invL; tz = ny * invL;
                bx = ny * tz - nz * ty; by = -nx * tz; bz = nx * ty;
            } else {
                const invL = 1 / Math.sqrt(nx2 + ny2);
                tx = -ny * invL; ty = nx * invL; tz = 0;
                bx = -nz * ty; by = nz * tx; bz = nx * ty - ny * tx;
            }
        } else if (ny2 < nz2) {
            const invL = 1 / Math.sqrt(nx2 + nz2);
            tx = nz * invL; ty = 0; tz = -nx * invL;
            bx = ny * tz; by = nz * tx - nx * tz; bz = -ny * tx;
        } else {
            const invL = 1 / Math.sqrt(nx2 + ny2);
            tx = -ny * invL; ty = nx * invL; tz = 0;
            bx = -nz * ty; by = nz * tx; bz = nx * ty - ny * tx;
        }
        tt[0] = tx; tt[1] = ty; tt[2] = tz;
        tb[0] = bx; tb[1] = by; tb[2] = bz;
    }

    /**
     * 更新所有接触点的穿透深度和世界坐标。
     * 核心逻辑：
     *              1. 将接触点的局部坐标通过物体变换矩阵转换为相对质心的坐标（relPos1/relPos2）
     *              2. 结合物体的世界平移量，计算接触点的世界坐标（pos1/pos2）
     *              3. 通过世界坐标差值与法向的点积，计算并更新接触点的穿透深度（depth）
     *              穿透深度公式：depth = - (pos1 - pos2) · normal
     * @param {Transform} _tf1 第一个物体的变换信息 - 包含物体1的平移和旋转矩阵（Transform实例）
     * @param {Transform} _tf2 第二个物体的变换信息 - 包含物体2的平移和旋转矩阵（Transform实例）
     */
    public updateDepthsAndPositions(_tf1: Transform, _tf2: Transform): void {
        const tf1 = _tf1.elements, tf2 = _tf2.elements;
        const tn = this.normal;
        let _g = 0, _g1 = this.numPoints;
        while (_g < _g1) {
            const p = this.points[_g++];
            const relPos1 = p.relPos1, localPos1 = p.localPos1, pos1 = p.pos1, relPos2 = p.relPos2, localPos2 = p.localPos2, pos2 = p.pos2;
            relPos1[0] = tf1[3] * localPos1[0] + tf1[4] * localPos1[1] + tf1[5] * localPos1[2];
            relPos1[1] = tf1[6] * localPos1[0] + tf1[7] * localPos1[1] + tf1[8] * localPos1[2];
            relPos1[2] = tf1[9] * localPos1[0] + tf1[10] * localPos1[1] + tf1[11] * localPos1[2];
            relPos2[0] = tf2[3] * localPos2[0] + tf2[4] * localPos2[1] + tf2[5] * localPos2[2];
            relPos2[1] = tf2[6] * localPos2[0] + tf2[7] * localPos2[1] + tf2[8] * localPos2[2];
            relPos2[2] = tf2[9] * localPos2[0] + tf2[10] * localPos2[1] + tf2[11] * localPos2[2];
            pos1[0] = relPos1[0] + tf1[0]; pos1[1] = relPos1[1] + tf1[1]; pos1[2] = relPos1[2] + tf1[2];
            pos2[0] = relPos2[0] + tf2[0]; pos2[1] = relPos2[1] + tf2[1]; pos2[2] = relPos2[2] + tf2[2];
            const diffX = pos1[0] - pos2[0], diffY = pos1[1] - pos2[1], diffZ = pos1[2] - pos2[2];
            p.depth = -(diffX * tn[0] + diffY * tn[1] + diffZ * tn[2]);
        }
    }
}

export { Manifold };