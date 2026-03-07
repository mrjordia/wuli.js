import BroadPhase from "../broad-phase";
import { CONSTANT, BROAD_PHASE_TYPE } from '../../constant';
import BvhTree from "./bvh-tree";
import GjkEpa from "../../collision-detector/gjk-epa-detector/gjk-epa";
import BvhProxy from "./bvh-proxy";
import BvhNode from './bvh-node';
import Method from "../../common/method";
import ConvexCastWrapper from "../../common/convex-cast-wrapper";
import Vec3 from "../../common/vec3";
import Aabb from "../../common/aabb";
import Transform from "../../common/transform";
import Shape from "../../shape/shape";
import ConvexGeometry from "../../shape/convex-geometry";
import RayCastWrapper from "../../common/ray-cast-wrapper";
import AabbTestWrapper from "../../common/aabb-test-wrapper";
import { Nullable } from "../../common/nullable";

/**
 * BVH（边界体积层次）粗检测核心实现类。
 * 物理引擎中基于BVH树的高性能粗检测实现，核心作用：
 * 1. 替代暴力遍历，通过BVH树的分层空间索引大幅减少AABB检测次数；
 * 2. 支持增量更新（incremental），仅重检测移动的代理，提升动态场景性能；
 * 3. 实现碰撞对收集、射线检测、凸体扫掠、AABB测试等核心粗检测能力；
 * 4. 内置BVH树平衡优化，保证查询效率的稳定性；
 * 核心特性：
 * - 增量检测：通过movedProxies管理移动代理，根据阈值选择增量/全量检测；
 * - 递归遍历：采用递归算法遍历BVH树，适配二叉树的空间划分特性；
 * - 节点复用：通过BvhTree的节点池复用BVHNode，优化内存开销；
 * - 平衡优化：支持BVH树的旋转平衡，避免树退化导致的性能下降；
 * 性能特点：
 * - 时间复杂度：查询/检测为O(n log n)，远优于暴力检测的O(n²)；
 * - 增量更新：动态场景下仅处理移动代理，性能提升显著；
 * 主要应用场景：中大规模物理场景、动态碰撞体较多的游戏/仿真、高精度碰撞检测需求。
 */
export default class BvhBroadPhase extends BroadPhase {
    /**
     * 增量更新开关。
     * 是否启用增量粗检测：
     * - true：仅处理移动的代理，减少不必要的检测；
     * - false：每帧全量检测所有代理；
     * 初始值为true，适配动态物理场景的性能优化需求。
     */
    public incremental = true;

    /**
     * 移动代理数组。
     * 存储帧内发生移动的BvhProxy实例，长度初始化为1024；
     * 数组满时自动扩容（翻倍），避免溢出，未使用位置为null。
     */
    public movedProxies: Array<Nullable<BvhProxy>> = new Array(1024);

    /**
     * 移动代理数量。
     * 统计当前帧移动代理数组中的有效代理数量；
     * 新增移动代理时递增，帧末重置为0，初始值为0。
     */
    public numMovedProxies = 0;

    private _tree = new BvhTree();

    /**
     * 构造函数：初始化BVH粗检测实例。
     * 核心初始化逻辑：
     * 1. 调用父类构造函数，指定粗检测类型为BVH；
     * 2. 初始化BVH树实例，继承父类的临时对象（_aabb、_convexSweep等）；
     * 3. 启用增量更新，初始化移动代理数组。
     */
    constructor() {
        super(BROAD_PHASE_TYPE.BVH);
    }

    /**
     * 递归检测两个BVH节点的碰撞（核心碰撞对收集逻辑）。
     * 基于BVH树的碰撞对收集算法，核心逻辑（递归遍历）：
     * 1. 递增检测计数（testCount），记录AABB检测次数；
     * 2. 边界处理：
     *    - 节点自身碰撞：非叶子节点递归检测子节点与自身，叶子节点直接返回；
     *    - AABB不重叠：直接返回，无需后续检测；
     * 3. 叶子节点处理：
     *    - 两个均为叶子节点且AABB重叠：创建ProxyPair加入碰撞对链表；
     * 4. 非叶子节点处理：
     *    - 选择高度更高/叶子节点的分支递归检测，减少遍历次数；
     *    - 保证递归遍历的高效性，避免冗余检测。
     * @param {BvhNode} n1 - 待检测的第一个BVH节点
     * @param {BvhNode} n2 - 待检测的第二个BVH节点
     * @returns {void}
     */
    public collide(n1: BvhNode, n2: BvhNode): void {
        this.testCount++;
        const l1 = n1.height === 0;
        const l2 = n2.height === 0;
        if (n1 === n2) {
            if (l1) return;
            this.collide(n1.children[0]!, n2);
            this.collide(n1.children[1]!, n2);
            return;
        }
        if (!Method.boxIntersectsBox(n1.size, n2.size)) return;
        if (l1 && l2) {
            const pp = this.setProxyPairList();
            pp.proxy1 = n1.proxy;
            pp.proxy2 = n2.proxy;
            return;
        }
        if (l2 || n1.height > n2.height) {
            this.collide(n1.children[0]!, n2);
            this.collide(n1.children[1]!, n2);
        } else {
            this.collide(n2.children[0]!, n1);
            this.collide(n2.children[1]!, n1);
        }
    }

    /**
     * 递归射线检测（BVH树遍历）。
     * 射线检测核心逻辑（剪枝遍历）：
     * 1. 剪枝条件：射线与当前节点AABB不相交，直接返回；
     * 2. 叶子节点：调用回调函数，传入代理执行细检测；
     * 3. 非叶子节点：递归遍历左右子节点，继续射线检测；
     * 核心优化：通过AABB快速剪枝，避免遍历无关节点。
     * @param {BvhNode} node - 当前遍历的BVH节点
     * @param {number} x1 - 射线起点X坐标
     * @param {number} y1 - 射线起点Y坐标
     * @param {number} z1 - 射线起点Z坐标
     * @param {number} x2 - 射线终点X坐标
     * @param {number} y2 - 射线终点Y坐标
     * @param {number} z2 - 射线终点Z坐标
     * @param {RayCastWrapper} callback - 射线检测回调函数
     * @returns {void}
     */
    public rayCastRecursive(node: BvhNode, x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, callback: RayCastWrapper): void {
        if (!this.raycastTest(node.size, x1, y1, z1, x2, y2, z2)) {
            return;
        }
        if (node.height === 0) {
            callback.process(node.proxy!);
            return;
        }
        this.rayCastRecursive(node.children[0]!, x1, y1, z1, x2, y2, z2, callback);
        this.rayCastRecursive(node.children[1]!, x1, y1, z1, x2, y2, z2, callback);
    }

    /**
     * 递归凸体扫掠检测（BVH树遍历）。
     * 凸体扫掠检测核心逻辑（剪枝遍历）：
     * 1. 初始化节点AABB到临时_aabb对象；
     * 2. 剪枝条件：通过GJK-EPA算法判断凸体扫掠路径与节点AABB不相交，直接返回；
     * 3. 叶子节点：调用回调函数，传入代理执行细检测；
     * 4. 非叶子节点：递归遍历左右子节点，继续扫掠检测；
     * 核心优化：结合GJK-EPA快速筛选，减少细检测次数。
     * @param {BvhNode} node - 当前遍历的BVH节点
     * @param {ConvexGeometry} convex - 待扫掠的凸体几何
     * @param {Transform} begin - 凸体初始变换（位置/旋转）
     * @param {Vec3} translation - 凸体扫掠位移向量
     * @param {ConvexCastWrapper} callback - 扫掠检测回调函数
     * @returns {void}
     */
    public convexCastRecursive(node: BvhNode, convex: ConvexGeometry, begin: Transform, translation: Vec3, callback: ConvexCastWrapper): void {
        const na = node.size, ab = this._aabb;
        Method.copyElements(na, ab.min.elements, 0, 0, 3);
        Method.copyElements(na, ab.max.elements, 3, 0, 3);
        this._convexSweep.init(convex, begin, translation);
        const gjkEpa = GjkEpa.instance;
        if (!(gjkEpa.computeClosestPointsImpl(this._convexSweep, ab, begin, this.identity, null, false) === 0 && gjkEpa.distance <= 0)) {
            return;
        }
        if (node.height === 0) {
            callback.process(node.proxy!);
            return;
        }
        this.convexCastRecursive(node.children[0]!, convex, begin, translation, callback);
        this.convexCastRecursive(node.children[1]!, convex, begin, translation, callback);
    }

    /**
     * 递归AABB测试（BVH树遍历）。
     * AABB测试核心逻辑（剪枝遍历）：
     * 1. 剪枝条件：测试AABB与当前节点AABB不相交，直接返回；
     * 2. 叶子节点：调用回调函数，传入代理执行自定义处理；
     * 3. 非叶子节点：递归遍历左右子节点，继续AABB测试；
     * 核心应用：区域内形状检索、碰撞体范围查询等场景。
     * @param {BvhNode} node - 当前遍历的BVH节点
     * @param {Aabb} aabb - 待测试的AABB包围盒
     * @param {AabbTestWrapper} callback - AABB测试回调函数
     * @returns {void}
     */
    public aabbTestRecursive(node: BvhNode, aabb: Aabb, callback: AabbTestWrapper): void {
        if (!Method.boxIntersectsBox(node.size, aabb.elements)) {
            return;
        }
        if (node.height === 0) {
            callback.process(node.proxy!);
            return;
        }
        const nodeChildren = node.children;
        this.aabbTestRecursive(nodeChildren[0]!, aabb, callback);
        this.aabbTestRecursive(nodeChildren[1]!, aabb, callback);
    }

    /**
     * 移动物理代理（更新AABB并标记移动状态）。
     * 核心逻辑：
     * 1. 剪枝条件：新AABB完全包含在旧AABB内，无需更新；
     * 2. 更新AABB：复制新AABB数据，添加BVH代理padding并扩展位移；
     * 3. 标记移动：将代理加入movedProxies数组，标记为已移动；
     * 核心优化：通过padding和位移扩展避免频繁的BVH树更新。
     * @param {BvhProxy} proxy - 待移动的BVH代理
     * @param {Aabb} aabb - 代理新的AABB包围盒
     * @param {Vec3} displacement - 代理的位移向量
     * @returns {void}
     */
    public moveProxy(proxy: BvhProxy, aabb: Aabb, displacement: Vec3): void {
        const p = proxy.size, ae = aabb.elements;
        if (Method.boxContainsBox(p, ae)) {
            return;
        }
        Method.copyElements(ae, p, 0, 0, 6);
        const padding = CONSTANT.SETTING_BVH_PROXY_PADDING;
        Method.expandBoxByScale(p, padding);
        if (displacement) {
            const des = displacement.elements;
            Method.expandBoxByPoint(p, des[0], des[1], des[2]);
        }
        this.numMovedProxies = this._moveProxy(proxy, this.movedProxies, this.numMovedProxies);
    }

    /**
     * 设置代理链（维护BVH树父子节点关系）。
     * 核心逻辑：
     * 1. 调用_makeProxyChain维护三层节点的父子关系；
     * 2. 更新父节点的AABB和高度信息；
     * 核心作用：BVH树平衡旋转时，调整节点的拓扑结构。
     * @param {BvhNode} parent - 父节点
     * @param {BvhNode} self - 当前节点
     * @param {number} si - 当前节点在父节点中的索引
     * @param {BvhNode} child - 子节点
     * @param {number} ci - 子节点在当前节点中的索引
     * @returns {void}
     */
    public setProxyChain(parent: BvhNode, self: BvhNode, si: number, child: BvhNode, ci: number): void {
        this._makeProxyChain(parent, self, si);
        this._makeProxyChain(self, child, ci);
        this._setParentProxy(parent);
        this._setParentProxy(self);
    }

    /**
     * 更新BVH节点（平衡优化+AABB/高度更新）。
     * 核心逻辑（自底向上更新）：
     * 1. 平衡优化（启用时）：
     *    - 检测节点平衡度，超过阈值则执行旋转平衡；
     *    - 支持LL/LR/RR/RL四种旋转场景，保证树的平衡；
     * 2. 节点更新：
     *    - 自底向上更新父节点的AABB和高度；
     *    - 调整根节点引用，维护树的拓扑正确性；
     * 核心目的：避免BVH树退化，保证查询效率的稳定性。
     * @param {BvhNode} nd - 待更新的BVH节点
     * @param {BvhTree} tree - BVH树实例
     * @returns {void}
     */
    public updateNode(nd: BvhNode, tree: BvhTree): void {
        let node: Nullable<BvhNode> = nd;
        while (node) {
            if (tree.strategy.balancingEnabled) {
                if (node.height >= 2) {
                    let p = node.parent, l: BvhNode = node.children[0]!, r: BvhNode = node.children[1]!;
                    let balance = l.height - r.height;
                    let nodeIndex = node.childIndex;
                    if (balance > 1) {
                        let ll = l.children[0]!, lr = l.children[1]!;
                        if (ll.height > lr.height) {
                            this.setProxyChain(l, node, 1, lr, 0);
                        } else {
                            this.setProxyChain(l, node, 0, ll, 0);
                        }
                        if (p) {
                            this._makeProxyChain(p, l, nodeIndex);
                        } else {
                            tree.root = l;
                            l.parent = null;
                        }
                        node = l;
                    } else if (balance < -1) {
                        let rl = r.children[0]!, rr = r.children[1]!;
                        if (rl.height > rr.height) {
                            this.setProxyChain(r, node, 1, rr, 1);
                        } else {
                            this.setProxyChain(r, node, 0, rl, 1);
                        }
                        if (p) {
                            this._makeProxyChain(p, r, nodeIndex);
                        } else {
                            tree.root = r;
                            r.parent = null;
                        }
                        node = r;
                    }
                }
            }
            this._setParentProxy(node);
            node = node.parent;
        }
    }

    /**
     * 创建BVH物理代理（关联BVH树叶子节点）。
     * 核心逻辑：
     * 1. 创建BvhProxy：分配唯一ID，初始化AABB并添加padding；
     * 2. 创建叶子节点：从对象池获取/新建BVHNode，关联代理与节点；
     * 3. 插入BVH树：
     *    - 空树：直接设为根节点；
     *    - 非空树：根据插入策略找到最优位置，创建父节点并插入；
     * 4. 平衡更新：调用updateNode优化树结构，标记代理为已移动；
     * 核心特性：节点池复用，减少内存分配开销。
     * @param {Shape} userData - 关联的物理形状实例
     * @param {Aabb} aabb - 形状的AABB包围盒
     * @returns {BvhProxy} - 创建并注册的BVH代理实例
     */
    public createProxy(userData: Shape, aabb: Aabb): BvhProxy {
        let p = new BvhProxy(userData, this._idCount++);
        this._numProxies = this.setProxyList(this._numProxies, p, aabb);
        let padding = CONSTANT.SETTING_BVH_PROXY_PADDING;
        Method.expandBoxByScale(p.size, padding);
        let _this = this._tree;
        let first = _this.nodePool;
        if (first) {
            _this.nodePool = first.next;
            first.next = null;
        } else {
            first = new BvhNode();
        }
        let leaf = first;
        leaf.proxy = p;
        p.leaf = leaf;
        Method.copyElements(p.size, leaf.size, 0, 0, 6);
        this._addLeaf(_this, leaf);
        if (!_this.root) {
            _this.root = leaf;
        } else {
            let sibling = _this.root;
            while (sibling.height > 0) {
                let nextStep = _this.strategy.decideInsertion(sibling, leaf);
                if (nextStep === -1) {
                    break;
                } else {
                    sibling = sibling.children[nextStep]!;
                }
            }
            let parent = sibling.parent;
            let first = _this.nodePool;
            if (first) {
                _this.nodePool = first.next;
                first.next = null;
            } else {
                first = new BvhNode();
            }
            let node = first;
            if (!parent) {
                _this.root = node;
            } else {
                this._makeProxyChain(parent, node, sibling.childIndex);
            }
            this._makeProxyChain(node, sibling, sibling.childIndex);
            this._makeProxyChain(node, leaf, sibling.childIndex ^ 1);
            this.updateNode(node, _this);
        }
        this.numMovedProxies = this._moveProxy(p, this.movedProxies, this.numMovedProxies);
        return p;
    }

    /**
     * 销毁BVH物理代理（从BVH树移除并回收节点）。
     * 核心逻辑：
     * 1. 链表清理：从代理链表中移除，维护prev/next指针；
     * 2. BVH树清理：调用_resetBvhProxy移除叶子节点，回收至对象池；
     * 3. 状态重置：清理代理关联数据，重置移动状态；
     * 核心保证：安全回收节点资源，避免内存泄漏。
     * @param {BvhProxy} proxy - 待销毁的BVH代理
     * @returns {void}
     */
    public destroyProxy(proxy: BvhProxy): void {
        this._numProxies--;
        const prev = proxy.prev, next = proxy.next;
        if (prev) prev.next = next;
        if (next) next.prev = prev;
        if (proxy === this._proxyList) this._proxyList = this._proxyList.next;
        if (proxy === this._proxyListLast) this._proxyListLast = this._proxyListLast.prev;
        proxy.next = proxy.prev = null;
        const bvhProxy = proxy;
        this._resetBvhProxy(bvhProxy);
        bvhProxy.userData = null;
        bvhProxy.next = null;
        bvhProxy.prev = null;
        if (bvhProxy.moved) {
            bvhProxy.moved = false;
        }
    }

    /**
     * 收集碰撞对（增量/全量检测）。
     * 核心逻辑（增量检测为主）：
     * 1. 清理缓存：回收上一帧的碰撞对链表至对象池；
     * 2. 阈值判断：根据移动代理占比选择增量/全量检测；
     * 3. 增量检测：
     *    - 遍历移动代理，重新插入BVH树并平衡；
     *    - 仅检测移动代理与整棵树的碰撞，减少检测次数；
     * 4. 全量检测：遍历整棵BVH树，检测所有节点对的碰撞；
     * 5. 状态重置：清空移动代理数组，重置数量计数；
     * 核心优化：增量检测大幅减少动态场景的检测开销。
     * @returns {void}
     */
    public collectPairs(): void {
        let p = this.proxyPairList;
        if (p) {
            while (true) {
                p.proxy1 = p.proxy2 = null;
                p = p.next;
                if (!p) break;
            }
            this.proxyPairList!.next = this._proxyPairPool;
            this._proxyPairPool = this.proxyPairList;
            this.proxyPairList = null;
        }
        this.testCount = 0;
        if (this._numProxies < 2) return;
        const incrementalCollision = this.numMovedProxies / this._numProxies < CONSTANT.SETTING_BVH_INCREMENTAL_COLLISION_THRESHOLD;
        let _g = 0, _g1 = this.numMovedProxies;
        while (_g < _g1) {
            const i = _g++;
            const p = this.movedProxies[i]!;
            if (p.moved) {
                this._resetBvhProxy(p);
                const _this1 = this._tree;
                let first = _this1.nodePool;
                if (first) {
                    _this1.nodePool = first.next;
                    first.next = null;
                } else {
                    first = new BvhNode();
                }
                const leaf1 = first;
                leaf1.proxy = p;
                p.leaf = leaf1;
                Method.copyElements(p.size, leaf1.size, 0, 0, 6);
                this._addLeaf(_this1, leaf1);
                if (!_this1.root) {
                    _this1.root = leaf1;
                } else {
                    let sibling = _this1.root;
                    while (sibling.height > 0) {
                        const nextStep = _this1.strategy.decideInsertion(sibling, leaf1);
                        if (nextStep === -1) {
                            break;
                        } else {
                            sibling = sibling.children[nextStep]!;
                        }
                    }
                    const parent = sibling.parent;
                    let first = _this1.nodePool;
                    if (first) {
                        _this1.nodePool = first.next;
                        first.next = null;
                    } else {
                        first = new BvhNode();
                    }
                    const node = first;
                    if (!parent) {
                        _this1.root = node;
                    } else {
                        this._makeProxyChain(parent, node, sibling.childIndex);
                    }
                    this._makeProxyChain(node, sibling, sibling.childIndex);
                    this._makeProxyChain(node, leaf1, sibling.childIndex ^ 1);
                    this.updateNode(node, _this1);
                }
                if (incrementalCollision) {
                    this.collide(this._tree.root!, p.leaf);
                }
                p.moved = false;
            }
            this.movedProxies[i] = null;
        }
        if (!incrementalCollision) {
            this.collide(this._tree.root!, this._tree.root!);
        }
        this.numMovedProxies = 0;
    }

    /**
     * 射线检测入口方法。
     * 核心逻辑：
     * 1. 边界处理：BVH树为空时直接返回；
     * 2. 递归检测：提取射线坐标，调用rayCastRecursive遍历BVH树；
     * 核心封装：对外提供简洁接口，内部复用递归遍历逻辑。
     * @param {Vec3} begin - 射线起点
     * @param {Vec3} end - 射线终点
     * @param {RayCastWrapper} callback - 射线检测回调函数
     * @returns {void}
     */
    public rayCast(begin: Vec3, end: Vec3, callback: RayCastWrapper): void {
        if (!this._tree.root) return;
        const p1e = begin.elements;
        const p2e = end.elements;
        this.rayCastRecursive(this._tree.root, p1e[0], p1e[1], p1e[2], p2e[0], p2e[1], p2e[2], callback);
    }

    /**
     * 凸体扫掠检测入口方法。
     * 核心逻辑：
     * 1. 边界处理：BVH树为空时直接返回；
     * 2. 递归检测：调用convexCastRecursive遍历BVH树；
     * 核心封装：对外提供简洁接口，内部复用递归遍历逻辑。
     * @param {ConvexGeometry} convex - 待扫掠的凸体几何
     * @param {Transform} begin - 凸体初始变换
     * @param {Vec3} translation - 凸体扫掠位移向量
     * @param {ConvexCastWrapper} callback - 扫掠检测回调函数
     * @returns {void}
     */
    public convexCast(convex: ConvexGeometry, begin: Transform, translation: Vec3, callback: ConvexCastWrapper): void {
        if (!this._tree.root) return;
        this.convexCastRecursive(this._tree.root, convex, begin, translation, callback);
    }

    /**
     * AABB测试入口方法。
     * 核心逻辑：
     * 1. 边界处理：BVH树为空时直接返回；
     * 2. 递归检测：调用aabbTestRecursive遍历BVH树；
     * 核心封装：对外提供简洁接口，内部复用递归遍历逻辑。
     * @param {Aabb} aabb - 待测试的AABB包围盒
     * @param {AabbTestWrapper} callback - AABB测试回调函数
     * @returns {void}
     */
    public aabbTest(aabb: Aabb, callback: AabbTestWrapper): void {
        if (!this._tree.root) return;
        this.aabbTestRecursive(this._tree.root, aabb, callback);
    }

    /**
     * 获取BVH树的总平衡度。
     * 封装BvhTree的getBalance方法，对外提供树平衡度查询接口；
     * 平衡度越小，树结构越优，查询效率越高。
     * @returns {number} - BVH树的总平衡度（非负整数）
     */
    public getTreeBalance(): number {
        return this._tree.getBalance();
    }

    /**
     * 重置子节点并回收至对象池。
     * 核心逻辑：
     * 1. 重置节点拓扑信息（链表、子节点、父子索引、高度、代理）；
     * 2. 将节点加入对象池，完成资源回收；
     * 核心目的：复用节点，减少内存分配/销毁开销。
     * @param {BvhNode} parent - 待重置的节点
     * @param {BvhTree} tree - BVH树实例
     * @returns {void}
     */
    private _resetChild(parent: BvhNode, tree: BvhTree): void {
        parent.next = null;
        parent.children[0] = parent.children[1] = null;
        parent.childIndex = 0;
        parent.parent = null;
        parent.height = 0;
        parent.proxy = null;
        parent.next = tree.nodePool;
        tree.nodePool = parent;
    }

    /**
     * 重置BVH代理（从BVH树移除并回收叶子节点）。
     * 核心逻辑：
     * 1. 叶子节点清理：从叶子链表移除，维护prevLeaf/nextLeaf指针；
     * 2. 树结构调整：
     *    - 根节点：直接清空根节点；
     *    - 非根节点：将兄弟节点提升为父节点的子节点，回收当前节点；
     * 3. 平衡更新：调整树结构后调用updateNode优化；
     * 4. 资源回收：重置代理关联，将叶子节点回收至对象池；
     * 核心保证：安全移除代理，维护BVH树结构的完整性。
     * @param {BvhProxy} bvhProxy - 待重置的BVH代理
     * @returns {void}
     */
    private _resetBvhProxy(bvhProxy: BvhProxy): void {
        const _this = this._tree;
        const leaf = bvhProxy.leaf!;
        _this.numLeaves--;
        const prev1 = leaf.prevLeaf, next1 = leaf.nextLeaf;
        if (prev1) prev1.nextLeaf = next1;
        if (next1) next1.prevLeaf = prev1;
        if (leaf === _this.leafList) _this.leafList = _this.leafList.nextLeaf;
        if (leaf === _this.leafListLast) _this.leafListLast = _this.leafListLast.prevLeaf;
        leaf.nextLeaf = leaf.prevLeaf = null;
        if (_this.root === leaf) {
            _this.root = null;
        } else {
            const parent = leaf.parent!;
            const sibling = parent.children[leaf.childIndex ^ 1]!;
            const grandParent = parent.parent;
            if (!grandParent) {
                sibling.parent = null;
                sibling.childIndex = 0;
                _this.root = sibling;
                this._resetChild(parent, _this);
            } else {
                sibling.parent = grandParent;
                const index = parent.childIndex;
                grandParent.children[index] = sibling;
                sibling.parent = grandParent;
                sibling.childIndex = index;
                this._resetChild(parent, _this);
                this.updateNode(grandParent, _this);
            }
        }
        bvhProxy.leaf = null;
        this._resetChild(leaf, _this);
    }

    /**
     * 添加叶子节点到BVH树。
     * 核心逻辑：
     * 1. 递增叶子节点计数（numLeaves）；
     * 2. 链表插入：
     *    - 空链表：设为头/尾节点；
     *    - 非空链表：插入到链表尾部，维护prevLeaf/nextLeaf指针；
     * 核心作用：维护叶子节点链表，支持快速遍历所有代理。
     * @param {BvhTree} tree - BVH树实例
     * @param {BvhNode} leaf - 待添加的叶子节点
     * @returns {void}
     */
    private _addLeaf(tree: BvhTree, leaf: BvhNode): void {
        tree.numLeaves++;
        if (!tree.leafList) {
            tree.leafList = leaf;
            tree.leafListLast = leaf;
        } else {
            tree.leafListLast!.nextLeaf = leaf;
            leaf.prevLeaf = tree.leafListLast;
            tree.leafListLast = leaf;
        }
    }

    /**
     * 建立父子节点关联。
     * 核心逻辑：
     * 1. 父节点children[ci]指向子节点；
     * 2. 子节点parent指向父节点，childIndex设为ci；
     * 核心作用：维护BVH树的拓扑结构，支持树的遍历与更新。
     * @param {BvhNode} parent - 父节点
     * @param {BvhNode} child - 子节点
     * @param {number} ci - 子节点在父节点中的索引（0/1）
     * @returns {void}
     */
    private _makeProxyChain(parent: BvhNode, child: BvhNode, ci: number): void {
        parent.children[ci] = child;
        child.parent = parent;
        child.childIndex = ci;
    }

    /**
     * 更新父节点的AABB和高度。
     * 核心逻辑：
     * 1. 合并左右子节点的AABB，作为父节点的AABB；
     * 2. 计算父节点高度（1 + 左右子节点的最大高度）；
     * 核心作用：保证父节点AABB包含所有子节点，高度信息准确。
     * @param {BvhNode} parent - 待更新的父节点
     * @returns {void}
     */
    private _setParentProxy(parent: BvhNode): void {
        Method.boxUnionBox(parent.children[0]!.size, parent.children[1]!.size, parent.size);
        let h1 = parent.children[0]!.height, h2 = parent.children[1]!.height;
        parent.height = (h1 > h2 ? h1 : h2) + 1;
    }

    /**
     * 标记代理为移动状态并加入数组。
     * 核心逻辑：
     * 1. 去重处理：已标记为移动的代理，直接返回当前数量；
     * 2. 数组扩容：数组满时翻倍扩容，避免溢出；
     * 3. 标记插入：设置moved=true，加入数组并递增数量；
     * 核心作用：准确管理移动代理，支持增量检测。
     * @param {BvhProxy} proxy - 待标记的BVH代理
     * @param {Array<Nullable<BvhProxy>>} movedProxies - 移动代理数组
     * @param {number} numMovedProxies - 当前移动代理数量
     * @returns {number} - 更新后的移动代理数量
     */
    private _moveProxy(proxy: BvhProxy, movedProxies: Array<Nullable<BvhProxy>>, numMovedProxies: number): number {
        if (!proxy.moved) {
            proxy.moved = true;
            if (movedProxies.length === numMovedProxies) {
                const newArray = new Array(numMovedProxies << 1);
                let _g = 0;
                while (_g < numMovedProxies) {
                    const i = _g++;
                    newArray[i] = movedProxies[i];
                    movedProxies[i] = null;
                }
                movedProxies = newArray;
            }
            movedProxies[numMovedProxies] = proxy;
            return numMovedProxies + 1;
        }
        return numMovedProxies;
    }
}

export { BvhProxy };