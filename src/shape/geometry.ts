import Aabb from "../common/aabb";
import Transform from "../common/transform";
import Vec3 from "../common/vec3";
import { GEOMETRY_TYPE } from "../constant";
import RayCastHit from "./ray-cast-hit";

/**
 * 几何体抽象基类。
 * 物理引擎中所有碰撞几何体的核心抽象层，定义了几何体的通用接口和基础属性，
 * 包含质量计算、AABB计算、射线检测三大核心能力，是Shape类的碰撞几何载体。
 * 所有具体几何体（球体/盒型/胶囊体等）都需继承此类并实现抽象方法。
 */
export default abstract class Geometry {
    /** 几何体类型标识（如SPHERE/BOX/CAPSULE等），只读不可修改 */
    public readonly type: GEOMETRY_TYPE;
    /** 几何体体积（m³），用于结合密度计算质量 */
    public volume = 0;
    /** 
     * 惯性张量系数（3x3矩阵，Float64Array存储，按行优先排列）。
     * 惯性张量的基础系数，不同几何体有不同的系数矩阵，
     * 结合质量和尺寸可计算出最终的惯性张量，用于刚体旋转运动的计算。
     * 存储格式：[00,01,02, 10,11,12, 20,21,22]（对应3x3矩阵的9个元素）
     */
    public inertiaCoeff = new Float64Array(9);
    /** 预计算的AABB缓存（用于临时计算，避免频繁创建新Aabb实例） */
    public aabbComputed = new Aabb();

    /**
     * 构造函数。
     * 初始化几何体类型标识，所有子类需调用此构造函数指定具体类型。
     * @param {GEOMETRY_TYPE} type - 几何体类型
     */
    constructor(type: GEOMETRY_TYPE) {
        this.type = type;
    }

    /**
     * 更新几何体的质量相关数据。
     * 抽象方法，子类需实现以计算当前几何体的体积和惯性张量系数：
     * 1. 计算几何体的体积（赋值给volume属性）；
     * 2. 计算并填充惯性张量系数矩阵（inertiaCoeff）；
     * 该方法是刚体质量计算的核心依赖，修改几何体尺寸后需调用。
     */
    public abstract updateMass(): void;

    /**
     * 计算几何体在指定变换下的AABB包围盒。
     * 抽象方法，子类需实现以适配不同几何体的AABB计算逻辑：
     * 根据几何体的本地形状和传入的世界变换，计算轴对齐的包围盒，
     * 结果写入传入的aabb参数（避免内存分配），用于宽相位碰撞检测。
     * @param {Aabb} aabb - 输出参数，计算后的AABB会写入此对象
     * @param {Transform} tf - 几何体的世界变换（位置+旋转）
     */
    public abstract computeAabb(aabb: Aabb, tf: Transform): void;

    /**
     * 本地坐标系下的射线检测（子类可重写）。
     * 基础实现返回false，子类需根据自身几何形状重写此方法，
     * 实现本地坐标系下的精准射线检测逻辑，命中时需填充hit对象的位置、法向、距离等信息。
     * @param {number} beginX - 射线起点X（本地坐标系）
     * @param {number} beginY - 射线起点Y（本地坐标系）
     * @param {number} beginZ - 射线起点Z（本地坐标系）
     * @param {number} endX - 射线终点X（本地坐标系）
     * @param {number} endY - 射线终点Y（本地坐标系）
     * @param {number} endZ - 射线终点Z（本地坐标系）
     * @param {RayCastHit} hit - 输出参数，命中信息会写入此对象
     * @returns {boolean} 是否命中（true=命中，false=未命中）
     */
    public rayCastLocal(beginX: number, beginY: number, beginZ: number, endX: number, endY: number, endZ: number, hit: RayCastHit): boolean {
        return false;
    }

    /**
     * 世界坐标系下的射线检测（通用实现，无需子类重写）。
     * 通用射线检测逻辑，核心步骤：
     * 1. 将世界坐标系的射线转换为几何体本地坐标系；
     * 2. 调用rayCastLocal执行本地射线检测；
     * 3. 若命中，将本地坐标系的命中结果转换回世界坐标系；
     * 该方法封装了坐标变换逻辑，子类只需实现rayCastLocal即可。
     * @param {Vec3} _begin - 射线起点（世界坐标系）
     * @param {Vec3} _end - 射线终点（世界坐标系）
     * @param {Transform} _transform - 几何体的世界变换
     * @param {RayCastHit} hit - 输出参数，命中信息会写入此对象
     * @returns {boolean} 是否命中（true=命中，false=未命中）
     */
    public rayCast(_begin: Vec3, _end: Vec3, _transform: Transform, hit: RayCastHit): boolean {
        const begin = _begin.elements;
        const end = _end.elements;
        const tf = _transform.elements;
        const hitPos = hit.position.elements;
        const hitNormal = hit.normal.elements;

        const tf0 = tf[0], tf1 = tf[1], tf2 = tf[2];
        const tf3 = tf[3], tf4 = tf[4], tf5 = tf[5];
        const tf6 = tf[6], tf7 = tf[7], tf8 = tf[8];
        const tf9 = tf[9], tf10 = tf[10], tf11 = tf[11];

        // 步骤1：世界坐标系射线起点 → 本地坐标系（减去平移，乘以旋转逆矩阵）
        const bx = begin[0] - tf0, by = begin[1] - tf1, bz = begin[2] - tf2;
        const ex = end[0] - tf0, ey = end[1] - tf1, ez = end[2] - tf2;

        const blx = tf3 * bx + tf6 * by + tf9 * bz;
        const bly = tf4 * bx + tf7 * by + tf10 * bz;
        const blz = tf5 * bx + tf8 * by + tf11 * bz;
        const elx = tf3 * ex + tf6 * ey + tf9 * ez;
        const ely = tf4 * ex + tf7 * ey + tf10 * ez;
        const elz = tf5 * ex + tf8 * ey + tf11 * ez;

        // 步骤2：调用本地射线检测
        if (!this.rayCastLocal(blx, bly, blz, elx, ely, elz, hit)) {
            return false;
        }

        // 步骤3：本地坐标系命中结果 → 世界坐标系（乘以旋转矩阵，加上平移）
        const lpx = hitPos[0], lpy = hitPos[1], lpz = hitPos[2];
        const lnx = hitNormal[0], lny = hitNormal[1], lnz = hitNormal[2];

        hitPos[0] = tf3 * lpx + tf4 * lpy + tf5 * lpz + tf0;
        hitPos[1] = tf6 * lpx + tf7 * lpy + tf8 * lpz + tf1;
        hitPos[2] = tf9 * lpx + tf10 * lpy + tf11 * lpz + tf2;

        hitNormal[0] = tf3 * lnx + tf4 * lny + tf5 * lnz;
        hitNormal[1] = tf6 * lnx + tf7 * lny + tf8 * lnz;
        hitNormal[2] = tf9 * lnx + tf10 * lny + tf11 * lnz;

        return true;
    }
}

export { Geometry };