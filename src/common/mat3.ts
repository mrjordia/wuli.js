import { CONSTANT } from "../constant";

export default class Mat3 {
	public elements = new Float64Array(9);
	constructor(e00 = 1, e01 = 0, e02 = 0, e10 = 0, e11 = 1, e12 = 0, e20 = 0, e21 = 0, e22 = 1) {
		const es = this.elements;
		es[0] = e00;
		es[1] = e01;
		es[2] = e02;
		es[3] = e10;
		es[4] = e11;
		es[5] = e12;
		es[6] = e20;
		es[7] = e21;
		es[8] = e22;
		CONSTANT.MAT3_NUM_CREATIONS++;
	}

	public init(e00 : number, e01 : number, e02 : number, e10 : number, e11 : number, e12 : number, e20 : number, e21 : number, e22 : number) : Mat3 {
		const es = this.elements;
		es[0] = e00; es[1] = e01; es[2] = e02;
		es[3] = e10; es[4] = e11; es[5] = e12;
		es[6] = e20; es[7] = e21; es[8] = e22;
		return this;
	}

}