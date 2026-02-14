import { CONSTANT } from "../constant";


export default class Quat {
	public elements = new Float64Array(4);
	constructor(x = 0, y = 0, z = 0, w = 1) {
		this.elements[0] = x;
		this.elements[1] = y;
		this.elements[2] = z;
		this.elements[3] = w;
		CONSTANT.QUAT_NUM_CREATIONS++;
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
	public get w() : number {
		return this.elements[3];
	}
	public set w(num : number) {
		this.elements[3] = num;
	}

	public init(x : number, y : number, z : number, w : number) : Quat {
		const es = this.elements;
		es[0] = x;
		es[1] = y;
		es[2] = z;
		es[3] = w;
		return this;
	}

}