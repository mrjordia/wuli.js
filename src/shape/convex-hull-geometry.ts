import ConvexGeometry from "./convex-geometry";
import { GEOMETRY_TYPE } from '../constant';
import Vec3 from "../common/vec3";
import Method from "../common/method";
import Aabb from "../common/aabb";
import Transform from "../common/transform";

export default class ConvexHullGeometry extends ConvexGeometry {
	public numVertices: number;
	public vertices: Array<Vec3>;
	public tmpVertices: Array<Vec3>;

	constructor(vertices: Array<{ x: number, y: number, z: number }>) {
		super(GEOMETRY_TYPE.CONVEX_HULL);
		this.numVertices = vertices.length;
		this.vertices = new Array(this.numVertices);
		this.tmpVertices = new Array(this.numVertices);
		let _g = 0, _g1 = this.numVertices;
		while (_g < _g1) {
			let i = _g++;
			this.vertices[i] = new Vec3();
			Method.setXYZ(this.vertices[i], vertices[i].x, vertices[i].y, vertices[i].z);
			this.tmpVertices[i] = new Vec3();
		}
		this._useGjkRayCast = true;
		this.updateMass();
	}
	public updateMass(): void {
		const icf = this.inertiaCoeff, vertices = this.vertices;
		this.volume = 1;
		icf[0] = 1; icf[1] = 0; icf[2] = 0;
		icf[3] = 0; icf[4] = 1; icf[5] = 0;
		icf[6] = 0; icf[7] = 0; icf[8] = 1;
		let es = vertices[0].elements;
		let minx = es[0], miny = es[1], minz = es[2];
		let maxx = es[0], maxy = es[1], maxz = es[2];
		let _g = 1, _g1 = this.numVertices;
		while (_g < _g1) {
			const i = _g++;
			es = vertices[i].elements;
			const vx = es[0], vy = es[1], vz = es[2];
			if (vx < minx) {
				minx = vx;
			} else if (vx > maxx) {
				maxx = vx;
			}
			if (vy < miny) {
				miny = vy;
			} else if (vy > maxy) {
				maxy = vy;
			}
			if (vz < minz) {
				minz = vz;
			} else if (vz > maxz) {
				maxz = vz;
			}
		}
		let sizex = maxx - minx, sizey = maxy - miny, sizez = maxz - minz;
		this.volume = sizex * sizey * sizez;
		const diffCog = ((minx + maxx) * (minx + maxx) + (miny + maxy) * (miny + maxy) + (minz + maxz) * (minz + maxz)) * 0.25;
		sizex = sizex * sizex * 0.25; sizey = sizey * sizey * 0.25; sizez = sizez * sizez * 0.25;
		icf[0] = 0.33333333333333331 * (sizey + sizez) + diffCog;
		icf[1] = 0;
		icf[2] = 0;
		icf[3] = 0;
		icf[4] = 0.33333333333333331 * (sizez + sizex) + diffCog;
		icf[5] = 0;
		icf[6] = 0;
		icf[7] = 0;
		icf[8] = 0.33333333333333331 * (sizex + sizey) + diffCog;
	}
	public computeAabb(_aabb: Aabb, _tf: Transform): void {
		const gjm = this.gjkMargin, vertices = this.vertices;
		const aabb = _aabb.elements, tf = _tf.elements;
		const marginX = gjm, marginY = gjm, marginZ = gjm;
		let v = vertices[0].elements;
		let localVX = v[0], localVY = v[1], localVZ = v[2];
		let worldVX = tf[3] * localVX + tf[4] * localVY + tf[5] * localVZ;
		let worldVY = tf[6] * localVX + tf[7] * localVY + tf[8] * localVZ;
		let worldVZ = tf[9] * localVX + tf[10] * localVY + tf[11] * localVZ;
		worldVX += tf[0]; worldVY += tf[1]; worldVZ += tf[2];
		let minX = worldVX, minY = worldVY, minZ = worldVZ;
		let maxX = worldVX, maxY = worldVY, maxZ = worldVZ;
		let _g = 1, _g1 = this.numVertices;
		while (_g < _g1) {
			v = vertices[_g++].elements;
			localVX = v[0]; localVY = v[1]; localVZ = v[2];
			worldVX = tf[3] * localVX + tf[4] * localVY + tf[5] * localVZ;
			worldVY = tf[6] * localVX + tf[7] * localVY + tf[8] * localVZ;
			worldVZ = tf[9] * localVX + tf[10] * localVY + tf[11] * localVZ;
			worldVX += tf[0]; worldVY += tf[1]; worldVZ += tf[2];
			if (!(minX < worldVX)) minX = worldVX;
			if (!(minY < worldVY)) minY = worldVY;
			if (!(minZ < worldVZ)) minZ = worldVZ;
			if (!(maxX > worldVX)) maxX = worldVX;
			if (!(maxY > worldVY)) maxY = worldVY;
			if (!(maxZ > worldVZ)) maxZ = worldVZ;
		}
		aabb[0] = minX - marginX; aabb[1] = minY - marginY; aabb[2] = minZ - marginZ;
		aabb[3] = maxX + marginX; aabb[4] = maxY + marginY; aabb[5] = maxZ + marginZ;
		Method.copyElements(aabb, this.aabbComputed.elements);
	}
	public computeLocalSupportingVertex(_dir: Vec3, _out: Vec3): void {
		const dir = _dir.elements, out = _out.elements;
		let _this = this.vertices[0].elements;
		let maxDot = _this[0] * dir[0] + _this[1] * dir[1] + _this[2] * dir[2];
		let maxIndex = 0;
		let _g = 1, _g1 = this.numVertices;
		while (_g < _g1) {
			let i = _g++;
			_this = this.vertices[i].elements;
			const dot = _this[0] * dir[0] + _this[1] * dir[1] + _this[2] * dir[2];
			if (dot > maxDot) {
				maxDot = dot;
				maxIndex = i;
			}
		}
		const v = this.vertices[maxIndex].elements;
		out[0] = v[0]; out[1] = v[1]; out[2] = v[2];
	}
}