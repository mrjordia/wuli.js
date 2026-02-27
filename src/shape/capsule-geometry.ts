import ConvexGeometry from "./convex-geometry";
import { GEOMETRY_TYPE } from '../constant';
import Aabb from "../common/aabb";
import Transform from "../common/transform";
import Vec3 from "../common/vec3";
import RayCastHit from "./ray-cast-hit";
import Method from "../common/method";

export default class CapsuleGeometry extends ConvexGeometry {
	public radius: number;
	public halfHeight: number;
	constructor(radius: number, halfHeight: number) {
		super(GEOMETRY_TYPE.CAPSULE);
		this.radius = radius;
		this.halfHeight = halfHeight;
		this.gjkMargin = this.radius;
		this.updateMass();
	}

	public updateMass(): void {
		const r = this.radius, hh = this.halfHeight;
		const r2 = r * r;
		const hh2 = hh * hh;
		const cylinderVolume = 6.28318530717958 * r2 * hh;
		const sphereVolume = 3.14159265358979 * r2 * r * 4 / 3;
		this.volume = cylinderVolume + sphereVolume;
		const invVolume = this.volume === 0 ? 0 : 1 / this.volume;
		const inertiaXZ = invVolume * (cylinderVolume * (r2 * 0.25 + hh2 / 3) + sphereVolume * (r2 * 0.4 + hh * r * 0.75 + hh2));
		const icf = this.inertiaCoeff;
		icf[0] = inertiaXZ;
		icf[1] = 0;
		icf[2] = 0;
		icf[3] = 0;
		icf[4] = invVolume * (cylinderVolume * r2 * 0.5 + sphereVolume * r2 * 0.4);
		icf[5] = 0;
		icf[6] = 0;
		icf[7] = 0;
		icf[8] = inertiaXZ;
	}
	public computeAabb(_aabb: Aabb, _tf: Transform): void {
		const tf = _tf.elements, aabb = _aabb.elements, r = this.radius, hh = this.halfHeight;
		let radVecX = r, radVecY = r, radVecZ = r;
		const ax = tf[4], ay = tf[7], az = tf[10];
		let axisX = ax > 0 ? ax : -ax, axisY = ay > 0 ? ay : -ay, axisZ = az > 0 ? az : -az;
		axisX = axisX * hh; axisY = axisY * hh; axisZ = axisZ * hh;
		radVecX += axisX; radVecY += axisY; radVecZ += axisZ;
		aabb[0] = tf[0] - radVecX; aabb[1] = tf[1] - radVecY; aabb[2] = tf[2] - radVecZ;
		aabb[3] = tf[0] + radVecX; aabb[4] = tf[1] + radVecY; aabb[5] = tf[2] + radVecZ;
		Method.copyElements(aabb, this.aabbComputed.elements);
	}
	public computeLocalSupportingVertex(dir: Vec3, out: Vec3): void {
		const oe = out.elements;
		if (dir.y > 0) {
			oe[1] = this.halfHeight;
			oe[0] = oe[2] = 0;
		} else {
			oe[1] = -this.halfHeight;
			oe[0] = oe[2] = 0;
		}
	}
	public rayCastLocal(beginX: number, beginY: number, beginZ: number, endX: number, endY: number, endZ: number, hit: RayCastHit): boolean {
		const halfH = this.halfHeight;
		const dx = endX - beginX;
		const dz = endZ - beginZ;
		let tminxz = 0;
		let tmaxxz: number;
		let a = dx * dx + dz * dz;
		let b = beginX * dx + beginZ * dz;
		let c = beginX * beginX + beginZ * beginZ - this.radius * this.radius;
		let D = b * b - a * c;
		if (D < 0) {
			return false;
		}
		if (a > 0) {
			const sqrtD = Math.sqrt(D);
			tminxz = (-b - sqrtD) / a;
			tmaxxz = (-b + sqrtD) / a;
			if (tminxz >= 1 || tmaxxz <= 0) {
				return false;
			}
		} else {
			if (c >= 0) {
				return false;
			}
			tminxz = 0;
		}
		const crossY = beginY + (endY - beginY) * tminxz;
		let min: number;
		if (crossY > -halfH && crossY < halfH) {
			if (tminxz > 0) {
				min = tminxz;
				const ne = hit.normal.elements;
				ne[0] = beginX + dx * min; ne[1] = 0; ne[2] = beginZ + dz * min;
				let invLen = Math.sqrt(ne[0] * ne[0] + ne[1] * ne[1] + ne[2] * ne[2]);
				if (invLen > 0) {
					invLen = 1 / invLen;
				}
				ne[0] *= invLen; ne[1] *= invLen; ne[2] *= invLen;
				const pe = hit.position.elements;
				pe[0] = beginX + min * dx; pe[1] = crossY; pe[2] = beginZ + min * dz;
				hit.fraction = min;
				return true;
			}
			return false;
		}
		const spherePosX = 0, spherePosY = crossY < 0 ? -halfH : halfH, spherePosZ = 0;
		const sphereToBeginX = beginX - spherePosX, sphereToBeginY = beginY - spherePosY, sphereToBeginZ = beginZ - spherePosZ;
		let dX = endX - beginX, dY = endY - beginY, dZ = endZ - beginZ;
		a = dX * dX + dY * dY + dZ * dZ;
		b = sphereToBeginX * dX + sphereToBeginY * dY + sphereToBeginZ * dZ;
		c = sphereToBeginX * sphereToBeginX + sphereToBeginY * sphereToBeginY + sphereToBeginZ * sphereToBeginZ - this.radius * this.radius;
		D = b * b - a * c;
		if (D < 0) {
			return false;
		}
		const t = (-b - Math.sqrt(D)) / a;
		if (t < 0 || t > 1) {
			return false;
		}
		let hitPosX = sphereToBeginX + dX * t, hitPosY = sphereToBeginY + dY * t, hitPosZ = sphereToBeginZ + dZ * t;
		let l = hitPosX * hitPosX + hitPosY * hitPosY + hitPosZ * hitPosZ;
		if (l > 0) {
			l = 1 / Math.sqrt(l);
		}
		const hitNormalX = hitPosX * l, hitNormalY = hitPosY * l, hitNormalZ = hitPosZ * l;
		hitPosX += spherePosX; hitPosY += spherePosY; hitPosZ += spherePosZ;
		const v = hit.position.elements;
		v[0] = hitPosX; v[1] = hitPosY; v[2] = hitPosZ;
		const v1 = hit.normal.elements;
		v1[0] = hitNormalX; v1[1] = hitNormalY; v1[2] = hitNormalZ;
		hit.fraction = t;
		return true;
	}
}