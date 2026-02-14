import { Nullable } from "../common/nullable";
import PhysicsProxy from "./physics-proxy";


export default class ProxyPair {
	public proxy1: Nullable<PhysicsProxy>;
	public proxy2: Nullable<PhysicsProxy>;
	public next: Nullable<ProxyPair>;
}