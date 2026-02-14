import ConvexGeometry from "./convex-geometry";
import { GEOMETRY_TYPE } from '../constant';
import Aabb from "../common/aabb";
import Transform from "../common/transform";
import Vec3 from "../common/vec3";
import RayCastHit from "./ray-cast-hit";

export default class SphereGeometry extends ConvexGeometry {

	public radius: number;

	constructor(radius: number) {
		super(GEOMETRY_TYPE.SPHERE);
		this.radius = radius;
		this.gjkMargin = this.radius;
		this.updateMass();
	}

	public updateMass(): void {
		const rsq = this.radius * this.radius;
		this.volume = 4.1887902047863861 * rsq * this.radius;
		const prs = 0.4 * rsq;
		const icf = this.inertiaCoeff;
		icf[0] = prs;
		icf[1] = 0;
		icf[2] = 0;
		icf[3] = 0;
		icf[4] = prs;
		icf[5] = 0;
		icf[6] = 0;
		icf[7] = 0;
		icf[8] = prs;
	}
	public computeAabb(_aabb: Aabb, _tf: Transform): void {
		const aabb = _aabb.elements, tf = _tf.elements;
		const r = this.radius;
		aabb[0] = tf[0] - r; aabb[1] = tf[1] - r; aabb[2] = tf[2] - r;
		aabb[3] = tf[0] + r; aabb[4] = tf[1] + r; aabb[5] = tf[2] + r;
	}
	public computeLocalSupportingVertex(dir: Vec3, out: Vec3): void {
		let es = out.elements;
		es[0] = es[1] = es[2] = 0;
	}
	public rayCastLocal(beginX: number, beginY: number, beginZ: number, endX: number, endY: number, endZ: number, hit: RayCastHit): boolean {
		const dX = endX - beginX, dY = endY - beginY, dZ = endZ - beginZ;
		const a = dX * dX + dY * dY + dZ * dZ;
		const b = beginX * dX + beginY * dY + beginZ * dZ;
		const D = b * b - a * (beginX * beginX + beginY * beginY + beginZ * beginZ - this.radius * this.radius);
		if (D < 0) {
			return false;
		}
		const t = (-b - Math.sqrt(D)) / a;
		if (t < 0 || t > 1) {
			return false;
		}
		const hitPosX = beginX + dX * t, hitPosY = beginY + dY * t, hitPosZ = beginZ + dZ * t;
		let l = hitPosX * hitPosX + hitPosY * hitPosY + hitPosZ * hitPosZ;
		if (l > 0) {
			l = 1 / Math.sqrt(l);
		}
		const hitNormalX = hitPosX * l, hitNormalY = hitPosY * l, hitNormalZ = hitPosZ * l;
		const v = hit.position.elements;
		v[0] = hitPosX; v[1] = hitPosY; v[2] = hitPosZ;
		const v1 = hit.normal.elements;
		v1[0] = hitNormalX; v1[1] = hitNormalY; v1[2] = hitNormalZ;
		hit.fraction = t;
		return true;
	}
}