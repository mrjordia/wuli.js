import BvhStrategy from "./bvh-strategy";
import BvhNode from './bvh-node';
import Method from "../../common/method";
import { Nullable } from "../../common/nullable";

/**
 * BVH（边界体积层次）树核心管理类。
 * 物理引擎中BVH树的核心管理类，负责BVH树的构建、销毁、平衡检测等全生命周期管理，核心作用：
 * 1. 基于自顶向下算法构建BVH树，支持叶子节点的动态插入/删除；
 * 2. 维护节点对象池（nodePool），复用BVHNode实例以优化内存开销；
 * 3. 管理叶子节点链表（leafList），支持快速遍历所有关联代理的叶子节点；
 * 4. 提供树平衡度计算、递归销毁/分解等工具方法；
 * 核心特性：
 * - 结合BvhStrategy实现节点分割与插入策略，适配不同的空间划分需求；
 * - 采用递归算法构建/销毁树结构，逻辑清晰且适配BVH二叉树特性；
 * - 内置临时数组缓存（tmp），用于树构建过程中的数据暂存；
 * 主要应用场景：BVHBroadphase粗检测、大规模物理场景的高效空间查询、动态碰撞体管理。
 */
export default class BvhTree {
    /**
     * BVH树根节点。
     * 指向BVH树的根节点；
     * 树未构建时为null，构建完成后指向顶层非叶子节点，所有节点操作均从根节点开始。
     */
    public root: Nullable<BvhNode>;

    /**
     * 叶子节点数量。
     * 统计当前BVH树中叶子节点的总数（即关联BvhProxy的节点数）；
     * 新增/删除叶子节点时更新，初始值为0。
     */
    public numLeaves = 0;

    /**
     * BVH树策略实例。
     * 关联的BvhStrategy实例，提供节点分割、插入决策的策略支持；
     * 树构建过程中调用其splitLeaves等方法，实现空间划分逻辑。
     */
    public strategy = new BvhStrategy();

    /**
     * BVH节点对象池。
     * 存储闲置的BVHNode实例，用于树构建时的节点复用；
     * 核心作用：避免频繁创建/销毁BVHNode对象，降低内存分配开销。
     */
    public nodePool: Nullable<BvhNode>;

    /**
     * 叶子节点链表头节点。
     * 指向叶子节点双向链表的第一个节点；
     * 用于快速遍历所有关联代理的叶子节点，初始值为null。
     */
    public leafList: Nullable<BvhNode>;

    /**
     * 叶子节点链表尾节点。
     * 指向叶子节点双向链表的最后一个节点；
     * 优化叶子节点的尾部插入操作，避免遍历链表，初始值为null。
     */
    public leafListLast: Nullable<BvhNode>;

    /**
     * 临时数组缓存。
     * 长度为1024的数组，用于树构建过程中的临时数据存储；
     * 如叶子节点集合、递归过程中的中间结果等，避免频繁创建数组。
     */
    public tmp = new Array(1024);

    /**
     * 获取BVH树的总平衡度。
     * 对外提供的树平衡度查询接口，核心逻辑：
     * 调用递归方法getBalanceRecursive，从根节点开始计算整棵树的平衡度；
     * 平衡度反映左右子树高度差的总和，是评估BVH查询效率的重要指标。
     * @returns {number} - 树的总平衡度（非负整数），值越小表示树越平衡
     */
    public getBalance(): number {
        return this.getBalanceRecursive(this.root!);
    }

    /**
     * 递归删除BVH树节点（含叶子节点清理）。
     * 核心逻辑（后序遍历）：
     * 1. 叶子节点（height=0）：
     *    - 从叶子节点链表中移除，维护prevLeaf/nextLeaf指针；
     *    - 清理代理与叶子节点的关联（proxy.leaf=null）；
     *    - 调用_resetRoot重置节点并回收至对象池；
     * 2. 非叶子节点：
     *    - 递归删除左右子节点；
     *    - 调用_resetRoot重置当前节点并回收至对象池；
     * 核心目的：安全销毁子树并回收节点资源，避免内存泄漏。
     * @param {BvhNode} root - 待删除的子树根节点
     * @returns {void}
     */
    public deleteRecursive(root: BvhNode): void {
        if (root.height === 0) {
            const prev = root.prevLeaf, next = root.nextLeaf;
            if (prev) prev.nextLeaf = next;
            if (next) next.prevLeaf = prev;
            if (root === this.leafList) this.leafList = this.leafList.nextLeaf;
            if (root === this.leafListLast) this.leafListLast = this.leafListLast.prevLeaf;
            root.nextLeaf = root.prevLeaf = null;
            root.proxy!.leaf = null;
            this._resetRoot(root);
            return;
        }
        this.deleteRecursive(root.children[0]!);
        this.deleteRecursive(root.children[1]!);
        this._resetRoot(root);
    }

    /**
     * 递归分解BVH树（仅重置节点拓扑信息）。
     * 核心逻辑（后序遍历）：
     * 1. 叶子节点：重置childIndex和parent，解除与父节点的关联；
     * 2. 非叶子节点：递归分解左右子节点，再调用_resetRoot回收当前节点；
     * 与deleteRecursive的区别：
     * - 不清理叶子节点链表和代理关联，仅拆解树的拓扑结构；
     * - 适用于树结构重构前的临时分解场景。
     * @param {BvhNode} root - 待分解的子树根节点
     * @returns {void}
     */
    public decomposeRecursive(root: BvhNode): void {
        if (root.height === 0) {
            root.childIndex = 0;
            root.parent = null;
            return;
        }
        this.decomposeRecursive(root.children[0]!);
        this.decomposeRecursive(root.children[1]!);
        this._resetRoot(root);
    }

    /**
     * 自顶向下递归构建BVH树。
     * BVH树构建核心算法，分治思想：
     * 1. 递归终止条件（单节点）：
     *    - 叶子节点数量为1时，初始化节点AABB数据并返回该节点；
     * 2. 递归构建逻辑：
     *    - 调用strategy.splitLeaves分割叶子节点数组为左右两部分；
     *    - 递归构建左右子树，得到左右子节点；
     *    - 从对象池获取/创建新节点作为父节点，关联左右子节点；
     *    - 合并左右子节点的AABB作为父节点AABB，计算父节点高度；
     * 3. 返回值：当前层级构建完成的父节点（非叶子节点）；
     * 核心特性：自顶向下分割，保证树的空间划分合理性。
     * @param {BvhNode[]} leaves - 待构建树的叶子节点数组
     * @param {number} from - 构建起始索引（包含）
     * @param {number} until - 构建结束索引（不包含）
     * @returns {BvhNode} - 构建完成的子树根节点
     */
    public buildTopDownRecursive(leaves: BvhNode[], from: number, until: number): BvhNode {
        if (until - from === 1) {
            const leaf = leaves[from];
            const proxy = leaf.proxy!;
            const le = leaf.size, pe = proxy.size;
            Method.copyElements(pe, le, 0, 0, 6);
            return leaf;
        }
        const splitAt = this.strategy.splitLeaves(leaves, from, until);
        const child1 = this.buildTopDownRecursive(leaves, from, splitAt);
        const child2 = this.buildTopDownRecursive(leaves, splitAt, until);
        let first = this.nodePool;
        if (first) {
            this.nodePool = first.next;
            first.next = null;
        } else {
            first = new BvhNode();
        }
        const parent = first;
        parent.children[0] = child1;
        child1.parent = parent;
        child1.childIndex = 0;
        parent.children[1] = child2;
        child2.parent = parent;
        child2.childIndex = 1;
        const c1 = parent.children[0].size, c2 = parent.children[1].size, pe = parent.size;
        Method.boxUnionBox(c1, c2, pe);
        const h1 = parent.children[0].height, h2 = parent.children[1].height;
        parent.height = (h1 > h2 ? h1 : h2) + 1;
        return parent;
    }

    /**
     * 递归计算BVH树的平衡度。
     * 平衡度计算逻辑（后序遍历）：
     * 1. 终止条件：节点为空或为叶子节点，返回平衡度0；
     * 2. 递归计算：
     *    - 计算当前节点左右子树的高度差（取绝对值）；
     *    - 递归计算左右子树的平衡度，累加到当前节点平衡度；
     * 3. 返回值：当前子树的总平衡度（当前节点高度差 + 左右子树平衡度）；
     * 平衡度含义：值越小，左右子树高度越接近，查询效率越高。
     * @param {BvhNode} root - 待计算的子树根节点
     * @returns {number} - 该子树的总平衡度
     */
    public getBalanceRecursive(root: BvhNode): number {
        if (!root || !root.height) {
            return 0;
        }
        let balance = root.children[0]!.height - root.children[1]!.height;
        if (balance < 0) {
            balance = -balance;
        }
        return balance + this.getBalanceRecursive(root.children[0]!) + this.getBalanceRecursive(root.children[1]!);
    }

    /**
     * 重置节点并回收至对象池。
     * 节点回收核心逻辑：
     * 1. 重置节点拓扑信息（children/childIndex/parent/height/proxy）；
     * 2. 将节点加入nodePool链表头部，完成资源回收；
     * 3. 保证回收后的节点可被后续buildTopDownRecursive复用；
     * 核心目的：避免频繁创建新节点，优化内存使用效率。
     * @param {BvhNode} root - 待重置的节点
     * @returns {void}
     */
    private _resetRoot(root: BvhNode): void {
        root.children[0] = root.children[1] = null;
        root.childIndex = 0;
        root.parent = null;
        root.height = 0;
        root.proxy = null;
        root.next = this.nodePool;
        this.nodePool = root;
    }
}

export { BvhTree };