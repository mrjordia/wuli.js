import Geometry from "./geometry";
import { CONSTANT, GEOMETRY_TYPE } from "../constant";
import GjkEpa from "../collision-detector/gjk-epa-detector/gjk-epa";
import Vec3 from "../common/vec3";
import RayCastHit from "./ray-cast-hit";
import Transform from "../common/transform";

export default abstract class ConvexGeometry extends Geometry {
	public gjkMargin : number;
	
	protected _useGjkRayCast = false;

	constructor(type : GEOMETRY_TYPE) {
		super(type);
		this.gjkMargin = CONSTANT.SETTING_DEFAULT_GJK_MARGIN;
	}

	public abstract computeLocalSupportingVertex(dir : Vec3, out : Vec3) : void;

	public rayCast(begin : Vec3, end : Vec3, transform : Transform, hit : RayCastHit) : boolean {
		if (this._useGjkRayCast) {
			return GjkEpa.instance.rayCast(this, transform, begin, end, hit);
		} else {
			return super.rayCast(begin, end, transform, hit);
		}
	}
}