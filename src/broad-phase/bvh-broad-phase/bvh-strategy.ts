import Method from "../../common/method";
import BvhNode from "./bvh-node";


export default class BvhStrategy {
	private _insertionStrategy = 0;
	private _tv0 = new Float64Array(3);
	private _tv1 = new Float64Array(3);
	private _tv2 = new Float64Array(3);
	private _tb0 = new Float64Array(6);

	public balancingEnabled = false;

	public decideInsertion(currentNode: BvhNode, leaf: BvhNode): -1 | 0 | 1 {
		const le = leaf.size;
		switch (this._insertionStrategy) {
			case 0:
				const center = Method.addArray(le, le, this._tv0, 0, 3, 0, 3);
				const c1 = currentNode.children[0]!.size, c2 = currentNode.children[1]!.size;
				const diff1 = Method.addArray(c1, c1, this._tv1, 0, 3, 0, 3);
				const diff2 = Method.addArray(c2, c2, this._tv2, 0, 3, 0, 3);
				Method.subArray(diff1, center, diff1, 0, 0, 0, 3);
				Method.subArray(diff2, center, diff2, 0, 0, 0, 3);
				const l1 = Method.multiplyArray(diff1, diff1, 0, 0, 3);
				const l2 = Method.multiplyArray(diff2, diff2, 0, 0, 3);
				return l1 < l2 ? 0 : 1;
			case 1:
				const c11 = currentNode.children[0]!, c21 = currentNode.children[1]!;
				const c11e = c11.size, c21e = c21.size, ne = currentNode.size;
				const ey = ne[4] - ne[1], ez = ne[5] - ne[2];
				const comb = Method.boxUnionBox(ne, le, this._tb0);
				const ey1 = comb[4] - comb[1], ez1 = comb[5] - comb[2];
				const newArea = ((comb[3] - comb[0]) * (ey1 + ez1) + ey1 * ez1) * 2;
				const creatingCost = newArea * 2;
				const incrementalCost = (newArea - ((ne[3] - ne[0]) * (ey + ez) + ey * ez) * 2) * 2;
				const descendingCost1 = this._getDescendingCost(c11, c11e, le, comb, incrementalCost);
				const descendingCost2 = this._getDescendingCost(c21, c21e, le, comb, incrementalCost);
				if (creatingCost < descendingCost1) {
					if (creatingCost < descendingCost2) {
						return -1;
					} else {
						return 1;
					}
				} else if (descendingCost1 < descendingCost2) {
					return 0;
				} else {
					return 1;
				}
			default:
				console.log("invalid BVH insertion strategy: " + this._insertionStrategy);
				return -1;
		}
	}

	public splitLeaves(leaves: BvhNode[], from: number, until: number): number {
		const invN = 1.0 / (until - from);
		const centerMean = Method.fillValue(this._tv0, 0, 2, 0);
		let _g = from;
		while (_g < until) {
			const leaf = leaves[_g++];
			const tmp = leaf.tmp, size = leaf.size;
			Method.addArray(size, size, tmp, 3, 0, 0, 3);
			Method.addArray(centerMean, tmp, centerMean, 0, 0, 0, 3);
		}
		Method.scaleArray(centerMean, invN, centerMean, 0, 0, 3);
		const variance = Method.fillValue(this._tv1, 0, 2, 0);
		let _g1 = from;
		while (_g1 < until) {
			const leaf = leaves[_g1++];
			const tmp = leaf.tmp;
			const diff = Method.subArray(tmp, centerMean, this._tv2, 0, 0, 0, 3);
			Method.multiplyArray(diff, diff, 0, 0, 3, diff, 0);
			Method.addArray(variance, diff, variance, 0, 0, 0, 3);
		}
		const lr = Method.setElements(this._tv2, 0, from, until - 1, 0);
		if (variance[0] > variance[1]) {
			if (variance[0] > variance[2]) {
				this._setLeavesDir(centerMean[0], lr, leaves, 0, 0);
			} else {
				this._setLeavesDir(centerMean[2], lr, leaves, 2, 2);
			}
		} else if (variance[1] > variance[2]) {
			this._setLeavesDir(centerMean[1], lr, leaves, 1, 1);
		} else {
			this._setLeavesDir(centerMean[2], lr, leaves, 2, 2);
		}
		return lr[0];
	}

	private _setLeavesDir(centerMean: number, lr: Float64Array, leaves: BvhNode[], index0: number, index1: number): void {
		const mean = centerMean;
		while (true) {
			while (!(leaves[lr[0]].tmp[index0] <= mean)) ++lr[0];
			while (!(leaves[lr[1]].tmp[index1] >= mean)) --lr[1];
			if (lr[0] >= lr[1]) break;
			const tmp = leaves[lr[0]];
			leaves[lr[0]] = leaves[lr[1]];
			leaves[lr[1]] = tmp;
			++lr[0];
			--lr[1];
		}
	}
	private _getDescendingCost(c: BvhNode, ce: Float64Array, le: Float64Array, cmb: Float64Array, incrementalCost: number): number {
		Method.boxUnionBox(ce, le, cmb);
		let ey: number, ez: number;
		let descendingCost: number;
		if (c.height === 0) {
			ey = cmb[4] - cmb[1]; ez = cmb[5] - cmb[2];
			descendingCost = incrementalCost + ((cmb[3] - cmb[0]) * (ey + ez) + ey * ez) * 2;
		} else {
			ey = cmb[4] - cmb[1]; ez = cmb[5] - cmb[2];
			const ey1 = ce[4] - ce[1], ez1 = ce[5] - ce[2];
			descendingCost = incrementalCost + (((cmb[3] - cmb[0]) * (ey + ez) + ey * ez) * 2 - ((ce[3] - ce[0]) * (ey1 + ez1) + ey1 * ez1) * 2);
		}
		return descendingCost;
	}
}