import RayCastHit from "../shape/ray-cast-hit";
import Shape from "../shape/shape";

/**
 * 射线检测回调抽象类。
 * 物理引擎射线检测的核心回调接口，定义射线与形状相交后的自定义处理逻辑；
 * 需由业务层实现具体的process方法，支持处理单次/多次射线相交结果。
 */
export default abstract class RayCastCallback {

    /**
     * 射线相交处理抽象方法（必须实现）。
     * 核心用途：
     * 1. 单次射线检测：处理首个相交的形状（如射线拾取物体）；
     * 2. 多次射线检测：遍历所有相交形状并按需过滤（如射线穿透多个物体）；
     * 注意：hit参数为可选，未命中时可能为undefined，实现时需做空值判断。
     * @param {Shape} shape - 与射线相交的形状实例（如球体、地形、凸包等）
     * @param {RayCastHit} [hit] - 可选，射线相交详情（包含相交点、法向量、命中比例等）
     * @returns {void}
     */
    public abstract process(shape: Shape, hit?: RayCastHit): void;

}

export { RayCastCallback };