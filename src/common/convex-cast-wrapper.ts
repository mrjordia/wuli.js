import Vec3 from "./vec3";
import Transform from "./transform";
import BroadPhaseProxyCallback from "../broad-phase/broad-phase-proxy-callback";
import RayCastHit from "../shape/ray-cast-hit";
import GjkEpa from "../collision-detector/gjk-epa-detector/gjk-epa";
import { GEOMETRY_TYPE } from '../constant';
import PhysicsProxy from "../broad-phase/physics-proxy";
import ConvexGeometry from "../shape/convex-geometry";
import RayCastCallback from "./ray-cast-callback";

export default class ConvexCastWrapper extends BroadPhaseProxyCallback {
	public rayCastHit = new RayCastHit();
	public begin = new Transform();
	public translation = new Vec3();
	public zero = new Vec3();
	public callback?: RayCastCallback;
	public convex?: ConvexGeometry;

	public process(proxy: PhysicsProxy): void {
		const shape = proxy.userData!;
		const type = shape.geometry.type;
		if (type < GEOMETRY_TYPE.SPHERE || type > GEOMETRY_TYPE.CONVEX_HULL) {
			return;
		}
		if (GjkEpa.instance.convexCast(this.convex!, shape.geometry as ConvexGeometry, this.begin, shape.transform, this.translation, this.zero, this.rayCastHit)) {
			this.callback!.process(shape, this.rayCastHit);
		}
	}
}