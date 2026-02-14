/**
 * elements:
 *     [lin1x,lin1y,lin1z,        0
 *      lin2x,lin2y,lin2z,        3
 *      ang1x,ang1y,ang1z,        6
 *      ang2x,ang2y,ang2z,        9
 *      flag];                    12
 */
export default class JacobianRow {
	public elements = new Float64Array(13);

	public get flag() : number {
		return this.elements[12];
	}
	public set flag(n : number) {
		this.elements[12] = n;
	}

	public updateSparsity() : void {
		const e = this.elements;
		e[12] = 0;
		if (!(e[0] === 0 && e[1] === 0 && e[2] === 0) || !(e[3] === 0 && e[4] === 0 && e[5] === 0)) {
			e[12] |= 1;
		}
		if (!(e[6] === 0 && e[7] === 0 && e[8] === 0) || !(e[9] === 0 && e[10] === 0 && e[11] === 0)) {
			e[12] |= 2;
		}
	}
}