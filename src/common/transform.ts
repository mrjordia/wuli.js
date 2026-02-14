export default class Transform {
	public elements = new Float64Array(12);
	constructor() {
		this.elements[0] = 0;
		this.elements[1] = 0;
		this.elements[2] = 0;
		this.elements[3] = 1;
		this.elements[4] = 0;
		this.elements[5] = 0;
		this.elements[6] = 0;
		this.elements[7] = 1;
		this.elements[8] = 0;
		this.elements[9] = 0;
		this.elements[10] = 0;
		this.elements[11] = 1;
	}

}