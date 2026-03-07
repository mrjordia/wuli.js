import Transform from "../common/transform";
import Aabb from "../common/aabb";
import Vec3 from "../common/vec3";
import Method from "../common/method";
import ShapeConfig from "./shape-config";
import Geometry from "./geometry";
import ContactCallback from "../common/contact-callback";
import RigidBody from "../rigid-body/rigid-body";
import PhysicsProxy from "../broad-phase/physics-proxy";
import { Nullable } from "../common/nullable";

/**
 * 物理形状核心类。
 * 物理引擎中碰撞形状的核心封装，关联几何体、变换、物理属性（摩擦/恢复系数/密度），
 * 是刚体的碰撞单元，负责碰撞检测、AABB计算、宽相位代理管理等核心功能。
 * 每个Shape绑定到一个RigidBody，可通过链表组织多个Shape到同一个刚体上。
 */
export default class Shape {
    /** 形状唯一标识ID（-1表示未初始化） */
    public id = -1;
    /** 形状相对于刚体的本地变换（位置+旋转） */
    public localTransform = new Transform();
    /** 上一帧的世界变换（用于插值/碰撞检测的历史状态） */
    public ptransform = new Transform();
    /** 当前帧的世界变换（本地变换 × 刚体世界变换） */
    public transform = new Transform();
    /** 恢复系数（弹性，0=完全非弹性碰撞，1=完全弹性碰撞） */
    public restitution: number;
    /** 摩擦系数（0=无摩擦，1=最大静摩擦） */
    public friction: number;
    /** 形状关联的几何体（如球体/盒型/胶囊体等） */
    public geometry: Geometry;
    /** 碰撞组（用于碰撞过滤，仅与匹配的collisionMask碰撞） */
    public collisionGroup: number;
    /** 碰撞掩码（用于碰撞过滤，标识可碰撞的组） */
    public collisionMask: number;
    /** 接触回调（碰撞开始/持续/结束时触发的自定义逻辑） */
    public contactCallback: Nullable<ContactCallback>;
    /** 形状的AABB包围盒（用于宽相位检测） */
    public aabb = new Aabb();
    /** 宽相位代理（关联到BroadPhase的碰撞代理） */
    public proxy: Nullable<PhysicsProxy>;
    /** 绑定的刚体（Shape必须归属到一个RigidBody） */
    public rigidBody: Nullable<RigidBody>;
    /** 形状链表前驱节点（刚体的形状链表） */
    public prev: Nullable<Shape>;
    /** 形状链表后继节点（刚体的形状链表） */
    public next: Nullable<Shape>;
    /** 位移向量（当前帧相对于上一帧的位移，用于宽相位代理移动） */
    public displacement = new Vec3();

    private _density: Nullable<number>;

    /**
     * 构造函数。
     * 初始化形状的本地变换、物理属性、几何体、碰撞过滤规则，
     * 将配置中的位置/旋转组合为本地变换，并初始化历史/当前变换为本地变换。
     * @param {ShapeConfig} config - 形状配置项
     */
    constructor(config: ShapeConfig) {
        Method.combineMat3Vec3ToTransform(config.position.elements, config.rotation.elements, this.localTransform.elements);
        Method.copyElements(this.localTransform.elements, this.ptransform.elements);
        Method.copyElements(this.localTransform.elements, this.transform.elements);
        this.restitution = config.restitution;
        this.friction = config.friction;
        this.density = config.density;
        this.geometry = config.geometry;
        this.collisionGroup = config.collisionGroup;
        this.collisionMask = config.collisionMask;
        this.contactCallback = config.contactCallback;
    }

    /**
     * 设置形状的本地变换（相对于刚体）。
     * 修改形状相对于刚体的本地变换，并触发以下连锁更新：
     * 1. 重新计算刚体的质量数据（updateMass）；
     * 2. 遍历刚体所有形状，更新其历史/当前世界变换（本地变换 × 刚体变换）；
     * 3. 重新计算形状的AABB（合并历史/当前变换的AABB，防止穿模）；
     * 4. 若存在宽相位代理，更新代理的位置并通知宽相位。
     * 该方法会遍历刚体所有形状，而非仅当前形状，确保刚体形状整体同步。
     * @param {Transform} transform - 新的本地变换
     */
    public setLocalTransform(transform: Transform): void {
        Method.copyElements(transform.elements, this.localTransform.elements);
        if (this.rigidBody) {
            const _this = this.rigidBody;
            _this.updateMass();
            const tf1 = _this.ptransform.elements;
            const tf2 = _this.transform.elements;
            let s = _this.shapeList;
            while (s) {
                const n = s.next;
                const dst = s.ptransform.elements;
                const src1 = s.localTransform.elements;
                dst[3] = tf1[3] * src1[3] + tf1[4] * src1[6] + tf1[5] * src1[9];
                dst[4] = tf1[3] * src1[4] + tf1[4] * src1[7] + tf1[5] * src1[10];
                dst[5] = tf1[3] * src1[5] + tf1[4] * src1[8] + tf1[5] * src1[11];
                dst[6] = tf1[6] * src1[3] + tf1[7] * src1[6] + tf1[8] * src1[9];
                dst[7] = tf1[6] * src1[4] + tf1[7] * src1[7] + tf1[8] * src1[10];
                dst[8] = tf1[6] * src1[5] + tf1[7] * src1[8] + tf1[8] * src1[11];
                dst[9] = tf1[9] * src1[3] + tf1[10] * src1[6] + tf1[11] * src1[9];
                dst[10] = tf1[9] * src1[4] + tf1[10] * src1[7] + tf1[11] * src1[10];
                dst[11] = tf1[9] * src1[5] + tf1[10] * src1[8] + tf1[11] * src1[11];
                dst[0] = tf1[3] * src1[0] + tf1[4] * src1[1] + tf1[5] * src1[2];
                dst[1] = tf1[6] * src1[0] + tf1[7] * src1[1] + tf1[8] * src1[2];
                dst[2] = tf1[9] * src1[0] + tf1[10] * src1[1] + tf1[11] * src1[2];
                dst[0] += tf1[0];
                dst[1] += tf1[1];
                dst[2] += tf1[2];
                const dst1 = s.transform.elements;
                const src11 = s.localTransform.elements;
                dst1[3] = tf2[3] * src11[3] + tf2[4] * src11[6] + tf2[5] * src11[9];
                dst1[4] = tf2[3] * src11[4] + tf2[4] * src11[7] + tf2[5] * src11[10];
                dst1[5] = tf2[3] * src11[5] + tf2[4] * src11[8] + tf2[5] * src11[11];
                dst1[6] = tf2[6] * src11[3] + tf2[7] * src11[6] + tf2[8] * src11[9];
                dst1[7] = tf2[6] * src11[4] + tf2[7] * src11[7] + tf2[8] * src11[10];
                dst1[8] = tf2[6] * src11[5] + tf2[7] * src11[8] + tf2[8] * src11[11];
                dst1[9] = tf2[9] * src11[3] + tf2[10] * src11[6] + tf2[11] * src11[9];
                dst1[10] = tf2[9] * src11[4] + tf2[10] * src11[7] + tf2[11] * src11[10];
                dst1[11] = tf2[9] * src11[5] + tf2[10] * src11[8] + tf2[11] * src11[11];
                dst1[0] = tf2[3] * src11[0] + tf2[4] * src11[1] + tf2[5] * src11[2];
                dst1[1] = tf2[6] * src11[0] + tf2[7] * src11[1] + tf2[8] * src11[2];
                dst1[2] = tf2[9] * src11[0] + tf2[10] * src11[1] + tf2[11] * src11[2];
                dst1[0] += tf2[0];
                dst1[1] += tf2[1];
                dst1[2] += tf2[2];
                s.geometry.computeAabb(s.aabb, s.ptransform);
                const aabb = s.aabb.elements;
                const minX = aabb[0], minY = aabb[1], minZ = aabb[2];
                const maxX = aabb[3], maxY = aabb[4], maxZ = aabb[5];
                s.geometry.computeAabb(s.aabb, s.transform);
                aabb[0] = minX < aabb[0] ? minX : aabb[0];
                aabb[1] = minY < aabb[1] ? minY : aabb[1];
                aabb[2] = minZ < aabb[2] ? minZ : aabb[2];
                aabb[3] = maxX > aabb[3] ? maxX : aabb[3];
                aabb[4] = maxY > aabb[4] ? maxY : aabb[4];
                aabb[5] = maxZ > aabb[5] ? maxZ : aabb[5];
                if (s.proxy) {
                    const v = s.displacement.elements, transform = s.transform.elements, ptransform = s.ptransform.elements;
                    v[0] = transform[0] - ptransform[0];
                    v[1] = transform[1] - ptransform[1];
                    v[2] = transform[2] - ptransform[2];
                    s.rigidBody!.world!.broadPhase.moveProxy(s.proxy, s.aabb, s.displacement);
                }
                s = n!;
            }
        }
    }

    /**
     * 获取形状密度。
     * 密度是计算刚体质量的核心参数，不同形状的密度结合体积可得到质量。
     * @returns {number} 密度值（kg/m³），若私有变量为null则返回默认值1
     */
    public get density(): number {
        return this._density ? this._density : 1;
    }

    /**
     * 设置形状密度。
     * 修改密度后会触发以下连锁更新：
     * 1. 更新私有密度变量；
     * 2. 重新计算刚体的质量数据（updateMass）；
     * 3. 遍历刚体所有形状，更新其历史/当前世界变换；
     * 4. 重新计算形状的AABB（合并历史/当前变换的AABB）；
     * 5. 若存在宽相位代理，更新代理位置并通知宽相位。
     * 该方法逻辑与setLocalTransform高度复用，确保密度修改后刚体物理状态同步。
     * @param {number} density - 新的密度值（kg/m³）
     */
    public set density(density: number) {
        this._density = density;
        if (this.rigidBody) {
            const _this = this.rigidBody;
            _this.updateMass();
            const tf1 = _this.ptransform.elements;
            const tf2 = _this.transform.elements;
            let s = _this.shapeList;
            while (s) {
                const n = s.next;
                const dst = s.ptransform.elements;
                const src1 = s.localTransform.elements;
                dst[3] = tf1[3] * src1[3] + tf1[4] * src1[6] + tf1[5] * src1[9];
                dst[4] = tf1[3] * src1[4] + tf1[4] * src1[7] + tf1[5] * src1[10];
                dst[5] = tf1[3] * src1[5] + tf1[4] * src1[8] + tf1[5] * src1[11];
                dst[6] = tf1[6] * src1[3] + tf1[7] * src1[6] + tf1[8] * src1[9];
                dst[7] = tf1[6] * src1[4] + tf1[7] * src1[7] + tf1[8] * src1[10];
                dst[8] = tf1[6] * src1[5] + tf1[7] * src1[8] + tf1[8] * src1[11];
                dst[9] = tf1[9] * src1[3] + tf1[10] * src1[6] + tf1[11] * src1[9];
                dst[10] = tf1[9] * src1[4] + tf1[10] * src1[7] + tf1[11] * src1[10];
                dst[11] = tf1[9] * src1[5] + tf1[10] * src1[8] + tf1[11] * src1[11];
                dst[0] = tf1[3] * src1[0] + tf1[4] * src1[1] + tf1[5] * src1[2];
                dst[1] = tf1[6] * src1[0] + tf1[7] * src1[1] + tf1[8] * src1[2];
                dst[2] = tf1[9] * src1[0] + tf1[10] * src1[1] + tf1[11] * src1[2];
                dst[0] += tf1[0];
                dst[1] += tf1[1];
                dst[2] += tf1[2];
                const dst1 = s.transform.elements;
                const src11 = s.localTransform.elements;
                dst1[3] = tf2[3] * src11[3] + tf2[4] * src11[6] + tf2[5] * src11[9];
                dst1[4] = tf2[3] * src11[4] + tf2[4] * src11[7] + tf2[5] * src11[10];
                dst1[5] = tf2[3] * src11[5] + tf2[4] * src11[8] + tf2[5] * src11[11];
                dst1[6] = tf2[6] * src11[3] + tf2[7] * src11[6] + tf2[8] * src11[9];
                dst1[7] = tf2[6] * src11[4] + tf2[7] * src11[7] + tf2[8] * src11[10];
                dst1[8] = tf2[6] * src11[5] + tf2[7] * src11[8] + tf2[8] * src11[11];
                dst1[9] = tf2[9] * src11[3] + tf2[10] * src11[6] + tf2[11] * src11[9];
                dst1[10] = tf2[9] * src11[4] + tf2[10] * src11[7] + tf2[11] * src11[10];
                dst1[11] = tf2[9] * src11[5] + tf2[10] * src11[8] + tf2[11] * src11[11];
                dst1[0] = tf2[3] * src11[0] + tf2[4] * src11[1] + tf2[5] * src11[2];
                dst1[1] = tf2[6] * src11[0] + tf2[7] * src11[1] + tf2[8] * src11[2];
                dst1[2] = tf2[9] * src11[0] + tf2[10] * src11[1] + tf2[11] * src11[2];
                dst1[0] += tf2[0];
                dst1[1] += tf2[1];
                dst1[2] += tf2[2];
                s.geometry.computeAabb(s.aabb, s.ptransform);
                const aabb = s.aabb.elements;
                const minX = aabb[0], minY = aabb[1], minZ = aabb[2];
                const maxX = aabb[3], maxY = aabb[4], maxZ = aabb[5];
                s.geometry.computeAabb(s.aabb, s.transform);
                aabb[0] = minX < aabb[0] ? minX : aabb[0];
                aabb[1] = minY < aabb[1] ? minY : aabb[1];
                aabb[2] = minZ < aabb[2] ? minZ : aabb[2];
                aabb[3] = maxX > aabb[3] ? maxX : aabb[3];
                aabb[4] = maxY > aabb[4] ? maxY : aabb[4];
                aabb[5] = maxZ > aabb[5] ? maxZ : aabb[5];
                if (s.proxy) {
                    const v = s.displacement.elements, transform = this.transform.elements, ptransform = this.ptransform.elements;
                    v[0] = transform[0] - ptransform[0];
                    v[1] = transform[1] - ptransform[1];
                    v[2] = transform[2] - ptransform[2];
                    s.rigidBody!.world!.broadPhase.moveProxy(s.proxy, s.aabb, s.displacement);
                }
                s = n!;
            }
        }
    }
}

export { Shape };