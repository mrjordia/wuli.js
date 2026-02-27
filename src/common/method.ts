import { Nullable } from "./nullable";

const DEFAULT_33 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
let tf0 = new Float64Array(16);
let tv0 = new Float64Array(4);

enum TRANSFORM_OPTION {
	TRANSLATE_ROTATE,
	ROTATE,
	TRANSLATE,
}

export default class Method {

	public static absArray(a: Float64Array, out: Float64Array, aStart = 0, outStart = 0, length = 3, fac = 1): Float64Array {
		for (let i = 0; i < length; i++) {
			const va = a[aStart + i];
			out[outStart + i] = (va > 0 ? va : -va) * fac;
		}
		return out;
	}
	public static addArray(a: Float64Array, b: Float64Array, out: Float64Array, startA = 0, startB = 0, startOut = 0, length = 3): Float64Array {
		const sa = startA || 0;
		const sb = startB || 0;
		const so = startOut || 0;
		const len = length || Math.min(a.length, b.length);
		for (let i = 0; i < len; i++) {
			out[i + so] = a[i + sa] + b[i + sb];
		}
		return out;
	}
	public static boxIntersectsBox(b0: Float64Array, b1: Float64Array): boolean {
		return b0[0] < b1[3] && b0[3] > b1[0] &&
			b0[1] < b1[4] && b0[4] > b1[1] &&
			b0[2] < b1[5] && b0[5] > b1[2];
	}
	public static boxContainsBox(b0: Float64Array, b1: Float64Array): boolean {
		return b0[0] <= b1[0] && b0[3] >= b1[3] &&
			b0[1] <= b1[1] && b0[4] >= b1[4] &&
			b0[2] <= b1[2] && b0[5] >= b1[5]
	}
	public static boxUnionBox(b1: Float64Array, b2: Float64Array, out: Float64Array): Float64Array {
		out[0] = b1[0] < b2[0] ? b1[0] : b2[0]; out[1] = b1[1] < b2[1] ? b1[1] : b2[1]; out[2] = b1[2] < b2[2] ? b1[2] : b2[2];
		out[3] = b1[3] > b2[3] ? b1[3] : b2[3]; out[4] = b1[4] > b2[4] ? b1[4] : b2[4]; out[5] = b1[5] > b2[5] ? b1[5] : b2[5];
		return out;
	}
	public static crossVectors(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, out: Float64Array, start = 0): Float64Array {
		out[start] = y0 * z1 - z0 * y1;
		out[start + 1] = z0 * x1 - x0 * z1;
		out[start + 2] = x0 * y1 - y0 * x1;
		return out;
	}

	public static combineMat3Vec3ToTransform(vec3: Float64Array, mat3: Float64Array, transform: Float64Array): void {
		const m = mat3, v = vec3, t = transform;
		t[0] = v[0]; t[1] = v[1]; t[2] = v[2];
		t[3] = m[0]; t[4] = m[1]; t[5] = m[2];
		t[6] = m[3]; t[7] = m[4]; t[8] = m[5];
		t[9] = m[6]; t[10] = m[7]; t[11] = m[8];
	}
	public static copyElements(src: Float64Array, dst: Float64Array, startSrc = 0, startDst = 0, length = 0): Float64Array {
		const ss = startSrc;
		const sd = startDst;
		const len = length || Math.min(src.length, dst.length);
		for (let i = 0; i < len; i++) {
			dst[i + sd] = src[i + ss];
		}
		return dst;
	}

	public static extractQuatFromTransform(transform: Float64Array, out: Float64Array): void {
		const tq = out, tf = transform;
		const t = tf[3] + tf[7] + tf[11];
		let s: number;
		if (t > 0) {
			s = Math.sqrt(t + 1);
			tq[3] = 0.5 * s;
			s = 0.5 / s;
			tq[0] = (tf[10] - tf[8]) * s; tq[1] = (tf[5] - tf[9]) * s; tq[2] = (tf[6] - tf[4]) * s;
		} else if (tf[3] > tf[7]) {
			if (tf[3] > tf[11]) {
				s = Math.sqrt(tf[3] - tf[7] - tf[11] + 1);
				tq[0] = 0.5 * s;
				s = 0.5 / s;
				tq[1] = (tf[4] + tf[6]) * s; tq[2] = (tf[5] + tf[9]) * s; tq[3] = (tf[10] - tf[8]) * s;
			} else {
				s = Math.sqrt(tf[11] - tf[3] - tf[7] + 1);
				tq[2] = 0.5 * s;
				s = 0.5 / s;
				tq[0] = (tf[5] + tf[9]) * s; tq[1] = (tf[8] + tf[10]) * s; tq[3] = (tf[6] - tf[4]) * s;
			}
		} else if (tf[7] > tf[11]) {
			s = Math.sqrt(tf[7] - tf[11] - tf[3] + 1);
			tq[1] = 0.5 * s;
			s = 0.5 / s;
			tq[0] = (tf[4] + tf[6]) * s; tq[2] = (tf[8] + tf[10]) * s; tq[3] = (tf[5] - tf[9]) * s;
		} else {
			s = Math.sqrt(tf[11] - tf[3] - tf[7] + 1);
			tq[2] = 0.5 * s;
			s = 0.5 / s;
			tq[0] = (tf[5] + tf[9]) * s; tq[1] = (tf[8] + tf[10]) * s; tq[3] = (tf[6] - tf[4]) * s;
		}
	}
	public static expandBoxByScale(box: Float64Array, scale: number): void {
		box[0] -= scale; box[1] -= scale; box[2] -= scale;
		box[3] += scale; box[4] += scale; box[5] += scale;
	}
	public static expandBoxByPoint(box: Float64Array, x: number, y: number, z: number): void {
		const addToMinX = x > 0 ? 0 : x, addToMinY = y > 0 ? 0 : y, addToMinZ = z > 0 ? 0 : z;
		const addToMaxX = x < 0 ? 0 : x, addToMaxY = y < 0 ? 0 : y, addToMaxZ = z < 0 ? 0 : z;
		box[0] += addToMinX; box[1] += addToMinY; box[2] += addToMinZ;
		box[3] += addToMaxX; box[4] += addToMaxY; box[5] += addToMaxZ;
	}
	public static fillValue<T = Float64Array, E = number>(tar: T, start: number, end: number, value: E): T {
		for (let i = start; i < (tar as any).length; i++) {
			if (i > end) break;
			(tar as any[])[i] = value;
		}
		return tar;
	}
	public static inverseInertia(axisX: number, axisY: number, axisZ: number, rv: Float64Array, ra: Float64Array, invMass: number, mass: number): number {
		let invI1 = rv[0] * axisX + rv[1] * axisY + rv[2] * axisZ;
		if (invI1 > 0) {
			const dot = axisX * ra[0] + axisY * ra[1] + axisZ * ra[2];
			const projsq = ra[0] * ra[0] + ra[1] * ra[1] + ra[2] * ra[2] - dot * dot;
			if (projsq > 0) {
				if (invMass > 0) {
					invI1 = 1 / (1 / invI1 + mass * projsq);
				} else {
					invI1 = 0;
				}
			}
		}
		return invI1;
	}
	public static inverseTransformM3(tf: Float64Array, wb: Float64Array, out?: Float64Array): void {
		const tf1 = tf;
		const wb1 = wb;
		const o = out || new Float64Array(9);
		o[0] = tf1[3] * wb1[0] + tf1[6] * wb1[3] + tf1[9] * wb1[6];
		o[1] = tf1[3] * wb1[1] + tf1[6] * wb1[4] + tf1[9] * wb1[7];
		o[2] = tf1[3] * wb1[2] + tf1[6] * wb1[5] + tf1[9] * wb1[8];
		o[3] = tf1[4] * wb1[0] + tf1[7] * wb1[3] + tf1[10] * wb1[6];
		o[4] = tf1[4] * wb1[1] + tf1[7] * wb1[4] + tf1[10] * wb1[7];
		o[5] = tf1[4] * wb1[2] + tf1[7] * wb1[5] + tf1[10] * wb1[8];
		o[6] = tf1[5] * wb1[0] + tf1[8] * wb1[3] + tf1[11] * wb1[6];
		o[7] = tf1[5] * wb1[1] + tf1[8] * wb1[4] + tf1[11] * wb1[7];
		o[8] = tf1[5] * wb1[2] + tf1[8] * wb1[5] + tf1[11] * wb1[8];
	}
	public static isArray(obj: any): boolean {
		if (typeof obj !== 'object') {
			return false;
		}
		if (Array.isArray(obj)) return true;
		if (obj[0] !== undefined) {
			return true;
		} else {
			return false;
		}
	}
	public static inverseRotateVec3(_v: Float64Array, _rot: Float64Array): void {
		const v = _v, rot = _rot;
		const __tmp__X = rot[0] * v[0] + rot[3] * v[1] + rot[6] * v[2];
		const __tmp__Y = rot[1] * v[0] + rot[4] * v[1] + rot[7] * v[2];
		const __tmp__Z = rot[2] * v[0] + rot[5] * v[1] + rot[8] * v[2];
		v[0] = __tmp__X; v[1] = __tmp__Y; v[2] = __tmp__Z;
	}
	public static inverseTransformVec3(_tf: Float64Array, vec3: Float64Array, op: 0 | 1, out: Float64Array, vecStart = 0, outStart = 0): void {
		/**
		 * op:
		 *      0:translate and rotate;
		 *      1:only rotate;
		 */
		const v = vec3, tf = _tf;
		let vX = v[vecStart], vY = v[vecStart + 1], vZ = v[vecStart + 2];
		if (op === 0) {
			vX -= tf[0]; vY -= tf[1]; vZ -= tf[2];
		}
		const __tmp__X = tf[3] * vX + tf[6] * vY + tf[9] * vZ;
		const __tmp__Y = tf[4] * vX + tf[7] * vY + tf[10] * vZ;
		const __tmp__Z = tf[5] * vX + tf[8] * vY + tf[11] * vZ;
		vX = __tmp__X;
		vY = __tmp__Y;
		vZ = __tmp__Z;
		const es = out;
		es[outStart] = __tmp__X; es[outStart + 1] = __tmp__Y; es[outStart + 2] = __tmp__Z;
	}
	public static multiplyTransform(_src: Float64Array, _m: Float64Array, _dst: Float64Array): void {
		const src = _src;
		const m = _m;
		const dst = _dst;
		dst[3] = m[3] * src[3] + m[4] * src[6] + m[5] * src[9];
		dst[4] = m[3] * src[4] + m[4] * src[7] + m[5] * src[10];
		dst[5] = m[3] * src[5] + m[4] * src[8] + m[5] * src[11];
		dst[6] = m[6] * src[3] + m[7] * src[6] + m[8] * src[9];
		dst[7] = m[6] * src[4] + m[7] * src[7] + m[8] * src[10];
		dst[8] = m[6] * src[5] + m[7] * src[8] + m[8] * src[11];
		dst[9] = m[9] * src[3] + m[10] * src[6] + m[11] * src[9];
		dst[10] = m[9] * src[4] + m[10] * src[7] + m[11] * src[10];
		dst[11] = m[9] * src[5] + m[10] * src[8] + m[11] * src[11];
		dst[0] = m[3] * src[0] + m[4] * src[1] + m[5] * src[2];
		dst[1] = m[6] * src[0] + m[7] * src[1] + m[8] * src[2];
		dst[2] = m[9] * src[0] + m[10] * src[1] + m[11] * src[2];
		dst[0] += m[0];
		dst[1] += m[1];
		dst[2] += m[2];
	}
	public static mat3ToQuat(m3: Float64Array, out: Float64Array): void {
		const tm = m3;
		const oe = out;
		const relRot00 = tm[0], relRot01 = tm[1], relRot02 = tm[2];
		const relRot10 = tm[3], relRot11 = tm[4], relRot12 = tm[5];
		const relRot20 = tm[6], relRot21 = tm[7], relRot22 = tm[8];
		let relQX: number, relQY: number, relQZ: number, relQW: number;
		const t = relRot00 + relRot11 + relRot22;
		let s: number;
		if (t > 0) {
			s = Math.sqrt(t + 1);
			relQW = 0.5 * s;
			s = 0.5 / s;
			relQX = (relRot21 - relRot12) * s;
			relQY = (relRot02 - relRot20) * s;
			relQZ = (relRot10 - relRot01) * s;
		} else if (relRot00 > relRot11) {
			if (relRot00 > relRot22) {
				s = Math.sqrt(relRot00 - relRot11 - relRot22 + 1);
				relQX = 0.5 * s;
				s = 0.5 / s;
				relQY = (relRot01 + relRot10) * s;
				relQZ = (relRot02 + relRot20) * s;
				relQW = (relRot21 - relRot12) * s;
			} else {
				s = Math.sqrt(relRot22 - relRot00 - relRot11 + 1);
				relQZ = 0.5 * s;
				s = 0.5 / s;
				relQX = (relRot02 + relRot20) * s;
				relQY = (relRot12 + relRot21) * s;
				relQW = (relRot10 - relRot01) * s;
			}
		} else if (relRot11 > relRot22) {
			s = Math.sqrt(relRot11 - relRot22 - relRot00 + 1);
			relQY = 0.5 * s;
			s = 0.5 / s;
			relQX = (relRot01 + relRot10) * s;
			relQZ = (relRot12 + relRot21) * s;
			relQW = (relRot02 - relRot20) * s;
		} else {
			s = Math.sqrt(relRot22 - relRot00 - relRot11 + 1);
			relQZ = 0.5 * s;
			s = 0.5 / s;
			relQX = (relRot02 + relRot20) * s;
			relQY = (relRot12 + relRot21) * s;
			relQW = (relRot10 - relRot01) * s;
		}
		oe[0] = relQX; oe[1] = relQY; oe[2] = relQZ; oe[3] = relQW;
	}
	public static mat3ToVec3(bs: Float64Array, out: Float64Array): void {
		const ot = out, tm = bs;
		const relRot00 = tm[0];
		const relRot01 = tm[1];
		const relRot02 = tm[2];
		const relRot11 = tm[4];
		const relRot12 = tm[5];
		const relRot21 = tm[7];
		const relRot22 = tm[8];
		const sy = relRot02;
		if (sy <= -1) {
			const xSubZ = Math.atan2(relRot21, relRot11);
			ot[0] = xSubZ * 0.5;
			ot[1] = -1.570796326794895;
			ot[2] = -xSubZ * 0.5;
		} else if (sy >= 1) {
			const xAddZ = Math.atan2(relRot21, relRot11);
			ot[0] = xAddZ * 0.5;
			ot[1] = 1.570796326794895;
			ot[2] = xAddZ * 0.5;
		} else {
			ot[0] = Math.atan2(-relRot12, relRot22);
			ot[1] = Math.asin(sy);
			ot[2] = Math.atan2(-relRot01, relRot00);
		}
	}
	public static makeBasis(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, outElements: Float64Array): void {
		const ax = outElements;
		const aaXX = x0, aaXY = y0, aaXZ = z0;
		const aaZX = x1, aaZY = y1, aaZZ = z1;
		const aaYX = aaZY * aaXZ - aaZZ * aaXY, aaYY = aaZZ * aaXX - aaZX * aaXZ, aaYZ = aaZX * aaXY - aaZY * aaXX;
		ax[0] = aaYY * aaZZ - aaYZ * aaZY;
		ax[1] = aaYZ * aaZX - aaYX * aaZZ;
		ax[2] = aaYX * aaZY - aaYY * aaZX;
		ax[3] = aaYX;
		ax[4] = aaYY;
		ax[5] = aaYZ;
		ax[6] = aaXY * aaYZ - aaXZ * aaYY;
		ax[7] = aaXZ * aaYX - aaXX * aaYZ;
		ax[8] = aaXX * aaYY - aaXY * aaYX;
		let l = ax[0] * ax[0] + ax[1] * ax[1] + ax[2] * ax[2];
		if (l > 0) l = 1 / Math.sqrt(l);
		ax[0] *= l; ax[1] *= l; ax[2] *= l;
		l = ax[3] * ax[3] + ax[4] * ax[4] + ax[5] * ax[5];
		if (l > 0) l = 1 / Math.sqrt(l);
		ax[3] *= l; ax[4] *= l; ax[5] *= l;
		l = ax[6] * ax[6] + ax[7] * ax[7] + ax[8] * ax[8];
		if (l > 0) l = 1 / Math.sqrt(l);
		ax[6] *= l; ax[7] *= l; ax[8] *= l;
	}
	public static multiplyBasis(b0: Float64Array, b1: Float64Array, out: Float64Array): void {
		const b2 = out;
		b2[0] = b0[0] * b1[0] + b0[1] * b1[1] + b0[2] * b1[2];
		b2[1] = b0[3] * b1[0] + b0[4] * b1[1] + b0[5] * b1[2];
		b2[2] = b0[6] * b1[0] + b0[7] * b1[1] + b0[8] * b1[2];
		b2[3] = b0[0] * b1[3] + b0[1] * b1[4] + b0[2] * b1[5];
		b2[4] = b0[3] * b1[3] + b0[4] * b1[4] + b0[5] * b1[5];
		b2[5] = b0[6] * b1[3] + b0[7] * b1[4] + b0[8] * b1[5];
		b2[6] = b0[0] * b1[6] + b0[1] * b1[7] + b0[2] * b1[8];
		b2[7] = b0[3] * b1[6] + b0[4] * b1[7] + b0[5] * b1[8];
		b2[8] = b0[6] * b1[6] + b0[7] * b1[7] + b0[8] * b1[8];
	}
	public static multiplyArray(a: Float64Array, b: Float64Array, startA = 0, startB = 0, length = 3, out: Nullable<Float64Array> = null, outStart = 0): number {
		const sa = startA || 0;
		const sb = startB || 0;
		const so = outStart || 0;
		let s = 0;
		const len = length || Math.min(a.length, b.length);
		for (let i = 0; i < len; i++) {
			const t = a[i + sa] * b[i + sb];
			if (out) out[i + so] = t;
			s += t;
		}
		return s;
	}
	public static normalize(ary: Float64Array, start: number, length: number, scale = 1): void {
		let l = 0;
		const end = start + length;
		for (let i = start; i < end; i++) {
			l += ary[i] * ary[i];
		}
		if (l > 0) l = 1 / Math.sqrt(l);
		for (let i = start; i < end; i++) {
			ary[i] *= l * scale;
		}
	}
	public static quatToMat3(x: number, y: number, z: number, w: number, out: Float64Array): void {
		const o = out;
		const x2 = 2 * x, y2 = 2 * y, z2 = 2 * z;
		const xx = x * x2, yy = y * y2, zz = z * z2;
		const xy = x * y2, yz = y * z2, xz = x * z2;
		const wx = w * x2, wy = w * y2, wz = w * z2;
		o[0] = 1 - yy - zz;
		o[1] = xy - wz;
		o[2] = xz + wy;
		o[3] = xy + wz;
		o[4] = 1 - xx - zz;
		o[5] = yz - wx;
		o[6] = xz - wy;
		o[7] = yz + wx;
		o[8] = 1 - xx - yy;
	}
	public static rotateTransform(_tf: Float64Array, _rot: Float64Array): void {
		const tf = _tf, rot = _rot;
		const __tmp__00 = rot[0] * tf[3] + rot[1] * tf[6] + rot[2] * tf[9];
		const __tmp__01 = rot[0] * tf[4] + rot[1] * tf[7] + rot[2] * tf[10];
		const __tmp__02 = rot[0] * tf[5] + rot[1] * tf[8] + rot[2] * tf[11];
		const __tmp__10 = rot[3] * tf[3] + rot[4] * tf[6] + rot[5] * tf[9];
		const __tmp__11 = rot[3] * tf[4] + rot[4] * tf[7] + rot[5] * tf[10];
		const __tmp__12 = rot[3] * tf[5] + rot[4] * tf[8] + rot[5] * tf[11];
		const __tmp__20 = rot[6] * tf[3] + rot[7] * tf[6] + rot[8] * tf[9];
		const __tmp__21 = rot[6] * tf[4] + rot[7] * tf[7] + rot[8] * tf[10];
		const __tmp__22 = rot[6] * tf[5] + rot[7] * tf[8] + rot[8] * tf[11];
		tf[3] = __tmp__00;
		tf[4] = __tmp__01;
		tf[5] = __tmp__02;
		tf[6] = __tmp__10;
		tf[7] = __tmp__11;
		tf[8] = __tmp__12;
		tf[9] = __tmp__20;
		tf[10] = __tmp__21;
		tf[11] = __tmp__22;
	}
	public static rotateVec3(_v: Float64Array, _rot: Float64Array): void {
		const v = _v, rot = _rot;
		const __tmp__X = rot[0] * v[0] + rot[1] * v[1] + rot[2] * v[2];
		const __tmp__Y = rot[3] * v[0] + rot[4] * v[1] + rot[5] * v[2];
		const __tmp__Z = rot[6] * v[0] + rot[7] * v[1] + rot[8] * v[2];
		v[0] = __tmp__X; v[1] = __tmp__Y; v[2] = __tmp__Z;
	}
	public static rotateVecTo(x: number, y: number, z: number, rot: Float64Array, out: Float64Array): void {
		const o = out;
		const rx = rot[0] * x + rot[1] * y + rot[2] * z;
		const ry = rot[3] * x + rot[4] * y + rot[5] * z;
		const rz = rot[6] * x + rot[7] * y + rot[8] * z;
		o[0] = rx; o[1] = ry; o[2] = rz;
	}
	public static setXYZ(obj: { x: number, y: number, z: number }, x: number, y: number, z: number): { x: number, y: number, z: number } {
		obj.x = x; obj.y = y; obj.z = z;
		return obj;
	}
	public static setXYZW(obj: { x: number, y: number, z: number, w: number }, x: number, y: number, z: number, w: number): void {
		obj.x = x; obj.y = y; obj.z = z; obj.w = w;
	}
	public static setElements<T = Float64Array, E = number>(ele: T, start: number, ...es: E[]): T {
		for (let i = 0; i < es.length; i++) {
			(ele as any)[start + i] = es[i];
		}
		return ele;
	}
	public static setIncidentVertex(obj: Float64Array, x: number, y: number, wx: number, wy: number, wz: number, start = 0): void {
		obj[start] = x;
		obj[start + 1] = y;
		obj[start + 2] = wx;
		obj[start + 3] = wy;
		obj[start + 4] = wz;
	}
	public static setM3X3(obj: Float64Array, e00: number, e01: number, e02: number, e10: number, e11: number, e12: number, e20: number, e21: number, e22: number, start = 0): void {
		obj[start] = e00; obj[start + 1] = e01; obj[start + 2] = e02;
		obj[start + 3] = e10; obj[start + 4] = e11; obj[start + 5] = e12;
		obj[start + 6] = e20; obj[start + 7] = e21; obj[start + 8] = e22;
	}
	public static setTransformRotation(tf: Float64Array, rt: Float64Array): void {
		const t = tf, r = rt;
		t[3] = r[0]; t[4] = r[1]; t[5] = r[2];
		t[6] = r[3]; t[7] = r[4]; t[8] = r[5];
		t[9] = r[6]; t[10] = r[7]; t[11] = r[8];
	}
	public static setTransformOrientation(_tf: Float64Array, _quat: Float64Array): void {
		const tf = _tf, qt = _quat;
		const x = qt[0], y = qt[1], z = qt[2], w = qt[3];
		Method.quatToMat3(x, y, z, w, tf0);
		tf[3] = tf0[0];
		tf[4] = tf0[1];
		tf[5] = tf0[2];
		tf[6] = tf0[3];
		tf[7] = tf0[4];
		tf[8] = tf0[5];
		tf[9] = tf0[6];
		tf[10] = tf0[7];
		tf[11] = tf0[8];
	}
	public static subArray(a: Float64Array, b: Float64Array, out: Float64Array, startA = 0, startB = 0, startOut = 0, length = 3): Float64Array {
		const len = length || Math.min(a.length, b.length);
		for (let i = 0; i < len; i++) {
			out[i + startOut] = a[i + startA] - b[i + startB];
		}
		return out;
	}
	public static setJacobian(basisX: number, basisY: number, basisZ: number, vec1Elements: Float64Array, vec2Elements: Float64Array, outElements: Float64Array): void {
		const j = outElements, vec1 = vec1Elements, vec2 = vec2Elements;
		j[0] = basisX;
		j[1] = basisY;
		j[2] = basisZ;
		j[3] = basisX;
		j[4] = basisY;
		j[5] = basisZ;
		j[6] = vec1[1] * basisZ - vec1[2] * basisY;
		j[7] = vec1[2] * basisX - vec1[0] * basisZ;
		j[8] = vec1[0] * basisY - vec1[1] * basisX;
		j[9] = vec2[1] * basisZ - vec2[2] * basisY;
		j[10] = vec2[2] * basisX - vec2[0] * basisZ;
		j[11] = vec2[0] * basisY - vec2[1] * basisX;
	}
	public static setJacobianElements(jab: Float64Array, l1x: number, l1y: number, l1z: number, l2x: number, l2y: number, l2z: number, a1x: number, a1y: number, a1z: number, a2x: number, a2y: number, a2z: number): void {
		const j = jab;
		j[0] = l1x; j[1] = l1y; j[2] = l1z;
		j[3] = l2x; j[4] = l2y; j[5] = l2z;
		j[6] = a1x; j[7] = a1y; j[8] = a1z;
		j[9] = a2x; j[10] = a2y; j[11] = a2z;
	}
	public static scaleArray(a: Float64Array, s: number, out: Float64Array, startA = 0, startOut = 0, length = 3): Float64Array {
		const sa = startA;
		const so = startOut;
		const len = length || a.length;
		for (let i = 0; i < len; i++) {
			out[i + so] = a[i + sa] * s;
		}
		return out;
	}
	public static setRotFromTwoVec3(axis1X: number, axis1Y: number, axis1Z: number, axis2X: number, axis2Y: number, axis2Z: number, outQuat: Float64Array, outMat3: Float64Array): void {
		const ot = outMat3;
		const oq = outQuat;
		let d = axis1X * axis2X + axis1Y * axis2Y + axis1Z * axis2Z;
		if (d < -0.999999999) {
			Method.vecToQuat(axis1X, axis1Y, axis1Z, tv0);
		} else {
			Method.crossVectors(axis1X, axis1Y, axis1Z, axis2X, axis2Y, axis2Z, tv0);
			const w = Math.sqrt((1 + d) * 0.5);
			d = 0.5 / w;
			Method.scaleArray(tv0, d, tv0, 0, 0, 3);
			tv0[3] = w;
		}
		Method.setElements(oq, 0, tv0[0], tv0[1], tv0[2], tv0[3]);
		Method.quatToMat3(tv0[0], tv0[1], tv0[2], tv0[3], ot);
	}
	public static setBox(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, out: Float64Array): void {
		let ot = out;
		ot[0] = x1 < x2 ? x1 : x2; ot[1] = y1 < y2 ? y1 : y2; ot[2] = z1 < z2 ? z1 : z2;
		ot[3] = x1 < x2 ? x2 : x1; ot[4] = y1 < y2 ? y2 : y1; ot[5] = z1 < z2 ? z2 : z1;
	}
	public static transformVec3(_tf: Float64Array, vec3: Float64Array, op: TRANSFORM_OPTION = TRANSFORM_OPTION.TRANSLATE_ROTATE, out: Float64Array, vecStart = 0, outStart = 0): void {
		const v = vec3, tf = _tf;
		let vX = v[vecStart], vY = v[vecStart + 1], vZ = v[vecStart + 2];
		if (op !== TRANSFORM_OPTION.TRANSLATE) {
			vX = tf[3] * v[0] + tf[4] * v[1] + tf[5] * v[2];
			vY = tf[6] * v[0] + tf[7] * v[1] + tf[8] * v[2];
			vZ = tf[9] * v[0] + tf[10] * v[1] + tf[11] * v[2];
		}
		if (op !== TRANSFORM_OPTION.ROTATE) {
			vX += tf[0]; vY += tf[1]; vZ += tf[2];
		}
		const es = out;
		es[outStart] = vX; es[outStart + 1] = vY; es[outStart + 2] = vZ;
	}
	public static transformM3(tf: Float64Array, lb: Float64Array, out: Float64Array): void {
		const tf1 = tf;
		const bs1 = lb;
		const b1 = out;
		b1[0] = tf1[3] * bs1[0] + tf1[4] * bs1[1] + tf1[5] * bs1[2];
		b1[1] = tf1[6] * bs1[0] + tf1[7] * bs1[1] + tf1[8] * bs1[2];
		b1[2] = tf1[9] * bs1[0] + tf1[10] * bs1[1] + tf1[11] * bs1[2];
		b1[3] = tf1[3] * bs1[3] + tf1[4] * bs1[4] + tf1[5] * bs1[5];
		b1[4] = tf1[6] * bs1[3] + tf1[7] * bs1[4] + tf1[8] * bs1[5];
		b1[5] = tf1[9] * bs1[3] + tf1[10] * bs1[4] + tf1[11] * bs1[5];
		b1[6] = tf1[3] * bs1[6] + tf1[4] * bs1[7] + tf1[5] * bs1[8];
		b1[7] = tf1[6] * bs1[6] + tf1[7] * bs1[7] + tf1[8] * bs1[8];
		b1[8] = tf1[9] * bs1[6] + tf1[10] * bs1[7] + tf1[11] * bs1[8];
	}
	public static transposeM33(src: Float64Array, dst: Float64Array): Float64Array {
		dst[0] = src[0];
		dst[1] = src[3];
		dst[2] = src[6];
		dst[3] = src[1];
		dst[4] = src[4];
		dst[5] = src[7];
		dst[6] = src[2];
		dst[7] = src[5];
		dst[8] = src[8];
		return dst;
	}
	public static vecToQuat(x: number, y: number, z: number, out: Float64Array): void {
		const o = out;
		let vX: number, vY: number, vZ: number;
		const x2 = x * x, y2 = y * y, z2 = z * z;
		let d: number;
		if (x2 < y2) {
			if (x2 < z2) {
				d = 1 / Math.sqrt(y2 + z2);
				vX = 0; vY = z * d; vZ = -y * d;
			} else {
				d = 1 / Math.sqrt(x2 + y2);
				vX = y * d; vY = -x * d; vZ = 0;
			}
		} else if (y2 < z2) {
			d = 1 / Math.sqrt(z2 + x2);
			vX = -z * d; vY = 0; vZ = x * d;
		} else {
			d = 1 / Math.sqrt(x2 + y2);
			vX = y * d; vY = -x * d; vZ = 0;
		}
		o[0] = vX; o[1] = vY; o[2] = vZ; o[3] = 0;
	}

}


export {
	DEFAULT_33,
	Method,
	TRANSFORM_OPTION,
};