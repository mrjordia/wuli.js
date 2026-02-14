import ConvexGeometry from "./convex-geometry";
import Vec3 from "../common/vec3";
import { GEOMETRY_TYPE } from "../constant";
import Aabb from "../common/aabb";
import Transform from "../common/transform";

export default class AabbGeometry extends ConvexGeometry {
	public min = new Vec3();
	public max = new Vec3();
	constructor() {
		super(GEOMETRY_TYPE.NULL);
	}
	public computeLocalSupportingVertex(dir : Vec3, out : Vec3) : void {
		const oe = out.elements, de = dir.elements, ae = this.max.elements, ie = this.min.elements;
		oe[0] = de[0] > 0 ? ae[0] : ie[0];
		oe[1] = de[1] > 0 ? ae[1] : ie[1];
		oe[2] = de[2] > 0 ? ae[2] : ie[2];
	}

	public computeAabb(aabb : Aabb, tf : Transform) : void {
	}
	public updateMass() : void {
	}
}