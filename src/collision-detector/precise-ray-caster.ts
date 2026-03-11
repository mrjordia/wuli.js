import Shape from "../shape/shape";
import RigidBody from "../rigid-body/rigid-body";
import { World } from "../world";
import RayCastCallback from "../common/ray-cast-callback";
import Vec3 from '../common/vec3';
import RayCastHit from '../shape/ray-cast-hit';
import Method from '../common/method';

/**
 * 精确射线检测结果接口
 * 包含射线是否命中、命中的形状、刚体、命中点坐标和法向量等信息
 */
export interface PreciseRayCastResult {
    /** 是否命中物体 */
    hit: boolean;
    /** 命中的形状对象，未命中则为 null */
    shape: Shape | null;
    /** 命中的刚体对象，未命中则为 null */
    rigidBody: RigidBody | null;
    /** 世界坐标系下的命中点坐标 */
    hitPoint: Vec3;
    /** 世界坐标系下的命中点法向量 */
    hitNormal: Vec3;
}

/**
 * 宽相位射线检测结果接口
 * 仅包含命中点和法向量信息
 * @internal 内部使用接口，不对外暴露
 */
interface IBroadphaseRayCastResult {
    /** 命中点坐标 */
    hitPoint: Vec3,
    /** 命中点法向量 */
    hitNormal: Vec3,
}

/**
 * 精确射线检测类
 * 用于在物理世界中执行高精度的射线检测，能够精确检测到具体的形状表面
 * 会先通过宽相位检测筛选候选对象，再对每个候选对象执行精确的几何相交检测
 */
export class PreciseRayCaster {
    private _tv1 = new Vec3();
    private _tv2 = new Vec3();
    private _tv3 = new Vec3();
    private _tv8 = new Vec3();
    private _tv9 = new Vec3();
    private _preciseCallback: RayCastCallback;
    private _rayStart = new Vec3();
    private _rayEnd = new Vec3();
    private _result: PreciseRayCastResult;
    private _rayCastHit = new RayCastHit();
    private _closestHitSq = Infinity;
    private readonly EPS_HIT = 1e-4;

    /**
     * 构造精确射线检测器
     * @param world 物理世界实例，用于获取宽相位检测能力
     */
    constructor(private readonly world: World) {
        this._result = {
            hit: false,
            shape: null,
            rigidBody: null,
            hitPoint: new Vec3(),
            hitNormal: new Vec3(),
        };
        this._preciseCallback = {
            /**
             * 处理宽相位检测到的形状对象，执行精确射线相交检测
             * @param shape 待检测的形状对象
             * @returns 始终返回 true，表示继续检测其他对象
             */
            process: (shape: Shape) => {
                if (!shape.rigidBody || !shape.geometry) {
                    return true;
                }

                const hit = this._rayCastGeneric(this._rayStart, this._rayEnd, shape);
                if (!hit) {
                    return true;
                }

                const dx = hit.hitPoint.x - this._rayStart.x;
                const dy = hit.hitPoint.y - this._rayStart.y;
                const dz = hit.hitPoint.z - this._rayStart.z;
                const lsq = dx * dx + dy * dy + dz * dz;
                if (lsq < this._closestHitSq - this.EPS_HIT) {
                    const result = this._result;
                    result.hit = true;
                    result.shape = shape;
                    result.rigidBody = shape.rigidBody;
                    Method.copyElements(hit.hitPoint.elements, result.hitPoint.elements);
                    Method.copyElements(hit.hitNormal.elements, result.hitNormal.elements);
                    this._closestHitSq = lsq;
                }

                return true;
            }
        };

    }

    /**
     * 重置射线检测结果为初始状态
     * @returns 重置后的检测结果对象
     */
    private resetRayCastResult(): PreciseRayCastResult {
        this._closestHitSq = Infinity;
        const r = this._result;
        r.hit = false;
        r.shape = null;
        r.rigidBody = null;
        r.hitPoint.elements.fill(0);
        r.hitNormal.elements.fill(0);
        return r;
    }

    /**
     * 执行精确射线检测
     * @param start 射线起始点（世界坐标系）
     * @param end 射线结束点（世界坐标系）
     * @returns 精确的射线检测结果，包含最近命中的物体信息
     */
    public rayCast(start: { x: number, y: number, z: number }, end: { x: number, y: number, z: number }): PreciseRayCastResult {
        const result = this.resetRayCastResult();
        Method.setXYZ(this._rayStart, start.x, start.y, start.z);
        Method.setXYZ(this._rayEnd, end.x, end.y, end.z);
        this.world.rayCast(start, end, this._preciseCallback);
        return result;
    }

    /**
     * 对单个形状执行通用的射线相交检测
     * @param rayStartWorld 射线起始点（世界坐标系）
     * @param rayEndWorld 射线结束点（世界坐标系）
     * @param shape 待检测的形状对象
     * @returns 命中结果（包含世界坐标系下的命中点和法向量），未命中则返回 null
     * @internal 内部方法，不对外暴露
     */
    private _rayCastGeneric(rayStartWorld: Vec3, rayEndWorld: Vec3, shape: Shape): IBroadphaseRayCastResult | null {
        const geometry = shape.geometry;
        const transform = shape.transform;
        const rayBegin = Method.setXYZ(this._tv8, rayStartWorld.x, rayStartWorld.y, rayStartWorld.z) as Vec3;
        const rayEnd = Method.setXYZ(this._tv9, rayEndWorld.x, rayEndWorld.y, rayEndWorld.z) as Vec3;

        const isHit = geometry.rayCast(rayBegin, rayEnd, transform, this._rayCastHit);
        if (!isHit) return null;

        const hp = this._rayCastHit.position.elements;
        const hitPointWorld = Method.setXYZ(this._tv2, hp[0], hp[1], hp[2]) as Vec3;
        const hn = this._rayCastHit.normal.elements;
        const hitNormalWorld = Method.setXYZ(this._tv3, hn[0], hn[1], hn[2]) as Vec3;

        const rayDirWorld = this._tv1;
        Method.copyElements(rayEndWorld.elements, rayDirWorld.elements);
        Method.subArray(rayDirWorld.elements, rayBegin.elements, rayDirWorld.elements);
        const dot = hitNormalWorld.x * rayDirWorld.x + hitNormalWorld.y * rayDirWorld.y + hitNormalWorld.z * rayDirWorld.z;
        if (dot > 0) {
            Method.scaleArray(hitNormalWorld.elements, -1, hitNormalWorld.elements);
        }

        return { hitPoint: hitPointWorld, hitNormal: hitNormalWorld };
    }

}