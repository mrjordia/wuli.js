import Vec3 from "./vec3";
import BroadPhaseProxyCallback from "../broad-phase/broad-phase-proxy-callback";
import RayCastHit from "../shape/ray-cast-hit";
import PhysicsProxy from "../broad-phase/physics-proxy";
import RayCastCallback from "./ray-cast-callback";

export default class RayCastWrapper extends BroadPhaseProxyCallback {
	public rayCastHit = new RayCastHit();
	public begin = new Vec3();
	public end = new Vec3();
	public callback?: RayCastCallback;

	public process(proxy: PhysicsProxy): void {
		const shape = proxy.userData!;
		if (shape.geometry.rayCast(this.begin, this.end, shape.transform, this.rayCastHit)) {
			this.callback!.process(shape, this.rayCastHit);
		}
	}
}