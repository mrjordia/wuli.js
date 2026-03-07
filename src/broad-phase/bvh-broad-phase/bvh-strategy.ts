import Method from "../../common/method";
import BvhNode from "./bvh-node";

/**
 * BVH（边界体积层次）树策略核心类。
 * 物理引擎中BVH树构建与更新的核心策略类，核心作用：
 * 1. 定义BVH节点插入策略，决定新叶子节点的最优插入位置；
 * 2. 实现BVH树节点分割算法，基于空间方差划分叶子节点集合；
 * 3. 计算节点插入的代价（Cost），优化BVH树的空间划分效率；
 * 核心特性：
 * - 支持多套插入策略（中心点距离/代价计算），可通过_insertionStrategy切换；
 * - 内置临时数组缓存（_tv0/_tv1等），避免频繁内存分配；
 * - 支持树平衡开关（balancingEnabled），适配不同性能/精度需求；
 * 主要应用场景：BVHBroadphase粗检测中BVH树的动态构建、节点插入、树结构优化。
 */
export default class BvhStrategy {
    private _insertionStrategy = 0;
    private _tv0 = new Float64Array(3);
    private _tv1 = new Float64Array(3);
    private _tv2 = new Float64Array(3);
    private _tb0 = new Float64Array(6);

    /**
     * 树平衡开关。
     * 是否启用BVH树的平衡优化：
     * - true：插入/分割节点时优化树的高度平衡，提升查询效率；
     * - false：关闭平衡优化，优先保证插入速度；
     * 初始值为false，适用于动态性低的场景。
     */
    public balancingEnabled = false;

    /**
     * 决定新叶子节点的插入位置。
     * 核心逻辑：根据_insertionStrategy选择不同的插入策略：
     * 1. 策略0（中心点距离）：
     *    - 计算新叶子节点中心点与当前节点左右子节点中心点的欧氏距离；
     *    - 选择距离更近的子节点作为插入目标；
     * 2. 策略1（代价计算）：
     *    - 计算插入到左右子节点的AABB扩展代价、新建分支的创建代价；
     *    - 选择总代价最小的方案作为插入决策；
     * 3. 无效策略：打印警告日志，默认返回-1。
     * @param {BvhNode} currentNode - 当前待判断的非叶子节点
     * @param {BvhNode} leaf - 待插入的新叶子节点
     * @returns {-1 | 0 | 1} - 插入决策结果：
     *   - -1：在当前节点下新建分支（代价策略专属）；
     *   - 0：插入到当前节点的左子节点（children[0]）；
     *   - 1：插入到当前节点的右子节点（children[1]）；
     */
    public decideInsertion(currentNode: BvhNode, leaf: BvhNode): -1 | 0 | 1 {
        const le = leaf.size;
        switch (this._insertionStrategy) {
            case 0:
                const center = Method.addArray(le, le, this._tv0, 0, 3, 0, 3);
                const c1 = currentNode.children[0]!.size, c2 = currentNode.children[1]!.size;
                const diff1 = Method.addArray(c1, c1, this._tv1, 0, 3, 0, 3);
                const diff2 = Method.addArray(c2, c2, this._tv2, 0, 3, 0, 3);
                Method.subArray(diff1, center, diff1, 0, 0, 0, 3);
                Method.subArray(diff2, center, diff2, 0, 0, 0, 3);
                const l1 = Method.multiplyArray(diff1, diff1, 0, 0, 3);
                const l2 = Method.multiplyArray(diff2, diff2, 0, 0, 3);
                return l1 < l2 ? 0 : 1;
            case 1:
                const c11 = currentNode.children[0]!, c21 = currentNode.children[1]!;
                const c11e = c11.size, c21e = c21.size, ne = currentNode.size;
                const ey = ne[4] - ne[1], ez = ne[5] - ne[2];
                const comb = Method.boxUnionBox(ne, le, this._tb0);
                const ey1 = comb[4] - comb[1], ez1 = comb[5] - comb[2];
                const newArea = ((comb[3] - comb[0]) * (ey1 + ez1) + ey1 * ez1) * 2;
                const creatingCost = newArea * 2;
                const incrementalCost = (newArea - ((ne[3] - ne[0]) * (ey + ez) + ey * ez) * 2) * 2;
                const descendingCost1 = this._getDescendingCost(c11, c11e, le, comb, incrementalCost);
                const descendingCost2 = this._getDescendingCost(c21, c21e, le, comb, incrementalCost);
                if (creatingCost < descendingCost1) {
                    if (creatingCost < descendingCost2) {
                        return -1;
                    } else {
                        return 1;
                    }
                } else if (descendingCost1 < descendingCost2) {
                    return 0;
                } else {
                    return 1;
                }
            default:
                console.log("invalid BVH insertion strategy: " + this._insertionStrategy);
                return -1;
        }
    }

    /**
     * 分割叶子节点集合（BVH树构建核心）。
     * 基于空间方差的节点分割算法，核心逻辑：
     * 1. 计算叶子节点集合的中心点均值（centerMean）；
     * 2. 计算各轴（x/y/z）的方差，选择方差最大的轴作为分割轴；
     * 3. 基于分割轴的均值，使用双指针法将叶子节点划分为左右两部分；
     * 4. 返回分割点索引，用于构建BVH树的左右子节点；
     * 核心目的：使分割后的左右子节点AABB重叠最小，提升BVH查询效率。
     * @param {BvhNode[]} leaves - 待分割的叶子节点数组
     * @param {number} from - 分割起始索引（包含）
     * @param {number} until - 分割结束索引（不包含）
     * @returns {number} - 分割点索引（左半部分到该索引，右半部分从该索引开始）
     */
    public splitLeaves(leaves: BvhNode[], from: number, until: number): number {
        const invN = 1.0 / (until - from);
        const centerMean = Method.fillValue(this._tv0, 0, 2, 0);
        let _g = from;
        while (_g < until) {
            const leaf = leaves[_g++];
            const tmp = leaf.tmp, size = leaf.size;
            Method.addArray(size, size, tmp, 3, 0, 0, 3);
            Method.addArray(centerMean, tmp, centerMean, 0, 0, 0, 3);
        }
        Method.scaleArray(centerMean, invN, centerMean, 0, 0, 3);
        const variance = Method.fillValue(this._tv1, 0, 2, 0);
        let _g1 = from;
        while (_g1 < until) {
            const leaf = leaves[_g1++];
            const tmp = leaf.tmp;
            const diff = Method.subArray(tmp, centerMean, this._tv2, 0, 0, 0, 3);
            Method.multiplyArray(diff, diff, 0, 0, 3, diff, 0);
            Method.addArray(variance, diff, variance, 0, 0, 0, 3);
        }
        const lr = Method.setElements(this._tv2, 0, from, until - 1, 0);
        if (variance[0] > variance[1]) {
            if (variance[0] > variance[2]) {
                this._setLeavesDir(centerMean[0], lr, leaves, 0, 0);
            } else {
                this._setLeavesDir(centerMean[2], lr, leaves, 2, 2);
            }
        } else if (variance[1] > variance[2]) {
            this._setLeavesDir(centerMean[1], lr, leaves, 1, 1);
        } else {
            this._setLeavesDir(centerMean[2], lr, leaves, 2, 2);
        }
        return lr[0];
    }

    /**
     * 按指定轴分割叶子节点集合（双指针法）。
     * 双指针分割核心逻辑：
     * 1. 左指针从from开始，找第一个中心点大于均值的节点；
     * 2. 右指针从until-1开始，找第一个中心点小于均值的节点；
     * 3. 交换左右指针指向的节点，移动指针；
     * 4. 重复直至左指针>=右指针，完成分割；
     * 核心目的：将节点划分为"小于均值"和"大于均值"两部分。
     * @param {number} centerMean - 分割轴的中心点均值
     * @param {Float64Array} lr - 存储左右指针的数组（lr[0]=左指针，lr[1]=右指针）
     * @param {BvhNode[]} leaves - 待分割的叶子节点数组
     * @param {number} index0 - 左节点判断的轴索引（0=x,1=y,2=z）
     * @param {number} index1 - 右节点判断的轴索引（0=x,1=y,2=z）
     * @returns {void}
     */
    private _setLeavesDir(centerMean: number, lr: Float64Array, leaves: BvhNode[], index0: number, index1: number): void {
        const mean = centerMean;
        while (true) {
            while (!(leaves[lr[0]].tmp[index0] <= mean)) ++lr[0];
            while (!(leaves[lr[1]].tmp[index1] >= mean)) --lr[1];
            if (lr[0] >= lr[1]) break;
            const tmp = leaves[lr[0]];
            leaves[lr[0]] = leaves[lr[1]];
            leaves[lr[1]] = tmp;
            ++lr[0];
            --lr[1];
        }
    }

    /**
     * 计算插入到子节点的代价（Cost）。
     * 代价计算逻辑：
     * 1. 合并子节点与新叶子节点的AABB，计算合并后的面积；
     * 2. 叶子节点（height=0）：总代价=增量代价+合并后面积；
     * 3. 非叶子节点：总代价=增量代价+（合并后面积-原面积）；
     * 核心目的：量化AABB扩展的开销，选择代价最小的插入路径。
     * @param {BvhNode} c - 待计算的子节点
     * @param {Float64Array} ce - 子节点的AABB数据
     * @param {Float64Array} le - 新叶子节点的AABB数据
     * @param {Float64Array} cmb - 临时AABB缓存（存储合并后的AABB）
     * @param {number} incrementalCost - 基础增量代价
     * @returns {number} - 插入到该子节点的总代价
     */
    private _getDescendingCost(c: BvhNode, ce: Float64Array, le: Float64Array, cmb: Float64Array, incrementalCost: number): number {
        Method.boxUnionBox(ce, le, cmb);
        let ey: number, ez: number;
        let descendingCost: number;
        if (c.height === 0) {
            ey = cmb[4] - cmb[1]; ez = cmb[5] - cmb[2];
            descendingCost = incrementalCost + ((cmb[3] - cmb[0]) * (ey + ez) + ey * ez) * 2;
        } else {
            ey = cmb[4] - cmb[1]; ez = cmb[5] - cmb[2];
            const ey1 = ce[4] - ce[1], ez1 = ce[5] - ce[2];
            descendingCost = incrementalCost + (((cmb[3] - cmb[0]) * (ey + ez) + ey * ez) * 2 - ((ce[3] - ce[0]) * (ey1 + ez1) + ey1 * ez1) * 2);
        }
        return descendingCost;
    }
}

export { BvhStrategy };