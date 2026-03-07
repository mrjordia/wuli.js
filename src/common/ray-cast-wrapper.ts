import Vec3 from "./vec3";
import BroadPhaseProxyCallback from "../broad-phase/broad-phase-proxy-callback";
import RayCastHit from "../shape/ray-cast-hit";
import PhysicsProxy from "../broad-phase/physics-proxy";
import RayCastCallback from "./ray-cast-callback";

/**
 * 射线检测宽相位回调包装类。
 * 物理引擎宽相位阶段的射线检测封装，遍历宽相位筛选出的物理代理，
 * 对每个代理内的形状执行高精度射线相交检测，并触发自定义回调处理命中结果。
 */
export default class RayCastWrapper extends BroadPhaseProxyCallback {
    /** 射线检测命中结果容器（复用该实例避免频繁创建） */
    public rayCastHit = new RayCastHit();
    /** 射线起点坐标（世界坐标系） */
    public begin = new Vec3();
    /** 射线终点坐标（世界坐标系） */
    public end = new Vec3();
    /** 射线命中后的自定义回调（可选，未设置时不执行后续处理） */
    public callback?: RayCastCallback;

    /**
     * 处理单个物理代理的射线检测。
     * 核心逻辑：
     * 1. 从代理中获取形状实例（假设proxy.userData为非空Shape）；
     * 2. 调用形状几何体的高精度射线检测方法（rayCast）；
     * 3. 检测命中时触发自定义回调，传递形状和命中详情；
     * 注意：需提前设置begin/end射线起止点，否则检测结果无效。
     * @param {PhysicsProxy} proxy - 宽相位筛选出的物理代理实例
     * @returns {void}
     */
    public process(proxy: PhysicsProxy): void {
        const shape = proxy.userData!;
        if (shape.geometry.rayCast(this.begin, this.end, shape.transform, this.rayCastHit)) {
            this.callback!.process(shape, this.rayCastHit);
        }
    }
}

export { RayCastWrapper };