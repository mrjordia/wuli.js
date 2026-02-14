import Detector from "../detector";
import GjkEpa from "./gjk-epa";
import { CONSTANT, GJK_EPA_RESULT_STATE } from "../../constant";
import ConvexGeometry from "../../shape/convex-geometry";
import DetectorResult from "../detector-result";
import Transform from "../../common/transform";
import CachedDetectorData from "../cached-detector-data";

export default class GjkEpaDetector extends Detector<ConvexGeometry, ConvexGeometry>{
	constructor() {
		super(false);
	}

	protected detectImpl(result : DetectorResult, geom1 : ConvexGeometry, geom2 : ConvexGeometry, tf1 : Transform, tf2 : Transform, cachedData : CachedDetectorData) : void {
		const gjkEpa = GjkEpa.instance;
		const g1 = geom1;
		const g2 = geom2;
		const status = gjkEpa.computeClosestPointsImpl(g1, g2, tf1, tf2, CONSTANT.SETTING_ENABLE_GJK_CACHING ? cachedData : null, true);
		result.incremental = true;
		if (status !== GJK_EPA_RESULT_STATE.SUCCEEDED) {
			console.log("GjkEpaDetector:", "GJK/EPA failed: status=" + status);
			return;
		}
		if (gjkEpa.distance > g1.gjkMargin + g2.gjkMargin) {
			return;
		}
		const v = gjkEpa.closestPoint1.elements;
		let pos1X = v[0], pos1Y = v[1], pos1Z = v[2];
		const v1 = gjkEpa.closestPoint2.elements;
		let pos2X = v1[0], pos2Y = v1[1], pos2Z = v1[2];
		let normalX = pos1X - pos2X, normalY = pos1Y - pos2Y, normalZ = pos1Z - pos2Z;
		if (normalX * normalX + normalY * normalY + normalZ * normalZ === 0) {
			return;
		}
		if (gjkEpa.distance < 0) {
			normalX = -normalX; normalY = -normalY; normalZ = -normalZ;
		}
		let l = normalX * normalX + normalY * normalY + normalZ * normalZ;
		if (l > 0) {
			l = 1 / Math.sqrt(l);
		}
		normalX *= l; normalY *= l; normalZ *= l;
		this.setNormal(result, normalX, normalY, normalZ);
		pos1X += normalX * -g1.gjkMargin; pos1Y += normalY * -g1.gjkMargin; pos1Z += normalZ * -g1.gjkMargin;
		pos2X += normalX * g2.gjkMargin; pos2Y += normalY * g2.gjkMargin; pos2Z += normalZ * g2.gjkMargin;
		this.addPoint(result, pos1X, pos1Y, pos1Z, pos2X, pos2Y, pos2Z, g1.gjkMargin + g2.gjkMargin - gjkEpa.distance, 0);
	}
}