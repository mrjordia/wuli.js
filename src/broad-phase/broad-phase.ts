import ConvexSweepGeometry from "../shape/convex-sweep-geometry";
import AabbGeometry from "../shape/aabb-geometry";
import RayCastHit from "../shape/ray-cast-hit";
import Vec3 from "../common/vec3";
import Transform from "../common/transform";
import ProxyPair from "./proxy-pair";
import Method from "../common/method";
import { BROAD_PHASE_TYPE } from "../constant";
import PhysicsProxy from "./physics-proxy";
import Aabb from "../common/aabb";
import ConvexCastWrapper from "../common/convex-cast-wrapper";
import Shape from "../shape/shape";
import RayCastWrapper from "../common/ray-cast-wrapper";
import ConvexGeometry from "../shape/convex-geometry";
import AabbTestWrapper from "../common/aabb-test-wrapper";
import { Nullable } from "../common/nullable";

/**
 * 粗检测抽象基类。
 * 物理引擎中碰撞粗检测的核心抽象类，定义粗检测的通用接口与基础能力；
 * 粗检测是物理碰撞检测的第一阶段，核心目标：
 * 1. 快速筛选出可能发生碰撞的形状对（ProxyPair），排除大量无碰撞可能的形状；
 * 2. 为细检测（Narrowphase）提供候选碰撞对，大幅降低细检测的计算开销；
 * 3. 支持射线检测、凸体扫掠检测、AABB测试等通用空间查询能力；
 * 主要特性：
 * - 管理PhysicsProxy实例的生命周期（创建/销毁/移动）；
 * - 维护代理链表、碰撞对链表、碰撞对对象池，优化内存与性能；
 * - 定义抽象接口，由具体实现类（如GridBroadphase、SAPBroadphase）实现不同粗检测算法。
 */
export default abstract class BroadPhase {
    protected _numProxies = 0;
    protected _proxyList: Nullable<PhysicsProxy>;
    protected _proxyListLast: Nullable<PhysicsProxy>;
    protected _proxyPairPool: Nullable<ProxyPair>;
    protected _idCount = 0;
    protected _convexSweep = new ConvexSweepGeometry();
    protected _aabb = new AabbGeometry();
    protected _bv0 = new Float64Array(3);

    private _tb = new Float64Array(6);

    /**
     * 粗检测类型标识。
     * 标记当前粗检测实例的具体类型（如网格型、扫描型等）；
     * 由构造函数初始化，只读属性，不可运行时修改。
     */
    public readonly type: BROAD_PHASE_TYPE;

    /**
     * 碰撞对链表头节点。
     * 指向当前帧检测出的候选碰撞对链表的第一个节点；
     * collectPairs方法会更新该链表，用于后续细检测阶段处理。
     */
    public proxyPairList: Nullable<ProxyPair>;

    /**
     * 增量检测开关。
     * 是否启用增量式粗检测；
     * 增量检测仅处理位置变化的代理，减少不必要的计算，初始值为false。
     */
    public incremental = false;

    /**
     * 检测计数。
     * 统计当前帧粗检测的碰撞对测试次数；
     * 用于性能分析与调优，每帧检测完成后可重置。
     */
    public testCount = 0;

    /**
     * 单位变换矩阵。
     * 预初始化的单位Transform实例（无平移、无旋转）；
     * 用于不需要变换的几何检测场景，避免频繁创建单位矩阵。
     */
    public identity = new Transform();

    /**
     * 零向量。
     * 预初始化的零向量（x=0,y=0,z=0）；
     * 用于位移、方向等参数的默认值场景，提升代码复用性。
     */
    public zero = new Vec3();

    /**
     * 射线检测命中结果。
     * 预初始化的RayCastHit实例，用于存储射线检测的命中数据；
     * 如命中点、法向量、命中比例等，避免频繁创建实例。
     */
    public raycastHit = new RayCastHit();

    /**
     * 构造函数：初始化粗检测抽象类。
     * 核心初始化逻辑：
     * 1. 初始化粗检测类型（只读属性）；
     * 2. 预创建常用的临时对象（identity变换、zero向量、raycastHit等）；
     * 3. 初始化内部缓存（_bv0、_tb）和对象池（_proxyPairPool）；
     * 注意：抽象类不可直接实例化，需由子类实现抽象方法后使用。
     * @param {BROAD_PHASE_TYPE} type - 粗检测类型标识
     */
    constructor(type: BROAD_PHASE_TYPE) {
        this.type = type;
    }

    /**
     * 创建物理代理抽象方法。
     * 子类需实现该方法，完成PhysicsProxy的创建与注册：
     * 1. 为Shape分配唯一ID，创建PhysicsProxy实例；
     * 2. 初始化代理的AABB数据，将代理加入链表；
     * 3. 更新_proxyList、_proxyListLast、_numProxies等状态。
     * @param {Shape} userData - 关联的物理形状实例
     * @param {Aabb} aabb - 形状的AABB包围盒
     * @returns {any} - 创建的PhysicsProxy实例（具体返回值由子类定义）
     */
    public abstract createProxy(userData: Shape, aabb: Aabb): any;

    /**
     * 销毁物理代理抽象方法。
     * 子类需实现该方法，完成PhysicsProxy的销毁与清理：
     * 1. 将代理从链表中移除，更新_proxyList、_proxyListLast；
     * 2. 递减_numProxies，清理代理的关联数据；
     * 3. 可选：将代理回收至对象池（如有）。
     * @param {PhysicsProxy} proxy - 待销毁的物理代理实例
     * @returns {void}
     */
    public abstract destroyProxy(proxy: PhysicsProxy): void;

    /**
     * 移动物理代理抽象方法。
     * 子类需实现该方法，处理代理位置变化：
     * 1. 更新代理的AABB数据（size数组）；
     * 2. 根据粗检测算法更新代理在空间分区中的位置；
     * 3. 增量检测模式下标记代理为"已变化"，触发后续重检测。
     * @param {PhysicsProxy} proxy - 待移动的物理代理实例
     * @param {Aabb} aabb - 代理新的AABB包围盒
     * @param {Vec3} displacement - 代理的位移向量
     * @returns {void}
     */
    public abstract moveProxy(proxy: PhysicsProxy, aabb: Aabb, displacement: Vec3): void;

    /**
     * 判断两个代理的AABB是否重叠。
     * 通用的AABB重叠判断实现：
     * 1. 获取两个代理的AABB数据（size数组）；
     * 2. 调用Method.boxIntersectsBox方法判断AABB是否相交；
     * 该方法为所有粗检测子类提供统一的重叠判断逻辑。
     * @param {PhysicsProxy} proxy1 - 第一个物理代理
     * @param {PhysicsProxy} proxy2 - 第二个物理代理
     * @returns {boolean} - 重叠结果：true=AABB相交，false=AABB分离
     */
    public isOverlapping(proxy1: PhysicsProxy, proxy2: PhysicsProxy): boolean {
        const o = proxy1.size, t = proxy2.size;
        return Method.boxIntersectsBox(o, t);
    }

    /**
     * 收集碰撞对抽象方法。
     * 子类需实现该方法，筛选出所有候选碰撞对：
     * 1. 遍历所有物理代理，通过AABB重叠判断筛选可能碰撞的代理对；
     * 2. 从_proxyPairPool获取ProxyPair实例，填充proxy1/proxy2；
     * 3. 将碰撞对加入proxyPairList链表，更新testCount计数。
     * @returns {void}
     */
    public abstract collectPairs(): void;

    /**
     * 射线检测抽象方法。
     * 子类需实现该方法，完成射线与代理的相交检测：
     * 1. 遍历代理链表，调用raycastTest判断射线与代理AABB是否相交；
     * 2. 对相交的代理，通过callback回调执行细检测；
     * 3. 支持回调中断（如检测到第一个命中后停止）。
     * @param {Vec3} begin - 射线起点
     * @param {Vec3} end - 射线终点
     * @param {RayCastWrapper} callback - 射线检测回调函数
     * @returns {void}
     */
    public abstract rayCast(begin: Vec3, end: Vec3, callback: RayCastWrapper): void;

    /**
     * 凸体扫掠检测抽象方法。
     * 子类需实现该方法，完成凸体扫掠与代理的相交检测：
     * 1. 计算凸体扫掠后的AABB，筛选出可能相交的代理；
     * 2. 对候选代理，通过callback回调执行凸体-形状的细检测；
     * 3. 返回扫掠过程中的首次命中结果（如有）。
     * @param {ConvexGeometry} convex - 待扫掠的凸体几何
     * @param {Transform} begin - 凸体的初始变换（位置/旋转）
     * @param {Vec3} translation - 凸体的扫掠位移向量
     * @param {ConvexCastWrapper} callback - 扫掠检测回调函数
     * @returns {void}
     */
    public abstract convexCast(convex: ConvexGeometry, begin: Transform, translation: Vec3, callback: ConvexCastWrapper): void

    /**
     * AABB测试抽象方法。
     * 子类需实现该方法，筛选出与指定AABB相交的代理：
     * 1. 遍历代理链表，判断代理AABB与测试AABB是否相交；
     * 2. 对相交的代理，通过callback回调返回结果；
     * 常用于空间查询、区域内形状检索等场景。
     * @param {Aabb} aabb - 待测试的AABB包围盒
     * @param {AabbTestWrapper} callback - AABB测试回调函数
     * @returns {void}
     */
    public abstract aabbTest(aabb: Aabb, callback: AabbTestWrapper): void;

    /**
     * 获取/创建碰撞对并加入链表。
     * 碰撞对的复用与链表管理核心逻辑：
     * 1. 优先从_proxyPairPool对象池获取闲置的ProxyPair；
     * 2. 无闲置实例时，创建新的ProxyPair；
     * 3. 将获取/创建的ProxyPair加入proxyPairList链表头部；
     * 4. 重置ProxyPair的next属性，保证链表结构正确。
     * @returns {ProxyPair} - 可用的ProxyPair实例
     */
    protected setProxyPairList(): ProxyPair {
        let first = this._proxyPairPool;
        if (first) {
            this._proxyPairPool = first.next;
            first.next = null;
        } else {
            first = new ProxyPair();
        }
        let pp = first;
        if (!this.proxyPairList) {
            this.proxyPairList = pp;
        } else {
            pp.next = this.proxyPairList;
            this.proxyPairList = pp;
        }
        return pp;
    }

    /**
     * 射线与代理AABB相交测试。
     * 高精度射线-AABB相交判断实现：
     * 1. 初始化射线的AABB缓存（_tb），先做快速AABB重叠判断；
     * 2. 计算射线方向向量及绝对值，用于分离轴检测；
     * 3. 基于分离轴定理（SAT）判断射线与AABB是否相交；
     * 该方法为rayCast提供底层的相交判断能力。
     * @param {Float64Array} na - 代理的AABB数据（size数组）
     * @param {number} x1 - 射线起点X坐标
     * @param {number} y1 - 射线起点Y坐标
     * @param {number} z1 - 射线起点Z坐标
     * @param {number} x2 - 射线终点X坐标
     * @param {number} y2 - 射线终点Y坐标
     * @param {number} z2 - 射线终点Z坐标
     * @returns {boolean} - 相交结果：true=射线与AABB相交，false=不相交
     */
    protected raycastTest(na: Float64Array, x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): boolean {
        Method.setBox(x1, y1, z1, x2, y2, z2, this._tb);
        if (!Method.boxIntersectsBox(this._tb, na)) {
            return false;
        }
        const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1;
        const adx = dx > 0 ? dx : -dx, ady = dy > 0 ? dy : -dy, adz = dz > 0 ? dz : -dz;
        const ptx = (na[3] - na[0]) * 0.5, pty = (na[4] - na[1]) * 0.5, ptz = (na[5] - na[2]) * 0.5;
        const cpx = x1 - (na[3] + na[0]) * 0.5, cpy = y1 - (na[4] + na[1]) * 0.5, cpz = z1 - (na[5] + na[2]) * 0.5;
        let tmp1 = false, tmp2 = false;
        let x = cpy * dz - cpz * dy;
        if ((x > 0 ? x : -x) < (pty * adz + ptz * ady)) {
            x = cpz * dx - cpx * dz;
            tmp2 = (x > 0 ? x : -x) > (ptz * adx + ptx * adz);
        } else {
            tmp2 = true;
        }
        if (!tmp2) {
            x = cpx * dy - cpy * dx;
            tmp1 = (x > 0 ? x : -x) > (ptx * ady + pty * adx);
        } else {
            tmp1 = true;
        }
        return !tmp1;
    }

    /**
     * 添加代理到链表并初始化AABB。
     * 代理链表的通用添加逻辑：
     * 1. 递增代理数量，处理链表头/尾节点的初始化；
     * 2. 将新代理添加到链表尾部，维护双向链表的prev/next指针；
     * 3. 复制AABB数据到代理的size数组，完成代理初始化；
     * 该方法为createProxy提供统一的链表操作逻辑。
     * @param {number} numProxies - 当前代理数量（新增前）
     * @param {PhysicsProxy} p - 待添加的物理代理
     * @param {Aabb} aabb - 代理的AABB包围盒
     * @returns {number} - 更新后的代理总数
     */
    protected setProxyList(numProxies: number, p: PhysicsProxy, aabb: Aabb): number {
        let _numProxies = numProxies + 1;
        if (!this._proxyList) {
            this._proxyList = p;
            this._proxyListLast = p;
        } else {
            this._proxyListLast!.next = p;
            p.prev = this._proxyListLast!;
            this._proxyListLast = p;
        }
        let pe = p.size, ae = aabb.elements;
        Method.copyElements(ae, pe, 0, 0, 6);
        return _numProxies;
    }
}

export { BroadPhase };