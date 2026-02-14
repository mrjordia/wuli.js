import { CONSTANT, RIGID_BODY_TYPE } from "../constant";
import MassData from "./mass-data";
import Transform from "../common/transform";
import Vec3 from "../common/vec3";
import Quat from "../common/quat";
import Method from "../common/method";
import Mat3 from "../common/mat3";
import { RigidBodyConfig } from "./rigid-body-config";
import ContactLink from "../constraint/contact/contact-link";
import Shape from "../shape/shape";
import { World } from "../world";
import JointLink from "../constraint/joint/joint-link";
import { Nullable } from "../common/nullable";


interface IObject3D {
	userData: any,
	uuid: string,
	position: { x: number, y: number, z: number },
	quaternion: { x: number, y: number, z: number, w: number }
}


export default class RigidBody {

	private _shapeListLast: Nullable<Shape>;
	private _numShapes = 0;
	private _tV0 = new Vec3();
	private _tV1 = new Vec3();
	private _tV2 = new Vec3();
	private _tQ0 = new Quat();
	private _tM0 = new Mat3();
	private _gravityScale = 1;
	private _autoSleep: boolean;
	private _mass = 0;
	private _invMass = 0;
	private _linearDamping: number;
	private _angularDamping: number;
	private _ptransform = new Transform();
	private _transform = new Transform();
	private _type: RIGID_BODY_TYPE;
	private _shapeList: Nullable<Shape>;

	public rotFactor = new Vec3(1, 1, 1);
	public object3Ds: Array<IObject3D> = [];
	public readonly name: string;
	public next: Nullable<RigidBody>;
	public prev: Nullable<RigidBody>;
	public contactLinkList: Nullable<ContactLink>;
	public contactLinkListLast: Nullable<ContactLink>;
	public numContactLinks = 0;
	public jointLinkList: Nullable<JointLink>;
	public jointLinkListLast: Nullable<JointLink>;
	public numJointLinks = 0;
	public sleepTime = 0;
	public sleeping = false;
	public addedToIsland = false;
	public world: Nullable<World>;
	public vel = new Float64Array(3);
	public angVel = new Float64Array(3);
	public pseudoVel = new Float64Array(3);
	public angPseudoVel = new Float64Array(3);
	public force = new Float64Array(3);
	public torque = new Float64Array(3);
	public linearContactImpulse = new Float64Array(3);
	public angularContactImpulse = new Float64Array(3);
	public localInertia = new Float64Array(9);
	public invLocalInertia = new Float64Array(9);
	public invLocalInertiaWithoutRotFactor = new Float64Array(9);
	public invInertia = new Float64Array(9);

	constructor(config: RigidBodyConfig) {
		this.name = config.name;
		const v = config.linearVelocity.elements;
		Method.copyElements(v, this.vel);
		const v1 = config.angularVelocity.elements;
		Method.copyElements(v1, this.angVel);
		Method.combineMat3Vec3ToTransform(config.position.elements, config.rotation.elements, this._ptransform.elements);
		Method.copyElements(this._ptransform.elements, this._transform.elements);
		this._type = config.type;
		this._autoSleep = config.autoSleep;
		this._linearDamping = config.linearDamping;
		this._angularDamping = config.angularDamping;
	}

	public get autoSleep(): boolean {
		return this._autoSleep;
	}
	public set autoSleep(autoSleepEnabled: boolean) {
		this._autoSleep = autoSleepEnabled;
		this.sleeping = false;
		this.sleepTime = 0;
	}
	public get invMass(): number {
		return this._invMass
	}
	public get linearDamping(): number {
		return this._linearDamping;
	}
	public set linearDamping(damping: number) {
		this._linearDamping = damping;
	}

	public get angularDamping(): number {
		return this._angularDamping;
	}

	public get shapeList(): Shape {
		return this._shapeList!;
	}
	public get ptransform(): Transform {
		return this._ptransform;
	}
	public get transform(): Transform {
		return this._transform;
	}
	public get mass(): number {
		return this._mass;
	}
	public get gravityScale(): number {
		return this._gravityScale;
	}
	public set gravityScale(gravityScale: number) {
		this._gravityScale = gravityScale;
		this.sleeping = false;
		this.sleepTime = 0;
	}
	public get type(): RIGID_BODY_TYPE {
		return this._type;
	}
	public set type(type: RIGID_BODY_TYPE) {
		this._type = type;
		this.updateMass();
	}
	public addShape(shape: Shape): void {
		if (!this._shapeList) {
			this._shapeList = shape;
			this._shapeListLast = shape;
		} else {
			this._shapeListLast!.next = shape;
			shape.prev = this._shapeListLast;
			this._shapeListLast = shape;
		}
		this._numShapes++;
		shape.rigidBody = this;
		if (this.world) {
			let _this = this.world;
			shape.proxy = _this.broadPhase.createProxy(shape, shape.aabb);
			shape.id = _this.shapeIdCount++;
			_this.numShapes++;
		}
		this.updateMass();
		this._updateShapeList();
	}
	public removeShape(shape: Shape): void {
		let prev = shape.prev;
		let next = shape.next;
		if (prev) {
			prev.next = next;
		}
		if (next) {
			next.prev = prev;
		}
		if (shape === this._shapeList) {
			this._shapeList = this._shapeList.next;
		}
		if (shape === this._shapeListLast) {
			this._shapeListLast = this._shapeListLast.prev;
		}
		shape.next = null;
		shape.prev = null;
		this._numShapes--;
		shape.rigidBody = null;
		if (this.world) {
			const _this = this.world;
			_this.broadPhase.destroyProxy(shape.proxy!);
			shape.proxy = null;
			shape.id = -1;
			let cl = shape.rigidBody!.contactLinkList;
			while (cl) {
				const n = cl.next;
				const c = cl.contact!;
				if (c.shape1 === shape || c.shape2 === shape) {
					const _this1 = cl.other!;
					_this1.sleeping = false;
					_this1.sleepTime = 0;
					const _this2 = _this.contactManager;
					const prev = c.prev;
					const next = c.next;
					if (prev) {
						prev.next = next;
					}
					if (next) {
						next.prev = prev;
					}
					if (c === _this2.contactList) {
						_this2.contactList = _this2.contactList.next!;
					}
					if (c === _this2.contactListLast) {
						_this2.contactListLast = _this2.contactListLast.prev!;
					}
					c.next = null;
					c.prev = null;
					if (c.touching) {
						const cc1 = c.shape1!.contactCallback;
						let cc2 = c.shape2!.contactCallback;
						if (cc1 === cc2) {
							cc2 = null;
						}
						if (cc1) {
							cc1.endContact(c);
						}
						if (cc2) {
							cc2.endContact(c);
						}
					}
					const prev1 = c.link1.prev;
					const next1 = c.link1.next;
					if (prev1) {
						prev1.next = next1;
					}
					if (next1) {
						next1.prev = prev1;
					}
					if (c.link1 === c.rigidBody1!.contactLinkList) {
						c.rigidBody1!.contactLinkList = c.rigidBody1!.contactLinkList.next;
					}
					if (c.link1 === c.rigidBody1!.contactLinkListLast) {
						c.rigidBody1!.contactLinkListLast = c.rigidBody1!.contactLinkListLast.prev;
					}
					c.link1.next = null;
					c.link1.prev = null;
					const prev2 = c.link2.prev;
					const next2 = c.link2.next;
					if (prev2) {
						prev2.next = next2;
					}
					if (next2) {
						next2.prev = prev2;
					}
					if (c.link2 === c.rigidBody2!.contactLinkList) {
						c.rigidBody2!.contactLinkList = c.rigidBody2!.contactLinkList.next;
					}
					if (c.link2 === c.rigidBody2!.contactLinkListLast) {
						c.rigidBody2!.contactLinkListLast = c.rigidBody2!.contactLinkListLast.prev;
					}
					c.link2.next = null;
					c.link2.prev = null;
					c.rigidBody1!.numContactLinks--;
					c.rigidBody2!.numContactLinks--;
					c.link1.other = null;
					c.link2.other = null;
					c.link1.contact = null;
					c.link2.contact = null;
					c.shape1 = null;
					c.shape2 = null;
					c.rigidBody1 = null;
					c.rigidBody2 = null;
					c.touching = false;
					c.cachedDetectorData.clear();
					c.manifold.clear();
					c.detector = null;
					const _this3 = c.contactConstraint;
					_this3.shape1 = null;
					_this3.shape2 = null;
					_this3.rigidBody1 = null;
					_this3.rigidBody2 = null;
					_this3.transform1 = null;
					_this3.transform2 = null;
					c.next = _this2.contactPool;
					_this2.contactPool = c;
					_this2.numContacts--;
				}
				cl = n;
			}
			_this.numShapes--;
		}
		this.updateMass();
		this._updateShapeList();
	}
	public addObject3D(...object3Ds: IObject3D[]): void {
		for (let obj of object3Ds) {
			const idx = this.object3Ds.findIndex((o) => o.uuid === obj.uuid);
			if (idx < 0) {
				this.object3Ds.push(obj);
				obj.userData.rigidBody = this;
			}
		}
	}
	public removeObject3D(...object3Ds: IObject3D[]): void {
		for (let obj of object3Ds) {
			const idx = this.object3Ds.findIndex((o) => o.uuid === obj.uuid);
			if (idx < 0) continue;
			this.object3Ds.splice(idx, 1);
			obj.userData.rigidBody = null;
		}
	}
	public clearObject3D(): void {
		this.removeObject3D(...this.object3Ds);
	}
	public updateObject3Ds(): void {
		for (let o3d of this.object3Ds) {
			this.getPositionTo(o3d.position);
			this.getOrientationTo(o3d.quaternion);
		}
	}
	public translate(_translation: { x: number, y: number, z: number }): void {
		let translation = new Float64Array([_translation.x, _translation.y, _translation.z]);
		let diffX = translation[0], diffY = translation[1], diffZ = translation[2];
		let transform = this._transform.elements;
		transform[0] += diffX; transform[1] += diffY; transform[2] += diffZ;
		Method.copyElements(this._transform.elements, this._ptransform.elements);
		this._updateShapeList();
		this.sleeping = false;
		this.sleepTime = 0;
	}

	public getPositionTo(position: { x: number, y: number, z: number }): { x: number, y: number, z: number } {
		const transform = this._transform.elements;
		Method.setXYZ(position, transform[0], transform[1], transform[2]);
		return position;
	}
	public setPosition(_position: { x: number, y: number, z: number }): void {
		const position = new Float64Array([_position.x, _position.y, _position.z]);
		const transform = this._transform.elements;
		transform[0] = position[0]; transform[1] = position[1]; transform[2] = position[2];
		Method.copyElements(this._transform.elements, this._ptransform.elements);
		this._updateShapeList();
		this.sleeping = false;
		this.sleepTime = 0;
	}
	public updateMass(): void {
		let totalInertia00 = 0, totalInertia01 = 0, totalInertia02 = 0;
		let totalInertia10 = 0, totalInertia11 = 0, totalInertia12 = 0;
		let totalInertia20 = 0, totalInertia21 = 0, totalInertia22 = 0;
		let totalMass = 0;
		let s = this._shapeList;
		while (s) {
			const n = s.next;
			const g = s.geometry;
			g.updateMass();
			let mass = s.density * g.volume;
			let sTransform = s.localTransform.elements, gi = g.inertiaCoeff;
			let inertia00 = sTransform[3] * gi[0] + sTransform[4] * gi[3] + sTransform[5] * gi[6];
			let inertia01 = sTransform[3] * gi[1] + sTransform[4] * gi[4] + sTransform[5] * gi[7];
			let inertia02 = sTransform[3] * gi[2] + sTransform[4] * gi[5] + sTransform[5] * gi[8];
			let inertia10 = sTransform[6] * gi[0] + sTransform[7] * gi[3] + sTransform[8] * gi[6];
			let inertia11 = sTransform[6] * gi[1] + sTransform[7] * gi[4] + sTransform[8] * gi[7];
			let inertia12 = sTransform[6] * gi[2] + sTransform[7] * gi[5] + sTransform[8] * gi[8];
			let inertia20 = sTransform[9] * gi[0] + sTransform[10] * gi[3] + sTransform[11] * gi[6];
			let inertia21 = sTransform[9] * gi[1] + sTransform[10] * gi[4] + sTransform[11] * gi[7];
			let inertia22 = sTransform[9] * gi[2] + sTransform[10] * gi[5] + sTransform[11] * gi[8];
			const __tmp__001 = inertia00 * sTransform[3] + inertia01 * sTransform[4] + inertia02 * sTransform[5];
			const __tmp__011 = inertia00 * sTransform[6] + inertia01 * sTransform[7] + inertia02 * sTransform[8];
			const __tmp__021 = inertia00 * sTransform[9] + inertia01 * sTransform[10] + inertia02 * sTransform[11];
			const __tmp__101 = inertia10 * sTransform[3] + inertia11 * sTransform[4] + inertia12 * sTransform[5];
			const __tmp__111 = inertia10 * sTransform[6] + inertia11 * sTransform[7] + inertia12 * sTransform[8];
			const __tmp__121 = inertia10 * sTransform[9] + inertia11 * sTransform[10] + inertia12 * sTransform[11];
			const __tmp__201 = inertia20 * sTransform[3] + inertia21 * sTransform[4] + inertia22 * sTransform[5];
			const __tmp__211 = inertia20 * sTransform[6] + inertia21 * sTransform[7] + inertia22 * sTransform[8];
			const __tmp__221 = inertia20 * sTransform[9] + inertia21 * sTransform[10] + inertia22 * sTransform[11];
			inertia00 = __tmp__001; inertia01 = __tmp__011; inertia02 = __tmp__021;
			inertia10 = __tmp__101; inertia11 = __tmp__111; inertia12 = __tmp__121;
			inertia20 = __tmp__201; inertia21 = __tmp__211; inertia22 = __tmp__221;
			inertia00 *= mass; inertia01 *= mass; inertia02 *= mass;
			inertia10 *= mass; inertia11 *= mass; inertia12 *= mass;
			inertia20 *= mass; inertia21 *= mass; inertia22 *= mass;
			const xx = sTransform[0] * sTransform[0];
			const yy = sTransform[1] * sTransform[1];
			const zz = sTransform[2] * sTransform[2];
			const xy = -sTransform[0] * sTransform[1];
			const yz = -sTransform[1] * sTransform[2];
			const zx = -sTransform[2] * sTransform[0];
			const cogInertia00 = yy + zz, cogInertia01 = xy, cogInertia02 = zx;
			const cogInertia10 = xy, cogInertia11 = xx + zz, cogInertia12 = yz;
			const cogInertia20 = zx, cogInertia21 = yz, cogInertia22 = xx + yy;
			inertia00 += cogInertia00 * mass; inertia01 += cogInertia01 * mass; inertia02 += cogInertia02 * mass;
			inertia10 += cogInertia10 * mass; inertia11 += cogInertia11 * mass; inertia12 += cogInertia12 * mass;
			inertia20 += cogInertia20 * mass; inertia21 += cogInertia21 * mass; inertia22 += cogInertia22 * mass;
			totalMass += mass;
			totalInertia00 += inertia00; totalInertia01 += inertia01; totalInertia02 += inertia02;
			totalInertia10 += inertia10; totalInertia11 += inertia11; totalInertia12 += inertia12;
			totalInertia20 += inertia20; totalInertia21 += inertia21; totalInertia22 += inertia22;
			s = n;
		}
		this._mass = totalMass;
		const localInertia = this.localInertia;
		localInertia[0] = totalInertia00; localInertia[1] = totalInertia01; localInertia[2] = totalInertia02;
		localInertia[3] = totalInertia10; localInertia[4] = totalInertia11; localInertia[5] = totalInertia12;
		localInertia[6] = totalInertia20; localInertia[7] = totalInertia21; localInertia[8] = totalInertia22;
		this._updateInvInertia();
		this.sleeping = false;
		this.sleepTime = 0;
	}
	public getRotationTo(rotationMat3: { elements: Array<number> | Float64Array }): void {
		const t = this._transform.elements;
		Method.setM3X3(rotationMat3.elements as any, t[3], t[4], t[5], t[6], t[7], t[8], t[9], t[10], t[11]);
	}
	public setRotation(_rotationMat3: { elements: Array<number> | Float64Array }): void {
		Method.copyElements(_rotationMat3.elements as Float64Array, this._tM0.elements);
		const transform = this._transform.elements;
		Method.setTransformRotation(transform, this._tM0.elements);
		this._transformInvInertia(transform);
		Method.copyElements(this._transform.elements, this._ptransform.elements);
		this._updateShapeList();
		this.sleeping = false;
		this.sleepTime = 0;
	}
	public rotate(_rotationMat3: { elements: Array<number> | Float64Array }): void {
		Method.copyElements(_rotationMat3.elements as Float64Array, this._tM0.elements);
		Method.rotateTransform(this._transform.elements, this._tM0.elements);
		this._transformInvInertia(this._transform.elements);
		Method.copyElements(this._transform.elements, this._ptransform.elements);
		this._updateShapeList();
		this.sleeping = false;
		this.sleepTime = 0;
	}

	public getOrientationTo(orientation: { x: number, y: number, z: number, w: number }): void {
		const tq = this._tQ0.elements;
		Method.extractQuatFromTransform(this._transform.elements, tq);
		Method.setXYZW(orientation, tq[0], tq[1], tq[2], tq[3]);
	}
	public setOrientation(_quaternion: { x: number, y: number, z: number, w: number }): void {
		const quaternion = new Quat(_quaternion.x, _quaternion.y, _quaternion.z, _quaternion.w);
		const transform = this._transform.elements;
		Method.setTransformOrientation(transform, quaternion.elements);
		this._transformInvInertia(transform);
		Method.copyElements(this._transform.elements, this._ptransform.elements);
		this._updateShapeList();
		this.sleeping = false;
		this.sleepTime = 0;
	}

	public getTransformTo(transform: Transform): void {
		Method.copyElements(this._transform.elements, transform.elements);
	}
	public setTransform(transform: Transform): void {
		Method.copyElements(transform.elements, this._transform.elements);
		this._transformInvInertia(this._transform.elements);
		Method.copyElements(this._transform.elements, this._ptransform.elements);
		this._updateShapeList();
		this.sleeping = false;
		this.sleepTime = 0;
	}

	public getLocalInertiaTo(inertia: { elements: Array<number> | Float64Array }): void {
		const li = this.localInertia;
		Method.setM3X3(inertia.elements as Float64Array, li[0], li[1], li[2], li[3], li[4], li[5], li[6], li[7], li[8]);
	}

	public getMassDataTo(massData: MassData): void {
		massData.mass = this._mass;
		Method.copyElements(this.localInertia, massData.localInertia.elements);
	}
	public setMassData(massData: MassData): void {
		this._mass = massData.mass;
		Method.copyElements(massData.localInertia.elements, this.localInertia);
		this._updateInvInertia();
		this.sleeping = false;
		this.sleepTime = 0;
	}

	public getRotationFactorTo(rotationFactor: { x: number, y: number, z: number }): void {
		const rf = this.rotFactor.elements;
		Method.setXYZ(rotationFactor, rf[0], rf[1], rf[2]);
	}
	public setRotationFactor(rotationFactor: { x: number, y: number, z: number }): void {
		Method.setXYZ(this.rotFactor, rotationFactor.x, rotationFactor.y, rotationFactor.z);
		this._transformInvInertia(this._transform.elements);
		this.sleeping = false;
		this.sleepTime = 0;
	}

	public getLinearVelocityTo(linearVelocity: { x: number, y: number, z: number }): { x: number, y: number, z: number } {
		const v = this.vel;
		return Method.setXYZ(linearVelocity, v[0], v[1], v[2]);
	}
	public setLinearVelocity(linearVelocity: { x: number, y: number, z: number }): void {
		if (this._type === RIGID_BODY_TYPE.STATIC) {
			this.vel.fill(0);
		} else {
			this.vel[0] = linearVelocity.x;
			this.vel[1] = linearVelocity.y;
			this.vel[2] = linearVelocity.z;
		}
		this.sleeping = false;
		this.sleepTime = 0;
	}

	public getAngularVelocityTo(angularVelocity: { x: number, y: number, z: number }): void {
		const v = this.angVel;
		Method.setXYZ(angularVelocity, v[0], v[1], v[2]);
	}
	public setAngularVelocity(angularVelocity: { x: number, y: number, z: number }): void {
		if (this._type === RIGID_BODY_TYPE.STATIC) {
			this.angVel.fill(0);
		} else {
			this.angVel[0] = angularVelocity.x;
			this.angVel[1] = angularVelocity.y;
			this.angVel[2] = angularVelocity.z;
		}
		this.sleeping = false;
		this.sleepTime = 0;
	}
	public addLinearVelocity(linearVelocityChange: { x: number, y: number, z: number }): void {
		if (this._type !== RIGID_BODY_TYPE.STATIC) {
			const v = (Method.setXYZ(this._tV0, linearVelocityChange.x, linearVelocityChange.y, linearVelocityChange.z) as Vec3).elements;
			const t = this.vel;
			t[0] += v[0]; t[1] += v[1]; t[2] += v[2];
		}
		this.sleeping = false;
		this.sleepTime = 0;
	}
	public addAngularVelocity(angularVelocityChange: { x: number, y: number, z: number }): void {
		if (this._type !== RIGID_BODY_TYPE.STATIC) {
			const v = (Method.setXYZ(this._tV0, angularVelocityChange.x, angularVelocityChange.y, angularVelocityChange.z) as Vec3).elements;
			const t = this.angVel;
			t[0] += v[0]; t[1] += v[1]; t[2] += v[2];
		}
		this.sleeping = false;
		this.sleepTime = 0;
	}
	public applyImpulse(_impulse: { x: number, y: number, z: number }, _positionInWorld: { x: number, y: number, z: number }): void {
		const vel = this.vel, invMass = this._invMass, transform = this._transform.elements, angVel = this.angVel, invInertia = this.invInertia;
		const impulse = (Method.setXYZ(this._tV0, _impulse.x, _impulse.y, _impulse.z) as Vec3).elements;
		const pw = (Method.setXYZ(this._tV1, _positionInWorld.x, _positionInWorld.y, _positionInWorld.z) as Vec3).elements;
		vel[0] += impulse[0] * invMass; vel[1] += impulse[1] * invMass; vel[2] += impulse[2] * invMass;
		pw[0] -= transform[0]; pw[1] -= transform[1]; pw[2] -= transform[2];
		const v = this._tV2.elements;
		v[0] = pw[1] * impulse[2] - pw[2] * impulse[1]; v[1] = pw[2] * impulse[0] - pw[0] * impulse[2]; v[2] = pw[0] * impulse[1] - pw[1] * impulse[0];
		Method.rotateVec3(v, invInertia);
		angVel[0] += v[0]; angVel[1] += v[1]; angVel[2] += v[2];
		this.sleeping = false;
		this.sleepTime = 0;
	}
	public applyLinearImpulse(_impulse: { x: number, y: number, z: number }): void {
		const impulse = (Method.setXYZ(this._tV0, _impulse.x, _impulse.y, _impulse.z) as Vec3).elements;
		const impX = impulse[0], impY = impulse[1], impZ = impulse[2];
		const vel = this.vel, invMass = this._invMass;
		vel[0] += impX * invMass; vel[1] += impY * invMass; vel[2] += impZ * invMass;
		this.sleeping = false;
		this.sleepTime = 0;
	}
	public applyAngularImpulse(_impulse: { x: number, y: number, z: number }): void {
		const impulse = (Method.setXYZ(this._tV0, _impulse.x, _impulse.y, _impulse.z) as Vec3).elements;
		Method.rotateVec3(impulse, this.invInertia);
		const v = this.angVel;
		v[0] += impulse[0]; v[1] += impulse[1]; v[2] += impulse[2];
		this.sleeping = false;
		this.sleepTime = 0;
	}
	public applyForce(_force: { x: number, y: number, z: number }, _positionInWorld: { x: number, y: number, z: number }): void {
		const force = (Method.setXYZ(this._tV0, _force.x, _force.y, _force.z) as Vec3).elements, torque = this.torque;
		const pw = (Method.setXYZ(this._tV1, _positionInWorld.x, _positionInWorld.y, _positionInWorld.z) as Vec3).elements;
		const transform = this._transform.elements;
		const f = this.force;
		f[0] += force[0]; f[1] += force[1]; f[2] += force[2];
		pw[0] -= transform[0]; pw[1] -= transform[1]; pw[2] -= transform[2];
		const v = this._tV2.elements;
		v[0] = pw[1] * force[2] - pw[2] * force[1]; v[1] = pw[2] * force[0] - pw[0] * force[2]; v[2] = pw[0] * force[1] - pw[1] * force[0];
		torque[0] += v[0]; torque[1] += v[1]; torque[2] += v[2];
		this.sleeping = false;
		this.sleepTime = 0;
	}
	public applyForceToCenter(_force: { x: number, y: number, z: number }): void {
		const force = (Method.setXYZ(this._tV0, _force.x, _force.y, _force.z) as Vec3).elements;
		const f = this.force;
		f[0] += force[0]; f[1] += force[1]; f[2] += force[2];
		this.sleeping = false;
		this.sleepTime = 0;
	}
	public applyTorque(_torque: { x: number, y: number, z: number }): void {
		const torque = (Method.setXYZ(this._tV0, _torque.x, _torque.y, _torque.z) as Vec3).elements;
		const t = this.torque;
		t[0] += torque[0]; t[1] += torque[1]; t[2] += torque[2];
		this.sleeping = false;
		this.sleepTime = 0;
	}

	public getLinearContactImpulseTo(linearContactImpulse: { x: number, y: number, z: number }): void {
		let lci = this.linearContactImpulse;
		Method.setXYZ(linearContactImpulse, lci[0], lci[1], lci[2]);
	}

	public getAngularContactImpulseTo(angularContactImpulse: { x: number, y: number, z: number }): void {
		let aci = this.angularContactImpulse;
		Method.setXYZ(angularContactImpulse, aci[0], aci[1], aci[2]);
	}

	public getLocalPointTo(worldPoint: { x: number, y: number, z: number }, localPoint: { x: number, y: number, z: number }): void {
		const wp = (Method.setXYZ(this._tV0, worldPoint.x, worldPoint.y, worldPoint.z) as Vec3).elements, es = this._tV1.elements;
		Method.inverseTransformVec3(this._transform.elements, wp, 0, es);
		Method.setXYZ(localPoint, es[0], es[1], es[2]);
	}

	public getLocalVectorTo(worldVector: { x: number, y: number, z: number }, localVector: { x: number, y: number, z: number }): void {
		const wv = (Method.setXYZ(this._tV0, worldVector.x, worldVector.y, worldVector.z) as Vec3).elements, es = this._tV1.elements;
		Method.inverseTransformVec3(this._transform.elements, wv, 1, es);
		Method.setXYZ(localVector, es[0], es[1], es[2]);
	}

	public getWorldPointTo(localPoint: { x: number, y: number, z: number }, worldPoint: { x: number, y: number, z: number }): void {
		const lp = (Method.setXYZ(this._tV0, localPoint.x, localPoint.y, localPoint.z) as Vec3).elements, es = this._tV1.elements;
		Method.transformVec3(this._transform.elements, lp, 0, es);
		Method.setXYZ(worldPoint, es[0], es[1], es[2]);
	}

	public getWorldVectorTo(localVector: { x: number, y: number, z: number }, worldVector: { x: number, y: number, z: number }): void {
		const lv = (Method.setXYZ(this._tV0, localVector.x, localVector.y, localVector.z) as Vec3).elements, es = this._tV1.elements;
		Method.transformVec3(this._transform.elements, lv, 1, es);
		Method.setXYZ(worldVector, es[0], es[1], es[2]);
	}
	public wakeUp() {
		this.sleeping = false;
		this.sleepTime = 0;
	}
	public sleep() {
		this.sleeping = true;
		this.sleepTime = 0;
	}
	public integrate(dt: number): void {
		switch (this._type) {
			case RIGID_BODY_TYPE.STATIC:
				this.vel.fill(0);
				this.angVel.fill(0);
				this.pseudoVel.fill(0);
				this.angPseudoVel.fill(0);
				break;
			case RIGID_BODY_TYPE.DYNAMIC: case RIGID_BODY_TYPE.KINEMATIC:
				const TPS = CONSTANT.SETTING_MAX_TRANSLATION_PER_STEP;
				const RPS = CONSTANT.SETTING_MAX_ROTATION_PER_STEP;
				const vel = this.vel, angVel = this.angVel;
				let translationX = vel[0] * dt, translationY = vel[1] * dt, translationZ = vel[2] * dt;
				let rotationX = angVel[0] * dt, rotationY = angVel[1] * dt, rotationZ = angVel[2] * dt;
				const translationLengthSq = translationX * translationX + translationY * translationY + translationZ * translationZ;
				const rotationLengthSq = rotationX * rotationX + rotationY * rotationY + rotationZ * rotationZ;
				if (translationLengthSq === 0 && rotationLengthSq === 0) {
					return;
				}
				if (translationLengthSq > TPS * TPS) {
					const l = TPS / Math.sqrt(translationLengthSq);
					vel[0] *= l; vel[1] *= l; vel[2] *= l;
					translationX *= l; translationY *= l; translationZ *= l;
				}
				if (rotationLengthSq > RPS * RPS) {
					const l = RPS / Math.sqrt(rotationLengthSq);
					angVel[0] *= l; angVel[1] *= l; angVel[2] *= l;
					rotationX *= l; rotationY *= l; rotationZ *= l;
				}
				const transform = this._transform.elements;
				transform[0] += translationX; transform[1] += translationY; transform[2] += translationZ;
				const theta = Math.sqrt(rotationX * rotationX + rotationY * rotationY + rotationZ * rotationZ);
				const halfTheta = theta * 0.5;
				let rotationToSinAxisFactor: number;
				let cosHalfTheta: number;
				if (halfTheta < 0.5) {
					const ht2 = halfTheta * halfTheta;
					rotationToSinAxisFactor = 0.5 * (1 - ht2 * 0.16666666666666666 + ht2 * ht2 * 0.0083333333333333332);
					cosHalfTheta = 1 - ht2 * 0.5 + ht2 * ht2 * 0.041666666666666664;
				} else {
					rotationToSinAxisFactor = Math.sin(halfTheta) / theta;
					cosHalfTheta = Math.cos(halfTheta);
				}
				const sinAxisX = rotationX * rotationToSinAxisFactor, sinAxisY = rotationY * rotationToSinAxisFactor, sinAxisZ = rotationZ * rotationToSinAxisFactor;
				const dqX = sinAxisX, dqY = sinAxisY, dqZ = sinAxisZ, dqW = cosHalfTheta;
				const tq = this._tQ0.elements;
				Method.extractQuatFromTransform(transform, tq);
				tq[0] = dqW * tq[0] + dqX * tq[3] + dqY * tq[2] - dqZ * tq[1];
				tq[1] = dqW * tq[1] - dqX * tq[2] + dqY * tq[3] + dqZ * tq[0];
				tq[2] = dqW * tq[2] + dqX * tq[1] - dqY * tq[0] + dqZ * tq[3];
				tq[3] = dqW * tq[3] - dqX * tq[0] - dqY * tq[1] - dqZ * tq[2];
				let l = tq[0] * tq[0] + tq[1] * tq[1] + tq[2] * tq[2] + tq[3] * tq[3];
				if (l > 1e-32) {
					l = 1 / Math.sqrt(l);
				}
				tq[0] *= l; tq[1] *= l; tq[2] *= l; tq[3] *= l;
				Method.setTransformOrientation(transform, tq);
				this._transformInvInertia(transform);
				break;
		}
	}
	public integratePseudoVelocity(): void {
		const pseudoVel = this.pseudoVel, angPseudoVel = this.angPseudoVel;
		if (pseudoVel[0] * pseudoVel[0] + pseudoVel[1] * pseudoVel[1] + pseudoVel[2] * pseudoVel[2] === 0 &&
			angPseudoVel[0] * angPseudoVel[0] + angPseudoVel[1] * angPseudoVel[1] + angPseudoVel[2] * angPseudoVel[2] === 0) {
			return;
		}
		switch (this._type) {
			case RIGID_BODY_TYPE.STATIC:
				pseudoVel.fill(0);
				angPseudoVel.fill(0);
				break;
			case RIGID_BODY_TYPE.DYNAMIC: case RIGID_BODY_TYPE.KINEMATIC:
				const translationX = pseudoVel[0], translationY = pseudoVel[1], translationZ = pseudoVel[2];
				const rotationX = angPseudoVel[0], rotationY = angPseudoVel[1], rotationZ = angPseudoVel[2];
				pseudoVel.fill(0);
				angPseudoVel.fill(0);
				const transform = this._transform.elements;
				transform[0] += translationX; transform[1] += translationY; transform[2] += translationZ;
				const theta = Math.sqrt(rotationX * rotationX + rotationY * rotationY + rotationZ * rotationZ);
				const halfTheta = theta * 0.5;
				let rotationToSinAxisFactor: number;
				let cosHalfTheta: number;
				if (halfTheta < 0.5) {
					const ht2 = halfTheta * halfTheta;
					rotationToSinAxisFactor = 0.5 * (1 - ht2 * 0.16666666666666666 + ht2 * ht2 * 0.0083333333333333332);
					cosHalfTheta = 1 - ht2 * 0.5 + ht2 * ht2 * 0.041666666666666664;
				} else {
					rotationToSinAxisFactor = Math.sin(halfTheta) / theta;
					cosHalfTheta = Math.cos(halfTheta);
				}
				const sinAxisX = rotationX * rotationToSinAxisFactor, sinAxisY = rotationY * rotationToSinAxisFactor, sinAxisZ = rotationZ * rotationToSinAxisFactor;
				const dqX = sinAxisX, dqY = sinAxisY, dqZ = sinAxisZ, dqW = cosHalfTheta;
				const tq = this._tQ0.elements;
				Method.extractQuatFromTransform(transform, tq);
				tq[0] = dqW * tq[0] + dqX * tq[3] + dqY * tq[2] - dqZ * tq[1];
				tq[1] = dqW * tq[1] - dqX * tq[2] + dqY * tq[3] + dqZ * tq[0];
				tq[2] = dqW * tq[2] + dqX * tq[1] - dqY * tq[0] + dqZ * tq[3];
				tq[3] = dqW * tq[3] - dqX * tq[0] - dqY * tq[1] - dqZ * tq[2];
				let l = tq[0] * tq[0] + tq[1] * tq[1] + tq[2] * tq[2] + tq[3] * tq[3];
				if (l > 1e-32) {
					l = 1 / Math.sqrt(l);
				}
				tq[0] *= l; tq[1] *= l; tq[2] *= l; tq[3] *= l;
				Method.setTransformOrientation(transform, tq);
				this._transformInvInertia(transform);
				break;
		}
	}

	private _updateShapeList() {
		let s = this._shapeList;
		while (s) {
			const n = s.next;
			Method.multiplyTransform(s.localTransform.elements, this._ptransform.elements, s.ptransform.elements);
			Method.multiplyTransform(s.localTransform.elements, this._transform.elements, s.transform.elements);
			this._computeShapeAabb(s);
			if (s.proxy) {
				const transform = s.transform.elements, ptransform = s.ptransform.elements;
				const dX = transform[0] - ptransform[0], dY = transform[1] - ptransform[1], dZ = transform[2] - ptransform[2];
				const v = s.displacement.elements;
				v[0] = dX; v[1] = dY; v[2] = dZ;
				s.rigidBody!.world!.broadPhase.moveProxy(s.proxy, s.aabb, s.displacement);
			}
			s = n;
		}
	}
	private _computeShapeAabb(s: Shape) {
		s.geometry.computeAabb(s.aabb, s.ptransform);
		const aabb = s.aabb.elements;
		const minX = aabb[0], minY = aabb[1], minZ = aabb[2];
		const maxX = aabb[3], maxY = aabb[4], maxZ = aabb[5];
		s.geometry.computeAabb(s.aabb, s.transform);
		aabb[0] = minX < aabb[0] ? minX : aabb[0]; aabb[1] = minY < aabb[1] ? minY : aabb[1]; aabb[2] = minZ < aabb[2] ? minZ : aabb[2];
		aabb[3] = maxX > aabb[3] ? maxX : aabb[3]; aabb[4] = maxY > aabb[4] ? maxY : aabb[4]; aabb[5] = maxZ > aabb[5] ? maxZ : aabb[5];
	}
	private _transformInvInertia(transform: Float64Array) {
		const invInertia = this.invInertia, invLocalInertia = this.invLocalInertia;
		invInertia[0] = transform[3] * invLocalInertia[0] + transform[4] * invLocalInertia[3] + transform[5] * invLocalInertia[6];
		invInertia[1] = transform[3] * invLocalInertia[1] + transform[4] * invLocalInertia[4] + transform[5] * invLocalInertia[7];
		invInertia[2] = transform[3] * invLocalInertia[2] + transform[4] * invLocalInertia[5] + transform[5] * invLocalInertia[8];
		invInertia[3] = transform[6] * invLocalInertia[0] + transform[7] * invLocalInertia[3] + transform[8] * invLocalInertia[6];
		invInertia[4] = transform[6] * invLocalInertia[1] + transform[7] * invLocalInertia[4] + transform[8] * invLocalInertia[7];
		invInertia[5] = transform[6] * invLocalInertia[2] + transform[7] * invLocalInertia[5] + transform[8] * invLocalInertia[8];
		invInertia[6] = transform[9] * invLocalInertia[0] + transform[10] * invLocalInertia[3] + transform[11] * invLocalInertia[6];
		invInertia[7] = transform[9] * invLocalInertia[1] + transform[10] * invLocalInertia[4] + transform[11] * invLocalInertia[7];
		invInertia[8] = transform[9] * invLocalInertia[2] + transform[10] * invLocalInertia[5] + transform[11] * invLocalInertia[8];
		const __tmp__001 = invInertia[0] * transform[3] + invInertia[1] * transform[4] + invInertia[2] * transform[5];
		const __tmp__011 = invInertia[0] * transform[6] + invInertia[1] * transform[7] + invInertia[2] * transform[8];
		const __tmp__021 = invInertia[0] * transform[9] + invInertia[1] * transform[10] + invInertia[2] * transform[11];
		const __tmp__101 = invInertia[3] * transform[3] + invInertia[4] * transform[4] + invInertia[5] * transform[5];
		const __tmp__111 = invInertia[3] * transform[6] + invInertia[4] * transform[7] + invInertia[5] * transform[8];
		const __tmp__121 = invInertia[3] * transform[9] + invInertia[4] * transform[10] + invInertia[5] * transform[11];
		const __tmp__201 = invInertia[6] * transform[3] + invInertia[7] * transform[4] + invInertia[8] * transform[5];
		const __tmp__211 = invInertia[6] * transform[6] + invInertia[7] * transform[7] + invInertia[8] * transform[8];
		const __tmp__221 = invInertia[6] * transform[9] + invInertia[7] * transform[10] + invInertia[8] * transform[11];
		invInertia[0] = __tmp__001; invInertia[1] = __tmp__011; invInertia[2] = __tmp__021;
		invInertia[3] = __tmp__101; invInertia[4] = __tmp__111; invInertia[5] = __tmp__121;
		invInertia[6] = __tmp__201; invInertia[7] = __tmp__211; invInertia[8] = __tmp__221;
		const rf = this.rotFactor.elements;
		invInertia[0] *= rf[0]; invInertia[1] *= rf[0]; invInertia[2] *= rf[0];
		invInertia[3] *= rf[1]; invInertia[4] *= rf[1]; invInertia[5] *= rf[1];
		invInertia[6] *= rf[2]; invInertia[7] *= rf[2]; invInertia[8] *= rf[2];
	}
	private _updateInvInertia(): void {
		const localInertia = this.localInertia, invLocalInertia = this.invLocalInertia, invLocalInertiaWithoutRotFactor = this.invLocalInertiaWithoutRotFactor, invInertia = this.invInertia;
		const transform = this._transform.elements, rf = this.rotFactor.elements;
		if (this._mass > 0 &&
			localInertia[0] * (localInertia[4] * localInertia[8] - localInertia[5] * localInertia[7]) -
			localInertia[1] * (localInertia[3] * localInertia[8] - localInertia[5] * localInertia[6]) +
			localInertia[2] * (localInertia[3] * localInertia[7] - localInertia[4] * localInertia[6]) > 0 &&
			this._type === RIGID_BODY_TYPE.DYNAMIC) {
			this._invMass = 1 / this._mass;
			const d00 = localInertia[4] * localInertia[8] - localInertia[5] * localInertia[7];
			const d01 = localInertia[3] * localInertia[8] - localInertia[5] * localInertia[6];
			const d02 = localInertia[3] * localInertia[7] - localInertia[4] * localInertia[6];
			let d = localInertia[0] * d00 - localInertia[1] * d01 + localInertia[2] * d02;
			if (d < -1e-32 || d > 1e-32) {
				d = 1 / d;
			}
			invLocalInertia[0] = d00 * d;
			invLocalInertia[1] = -(localInertia[1] * localInertia[8] - localInertia[2] * localInertia[7]) * d;
			invLocalInertia[2] = (localInertia[1] * localInertia[5] - localInertia[2] * localInertia[4]) * d;
			invLocalInertia[3] = -d01 * d;
			invLocalInertia[4] = (localInertia[0] * localInertia[8] - localInertia[2] * localInertia[6]) * d;
			invLocalInertia[5] = -(localInertia[0] * localInertia[5] - localInertia[2] * localInertia[3]) * d;
			invLocalInertia[6] = d02 * d;
			invLocalInertia[7] = -(localInertia[0] * localInertia[7] - localInertia[1] * localInertia[6]) * d;
			invLocalInertia[8] = (localInertia[0] * localInertia[4] - localInertia[1] * localInertia[3]) * d;
			invLocalInertiaWithoutRotFactor[0] = invLocalInertia[0];
			invLocalInertiaWithoutRotFactor[1] = invLocalInertia[1];
			invLocalInertiaWithoutRotFactor[2] = invLocalInertia[2];
			invLocalInertiaWithoutRotFactor[3] = invLocalInertia[3];
			invLocalInertiaWithoutRotFactor[4] = invLocalInertia[4];
			invLocalInertiaWithoutRotFactor[5] = invLocalInertia[5];
			invLocalInertiaWithoutRotFactor[6] = invLocalInertia[6];
			invLocalInertiaWithoutRotFactor[7] = invLocalInertia[7];
			invLocalInertiaWithoutRotFactor[8] = invLocalInertia[8];
			invLocalInertia[0] = invLocalInertiaWithoutRotFactor[0] * rf[0];
			invLocalInertia[1] = invLocalInertiaWithoutRotFactor[1] * rf[0];
			invLocalInertia[2] = invLocalInertiaWithoutRotFactor[2] * rf[0];
			invLocalInertia[3] = invLocalInertiaWithoutRotFactor[3] * rf[1];
			invLocalInertia[4] = invLocalInertiaWithoutRotFactor[4] * rf[1];
			invLocalInertia[5] = invLocalInertiaWithoutRotFactor[5] * rf[1];
			invLocalInertia[6] = invLocalInertiaWithoutRotFactor[6] * rf[2];
			invLocalInertia[7] = invLocalInertiaWithoutRotFactor[7] * rf[2];
			invLocalInertia[8] = invLocalInertiaWithoutRotFactor[8] * rf[2];
		} else {
			this._invMass = 0;
			invLocalInertia.fill(0);
			invLocalInertiaWithoutRotFactor.fill(0);
			if (this._type === RIGID_BODY_TYPE.DYNAMIC) {
				this._type = RIGID_BODY_TYPE.STATIC;
			}
		}
		invInertia[0] = transform[3] * invLocalInertia[0] + transform[4] * invLocalInertia[3] + transform[5] * invLocalInertia[6];
		invInertia[1] = transform[3] * invLocalInertia[1] + transform[4] * invLocalInertia[4] + transform[5] * invLocalInertia[7];
		invInertia[2] = transform[3] * invLocalInertia[2] + transform[4] * invLocalInertia[5] + transform[5] * invLocalInertia[8];
		invInertia[3] = transform[6] * invLocalInertia[0] + transform[7] * invLocalInertia[3] + transform[8] * invLocalInertia[6];
		invInertia[4] = transform[6] * invLocalInertia[1] + transform[7] * invLocalInertia[4] + transform[8] * invLocalInertia[7];
		invInertia[5] = transform[6] * invLocalInertia[2] + transform[7] * invLocalInertia[5] + transform[8] * invLocalInertia[8];
		invInertia[6] = transform[9] * invLocalInertia[0] + transform[10] * invLocalInertia[3] + transform[11] * invLocalInertia[6];
		invInertia[7] = transform[9] * invLocalInertia[1] + transform[10] * invLocalInertia[4] + transform[11] * invLocalInertia[7];
		invInertia[8] = transform[9] * invLocalInertia[2] + transform[10] * invLocalInertia[5] + transform[11] * invLocalInertia[8];
		const __tmp__001 = invInertia[0] * transform[3] + invInertia[1] * transform[4] + invInertia[2] * transform[5];
		const __tmp__011 = invInertia[0] * transform[6] + invInertia[1] * transform[7] + invInertia[2] * transform[8];
		const __tmp__021 = invInertia[0] * transform[9] + invInertia[1] * transform[10] + invInertia[2] * transform[11];
		const __tmp__101 = invInertia[3] * transform[3] + invInertia[4] * transform[4] + invInertia[5] * transform[5];
		const __tmp__111 = invInertia[3] * transform[6] + invInertia[4] * transform[7] + invInertia[5] * transform[8];
		const __tmp__121 = invInertia[3] * transform[9] + invInertia[4] * transform[10] + invInertia[5] * transform[11];
		const __tmp__201 = invInertia[6] * transform[3] + invInertia[7] * transform[4] + invInertia[8] * transform[5];
		const __tmp__211 = invInertia[6] * transform[6] + invInertia[7] * transform[7] + invInertia[8] * transform[8];
		const __tmp__221 = invInertia[6] * transform[9] + invInertia[7] * transform[10] + invInertia[8] * transform[11];
		invInertia[0] = __tmp__001; invInertia[1] = __tmp__011; invInertia[2] = __tmp__021;
		invInertia[3] = __tmp__101; invInertia[4] = __tmp__111; invInertia[5] = __tmp__121;
		invInertia[6] = __tmp__201; invInertia[7] = __tmp__211; invInertia[8] = __tmp__221;
		invInertia[0] *= rf[0]; invInertia[1] *= rf[0]; invInertia[2] *= rf[0];
		invInertia[3] *= rf[1]; invInertia[4] *= rf[1]; invInertia[5] *= rf[1];
		invInertia[6] *= rf[2]; invInertia[7] *= rf[2]; invInertia[8] *= rf[2];
	}
}