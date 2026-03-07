import Shape from "../shape/shape";

/**
 * AABB包围盒检测回调抽象类。
 * 用于物理引擎中AABB重叠检测的回调处理，定义了检测到相交Shape时的统一处理接口
 */
export default abstract class AabbTestCallback {

    /**
     * AABB检测到相交Shape时的回调处理方法（抽象方法，必须实现）。
     * 每次检测到一个Shape与查询范围的AABB相交时，该方法会被调用
     * @param {Shape} shape 与查询AABB相交的Shape实例
     * @returns {void}
     */
    public abstract process(shape: Shape): void;

}

export { AabbTestCallback };