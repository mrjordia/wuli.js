import Geometry from "./geometry";
import { GEOMETRY_TYPE } from '../constant';
import Aabb from "../common/aabb";
import Transform from "../common/transform";
import RayCastHit from "./ray-cast-hit";
import { CONSTANT } from "../constant";
import Method from "../common/method";

export default class TerrainGeometry extends Geometry {
    public xSize: number;
    public zSize: number;
    public xSegments: number;
    public zSegments: number;
    public heights: Float64Array;
    public minHeight!: number;
    public maxHeight!: number;

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

    private _calcMinMaxHeight(): void {
        this.minHeight = Number.POSITIVE_INFINITY;
        this.maxHeight = Number.NEGATIVE_INFINITY;

        for (let i = 0; i < this.heights.length; i++) {
            const h = this.heights[i];
            if (h < this.minHeight) this.minHeight = h;
            if (h > this.maxHeight) this.maxHeight = h;
        }
    }

    public updateMass(): void {
        this.volume = 0;
        this.inertiaCoeff.fill(0);
    }

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

    private _getIndex(x: number, z: number): number {
        return x * (this.zSegments + 1) + z;
    }

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

    private _getRayPoint(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, t: number): [number, number, number] {
        return [ox + dx * t, oy + dy * t, oz + dz * t];
    }

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

    public updateHeight(x: number, z: number, height: number): void {
        if (x < 0 || x > this.xSegments || z < 0 || z > this.zSegments) {
            throw new Error(`Terrain index out of bounds:x=${x}, z=${z}(maximum:${this.xSegments}, ${this.zSegments})`);
        }
        const index = this._getIndex(x, z);
        this.heights[index] = height;
        this._calcMinMaxHeight();
    }

    public getHeight(x: number, z: number): number {
        if (x < 0 || x > this.xSegments || z < 0 || z > this.zSegments) {
            return 0;
        }
        return this.heights[this._getIndex(x, z)];
    }
}