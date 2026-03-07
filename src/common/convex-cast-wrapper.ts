import Vec3 from "./vec3";
import Transform from "./transform";
import BroadPhaseProxyCallback from "../broad-phase/broad-phase-proxy-callback";
import RayCastHit from "../shape/ray-cast-hit";
import GjkEpa from "../collision-detector/gjk-epa-detector/gjk-epa";
import { GEOMETRY_TYPE } from '../constant';
import PhysicsProxy from "../broad-phase/physics-proxy";
import ConvexGeometry from "../shape/convex-geometry";
import RayCastCallback from "./ray-cast-callback";

/**
 * 凸体扫略检测回调包装类。
 * 宽相位碰撞检测中，用于执行凸几何体的扫略检测（模拟凸体沿指定路径移动的碰撞检测），
 * 基于GJK-EPA算法实现高精度凸体相交检测，仅处理球体/胶囊体/凸包等凸几何体类型。
 */
export default class ConvexCastWrapper extends BroadPhaseProxyCallback {
    /**
     * 凸体扫略检测的命中结果。
     * 存储扫略检测的相交点、法向量、命中比例等核心结果；
     * 检测成功时会更新该对象的属性，供回调函数使用。
     */
    public rayCastHit = new RayCastHit();

    /**
     * 凸体初始变换（位置+旋转）。
     * 待扫略的凸体的起始变换矩阵，定义扫略的初始位置和朝向。
     */
    public begin = new Transform();

    /**
     * 凸体扫略的平移向量。
     * 凸体沿该向量方向移动（扫略路径），决定扫略的方向和距离。
     */
    public translation = new Vec3();

    /**
     * 零向量（优化性能，避免重复创建）。
     * 固定为(0,0,0)的向量，作为GJK-EPA算法的默认入参，减少内存分配。
     */
    public zero = new Vec3();

    /**
     * 扫略检测命中后的自定义回调。
     * 检测到凸体相交时触发，用于处理命中逻辑（如停止移动、播放碰撞效果）；
     * 未设置时不会执行任何后续处理。
     */
    public callback?: RayCastCallback;

    /**
     * 待扫略的凸几何体（必选）。
     * 需检测的凸体（如球体、胶囊体、凸包），检测前必须赋值，否则会触发空值错误。
     */
    public convex?: ConvexGeometry;

    /**
     * 处理单个物理代理的凸体扫略检测。
     * 核心逻辑：
     * 1. 过滤非凸几何体（仅处理球体/胶囊体/凸包类型）；
     * 2. 调用GJK-EPA算法执行凸体扫略检测；
     * 3. 检测成功时触发自定义回调，传递形状和命中结果；
     * 注意：假设proxy.userData为非空的形状实例，且convex已提前赋值。
     * @param {PhysicsProxy} proxy - 待检测的物理代理（包含凸几何体的形状数据）
     * @returns {void}
     */
    public process(proxy: PhysicsProxy): void {
        const shape = proxy.userData!;
        const type = shape.geometry.type;
        // 过滤仅处理球体/胶囊体/凸包等凸几何体（非凸体不支持GJK-EPA检测）
        if (type < GEOMETRY_TYPE.SPHERE || type > GEOMETRY_TYPE.CONVEX_HULL) {
            return;
        }
        // 执行GJK-EPA凸体扫略检测，命中则触发回调
        if (GjkEpa.instance.convexCast(this.convex!, shape.geometry as ConvexGeometry, this.begin, shape.transform, this.translation, this.zero, this.rayCastHit)) {
            this.callback!.process(shape, this.rayCastHit);
        }
    }
}

export { ConvexCastWrapper };