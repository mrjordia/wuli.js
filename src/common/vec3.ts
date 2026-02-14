import { CONSTANT } from "../constant";


export default class Vec3 {
	public elements = new Float64Array(3);
	constructor(x = 0, y = 0, z = 0) {
		this.elements[0] = x;
		this.elements[1] = y;
		this.elements[2] = z;
		CONSTANT.VEC3_NUM_CREATIONS++;
	}

	public get x() : number {
		return this.elements[0];
	}
	public set x(num : number) {
		this.elements[0] = num;
	}
	public get y() : number {
		return this.elements[1];
	}
	public set y(num : number) {
		this.elements[1] = num;
	}
	public get z() : number {
		return this.elements[2];
	}
	public set z(num : number) {
		this.elements[2] = num;
	}
}