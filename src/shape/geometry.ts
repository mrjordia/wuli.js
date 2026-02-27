import Aabb from "../common/aabb";
import Transform from "../common/transform";
import Vec3 from "../common/vec3";
import { GEOMETRY_TYPE } from "../constant";
import RayCastHit from "./ray-cast-hit";

/**
 * inertiaCoeff:
 *      [
 *          _inertiaCoeff00,_inertiaCoeff01,_inertiaCoeff02,                0
 *          _inertiaCoeff10,_inertiaCoeff11,_inertiaCoeff12,                3
 *          _inertiaCoeff20,_inertiaCoeff21,_inertiaCoeff22,                6
 *      ]
 */
export default abstract class Geometry {
	public readonly type: GEOMETRY_TYPE;
	public volume = 0;
	public inertiaCoeff = new Float64Array(9);
	public aabbComputed = new Aabb();

	constructor(type: GEOMETRY_TYPE) {
		this.type = type;
	}

	public abstract updateMass(): void;
	public abstract computeAabb(aabb: Aabb, tf: Transform): void;
	public rayCastLocal(beginX: number, beginY: number, beginZ: number, endX: number, endY: number, endZ: number, hit: RayCastHit): boolean {
		return false;
	}

	public rayCast(_begin: Vec3, _end: Vec3, _transform: Transform, hit: RayCastHit): boolean {
		const begin = _begin.elements;
		const end = _end.elements;
		const tf = _transform.elements;
		const hitPos = hit.position.elements;
		const hitNormal = hit.normal.elements;

		const tf0 = tf[0], tf1 = tf[1], tf2 = tf[2];
		const tf3 = tf[3], tf4 = tf[4], tf5 = tf[5];
		const tf6 = tf[6], tf7 = tf[7], tf8 = tf[8];
		const tf9 = tf[9], tf10 = tf[10], tf11 = tf[11];

		const bx = begin[0] - tf0, by = begin[1] - tf1, bz = begin[2] - tf2;
		const ex = end[0] - tf0, ey = end[1] - tf1, ez = end[2] - tf2;

		const blx = tf3 * bx + tf6 * by + tf9 * bz;
		const bly = tf4 * bx + tf7 * by + tf10 * bz;
		const blz = tf5 * bx + tf8 * by + tf11 * bz;
		const elx = tf3 * ex + tf6 * ey + tf9 * ez;
		const ely = tf4 * ex + tf7 * ey + tf10 * ez;
		const elz = tf5 * ex + tf8 * ey + tf11 * ez;

		if (!this.rayCastLocal(blx, bly, blz, elx, ely, elz, hit)) {
			return false;
		}

		const lpx = hitPos[0], lpy = hitPos[1], lpz = hitPos[2];
		const lnx = hitNormal[0], lny = hitNormal[1], lnz = hitNormal[2];

		hitPos[0] = tf3 * lpx + tf4 * lpy + tf5 * lpz + tf0;
		hitPos[1] = tf6 * lpx + tf7 * lpy + tf8 * lpz + tf1;
		hitPos[2] = tf9 * lpx + tf10 * lpy + tf11 * lpz + tf2;

		hitNormal[0] = tf3 * lnx + tf4 * lny + tf5 * lnz;
		hitNormal[1] = tf6 * lnx + tf7 * lny + tf8 * lnz;
		hitNormal[2] = tf9 * lnx + tf10 * lny + tf11 * lnz;

		return true;
	}

}