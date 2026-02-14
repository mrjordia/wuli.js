import Transform from "../common/transform";
import CapsuleGeometry from "../shape/capsule-geometry";
import SphereGeometry from "../shape/sphere-geometry";
import CachedDetectorData from "./cached-detector-data";
import Detector from "./detector";
import DetectorResult from "./detector-result";

export default class SphereCapsuleDetector extends Detector<SphereGeometry, CapsuleGeometry>{
	constructor(swapped : boolean) {
		super(swapped);
	}
	protected detectImpl(result : DetectorResult, geom1 : SphereGeometry, geom2 : CapsuleGeometry, _tf1 : Transform, _tf2 : Transform, cachedData : CachedDetectorData) : void {
		const tf1 = _tf1.elements, tf2 = _tf2.elements;
		result.incremental = false;
		const hh2 = geom2.halfHeight;
		const r1 = geom1.radius, r2 = geom2.radius;
		const axis2X = tf2[4], axis2Y = tf2[7], axis2Z = tf2[10];
		const cp1X = tf1[0], cp1Y = tf1[1], cp1Z = tf1[2];
		const p2X = tf2[0] + axis2X * -hh2, p2Y = tf2[1] + axis2Y * -hh2, p2Z = tf2[2] + axis2Z * -hh2;
		const q2X = tf2[0] + axis2X * hh2, q2Y = tf2[1] + axis2Y * hh2, q2Z = tf2[2] + axis2Z * hh2;
		const p12X = cp1X - p2X, p12Y = cp1Y - p2Y, p12Z = cp1Z - p2Z;
		const d2X = q2X - p2X, d2Y = q2Y - p2Y, d2Z = q2Z - p2Z;
		const d22 = hh2 * hh2 * 4;
		let t = p12X * d2X + p12Y * d2Y + p12Z * d2Z;
		if (t < 0) {
			t = 0;
		} else if (t > d22) {
			t = 1;
		} else {
			t /= d22;
		}
		const cp2X = p2X + d2X * t, cp2Y = p2Y + d2Y * t, cp2Z = p2Z + d2Z * t;
		const dX = cp1X - cp2X, dY = cp1Y - cp2Y, dZ = cp1Z - cp2Z;
		const len2 = dX * dX + dY * dY + dZ * dZ;
		if (len2 >= (r1 + r2) * (r1 + r2)) {
			return;
		}
		const len = Math.sqrt(len2);
		let nX : number, nY : number, nZ : number;
		if (len > 0) {
			nX = dX * (1 / len); nY = dY * (1 / len); nZ = dZ * (1 / len);
		} else {
			nX = 1; nY = 0; nZ = 0;
		}
		this.setNormal(result, nX, nY, nZ);
		const pos1X = cp1X + nX * -r1, pos1Y = cp1Y + nY * -r1, pos1Z = cp1Z + nZ * -r1;
		const pos2X = cp2X + nX * r2, pos2Y = cp2Y + nY * r2, pos2Z = cp2Z + nZ * r2;
		this.addPoint(result, pos1X, pos1Y, pos1Z, pos2X, pos2Y, pos2Z, r1 + r2 - len, 0);
	}
}