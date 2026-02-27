import Vec3 from "./vec3";
import Method from "./method";

/**
 * elements:
 *      [
 *          minX,minY,minZ,         0
 *          maxX,maxY,maxZ          3
 *      ]
 */
export default class Aabb {
	public elements = new Float64Array(6);
	constructor(ix?: number, iy?: number, iz?: number, ax?: number, ay?: number, az?: number) {
		this.elements[0] = ix || 0;
		this.elements[1] = iy || 0;
		this.elements[2] = iz || 0;
		this.elements[3] = ax || 0;
		this.elements[4] = ay || 0;
		this.elements[5] = az || 0;
	}

	public init(min: Vec3, max: Vec3): Aabb {
		const _this = this.elements, i = min.elements, a = max.elements;
		_this[0] = i[0]; _this[1] = i[1]; _this[2] = i[2];
		_this[3] = a[0]; _this[4] = a[1]; _this[5] = a[2];
		return this;
	}

	public copyFrom(_aabb: Aabb): Aabb {
		const _this = this.elements, aabb = _aabb.elements;
		Method.copyElements(aabb, _this);
		return this;
	}
	public clone(): Float64Array {
		const _aabb = new Aabb();
		const _this = this.elements, aabb = _aabb.elements;
		Method.copyElements(_this, aabb);
		return aabb;
	}
}