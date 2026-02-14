import Vec3 from "../common/vec3";

export default class RayCastHit {
	public position = new Vec3();
	public normal = new Vec3();
	public fraction = 0;
}