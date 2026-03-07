import Aabb from "./aabb";
import BroadPhaseProxyCallback from "../broad-phase/broad-phase-proxy-callback";
import PhysicsProxy from "../broad-phase/physics-proxy";
import AabbTestCallback from "./aabb-test-callback";

/**
 * AABB检测回调包装类。
 * 宽相位碰撞检测中，用于筛选与目标AABB相交的物理代理（PhysicsProxy），
 * 核心逻辑是逐一代理检测AABB重叠，并触发自定义回调处理相交的形状。
 */
export default class AabbTestWrapper extends BroadPhaseProxyCallback {
    /**
     * 目标检测AABB（待检测相交的轴对齐包围盒）。
     * 初始化为空AABB，需在检测前设置具体的min/max值（elements[0-5]对应xmin/ymin/zmin/xmax/ymax/zmax）。
     */
    public aabb = new Aabb();

    /**
     * AABB相交后的自定义回调函数。
     * 检测到代理AABB与目标AABB相交时触发，用于处理相交的形状（如收集结果、过滤逻辑）；
     * 未设置时不会执行任何后续处理。
     */
    public callback?: AabbTestCallback;

    /**
     * 处理单个物理代理的AABB相交检测。
     * 核心逻辑：
     * 1. 从代理中获取形状的AABB数据；
     * 2. 采用轴分离定理（SAT）检测两个AABB是否重叠（6个轴方向均不分离则相交）；
     * 3. 相交时调用自定义callback处理该形状；
     * 注意：假设proxy.userData为非空的形状实例，需保证代理数据合法性。
     * @param {PhysicsProxy} proxy - 待检测的物理代理（包含形状的AABB和用户数据）
     * @returns {void}
     */
    public process(proxy: PhysicsProxy): void {
        const shape = proxy.userData!;
        const se = shape.aabb.elements, ae = this.aabb.elements;
        // 轴分离定理：检测两个AABB在X/Y/Z轴上是否存在重叠
        if (se[0] < ae[3] && se[3] > ae[0] && se[1] < ae[4] && se[4] > ae[1] && se[2] < ae[5] && se[5] > ae[2]) {
            this.callback!.process(shape);
        }
    }
}

export { AabbTestWrapper };