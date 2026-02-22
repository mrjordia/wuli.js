import Transform from "../common/transform";
import Aabb from "../common/aabb";
import Vec3 from "../common/vec3";
import Method from "../common/method";
import ShapeConfig from "./shape-config";
import Geometry from "./geometry";
import ContactCallback from "../common/contact-callback";
import RigidBody from "../rigid-body/rigid-body";
import PhysicsProxy from "../broad-phase/physics-proxy";
import { Nullable } from "../common/nullable";

export default class Shape {
	public id = -1;
	public localTransform = new Transform();
	public ptransform = new Transform();
	public transform = new Transform();
	public restitution: number;
	public friction: number;
	public geometry: Geometry;
	public collisionGroup: number;
	public collisionMask: number;
	public contactCallback: Nullable<ContactCallback>;
	public aabb = new Aabb();
	public proxy: Nullable<PhysicsProxy>;
	public rigidBody: Nullable<RigidBody>;
	public prev: Nullable<Shape>;
	public next: Nullable<Shape>;
	public displacement = new Vec3();

	private _density: Nullable<number>;

	constructor(config: ShapeConfig) {
		Method.combineMat3Vec3ToTransform(config.position.elements, config.rotation.elements, this.localTransform.elements);
		Method.copyElements(this.localTransform.elements, this.ptransform.elements);
		Method.copyElements(this.localTransform.elements, this.transform.elements);
		this.restitution = config.restitution;
		this.friction = config.friction;
		this.density = config.density;
		this.geometry = config.geometry;
		this.collisionGroup = config.collisionGroup;
		this.collisionMask = config.collisionMask;
		this.contactCallback = config.contactCallback;
	}

	public setLocalTransform(transform: Transform): void {
		Method.copyElements(transform.elements, this.localTransform.elements);
		if (this.rigidBody) {
			const _this = this.rigidBody;
			_this.updateMass();
			const tf1 = _this.ptransform.elements;
			const tf2 = _this.transform.elements;
			let s = _this.shapeList;
			while (s) {
				const n = s.next;
				const dst = s.ptransform.elements;
				const src1 = s.localTransform.elements;
				dst[3] = tf1[3] * src1[3] + tf1[4] * src1[6] + tf1[5] * src1[9];
				dst[4] = tf1[3] * src1[4] + tf1[4] * src1[7] + tf1[5] * src1[10];
				dst[5] = tf1[3] * src1[5] + tf1[4] * src1[8] + tf1[5] * src1[11];
				dst[6] = tf1[6] * src1[3] + tf1[7] * src1[6] + tf1[8] * src1[9];
				dst[7] = tf1[6] * src1[4] + tf1[7] * src1[7] + tf1[8] * src1[10];
				dst[8] = tf1[6] * src1[5] + tf1[7] * src1[8] + tf1[8] * src1[11];
				dst[9] = tf1[9] * src1[3] + tf1[10] * src1[6] + tf1[11] * src1[9];
				dst[10] = tf1[9] * src1[4] + tf1[10] * src1[7] + tf1[11] * src1[10];
				dst[11] = tf1[9] * src1[5] + tf1[10] * src1[8] + tf1[11] * src1[11];
				dst[0] = tf1[3] * src1[0] + tf1[4] * src1[1] + tf1[5] * src1[2];
				dst[1] = tf1[6] * src1[0] + tf1[7] * src1[1] + tf1[8] * src1[2];
				dst[2] = tf1[9] * src1[0] + tf1[10] * src1[1] + tf1[11] * src1[2];
				dst[0] += tf1[0];
				dst[1] += tf1[1];
				dst[2] += tf1[2];
				const dst1 = s.transform.elements;
				const src11 = s.localTransform.elements;
				dst1[3] = tf2[3] * src11[3] + tf2[4] * src11[6] + tf2[5] * src11[9];
				dst1[4] = tf2[3] * src11[4] + tf2[4] * src11[7] + tf2[5] * src11[10];
				dst1[5] = tf2[3] * src11[5] + tf2[4] * src11[8] + tf2[5] * src11[11];
				dst1[6] = tf2[6] * src11[3] + tf2[7] * src11[6] + tf2[8] * src11[9];
				dst1[7] = tf2[6] * src11[4] + tf2[7] * src11[7] + tf2[8] * src11[10];
				dst1[8] = tf2[6] * src11[5] + tf2[7] * src11[8] + tf2[8] * src11[11];
				dst1[9] = tf2[9] * src11[3] + tf2[10] * src11[6] + tf2[11] * src11[9];
				dst1[10] = tf2[9] * src11[4] + tf2[10] * src11[7] + tf2[11] * src11[10];
				dst1[11] = tf2[9] * src11[5] + tf2[10] * src11[8] + tf2[11] * src11[11];
				dst1[0] = tf2[3] * src11[0] + tf2[4] * src11[1] + tf2[5] * src11[2];
				dst1[1] = tf2[6] * src11[0] + tf2[7] * src11[1] + tf2[8] * src11[2];
				dst1[2] = tf2[9] * src11[0] + tf2[10] * src11[1] + tf2[11] * src11[2];
				dst1[0] += tf2[0];
				dst1[1] += tf2[1];
				dst1[2] += tf2[2];
				s.geometry.computeAabb(s.aabb, s.ptransform);
				const aabb = s.aabb.elements;
				const minX = aabb[0], minY = aabb[1], minZ = aabb[2];
				const maxX = aabb[3], maxY = aabb[4], maxZ = aabb[5];
				s.geometry.computeAabb(s.aabb, s.transform);
				aabb[0] = minX < aabb[0] ? minX : aabb[0];
				aabb[1] = minY < aabb[1] ? minY : aabb[1];
				aabb[2] = minZ < aabb[2] ? minZ : aabb[2];
				aabb[3] = maxX > aabb[3] ? maxX : aabb[3];
				aabb[4] = maxY > aabb[4] ? maxY : aabb[4];
				aabb[5] = maxZ > aabb[5] ? maxZ : aabb[5];
				if (s.proxy) {
					const v = s.displacement.elements, transform = s.transform.elements, ptransform = s.ptransform.elements;
					v[0] = transform[0] - ptransform[0];
					v[1] = transform[1] - ptransform[1];
					v[2] = transform[2] - ptransform[2];
					s.rigidBody!.world!.broadPhase.moveProxy(s.proxy, s.aabb, s.displacement);
				}
				s = n!;
			}
		}
	}
	public get density(): number {
		return this._density ? this._density : 1;
	}
	public set density(density: number) {
		this._density = density;
		if (this.rigidBody) {
			const _this = this.rigidBody;
			_this.updateMass();
			const tf1 = _this.ptransform.elements;
			const tf2 = _this.transform.elements;
			let s = _this.shapeList;
			while (s) {
				const n = s.next;
				const dst = s.ptransform.elements;
				const src1 = s.localTransform.elements;
				dst[3] = tf1[3] * src1[3] + tf1[4] * src1[6] + tf1[5] * src1[9];
				dst[4] = tf1[3] * src1[4] + tf1[4] * src1[7] + tf1[5] * src1[10];
				dst[5] = tf1[3] * src1[5] + tf1[4] * src1[8] + tf1[5] * src1[11];
				dst[6] = tf1[6] * src1[3] + tf1[7] * src1[6] + tf1[8] * src1[9];
				dst[7] = tf1[6] * src1[4] + tf1[7] * src1[7] + tf1[8] * src1[10];
				dst[8] = tf1[6] * src1[5] + tf1[7] * src1[8] + tf1[8] * src1[11];
				dst[9] = tf1[9] * src1[3] + tf1[10] * src1[6] + tf1[11] * src1[9];
				dst[10] = tf1[9] * src1[4] + tf1[10] * src1[7] + tf1[11] * src1[10];
				dst[11] = tf1[9] * src1[5] + tf1[10] * src1[8] + tf1[11] * src1[11];
				dst[0] = tf1[3] * src1[0] + tf1[4] * src1[1] + tf1[5] * src1[2];
				dst[1] = tf1[6] * src1[0] + tf1[7] * src1[1] + tf1[8] * src1[2];
				dst[2] = tf1[9] * src1[0] + tf1[10] * src1[1] + tf1[11] * src1[2];
				dst[0] += tf1[0];
				dst[1] += tf1[1];
				dst[2] += tf1[2];
				const dst1 = s.transform.elements;
				const src11 = s.localTransform.elements;
				dst1[3] = tf2[3] * src11[3] + tf2[4] * src11[6] + tf2[5] * src11[9];
				dst1[4] = tf2[3] * src11[4] + tf2[4] * src11[7] + tf2[5] * src11[10];
				dst1[5] = tf2[3] * src11[5] + tf2[4] * src11[8] + tf2[5] * src11[11];
				dst1[6] = tf2[6] * src11[3] + tf2[7] * src11[6] + tf2[8] * src11[9];
				dst1[7] = tf2[6] * src11[4] + tf2[7] * src11[7] + tf2[8] * src11[10];
				dst1[8] = tf2[6] * src11[5] + tf2[7] * src11[8] + tf2[8] * src11[11];
				dst1[9] = tf2[9] * src11[3] + tf2[10] * src11[6] + tf2[11] * src11[9];
				dst1[10] = tf2[9] * src11[4] + tf2[10] * src11[7] + tf2[11] * src11[10];
				dst1[11] = tf2[9] * src11[5] + tf2[10] * src11[8] + tf2[11] * src11[11];
				dst1[0] = tf2[3] * src11[0] + tf2[4] * src11[1] + tf2[5] * src11[2];
				dst1[1] = tf2[6] * src11[0] + tf2[7] * src11[1] + tf2[8] * src11[2];
				dst1[2] = tf2[9] * src11[0] + tf2[10] * src11[1] + tf2[11] * src11[2];
				dst1[0] += tf2[0];
				dst1[1] += tf2[1];
				dst1[2] += tf2[2];
				s.geometry.computeAabb(s.aabb, s.ptransform);
				const aabb = s.aabb.elements;
				const minX = aabb[0], minY = aabb[1], minZ = aabb[2];
				const maxX = aabb[3], maxY = aabb[4], maxZ = aabb[5];
				s.geometry.computeAabb(s.aabb, s.transform);
				aabb[0] = minX < aabb[0] ? minX : aabb[0];
				aabb[1] = minY < aabb[1] ? minY : aabb[1];
				aabb[2] = minZ < aabb[2] ? minZ : aabb[2];
				aabb[3] = maxX > aabb[3] ? maxX : aabb[3];
				aabb[4] = maxY > aabb[4] ? maxY : aabb[4];
				aabb[5] = maxZ > aabb[5] ? maxZ : aabb[5];
				if (s.proxy) {
					const v = s.displacement.elements, transform = this.transform.elements, ptransform = this.ptransform.elements;
					v[0] = transform[0] - ptransform[0];
					v[1] = transform[1] - ptransform[1];
					v[2] = transform[2] - ptransform[2];
					s.rigidBody!.world!.broadPhase.moveProxy(s.proxy, s.aabb, s.displacement);
				}
				s = n!;
			}
		}
	}

}