import PhysicsProxy from "./physics-proxy";


export default abstract class BroadPhaseProxyCallback {

	public abstract process(proxy : PhysicsProxy) : void;

}