import ConvexGeometry from "./convex-geometry";
import { GEOMETRY_TYPE } from '../constant';
import Aabb from "../common/aabb";
import Transform from "../common/transform";
import Vec3 from "../common/vec3";
import RayCastHit from "./ray-cast-hit";
import Method from "../common/method";

export default class CylinderGeometry extends ConvexGeometry {
	public radius: number;
	public halfHeight: number;
	constructor(radius: number, halfHeight: number) {
		super(GEOMETRY_TYPE.CYLINDER);
		this.radius = radius;
		this.halfHeight = halfHeight;
		this.updateMass();
	}

	public updateMass(): void {
		const r = this.radius, h = this.halfHeight;
		const r2 = r * r;
		const h2 = h * h * 4;
		this.volume = 3.14159265358979 * r2 * h * 2;
		const icf = this.inertiaCoeff;
		icf[0] = 0.083333333333333329 * (3 * r2 + h2);
		icf[1] = 0;
		icf[2] = 0;
		icf[3] = 0;
		icf[4] = 0.5 * r2;
		icf[5] = 0;
		icf[6] = 0;
		icf[7] = 0;
		icf[8] = 0.083333333333333329 * (3 * r2 + h2);
	}
	public computeAabb(_aabb: Aabb, _tf: Transform): void {
		const r = this.radius, h = this.halfHeight;
		const aabb = _aabb.elements, tf = _tf.elements;
		const ax = tf[4], ay = tf[7], az = tf[10];
		const axisX = ax > 0 ? ax : -ax, axisY = ay > 0 ? ay : -ay, axisZ = az > 0 ? az : -az;
		const axis2X = axisX * axisX, axis2Y = axisY * axisY, axis2Z = axisZ * axisZ;
		let erX = Math.sqrt(1 - axis2X), erY = Math.sqrt(1 - axis2Y), erZ = Math.sqrt(1 - axis2Z);
		erX *= r; erY *= r; erZ *= r;
		const ehX = axisX * h, ehY = axisY * h, ehZ = axisZ * h;
		const maxX = erX + ehX, maxY = erY + ehY, maxZ = erZ + ehZ;
		aabb[0] = tf[0] - maxX; aabb[1] = tf[1] - maxY; aabb[2] = tf[2] - maxZ;
		aabb[3] = tf[0] + maxX; aabb[4] = tf[1] + maxY; aabb[5] = tf[2] + maxZ;
		Method.copyElements(aabb, this.aabbComputed.elements);
	}
	public computeLocalSupportingVertex(_dir: Vec3, _out: Vec3): void {
		const dir = _dir.elements, out = _out.elements;
		const rx = dir[0];
		const rz = dir[2];
		const len = rx * rx + rz * rz;
		let coreRadius = this.radius - this.gjkMargin;
		if (coreRadius < 0) coreRadius = 0;
		const invLen = len > 0 ? coreRadius / Math.sqrt(len) : 0;
		let coreHeight = this.halfHeight - this.gjkMargin;
		if (coreHeight < 0) coreHeight = 0;
		out[0] = rx * invLen;
		out[1] = dir[1] > 0 ? coreHeight : -coreHeight;
		out[2] = rz * invLen;
	}
	public rayCastLocal(beginX: number, beginY: number, beginZ: number, endX: number, endY: number, endZ: number, hit: RayCastHit): boolean {
		const halfH = this.halfHeight;
		const dx = endX - beginX, dy = endY - beginY, dz = endZ - beginZ;
		let tminy = 0, tmaxy = 1;
		if (dy > -1e-6 && dy < 1e-6) {
			if (beginY <= -halfH || beginY >= halfH) return false;
		} else {
			const invDy = 1 / dy;
			let t1 = (-halfH - beginY) * invDy;
			let t2 = (halfH - beginY) * invDy;
			if (t1 > t2) {
				const tmp = t1;
				t1 = t2;
				t2 = tmp;
			}
			if (t1 > 0) tminy = t1;
			if (t2 < 1) tmaxy = t2;
		}
		if (tminy >= 1 || tmaxy <= 0) return false;
		let tminxz = 0;
		let tmaxxz: number;
		const a = dx * dx + dz * dz;
		const b = beginX * dx + beginZ * dz;
		const c = beginX * beginX + beginZ * beginZ - this.radius * this.radius;
		const D = b * b - a * c;
		if (D < 0) return false;
		if (a > 0) {
			const sqrtD = Math.sqrt(D);
			tminxz = (-b - sqrtD) / a;
			tmaxxz = (-b + sqrtD) / a;
			if (tminxz >= 1 || tmaxxz <= 0) return false;
		} else {
			if (c >= 0) return false;
			tminxz = 0;
			tmaxxz = 1;
		}
		let min: number;
		if (tmaxxz <= tminy || tmaxy <= tminxz) return false;
		const normal = hit.normal.elements;
		const position = hit.position.elements;
		if (tminxz < tminy) {
			min = tminy;
			if (min === 0) return false;
			normal[0] = 0; normal[1] = dy > 0 ? -1 : 1; normal[2] = 0;
		} else {
			min = tminxz;
			if (min === 0) return false;
			normal[0] = beginX + dx * min; normal[1] = 0; normal[2] = beginZ + dz * min;
			let invLen = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]);
			if (invLen > 0) {
				invLen = 1 / invLen;
			}
			normal[0] *= invLen; normal[1] *= invLen; normal[2] *= invLen;
		}
		position[0] = beginX + min * dx; position[1] = beginY + min * dy; position[2] = beginZ + min * dz;
		hit.fraction = min;
		return true;
	}
}