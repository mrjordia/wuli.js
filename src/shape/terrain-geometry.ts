import Geometry from "./geometry";
import { GEOMETRY_TYPE } from '../constant';
import Aabb from "../common/aabb";
import Transform from "../common/transform";
import RayCastHit from "./ray-cast-hit";
import { CONSTANT } from "../constant";
import Method from "../common/method";

/**
 * 地形几何体类。
 * 实现基于网格的高度场地形几何体，支持自定义X/Z轴尺寸、分段数和高度数据，
 * 是物理引擎中用于地面、山坡、不规则地形碰撞检测的核心类。内部以二维网格存储高度数据，
 * 实现高精度的射线-地形相交检测（逐三角形检测），支持动态更新地形高度并自动更新包围盒。
 */
export default class TerrainGeometry extends Geometry {
    /**
     * 地形X轴总尺寸（宽度）。
     * 地形在X轴方向的总长度，地形范围为 [-xSize/2, xSize/2]
     */
    public xSize: number;

    /**
     * 地形Z轴总尺寸（长度）。
     * 地形在Z轴方向的总长度，地形范围为 [-zSize/2, zSize/2]
     */
    public zSize: number;

    /**
     * X轴方向的分段数。
     * 将X轴总尺寸划分为xSegments个等分，每个分段宽度 = xSize/xSegments
     */
    public xSegments: number;

    /**
     * Z轴方向的分段数。
     * 将Z轴总尺寸划分为zSegments个等分，每个分段长度 = zSize/zSegments
     */
    public zSegments: number;

    /**
     * 地形高度数据数组（Float64Array）。
     * 存储地形网格每个顶点的高度值，索引计算规则：index = x*(zSegments+1) + z，
     * 其中x∈[0,xSegments]，z∈[0,zSegments]，总长度 = (xSegments+1)*(zSegments+1)
     */
    public heights: Float64Array;

    /**
     * 地形最小高度值。
     * 从高度数据中计算出的最小高度，由_calcMinMaxHeight()方法更新
     */
    public minHeight!: number;

    /**
     * 地形最大高度值。
     * 从高度数据中计算出的最大高度，由_calcMinMaxHeight()方法更新
     */
    public maxHeight!: number;

    /**
     * 构造函数：创建地形几何体实例。
     * 核心逻辑：
     * 1. 验证输入参数合法性，尺寸和分段数必须为正数；
     * 2. 标准化高度数据为Float64Array格式，自动补全缺失数据或截断过长数据；
     * 3. 计算地形最小/最大高度，初始化物理质量属性。
     * 注意：高度数据为空或格式错误时会抛出异常，非有限数值会被替换为0。
     * @param {number} xSize - X轴总尺寸（必须>0）
     * @param {number} zSize - Z轴总尺寸（必须>0）
     * @param {number} xSegments - X轴分段数（必须>0）
     * @param {number} zSegments - Z轴分段数（必须>0）
     * @param {number[][] | Float64Array} heights - 地形高度数据
     */
    constructor(xSize: number, zSize: number, xSegments: number, zSegments: number, heights: number[][] | Float64Array) {
        super(GEOMETRY_TYPE.TERRAIN);

        if (xSize <= 0 || zSize <= 0 || xSegments <= 0 || zSegments <= 0) {
            throw new Error("Terrain size and segment count must be positive numbers.");
        }
        this.xSize = xSize;
        this.zSize = zSize;
        this.xSegments = xSegments;
        this.zSegments = zSegments;

        const totalLength = (xSegments + 1) * (zSegments + 1);

        if (!heights || (heights instanceof Float64Array && heights.length === 0) ||
            (Array.isArray(heights) && heights.length === 0)) {
            throw new Error("Terrain height data cannot be empty.");
        }

        if (heights instanceof Float64Array) {
            if (heights.length !== totalLength) {
                console.warn(`Terrain height data length(${heights.length}) does not match (${totalLength}). Default values will be automatically filled.`);
                this.heights = new Float64Array(totalLength).fill(0);
                const copyLen = Math.min(heights.length, totalLength);
                this.heights.set(heights.subarray(0, copyLen), 0);
            } else {
                this.heights = new Float64Array(heights);
            }
        } else {
            this.heights = new Float64Array(totalLength).fill(0);
            const maxX = Math.min(heights.length, xSegments + 1);
            for (let x = 0; x < maxX; x++) {
                const row = heights[x] || [];
                const maxZ = Math.min(row.length, zSegments + 1);
                for (let z = 0; z < maxZ; z++) {
                    const h = isFinite(row[z]) ? row[z] : 0;
                    const index = x * (zSegments + 1) + z;
                    this.heights[index] = h;
                }
            }
        }

        this._calcMinMaxHeight();
        this.updateMass();
    }

    /**
     * 计算地形的最小/最大高度值。
     * 遍历所有高度数据，更新minHeight和maxHeight属性，
     * 是计算AABB和射线检测快速剔除的基础。
     * @returns {void}
     */
    private _calcMinMaxHeight(): void {
        this.minHeight = Number.POSITIVE_INFINITY;
        this.maxHeight = Number.NEGATIVE_INFINITY;

        for (let i = 0; i < this.heights.length; i++) {
            const h = this.heights[i];
            if (h < this.minHeight) this.minHeight = h;
            if (h > this.maxHeight) this.maxHeight = h;
        }
    }

    /**
     * 更新地形的物理质量属性。
     * 地形作为静态几何体，体积和转动惯量系数均设为0，
     * 无需参与物理模拟的质量计算。
     * @returns {void}
     */
    public updateMass(): void {
        this.volume = 0;
        this.inertiaCoeff.fill(0);
    }

    /**
     * 计算地形在指定变换下的世界坐标系AABB。
     * 核心逻辑：
     * 1. X/Z轴范围基于地形尺寸和变换矩阵平移分量计算；
     * 2. Y轴范围基于地形最小/最大高度和变换矩阵平移分量计算；
     * 3. 将计算结果同步到aabbComputed属性。
     * @param {Aabb} _aabb - 输出参数，存储计算后的世界AABB
     * @param {Transform} _tf - 地形的变换矩阵（主要使用平移分量）
     * @returns {void}
     */
    public computeAabb(_aabb: Aabb, _tf: Transform): void {
        const aabb = _aabb.elements;
        const tf = _tf.elements;

        const halfX = this.xSize / 2;
        const halfZ = this.zSize / 2;

        aabb[0] = tf[0] - halfX;
        aabb[1] = tf[1] + this.minHeight;
        aabb[2] = tf[2] - halfZ;
        aabb[3] = tf[0] + halfX;
        aabb[4] = tf[1] + this.maxHeight;
        aabb[5] = tf[2] + halfZ;
        Method.copyElements(aabb, this.aabbComputed.elements);
    }

    /**
     * 计算地形高度数据的索引。
     * 转换二维网格坐标为一维数组索引，公式：index = x*(zSegments+1) + z。
     * @param {number} x - X轴网格索引（0~xSegments）
     * @param {number} z - Z轴网格索引（0~zSegments）
     * @returns {number} 高度数组的一维索引
     */
    private _getIndex(x: number, z: number): number {
        return x * (this.zSegments + 1) + z;
    }

    /**
     * 局部坐标系下的射线-地形相交检测。
     * 核心逻辑：
     * 1. 快速剔除：射线方向与地形高度范围无交集、射线过短、射线完全在地形外时直接返回false；
     * 2. 网格遍历：将地形网格拆分为三角形，逐三角形检测射线相交；
     * 3. 结果筛选：记录最近的相交点，计算相交点坐标和法向量；
     * 4. 填充结果：将相交信息写入hit对象并返回true。
     * @param {number} beginX - 射线起点X坐标（局部坐标系）
     * @param {number} beginY - 射线起点Y坐标（局部坐标系）
     * @param {number} beginZ - 射线起点Z坐标（局部坐标系）
     * @param {number} endX - 射线终点X坐标（局部坐标系）
     * @param {number} endY - 射线终点Y坐标（局部坐标系）
     * @param {number} endZ - 射线终点Z坐标（局部坐标系）
     * @param {RayCastHit} hit - 输出参数，存储射线检测结果
     * @returns {boolean} 射线是否与地形相交（true：相交，false：未相交）
     */
    public rayCastLocal(beginX: number, beginY: number, beginZ: number, endX: number, endY: number, endZ: number, hit: RayCastHit): boolean {
        const dy = endY - beginY;
        if (dy > 0 && beginY > this.maxHeight) {
            return false;
        }
        if (dy < 0 && beginY < this.minHeight) {
            return false;
        }

        const dx = endX - beginX;
        const dz = endZ - beginZ;
        const rayLen = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (rayLen < CONSTANT.SETTING_LINEAR_SLOP) return false;

        const invLen = 1 / rayLen;
        const dirX = dx * invLen;
        const dirY = dy * invLen;
        const dirZ = dz * invLen;

        const xStep = this.xSize / this.xSegments;
        const zStep = this.zSize / this.zSegments;
        const halfX = this.xSize / 2;
        const halfZ = this.zSize / 2;

        const isBeginInX = beginX >= -halfX && beginX <= halfX;
        const isBeginInZ = beginZ >= -halfZ && beginZ <= halfZ;
        const isEndInX = endX >= -halfX && endX <= halfX;
        const isEndInZ = endZ >= -halfZ && endZ <= halfZ;

        if (!isBeginInX && !isEndInX || !isBeginInZ && !isEndInZ) {
            return false;
        }

        let closestT = Number.POSITIVE_INFINITY;
        let hitNormalX = 0, hitNormalY = 0, hitNormalZ = 0;
        let hitPosX = 0, hitPosY = 0, hitPosZ = 0;

        for (let x = 0; x < this.xSegments; x++) {
            for (let z = 0; z < this.zSegments; z++) {
                const v0x = -halfX + x * xStep;
                const v0z = -halfZ + z * zStep;
                const v1x = v0x + xStep;
                const v1z = v0z;
                const v2x = v1x;
                const v2z = v0z + zStep;
                const v3x = v0x;
                const v3z = v2z;

                const h0 = this.heights[this._getIndex(x, z)];
                const h1 = this.heights[this._getIndex(x + 1, z)];
                const h2 = this.heights[this._getIndex(x + 1, z + 1)];
                const h3 = this.heights[this._getIndex(x, z + 1)];

                const t1 = this._rayIntersectsTriangle(
                    beginX, beginY, beginZ, dirX, dirY, dirZ,
                    v0x, h0, v0z, v1x, h1, v1z, v2x, h2, v2z
                );

                const t2 = this._rayIntersectsTriangle(
                    beginX, beginY, beginZ, dirX, dirY, dirZ,
                    v0x, h0, v0z, v2x, h2, v2z, v3x, h3, v3z
                );

                if (t1 > 0 && t1 < closestT) {
                    closestT = t1;
                    [hitPosX, hitPosY, hitPosZ] = this._getRayPoint(beginX, beginY, beginZ, dirX, dirY, dirZ, t1);
                    [hitNormalX, hitNormalY, hitNormalZ] = this._calcTriangleNormal(v0x, h0, v0z, v1x, h1, v1z, v2x, h2, v2z);
                }
                if (t2 > 0 && t2 < closestT) {
                    closestT = t2;
                    [hitPosX, hitPosY, hitPosZ] = this._getRayPoint(beginX, beginY, beginZ, dirX, dirY, dirZ, t2);
                    [hitNormalX, hitNormalY, hitNormalZ] = this._calcTriangleNormal(v0x, h0, v0z, v2x, h2, v2z, v3x, h3, v3z);
                }
            }
        }

        if (closestT < Number.POSITIVE_INFINITY && closestT <= rayLen) {
            hit.fraction = closestT / rayLen;
            hit.position.elements[0] = hitPosX;
            hit.position.elements[1] = hitPosY;
            hit.position.elements[2] = hitPosZ;
            hit.normal.elements[0] = hitNormalX;
            hit.normal.elements[1] = hitNormalY;
            hit.normal.elements[2] = hitNormalZ;
            return true;
        }

        return false;
    }

    /**
     * 射线-三角形相交检测（Möller-Trumbore算法）。
     * 实现经典的Möller-Trumbore射线三角形相交算法，
     * 检测射线是否与三角形相交，并返回相交点的射线参数t（沿射线方向的距离）。
     * @param {number} rayOriginX - 射线起点X
     * @param {number} rayOriginY - 射线起点Y
     * @param {number} rayOriginZ - 射线起点Z
     * @param {number} rayDirX - 射线方向X（归一化）
     * @param {number} rayDirY - 射线方向Y（归一化）
     * @param {number} rayDirZ - 射线方向Z（归一化）
     * @param {number} v0x - 三角形顶点0 X
     * @param {number} v0y - 三角形顶点0 Y
     * @param {number} v0z - 三角形顶点0 Z
     * @param {number} v1x - 三角形顶点1 X
     * @param {number} v1y - 三角形顶点1 Y
     * @param {number} v1z - 三角形顶点1 Z
     * @param {number} v2x - 三角形顶点2 X
     * @param {number} v2y - 三角形顶点2 Y
     * @param {number} v2z - 三角形顶点2 Z
     * @returns {number} 相交参数t（>0表示相交，-1表示不相交）
     */
    private _rayIntersectsTriangle(rayOriginX: number, rayOriginY: number, rayOriginZ: number, rayDirX: number, rayDirY: number, rayDirZ: number, v0x: number, v0y: number, v0z: number, v1x: number, v1y: number, v1z: number, v2x: number, v2y: number, v2z: number): number {
        const EPS = CONSTANT.SETTING_LINEAR_SLOP;

        const edge1x = v1x - v0x;
        const edge1y = v1y - v0y;
        const edge1z = v1z - v0z;
        const edge2x = v2x - v0x;
        const edge2y = v2y - v0y;
        const edge2z = v2z - v0z;

        const hx = rayDirY * edge2z - rayDirZ * edge2y;
        const hy = rayDirZ * edge2x - rayDirX * edge2z;
        const hz = rayDirX * edge2y - rayDirY * edge2x;

        const a = edge1x * hx + edge1y * hy + edge1z * hz;
        if (a > -EPS && a < EPS) return -1;

        const f = 1 / a;
        const sx = rayOriginX - v0x;
        const sy = rayOriginY - v0y;
        const sz = rayOriginZ - v0z;

        const u = f * (sx * hx + sy * hy + sz * hz);
        if (u < 0 || u > 1) return -1;

        const qx = sy * edge1z - sz * edge1y;
        const qy = sz * edge1x - sx * edge1z;
        const qz = sx * edge1y - sy * edge1x;

        const v = f * (rayDirX * qx + rayDirY * qy + rayDirZ * qz);
        if (v < 0 || u + v > 1) return -1;

        const t = f * (edge2x * qx + edge2y * qy + edge2z * qz);
        return t > EPS ? t : -1;
    }

    /**
     * 计算射线参数t对应的三维坐标。
     * 公式：P = O + t*D，其中O为起点，D为归一化方向向量，t为距离。
     * @param {number} ox - 射线起点X
     * @param {number} oy - 射线起点Y
     * @param {number} oz - 射线起点Z
     * @param {number} dx - 射线方向X（归一化）
     * @param {number} dy - 射线方向Y（归一化）
     * @param {number} dz - 射线方向Z（归一化）
     * @param {number} t - 射线参数t
     * @returns {[number, number, number]} 射线t参数对应的三维坐标
     */
    private _getRayPoint(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, t: number): [number, number, number] {
        return [ox + dx * t, oy + dy * t, oz + dz * t];
    }

    /**
     * 计算三角形的归一化法向量。
     * 通过三角形两条边的叉乘计算法向量，并归一化，
     * 保证法向量长度为1，用于射线检测的碰撞法向量输出。
     * @param {number} v0x - 三角形顶点0 X
     * @param {number} v0y - 三角形顶点0 Y
     * @param {number} v0z - 三角形顶点0 Z
     * @param {number} v1x - 三角形顶点1 X
     * @param {number} v1y - 三角形顶点1 Y
     * @param {number} v1z - 三角形顶点1 Z
     * @param {number} v2x - 三角形顶点2 X
     * @param {number} v2y - 三角形顶点2 Y
     * @param {number} v2z - 三角形顶点2 Z
     * @returns {[number, number, number]} 归一化的三角形法向量
     */
    private _calcTriangleNormal(v0x: number, v0y: number, v0z: number, v1x: number, v1y: number, v1z: number, v2x: number, v2y: number, v2z: number): [number, number, number] {
        const ex1 = v1x - v0x;
        const ey1 = v1y - v0y;
        const ez1 = v1z - v0z;
        const ex2 = v2x - v0x;
        const ey2 = v2y - v0y;
        const ez2 = v2z - v0z;

        const nx = ey1 * ez2 - ez1 * ey2;
        const ny = ez1 * ex2 - ex1 * ez2;
        const nz = ex1 * ey2 - ey1 * ex2;

        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        const invLen = len > CONSTANT.SETTING_LINEAR_SLOP ? 1 / len : 1;
        return [nx * invLen, ny * invLen, nz * invLen];
    }

    /**
     * 更新地形指定网格顶点的高度。
     * 核心逻辑：
     * 1. 验证网格索引合法性，超出范围抛出异常；
     * 2. 更新高度数据数组对应位置的值；
     * 3. 重新计算地形最小/最大高度（保证AABB准确性）。
     * @param {number} x - X轴网格索引（0~xSegments）
     * @param {number} z - Z轴网格索引（0~zSegments）
     * @param {number} height - 新高度值
     * @returns {void}
     */
    public updateHeight(x: number, z: number, height: number): void {
        if (x < 0 || x > this.xSegments || z < 0 || z > this.zSegments) {
            throw new Error(`Terrain index out of bounds:x=${x}, z=${z}(maximum:${this.xSegments}, ${this.zSegments})`);
        }
        const index = this._getIndex(x, z);
        this.heights[index] = height;
        this._calcMinMaxHeight();
    }

    /**
     * 获取地形指定网格顶点的高度。
     * 安全获取高度数据，索引超出范围时返回0而非抛出异常，
     * 适用于外部查询地形高度的场景。
     * @param {number} x - X轴网格索引（0~xSegments）
     * @param {number} z - Z轴网格索引（0~zSegments）
     * @returns {number} 对应网格顶点的高度值（索引越界返回0）
     */
    public getHeight(x: number, z: number): number {
        if (x < 0 || x > this.xSegments || z < 0 || z > this.zSegments) {
            return 0;
        }
        return this.heights[this._getIndex(x, z)];
    }
}

export { TerrainGeometry };