import BvhStrategy from "./bvh-strategy";
import BvhNode from './bvh-node';
import Method from "../../common/method";
import { Nullable } from "../../common/nullable";


export default class BvhTree {
	public root: Nullable<BvhNode>;
	public numLeaves = 0;
	public strategy = new BvhStrategy();
	public nodePool: Nullable<BvhNode>;
	public leafList: Nullable<BvhNode>;
	public leafListLast: Nullable<BvhNode>;
	public tmp = new Array(1024);

	public getBalance(): number {
		return this.getBalanceRecursive(this.root!);
	}

	public deleteRecursive(root: BvhNode): void {
		if (root.height === 0) {
			const prev = root.prevLeaf, next = root.nextLeaf;
			if (prev) prev.nextLeaf = next;
			if (next) next.prevLeaf = prev;
			if (root === this.leafList) this.leafList = this.leafList.nextLeaf;
			if (root === this.leafListLast) this.leafListLast = this.leafListLast.prevLeaf;
			root.nextLeaf = root.prevLeaf = null;
			root.proxy!.leaf = null;
			this._resetRoot(root);
			return;
		}
		this.deleteRecursive(root.children[0]!);
		this.deleteRecursive(root.children[1]!);
		this._resetRoot(root);
	}
	public decomposeRecursive(root: BvhNode): void {
		if (root.height === 0) {
			root.childIndex = 0;
			root.parent = null;
			return;
		}
		this.decomposeRecursive(root.children[0]!);
		this.decomposeRecursive(root.children[1]!);
		this._resetRoot(root);
	}
	public buildTopDownRecursive(leaves: BvhNode[], from: number, until: number): BvhNode {
		if (until - from === 1) {
			const leaf = leaves[from];
			const proxy = leaf.proxy!;
			const le = leaf.size, pe = proxy.size;
			Method.copyElements(pe, le, 0, 0, 6);
			return leaf;
		}
		const splitAt = this.strategy.splitLeaves(leaves, from, until);
		const child1 = this.buildTopDownRecursive(leaves, from, splitAt);
		const child2 = this.buildTopDownRecursive(leaves, splitAt, until);
		let first = this.nodePool;
		if (first) {
			this.nodePool = first.next;
			first.next = null;
		} else {
			first = new BvhNode();
		}
		const parent = first;
		parent.children[0] = child1;
		child1.parent = parent;
		child1.childIndex = 0;
		parent.children[1] = child2;
		child2.parent = parent;
		child2.childIndex = 1;
		const c1 = parent.children[0].size, c2 = parent.children[1].size, pe = parent.size;
		Method.boxUnionBox(c1, c2, pe);
		const h1 = parent.children[0].height, h2 = parent.children[1].height;
		parent.height = (h1 > h2 ? h1 : h2) + 1;
		return parent;
	}
	public getBalanceRecursive(root: BvhNode): number {
		if (!root || !root.height) {
			return 0;
		}
		let balance = root.children[0]!.height - root.children[1]!.height;
		if (balance < 0) {
			balance = -balance;
		}
		return balance + this.getBalanceRecursive(root.children[0]!) + this.getBalanceRecursive(root.children[1]!);
	}
	private _resetRoot(root: BvhNode): void {
		root.children[0] = root.children[1] = null;
		root.childIndex = 0;
		root.parent = null;
		root.height = 0;
		root.proxy = null;
		root.next = this.nodePool;
		this.nodePool = root;
	}
}