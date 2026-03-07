import Detector from "./detector";
import DetectorResult from "./detector-result";
import CachedDetectorData from "./cached-detector-data";
import TerrainGeometry from "../shape/terrain-geometry";
import SphereGeometry from '../shape/sphere-geometry';
import CapsuleGeometry from '../shape/capsule-geometry';
import Transform from "../common/transform";
import Vec3 from "../common/vec3";
import { CONSTANT, GEOMETRY_TYPE } from "../constant";
import ConvexGeometry from "../shape/convex-geometry";
import Method from "../common/method";

/**
 * 凸几何体-地形碰撞检测器类。
 * 专用于检测凸几何体（球体、胶囊体、通用凸体）与地形（TerrainGeometry）之间碰撞的检测器；
 * 核心特性：
 * 1. 针对不同凸几何体类型（球体/胶囊体/通用凸体）提供专属检测逻辑，提升检测精度和性能；
 * 2. 支持分层检测模式（convexTerrainLayered），结合稳定点和采样点优化碰撞稳定性；
 * 3. 地形高度和法线通过双线性插值计算，保证检测结果的平滑性；
 * 支持通过swapped参数交换检测对象顺序（地形-凸几何体）。
 */
export default class ConvexTerrainDetector extends Detector<ConvexGeometry, TerrainGeometry> {
    private _localDir = new Vec3();
    private _localSupport: Array<Vec3> = [];
    private _supportPoints: Array<Float64Array> = [];
    private _normal = new Float64Array(3);
    private _bestNormal = new Float64Array(3);
    private _bestPos1 = new Float64Array(3);
    private _bestPos2 = new Float64Array(3);
    private _stablePoint = new Float64Array(3);
    private _allPoints: Array<Float64Array> = [];
    private _finalPos1 = new Float64Array(3);
    private _finalPos2 = new Float64Array(3);

    /** 形状采样点与稳定点的权重系数，用于分层检测的深度融合 */
    private readonly SHAPE_WEIGHT = 0.5;
    /** 凸几何体支撑点采样方向集（9个向下/斜向下方向，适配地形碰撞的主要方向） */
    private readonly DIRECTIONS = new Float64Array([
        0, -1, 0,          // 正下方
        0.577, -0.577, 0.577, // 右下前
        -0.577, -0.577, 0.577, // 左下前
        -0.577, -0.577, -0.577, // 左下后
        0.577, -0.577, -0.577, // 右下后
        0, -0.970, 0.242,   // 前下方
        0, -0.970, -0.242,  // 后下方
        0.242, -0.970, 0,   // 右下方
        -0.242, -0.970, 0   // 左下方
    ]);

    /** 稳定点半径比例系数，用于计算稳定采样点的位置 */
    public stabilizeRadiusRatio = 0.7;
    /** 是否启用分层检测模式（true=分层检测，false=通用凸体检测） */
    public convexTerrainLayered = true;

    /**
     * 凸几何体-地形检测器构造函数。
     * 初始化父类Detector，传入swapped标记，适配不同的检测对象顺序。
     * @param {boolean} swapped - 是否交换检测对象顺序（true=地形-凸几何体，false=凸几何体-地形）
     */
    constructor(swapped: boolean) {
        super(swapped);
    }

    /**
     * 凸几何体-地形碰撞检测核心实现。
     * 核心逻辑：根据凸几何体类型分发到专属检测方法，提升检测效率和精度：
     * 1. 球体：调用球体-地形专属检测方法；
     * 2. 胶囊体：调用胶囊体-地形专属检测方法；
     * 3. 其他凸体：根据分层检测开关，选择分层检测或通用凸体检测。
     * @param {DetectorResult} result - 碰撞检测结果容器，存储法线、碰撞点、穿透深度等数据
     * @param {ConvexGeometry} geom1 - 凸几何体对象（球体/胶囊体/通用凸体）
     * @param {TerrainGeometry} geom2 - 地形几何对象
     * @param {Transform} tf1 - 凸几何体的变换矩阵（位置、旋转、缩放）
     * @param {Transform} tf2 - 地形的变换矩阵（位置、旋转、缩放）
     * @param {CachedDetectorData} cachedData - 检测器缓存数据（当前算法未使用，预留扩展）
     * @returns {void}
     */
    protected detectImpl(result: DetectorResult, geom1: ConvexGeometry, geom2: TerrainGeometry, tf1: Transform, tf2: Transform, cachedData: CachedDetectorData): void {
        const terrainGeom = geom2;
        const convexGeom = geom1;
        const terrainTf = tf2;
        const convexTf = tf1;

        switch (convexGeom.type) {
            case GEOMETRY_TYPE.SPHERE:
                this._detectSphereTerrain(result, convexGeom as SphereGeometry, terrainGeom, convexTf, terrainTf);
                break;
            case GEOMETRY_TYPE.CAPSULE:
                this._detectCapsuleTerrain(result, convexGeom as CapsuleGeometry, terrainGeom, convexTf, terrainTf);
                break;
            default:
                if (this.convexTerrainLayered) {
                    this._detectConvexTerrainLayered(result, convexGeom, terrainGeom, convexTf, terrainTf);
                } else {
                    this._detectGenericConvexTerrain(result, convexGeom, terrainGeom, convexTf, terrainTf);
                }
                break;
        }
    }

    /**
     * 分层模式下的凸几何体-地形碰撞检测。
     * 核心逻辑：结合稳定点和凸几何体支撑点进行采样，提升碰撞检测的稳定性：
     * 1. 计算凸几何体的稳定采样点（基于AABB最小边长）；
     * 2. 采样凸几何体的支撑点集合；
     * 3. 遍历所有采样点，计算与地形的碰撞深度和法线；
     * 4. 融合稳定点和最优采样点的深度，计算最终碰撞结果。
     * @param {DetectorResult} result - 碰撞检测结果容器
     * @param {ConvexGeometry} convex - 凸几何体对象
     * @param {TerrainGeometry} terrain - 地形几何对象
     * @param {Transform} convexTf - 凸几何体变换矩阵
     * @param {Transform} terrainTf - 地形变换矩阵
     * @returns {void}
     */
    private _detectConvexTerrainLayered(result: DetectorResult, convex: ConvexGeometry, terrain: TerrainGeometry, convexTf: Transform, terrainTf: Transform): void {
        const SLOP = CONSTANT.SETTING_LINEAR_SLOP;
        const convexPos = convexTf.elements;
        const terrainPos = terrainTf.elements;
        const aabb = convex.aabbComputed.elements;
        // 计算稳定点半径（基于AABB最小边长，乘以稳定比例系数）
        const mr = Math.min(aabb[3] - aabb[0], aabb[4] - aabb[1], aabb[5] - aabb[2]) * 0.5 * this.stabilizeRadiusRatio;

        const stablePoint = this._stablePoint
        // 计算稳定采样点（凸几何体中心向下偏移mr）
        stablePoint[0] = convexPos[0];
        stablePoint[1] = convexPos[1] - mr;
        stablePoint[2] = convexPos[2];

        // 采样凸几何体的支撑点集合（世界坐标系）
        const shapePoints = this._sampleConvexSupportPoints(convex, convexTf);

        // 计算地形有效检测范围（扩展SLOP避免边界误判）
        const txMin = terrainPos[0] - terrain.xSize / 2 - SLOP;
        const txMax = terrainPos[0] + terrain.xSize / 2 + SLOP;
        const tzMin = terrainPos[2] - terrain.zSize / 2 - SLOP;
        const tzMax = terrainPos[2] + terrain.zSize / 2 + SLOP;

        let bestDepth = 0;
        let bestNormal = this._bestNormal;
        let bestShapePos = this._bestPos1;
        let bestTerrainPos = this._bestPos2;
        bestNormal.fill(0);
        bestShapePos.fill(0);
        bestTerrainPos.fill(0);

        const allPoints = this._allPoints;
        allPoints.length = 0;
        // 合并稳定点和支撑点，作为所有采样点
        allPoints.push(stablePoint, ...shapePoints);
        for (const point of allPoints) {
            // 过滤地形范围外的采样点
            if (point[0] < txMin || point[0] > txMax || point[2] < tzMin || point[2] > tzMax) {
                continue;
            }

            // 转换为地形局部坐标系
            const localX = point[0] - terrainPos[0];
            const localZ = point[2] - terrainPos[2];
            // 采样地形高度（双线性插值）
            const terrainHeight = this._sampleTerrainHeight(localX, localZ, terrain);
            const terrainY = terrainPos[1] + terrainHeight;
            // 采样地形法线（中心差分法）
            const normal = this._sampleTerrainNormal(localX, localZ, terrain, this._normal);

            // 计算碰撞深度（地形高度 - 采样点Y坐标）
            const depth = terrainY - point[1];

            // 筛选最优碰撞结果（深度最大且大于SLOP）
            if (depth > bestDepth && depth > SLOP) {
                bestDepth = depth;
                Method.copyElements(normal, bestNormal);
                Method.copyElements(point, bestShapePos);
                bestTerrainPos[0] = point[0];
                bestTerrainPos[1] = terrainY;
                bestTerrainPos[2] = point[2];
            }
        }

        // 存在有效碰撞时，计算最终碰撞结果
        if (bestDepth > SLOP) {
            // 融合稳定点和最优采样点的深度（加权平均）
            const finalDepth = bestDepth * this.SHAPE_WEIGHT + (terrainPos[1] + this._sampleTerrainHeight(stablePoint[0] - terrainPos[0], stablePoint[2] - terrainPos[2], terrain) - stablePoint[1]) * (1 - this.SHAPE_WEIGHT);

            const finalPos1 = this._finalPos1;
            // 融合稳定点和最优采样点的位置（加权平均）
            finalPos1[0] = stablePoint[0] * (1 - this.SHAPE_WEIGHT) + bestShapePos[0] * this.SHAPE_WEIGHT;
            finalPos1[1] = stablePoint[1] * (1 - this.SHAPE_WEIGHT) + bestShapePos[1] * this.SHAPE_WEIGHT;
            finalPos1[2] = stablePoint[2] * (1 - this.SHAPE_WEIGHT) + bestShapePos[2] * this.SHAPE_WEIGHT;

            const finalPos2 = this._finalPos2;
            // 计算地形侧最终碰撞点（基于融合后的位置采样地形高度）
            finalPos2[0] = finalPos1[0];
            finalPos2[1] = terrainPos[1] + this._sampleTerrainHeight(finalPos1[0] - terrainPos[0], finalPos1[2] - terrainPos[2], terrain);
            finalPos2[2] = finalPos1[2];

            // 设置碰撞法线和碰撞点
            this.setNormal(result, bestNormal[0], bestNormal[1], bestNormal[2]);
            this.addPoint(result,
                finalPos1[0], finalPos1[1], finalPos1[2],
                finalPos2[0], finalPos2[1], finalPos2[2],
                finalDepth,
                0
            );
        }
    }

    /**
     * 通用凸几何体-地形碰撞检测（非分层模式）。
     * 核心逻辑：仅采样凸几何体的支撑点，检测与地形的碰撞，逻辑更简洁：
     * 1. 采样凸几何体的支撑点集合；
     * 2. 遍历支撑点，计算与地形的碰撞深度和法线；
     * 3. 选择深度最大的有效碰撞结果，写入检测结果。
     * @param {DetectorResult} result - 碰撞检测结果容器
     * @param {ConvexGeometry} convex - 凸几何体对象
     * @param {TerrainGeometry} terrain - 地形几何对象
     * @param {Transform} convexTf - 凸几何体变换矩阵
     * @param {Transform} terrainTf - 地形变换矩阵
     * @returns {void}
     */
    private _detectGenericConvexTerrain(result: DetectorResult, convex: ConvexGeometry, terrain: TerrainGeometry, convexTf: Transform, terrainTf: Transform): void {
        const SLOP = CONSTANT.SETTING_LINEAR_SLOP;
        const supportPoints = this._sampleConvexSupportPoints(convex, convexTf);
        if (supportPoints.length === 0) return;
        const terrainElements = terrainTf.elements;
        const terrainHalfX = terrain.xSize / 2;
        const terrainHalfZ = terrain.zSize / 2;

        let maxDepth = 0;
        const bestNormal = this._bestNormal;
        bestNormal[0] = 0, bestNormal[1] = 1, bestNormal[2] = 0; // 默认法线为Y轴向上
        const bestPos1 = this._bestPos1;
        bestPos1.fill(0);
        const bestPos2 = this._bestPos2;
        bestPos2.fill(0);

        for (const point of supportPoints) {
            // 转换为地形局部坐标系
            const terrainLocalX = point[0] - terrainElements[0];
            const terrainLocalZ = point[2] - terrainElements[2];

            // 过滤地形范围外的采样点（扩展SLOP）
            if (terrainLocalX < -terrainHalfX - SLOP || terrainLocalX > terrainHalfX + SLOP || terrainLocalZ < -terrainHalfZ - SLOP || terrainLocalZ > terrainHalfZ + SLOP) {
                continue;
            }

            // 采样地形高度和法线
            const terrainHeight = this._sampleTerrainHeight(terrainLocalX, terrainLocalZ, terrain);
            const terrainWorldY = terrainElements[1] + terrainHeight;
            const normal = this._sampleTerrainNormal(terrainLocalX, terrainLocalZ, terrain, this._normal);
            const depth = terrainWorldY - point[1];

            // 筛选最优碰撞结果
            if (depth > maxDepth && depth > SLOP) {
                maxDepth = depth;
                Method.copyElements(normal, bestNormal);
                bestPos1[0] = point[0], bestPos1[1] = point[1], bestPos1[2] = point[2];
                bestPos2[0] = point[0], bestPos2[1] = terrainWorldY, bestPos2[2] = point[2];
            }
        }

        // 存在有效碰撞时，写入检测结果
        if (maxDepth > SLOP) {
            this.setNormal(result, bestNormal[0], bestNormal[1], bestNormal[2]);
            this.addPoint(result, bestPos1[0], bestPos1[1], bestPos1[2], bestPos2[0], bestPos2[1], bestPos2[2], maxDepth, 0);
        }
    }

    /**
     * 采样凸几何体的支撑点集合（世界坐标系）。
     * 核心逻辑：沿预设方向集采样凸几何体的支撑点，转换为世界坐标系：
     * 1. 将世界方向转换为凸几何体局部坐标系方向；
     * 2. 计算局部坐标系下的支撑点；
     * 3. 将局部支撑点转换为世界坐标系；
     * 4. 返回所有采样的支撑点集合。
     * @param {ConvexGeometry} convex - 凸几何体对象
     * @param {Transform} tf - 凸几何体变换矩阵
     * @returns {Array<Float64Array>} 世界坐标系下的支撑点数组
     */
    private _sampleConvexSupportPoints(convex: ConvexGeometry, tf: Transform): Array<Float64Array> {
        const supportPoints = this._supportPoints;
        supportPoints.length = 0;
        // 地形不参与支撑点采样
        if (convex.type === GEOMETRY_TYPE.TERRAIN) {
            return supportPoints;
        }

        const tfEles = tf.elements;
        const localDir = this._localDir;
        const localSps = this._localSupport;

        // 遍历预设方向集，采样支撑点
        for (let i = 0; i < this.DIRECTIONS.length; i += 3) {
            const wx = this.DIRECTIONS[i];
            const wy = this.DIRECTIONS[i + 1];
            const wz = this.DIRECTIONS[i + 2];

            // 世界方向转换为局部坐标系方向（逆变换）
            const lx = wx * tfEles[3] + wy * tfEles[6] + wz * tfEles[9];
            const ly = wx * tfEles[4] + wy * tfEles[7] + wz * tfEles[10];
            const lz = wx * tfEles[5] + wy * tfEles[8] + wz * tfEles[11];
            localDir.elements[0] = lx;
            localDir.elements[1] = ly;
            localDir.elements[2] = lz;

            // 计算局部支撑点
            const index = Math.floor(i / 3);
            if (!localSps[index]) localSps[index] = new Vec3();
            convex.computeLocalSupportingVertex(localDir, localSps[index]);

            // 局部支撑点转换为世界坐标系
            const localPoint = localSps[index].elements;
            const rx = localPoint[0] * tfEles[3] + localPoint[1] * tfEles[4] + localPoint[2] * tfEles[5];
            const ry = localPoint[0] * tfEles[6] + localPoint[1] * tfEles[7] + localPoint[2] * tfEles[8];
            const rz = localPoint[0] * tfEles[9] + localPoint[1] * tfEles[10] + localPoint[2] * tfEles[11];
            const worldPoint = new Float64Array([
                rx + tfEles[0],
                ry + tfEles[1],
                rz + tfEles[2]
            ]);

            supportPoints.push(worldPoint);
        }

        return supportPoints;
    }

    /**
     * 球体-地形碰撞检测。
     * 核心逻辑：基于球心采样地形高度，判断球体与地形的碰撞：
     * 1. 检查球心是否在地形有效范围内；
     * 2. 采样地形高度和法线；
     * 3. 计算穿透深度（球半径 - 球心与地形的垂直距离）；
     * 4. 若深度有效，计算碰撞点和法线，写入检测结果。
     * @param {DetectorResult} result - 碰撞检测结果容器
     * @param {SphereGeometry} sphere - 球体几何对象
     * @param {TerrainGeometry} terrain - 地形几何对象
     * @param {Transform} sphereTf - 球体变换矩阵
     * @param {Transform} terrainTf - 地形变换矩阵
     * @returns {void}
     */
    private _detectSphereTerrain(result: DetectorResult, sphere: SphereGeometry, terrain: TerrainGeometry, sphereTf: Transform, terrainTf: Transform): void {
        const sphereElements = sphereTf.elements;
        const terrainElements = terrainTf.elements;
        const radius = sphere.radius;

        const terrainHalfX = terrain.xSize / 2;
        const terrainHalfZ = terrain.zSize / 2;
        const localX = sphereElements[0] - terrainElements[0];
        const localZ = sphereElements[2] - terrainElements[2];

        const SLOP = CONSTANT.SETTING_LINEAR_SLOP;
        // 过滤地形范围外的球体
        if (localX < -terrainHalfX - SLOP || localX > terrainHalfX + SLOP || localZ < -terrainHalfZ - SLOP || localZ > terrainHalfZ + SLOP) {
            return;
        }

        // 采样地形高度和法线
        const terrainHeight = this._sampleTerrainHeight(localX, localZ, terrain);
        const terrainWorldY = terrainElements[1] + terrainHeight;
        const normal = this._sampleTerrainNormal(localX, localZ, terrain, this._normal);

        // 计算穿透深度
        const sphereWorldY = sphereElements[1];
        const penetrationDepth = radius - (sphereWorldY - terrainWorldY);
        if (penetrationDepth < SLOP) {
            return;
        }

        // 计算碰撞点（球体表面和地形表面）
        const pos1X = sphereElements[0] - normal[0] * radius;
        const pos1Y = sphereElements[1] - normal[1] * radius;
        const pos1Z = sphereElements[2] - normal[2] * radius;

        const pos2X = sphereElements[0];
        const pos2Y = terrainWorldY;
        const pos2Z = sphereElements[2];

        // 设置碰撞结果
        this.setNormal(result, normal[0], normal[1], normal[2]);
        this.addPoint(result, pos1X, pos1Y, pos1Z, pos2X, pos2Y, pos2Z, penetrationDepth, 0);
    }

    /**
     * 胶囊体-地形碰撞检测。
     * 核心逻辑：采样胶囊体轴线端点和中点，检测与地形的碰撞：
     * 1. 将胶囊体局部端点转换为世界坐标系；
     * 2. 采样端点和中点，计算与地形的碰撞深度；
     * 3. 选择深度最大的有效碰撞结果，写入检测结果。
     * @param {DetectorResult} result - 碰撞检测结果容器
     * @param {CapsuleGeometry} capsule - 胶囊体几何对象
     * @param {TerrainGeometry} terrain - 地形几何对象
     * @param {Transform} capsuleTf - 胶囊体变换矩阵
     * @param {Transform} terrainTf - 地形变换矩阵
     * @returns {void}
     */
    private _detectCapsuleTerrain(result: DetectorResult, capsule: CapsuleGeometry, terrain: TerrainGeometry, capsuleTf: Transform, terrainTf: Transform): void {
        const SLOP = CONSTANT.SETTING_LINEAR_SLOP;
        const terrainElements = terrainTf.elements;
        const radius = capsule.radius;
        const halfHeight = capsule.halfHeight;
        const terrainHalfX = terrain.xSize / 2;
        const terrainHalfZ = terrain.zSize / 2;

        // 胶囊体局部端点（轴线起点和终点）
        const p0Local = new Float64Array([0, -halfHeight, 0]);
        const p1Local = new Float64Array([0, halfHeight, 0]);
        // 转换为世界坐标系
        const p0World = this._transformLocalPointToWorld(p0Local, capsuleTf);
        const p1World = this._transformLocalPointToWorld(p1Local, capsuleTf);
        // 计算胶囊体轴线中点
        const midWorld = new Float64Array([
            (p0World[0] + p1World[0]) / 2,
            (p0World[1] + p1World[1]) / 2,
            (p0World[2] + p1World[2]) / 2
        ]);

        // 采样点集合（端点+中点）
        const samplePoints = [p0World, p1World, midWorld];
        let maxDepth = 0;
        const bestNormal = new Float64Array([0, 1, 0]);
        const bestPos1 = new Float64Array(3);
        const bestPos2 = new Float64Array(3);

        for (const point of samplePoints) {
            // 转换为地形局部坐标系
            const terrainLocalX = point[0] - terrainElements[0];
            const terrainLocalZ = point[2] - terrainElements[2];

            // 过滤地形范围外的采样点
            if (terrainLocalX < -terrainHalfX - SLOP || terrainLocalX > terrainHalfX + SLOP || terrainLocalZ < -terrainHalfZ - SLOP || terrainLocalZ > terrainHalfZ + SLOP) {
                continue;
            }

            // 采样地形高度和法线
            const terrainHeight = this._sampleTerrainHeight(terrainLocalX, terrainLocalZ, terrain);
            const terrainWorldY = terrainElements[1] + terrainHeight;
            const normal = this._sampleTerrainNormal(terrainLocalX, terrainLocalZ, terrain, this._normal);
            // 计算碰撞深度（地形高度 - 胶囊体表面Y坐标）
            const depth = terrainWorldY - (point[1] - radius);

            // 筛选最优碰撞结果
            if (depth > maxDepth && depth > SLOP) {
                maxDepth = depth;
                Method.copyElements(normal, bestNormal);
                bestPos1[0] = point[0], bestPos1[1] = point[1] - radius, bestPos1[2] = point[2];
                bestPos2[0] = point[0], bestPos2[1] = terrainWorldY, bestPos2[2] = point[2];
            }
        }

        // 存在有效碰撞时，写入检测结果
        if (maxDepth > SLOP) {
            this.setNormal(result, bestNormal[0], bestNormal[1], bestNormal[2]);
            this.addPoint(result, bestPos1[0], bestPos1[1], bestPos1[2], bestPos2[0], bestPos2[1], bestPos2[2], maxDepth, 0);
        }
    }

    /**
     * 将局部坐标系点转换为世界坐标系。
     * 核心逻辑：通过变换矩阵的旋转+平移，将局部点转换为世界点：
     * 1. 局部点 × 旋转矩阵 → 旋转后的点；
     * 2. 加上平移分量 → 世界坐标系点。
     * @param {Float64Array} localPoint - 局部坐标系点（3维）
     * @param {Transform} tf - 变换矩阵
     * @returns {Float64Array} 世界坐标系点（3维）
     */
    private _transformLocalPointToWorld(localPoint: Float64Array, tf: Transform): Float64Array {
        const tfElements = tf.elements;
        const lx = localPoint[0];
        const ly = localPoint[1];
        const lz = localPoint[2];

        // 局部点 × 旋转矩阵（列主序）
        const rx = lx * tfElements[3] + ly * tfElements[4] + lz * tfElements[5];
        const ry = lx * tfElements[6] + ly * tfElements[7] + lz * tfElements[8];
        const rz = lx * tfElements[9] + ly * tfElements[10] + lz * tfElements[11];

        // 加上平移分量，得到世界点
        return new Float64Array([
            rx + tfElements[0],
            ry + tfElements[1],
            rz + tfElements[2]
        ]);
    }

    /**
     * 采样地形高度（双线性插值）。
     * 核心逻辑：通过双线性插值计算任意位置的地形高度，保证高度平滑：
     * 1. 将局部坐标转换为地形网格索引；
     * 2. 获取周围4个网格点的高度；
     * 3. 先X方向线性插值，再Z方向线性插值，得到最终高度。
     * @param {number} localX - 地形局部X坐标
     * @param {number} localZ - 地形局部Z坐标
     * @param {TerrainGeometry} terrain - 地形几何对象
     * @returns {number} 插值后的地形高度
     */
    private _sampleTerrainHeight(localX: number, localZ: number, terrain: TerrainGeometry): number {
        const halfX = terrain.xSize / 2;
        const halfZ = terrain.zSize / 2;

        // 限制坐标在地形范围内
        const clampedLocalX = Math.max(-halfX, Math.min(localX, halfX));
        const clampedLocalZ = Math.max(-halfZ, Math.min(localZ, halfZ));

        // 转换为网格索引（浮点型）
        const gridX = (clampedLocalX + halfX) / terrain.xSize * terrain.xSegments;
        const gridZ = (clampedLocalZ + halfZ) / terrain.zSize * terrain.zSegments;

        // 获取周围4个网格点的索引
        const x0 = Math.max(0, Math.floor(gridX));
        const x1 = Math.min(x0 + 1, terrain.xSegments);
        const z0 = Math.max(0, Math.floor(gridZ));
        const z1 = Math.min(z0 + 1, terrain.zSegments);

        // 计算插值系数
        const tx = gridX - x0;
        const tz = gridZ - z0;

        // 获取4个网格点的高度
        const h00 = terrain.getHeight(x0, z0);
        const h10 = terrain.getHeight(x1, z0);
        const h01 = terrain.getHeight(x0, z1);
        const h11 = terrain.getHeight(x1, z1);

        // 双线性插值
        const h0 = h00 * (1 - tx) + h10 * tx; // X方向插值
        const h1 = h01 * (1 - tx) + h11 * tx; // X方向插值
        return h0 * (1 - tz) + h1 * tz;       // Z方向插值
    }

    /**
     * 采样地形法线（中心差分法）。
     * 核心逻辑：通过中心差分法计算地形法线，保证法线平滑：
     * 1. 采样当前点周围4个方向的高度；
     * 2. 计算X/Z方向的高度梯度；
     * 3. 构造法线向量并归一化，写入输出数组。
     * @param {number} localX - 地形局部X坐标
     * @param {number} localZ - 地形局部Z坐标
     * @param {TerrainGeometry} terrain - 地形几何对象
     * @param {Float64Array} out - 输出法线的数组
     * @returns {Float64Array} 归一化后的地形法线
     */
    private _sampleTerrainNormal(localX: number, localZ: number, terrain: TerrainGeometry, out: Float64Array): Float64Array {
        const halfX = terrain.xSize / 2;
        const halfZ = terrain.zSize / 2;

        // 限制坐标在地形范围内
        const clampedLocalX = Math.max(-halfX, Math.min(localX, halfX));
        const clampedLocalZ = Math.max(-halfZ, Math.min(localZ, halfZ));

        // 计算网格步长
        const xStep = terrain.xSize / terrain.xSegments;
        const zStep = terrain.zSize / terrain.zSegments;

        // 采样周围4个方向的高度（中心差分）
        const hLeft = this._sampleTerrainHeight(Math.max(-halfX, clampedLocalX - xStep), clampedLocalZ, terrain);
        const hRight = this._sampleTerrainHeight(Math.min(halfX, clampedLocalX + xStep), clampedLocalZ, terrain);
        const hBack = this._sampleTerrainHeight(clampedLocalX, Math.max(-halfZ, clampedLocalZ - zStep), terrain);
        const hForward = this._sampleTerrainHeight(clampedLocalX, Math.min(halfZ, clampedLocalZ + zStep), terrain);

        // 计算梯度，构造法线
        const nx = -(hRight - hLeft) / (2 * xStep); // X方向梯度
        const nz = -(hForward - hBack) / (2 * zStep); // Z方向梯度
        const ny = 1.0; // Y方向固定为1（向上）
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        const invLen = len > CONSTANT.SETTING_LINEAR_SLOP ? 1 / len : 1; // 避免除零

        // 归一化法线，写入输出数组
        out[0] = nx * invLen;
        out[1] = ny * invLen;
        out[2] = nz * invLen;
        return out;
    }
}

export { ConvexTerrainDetector };