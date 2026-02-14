export default class BoundarySelector {
	public n : number;
	public indices : Int8Array;
	public tmpIndices : Int8Array;
	constructor(n : number) {
		this.n = n;
		this.indices = new Int8Array(n);
		this.tmpIndices = new Int8Array(n);
		let _g = 0;
		while (_g < n) {
			let i = _g++;
			this.indices[i] = i;
		}
	}
	public getIndex(i : number) : number {
		return this.indices[i];
	}
	public select(index : number) : void {
		let i = 0;
		while (this.indices[i] !== index) ++i;
		while (i > 0) {
			const tmp = this.indices[i];
			this.indices[i] = this.indices[i - 1];
			this.indices[i - 1] = tmp;
			--i;
		}
	}
	public setSize(size : number) : void {
		const indices = this.indices, tmpIndices = this.tmpIndices;
		let numSmaller = 0, numGreater = 0;
		let _g = 0;
		let _g1 = this.n;
		while (_g < _g1) {
			const idx = indices[_g++];
			if (idx < size) {
				tmpIndices[numSmaller] = idx;
				++numSmaller;
			} else {
				tmpIndices[size + numGreater] = idx;
				++numGreater;
			}
		}
		this.indices = tmpIndices;
		this.tmpIndices = indices;
	}
}