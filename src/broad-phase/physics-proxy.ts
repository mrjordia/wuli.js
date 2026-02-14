import { Nullable } from "../common/nullable";
import Shape from "../shape/shape";

/**
 * size:
 *      [
 *          aabbMinX,aabbMinY,aabbMinZ,          0
 *          aabbMaxX,aabbMaxY,aabbMaxZ           3
 *      ]
 */
export default class PhysicsProxy {
	public userData: Nullable<Shape>;
	public size = new Float64Array(6);
	public id: number;
	public prev: Nullable<PhysicsProxy>;
	public next: Nullable<PhysicsProxy>;

	constructor(userData: Shape, id: number) {
		this.userData = userData;
		this.id = id;
	}
}