import { CONSTANT } from "../../constant";
import ManifoldPoint from "./manifold-point";
import Vec3 from "../../common/vec3";
import Transform from "../../common/transform";

export default class Manifold {
	public normal = new Float64Array(3);
	public tangent = new Float64Array(3);
	public binormal = new Float64Array(3);
	public numPoints = 0;
	public points: Array<ManifoldPoint> = new Array(CONSTANT.SETTING_MAX_MANIFOLD_POINTS);
	constructor() {
		let _g = 0;
		const _g1 = CONSTANT.SETTING_MAX_MANIFOLD_POINTS;
		while (_g < _g1) this.points[_g++] = new ManifoldPoint();
	}

	public clear(): void {
		let _g = 0;
		const _g1 = this.numPoints;
		while (_g < _g1) {
			const mp = this.points[_g++];
			const localPos1 = mp.localPos1, localPos2 = mp.localPos2, relPos1 = mp.relPos1, relPos2 = mp.relPos2, pos1 = mp.pos1, pos2 = mp.pos2;
			localPos1[0] = localPos1[1] = localPos1[2] = 0;
			localPos2[0] = localPos2[1] = localPos2[2] = 0;
			relPos1[0] = relPos1[1] = relPos1[2] = 0;
			relPos2[0] = relPos2[1] = relPos2[2] = 0;
			pos1[0] = pos1[1] = pos1[2] = 0;
			pos2[0] = pos2[1] = pos2[2] = 0;
			mp.depth = 0;
			const imp = mp.impulse.elements;
			imp[0] = imp[1] = imp[2] = imp[3] = imp[4] = imp[5] = imp[6] = 0;
			mp.warmStarted = false;
			mp.disabled = false;
			mp.id = -1;
		}
		this.numPoints = 0;
	}
	public buildBasis(_normal: Vec3): void {
		const tn = this.normal, tt = this.tangent, tb = this.binormal;
		const normal = _normal.elements;
		tn[0] = normal[0]; tn[1] = normal[1]; tn[2] = normal[2];
		const nx = normal[0], ny = normal[1], nz = normal[2];
		const nx2 = nx * nx, ny2 = ny * ny, nz2 = nz * nz;
		let tx: number, ty: number, tz: number;
		let bx: number, by: number, bz: number;
		if (nx2 < ny2) {
			if (nx2 < nz2) {
				const invL = 1 / Math.sqrt(ny2 + nz2);
				tx = 0; ty = -nz * invL; tz = ny * invL;
				bx = ny * tz - nz * ty; by = -nx * tz; bz = nx * ty;
			} else {
				const invL = 1 / Math.sqrt(nx2 + ny2);
				tx = -ny * invL; ty = nx * invL; tz = 0;
				bx = -nz * ty; by = nz * tx; bz = nx * ty - ny * tx;
			}
		} else if (ny2 < nz2) {
			const invL = 1 / Math.sqrt(nx2 + nz2);
			tx = nz * invL; ty = 0; tz = -nx * invL;
			bx = ny * tz; by = nz * tx - nx * tz; bz = -ny * tx;
		} else {
			const invL = 1 / Math.sqrt(nx2 + ny2);
			tx = -ny * invL; ty = nx * invL; tz = 0;
			bx = -nz * ty; by = nz * tx; bz = nx * ty - ny * tx;
		}
		tt[0] = tx; tt[1] = ty; tt[2] = tz;
		tb[0] = bx; tb[1] = by; tb[2] = bz;
	}
	public updateDepthsAndPositions(_tf1: Transform, _tf2: Transform): void {
		const tf1 = _tf1.elements, tf2 = _tf2.elements;
		const tn = this.normal;
		let _g = 0, _g1 = this.numPoints;
		while (_g < _g1) {
			const p = this.points[_g++];
			const relPos1 = p.relPos1, localPos1 = p.localPos1, pos1 = p.pos1, relPos2 = p.relPos2, localPos2 = p.localPos2, pos2 = p.pos2;
			relPos1[0] = tf1[3] * localPos1[0] + tf1[4] * localPos1[1] + tf1[5] * localPos1[2];
			relPos1[1] = tf1[6] * localPos1[0] + tf1[7] * localPos1[1] + tf1[8] * localPos1[2];
			relPos1[2] = tf1[9] * localPos1[0] + tf1[10] * localPos1[1] + tf1[11] * localPos1[2];
			relPos2[0] = tf2[3] * localPos2[0] + tf2[4] * localPos2[1] + tf2[5] * localPos2[2];
			relPos2[1] = tf2[6] * localPos2[0] + tf2[7] * localPos2[1] + tf2[8] * localPos2[2];
			relPos2[2] = tf2[9] * localPos2[0] + tf2[10] * localPos2[1] + tf2[11] * localPos2[2];
			pos1[0] = relPos1[0] + tf1[0]; pos1[1] = relPos1[1] + tf1[1]; pos1[2] = relPos1[2] + tf1[2];
			pos2[0] = relPos2[0] + tf2[0]; pos2[1] = relPos2[1] + tf2[1]; pos2[2] = relPos2[2] + tf2[2];
			const diffX = pos1[0] - pos2[0], diffY = pos1[1] - pos2[1], diffZ = pos1[2] - pos2[2];
			p.depth = -(diffX * tn[0] + diffY * tn[1] + diffZ * tn[2]);
		}
	}

}