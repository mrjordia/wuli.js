import ConvexGeometry from "./convex-geometry";
import Vec3 from "../common/vec3";
import { GEOMETRY_TYPE } from "../constant";
import Aabb from "../common/aabb";
import Transform from "../common/transform";
import RayCastHit from "./ray-cast-hit";
import Method from "../common/method";

/**
 * elements:
 *      [
 *          _halfExtentsX,_halfExtentsY,_halfExtentsZ,               0
 *          _halfAxisXX,_halfAxisXY,_halfAxisXZ,                     3
 *          _halfAxisYX,_halfAxisYY,_halfAxisYZ,                     6
 *          _halfAxisZX,_halfAxisZY,_halfAxisZZ                      9
 *      ]
 */
export default class BoxGeometry extends ConvexGeometry {
	public size : Float64Array;

	constructor(width = 1, height = 1, depth = 1) {
		super(GEOMETRY_TYPE.BOX);
		let w = width * 0.5;
		let h = height * 0.5;
		let d = depth * 0.5;
		this.size = new Float64Array([w, h, d, w, 0, 0, 0, h, 0, 0, 0, d]);
		this.updateMass();
		let minHalfExtents = w < h ? d < w ? d : w : d < h ? d : h;
		if (this.gjkMargin > minHalfExtents * 0.2) {
			this.gjkMargin = minHalfExtents * 0.2;
		}
	}
	public get halfWidth() : number {
		return this.size[0];
	}
	public get halfHeight() : number {
		return this.size[1];
	}
	public get halfDepth() : number {
		return this.size[2];
	}

	public getHalfExtentsTo(halfExtents : { x : number, y : number, z : number }) : { x : number, y : number, z : number } {
		const es = this.size;
		Method.setXYZ(halfExtents, es[0], es[1], es[2]);
		return halfExtents;
	}

	public updateMass() : void {
		const es = this.size;
		this.volume = 8 * (es[0] * es[1] * es[2]);
		const sqX = es[0] * es[0];
		const sqY = es[1] * es[1];
		const sqZ = es[2] * es[2];
		const ic = this.inertiaCoeff;
		ic[0] = 0.33333333333333331 * (sqY + sqZ);
		ic[1] = 0;
		ic[2] = 0;
		ic[3] = 0;
		ic[4] = 0.33333333333333331 * (sqZ + sqX);
		ic[5] = 0;
		ic[6] = 0;
		ic[7] = 0;
		ic[8] = 0.33333333333333331 * (sqX + sqY);
	}
	public computeAabb(_aabb : Aabb, _tf : Transform) : void {
		const tf = _tf.elements, aabb = _aabb.elements, es = this.size;
		const xx = tf[3] * es[3] + tf[4] * es[4] + tf[5] * es[5];
		const xy = tf[6] * es[3] + tf[7] * es[4] + tf[8] * es[5];
		const xz = tf[9] * es[3] + tf[10] * es[4] + tf[11] * es[5];
		const yx = tf[3] * es[6] + tf[4] * es[7] + tf[5] * es[8];
		const yy = tf[6] * es[6] + tf[7] * es[7] + tf[8] * es[8];
		const yz = tf[9] * es[6] + tf[10] * es[7] + tf[11] * es[8];
		const zx = tf[3] * es[9] + tf[4] * es[10] + tf[5] * es[11];
		const zy = tf[6] * es[9] + tf[7] * es[10] + tf[8] * es[11];
		const zz = tf[9] * es[9] + tf[10] * es[10] + tf[11] * es[11];
		const tfxX = xx > 0 ? xx : -xx;
		const tfxY = xy > 0 ? xy : -xy;
		const tfxZ = xz > 0 ? xz : -xz;
		const tfyX = yx > 0 ? yx : -yx;
		const tfyY = yy > 0 ? yy : -yy;
		const tfyZ = yz > 0 ? yz : -yz;
		const tfzX = zx > 0 ? zx : -zx;
		const tfzY = zy > 0 ? zy : -zy;
		const tfzZ = zz > 0 ? zz : -zz;
		let tfsX = tfxX + tfyX, tfsY = tfxY + tfyY, tfsZ = tfxZ + tfyZ;
		tfsX += tfzX; tfsY += tfzY; tfsZ += tfzZ;
		aabb[0] = tf[0] - tfsX; aabb[1] = tf[1] - tfsY; aabb[2] = tf[2] - tfsZ;
		aabb[3] = tf[0] + tfsX; aabb[4] = tf[1] + tfsY; aabb[5] = tf[2] + tfsZ;
	}
	public computeLocalSupportingVertex(_dir : Vec3, _out : Vec3) : void {
		const dir = _dir.elements, out = _out.elements, es = this.size;
		let gjkMarginsX = this.gjkMargin, gjkMarginsY = this.gjkMargin, gjkMarginsZ = this.gjkMargin;
		if (!(gjkMarginsX < es[0])) gjkMarginsX = es[0];
		if (!(gjkMarginsY < es[1])) gjkMarginsY = es[1];
		if (!(gjkMarginsZ < es[2])) gjkMarginsZ = es[2];
		const coreExtentsX = es[0] - gjkMarginsX, coreExtentsY = es[1] - gjkMarginsY, coreExtentsZ = es[2] - gjkMarginsZ;
		out[0] = dir[0] > 0 ? coreExtentsX : -coreExtentsX;
		out[1] = dir[1] > 0 ? coreExtentsY : -coreExtentsY;
		out[2] = dir[2] > 0 ? coreExtentsZ : -coreExtentsZ;
	}
	public rayCastLocal(beginX : number, beginY : number, beginZ : number, endX : number, endY : number, endZ : number, hit : RayCastHit) : boolean {
		const es = this.size;
		const halfW = es[0], halfH = es[1], halfD = es[2];
		const dx = endX - beginX, dy = endY - beginY, dz = endZ - beginZ;
		let tminx = 0, tminy = 0, tminz = 0;
		let tmaxx = 1, tmaxy = 1, tmaxz = 1;
		if (dx > -1e-6 && dx < 1e-6) {
			if (beginX <= -halfW || beginX >= halfW) {
				return false;
			}
		} else {
			const invDx = 1 / dx;
			let t1 = (-halfW - beginX) * invDx;
			let t2 = (halfW - beginX) * invDx;
			if (t1 > t2) {
				const tmp = t1;
				t1 = t2;
				t2 = tmp;
			}
			if (t1 > 0) {
				tminx = t1;
			}
			if (t2 < 1) {
				tmaxx = t2;
			}
		}
		if (dy > -1e-6 && dy < 1e-6) {
			if (beginY <= -halfH || beginY >= halfH) {
				return false;
			}
		} else {
			const invDy = 1 / dy;
			let t1 = (-halfH - beginY) * invDy;
			let t2 = (halfH - beginY) * invDy;
			if (t1 > t2) {
				const tmp = t1;
				t1 = t2;
				t2 = tmp;
			}
			if (t1 > 0) {
				tminy = t1;
			}
			if (t2 < 1) {
				tmaxy = t2;
			}
		}
		if (dz > -1e-6 && dz < 1e-6) {
			if (beginZ <= -halfD || beginZ >= halfD) {
				return false;
			}
		} else {
			const invDz = 1 / dz;
			let t1 = (-halfD - beginZ) * invDz;
			let t2 = (halfD - beginZ) * invDz;
			if (t1 > t2) {
				const tmp = t1;
				t1 = t2;
				t2 = tmp;
			}
			if (t1 > 0) {
				tminz = t1;
			}
			if (t2 < 1) {
				tmaxz = t2;
			}
		}
		if (tminx >= 1 || tminy >= 1 || tminz >= 1 || tmaxx <= 0 || tmaxy <= 0 || tmaxz <= 0) {
			return false;
		}
		let min = tminx;
		let max = tmaxx;
		let hitDirection = 0;
		if (tminy > min) {
			min = tminy;
			hitDirection = 1;
		}
		if (tminz > min) {
			min = tminz;
			hitDirection = 2;
		}
		if (tmaxy < max) {
			max = tmaxy;
		}
		if (tmaxz < max) {
			max = tmaxz;
		}
		if (min > max) {
			return false;
		}
		if (min === 0) {
			return false;
		}
		const ne = hit.normal.elements;
		switch (hitDirection) {
			case 0:
				ne[0] = dx > 0 ? -1 : 1;
				ne[1] = ne[2] = 0;
				break;
			case 1:
				ne[1] = dy > 0 ? -1 : 1;
				ne[0] = ne[2] = 0;
				break;
			case 2:
				ne[2] = dz > 0 ? -1 : 1;
				ne[0] = ne[1] = 0;
				break;
		}
		const pe = hit.position.elements;
		pe[0] = beginX + min * dx; pe[1] = beginY + min * dy; pe[2] = beginZ + min * dz;
		hit.fraction = min;
		return true;
	}
}