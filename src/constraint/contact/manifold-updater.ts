import ManifoldPoint from "./manifold-point";
import { CONSTANT } from '../../constant';
import Manifold from "./manifold";
import Transform from "../../common/transform";
import DetectorResultPoint from "../../collision-detector/detector-result-point";
import DetectorResult from "../../collision-detector/detector-result";

export default class ManifoldUpdater {
	public _manifold : Manifold;
	public numOldPoints = 0;
	public oldPoints : Array<ManifoldPoint> = new Array(CONSTANT.SETTING_MAX_MANIFOLD_POINTS);

	constructor(manifold : Manifold) {
		this._manifold = manifold;
		let _g = 0, _g1 = CONSTANT.SETTING_MAX_MANIFOLD_POINTS;
		while (_g < _g1) this.oldPoints[_g++] = new ManifoldPoint();
	}
	public removeOutdatedPoints() : void {
		const CPT = CONSTANT.SETTING_CONTACT_PERSISTENCE_THRESHOLD;
		let index = this._manifold.numPoints, normal = this._manifold.normal;
		while (--index >= 0) {
			const p = this._manifold.points[index];
			const pos1 = p.pos1, pos2 = p.pos2;
			let diffX = pos1[0] - pos2[0], diffY = pos1[1] - pos2[1], diffZ = pos1[2] - pos2[2];
			const dotN = normal[0] * diffX + normal[1] * diffY + normal[2] * diffZ;
			if (dotN > CPT) {
				this.removeManifoldPoint(index);
				continue;
			}
			diffX += normal[0] * -dotN; diffY += normal[1] * -dotN; diffZ += normal[2] * -dotN;
			if (diffX * diffX + diffY * diffY + diffZ * diffZ > CPT * CPT) {
				this.removeManifoldPoint(index);
			}
		}
	}
	public removeManifoldPoint(index : number) : void {
		const lastIndex = --this._manifold.numPoints, points = this._manifold.points;
		if (index !== lastIndex) {
			const tmp = points[index];
			points[index] = points[lastIndex];
			points[lastIndex] = tmp;
		}
		const _this = points[lastIndex];
		const localPos1 = _this.localPos1, relPos1 = _this.relPos1, pos1 = _this.pos1, localPos2 = _this.localPos2, relPos2 = _this.relPos2, pos2 = _this.pos2;
		localPos1[0] = localPos1[1] = localPos1[2] = 0;
		localPos2[0] = localPos2[1] = localPos2[2] = 0;
		relPos1[0] = relPos1[1] = relPos1[2] = 0;
		relPos2[0] = relPos2[1] = relPos2[2] = 0;
		pos1[0] = pos1[1] = pos1[2] = 0;
		pos2[0] = pos2[1] = pos2[2] = 0;
		_this.depth = 0;
		const _this1 = _this.impulse.elements;
		_this1[0] = _this1[1] = _this1[2] = _this1[3] = _this1[4] = _this1[5] = _this1[6] = 0;
		_this.warmStarted = false;
		_this.disabled = false;
		_this.id = -1;
	}
	public addManifoldPoint(point : DetectorResultPoint, _tf1 : Transform, _tf2 : Transform) : void {
		let num = this._manifold.numPoints, tf1 = _tf1.elements, tf2 = _tf2.elements;
		if (num === CONSTANT.SETTING_MAX_MANIFOLD_POINTS) {
			const targetIndex = this.computeTargetIndex(point, _tf1, _tf2);
			const mp = this._manifold.points[targetIndex];
			const pos1 = mp.pos1, relPos1 = mp.relPos1, localPos1 = mp.localPos1, pos2 = mp.pos2, relPos2 = mp.relPos2, localPos2 = mp.localPos2;
			let v = point.position1.elements;
			pos1[0] = v[0]; pos1[1] = v[1]; pos1[2] = v[2];
			v = point.position2.elements;
			pos2[0] = v[0]; pos2[1] = v[1]; pos2[2] = v[2];
			relPos1[0] = pos1[0] - tf1[0]; relPos1[1] = pos1[1] - tf1[1]; relPos1[2] = pos1[2] - tf1[2];
			relPos2[0] = pos2[0] - tf2[0]; relPos2[1] = pos2[1] - tf2[1]; relPos2[2] = pos2[2] - tf2[2];
			localPos1[0] = tf1[3] * relPos1[0] + tf1[6] * relPos1[1] + tf1[9] * relPos1[2];
			localPos1[1] = tf1[4] * relPos1[0] + tf1[7] * relPos1[1] + tf1[10] * relPos1[2];
			localPos1[2] = tf1[5] * relPos1[0] + tf1[8] * relPos1[1] + tf1[11] * relPos1[2];
			localPos2[0] = tf2[3] * relPos2[0] + tf2[6] * relPos2[1] + tf2[9] * relPos2[2];
			localPos2[1] = tf2[4] * relPos2[0] + tf2[7] * relPos2[1] + tf2[10] * relPos2[2];
			localPos2[2] = tf2[5] * relPos2[0] + tf2[8] * relPos2[1] + tf2[11] * relPos2[2];
			mp.depth = point.depth;
			const _this1 = mp.impulse.elements;
			_this1[0] = _this1[1] = _this1[2] = _this1[3] = _this1[4] = _this1[5] = _this1[6] = 0;
			mp.id = point.id;
			mp.warmStarted = false;
			mp.disabled = false;
			return;
		}
		const mp = this._manifold.points[num];
		const pos1 = mp.pos1, relPos1 = mp.relPos1, localPos1 = mp.localPos1, pos2 = mp.pos2, relPos2 = mp.relPos2, localPos2 = mp.localPos2;
		let v = point.position1.elements;
		pos1[0] = v[0]; pos1[1] = v[1]; pos1[2] = v[2];
		v = point.position2.elements;
		pos2[0] = v[0]; pos2[1] = v[1]; pos2[2] = v[2];
		relPos1[0] = pos1[0] - tf1[0]; relPos1[1] = pos1[1] - tf1[1]; relPos1[2] = pos1[2] - tf1[2];
		relPos2[0] = pos2[0] - tf2[0]; relPos2[1] = pos2[1] - tf2[1]; relPos2[2] = pos2[2] - tf2[2];
		localPos1[0] = tf1[3] * relPos1[0] + tf1[6] * relPos1[1] + tf1[9] * relPos1[2];
		localPos1[1] = tf1[4] * relPos1[0] + tf1[7] * relPos1[1] + tf1[10] * relPos1[2];
		localPos1[2] = tf1[5] * relPos1[0] + tf1[8] * relPos1[1] + tf1[11] * relPos1[2];
		localPos2[0] = tf2[3] * relPos2[0] + tf2[6] * relPos2[1] + tf2[9] * relPos2[2];
		localPos2[1] = tf2[4] * relPos2[0] + tf2[7] * relPos2[1] + tf2[10] * relPos2[2];
		localPos2[2] = tf2[5] * relPos2[0] + tf2[8] * relPos2[1] + tf2[11] * relPos2[2];
		mp.depth = point.depth;
		const _this1 = mp.impulse.elements;
		_this1[0] = _this1[1] = _this1[2] = _this1[3] = _this1[4] = _this1[5] = _this1[6] = 0;
		mp.id = point.id;
		mp.warmStarted = false;
		mp.disabled = false;
		this._manifold.numPoints++;
	}
	public computeTargetIndex(newPoint : DetectorResultPoint, _tf1 : Transform, _tf2 : Transform) : number {
		const tf1 = _tf1.elements;
		const p1 = this._manifold.points[0], p2 = this._manifold.points[1], p3 = this._manifold.points[2], p4 = this._manifold.points[3];
		const relPos11 = p1.relPos1, relPos21 = p2.relPos1, relPos31 = p3.relPos1, relPos41 = p4.relPos1;
		let maxDepth = p1.depth;
		let maxDepthIndex = 0;
		if (p2.depth > maxDepth) {
			maxDepth = p2.depth;
			maxDepthIndex = 1;
		}
		if (p3.depth > maxDepth) {
			maxDepth = p3.depth;
			maxDepthIndex = 2;
		}
		if (p4.depth > maxDepth) {
			maxDepthIndex = 3;
		}
		const v = newPoint.position1.elements;
		let rp1X = v[0], rp1Y = v[1], rp1Z = v[2];
		rp1X -= tf1[0]; rp1Y -= tf1[1]; rp1Z -= tf1[2];
		let p1X = relPos21[0], p1Y = relPos21[1], p1Z = relPos21[2];
		let p2X = relPos31[0], p2Y = relPos31[1], p2Z = relPos31[2];
		let p3X = relPos41[0], p3Y = relPos41[1], p3Z = relPos41[2];
		let v12X = p2X - p1X, v12Y = p2Y - p1Y, v12Z = p2Z - p1Z;
		let v34X = rp1X - p3X, v34Y = rp1Y - p3Y, v34Z = rp1Z - p3Z;
		let v13X = p3X - p1X, v13Y = p3Y - p1Y, v13Z = p3Z - p1Z;
		let v24X = rp1X - p2X, v24Y = rp1Y - p2Y, v24Z = rp1Z - p2Z;
		let v14X = rp1X - p1X, v14Y = rp1Y - p1Y, v14Z = rp1Z - p1Z;
		let v23X = p3X - p2X, v23Y = p3Y - p2Y, v23Z = p3Z - p2Z;
		let cross1X = v12Y * v34Z - v12Z * v34Y, cross1Y = v12Z * v34X - v12X * v34Z, cross1Z = v12X * v34Y - v12Y * v34X;
		let cross2X = v13Y * v24Z - v13Z * v24Y, cross2Y = v13Z * v24X - v13X * v24Z, cross2Z = v13X * v24Y - v13Y * v24X;
		let cross3X = v14Y * v23Z - v14Z * v23Y, cross3Y = v14Z * v23X - v14X * v23Z, cross3Z = v14X * v23Y - v14Y * v23X;
		const a1 = cross1X * cross1X + cross1Y * cross1Y + cross1Z * cross1Z;
		const a2 = cross2X * cross2X + cross2Y * cross2Y + cross2Z * cross2Z;
		const a3 = cross3X * cross3X + cross3Y * cross3Y + cross3Z * cross3Z;

		p1X = relPos11[0]; p1Y = relPos11[1]; p1Z = relPos11[2];
		p2X = relPos31[0]; p2Y = relPos31[1]; p2Z = relPos31[2];
		p3X = relPos41[0]; p3Y = relPos41[1]; p3Z = relPos41[2];
		v12X = p2X - p1X; v12Y = p2Y - p1Y; v12Z = p2Z - p1Z;
		v34X = rp1X - p3X; v34Y = rp1Y - p3Y; v34Z = rp1Z - p3Z;
		v13X = p3X - p1X; v13Y = p3Y - p1Y; v13Z = p3Z - p1Z;
		v24X = rp1X - p2X; v24Y = rp1Y - p2Y; v24Z = rp1Z - p2Z;
		v14X = rp1X - p1X; v14Y = rp1Y - p1Y; v14Z = rp1Z - p1Z;
		v23X = p3X - p2X; v23Y = p3Y - p2Y; v23Z = p3Z - p2Z;
		cross1X = v12Y * v34Z - v12Z * v34Y; cross1Y = v12Z * v34X - v12X * v34Z; cross1Z = v12X * v34Y - v12Y * v34X;
		cross2X = v13Y * v24Z - v13Z * v24Y; cross2Y = v13Z * v24X - v13X * v24Z; cross2Z = v13X * v24Y - v13Y * v24X;
		cross3X = v14Y * v23Z - v14Z * v23Y; cross3Y = v14Z * v23X - v14X * v23Z; cross3Z = v14X * v23Y - v14Y * v23X;
		const a11 = cross1X * cross1X + cross1Y * cross1Y + cross1Z * cross1Z;
		const a21 = cross2X * cross2X + cross2Y * cross2Y + cross2Z * cross2Z;
		const a31 = cross3X * cross3X + cross3Y * cross3Y + cross3Z * cross3Z;
		const a22 = a11 > a21 ? a11 > a31 ? a11 : a31 : a21 > a31 ? a21 : a31;

		p1X = relPos11[0]; p1Y = relPos11[1]; p1Z = relPos11[2];
		p2X = relPos21[0]; p2Y = relPos21[1]; p2Z = relPos21[2];
		p3X = relPos41[0]; p3Y = relPos41[1]; p3Z = relPos41[2];
		v12X = p2X - p1X; v12Y = p2Y - p1Y; v12Z = p2Z - p1Z;
		v34X = rp1X - p3X; v34Y = rp1Y - p3Y; v34Z = rp1Z - p3Z;
		v13X = p3X - p1X; v13Y = p3Y - p1Y; v13Z = p3Z - p1Z;
		v24X = rp1X - p2X; v24Y = rp1Y - p2Y; v24Z = rp1Z - p2Z;
		v14X = rp1X - p1X; v14Y = rp1Y - p1Y; v14Z = rp1Z - p1Z;
		v23X = p3X - p2X; v23Y = p3Y - p2Y; v23Z = p3Z - p2Z;
		cross1X = v12Y * v34Z - v12Z * v34Y; cross1Y = v12Z * v34X - v12X * v34Z; cross1Z = v12X * v34Y - v12Y * v34X;
		cross2X = v13Y * v24Z - v13Z * v24Y; cross2Y = v13Z * v24X - v13X * v24Z; cross2Z = v13X * v24Y - v13Y * v24X;
		cross3X = v14Y * v23Z - v14Z * v23Y; cross3Y = v14Z * v23X - v14X * v23Z; cross3Z = v14X * v23Y - v14Y * v23X;
		const a12 = cross1X * cross1X + cross1Y * cross1Y + cross1Z * cross1Z;
		const a23 = cross2X * cross2X + cross2Y * cross2Y + cross2Z * cross2Z;
		const a32 = cross3X * cross3X + cross3Y * cross3Y + cross3Z * cross3Z;
		const a33 = a12 > a23 ? a12 > a32 ? a12 : a32 : a23 > a32 ? a23 : a32;

		p1X = relPos11[0]; p1Y = relPos11[1]; p1Z = relPos11[2];
		p2X = relPos21[0]; p2Y = relPos21[1]; p2Z = relPos21[2];
		p3X = relPos31[0]; p3Y = relPos31[1]; p3Z = relPos31[2];
		v12X = p2X - p1X; v12Y = p2Y - p1Y; v12Z = p2Z - p1Z;
		v34X = rp1X - p3X; v34Y = rp1Y - p3Y; v34Z = rp1Z - p3Z;
		v13X = p3X - p1X; v13Y = p3Y - p1Y; v13Z = p3Z - p1Z;
		v24X = rp1X - p2X; v24Y = rp1Y - p2Y; v24Z = rp1Z - p2Z;
		v14X = rp1X - p1X; v14Y = rp1Y - p1Y; v14Z = rp1Z - p1Z;
		v23X = p3X - p2X; v23Y = p3Y - p2Y; v23Z = p3Z - p2Z;
		cross1X = v12Y * v34Z - v12Z * v34Y; cross1Y = v12Z * v34X - v12X * v34Z; cross1Z = v12X * v34Y - v12Y * v34X;
		cross2X = v13Y * v24Z - v13Z * v24Y; cross2Y = v13Z * v24X - v13X * v24Z; cross2Z = v13X * v24Y - v13Y * v24X;
		cross3X = v14Y * v23Z - v14Z * v23Y; cross3Y = v14Z * v23X - v14X * v23Z; cross3Z = v14X * v23Y - v14Y * v23X;
		const a13 = cross1X * cross1X + cross1Y * cross1Y + cross1Z * cross1Z;
		const a24 = cross2X * cross2X + cross2Y * cross2Y + cross2Z * cross2Z;
		const a34 = cross3X * cross3X + cross3Y * cross3Y + cross3Z * cross3Z;
		const a4 = a13 > a24 ? a13 > a34 ? a13 : a34 : a24 > a34 ? a24 : a34;

		let max = a1 > a2 ? a1 > a3 ? a1 : a3 : a2 > a3 ? a2 : a3;
		let target = 0;
		if (a22 > max && maxDepthIndex !== 1 || maxDepthIndex === 0) {
			max = a22;
			target = 1;
		}
		if (a33 > max && maxDepthIndex !== 2) {
			max = a33;
			target = 2;
		}
		if (a4 > max && maxDepthIndex !== 3) {
			target = 3;
		}
		return target;
	}
	public computeRelativePositions(_tf1 : Transform, _tf2 : Transform) : void {
		const tf1 = _tf1.elements, tf2 = _tf2.elements;
		const num = this._manifold.numPoints;
		let _g = 0;
		while (_g < num) {
			let p = this._manifold.points[_g++];
			let relPos1 = p.relPos1, localPos1 = p.localPos1, relPos2 = p.relPos2, localPos2 = p.localPos2;
			relPos1[0] = tf1[3] * localPos1[0] + tf1[4] * localPos1[1] + tf1[5] * localPos1[2];
			relPos1[1] = tf1[6] * localPos1[0] + tf1[7] * localPos1[1] + tf1[8] * localPos1[2];
			relPos1[2] = tf1[9] * localPos1[0] + tf1[10] * localPos1[1] + tf1[11] * localPos1[2];
			relPos2[0] = tf2[3] * localPos2[0] + tf2[4] * localPos2[1] + tf2[5] * localPos2[2];
			relPos2[1] = tf2[6] * localPos2[0] + tf2[7] * localPos2[1] + tf2[8] * localPos2[2];
			relPos2[2] = tf2[9] * localPos2[0] + tf2[10] * localPos2[1] + tf2[11] * localPos2[2];
			p.warmStarted = true;
		}
	}
	public findNearestContactPointIndex(target : DetectorResultPoint, _tf1 : Transform, _tf2 : Transform) : number {
		let nearestSq = CONSTANT.SETTING_CONTACT_PERSISTENCE_THRESHOLD * CONSTANT.SETTING_CONTACT_PERSISTENCE_THRESHOLD;
		const tf1 = _tf1.elements, tf2 = _tf2.elements;
		let idx = -1, _g = 0, _g1 = this._manifold.numPoints;
		while (_g < _g1) {
			const i = _g++;
			const mp = this._manifold.points[i];
			const relPos1 = mp.relPos1, relPos2 = mp.relPos2;
			const v = target.position1.elements, v1 = target.position2.elements;
			let rp1X = v[0], rp1Y = v[1], rp1Z = v[2];
			let rp2X = v1[0], rp2Y = v1[1], rp2Z = v1[2];
			rp1X -= tf1[0]; rp1Y -= tf1[1]; rp1Z -= tf1[2];
			rp2X -= tf2[0]; rp2Y -= tf2[1]; rp2Z -= tf2[2];
			const diff1X = relPos1[0] - rp1X, diff1Y = relPos1[1] - rp1Y, diff1Z = relPos1[2] - rp1Z;
			const diff2X = relPos2[0] - rp2X, diff2Y = relPos2[1] - rp2Y, diff2Z = relPos2[2] - rp2Z;
			const sq1 = diff1X * diff1X + diff1Y * diff1Y + diff1Z * diff1Z;
			const sq2 = diff2X * diff2X + diff2Y * diff2Y + diff2Z * diff2Z;
			const d = sq1 < sq2 ? sq1 : sq2;
			if (d < nearestSq) {
				nearestSq = d;
				idx = i;
			}
		}
		return idx;
	}
	public totalUpdate(result : DetectorResult, _tf1 : Transform, _tf2 : Transform) : void {
		const tf1 = _tf1.elements, tf2 = _tf2.elements;
		this.numOldPoints = this._manifold.numPoints;
		let _g = 0, _g1 = this.numOldPoints;
		while (_g < _g1) {
			let i = _g++;
			const _this = this.oldPoints[i];
			const tlp1 = _this.localPos1, tlp2 = _this.localPos2, trp1 = _this.relPos1, trp2 = _this.localPos2, tp1 = _this.pos1, tp2 = _this.pos2;
			const cp = this._manifold.points[i];
			const clp1 = cp.localPos1, clp2 = cp.localPos2, crp1 = cp.relPos1, crp2 = cp.localPos2, cp1 = cp.pos1, cp2 = cp.pos2;
			tlp1[0] = clp1[0]; tlp1[1] = clp1[1]; tlp1[2] = clp1[2];
			tlp2[0] = clp2[0]; tlp2[1] = clp2[1]; tlp2[2] = clp2[2];
			trp1[0] = crp1[0]; trp1[1] = crp1[1]; trp1[2] = crp1[2];
			trp2[0] = crp2[0]; trp2[1] = crp2[1]; trp2[2] = crp2[2];
			tp1[0] = cp1[0]; tp1[1] = cp1[1]; tp1[2] = cp1[2];
			tp2[0] = cp2[0]; tp2[1] = cp2[1]; tp2[2] = cp2[2];
			_this.depth = cp.depth;
			for (let i = 0; i < 7; i++) {
				_this.impulse.elements[i] = cp.impulse.elements[i];
			}
			_this.id = cp.id;
			_this.warmStarted = cp.warmStarted;
			_this.disabled = false;
		}
		const num = result.numPoints;
		this._manifold.numPoints = num;
		let _g2 = 0;
		while (_g2 < num) {
			const i = _g2++;
			const p = this._manifold.points[i];
			const pos1 = p.pos1, pos2 = p.pos2, relPos1 = p.relPos1, relPos2 = p.relPos2, localPos1 = p.localPos1, localPos2 = p.localPos2;
			const ref = result.points[i];
			const v = ref.position1.elements, v1 = ref.position2.elements;
			pos1[0] = v[0]; pos1[1] = v[1]; pos1[2] = v[2];
			pos2[0] = v1[0]; pos2[1] = v1[1]; pos2[2] = v1[2];
			relPos1[0] = pos1[0] - tf1[0]; relPos1[1] = pos1[1] - tf1[1]; relPos1[2] = pos1[2] - tf1[2];
			relPos2[0] = pos2[0] - tf2[0]; relPos2[1] = pos2[1] - tf2[1]; relPos2[2] = pos2[2] - tf2[2];
			localPos1[0] = tf1[3] * relPos1[0] + tf1[6] * relPos1[1] + tf1[9] * relPos1[2];
			localPos1[1] = tf1[4] * relPos1[0] + tf1[7] * relPos1[1] + tf1[10] * relPos1[2];
			localPos1[2] = tf1[5] * relPos1[0] + tf1[8] * relPos1[1] + tf1[11] * relPos1[2];
			localPos2[0] = tf2[3] * relPos2[0] + tf2[6] * relPos2[1] + tf2[9] * relPos2[2];
			localPos2[1] = tf2[4] * relPos2[0] + tf2[7] * relPos2[1] + tf2[10] * relPos2[2];
			localPos2[2] = tf2[5] * relPos2[0] + tf2[8] * relPos2[1] + tf2[11] * relPos2[2];
			p.depth = ref.depth;
			const _this = p.impulse.elements;
			_this[0] = _this[1] = _this[2] = _this[3] = _this[4] = _this[5] = _this[6] = 0;
			p.id = ref.id;
			p.warmStarted = false;
			p.disabled = false;
			let _g = 0, _g1 = this.numOldPoints;
			while (_g < _g1) {
				const ocp = this.oldPoints[_g++];
				if (p.id === ocp.id) {
					for (let k = 0; k < 7; k++) {
						_this[k] = ocp.impulse.elements[k];
					}
					p.warmStarted = true;
					break;
				}
			}
		}
	}
	public incrementalUpdate(result : DetectorResult, _tf1 : Transform, _tf2 : Transform) : void {
		const tf1 = _tf1.elements, tf2 = _tf2.elements;
		this._manifold.updateDepthsAndPositions(_tf1, _tf2);
		let _g = 0, _g1 = this._manifold.numPoints;
		while (_g < _g1) this._manifold.points[_g++].warmStarted = true;
		const newPoint = result.points[0];
		const index = this.findNearestContactPointIndex(newPoint, _tf1, _tf2);
		if (index === -1) {
			this.addManifoldPoint(newPoint, _tf1, _tf2);
		} else {
			const cp = this._manifold.points[index];
			const pos1 = cp.pos1, pos2 = cp.pos2, relPos1 = cp.relPos1, relPos2 = cp.relPos2, localPos1 = cp.localPos1, localPos2 = cp.localPos2;
			const v = newPoint.position1.elements, v1 = newPoint.position2.elements;
			pos1[0] = v[0]; pos1[1] = v[1]; pos1[2] = v[2];
			pos2[0] = v1[0]; pos2[1] = v1[1]; pos2[2] = v1[2];
			relPos1[0] = pos1[0] - tf1[0]; relPos1[1] = pos1[1] - tf1[1]; relPos1[2] = pos1[2] - tf1[2];
			relPos2[0] = pos2[0] - tf2[0]; relPos2[1] = pos2[1] - tf2[1]; relPos2[2] = pos2[2] - tf2[2];
			localPos1[0] = tf1[3] * relPos1[0] + tf1[6] * relPos1[1] + tf1[9] * relPos1[2];
			localPos1[1] = tf1[4] * relPos1[0] + tf1[7] * relPos1[1] + tf1[10] * relPos1[2];
			localPos1[2] = tf1[5] * relPos1[0] + tf1[8] * relPos1[1] + tf1[11] * relPos1[2];
			localPos2[0] = tf2[3] * relPos2[0] + tf2[6] * relPos2[1] + tf2[9] * relPos2[2];
			localPos2[1] = tf2[4] * relPos2[0] + tf2[7] * relPos2[1] + tf2[10] * relPos2[2];
			localPos2[2] = tf2[5] * relPos2[0] + tf2[8] * relPos2[1] + tf2[11] * relPos2[2];
			cp.depth = newPoint.depth;
		}
		this.removeOutdatedPoints();
	}
}