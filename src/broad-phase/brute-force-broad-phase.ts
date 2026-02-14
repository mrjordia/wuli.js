import BroadPhase from "./broad-phase";
import PhysicsProxy from "./physics-proxy";
import GjkEpa from "../collision-detector/gjk-epa-detector/gjk-epa";
import { BROAD_PHASE_TYPE } from '../constant';
import Method from "../common/method";
import Aabb from "../common/aabb";
import Vec3 from "../common/vec3";
import ConvexCastWrapper from "../common/convex-cast-wrapper";
import Transform from "../common/transform";
import Shape from "../shape/shape";
import ConvexGeometry from "../shape/convex-geometry";
import AabbTestWrapper from "../common/aabb-test-wrapper";
import RayCastWrapper from "../common/ray-cast-wrapper";


export default class BruteForceBroadPhase extends BroadPhase {
	constructor() {
		super(BROAD_PHASE_TYPE.BRUTE_FORCE);
		this.incremental = false;
	}
	public createProxy(userData : Shape, aabb : Aabb) : PhysicsProxy {
		const proxy = new PhysicsProxy(userData, this._idCount++);
		this._numProxies = this.setProxyList(this._numProxies, proxy, aabb);
		return proxy;
	}
	public destroyProxy(proxy : PhysicsProxy) {
		this._numProxies--;
		let prev = proxy.prev;
		let next = proxy.next;
		if (prev) {
			prev.next = next;
		}
		if (next) {
			next.prev = prev;
		}
		if (proxy === this._proxyList) {
			this._proxyList = this._proxyList.next;
		}
		if (proxy === this._proxyListLast) {
			this._proxyListLast = this._proxyListLast.prev;
		}
		proxy.next = null;
		proxy.prev = null;
		proxy.userData = null;
	}
	public moveProxy(proxy : PhysicsProxy, aabb : Aabb, displacement : Vec3) : void {
		Method.copyElements(aabb.elements, proxy.size, 0, 0, 6);
	}
	public collectPairs() : void {
		let p = this.proxyPairList;
		if (p) {
			while (true) {
				p.proxy1 = null;
				p.proxy2 = null;
				p = p.next;
				if (!p) break;
			}
			this.proxyPairList!.next = this._proxyPairPool;
			this._proxyPairPool = this.proxyPairList;
			this.proxyPairList = null;
		}
		this.testCount = 0;
		let p1 = this._proxyList;
		while (p1) {
			let n = p1.next, p2 = p1.next;
			while (p2) {
				let n = p2.next;
				this.testCount++;
				if (Method.boxIntersectsBox(p1.size, p2.size)) {
					let pp = this.setProxyPairList();
					pp.proxy1 = p1;
					pp.proxy2 = p2;
				}
				p2 = n;
			}
			p1 = n;
		}
	}
	public rayCast(begin : Vec3, end : Vec3, callback : RayCastWrapper) : void {
		const p1e = begin.elements, p2e = end.elements;
		let p = this._proxyList;
		while (p) {
			let n = p.next;
			let pe = p.size;
			let tmp = this.raycastTest(pe, p1e[0], p1e[1], p1e[2], p2e[0], p2e[1], p2e[2]);
			if (tmp) {
				callback.process(p);
			}
			p = n;
		}
	}
	public convexCast(convex : ConvexGeometry, begin : Transform, translation : Vec3, callback : ConvexCastWrapper) : void {
		let p = this._proxyList;
		while (p) {
			const n = p.next;
			const abi = this._aabb.min.elements, aba = this._aabb.max.elements, pe = p.size;
			Method.copyElements(pe, abi, 0, 0, 3);
			Method.copyElements(pe, aba, 3, 0, 3);
			this._convexSweep.init(convex, begin, translation);
			const gjkEpa = GjkEpa.instance;
			if (gjkEpa.computeClosestPointsImpl(this._convexSweep, this._aabb, begin, this.identity, null, false) === 0 && gjkEpa.distance <= 0) {
				callback.process(p);
			}
			p = n;
		}
	}
	public aabbTest(aabb : Aabb, callback : AabbTestWrapper) : void {
		let p = this._proxyList, ae = aabb.elements;
		while (p) {
			let n = p.next;
			if (Method.boxIntersectsBox(ae, p.size)) {
				callback.process(p);
			}
			p = n;
		}
	}
}