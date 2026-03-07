import RayCastHit from "../shape/ray-cast-hit";
import Shape from "../shape/shape";
import { Nullable } from "./nullable";
import RayCastCallback from "./ray-cast-callback";
import Vec3 from "./vec3";

/**
 * 射线检测最近命中回调类。
 * 继承射线检测回调接口，专门用于筛选射线检测中**最近的相交形状**；
 * 自动对比所有相交形状的命中比例（fraction），仅保留距离射线起点最近的命中结果。
 */
export default class RayCastClosest extends RayCastCallback {
    /** 最近命中点的世界坐标（初始为(0,0,0)） */
    public position = new Vec3(0, 0, 0);
    /** 最近命中点的法向量（初始为(0,0,0)） */
    public normal = new Vec3(0, 0, 0);
    /** 最近命中的形状实例（未命中时为null） */
    public shape: Nullable<Shape>;
    /** 最近命中的比例（0~1，0=射线起点，1=射线终点；初始为1表示未命中） */
    public fraction = 1;
    /** 是否命中任意形状（true=有命中，false=无命中） */
    public hit = false;

    /**
     * 重置所有命中状态（复用实例前调用）。
     * 清空形状引用、重置命中比例为1、归零位置/法向量、标记未命中；
     * 避免残留上一次检测结果，保证每次检测的独立性。
     */
    public clear(): void {
        this.shape = null;
        this.fraction = 1;
        let es = this.position.elements;
        es[0] = es[1] = es[2] = 0;
        es = this.normal.elements;
        es[0] = es[1] = es[2] = 0;
        this.hit = false;
    }

    /**
     * 处理单次射线相交结果（核心筛选逻辑）。
     * 核心逻辑：
     * 1. 对比本次命中比例与已保存的最近比例（fraction）；
     * 2. 若本次更近（fraction更小），则更新最近命中状态（形状、位置、法向量、比例）；
     * 3. 标记hit为true，表示至少命中一个形状；
     * 注意：该方法会被射线检测逻辑多次调用（每相交一个形状调用一次）。
     * @param {Shape} shape - 当前相交的形状实例
     * @param {RayCastHit} hit - 本次相交的详细信息（包含命中比例、位置、法向量）
     * @returns {void}
     */
    public process(shape: Shape, hit: RayCastHit): void {
        if (hit.fraction < this.fraction) {
            this.shape = shape;
            this.hit = true;
            this.fraction = hit.fraction;
            let _this = this.position.elements;
            let v = hit.position.elements;
            _this[0] = v[0]; _this[1] = v[1]; _this[2] = v[2];
            _this = this.normal.elements;
            v = hit.normal.elements;
            _this[0] = v[0]; _this[1] = v[1]; _this[2] = v[2];
        }
    }
}

export { RayCastClosest };