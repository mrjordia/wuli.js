import Vec3 from "../../common/vec3";
import Method from "../../common/method";

/**
 * GJK（Gilbert-Johnson-Keerthi）算法缓存类。
 * 用于存储GJK算法迭代过程中的关键缓存数据，优化算法迭代效率；
 * 核心作用：
 * 1. 缓存上一次迭代计算出的最近方向向量，作为下一次迭代的初始搜索方向；
 * 2. 避免每次迭代都从默认方向开始搜索，减少算法迭代次数，提升碰撞检测性能；
 * GJK算法是用于检测两个凸几何体是否碰撞的经典算法，该类是算法性能优化的辅助数据结构。
 */
export default class GjkCache {
    /** 
     * 上一次迭代的最近方向向量（缓存核心数据）。
     * 存储GJK算法上一次迭代中计算出的指向原点的最近方向向量，
     * 作为下一次迭代的初始搜索方向，加速算法收敛。
     */
    public prevClosestDir = new Vec3();

    /**
     * 清空GJK缓存数据，重置为初始状态。
     * 核心逻辑：
     * 1. 将缓存的最近方向向量（prevClosestDir）的所有元素置为0；
     * 2. 重置缓存状态，保证下一次算法迭代从默认初始方向开始；
     * 3. 通常在每次完整的GJK碰撞检测开始前调用，避免历史缓存干扰。
     * @returns {void}
     */
    public clear(): void {
        // 将prevClosestDir向量的x/y/z分量（索引0-2）全部填充为0
        Method.fillValue(this.prevClosestDir.elements, 0, 2, 0);
    }
}

export { GjkCache };