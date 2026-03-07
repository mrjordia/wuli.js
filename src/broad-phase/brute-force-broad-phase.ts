import BroadPhase from "./broad-phase";
import PhysicsProxy from "./physics-proxy";
import GjkEpa from "../collision-detector/gjk-epa-detector/gjk-epa";
import { BROAD_PHASE_TYPE } from '../constant';
import Method from "../common/method";
import Aabb from "../common/aabb";
import Vec3 from "../common/vec3";
import ConvexCastWrapper from "../common/convex-cast-wrapper";
import Transform from "../common/transform";
import Shape from "../shape/shape";
import ConvexGeometry from "../shape/convex-geometry";
import AabbTestWrapper from "../common/aabb-test-wrapper";
import RayCastWrapper from "../common/ray-cast-wrapper";

/**
 * 暴力遍历型粗检测实现类。
 * 物理引擎中最简单的粗检测（BroadPhase）实现，核心特性：
 * 1. 基于暴力双重循环遍历所有物理代理对，判断AABB是否重叠；
 * 2. 实现逻辑简单、无空间分区优化，适用于代理数量较少（<100）的场景；
 * 3. 不支持增量检测（强制关闭incremental），每帧全量检测所有代理对；
 * 性能特点：
 * - 优点：实现成本低、无额外空间开销、逻辑易调试；
 * - 缺点：时间复杂度O(n²)，代理数量增多时性能急剧下降；
 * 主要应用场景：小型物理场景、测试/调试环境、简单demo验证。
 */
export default class BruteForceBroadPhase extends BroadPhase {
    /**
     * 构造函数：初始化暴力粗检测实例。
     * 核心初始化逻辑：
     * 1. 调用父类构造函数，指定粗检测类型为BRUTE_FORCE；
     * 2. 强制关闭增量检测（incremental=false），因暴力检测无增量优化逻辑；
     * 3. 继承父类预初始化的临时对象（identity、zero、raycastHit等）。
     */
    constructor() {
        super(BROAD_PHASE_TYPE.BRUTE_FORCE);
        this.incremental = false;
    }

    /**
     * 创建物理代理。
     * 实现父类抽象方法，核心逻辑：
     * 1. 为Shape分配唯一ID，创建PhysicsProxy实例；
     * 2. 调用父类setProxyList方法，将代理加入链表并初始化AABB数据；
     * 3. 递增代理数量（_numProxies），返回新创建的代理实例。
     * @param {Shape} userData - 关联的物理形状实例
     * @param {Aabb} aabb - 形状的AABB包围盒
     * @returns {PhysicsProxy} - 创建并注册的物理代理实例
     */
    public createProxy(userData: Shape, aabb: Aabb): PhysicsProxy {
        const proxy = new PhysicsProxy(userData, this._idCount++);
        this._numProxies = this.setProxyList(this._numProxies, proxy, aabb);
        return proxy;
    }

    /**
     * 销毁物理代理。
     * 实现父类抽象方法，核心逻辑：
     * 1. 递减代理数量（_numProxies）；
     * 2. 维护双向链表指针：更新前驱/后继节点的prev/next，处理头/尾节点边界；
     * 3. 清理代理的关联数据（prev/next置空、userData置空），避免内存泄漏。
     * @param {PhysicsProxy} proxy - 待销毁的物理代理实例
     * @returns {void}
     */
    public destroyProxy(proxy: PhysicsProxy) {
        this._numProxies--;
        let prev = proxy.prev;
        let next = proxy.next;
        if (prev) {
            prev.next = next;
        }
        if (next) {
            next.prev = prev;
        }
        if (proxy === this._proxyList) {
            this._proxyList = this._proxyList.next;
        }
        if (proxy === this._proxyListLast) {
            this._proxyListLast = this._proxyListLast.prev;
        }
        proxy.next = null;
        proxy.prev = null;
        proxy.userData = null;
    }

    /**
     * 移动物理代理。
     * 实现父类抽象方法，核心逻辑：
     * 1. 直接复制新AABB数据到代理的size数组，更新代理的AABB边界；
     * 2. 暴力检测无空间分区优化，无需处理位移相关的分区更新；
     * 注意：displacement参数仅为兼容父类接口，实际未使用。
     * @param {PhysicsProxy} proxy - 待移动的物理代理实例
     * @param {Aabb} aabb - 代理新的AABB包围盒
     * @param {Vec3} displacement - 代理的位移向量（暴力检测中未使用）
     * @returns {void}
     */
    public moveProxy(proxy: PhysicsProxy, aabb: Aabb, displacement: Vec3): void {
        Method.copyElements(aabb.elements, proxy.size, 0, 0, 6);
    }

    /**
     * 收集候选碰撞对。
     * 实现父类抽象方法，核心逻辑（暴力双重循环）：
     * 1. 清理上一帧的碰撞对链表，将ProxyPair回收至对象池；
     * 2. 重置检测计数（testCount），准备全量检测；
     * 3. 外层循环遍历每个代理p1，内层循环遍历p1之后的所有代理p2；
     * 4. 对每对(p1,p2)：
     *    - 递增testCount，记录检测次数；
     *    - 调用Method.boxIntersectsBox判断AABB是否重叠；
     *    - 重叠则从对象池获取ProxyPair，填充proxy1/proxy2并加入链表；
     * 性能说明：双重循环遍历n个代理时，共执行n*(n-1)/2次AABB检测。
     * @returns {void}
     */
    public collectPairs(): void {
        let p = this.proxyPairList;
        if (p) {
            while (true) {
                p.proxy1 = null;
                p.proxy2 = null;
                p = p.next;
                if (!p) break;
            }
            this.proxyPairList!.next = this._proxyPairPool;
            this._proxyPairPool = this.proxyPairList;
            this.proxyPairList = null;
        }
        this.testCount = 0;
        let p1 = this._proxyList;
        while (p1) {
            let n = p1.next, p2 = p1.next;
            while (p2) {
                let n = p2.next;
                this.testCount++;
                if (Method.boxIntersectsBox(p1.size, p2.size)) {
                    let pp = this.setProxyPairList();
                    pp.proxy1 = p1;
                    pp.proxy2 = p2;
                }
                p2 = n;
            }
            p1 = n;
        }
    }

    /**
     * 射线检测。
     * 实现父类抽象方法，核心逻辑：
     * 1. 遍历所有物理代理，获取射线起点/终点的数组数据；
     * 2. 调用父类raycastTest方法，判断射线与代理AABB是否相交；
     * 3. 相交则调用callback.process，将代理传入回调执行细检测；
     * 注意：暴力检测无射线空间筛选，需遍历所有代理。
     * @param {Vec3} begin - 射线起点
     * @param {Vec3} end - 射线终点
     * @param {RayCastWrapper} callback - 射线检测回调函数
     * @returns {void}
     */
    public rayCast(begin: Vec3, end: Vec3, callback: RayCastWrapper): void {
        const p1e = begin.elements, p2e = end.elements;
        let p = this._proxyList;
        while (p) {
            let n = p.next;
            let pe = p.size;
            let tmp = this.raycastTest(pe, p1e[0], p1e[1], p1e[2], p2e[0], p2e[1], p2e[2]);
            if (tmp) {
                callback.process(p);
            }
            p = n;
        }
    }

    /**
     * 凸体扫掠检测。
     * 实现父类抽象方法，核心逻辑：
     * 1. 遍历所有物理代理，初始化代理的AABB数据到临时_aabb对象；
     * 2. 调用_convexSweep.init初始化凸体扫掠的几何数据；
     * 3. 使用GJK-EPA算法判断凸体扫掠路径与代理AABB是否相交；
     * 4. 相交（distance<=0）则调用callback.process，传入代理执行细检测；
     * 注意：GJK-EPA为细检测算法，此处仅用于粗检测阶段的快速筛选。
     * @param {ConvexGeometry} convex - 待扫掠的凸体几何
     * @param {Transform} begin - 凸体的初始变换（位置/旋转）
     * @param {Vec3} translation - 凸体的扫掠位移向量
     * @param {ConvexCastWrapper} callback - 扫掠检测回调函数
     * @returns {void}
     */
    public convexCast(convex: ConvexGeometry, begin: Transform, translation: Vec3, callback: ConvexCastWrapper): void {
        let p = this._proxyList;
        while (p) {
            const n = p.next;
            const abi = this._aabb.min.elements, aba = this._aabb.max.elements, pe = p.size;
            Method.copyElements(pe, abi, 0, 0, 3);
            Method.copyElements(pe, aba, 3, 0, 3);
            this._convexSweep.init(convex, begin, translation);
            const gjkEpa = GjkEpa.instance;
            if (gjkEpa.computeClosestPointsImpl(this._convexSweep, this._aabb, begin, this.identity, null, false) === 0 && gjkEpa.distance <= 0) {
                callback.process(p);
            }
            p = n;
        }
    }

    /**
     * AABB测试。
     * 实现父类抽象方法，核心逻辑：
     * 1. 遍历所有物理代理，获取测试AABB的数组数据；
     * 2. 调用Method.boxIntersectsBox判断测试AABB与代理AABB是否相交；
     * 3. 相交则调用callback.process，传入代理执行自定义处理；
     * 应用场景：区域内形状检索、碰撞体范围查询等。
     * @param {Aabb} aabb - 待测试的AABB包围盒
     * @param {AabbTestWrapper} callback - AABB测试回调函数
     * @returns {void}
     */
    public aabbTest(aabb: Aabb, callback: AabbTestWrapper): void {
        let p = this._proxyList, ae = aabb.elements;
        while (p) {
            let n = p.next;
            if (Method.boxIntersectsBox(ae, p.size)) {
                callback.process(p);
            }
            p = n;
        }
    }
}

export { BruteForceBroadPhase };