import BroadPhase from "../broad-phase";
import { CONSTANT, BROAD_PHASE_TYPE } from '../../constant';
import BvhTree from "./bvh-tree";
import GjkEpa from "../../collision-detector/gjk-epa-detector/gjk-epa";
import BvhProxy from "./bvh-proxy";
import BvhNode from './bvh-node';
import Method from "../../common/method";
import ConvexCastWrapper from "../../common/convex-cast-wrapper";
import Vec3 from "../../common/vec3";
import Aabb from "../../common/aabb";
import Transform from "../../common/transform";
import Shape from "../../shape/shape";
import ConvexGeometry from "../../shape/convex-geometry";
import RayCastWrapper from "../../common/ray-cast-wrapper";
import AabbTestWrapper from "../../common/aabb-test-wrapper";
import { Nullable } from "../../common/nullable";


export default class BvhBroadPhase extends BroadPhase {
	public incremental = true;
	public movedProxies: Array<Nullable<BvhProxy>> = new Array(1024);
	public numMovedProxies = 0;

	private _tree = new BvhTree();

	constructor() {
		super(BROAD_PHASE_TYPE.BVH);
	}

	public collide(n1: BvhNode, n2: BvhNode): void {
		this.testCount++;
		const l1 = n1.height === 0;
		const l2 = n2.height === 0;
		if (n1 === n2) {
			if (l1) return;
			this.collide(n1.children[0]!, n2);
			this.collide(n1.children[1]!, n2);
			return;
		}
		if (!Method.boxIntersectsBox(n1.size, n2.size)) return;
		if (l1 && l2) {
			const pp = this.setProxyPairList();
			pp.proxy1 = n1.proxy;
			pp.proxy2 = n2.proxy;
			return;
		}
		if (l2 || n1.height > n2.height) {
			this.collide(n1.children[0]!, n2);
			this.collide(n1.children[1]!, n2);
		} else {
			this.collide(n2.children[0]!, n1);
			this.collide(n2.children[1]!, n1);
		}
	}
	public rayCastRecursive(node: BvhNode, x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, callback: RayCastWrapper): void {
		if (!this.raycastTest(node.size, x1, y1, z1, x2, y2, z2)) {
			return;
		}
		if (node.height === 0) {
			callback.process(node.proxy!);
			return;
		}
		this.rayCastRecursive(node.children[0]!, x1, y1, z1, x2, y2, z2, callback);
		this.rayCastRecursive(node.children[1]!, x1, y1, z1, x2, y2, z2, callback);
	}
	public convexCastRecursive(node: BvhNode, convex: ConvexGeometry, begin: Transform, translation: Vec3, callback: ConvexCastWrapper): void {
		const na = node.size, ab = this._aabb;
		Method.copyElements(na, ab.min.elements, 0, 0, 3);
		Method.copyElements(na, ab.max.elements, 3, 0, 3);
		this._convexSweep.init(convex, begin, translation);
		const gjkEpa = GjkEpa.instance;
		if (!(gjkEpa.computeClosestPointsImpl(this._convexSweep, ab, begin, this.identity, null, false) === 0 && gjkEpa.distance <= 0)) {
			return;
		}
		if (node.height === 0) {
			callback.process(node.proxy!);
			return;
		}
		this.convexCastRecursive(node.children[0]!, convex, begin, translation, callback);
		this.convexCastRecursive(node.children[1]!, convex, begin, translation, callback);
	}
	public aabbTestRecursive(node: BvhNode, aabb: Aabb, callback: AabbTestWrapper): void {
		if (!Method.boxIntersectsBox(node.size, aabb.elements)) {
			return;
		}
		if (node.height === 0) {
			callback.process(node.proxy!);
			return;
		}
		const nodeChildren = node.children;
		this.aabbTestRecursive(nodeChildren[0]!, aabb, callback);
		this.aabbTestRecursive(nodeChildren[1]!, aabb, callback);
	}
	public moveProxy(proxy: BvhProxy, aabb: Aabb, displacement: Vec3): void {
		const p = proxy.size, ae = aabb.elements;
		if (Method.boxContainsBox(p, ae)) {
			return;
		}
		Method.copyElements(ae, p, 0, 0, 6);
		const padding = CONSTANT.SETTING_BVH_PROXY_PADDING;
		Method.expandBoxByScale(p, padding);
		if (displacement) {
			const des = displacement.elements;
			Method.expandBoxByPoint(p, des[0], des[1], des[2]);
		}
		this.numMovedProxies = this._moveProxy(proxy, this.movedProxies, this.numMovedProxies);
	}
	public setProxyChain(parent: BvhNode, self: BvhNode, si: number, child: BvhNode, ci: number): void {
		this._makeProxyChain(parent, self, si);
		this._makeProxyChain(self, child, ci);
		this._setParentProxy(parent);
		this._setParentProxy(self);
	}
	public updateNode(nd: BvhNode, tree: BvhTree): void {
		let node: Nullable<BvhNode> = nd;
		while (node) {
			if (tree.strategy.balancingEnabled) {
				if (node.height >= 2) {
					let p = node.parent, l: BvhNode = node.children[0]!, r: BvhNode = node.children[1]!;
					let balance = l.height - r.height;
					let nodeIndex = node.childIndex;
					if (balance > 1) {
						let ll = l.children[0]!, lr = l.children[1]!;
						if (ll.height > lr.height) {
							this.setProxyChain(l, node, 1, lr, 0);
						} else {
							this.setProxyChain(l, node, 0, ll, 0);
						}
						if (p) {
							this._makeProxyChain(p, l, nodeIndex);
						} else {
							tree.root = l;
							l.parent = null;
						}
						node = l;
					} else if (balance < -1) {
						let rl = r.children[0]!, rr = r.children[1]!;
						if (rl.height > rr.height) {
							this.setProxyChain(r, node, 1, rr, 1);
						} else {
							this.setProxyChain(r, node, 0, rl, 1);
						}
						if (p) {
							this._makeProxyChain(p, r, nodeIndex);
						} else {
							tree.root = r;
							r.parent = null;
						}
						node = r;
					}
				}
			}
			this._setParentProxy(node);
			node = node.parent;
		}
	}
	public createProxy(userData: Shape, aabb: Aabb): BvhProxy {
		let p = new BvhProxy(userData, this._idCount++);
		this._numProxies = this.setProxyList(this._numProxies, p, aabb);
		let padding = CONSTANT.SETTING_BVH_PROXY_PADDING;
		Method.expandBoxByScale(p.size, padding);
		let _this = this._tree;
		let first = _this.nodePool;
		if (first) {
			_this.nodePool = first.next;
			first.next = null;
		} else {
			first = new BvhNode();
		}
		let leaf = first;
		leaf.proxy = p;
		p.leaf = leaf;
		Method.copyElements(p.size, leaf.size, 0, 0, 6);
		this._addLeaf(_this, leaf);
		if (!_this.root) {
			_this.root = leaf;
		} else {
			let sibling = _this.root;
			while (sibling.height > 0) {
				let nextStep = _this.strategy.decideInsertion(sibling, leaf);
				if (nextStep === -1) {
					break;
				} else {
					sibling = sibling.children[nextStep]!;
				}
			}
			let parent = sibling.parent;
			let first = _this.nodePool;
			if (first) {
				_this.nodePool = first.next;
				first.next = null;
			} else {
				first = new BvhNode();
			}
			let node = first;
			if (!parent) {
				_this.root = node;
			} else {
				this._makeProxyChain(parent, node, sibling.childIndex);
			}
			this._makeProxyChain(node, sibling, sibling.childIndex);
			this._makeProxyChain(node, leaf, sibling.childIndex ^ 1);
			this.updateNode(node, _this);
		}
		this.numMovedProxies = this._moveProxy(p, this.movedProxies, this.numMovedProxies);
		return p;
	}
	public destroyProxy(proxy: BvhProxy): void {
		this._numProxies--;
		const prev = proxy.prev, next = proxy.next;
		if (prev) prev.next = next;
		if (next) next.prev = prev;
		if (proxy === this._proxyList) this._proxyList = this._proxyList.next;
		if (proxy === this._proxyListLast) this._proxyListLast = this._proxyListLast.prev;
		proxy.next = proxy.prev = null;
		const bvhProxy = proxy;
		this._resetBvhProxy(bvhProxy);
		bvhProxy.userData = null;
		bvhProxy.next = null;
		bvhProxy.prev = null;
		if (bvhProxy.moved) {
			bvhProxy.moved = false;
		}
	}
	public collectPairs(): void {
		let p = this.proxyPairList;
		if (p) {
			while (true) {
				p.proxy1 = p.proxy2 = null;
				p = p.next;
				if (!p) break;
			}
			this.proxyPairList!.next = this._proxyPairPool;
			this._proxyPairPool = this.proxyPairList;
			this.proxyPairList = null;
		}
		this.testCount = 0;
		if (this._numProxies < 2) return;
		const incrementalCollision = this.numMovedProxies / this._numProxies < CONSTANT.SETTING_BVH_INCREMENTAL_COLLISION_THRESHOLD;
		let _g = 0, _g1 = this.numMovedProxies;
		while (_g < _g1) {
			const i = _g++;
			const p = this.movedProxies[i]!;
			if (p.moved) {
				this._resetBvhProxy(p);
				const _this1 = this._tree;
				let first = _this1.nodePool;
				if (first) {
					_this1.nodePool = first.next;
					first.next = null;
				} else {
					first = new BvhNode();
				}
				const leaf1 = first;
				leaf1.proxy = p;
				p.leaf = leaf1;
				Method.copyElements(p.size, leaf1.size, 0, 0, 6);
				this._addLeaf(_this1, leaf1);
				if (!_this1.root) {
					_this1.root = leaf1;
				} else {
					let sibling = _this1.root;
					while (sibling.height > 0) {
						const nextStep = _this1.strategy.decideInsertion(sibling, leaf1);
						if (nextStep === -1) {
							break;
						} else {
							sibling = sibling.children[nextStep]!;
						}
					}
					const parent = sibling.parent;
					let first = _this1.nodePool;
					if (first) {
						_this1.nodePool = first.next;
						first.next = null;
					} else {
						first = new BvhNode();
					}
					const node = first;
					if (!parent) {
						_this1.root = node;
					} else {
						this._makeProxyChain(parent, node, sibling.childIndex);
					}
					this._makeProxyChain(node, sibling, sibling.childIndex);
					this._makeProxyChain(node, leaf1, sibling.childIndex ^ 1);
					this.updateNode(node, _this1);
				}
				if (incrementalCollision) {
					this.collide(this._tree.root!, p.leaf);
				}
				p.moved = false;
			}
			this.movedProxies[i] = null;
		}
		if (!incrementalCollision) {
			this.collide(this._tree.root!, this._tree.root!);
		}
		this.numMovedProxies = 0;
	}
	public rayCast(begin: Vec3, end: Vec3, callback: RayCastWrapper): void {
		if (!this._tree.root) return;
		const p1e = begin.elements;
		const p2e = end.elements;
		this.rayCastRecursive(this._tree.root, p1e[0], p1e[1], p1e[2], p2e[0], p2e[1], p2e[2], callback);
	}
	public convexCast(convex: ConvexGeometry, begin: Transform, translation: Vec3, callback: ConvexCastWrapper): void {
		if (!this._tree.root) return;
		this.convexCastRecursive(this._tree.root, convex, begin, translation, callback);
	}
	public aabbTest(aabb: Aabb, callback: AabbTestWrapper): void {
		if (!this._tree.root) return;
		this.aabbTestRecursive(this._tree.root, aabb, callback);
	}
	public getTreeBalance(): number {
		return this._tree.getBalance();
	}

	private _resetChild(parent: BvhNode, tree: BvhTree): void {
		parent.next = null;
		parent.children[0] = parent.children[1] = null;
		parent.childIndex = 0;
		parent.parent = null;
		parent.height = 0;
		parent.proxy = null;
		parent.next = tree.nodePool;
		tree.nodePool = parent;
	}
	private _resetBvhProxy(bvhProxy: BvhProxy): void {
		const _this = this._tree;
		const leaf = bvhProxy.leaf!;
		_this.numLeaves--;
		const prev1 = leaf.prevLeaf, next1 = leaf.nextLeaf;
		if (prev1) prev1.nextLeaf = next1;
		if (next1) next1.prevLeaf = prev1;
		if (leaf === _this.leafList) _this.leafList = _this.leafList.nextLeaf;
		if (leaf === _this.leafListLast) _this.leafListLast = _this.leafListLast.prevLeaf;
		leaf.nextLeaf = leaf.prevLeaf = null;
		if (_this.root === leaf) {
			_this.root = null;
		} else {
			const parent = leaf.parent!;
			const sibling = parent.children[leaf.childIndex ^ 1]!;
			const grandParent = parent.parent;
			if (!grandParent) {
				sibling.parent = null;
				sibling.childIndex = 0;
				_this.root = sibling;
				this._resetChild(parent, _this);
			} else {
				sibling.parent = grandParent;
				const index = parent.childIndex;
				grandParent.children[index] = sibling;
				sibling.parent = grandParent;
				sibling.childIndex = index;
				this._resetChild(parent, _this);
				this.updateNode(grandParent, _this);
			}
		}
		bvhProxy.leaf = null;
		this._resetChild(leaf, _this);
	}
	private _addLeaf(tree: BvhTree, leaf: BvhNode): void {
		tree.numLeaves++;
		if (!tree.leafList) {
			tree.leafList = leaf;
			tree.leafListLast = leaf;
		} else {
			tree.leafListLast!.nextLeaf = leaf;
			leaf.prevLeaf = tree.leafListLast;
			tree.leafListLast = leaf;
		}
	}
	private _makeProxyChain(parent: BvhNode, child: BvhNode, ci: number): void {
		parent.children[ci] = child;
		child.parent = parent;
		child.childIndex = ci;
	}
	private _setParentProxy(parent: BvhNode): void {
		Method.boxUnionBox(parent.children[0]!.size, parent.children[1]!.size, parent.size);
		let h1 = parent.children[0]!.height, h2 = parent.children[1]!.height;
		parent.height = (h1 > h2 ? h1 : h2) + 1;
	}
	private _moveProxy(proxy: BvhProxy, movedProxies: Array<Nullable<BvhProxy>>, numMovedProxies: number): number {
		if (!proxy.moved) {
			proxy.moved = true;
			if (movedProxies.length === numMovedProxies) {
				const newArray = new Array(numMovedProxies << 1);
				let _g = 0;
				while (_g < numMovedProxies) {
					const i = _g++;
					newArray[i] = movedProxies[i];
					movedProxies[i] = null;
				}
				movedProxies = newArray;
			}
			movedProxies[numMovedProxies] = proxy;
			return numMovedProxies + 1;
		}
		return numMovedProxies;
	}

}