import ConvexSweepGeometry from "../shape/convex-sweep-geometry";
import AabbGeometry from "../shape/aabb-geometry";
import RayCastHit from "../shape/ray-cast-hit";
import Vec3 from "../common/vec3";
import Transform from "../common/transform";
import ProxyPair from "./proxy-pair";
import Method from "../common/method";
import { BROAD_PHASE_TYPE } from "../constant";
import PhysicsProxy from "./physics-proxy";
import Aabb from "../common/aabb";
import ConvexCastWrapper from "../common/convex-cast-wrapper";
import Shape from "../shape/shape";
import RayCastWrapper from "../common/ray-cast-wrapper";
import ConvexGeometry from "../shape/convex-geometry";
import AabbTestWrapper from "../common/aabb-test-wrapper";
import { Nullable } from "../common/nullable";


export default abstract class BroadPhase {
	protected _numProxies = 0;
	protected _proxyList: Nullable<PhysicsProxy>;
	protected _proxyListLast: Nullable<PhysicsProxy>;
	protected _proxyPairPool: Nullable<ProxyPair>;
	protected _idCount = 0;
	protected _convexSweep = new ConvexSweepGeometry();
	protected _aabb = new AabbGeometry();
	protected _bv0 = new Float64Array(3);
	private _tb = new Float64Array(6);

	public readonly type: BROAD_PHASE_TYPE;
	public proxyPairList: Nullable<ProxyPair>;
	public incremental = false;
	public testCount = 0;
	public identity = new Transform();
	public zero = new Vec3();
	public raycastHit = new RayCastHit();

	constructor(type: BROAD_PHASE_TYPE) {
		this.type = type;
	}

	public abstract createProxy(userData: Shape, aabb: Aabb): any;
	public abstract destroyProxy(proxy: PhysicsProxy): void;
	public abstract moveProxy(proxy: PhysicsProxy, aabb: Aabb, displacement: Vec3): void;
	public isOverlapping(proxy1: PhysicsProxy, proxy2: PhysicsProxy): boolean {
		const o = proxy1.size, t = proxy2.size;
		return Method.boxIntersectsBox(o, t);
	}
	public abstract collectPairs(): void;

	public abstract rayCast(begin: Vec3, end: Vec3, callback: RayCastWrapper): void;
	public abstract convexCast(convex: ConvexGeometry, begin: Transform, translation: Vec3, callback: ConvexCastWrapper): void
	public abstract aabbTest(aabb: Aabb, callback: AabbTestWrapper): void;
	protected setProxyPairList(): ProxyPair {
		let first = this._proxyPairPool;
		if (first) {
			this._proxyPairPool = first.next;
			first.next = null;
		} else {
			first = new ProxyPair();
		}
		let pp = first;
		if (!this.proxyPairList) {
			this.proxyPairList = pp;
		} else {
			pp.next = this.proxyPairList;
			this.proxyPairList = pp;
		}
		return pp;
	}
	protected raycastTest(na: Float64Array, x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): boolean {
		Method.setBox(x1, y1, z1, x2, y2, z2, this._tb);
		if (!Method.boxIntersectsBox(this._tb, na)) {
			return false;
		}
		const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1;
		const adx = dx > 0 ? dx : -dx, ady = dy > 0 ? dy : -dy, adz = dz > 0 ? dz : -dz;
		const ptx = (na[3] - na[0]) * 0.5, pty = (na[4] - na[1]) * 0.5, ptz = (na[5] - na[2]) * 0.5;
		const cpx = x1 - (na[3] + na[0]) * 0.5, cpy = y1 - (na[4] + na[1]) * 0.5, cpz = z1 - (na[5] + na[2]) * 0.5;
		let tmp1 = false, tmp2 = false;
		let x = cpy * dz - cpz * dy;
		if ((x > 0 ? x : -x) < (pty * adz + ptz * ady)) {
			x = cpz * dx - cpx * dz;
			tmp2 = (x > 0 ? x : -x) > (ptz * adx + ptx * adz);
		} else {
			tmp2 = true;
		}
		if (!tmp2) {
			x = cpx * dy - cpy * dx;
			tmp1 = (x > 0 ? x : -x) > (ptx * ady + pty * adx);
		} else {
			tmp1 = true;
		}
		return !tmp1;
	}
	protected setProxyList(numProxies: number, p: PhysicsProxy, aabb: Aabb): number {
		let _numProxies = numProxies + 1;
		if (!this._proxyList) {
			this._proxyList = p;
			this._proxyListLast = p;
		} else {
			this._proxyListLast!.next = p;
			p.prev = this._proxyListLast!;
			this._proxyListLast = p;
		}
		let pe = p.size, ae = aabb.elements;
		Method.copyElements(ae, pe, 0, 0, 6);
		return _numProxies;
	}
}