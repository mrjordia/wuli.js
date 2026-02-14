import Transform from "../common/transform";
import SphereGeometry from "../shape/sphere-geometry";
import CachedDetectorData from "./cached-detector-data";
import Detector from "./detector";
import DetectorResult from "./detector-result";

export default class SphereSphereDetector extends Detector<SphereGeometry, SphereGeometry>{
	constructor() {
		super(false);
	}
	protected detectImpl(result : DetectorResult, geom1 : SphereGeometry, geom2 : SphereGeometry, _tf1 : Transform, _tf2 : Transform, cachedData : CachedDetectorData) : void {
		const tf1 = _tf1.elements, tf2 = _tf2.elements;
		result.incremental = false;
		const dX = tf1[0] - tf2[0], dY = tf1[1] - tf2[1], dZ = tf1[2] - tf2[2];
		const r1 = geom1.radius, r2 = geom2.radius;
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
		const pos1X = tf1[0] + nX * -r1, pos1Y = tf1[1] + nY * -r1, pos1Z = tf1[2] + nZ * -r1;
		const pos2X = tf2[0] + nX * r2, pos2Y = tf2[1] + nY * r2, pos2Z = tf2[2] + nZ * r2;
		this.addPoint(result, pos1X, pos1Y, pos1Z, pos2X, pos2Y, pos2Z, r1 + r2 - len, 0);
	}
}