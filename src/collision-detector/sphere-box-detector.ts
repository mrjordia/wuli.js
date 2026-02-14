import Detector from "./detector";
import DetectorResult from "./detector-result";
import SphereGeometry from '../shape/sphere-geometry';
import BoxGeometry from '../shape/box-geometry';
import Transform from "../common/transform";
import CachedDetectorData from "./cached-detector-data";


export default class SphereBoxDetector extends Detector<SphereGeometry, BoxGeometry> {
	constructor(swapped : boolean) {
		super(swapped);
	}
	protected detectImpl(result : DetectorResult, geom1 : SphereGeometry, geom2 : BoxGeometry, _tf1 : Transform, _tf2 : Transform, cachedData : CachedDetectorData) : void {
		const tf1 = _tf1.elements, tf2 = _tf2.elements;
		const b = geom2;
		result.incremental = false;
		const bs = b.size;
		let ex = bs[0], ey = bs[1], ez = bs[2];
		let nex = -ex, ney = -ey, nez = -ez;
		const r = geom1.radius;
		const bsx = tf1[0] - tf2[0], bsy = tf1[1] - tf2[1], bsz = tf1[2] - tf2[2];
		const bix = tf2[3] * bsx + tf2[6] * bsy + tf2[9] * bsz, biy = tf2[4] * bsx + tf2[7] * bsy + tf2[10] * bsz, biz = tf2[5] * bsx + tf2[8] * bsy + tf2[11] * bsz;
		if (nex < bix && ex > bix && ney < biy && ey > biy && nez < biz && ez > biz) {
			let bfx = bix < 0 ? -bix : bix, bfy = biy < 0 ? -biy : biy, bfz = biz < 0 ? -biz : biz;
			bfx = ex - bfx; bfy = ey - bfy; bfz = ez - bfz;
			let nbx : number, nby : number, nbz : number;
			const distX = bfx, distY = bfy, distZ = bfz;
			let depth : number;
			let projectionMaskX : number, projectionMaskY : number, projectionMaskZ : number;
			if (distX < distY) {
				if (distX < distZ) {
					if (bix > 0) {
						nbx = 1; nby = 0; nbz = 0;
					} else {
						nbx = -1; nby = 0; nbz = 0;
					}
					projectionMaskX = 0; projectionMaskY = 1; projectionMaskZ = 1;
					depth = distX;
				} else {
					if (biz > 0) {
						nbx = 0; nby = 0; nbz = 1;
					} else {
						nbx = 0; nby = 0; nbz = -1;
					}
					projectionMaskX = 1; projectionMaskY = 1; projectionMaskZ = 0;
					depth = distZ;
				}
			} else if (distY < distZ) {
				if (biy > 0) {
					nbx = 0; nby = 1; nbz = 0;
				} else {
					nbx = 0; nby = -1; nbz = 0;
				}
				projectionMaskX = 1; projectionMaskY = 0; projectionMaskZ = 1;
				depth = distY;
			} else {
				if (biz > 0) {
					nbx = 0; nby = 0; nbz = 1;
				} else {
					nbx = 0; nby = 0; nbz = -1;
				}
				projectionMaskX = 1; projectionMaskY = 1; projectionMaskZ = 0;
				depth = distZ;
			}
			const baseX = projectionMaskX * bix, baseY = projectionMaskY * biy, baseZ = projectionMaskZ * biz;
			let pix = nbx * ex, piy = nby * ey, piz = nbz * ez;
			pix += baseX; piy += baseY; piz += baseZ;
			const cpx = tf2[3] * pix + tf2[4] * piy + tf2[5] * piz, cpy = tf2[6] * pix + tf2[7] * piy + tf2[8] * piz, cpz = tf2[9] * pix + tf2[10] * piy + tf2[11] * piz;
			const nx = tf2[3] * nbx + tf2[4] * nby + tf2[5] * nbz, ny = tf2[6] * nbx + tf2[7] * nby + tf2[8] * nbz, nz = tf2[9] * nbx + tf2[10] * nby + tf2[11] * nbz;
			this.setNormal(result, nx, ny, nz);
			const pos1X = tf1[0] + nx * -r, pos1Y = tf1[1] + ny * -r, pos1Z = tf1[2] + nz * -r;
			const pos2X = tf2[0] + cpx, pos2Y = tf2[1] + cpy, pos2Z = tf2[2] + cpz;
			this.addPoint(result, pos1X, pos1Y, pos1Z, pos2X, pos2Y, pos2Z, depth, 0);
			return;
		}
		ex -= 1e-9; ey -= 1e-9; ez -= 1e-9;
		nex += 1e-9; ney += 1e-9; nez += 1e-9;
		let pix = bix < ex ? bix : ex, piy = biy < ey ? biy : ey, piz = biz < ez ? biz : ez;
		if (!(pix > nex)) {
			pix = nex;
		}
		if (!(piy > ney)) {
			piy = ney;
		}
		if (!(piz > nez)) {
			piz = nez;
		}
		let psx = bix - pix, psy = biy - piy, psz = biz - piz;
		let dist = psx * psx + psy * psy + psz * psz;
		if (dist >= r * r) {
			return;
		}
		dist = Math.sqrt(dist);
		let cpx = tf2[3] * pix + tf2[4] * piy + tf2[5] * piz, cpy = tf2[6] * pix + tf2[7] * piy + tf2[8] * piz, cpz = tf2[9] * pix + tf2[10] * piy + tf2[11] * piz;
		let ptx = tf2[3] * psx + tf2[4] * psy + tf2[5] * psz, pty = tf2[6] * psx + tf2[7] * psy + tf2[8] * psz, ptz = tf2[9] * psx + tf2[10] * psy + tf2[11] * psz;
		let l = ptx * ptx + pty * pty + ptz * ptz;
		if (l > 0) {
			l = 1 / Math.sqrt(l);
		}
		const nx = ptx * l, ny = pty * l, nz = ptz * l;
		this.setNormal(result, nx, ny, nz);
		let pos1X = tf1[0] + nx * -r, pos1Y = tf1[1] + ny * -r, pos1Z = tf1[2] + nz * -r;
		let pos2X = tf2[0] + cpx, pos2Y = tf2[1] + cpy, pos2Z = tf2[2] + cpz;
		this.addPoint(result, pos1X, pos1Y, pos1Z, pos2X, pos2Y, pos2Z, r - dist, 0);
	}
}