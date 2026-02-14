import Vec3 from "../../common/vec3";
import Method from "../../common/method";

export default class GjkCache {
	public prevClosestDir = new Vec3();

	public clear() : void {
		Method.fillValue(this.prevClosestDir.elements, 0, 2, 0);
	}
}