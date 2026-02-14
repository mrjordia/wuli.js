import RayCastHit from "../shape/ray-cast-hit";
import Shape from "../shape/shape";
import { Nullable } from "./nullable";
import RayCastCallback from "./ray-cast-callback";
import Vec3 from "./vec3";

export default class RayCastClosest extends RayCastCallback {
	public position = new Vec3(0, 0, 0);
	public normal = new Vec3(0, 0, 0);
	public shape: Nullable<Shape>;
	public fraction = 1;
	public hit = false;

	public clear(): void {
		this.shape = null;
		this.fraction = 1;
		let es = this.position.elements;
		es[0] = es[1] = es[2] = 0;
		es = this.normal.elements;
		es[0] = es[1] = es[2] = 0;
		this.hit = false;
	}
	public process(shape: Shape, hit: RayCastHit): void {
		if (hit.fraction < this.fraction) {
			this.shape = shape;
			this.hit = true;
			this.fraction = hit.fraction;
			let _this = this.position.elements;
			let v = hit.position.elements;
			_this[0] = v[0]; _this[1] = v[1]; _this[2] = v[2];
			_this = this.normal.elements;
			v = hit.normal.elements;
			_this[0] = v[0]; _this[1] = v[1]; _this[2] = v[2];
		}
	}
}