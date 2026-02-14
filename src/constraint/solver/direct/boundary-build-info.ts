export default class BoundaryBuildInfo {
	public size : number;
	public numBounded = 0;
	public iBounded : Int8Array;
	public signs : Int8Array;
	public numUnbounded = 0;
	public iUnbounded : Int8Array;

	constructor(size : number) {
		this.size = size;
		this.iBounded = new Int8Array(size);
		this.signs = new Int8Array(size);
		this.iUnbounded = new Int8Array(size);
	}
}