import Aabb from "./aabb";
import BroadPhaseProxyCallback from "../broad-phase/broad-phase-proxy-callback";
import PhysicsProxy from "../broad-phase/physics-proxy";
import AabbTestCallback from "./aabb-test-callback";


export default class AabbTestWrapper extends BroadPhaseProxyCallback {
	public aabb = new Aabb();
	public callback?: AabbTestCallback;

	public process(proxy: PhysicsProxy): void {
		const shape = proxy.userData!;
		const se = shape.aabb.elements, ae = this.aabb.elements;
		if (se[0] < ae[3] && se[3] > ae[0] && se[1] < ae[4] && se[4] > ae[1] && se[2] < ae[5] && se[5] > ae[2]) {
			this.callback!.process(shape);
		}
	}
}