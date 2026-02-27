import Mat3 from "../common/mat3";
import { RIGID_BODY_TYPE } from "../constant";
import Vec3 from "../common/vec3";
import Method from "../common/method";


interface IRigidBodyConfigOptions {
	position?: { x: number, y: number, z: number };
	rotation?: { x: number, y: number, z: number, w: number };
	linearVelocity?: { x: number, y: number, z: number };
	angularVelocity?: { x: number, y: number, z: number };
	type?: RIGID_BODY_TYPE;
	autoSleep?: boolean;
	linearDamping?: number;
	angularDamping?: number;
	name?: string;
}

export default class RigidBodyConfig {

	public position: Vec3;
	public rotation: Mat3;
	public linearVelocity: Vec3;
	public angularVelocity: Vec3;
	public type: RIGID_BODY_TYPE;
	public autoSleep: boolean;
	public linearDamping: number;
	public angularDamping: number;
	public name: string;

	constructor(optional: IRigidBodyConfigOptions = {}) {
		this.position = optional.position ? new Vec3(optional.position.x, optional.position.y, optional.position.z) : new Vec3();
		this.rotation = new Mat3();
		if (optional.rotation) {
			Method.quatToMat3(optional.rotation.x, optional.rotation.y, optional.rotation.z, optional.rotation.w, this.rotation.elements);
		}
		this.linearVelocity = optional.linearVelocity ? new Vec3(optional.linearVelocity.x, optional.linearVelocity.y, optional.linearVelocity.z) : new Vec3();
		this.angularVelocity = optional.angularVelocity ? new Vec3(optional.angularVelocity.x, optional.angularVelocity.y, optional.angularVelocity.z) : new Vec3();
		this.type = optional.type || RIGID_BODY_TYPE.DYNAMIC;
		this.autoSleep = optional.autoSleep !== undefined ? optional.autoSleep : true;
		this.linearDamping = optional.linearDamping || 0;
		this.angularDamping = optional.angularDamping || 0;
		this.name = optional.name || '';
	}
}

export type { IRigidBodyConfigOptions };
export { RigidBodyConfig };