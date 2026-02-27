import { CONSTANT, GEOMETRY_TYPE } from "../constant";
import Mat3 from "../common/mat3";
import Geometry from "./geometry";
import Vec3 from "../common/vec3";
import ContactCallback from "../common/contact-callback";
import { Nullable } from "../common/nullable";
import Method from "../common/method";

interface IShapeConfigOptions {
	position?: { x: number, y: number, z: number };
	rotation?: { x: number, y: number, z: number, w: number };
	friction?: number;
	restitution?: number;
	density?: number;
	collisionGroup?: number;
	collisionMask?: number;
	geometry: Geometry;
	contactCallback?: ContactCallback;
}

export default class ShapeConfig {

	public position: Vec3;
	public rotation: Mat3;
	public friction: number;
	public restitution: number;
	public density: number;
	public collisionGroup: number;
	public collisionMask: number;
	public geometry: Geometry;
	public contactCallback: Nullable<ContactCallback>;
	constructor(optional: IShapeConfigOptions) {
		this.geometry = optional.geometry;
		this.position = new Vec3();
		this.rotation = new Mat3();
		if (this.geometry.type !== GEOMETRY_TYPE.TERRAIN) {
			if (optional.position) {
				Method.setXYZ(this.position, optional.position.x, optional.position.y, optional.position.z);
			}
			if (optional.rotation) {
				Method.quatToMat3(optional.rotation.x, optional.rotation.y, optional.rotation.z, optional.rotation.w, this.rotation.elements);
			}
		}
		this.friction = optional.friction || CONSTANT.SETTING_DEFAULT_FRICTION;
		this.restitution = optional.restitution || CONSTANT.SETTING_DEFAULT_RESTITUTION;
		this.density = optional.density || CONSTANT.SETTING_DEFAULT_DENSITY;
		this.collisionGroup = optional.collisionGroup || CONSTANT.SETTING_DEFAULT_COLLISION_GROUP;
		this.collisionMask = optional.collisionMask || CONSTANT.SETTING_DEFAULT_COLLISION_MASK;
		this.contactCallback = optional.contactCallback;
	}
}


export type { IShapeConfigOptions };
export { ShapeConfig };