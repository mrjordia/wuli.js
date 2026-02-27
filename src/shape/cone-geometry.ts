import ConvexGeometry from "./convex-geometry";
import { GEOMETRY_TYPE } from '../constant';
import Aabb from "../common/aabb";
import Transform from "../common/transform";
import Vec3 from "../common/vec3";
import RayCastHit from "./ray-cast-hit";
import Method from "../common/method";

export default class ConeGeometry extends ConvexGeometry {
	public radius : number;
	public halfHeight : number;
	public sinTheta : number;
	public cosTheta : number;
	constructor(radius : number, height : number) {
		super(GEOMETRY_TYPE.CONE);
		this.radius = radius;
		const hh = height * 0.5;
		this.halfHeight = hh;
		this.sinTheta = radius / Math.sqrt(radius * radius + 4 * hh * hh);
		this.cosTheta = 2 * hh / Math.sqrt(radius * radius + 4 * hh * hh);
		this.updateMass();
	}

	public updateMass() : void {
		const r = this.radius, hh = this.halfHeight;
		const r2 = r * r;
		const h2 = hh * hh * 4;
		this.volume = 3.14159265358979 * r2 * hh * 2 / 3;
		const icf = this.inertiaCoeff;
		icf[0] = 0.05 * (3 * r2 + 2 * h2);
		icf[1] = 0;
		icf[2] = 0;
		icf[3] = 0;
		icf[4] = 0.3 * r2;
		icf[5] = 0;
		icf[6] = 0;
		icf[7] = 0;
		icf[8] = 0.05 * (3 * r2 + 2 * h2);
	}
	public computeAabb(_aabb : Aabb, _tf : Transform) : void {
		const aabb = _aabb.elements, tf = _tf.elements, r = this.radius, hh = this.halfHeight;
		const axisX = tf[4], axisY = tf[7], axisZ = tf[10];
		const axis2X = axisX * axisX, axis2Y = axisY * axisY, axis2Z = axisZ * axisZ;
		let erX = Math.sqrt(1 - axis2X), erY = Math.sqrt(1 - axis2Y), erZ = Math.sqrt(1 - axis2Z);
		erX *= r; erY *= r; erZ *= r;
		const ehX = axisX * hh, ehY = axisY * hh, ehZ = axisZ * hh;
		let rminX = -ehX, rminY = -ehY, rminZ = -ehZ;
		rminX -= erX; rminY -= erY; rminZ -= erZ;
		let rmaxX = -ehX, rmaxY = -ehY, rmaxZ = -ehZ;
		rmaxX += erX; rmaxY += erY; rmaxZ += erZ;
		let maxX = rminX > rmaxX ? rminX : rmaxX, maxY = rminY > rmaxY ? rminY : rmaxY, maxZ = rminZ > rmaxZ ? rminZ : rmaxZ;
		if (!(maxX > ehX)) maxX = ehX;
		if (!(maxY > ehY)) maxY = ehY;
		if (!(maxZ > ehZ)) maxZ = ehZ;
		let minX = rminX < rmaxX ? rminX : rmaxX, minY = rminY < rmaxY ? rminY : rmaxY, minZ = rminZ < rmaxZ ? rminZ : rmaxZ;
		if (!(minX < ehX)) minX = ehX;
		if (!(minY < ehY)) minY = ehY;
		if (!(minZ < ehZ)) minZ = ehZ;
		aabb[0] = tf[0] + minX;
		aabb[1] = tf[1] + minY;
		aabb[2] = tf[2] + minZ;
		aabb[3] = tf[0] + maxX;
		aabb[4] = tf[1] + maxY;
		aabb[5] = tf[2] + maxZ;
		Method.copyElements(aabb, this.aabbComputed.elements);
	}
	public computeLocalSupportingVertex(_dir : Vec3, _out : Vec3) : void {
		const dir = _dir.elements, out = _out.elements;
		const sinTheta = this.sinTheta, hh = this.halfHeight, gjm = this.gjkMargin;
		const dx = dir[0], dy = dir[1], dz = dir[2];
		if (dy > 0 && dy * dy > sinTheta * sinTheta * (dx * dx + dy * dy + dz * dz)) {
			out[1] = hh - gjm / sinTheta;
			out[0] = out[2] = 0;
			if (out[1] < 0) out[1] = 0;
			return;
		}
		const rx = dir[0];
		const rz = dir[2];
		const len = rx * rx + rz * rz;
		const height = 2 * hh;
		let coreRadius = (height - gjm) / height * this.radius - gjm / this.cosTheta;
		if (coreRadius < 0) coreRadius = 0;
		const invLen = len > 0 ? coreRadius / Math.sqrt(len) : 0;
		let coreHalfHeight = hh - gjm;
		if (coreHalfHeight < 0) coreHalfHeight = 0;
		out[0] = rx * invLen; out[1] = -coreHalfHeight; out[2] = rz * invLen;
	}
	public rayCastLocal(beginX : number, beginY : number, beginZ : number, endX : number, endY : number, endZ : number, hit : RayCastHit) : boolean {
		let p1y : number;
		const halfH = this.halfHeight, cosTheta = this.cosTheta;
		const dx = endX - beginX, dy = endY - beginY, dz = endZ - beginZ;
		let tminy = 0, tmaxy = 1;
		if (dy > -1e-6 && dy < 1e-6) {
			if (beginY <= -halfH || beginY >= halfH) return false;
		} else {
			const invDy = 1 / dy;
			let t1 = (-halfH - beginY) * invDy;
			let t2 = (halfH - beginY) * invDy;
			if (t1 > t2) {
				let tmp = t1;
				t1 = t2;
				t2 = tmp;
			}
			if (t1 > 0) tminy = t1;
			if (t2 < 1) tmaxy = t2;
		}
		if (tminy >= 1 || tmaxy <= 0) return false;
		let tminxz = 0, tmaxxz = 0;
		p1y = beginY - halfH;
		const cos2 = cosTheta * cosTheta;
		const a = cos2 * (dx * dx + dy * dy + dz * dz) - dy * dy;
		const b = cos2 * (beginX * dx + p1y * dy + beginZ * dz) - p1y * dy;
		const c = cos2 * (beginX * beginX + p1y * p1y + beginZ * beginZ) - p1y * p1y;
		const D = b * b - a * c;
		if (a !== 0) {
			if (D < 0) return false;
			const sqrtD = Math.sqrt(D);
			if (a < 0) {
				if (dy > 0) {
					tminxz = 0;
					tmaxxz = (-b + sqrtD) / a;
					if (tmaxxz <= 0) return false;
				} else {
					tminxz = (-b - sqrtD) / a;
					tmaxxz = 1;
					if (tminxz >= 1) return false;
				}
			} else {
				tminxz = (-b - sqrtD) / a;
				tmaxxz = (-b + sqrtD) / a;
				if (tminxz >= 1 || tmaxxz <= 0) return false;
			}
		} else {
			const t = -c / (2 * b);
			if (b > 0) {
				tminxz = 0;
				tmaxxz = t;
				if (t <= 0) return false;
			} else {
				tminxz = t;
				tmaxxz = 1;
				if (t >= 1) return false;
			}
		}
		p1y += halfH;
		let min : number;
		const normal = hit.normal.elements, position = hit.position.elements;
		if (tmaxxz <= tminy || tmaxy <= tminxz) return false;
		if (tminxz < tminy) {
			min = tminy;
			if (min === 0) return false;
			normal[0] = 0; normal[1] = dy > 0 ? -1 : 1; normal[2] = 0;
		} else {
			min = tminxz;
			if (min === 0) return false;
			normal[0] = beginX + dx * min; normal[1] = 0; normal[2] = beginZ + dz * min;
			let invLen = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]);
			if (invLen > 0) invLen = 1 / invLen;
			normal[0] *= invLen; normal[1] *= invLen; normal[2] *= invLen;
			const s = cosTheta;
			normal[0] *= s; normal[1] *= s; normal[2] *= s;
			normal[1] += this.sinTheta;
		}
		position[0] = beginX + min * dx; position[1] = p1y + min * dy; position[2] = beginZ + min * dz;
		hit.fraction = min;
		return true;
	}
}