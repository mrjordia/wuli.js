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

    private readonly SHAPE_WEIGHT = 0.5;
    private readonly DIRECTIONS = new Float64Array([
        0, -1, 0,
        0.577, -0.577, 0.577,
        -0.577, -0.577, 0.577,
        -0.577, -0.577, -0.577,
        0.577, -0.577, -0.577,
        0, -0.970, 0.242,
        0, -0.970, -0.242,
        0.242, -0.970, 0,
        -0.242, -0.970, 0
    ]);

    public stabilizeRadiusRatio = 0.7;
    public convexTerrainLayered = true;

    constructor(swapped: boolean) {
        super(swapped);
    }

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

    private _detectConvexTerrainLayered(result: DetectorResult, convex: ConvexGeometry, terrain: TerrainGeometry, convexTf: Transform, terrainTf: Transform): void {
        const SLOP = CONSTANT.SETTING_LINEAR_SLOP;
        const convexPos = convexTf.elements;
        const terrainPos = terrainTf.elements;
        const aabb = convex.aabbComputed.elements;
        const mr = Math.min(aabb[3] - aabb[0], aabb[4] - aabb[1], aabb[5] - aabb[2]) * 0.5 * this.stabilizeRadiusRatio;

        const stablePoint = this._stablePoint
        stablePoint[0] = convexPos[0];
        stablePoint[1] = convexPos[1] - mr;
        stablePoint[2] = convexPos[2];


        const shapePoints = this._sampleConvexSupportPoints(convex, convexTf);

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
        allPoints.push(stablePoint, ...shapePoints);
        for (const point of allPoints) {
            if (point[0] < txMin || point[0] > txMax || point[2] < tzMin || point[2] > tzMax) {
                continue;
            }

            const localX = point[0] - terrainPos[0];
            const localZ = point[2] - terrainPos[2];
            const terrainHeight = this._sampleTerrainHeight(localX, localZ, terrain);
            const terrainY = terrainPos[1] + terrainHeight;
            const normal = this._sampleTerrainNormal(localX, localZ, terrain, this._normal);

            const depth = terrainY - point[1];

            if (depth > bestDepth && depth > SLOP) {
                bestDepth = depth;
                Method.copyElements(normal, bestNormal);
                Method.copyElements(point, bestShapePos);
                bestTerrainPos[0] = point[0];
                bestTerrainPos[1] = terrainY;
                bestTerrainPos[2] = point[2];
            }
        }

        if (bestDepth > SLOP) {
            const finalDepth = bestDepth * this.SHAPE_WEIGHT + (terrainPos[1] + this._sampleTerrainHeight(stablePoint[0] - terrainPos[0], stablePoint[2] - terrainPos[2], terrain) - stablePoint[1]) * (1 - this.SHAPE_WEIGHT);

            const finalPos1 = this._finalPos1;
            finalPos1[0] = stablePoint[0] * (1 - this.SHAPE_WEIGHT) + bestShapePos[0] * this.SHAPE_WEIGHT;
            finalPos1[1] = stablePoint[1] * (1 - this.SHAPE_WEIGHT) + bestShapePos[1] * this.SHAPE_WEIGHT;
            finalPos1[2] = stablePoint[2] * (1 - this.SHAPE_WEIGHT) + bestShapePos[2] * this.SHAPE_WEIGHT;

            const finalPos2 = this._finalPos2;
            finalPos2[0] = finalPos1[0];
            finalPos2[1] = terrainPos[1] + this._sampleTerrainHeight(finalPos1[0] - terrainPos[0], finalPos1[2] - terrainPos[2], terrain);
            finalPos2[2] = finalPos1[2];

            this.setNormal(result, bestNormal[0], bestNormal[1], bestNormal[2]);
            this.addPoint(result,
                finalPos1[0], finalPos1[1], finalPos1[2],
                finalPos2[0], finalPos2[1], finalPos2[2],
                finalDepth,
                0
            );
        }
    }

    private _detectGenericConvexTerrain(result: DetectorResult, convex: ConvexGeometry, terrain: TerrainGeometry, convexTf: Transform, terrainTf: Transform): void {
        const SLOP = CONSTANT.SETTING_LINEAR_SLOP;
        const supportPoints = this._sampleConvexSupportPoints(convex, convexTf);
        if (supportPoints.length === 0) return;
        const terrainElements = terrainTf.elements;
        const terrainHalfX = terrain.xSize / 2;
        const terrainHalfZ = terrain.zSize / 2;

        let maxDepth = 0;
        const bestNormal = this._bestNormal;
        bestNormal[0] = 0, bestNormal[1] = 1, bestNormal[2] = 0;
        const bestPos1 = this._bestPos1;
        bestPos1.fill(0);
        const bestPos2 = this._bestPos2;
        bestPos2.fill(0);

        for (const point of supportPoints) {
            const terrainLocalX = point[0] - terrainElements[0];
            const terrainLocalZ = point[2] - terrainElements[2];

            if (terrainLocalX < -terrainHalfX - SLOP || terrainLocalX > terrainHalfX + SLOP || terrainLocalZ < -terrainHalfZ - SLOP || terrainLocalZ > terrainHalfZ + SLOP) {
                continue;
            }

            const terrainHeight = this._sampleTerrainHeight(terrainLocalX, terrainLocalZ, terrain);
            const terrainWorldY = terrainElements[1] + terrainHeight;
            const normal = this._sampleTerrainNormal(terrainLocalX, terrainLocalZ, terrain, this._normal);
            const depth = terrainWorldY - point[1];

            if (depth > maxDepth && depth > SLOP) {
                maxDepth = depth;
                Method.copyElements(normal, bestNormal);
                bestPos1[0] = point[0], bestPos1[1] = point[1], bestPos1[2] = point[2];
                bestPos2[0] = point[0], bestPos2[1] = terrainWorldY, bestPos2[2] = point[2];
            }
        }

        if (maxDepth > SLOP) {
            this.setNormal(result, bestNormal[0], bestNormal[1], bestNormal[2]);
            this.addPoint(result, bestPos1[0], bestPos1[1], bestPos1[2], bestPos2[0], bestPos2[1], bestPos2[2], maxDepth, 0);
        }
    }

    private _sampleConvexSupportPoints(convex: ConvexGeometry, tf: Transform): Array<Float64Array> {
        const supportPoints = this._supportPoints;
        supportPoints.length = 0;
        if (convex.type === GEOMETRY_TYPE.TERRAIN) {
            return supportPoints;
        }

        const tfEles = tf.elements;
        const localDir = this._localDir;
        const localSps = this._localSupport;

        for (let i = 0; i < this.DIRECTIONS.length; i += 3) {
            const wx = this.DIRECTIONS[i];
            const wy = this.DIRECTIONS[i + 1];
            const wz = this.DIRECTIONS[i + 2];

            const lx = wx * tfEles[3] + wy * tfEles[6] + wz * tfEles[9];
            const ly = wx * tfEles[4] + wy * tfEles[7] + wz * tfEles[10];
            const lz = wx * tfEles[5] + wy * tfEles[8] + wz * tfEles[11];
            localDir.elements[0] = lx;
            localDir.elements[1] = ly;
            localDir.elements[2] = lz;

            const index = Math.floor(i / 3);
            if (!localSps[index]) localSps[index] = new Vec3();
            convex.computeLocalSupportingVertex(localDir, localSps[index]);

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

    private _detectSphereTerrain(result: DetectorResult, sphere: SphereGeometry, terrain: TerrainGeometry, sphereTf: Transform, terrainTf: Transform): void {
        const sphereElements = sphereTf.elements;
        const terrainElements = terrainTf.elements;
        const radius = sphere.radius;

        const terrainHalfX = terrain.xSize / 2;
        const terrainHalfZ = terrain.zSize / 2;
        const localX = sphereElements[0] - terrainElements[0];
        const localZ = sphereElements[2] - terrainElements[2];

        const SLOP = CONSTANT.SETTING_LINEAR_SLOP;
        if (localX < -terrainHalfX - SLOP || localX > terrainHalfX + SLOP || localZ < -terrainHalfZ - SLOP || localZ > terrainHalfZ + SLOP) {
            return;
        }

        const terrainHeight = this._sampleTerrainHeight(localX, localZ, terrain);
        const terrainWorldY = terrainElements[1] + terrainHeight;
        const normal = this._sampleTerrainNormal(localX, localZ, terrain, this._normal);

        const sphereWorldY = sphereElements[1];
        const penetrationDepth = radius - (sphereWorldY - terrainWorldY);
        if (penetrationDepth < SLOP) {
            return;
        }

        const pos1X = sphereElements[0] - normal[0] * radius;
        const pos1Y = sphereElements[1] - normal[1] * radius;
        const pos1Z = sphereElements[2] - normal[2] * radius;

        const pos2X = sphereElements[0];
        const pos2Y = terrainWorldY;
        const pos2Z = sphereElements[2];

        this.setNormal(result, normal[0], normal[1], normal[2]);
        this.addPoint(result, pos1X, pos1Y, pos1Z, pos2X, pos2Y, pos2Z, penetrationDepth, 0);
    }

    private _detectCapsuleTerrain(result: DetectorResult, capsule: CapsuleGeometry, terrain: TerrainGeometry, capsuleTf: Transform, terrainTf: Transform): void {
        const SLOP = CONSTANT.SETTING_LINEAR_SLOP;
        const terrainElements = terrainTf.elements;
        const radius = capsule.radius;
        const halfHeight = capsule.halfHeight;
        const terrainHalfX = terrain.xSize / 2;
        const terrainHalfZ = terrain.zSize / 2;

        const p0Local = new Float64Array([0, -halfHeight, 0]);
        const p1Local = new Float64Array([0, halfHeight, 0]);
        const p0World = this._transformLocalPointToWorld(p0Local, capsuleTf);
        const p1World = this._transformLocalPointToWorld(p1Local, capsuleTf);
        const midWorld = new Float64Array([
            (p0World[0] + p1World[0]) / 2,
            (p0World[1] + p1World[1]) / 2,
            (p0World[2] + p1World[2]) / 2
        ]);

        const samplePoints = [p0World, p1World, midWorld];
        let maxDepth = 0;
        const bestNormal = new Float64Array([0, 1, 0]);
        const bestPos1 = new Float64Array(3);
        const bestPos2 = new Float64Array(3);

        for (const point of samplePoints) {
            const terrainLocalX = point[0] - terrainElements[0];
            const terrainLocalZ = point[2] - terrainElements[2];

            if (terrainLocalX < -terrainHalfX - SLOP || terrainLocalX > terrainHalfX + SLOP || terrainLocalZ < -terrainHalfZ - SLOP || terrainLocalZ > terrainHalfZ + SLOP) {
                continue;
            }

            const terrainHeight = this._sampleTerrainHeight(terrainLocalX, terrainLocalZ, terrain);
            const terrainWorldY = terrainElements[1] + terrainHeight;
            const normal = this._sampleTerrainNormal(terrainLocalX, terrainLocalZ, terrain, this._normal);
            const depth = terrainWorldY - (point[1] - radius);

            if (depth > maxDepth && depth > SLOP) {
                maxDepth = depth;
                Method.copyElements(normal, bestNormal);
                bestPos1[0] = point[0], bestPos1[1] = point[1] - radius, bestPos1[2] = point[2];
                bestPos2[0] = point[0], bestPos2[1] = terrainWorldY, bestPos2[2] = point[2];
            }
        }

        if (maxDepth > SLOP) {
            this.setNormal(result, bestNormal[0], bestNormal[1], bestNormal[2]);
            this.addPoint(result, bestPos1[0], bestPos1[1], bestPos1[2], bestPos2[0], bestPos2[1], bestPos2[2], maxDepth, 0);
        }
    }

    private _transformLocalPointToWorld(localPoint: Float64Array, tf: Transform): Float64Array {
        const tfElements = tf.elements;
        const lx = localPoint[0];
        const ly = localPoint[1];
        const lz = localPoint[2];

        const rx = lx * tfElements[3] + ly * tfElements[4] + lz * tfElements[5];
        const ry = lx * tfElements[6] + ly * tfElements[7] + lz * tfElements[8];
        const rz = lx * tfElements[9] + ly * tfElements[10] + lz * tfElements[11];

        return new Float64Array([
            rx + tfElements[0],
            ry + tfElements[1],
            rz + tfElements[2]
        ]);
    }

    private _sampleTerrainHeight(localX: number, localZ: number, terrain: TerrainGeometry): number {
        const halfX = terrain.xSize / 2;
        const halfZ = terrain.zSize / 2;

        const clampedLocalX = Math.max(-halfX, Math.min(localX, halfX));
        const clampedLocalZ = Math.max(-halfZ, Math.min(localZ, halfZ));

        const gridX = (clampedLocalX + halfX) / terrain.xSize * terrain.xSegments;
        const gridZ = (clampedLocalZ + halfZ) / terrain.zSize * terrain.zSegments;

        const x0 = Math.max(0, Math.floor(gridX));
        const x1 = Math.min(x0 + 1, terrain.xSegments);
        const z0 = Math.max(0, Math.floor(gridZ));
        const z1 = Math.min(z0 + 1, terrain.zSegments);

        const tx = gridX - x0;
        const tz = gridZ - z0;

        const h00 = terrain.getHeight(x0, z0);
        const h10 = terrain.getHeight(x1, z0);
        const h01 = terrain.getHeight(x0, z1);
        const h11 = terrain.getHeight(x1, z1);

        const h0 = h00 * (1 - tx) + h10 * tx;
        const h1 = h01 * (1 - tx) + h11 * tx;
        return h0 * (1 - tz) + h1 * tz;
    }

    private _sampleTerrainNormal(localX: number, localZ: number, terrain: TerrainGeometry, out: Float64Array): Float64Array {
        const halfX = terrain.xSize / 2;
        const halfZ = terrain.zSize / 2;

        const clampedLocalX = Math.max(-halfX, Math.min(localX, halfX));
        const clampedLocalZ = Math.max(-halfZ, Math.min(localZ, halfZ));

        const xStep = terrain.xSize / terrain.xSegments;
        const zStep = terrain.zSize / terrain.zSegments;

        const hLeft = this._sampleTerrainHeight(Math.max(-halfX, clampedLocalX - xStep), clampedLocalZ, terrain);
        const hRight = this._sampleTerrainHeight(Math.min(halfX, clampedLocalX + xStep), clampedLocalZ, terrain);
        const hBack = this._sampleTerrainHeight(clampedLocalX, Math.max(-halfZ, clampedLocalZ - zStep), terrain);
        const hForward = this._sampleTerrainHeight(clampedLocalX, Math.min(halfZ, clampedLocalZ + zStep), terrain);

        const nx = -(hRight - hLeft) / (2 * xStep);
        const nz = -(hForward - hBack) / (2 * zStep);
        const ny = 1.0;
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        const invLen = len > CONSTANT.SETTING_LINEAR_SLOP ? 1 / len : 1;

        out[0] = nx * invLen;
        out[1] = ny * invLen;
        out[2] = nz * invLen;
        return out;
    }
}