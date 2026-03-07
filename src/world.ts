import BruteForceBroadPhase from "./broad-phase/brute-force-broad-phase";
import ContactManager from "./constraint/contact/contact-manager";
import RayCastWrapper from "./common/ray-cast-wrapper";
import ConvexCastWrapper from "./common/convex-cast-wrapper";
import AabbTestWrapper from "./common/aabb-test-wrapper";
import Island from "./common/island";
import { BROAD_PHASE_TYPE, CONSTANT, RIGID_BODY_TYPE, SIMULATE_STATE } from "./constant";
import TimeStep from "./common/time-step";
import InfoDisplay from "./common/info-display";
import BvhBroadPhase from "./broad-phase/bvh-broad-phase/bvh-broad-phase";
import Method from "./common/method";
import Vec3 from "./common/vec3";
import BroadPhase from "./broad-phase/broad-phase";
import ConvexGeometry from "./shape/convex-geometry";
import Transform from "./common/transform";
import RigidBody from "./rigid-body/rigid-body";
import Joint from "./constraint/joint/joint";
import RayCastCallback from "./common/ray-cast-callback";
import Aabb from "./common/aabb";
import AabbTestCallback from "./common/aabb-test-callback";
import ConstraintSolver from "./constraint/solver/constraint-solver";
import { Nullable } from "./common/nullable";

/**
 * 模拟动画控制器接口。
 * 物理世界的动画循环控制器，用于驱动物理步进的定时执行；
 * 需由业务层实现，提供回调绑定、启动/停止控制能力。
 */
interface ISimulateAnimation {
    /** 每次动画帧触发的回调（绑定物理世界step方法） */
    callback: () => void,
    /** 启动动画循环 */
    start: () => void,
    /** 停止动画循环 */
    stop: () => void,
}

/**
 * 物理世界初始化配置项。
 * 理世界创建时的核心配置，支持自定义宽相位类型、重力、步进间隔等。
 */
interface IWorldOptions {
    /** 可选，模拟动画控制器工厂方法，入参为步进间隔（毫秒），返回控制器实例 */
    simulateAnimation?: (intervalInMs: number) => ISimulateAnimation,
    /** 可选，宽相位检测类型（默认BVH），取值见BROAD_PHASE_TYPE */
    broadPhaseType?: number,
    /** 可选，世界重力向量（默认Vec3(0, -9.8, 0)，标准重力） */
    gravity?: Vec3,
    /** 可选，物理步进间隔（秒），默认0.01666（约60FPS） */
    intervalInSecond?: number,
    /** 可选，性能监控开关/实例，true则创建默认InfoDisplay，也可传入自定义实例 */
    stats?: InfoDisplay | boolean
}

/**
 * 物理引擎核心世界类。
 * 物理引擎的顶层管理类，负责：
 * 1. 初始化宽相位、接触管理器、性能监控等核心组件；
 * 2. 管理刚体（RigidBody）和关节（Joint）的添加/移除；
 * 3. 驱动物理步进（step），包含接触更新、岛屿构建与求解；
 * 4. 提供射线检测、凸体投射、AABB检测等物理查询能力。
 */
class World {
    /** 宽相位检测实例（BVH/暴力检测二选一），只读 */
    public readonly broadPhase!: BroadPhase;
    /** 接触管理器，负责形状间接触的检测与管理，只读 */
    public readonly contactManager: ContactManager;
    /** 世界内形状总数 */
    public numShapes = 0;
    /** 形状ID计数器（用于生成唯一形状ID） */
    public shapeIdCount = 0;
    /** 位置求解迭代次数（默认5次） */
    public numPositionIterations = 5;
    /** 速度求解迭代次数（默认10次） */
    public numVelocityIterations = 10;
    /** 物理步进前置回调（step执行前触发） */
    public beforeCall: Nullable<() => void>;
    /** 物理步进后置回调（step执行后触发） */
    public afterCall: Nullable<() => void>;
    /** 世界重力向量（默认(0, -9.8, 0)） */
    public gravity: Vec3 = new Vec3(0, -9.8, 0);
    /** 物理步进间隔（秒），默认0.01666 */
    public interval: number;
    /** 性能监控实例（可选，由stats配置项控制创建），只读 */
    public readonly performance?: InfoDisplay;

    private _timer: Nullable<ISimulateAnimation>;
    private _rigidBodyList: Nullable<RigidBody>;
    private _rigidBodyListLast: Nullable<RigidBody>;
    private _jointList: Nullable<Joint>;
    private _jointListLast: Nullable<Joint>;
    private _numRigidBodies = 0;
    private _numJoints = 0;
    private _numIslands = 0;
    private _rayCastWrapper = new RayCastWrapper();
    private _convexCastWrapper = new ConvexCastWrapper();
    private _aabbTestWrapper = new AabbTestWrapper();
    private _island = new Island();
    private _solversInIslands: Array<Nullable<ConstraintSolver>> = new Array(CONSTANT.SETTING_ISLAND_INITIAL_CONSTRAINT_ARRAY_SIZE);
    private _rigidBodyStack: Array<Nullable<RigidBody>> = new Array(CONSTANT.SETTING_ISLAND_INITIAL_RIGID_BODY_ARRAY_SIZE);
    private _timeStep = new TimeStep();
    private _lastInterval = 0;
    private _numSolversInIslands = 0;
    private _tv0 = new Vec3();
    private _tv1 = new Vec3();

    /**
     * 构造函数：初始化物理世界。
     * 核心初始化流程：
     * 1. 创建宽相位实例（默认BVH，可选暴力检测）；
     * 2. 初始化步进间隔、重力、模拟动画控制器；
     * 3. 创建接触管理器、性能监控实例（若配置）。
     * @param {IWorldOptions} optional - 初始化配置项
     */
    constructor(optional: IWorldOptions) {
        const broadPhaseType = optional.broadPhaseType || BROAD_PHASE_TYPE.BVH;
        switch (broadPhaseType) {
            case BROAD_PHASE_TYPE.BRUTE_FORCE:
                this.broadPhase = new BruteForceBroadPhase() as unknown as BroadPhase;
                break;
            case BROAD_PHASE_TYPE.BVH:
                this.broadPhase = new BvhBroadPhase() as unknown as BroadPhase;
                break;
            default:
                console.error('world: have no such broad-phase-type-', broadPhaseType);
                break;
        }
        this.interval = optional.intervalInSecond || 0.01666;
        if (optional.simulateAnimation) {
            this._timer = optional.simulateAnimation(this.interval * 1000);
            this._timer.callback = () => {
                this.step();
            };
        }

        this.contactManager = new ContactManager(this.broadPhase);
        if (optional.gravity) this.gravity = optional.gravity;
        this.performance = optional.stats ? new InfoDisplay(this) : undefined;
    }

    /**
     * 物理模拟状态设置器。
     * 控制物理模拟的启动/停止/单次执行：
     * 1. START：启动动画循环，定时执行step；
     * 2. STOP：停止动画循环；
     * 3. IMMEDIATELY：立即执行一次step；
     * 注意：需先配置simulateAnimation，否则报错。
     * @param {SIMULATE_STATE} state - 模拟状态（START/STOP/IMMEDIATELY）
     */
    public set simulate(state: SIMULATE_STATE) {
        if (!this._timer) {
            console.error('world: please set simulateAnimation option');
            return;
        }
        switch (state) {
            case SIMULATE_STATE.START:
                this._timer.start();
                break;
            case SIMULATE_STATE.STOP:
                this._timer.stop();
                break;
            case SIMULATE_STATE.IMMEDIATELY:
                this.step();
                break;
            default:
                this.step();
                break;
        }
    }

    /**
     * 物理步进（核心单帧物理求解逻辑）。
     * 核心流程：
     * 1. 执行前置回调 → 记录性能时间戳；
     * 2. 更新时间步参数（dt变化时同步dtRatio/invDt）；
     * 3. 更新接触 → 构建并求解岛屿 → 更新刚体3D对象变换；
     * 4. 记录性能耗时 → 执行后置回调。
     * @param {number} [timeStep] - 可选，自定义步进间隔（秒），默认使用world.interval
     */
    public step(timeStep?: number): void {
        if (this.beforeCall) this.beforeCall();
        if (this.performance) this.performance.setTime(0);
        const step = timeStep || this.interval;
        if (step !== this._lastInterval) {
            if (this._timeStep.dt > 0) this._timeStep.dtRatio = step / this._timeStep.dt;
            this._timeStep.dt = step;
            this._timeStep.invDt = 1 / step;
            this._lastInterval = step;
        }
        this._updateContacts();
        this._solveIslands();
        for (let rgb = this._rigidBodyList; !!rgb; rgb = rgb.next) {
            if (rgb.type === RIGID_BODY_TYPE.STATIC || rgb.sleeping) continue;
            rgb.updateObject3Ds();
        }
        if (this.performance) {
            this.performance.calcEnd();
        }
        if (this.afterCall) this.afterCall();
    }

    /**
     * 添加刚体到物理世界。
     * 核心逻辑：
     * 1. 校验刚体归属，避免重复添加；
     * 2. 将刚体加入世界链表，设置所属世界；
     * 3. 为刚体所有形状创建宽相位代理，分配唯一ID；
     * 4. 递增刚体/形状计数。
     * @param {RigidBody} rigidBody - 待添加的刚体实例
     * @throws {Error} 刚体已属于其他世界时抛出错误
     */
    public addRigidBody(rigidBody: RigidBody): void {
        if (rigidBody.world) {
            throw new Error("A rigid body cannot belong to multiple worlds.");
        }
        if (!this._rigidBodyList) {
            this._rigidBodyList = rigidBody;
            this._rigidBodyListLast = rigidBody;
        } else {
            this._rigidBodyListLast!.next = rigidBody;
            rigidBody.prev = this._rigidBodyListLast;
            this._rigidBodyListLast = rigidBody;
        }
        rigidBody.world = this;
        let s = rigidBody.shapeList;
        while (s) {
            const n = s.next;
            s.proxy = this.broadPhase.createProxy(s, s.aabb);
            s.id = this.shapeIdCount++;
            this.numShapes++;
            s = n!;
        }
        this._numRigidBodies++;
    }

    /**
     * 从物理世界移除刚体。
     * 核心逻辑：
     * 1. 校验刚体归属，确保属于当前世界；
     * 2. 从世界链表移除刚体，清空所属世界；
     * 3. 销毁刚体所有形状的宽相位代理，清理关联接触；
     * 4. 递减刚体/形状计数。
     * @param {RigidBody} rigidBody - 待移除的刚体实例
     * @throws {Error} 刚体不属于当前世界时抛出错误
     */
    public removeRigidBody(rigidBody: RigidBody): void {
        if (rigidBody.world !== this) {
            throw new Error("The rigid body doesn't belong to the world.");
        }
        const prev = rigidBody.prev;
        const next = rigidBody.next;
        if (prev) {
            prev.next = next;
        }
        if (next) {
            next.prev = prev;
        }
        if (rigidBody === this._rigidBodyList) {
            this._rigidBodyList = this._rigidBodyList.next;
        }
        if (rigidBody === this._rigidBodyListLast) {
            this._rigidBodyListLast = this._rigidBodyListLast.prev;
        }
        rigidBody.next = null;
        rigidBody.prev = null;
        rigidBody.world = null;
        let s = rigidBody.shapeList;
        while (s) {
            const n = s.next;
            this.broadPhase.destroyProxy(s.proxy!);
            s.proxy = null;
            s.id = -1;
            let cl = s.rigidBody!.contactLinkList;
            while (cl) {
                const n = cl.next!;
                const c = cl.contact!;
                if (c.shape1 === s || c.shape2 === s) {
                    const _this = cl.other!;
                    _this.sleeping = false;
                    _this.sleepTime = 0;
                    const _this1 = this.contactManager;
                    const prev = c.prev;
                    const next = c.next;
                    if (prev) {
                        prev.next = next;
                    }
                    if (next) {
                        next.prev = prev;
                    }
                    if (c === _this1.contactList) {
                        _this1.contactList = _this1.contactList.next!;
                    }
                    if (c === _this1.contactListLast) {
                        _this1.contactListLast = _this1.contactListLast.prev!;
                    }
                    c.next = null;
                    c.prev = null;
                    if (c.touching) {
                        const cc1 = c.shape1!.contactCallback;
                        let cc2 = c.shape2!.contactCallback;
                        if (cc1 === cc2) {
                            cc2 = null;
                        }
                        if (cc1) {
                            cc1.endContact(c);
                        }
                        if (cc2) {
                            cc2.endContact(c);
                        }
                    }
                    const prev1 = c.link1.prev;
                    const next1 = c.link1.next;
                    if (prev1) {
                        prev1.next = next1;
                    }
                    if (next1) {
                        next1.prev = prev1;
                    }
                    if (c.link1 === c.rigidBody1!.contactLinkList) {
                        c.rigidBody1!.contactLinkList = c.rigidBody1!.contactLinkList.next;
                    }
                    if (c.link1 === c.rigidBody1!.contactLinkListLast) {
                        c.rigidBody1!.contactLinkListLast = c.rigidBody1!.contactLinkListLast.prev;
                    }
                    c.link1.next = null;
                    c.link1.prev = null;
                    const prev2 = c.link2.prev;
                    const next2 = c.link2.next;
                    if (prev2) {
                        prev2.next = next2;
                    }
                    if (next2) {
                        next2.prev = prev2;
                    }
                    if (c.link2 === c.rigidBody2!.contactLinkList) {
                        c.rigidBody2!.contactLinkList = c.rigidBody2!.contactLinkList.next;
                    }
                    if (c.link2 === c.rigidBody2!.contactLinkListLast) {
                        c.rigidBody2!.contactLinkListLast = c.rigidBody2!.contactLinkListLast.prev;
                    }
                    c.link2.next = null;
                    c.link2.prev = null;
                    c.rigidBody1!.numContactLinks--;
                    c.rigidBody2!.numContactLinks--;
                    c.link1.other = null;
                    c.link2.other = null;
                    c.link1.contact = null;
                    c.link2.contact = null;
                    c.shape1 = null;
                    c.shape2 = null;
                    c.rigidBody1 = null;
                    c.rigidBody2 = null;
                    c.touching = false;
                    c.cachedDetectorData.clear();
                    c.manifold.clear();
                    c.detector = null;
                    const _this2 = c.contactConstraint;
                    _this2.shape1 = null;
                    _this2.shape2 = null;
                    _this2.rigidBody1 = null;
                    _this2.rigidBody2 = null;
                    _this2.transform1 = null;
                    _this2.transform2 = null;
                    c.next = _this1.contactPool;
                    _this1.contactPool = c;
                    _this1.numContacts--;
                }
                cl = n;
            }
            this.numShapes--;
            s = n!;
        }
        this._numRigidBodies--;
    }

    /**
     * 添加关节到物理世界。
     * 核心逻辑：
     * 1. 校验关节归属，避免重复添加；
     * 2. 将关节加入世界链表，设置所属世界；
     * 3. 关联关节与刚体的链接列表，唤醒关联刚体；
     * 4. 同步关节锚点，递增关节计数。
     * @param {Joint} joint - 待添加的关节实例
     * @throws {Error} 关节已属于其他世界时抛出错误
     */
    public addJoint(joint: Joint): void {
        if (joint.world) {
            throw new Error("A joint cannot belong to multiple worlds.");
        }
        if (!this._jointList) {
            this._jointList = joint;
            this._jointListLast = joint;
        } else {
            this._jointListLast!.next = joint;
            joint.prev = this._jointListLast!;
            this._jointListLast = joint;
        }
        joint.world = this;
        joint.link1.other = joint.rigidBody2;
        joint.link2.other = joint.rigidBody1;
        if (!joint.rigidBody1.jointLinkList) {
            joint.rigidBody1.jointLinkList = joint.link1;
            joint.rigidBody1.jointLinkListLast = joint.link1;
        } else {
            joint.rigidBody1.jointLinkListLast!.next = joint.link1;
            joint.link1.prev = joint.rigidBody1.jointLinkListLast!;
            joint.rigidBody1.jointLinkListLast = joint.link1;
        }
        if (!joint.rigidBody2.jointLinkList) {
            joint.rigidBody2.jointLinkList = joint.link2;
            joint.rigidBody2.jointLinkListLast = joint.link2;
        } else {
            joint.rigidBody2.jointLinkListLast!.next = joint.link2;
            joint.link2.prev = joint.rigidBody2.jointLinkListLast!;
            joint.rigidBody2.jointLinkListLast = joint.link2;
        }
        joint.rigidBody1.numJointLinks++;
        joint.rigidBody2.numJointLinks++;
        let _this = joint.rigidBody1;
        _this.sleeping = false;
        _this.sleepTime = 0;
        let _this1 = joint.rigidBody2;
        _this1.sleeping = false;
        _this1.sleepTime = 0;
        joint.syncAnchors();
        this._numJoints++;
    }

    /**
     * 从物理世界移除关节。
     * 核心逻辑：
     * 1. 校验关节归属，确保属于当前世界；
     * 2. 从世界链表移除关节，清空所属世界；
     * 3. 清理关节与刚体的链接列表，唤醒关联刚体；
     * 4. 递减关节计数。
     * @param {Joint} joint - 待移除的关节实例
     * @throws {Error} 关节不属于当前世界时抛出错误
     */
    public removeJoint(joint: Joint): void {
        if (joint.world !== this) {
            throw new Error("The joint doesn't belong to the world.");
        }
        let prev = joint.prev;
        let next = joint.next;
        if (prev) {
            prev.next = next;
        }
        if (next) {
            next.prev = prev;
        }
        if (joint === this._jointList) {
            this._jointList = this._jointList.next;
        }
        if (joint === this._jointListLast) {
            this._jointListLast = this._jointListLast.prev;
        }
        joint.next = null;
        joint.prev = null;
        joint.world = null;
        let prev1 = joint.link1.prev;
        let next1 = joint.link1.next;
        if (prev1) {
            prev1.next = next1;
        }
        if (next1) {
            next1.prev = prev1;
        }
        if (joint.link1 === joint.rigidBody1.jointLinkList) {
            joint.rigidBody1.jointLinkList = joint.rigidBody1.jointLinkList.next;
        }
        if (joint.link1 === joint.rigidBody1.jointLinkListLast) {
            joint.rigidBody1.jointLinkListLast = joint.rigidBody1.jointLinkListLast.prev;
        }
        joint.link1.next = null;
        joint.link1.prev = null;
        let prev2 = joint.link2.prev;
        let next2 = joint.link2.next;
        if (prev2) {
            prev2.next = next2;
        }
        if (next2) {
            next2.prev = prev2;
        }
        if (joint.link2 === joint.rigidBody2.jointLinkList) {
            joint.rigidBody2.jointLinkList = joint.rigidBody2.jointLinkList.next;
        }
        if (joint.link2 === joint.rigidBody2.jointLinkListLast) {
            joint.rigidBody2.jointLinkListLast = joint.rigidBody2.jointLinkListLast.prev;
        }
        joint.link2.next = null;
        joint.link2.prev = null;
        joint.link1.other = null;
        joint.link2.other = null;
        joint.rigidBody1.numJointLinks--;
        joint.rigidBody2.numJointLinks--;
        let _this = joint.rigidBody1;
        _this.sleeping = false;
        _this.sleepTime = 0;
        let _this1 = joint.rigidBody2;
        _this1.sleeping = false;
        _this1.sleepTime = 0;
        this._numJoints--;
    }

    /**
     * 射线检测（宽相位筛选+高精度检测）。
     * 核心流程：
     * 1. 转换起止点到内部Vec3实例；
     * 2. 配置射线检测包装器；
     * 3. 调用宽相位射线检测，触发高精度检测和回调。
     * @param {{x: number, y: number, z: number}} _begin - 射线起点（世界坐标）
     * @param {{x: number, y: number, z: number}} _end - 射线终点（世界坐标）
     * @param {RayCastCallback} [callback] - 可选，命中回调（处理相交结果）
     */
    public rayCast(_begin: { x: number, y: number, z: number }, _end: { x: number, y: number, z: number }, callback?: RayCastCallback): void {
        Method.setXYZ(this._tv0, _begin.x, _begin.y, _begin.z);
        Method.setXYZ(this._tv1, _end.x, _end.y, _end.z);
        const begin = this._tv0.elements, end = this._tv1.elements;
        const s = this._rayCastWrapper.begin.elements;
        s[0] = begin[0]; s[1] = begin[1]; s[2] = begin[2];
        const e = this._rayCastWrapper.end.elements;
        e[0] = end[0]; e[1] = end[1]; e[2] = end[2];
        this._rayCastWrapper.callback = callback;
        this.broadPhase.rayCast(this._tv0, this._tv1, this._rayCastWrapper);
    }

    /**
     * 凸体投射（凸几何体沿指定方向投射检测）。
     * 配置凸体投射包装器，调用宽相位凸体投射检测。
     * @param {ConvexGeometry} convex - 待投射的凸几何体
     * @param {Transform} begin - 投射起始变换（位置+旋转）
     * @param {Vec3} translation - 投射方向/位移向量
     * @param {RayCastCallback} callback - 命中回调
     */
    public convexCast(convex: ConvexGeometry, begin: Transform, translation: Vec3, callback: RayCastCallback): void {
        this._convexCastWrapper.convex = convex;
        Method.copyElements(begin.elements, this._convexCastWrapper.begin.elements);
        Method.copyElements(translation.elements, this._convexCastWrapper.translation.elements);
        this._convexCastWrapper.callback = callback;
        this.broadPhase.convexCast(convex, begin, translation, this._convexCastWrapper);
    }

    /**
     * AABB检测（检测与指定AABB相交的形状）。
     * 配置AABB检测包装器，调用宽相位AABB检测。
     * @param {Aabb} aabb - 待检测的AABB（世界坐标）
     * @param {AabbTestCallback} callback - 相交回调（处理相交的形状）
     */
    public aabbTest(aabb: Aabb, callback: AabbTestCallback): void {
        this._aabbTestWrapper.aabb.copyFrom(aabb);
        this._aabbTestWrapper.callback = callback;
        this.broadPhase.aabbTest(aabb, this._aabbTestWrapper);
    }

    /**
     * 获取世界内刚体数量
     * @returns {number} 刚体总数
     */
    public get numRigidBodies(): number {
        return this._numRigidBodies;
    }

    /**
     * 获取世界内关节数量
     * @returns {number} 关节总数
     */
    public get numJoints(): number {
        return this._numJoints;
    }

    /**
     * 获取当前岛屿数量
     * @returns {number} 岛屿总数
     */
    public get numIslands(): number {
        return this._numIslands;
    }

    /**
     * 更新接触（宽相位+窄相位）。
     * 核心逻辑：
     * 1. 记录宽相位开始时间戳；
     * 2. 调用接触管理器更新接触；
     * 3. 计算宽相位耗时，遍历接触更新流形；
     * 4. 计算窄相位耗时。
     */
    private _updateContacts(): void {
        if (this.performance) this.performance.setTime(1);
        this.contactManager.updateContacts();
        if (this.performance) this.performance.calcBroadPhase();
        let c = this.contactManager.contactList;
        while (c) {
            let n = c.next;
            if (!c.shouldBeSkipped) {
                c.updateManifold();
            }
            c = n!;
        }
        if (this.performance) this.performance.calcNarrowPhase();
    }

    /**
     * 求解岛屿（物理求解核心逻辑）。
     * 核心流程：
     * 1. 禁用休眠时唤醒所有刚体；
     * 2. 扩容刚体栈（按需），重置岛屿计数；
     * 3. 遍历刚体：构建并求解独立岛屿（无接触/关节的刚体单独步进）；
     * 4. 接触后处理，重置刚体/求解器状态；
     * 5. 清空刚体受力/扭矩，记录求解结束时间戳。
     */
    private _solveIslands(): void {
        if (CONSTANT.SETTING_DISABLE_SLEEPING) {
            let b = this._rigidBodyList;
            while (b) {
                b.sleeping = false;
                b.sleepTime = 0;
                b = b.next;
            }
        }
        if (this._rigidBodyStack.length < this._numRigidBodies) {
            let newStackSize = this._rigidBodyStack.length << 1;
            while (newStackSize < this._numRigidBodies) newStackSize <<= 1;
            this._rigidBodyStack = new Array(newStackSize);
        }
        this._numIslands = 0;
        Method.copyElements(this.gravity.elements, this._island.gravity);
        let b = this._rigidBodyList;
        this._numSolversInIslands = 0;
        while (b) {
            let n = b.next;
            if (!(b.addedToIsland || b.sleeping || b.type === RIGID_BODY_TYPE.STATIC)) {
                if (b.numContactLinks === 0 && b.numJointLinks === 0) {
                    this._island.stepSingleRigidBody(this._timeStep, b);
                    this._numIslands++;
                } else {
                    this._buildIsland(b);
                    this._island.step(this._timeStep, this.numVelocityIterations, this.numPositionIterations);
                    this._island.clear();
                    this._numIslands++;
                }
            }
            b = n;
        }
        this.contactManager.postSolve();
        b = this._rigidBodyList;
        while (b) {
            b.addedToIsland = false;
            b = b.next;
        }
        b = this._rigidBodyList;
        while (b) {
            let force = b.force, torque = b.torque;
            force[0] = 0; force[1] = 0; force[2] = 0;
            torque[0] = 0; torque[1] = 0; torque[2] = 0;
            b = b.next;
        }
        while (this._numSolversInIslands > 0) {
            this._solversInIslands[--this._numSolversInIslands]!.addedToIsland = false;
            this._solversInIslands[this._numSolversInIslands] = null;
        }
        if (this.performance) this.performance.setTime(4);
    }

    /**
     * 构建岛屿（深度优先遍历关联刚体/约束）。
     * 核心逻辑：
     * 1. 初始化栈，将起始刚体加入岛屿；
     * 2. 遍历栈内刚体：
     *    - 处理接触链接：添加接触约束求解器，关联刚体入栈；
     *    - 处理关节链接：添加关节约束求解器，关联刚体入栈；
     * 3. 自动扩容约束求解器数组（按需）。
     * @param {RigidBody} base - 起始刚体（岛屿根节点）
     */
    private _buildIsland(base: RigidBody): void {
        let stackCount = 1;
        this._island.addRigidBody(base);
        this._rigidBodyStack[0] = base;
        while (stackCount > 0) {
            let rb = this._rigidBodyStack[--stackCount]!;
            this._rigidBodyStack[stackCount] = null;
            if (rb.type === RIGID_BODY_TYPE.STATIC) {
                continue;
            }
            let cl = rb.contactLinkList;
            while (cl) {
                let n = cl.next;
                let cc = cl.contact!.contactConstraint;
                let ccs = cl.contact!.contactConstraint.solver;
                if (cc.isTouching() && !ccs.addedToIsland) {
                    if (this._solversInIslands.length === this._numSolversInIslands) {
                        let newArray = new Array(this._numSolversInIslands << 1);
                        let _g = 0, _g1 = this._numSolversInIslands;
                        while (_g < _g1) {
                            let i = _g++;
                            newArray[i] = this._solversInIslands[i];
                            this._solversInIslands[i] = null;
                        }
                        this._solversInIslands = newArray;
                    }
                    this._solversInIslands[this._numSolversInIslands++] = ccs;
                    this._island.addConstraintSolver(ccs, cc.positionCorrectionAlgorithm!);
                    let other = cl.other!;
                    if (!other.addedToIsland) {
                        this._island.addRigidBody(other);
                        this._rigidBodyStack[stackCount++] = other;
                    }
                }
                cl = n;
            }
            let jl = rb.jointLinkList;
            while (jl) {
                let n = jl.next;
                let j = jl.joint;
                let js1 = j.solver!;
                if (!js1.addedToIsland) {
                    if (this._solversInIslands.length === this._numSolversInIslands) {
                        let newArray = new Array(this._numSolversInIslands << 1);
                        let _g = 0, _g1 = this._numSolversInIslands;
                        while (_g < _g1) {
                            let i = _g++;
                            newArray[i] = this._solversInIslands[i];
                            this._solversInIslands[i] = null;
                        }
                        this._solversInIslands = newArray;
                    }
                    this._solversInIslands[this._numSolversInIslands++] = js1;
                    this._island.addConstraintSolver(js1, j.positionCorrectionAlgorithm);
                    let other = jl.other!;
                    if (!other.addedToIsland) {
                        this._island.addRigidBody(other);
                        this._rigidBodyStack[stackCount++] = other;
                    }
                }
                jl = n;
            }
        }
    }
}

export type {
    IWorldOptions,
    ISimulateAnimation,
};
export {
    World,
};