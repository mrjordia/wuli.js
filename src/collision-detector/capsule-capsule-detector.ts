import Transform from "../common/transform";
import CapsuleGeometry from "../shape/capsule-geometry";
import CachedDetectorData from "./cached-detector-data";
import Detector from "./detector";
import DetectorResult from "./detector-result";

export default class CapsuleCapsuleDetector extends Detector<CapsuleGeometry, CapsuleGeometry>{
	constructor() {
		super(false);
	}
	protected detectImpl(result : DetectorResult, geom1 : CapsuleGeometry, geom2 : CapsuleGeometry, _tf1 : Transform, _tf2 : Transform, cachedData : CachedDetectorData) : void {
		const tf1 = _tf1.elements, tf2 = _tf2.elements;
		const c1 = geom1, c2 = geom2;
		result.incremental = false;
		const axis1X = tf1[4], axis1Y = tf1[7], axis1Z = tf1[10];
		const axis2X = tf2[4], axis2Y = tf2[7], axis2Z = tf2[10];
		const hh1 = c1.halfHeight, hh2 = c2.halfHeight;
		const r1 = c1.radius, r2 = c2.radius;
		const p1X = tf1[0] + axis1X * -hh1, p1Y = tf1[1] + axis1Y * -hh1, p1Z = tf1[2] + axis1Z * -hh1;
		const q1X = tf1[0] + axis1X * hh1, q1Y = tf1[1] + axis1Y * hh1, q1Z = tf1[2] + axis1Z * hh1;
		const p2X = tf2[0] + axis2X * -hh2, p2Y = tf2[1] + axis2Y * -hh2, p2Z = tf2[2] + axis2Z * -hh2;
		const q2X = tf2[0] + axis2X * hh2, q2Y = tf2[1] + axis2Y * hh2, q2Z = tf2[2] + axis2Z * hh2;
		const p12X = p1X - p2X, p12Y = p1Y - p2Y, p12Z = p1Z - p2Z;
		const d1X = q1X - p1X, d1Y = q1Y - p1Y, d1Z = q1Z - p1Z;
		const d2X = q2X - p2X, d2Y = q2Y - p2Y, d2Z = q2Z - p2Z;
		const p21d1 = -(p12X * d1X + p12Y * d1Y + p12Z * d1Z);
		const p12d2 = p12X * d2X + p12Y * d2Y + p12Z * d2Z;
		const d11 = hh1 * hh1 * 4;
		const d12 = d1X * d2X + d1Y * d2Y + d1Z * d2Z;
		const d22 = hh2 * hh2 * 4;
		let t1 : number, t2 : number;
		if (d11 === 0 && d22 === 0) {
			t1 = t2 = 0;
		} else if (d11 === 0) {
			t1 = 0;
			if (p12d2 < 0) {
				t2 = 0;
			} else if (p12d2 > d22) {
				t2 = 1;
			} else {
				t2 = p12d2 / d22;
			}
		} else if (d22 === 0) {
			t2 = 0;
			if (p21d1 < 0) {
				t1 = 0;
			} else if (p21d1 > d11) {
				t1 = 1;
			} else {
				t1 = p21d1 / d11;
			}
		} else {
			const det = d11 * d22 - d12 * d12;
			if (det === 0) {
				t1 = 0;
			} else {
				t1 = d12 * p12d2 + d22 * p21d1;
				if (t1 < 0) {
					t1 = 0;
				} else if (t1 > det) {
					t1 = 1;
				} else {
					t1 /= det;
				}
			}
			t2 = t1 * d12 + p12d2;
			if (t2 < 0) {
				t2 = 0;
				if (p21d1 < 0) {
					t1 = 0;
				} else if (p21d1 > d11) {
					t1 = 1;
				} else {
					t1 = p21d1 / d11;
				}
			} else if (t2 > d22) {
				t2 = 1;
				t1 = d12 + p21d1;
				if (t1 < 0) {
					t1 = 0;
				} else if (t1 > d11) {
					t1 = 1;
				} else {
					t1 /= d11;
				}
			} else {
				t2 /= d22;
			}
		}
		const cp1X = p1X + d1X * t1, cp1Y = p1Y + d1Y * t1, cp1Z = p1Z + d1Z * t1;
		const cp2X = p2X + d2X * t2, cp2Y = p2Y + d2Y * t2, cp2Z = p2Z + d2Z * t2;
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