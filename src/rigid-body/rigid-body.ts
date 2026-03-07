import { CONSTANT, GEOMETRY_TYPE, RIGID_BODY_TYPE } from "../constant";
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

/**
 * 3D 对象接口，用于和外部渲染引擎（如 Three.js,babylon.js...）进行数据交互
 * @property {any} userData - 自定义数据容器，用于关联刚体对象
 * @property {string} uuid - 唯一标识，用于区分不同的3D对象
 * @property {{ x: number, y: number, z: number }} position - 世界空间位置
 * @property {{ x: number, y: number, z: number, w: number }} quaternion - 四元数表示的旋转
 */
interface IObject3D {
	userData: any,
	uuid: string,
	position: { x: number, y: number, z: number },
	quaternion: { x: number, y: number, z: number, w: number }
}

/**
 * 刚体类，是物理引擎的核心对象，负责管理物体的物理属性、运动状态和碰撞形状。
 * 支持静态(STATIC)、动态(DYNAMIC)、运动学(KINEMATIC)三种刚体类型，提供完整的物理交互能力
 */
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
	private _isTerrain = false;

	/**
	 * 旋转因子，用于缩放各轴的转动惯量。
	 * 可用于限制特定轴的旋转（设为0）或调整旋转难易程度
	 */
	public rotFactor = new Vec3(1, 1, 1);
	/** 关联的3D渲染对象列表，用于同步物理状态到渲染引擎 */
	public object3Ds: Array<IObject3D> = [];
	/** 刚体名称，用于调试和标识 */
	public readonly name: string;
	/** 链表下一个刚体的引用，用于物理世界的刚体管理 */
	public next: Nullable<RigidBody>;
	/** 链表上一个刚体的引用，用于物理世界的刚体管理 */
	public prev: Nullable<RigidBody>;
	/** 接触链接链表头节点，管理当前刚体的所有接触约束 */
	public contactLinkList: Nullable<ContactLink>;
	/** 接触链接链表最后一个节点 */
	public contactLinkListLast: Nullable<ContactLink>;
	/** 接触链接的数量 */
	public numContactLinks = 0;
	/** 关节链接链表头节点，管理当前刚体的所有关节约束 */
	public jointLinkList: Nullable<JointLink>;
	/** 关节链接链表最后一个节点 */
	public jointLinkListLast: Nullable<JointLink>;
	/** 关节链接的数量 */
	public numJointLinks = 0;
	/** 休眠计时，达到阈值后进入休眠状态 */
	public sleepTime = 0;
	/** 是否处于休眠状态，休眠的刚体不参与物理计算 */
	public sleeping = false;
	/** 是否已添加到物理岛，用于优化碰撞检测 */
	public addedToIsland = false;
	/** 所属的物理世界引用 */
	public world: Nullable<World>;
	/** 线性速度 (m/s)，存储在Float64Array[3]中 [x, y, z] */
	public vel = new Float64Array(3);
	/** 角速度 (rad/s)，存储在Float64Array[3]中 [x, y, z] */
	public angVel = new Float64Array(3);
	/** 伪线性速度，用于约束求解阶段的位置修正 */
	public pseudoVel = new Float64Array(3);
	/** 伪角速度，用于约束求解阶段的旋转修正 */
	public angPseudoVel = new Float64Array(3);
	/** 作用在刚体上的合外力 (N)，存储在Float64Array[3]中 [x, y, z] */
	public force = new Float64Array(3);
	/** 作用在刚体上的合外力矩 (N·m)，存储在Float64Array[3]中 [x, y, z] */
	public torque = new Float64Array(3);
	/** 接触产生的线性冲量累计值，用于物理调试 */
	public linearContactImpulse = new Float64Array(3);
	/** 接触产生的角冲量累计值，用于物理调试 */
	public angularContactImpulse = new Float64Array(3);
	/** 本地转动惯量矩阵（3x3），行优先存储 */
	public localInertia = new Float64Array(9);
	/** 本地逆转动惯量矩阵（3x3），行优先存储 */
	public invLocalInertia = new Float64Array(9);
	/** 未应用旋转因子的本地逆转动惯量矩阵，用于旋转因子修改时快速计算 */
	public invLocalInertiaWithoutRotFactor = new Float64Array(9);
	/** 世界空间逆转动惯量矩阵（3x3），行优先存储 */
	public invInertia = new Float64Array(9);

	/**
	 * 构造函数，创建刚体实例
	 * @param {RigidBodyConfig} config - 刚体配置对象
	 */
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

	/**
	 * 获取是否启用自动休眠
	 * @returns {boolean} 自动休眠状态
	 */
	public get autoSleep(): boolean {
		return this._autoSleep;
	}

	/**
	 * 设置自动休眠状态，修改后会立即唤醒刚体
	 * @param {boolean} autoSleepEnabled - 是否启用自动休眠
	 */
	public set autoSleep(autoSleepEnabled: boolean) {
		this._autoSleep = autoSleepEnabled;
		this.sleeping = false;
		this.sleepTime = 0;
	}

	/**
	 * 获取质量的倒数
	 * @returns {number} 质量倒数
	 */
	public get invMass(): number {
		return this._invMass
	}

	/**
	 * 获取线性阻尼系数
	 * @returns {number} 线性阻尼系数
	 */
	public get linearDamping(): number {
		return this._linearDamping;
	}

	/**
	 * 设置线性阻尼系数
	 * @param {number} damping - 线性阻尼系数（建议值：0~1）
	 */
	public set linearDamping(damping: number) {
		this._linearDamping = damping;
	}

	/**
	 * 获取角阻尼系数
	 * @returns {number} 角阻尼系数
	 */
	public get angularDamping(): number {
		return this._angularDamping;
	}

	/**
	 * 获取形状链表头节点
	 * @returns {Shape} 形状链表头节点
	 */
	public get shapeList(): Shape {
		return this._shapeList!;
	}

	/**
	 * 获取上一帧的变换矩阵
	 * @returns {Transform} 上一帧变换矩阵
	 */
	public get ptransform(): Transform {
		return this._ptransform;
	}

	/**
	 * 获取当前帧的变换矩阵
	 * @returns {Transform} 当前帧变换矩阵
	 */
	public get transform(): Transform {
		return this._transform;
	}

	/**
	 * 获取刚体质量
	 * @returns {number} 质量（kg）
	 */
	public get mass(): number {
		return this._mass;
	}

	/**
	 * 获取重力缩放因子
	 * @returns {number} 重力缩放因子
	 */
	public get gravityScale(): number {
		return this._gravityScale;
	}

	/**
	 * 设置重力缩放因子，修改后会立即唤醒刚体
	 * @param {number} gravityScale - 重力缩放因子（默认1）
	 */
	public set gravityScale(gravityScale: number) {
		this._gravityScale = gravityScale;
		this.sleeping = false;
		this.sleepTime = 0;
	}

	/**
	 * 获取刚体类型（地形刚体始终返回STATIC）
	 * @returns {RIGID_BODY_TYPE} 刚体类型
	 */
	public get type(): RIGID_BODY_TYPE {
		return this._isTerrain ? RIGID_BODY_TYPE.STATIC : this._type;
	}

	/**
	 * 设置刚体类型，地形刚体不允许修改类型
	 * @param {RIGID_BODY_TYPE} type - 刚体类型
	 * @throws {Error} 地形刚体修改类型时抛出错误
	 */
	public set type(type: RIGID_BODY_TYPE) {
		if (this._isTerrain) {
			throw new Error("Rigid type of terrain cannot be changed.");
		}
		this._type = type;
		this.updateMass();
	}

	/**
	 * 向刚体添加碰撞形状。
	 * 1. 地形形状只能添加一个，且会自动将刚体设为静态
	 * 2. 添加形状后会自动更新刚体质量和形状列表
	 * 3. 如果刚体已加入物理世界，会创建碰撞代理
	 * @param {Shape} shape - 要添加的形状
	 * @throws {Error} 地形刚体添加多个形状时抛出错误
	 */
	public addShape(shape: Shape): void {
		if (shape.geometry.type === GEOMETRY_TYPE.TERRAIN) {
			if (this._shapeList) {
				throw new Error("RigidBody can only have one single terrain shape.");
			} else {
				this._isTerrain = true;
				this.vel.fill(0);
				this.angVel.fill(0);
				this.getPositionTo(this._tV0);
				Method.combineMat3Vec3ToTransform(this._tV0.elements, new Mat3().elements, this._ptransform.elements);
				Method.copyElements(this._ptransform.elements, this._transform.elements);
			}
		}

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

	/**
	 * 从刚体移除碰撞形状。
	 * 1. 移除形状后会清理相关的接触约束
	 * 2. 如果刚体已加入物理世界，会销毁碰撞代理
	 * 3. 移除后会自动更新刚体质量和形状列表
	 * @param {Shape} shape - 要移除的形状
	 * @throws {Error} 地形刚体移除形状时抛出错误
	 */
	public removeShape(shape: Shape): void {
		if (this._isTerrain) {
			throw new Error("Terrain shape cannot be removed.");
		}
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

	/**
	 * 添加3D渲染对象关联，用于同步物理状态到渲染引擎。
	 * 关联后会在object3Ds的userData中存储刚体引用，避免重复关联
	 * @param {...IObject3D[]} object3Ds - 要关联的3D对象
	 */
	public addObject3D(...object3Ds: IObject3D[]): void {
		for (let obj of object3Ds) {
			const idx = this.object3Ds.findIndex((o) => o.uuid === obj.uuid);
			if (idx < 0) {
				this.object3Ds.push(obj);
				obj.userData.rigidBody = this;
			}
		}
	}

	/**
	 * 移除3D渲染对象关联。
	 * 移除后会清空object3Ds的userData中的刚体引用
	 * @param {...IObject3D[]} object3Ds - 要移除的3D对象
	 */
	public removeObject3D(...object3Ds: IObject3D[]): void {
		for (let obj of object3Ds) {
			const idx = this.object3Ds.findIndex((o) => o.uuid === obj.uuid);
			if (idx < 0) continue;
			this.object3Ds.splice(idx, 1);
			obj.userData.rigidBody = null;
		}
	}

	/**
	 * 清空所有关联的3D渲染对象
	 */
	public clearObject3D(): void {
		this.removeObject3D(...this.object3Ds);
	}

	/**
	 * 同步刚体的位置和旋转到所有关联的3D渲染对象。
	 * 通常在物理步进后调用，更新渲染对象的显示状态
	 */
	public updateObject3Ds(): void {
		for (let o3d of this.object3Ds) {
			this.getPositionTo(o3d.position);
			this.getOrientationTo(o3d.quaternion);
		}
	}

	/**
	 * 平移刚体位置。
	 * 平移后会更新形状列表并唤醒刚体
	 * @param {{ x: number, y: number, z: number }} _translation - 平移量
	 */
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

	/**
	 * 获取刚体位置并写入目标对象
	 * @param {{ x: number, y: number, z: number }} position - 目标位置对象
	 * @returns {{ x: number, y: number, z: number }} 填充后的位置对象
	 */
	public getPositionTo(position: { x: number, y: number, z: number }): { x: number, y: number, z: number } {
		const transform = this._transform.elements;
		Method.setXYZ(position, transform[0], transform[1], transform[2]);
		return position;
	}

	/**
	 * 设置刚体位置。
	 * 设置后会更新形状列表并唤醒刚体
	 * @param {{ x: number, y: number, z: number }} _position - 目标位置
	 */
	public setPosition(_position: { x: number, y: number, z: number }): void {
		const position = new Float64Array([_position.x, _position.y, _position.z]);
		const transform = this._transform.elements;
		transform[0] = position[0]; transform[1] = position[1]; transform[2] = position[2];
		Method.copyElements(this._transform.elements, this._ptransform.elements);
		this._updateShapeList();
		this.sleeping = false;
		this.sleepTime = 0;
	}

	/**
	 * 更新刚体的质量和转动惯量。
	 * 1. 遍历所有形状，累加质量和转动惯量
	 * 2. 计算形状本地转动惯量到刚体本地坐标系的变换
	 * 3. 应用平行轴定理修正转动惯量
	 * 4. 更新逆转动惯量矩阵
	 */
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

	/**
	 * 获取刚体旋转矩阵并写入目标对象
	 * @param {{ elements: Array<number> | Float64Array }} rotationMat3 - 目标矩阵对象
	 */
	public getRotationTo(rotationMat3: { elements: Array<number> | Float64Array }): void {
		const t = this._transform.elements;
		Method.setM3X3(rotationMat3.elements as any, t[3], t[4], t[5], t[6], t[7], t[8], t[9], t[10], t[11]);
	}

	/**
	 * 设置刚体旋转矩阵。
	 * 设置后会更新逆转动惯量矩阵和形状列表
	 * @param {{ elements: Array<number> | Float64Array }} _rotationMat3 - 目标旋转矩阵
	 * @throws {Error} 地形刚体设置旋转时抛出错误
	 */
	public setRotation(_rotationMat3: { elements: Array<number> | Float64Array }): void {
		if (this._isTerrain) {
			throw new Error('Terrain cannot rotate');
		}
		Method.copyElements(_rotationMat3.elements as Float64Array, this._tM0.elements);
		const transform = this._transform.elements;
		Method.setTransformRotation(transform, this._tM0.elements);
		this._transformInvInertia(transform);
		Method.copyElements(this._transform.elements, this._ptransform.elements);
		this._updateShapeList();
		this.sleeping = false;
		this.sleepTime = 0;
	}

	/**
	 * 旋转刚体（增量旋转）。
	 * 旋转后会更新逆转动惯量矩阵和形状列表
	 * @param {{ elements: Array<number> | Float64Array }} _rotationMat3 - 旋转增量矩阵
	 * @throws {Error} 地形刚体旋转时抛出错误
	 */
	public rotate(_rotationMat3: { elements: Array<number> | Float64Array }): void {
		if (this._isTerrain) {
			throw new Error('Terrain cannot rotate');
		}
		Method.copyElements(_rotationMat3.elements as Float64Array, this._tM0.elements);
		Method.rotateTransform(this._transform.elements, this._tM0.elements);
		this._transformInvInertia(this._transform.elements);
		Method.copyElements(this._transform.elements, this._ptransform.elements);
		this._updateShapeList();
		this.sleeping = false;
		this.sleepTime = 0;
	}

	/**
	 * 获取刚体四元数并写入目标对象
	 * @param {{ x: number, y: number, z: number, w: number }} orientation - 目标四元数对象
	 */
	public getOrientationTo(orientation: { x: number, y: number, z: number, w: number }): void {
		const tq = this._tQ0.elements;
		Method.extractQuatFromTransform(this._transform.elements, tq);
		Method.setXYZW(orientation, tq[0], tq[1], tq[2], tq[3]);
	}

	/**
	 * 设置刚体四元数。
	 * 设置后会更新逆转动惯量矩阵和形状列表
	 * @param {{ x: number, y: number, z: number, w: number }} _quaternion - 目标四元数
	 * @throws {Error} 地形刚体设置旋转时抛出错误
	 */
	public setOrientation(_quaternion: { x: number, y: number, z: number, w: number }): void {
		if (this._isTerrain) {
			throw new Error('Terrain cannot rotate');
		}
		const quaternion = new Quat(_quaternion.x, _quaternion.y, _quaternion.z, _quaternion.w);
		const transform = this._transform.elements;
		Method.setTransformOrientation(transform, quaternion.elements);
		this._transformInvInertia(transform);
		Method.copyElements(this._transform.elements, this._ptransform.elements);
		this._updateShapeList();
		this.sleeping = false;
		this.sleepTime = 0;
	}

	/**
	 * 获取刚体变换矩阵并写入目标对象
	 * @param {Transform} transform - 目标变换对象
	 */
	public getTransformTo(transform: Transform): void {
		Method.copyElements(this._transform.elements, transform.elements);
	}

	/**
	 * 设置刚体变换矩阵。
	 * 设置后会更新逆转动惯量矩阵和形状列表
	 * @param {Transform} transform - 目标变换矩阵
	 * @throws {Error} 地形刚体设置变换时抛出错误
	 */
	public setTransform(transform: Transform): void {
		if (this._isTerrain) {
			throw new Error('Terrain cannot rotate');
		}
		Method.copyElements(transform.elements, this._transform.elements);
		this._transformInvInertia(this._transform.elements);
		Method.copyElements(this._transform.elements, this._ptransform.elements);
		this._updateShapeList();
		this.sleeping = false;
		this.sleepTime = 0;
	}

	/**
	 * 获取本地转动惯量矩阵并写入目标对象
	 * @param {{ elements: Array<number> | Float64Array }} inertia - 目标矩阵对象
	 */
	public getLocalInertiaTo(inertia: { elements: Array<number> | Float64Array }): void {
		const li = this.localInertia;
		Method.setM3X3(inertia.elements as Float64Array, li[0], li[1], li[2], li[3], li[4], li[5], li[6], li[7], li[8]);
	}

	/**
	 * 获取质量数据（质量+本地转动惯量）并写入目标对象
	 * @param {MassData} massData - 目标质量数据对象
	 */
	public getMassDataTo(massData: MassData): void {
		massData.mass = this._mass;
		Method.copyElements(this.localInertia, massData.localInertia.elements);
	}

	/**
	 * 设置质量数据，会更新逆转动惯量矩阵
	 * @param {MassData} massData - 质量数据对象
	 */
	public setMassData(massData: MassData): void {
		this._mass = massData.mass;
		Method.copyElements(massData.localInertia.elements, this.localInertia);
		this._updateInvInertia();
		this.sleeping = false;
		this.sleepTime = 0;
	}

	/**
	 * 获取旋转因子并写入目标对象
	 * @param {{ x: number, y: number, z: number }} rotationFactor - 目标旋转因子对象
	 */
	public getRotationFactorTo(rotationFactor: { x: number, y: number, z: number }): void {
		const rf = this.rotFactor.elements;
		Method.setXYZ(rotationFactor, rf[0], rf[1], rf[2]);
	}

	/**
	 * 设置旋转因子，用于调整各轴转动惯量。
	 * 设置后会重新计算逆转动惯量矩阵
	 * @param {{ x: number, y: number, z: number }} rotationFactor - 旋转因子（x/y/z轴）
	 */
	public setRotationFactor(rotationFactor: { x: number, y: number, z: number }): void {
		Method.setXYZ(this.rotFactor, rotationFactor.x, rotationFactor.y, rotationFactor.z);
		this._transformInvInertia(this._transform.elements);
		this.sleeping = false;
		this.sleepTime = 0;
	}

	/**
	 * 获取线性速度并写入目标对象
	 * @param {{ x: number, y: number, z: number }} linearVelocity - 目标速度对象
	 * @returns {{ x: number, y: number, z: number }} 填充后的速度对象
	 */
	public getLinearVelocityTo(linearVelocity: { x: number, y: number, z: number }): { x: number, y: number, z: number } {
		const v = this.vel;
		return Method.setXYZ(linearVelocity, v[0], v[1], v[2]);
	}

	/**
	 * 设置线性速度，静态刚体速度会被置0
	 * @param {{ x: number, y: number, z: number }} linearVelocity - 目标线性速度
	 */
	public setLinearVelocity(linearVelocity: { x: number, y: number, z: number }): void {
		if (this.type === RIGID_BODY_TYPE.STATIC) {
			this.vel.fill(0);
		} else {
			this.vel[0] = linearVelocity.x;
			this.vel[1] = linearVelocity.y;
			this.vel[2] = linearVelocity.z;
		}
		this.sleeping = false;
		this.sleepTime = 0;
	}

	/**
	 * 获取角速度并写入目标对象
	 * @param {{ x: number, y: number, z: number }} angularVelocity - 目标角速度对象
	 */
	public getAngularVelocityTo(angularVelocity: { x: number, y: number, z: number }): void {
		const v = this.angVel;
		Method.setXYZ(angularVelocity, v[0], v[1], v[2]);
	}

	/**
	 * 设置角速度，静态刚体速度会被置0
	 * @param {{ x: number, y: number, z: number }} angularVelocity - 目标角速度
	 */
	public setAngularVelocity(angularVelocity: { x: number, y: number, z: number }): void {
		if (this.type === RIGID_BODY_TYPE.STATIC) {
			this.angVel.fill(0);
		} else {
			this.angVel[0] = angularVelocity.x;
			this.angVel[1] = angularVelocity.y;
			this.angVel[2] = angularVelocity.z;
		}
		this.sleeping = false;
		this.sleepTime = 0;
	}

	/**
	 * 添加线性速度增量。
	 * 静态刚体不会产生任何变化
	 * @param {{ x: number, y: number, z: number }} linearVelocityChange - 速度增量
	 */
	public addLinearVelocity(linearVelocityChange: { x: number, y: number, z: number }): void {
		if (this.type !== RIGID_BODY_TYPE.STATIC) {
			const v = (Method.setXYZ(this._tV0, linearVelocityChange.x, linearVelocityChange.y, linearVelocityChange.z) as Vec3).elements;
			const t = this.vel;
			t[0] += v[0]; t[1] += v[1]; t[2] += v[2];
		}
		this.sleeping = false;
		this.sleepTime = 0;
	}

	/**
	 * 添加角速度增量。
	 * 静态刚体不会产生任何变化
	 * @param {{ x: number, y: number, z: number }} angularVelocityChange - 角速度增量
	 */
	public addAngularVelocity(angularVelocityChange: { x: number, y: number, z: number }): void {
		if (this.type !== RIGID_BODY_TYPE.STATIC) {
			const v = (Method.setXYZ(this._tV0, angularVelocityChange.x, angularVelocityChange.y, angularVelocityChange.z) as Vec3).elements;
			const t = this.angVel;
			t[0] += v[0]; t[1] += v[1]; t[2] += v[2];
		}
		this.sleeping = false;
		this.sleepTime = 0;
	}

	/**
	 * 应用冲量到刚体指定位置。
	 * 1. 冲量会改变线性速度：Δv = J/m
	 * 2. 冲量会产生力矩，改变角速度：Δω = I⁻¹ × (r × J)
	 * 3. r是作用点到质心的向量
	 * @param {{ x: number, y: number, z: number }} _impulse - 冲量向量 (N·s)
	 * @param {{ x: number, y: number, z: number }} _positionInWorld - 世界空间中的作用点
	 */
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

	/**
	 * 应用线性冲量到刚体质心。
	 * 仅改变线性速度：Δv = J/m
	 * @param {{ x: number, y: number, z: number }} _impulse - 冲量向量 (N·s)
	 */
	public applyLinearImpulse(_impulse: { x: number, y: number, z: number }): void {
		const impulse = (Method.setXYZ(this._tV0, _impulse.x, _impulse.y, _impulse.z) as Vec3).elements;
		const impX = impulse[0], impY = impulse[1], impZ = impulse[2];
		const vel = this.vel, invMass = this._invMass;
		vel[0] += impX * invMass; vel[1] += impY * invMass; vel[2] += impZ * invMass;
		this.sleeping = false;
		this.sleepTime = 0;
	}

	/**
	 * 应用角冲量到刚体。
	 * 仅改变角速度：Δω = I⁻¹ × J
	 * @param {{ x: number, y: number, z: number }} _impulse - 角冲量向量 (kg·m²/s)
	 */
	public applyAngularImpulse(_impulse: { x: number, y: number, z: number }): void {
		const impulse = (Method.setXYZ(this._tV0, _impulse.x, _impulse.y, _impulse.z) as Vec3).elements;
		Method.rotateVec3(impulse, this.invInertia);
		const v = this.angVel;
		v[0] += impulse[0]; v[1] += impulse[1]; v[2] += impulse[2];
		this.sleeping = false;
		this.sleepTime = 0;
	}

	/**
	 * 应用力到刚体指定位置。
	 * 1. 力会累加到刚体的合外力中
	 * 2. 力会产生力矩，累加到合外力矩中：τ = r × F
	 * 3. 力的效果会在物理步进时体现（F = ma）
	 * @param {{ x: number, y: number, z: number }} _force - 力向量 (N)
	 * @param {{ x: number, y: number, z: number }} _positionInWorld - 世界空间中的作用点
	 */
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

	/**
	 * 应用力到刚体质心。
	 * 仅累加到合外力，不会产生力矩
	 * @param {{ x: number, y: number, z: number }} _force - 力向量 (N)
	 */
	public applyForceToCenter(_force: { x: number, y: number, z: number }): void {
		const force = (Method.setXYZ(this._tV0, _force.x, _force.y, _force.z) as Vec3).elements;
		const f = this.force;
		f[0] += force[0]; f[1] += force[1]; f[2] += force[2];
		this.sleeping = false;
		this.sleepTime = 0;
	}

	/**
	 * 应用力矩到刚体。
	 * 仅累加到合外力矩中
	 * @param {{ x: number, y: number, z: number }} _torque - 力矩向量 (N·m)
	 */
	public applyTorque(_torque: { x: number, y: number, z: number }): void {
		const torque = (Method.setXYZ(this._tV0, _torque.x, _torque.y, _torque.z) as Vec3).elements;
		const t = this.torque;
		t[0] += torque[0]; t[1] += torque[1]; t[2] += torque[2];
		this.sleeping = false;
		this.sleepTime = 0;
	}

	/**
	 * 获取接触产生的线性冲量累计值并写入目标对象。
	 * @param {{ x: number, y: number, z: number }} linearContactImpulse - 目标冲量对象
	 */
	public getLinearContactImpulseTo(linearContactImpulse: { x: number, y: number, z: number }): void {
		let lci = this.linearContactImpulse;
		Method.setXYZ(linearContactImpulse, lci[0], lci[1], lci[2]);
	}

	/**
	 * 获取接触产生的角冲量累计值并写入目标对象。
	 * @param {{ x: number, y: number, z: number }} angularContactImpulse - 目标角冲量对象
	 */
	public getAngularContactImpulseTo(angularContactImpulse: { x: number, y: number, z: number }): void {
		let aci = this.angularContactImpulse;
		Method.setXYZ(angularContactImpulse, aci[0], aci[1], aci[2]);
	}

	/**
	 * 将世界空间点转换为刚体本地空间点。
	 * @param {{ x: number, y: number, z: number }} worldPoint - 世界空间点
	 * @param {{ x: number, y: number, z: number }} localPoint - 输出的本地空间点
	 */
	public getLocalPointTo(worldPoint: { x: number, y: number, z: number }, localPoint: { x: number, y: number, z: number }): void {
		const wp = (Method.setXYZ(this._tV0, worldPoint.x, worldPoint.y, worldPoint.z) as Vec3).elements, es = this._tV1.elements;
		Method.inverseTransformVec3(this._transform.elements, wp, 0, es);
		Method.setXYZ(localPoint, es[0], es[1], es[2]);
	}

	/**
	 * 将世界空间向量转换为刚体本地空间向量。
	 * 仅转换方向，不包含位置偏移
	 * @param {{ x: number, y: number, z: number }} worldVector - 世界空间向量
	 * @param {{ x: number, y: number, z: number }} localVector - 输出的本地空间向量
	 */
	public getLocalVectorTo(worldVector: { x: number, y: number, z: number }, localVector: { x: number, y: number, z: number }): void {
		const wv = (Method.setXYZ(this._tV0, worldVector.x, worldVector.y, worldVector.z) as Vec3).elements, es = this._tV1.elements;
		Method.inverseTransformVec3(this._transform.elements, wv, 1, es);
		Method.setXYZ(localVector, es[0], es[1], es[2]);
	}

	/**
	 * 将刚体本地空间点转换为世界空间点。
	 * @param {{ x: number, y: number, z: number }} localPoint - 本地空间点
	 * @param {{ x: number, y: number, z: number }} worldPoint - 输出的世界空间点
	 */
	public getWorldPointTo(localPoint: { x: number, y: number, z: number }, worldPoint: { x: number, y: number, z: number }): void {
		const lp = (Method.setXYZ(this._tV0, localPoint.x, localPoint.y, localPoint.z) as Vec3).elements, es = this._tV1.elements;
		Method.transformVec3(this._transform.elements, lp, 0, es);
		Method.setXYZ(worldPoint, es[0], es[1], es[2]);
	}

	/**
	 * 将刚体本地空间向量转换为世界空间向量。
	 * 仅转换方向，不包含位置偏移
	 * @param {{ x: number, y: number, z: number }} localVector - 本地空间向量
	 * @param {{ x: number, y: number, z: number }} worldVector - 输出的世界空间向量
	 */
	public getWorldVectorTo(localVector: { x: number, y: number, z: number }, worldVector: { x: number, y: number, z: number }): void {
		const lv = (Method.setXYZ(this._tV0, localVector.x, localVector.y, localVector.z) as Vec3).elements, es = this._tV1.elements;
		Method.transformVec3(this._transform.elements, lv, 1, es);
		Method.setXYZ(worldVector, es[0], es[1], es[2]);
	}

	/**
	 * 唤醒刚体，退出休眠状态。
	 * 休眠的刚体不会参与物理计算，唤醒后重置休眠计时
	 */
	public wakeUp() {
		this.sleeping = false;
		this.sleepTime = 0;
	}

	/**
	 * 强制刚体进入休眠状态。
	 * 休眠可提升物理引擎性能，休眠的刚体只有被外力作用时才会唤醒
	 */
	public sleep() {
		this.sleeping = true;
		this.sleepTime = 0;
	}

	/**
	 * 积分刚体运动状态（位置和旋转）。
	 * 1. 静态刚体：重置所有速度为0
	 * 2. 动态/运动学刚体：
	 *    - 限制最大平移和旋转量，防止数值不稳定
	 *    - 积分线性速度更新位置
	 *    - 积分角速度更新旋转（四元数方式）
	 *    - 重新计算世界空间逆转动惯量
	 * @param {number} dt - 时间步长 (s)
	 */
	public integrate(dt: number): void {
		switch (this.type) {
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

	/**
	 * 积分伪速度，用于约束求解阶段的位置修正。
	 * 伪速度不代表真实的物理速度，仅用于碰撞响应的位置调整
	 */
	public integratePseudoVelocity(): void {
		const pseudoVel = this.pseudoVel, angPseudoVel = this.angPseudoVel;
		if (pseudoVel[0] * pseudoVel[0] + pseudoVel[1] * pseudoVel[1] + pseudoVel[2] * pseudoVel[2] === 0 &&
			angPseudoVel[0] * angPseudoVel[0] + angPseudoVel[1] * angPseudoVel[1] + angPseudoVel[2] * angPseudoVel[2] === 0) {
			return;
		}
		switch (this.type) {
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

	/**
	 * 更新所有关联形状的变换和AABB，并通知宽相位检测更新代理位置。
	 * 1. 计算形状的世界变换（本地变换 × 刚体变换）
	 * 2. 计算形状的合并AABB（包含上一帧和当前帧的位置）
	 * 3. 计算形状位移，更新宽相位碰撞代理
	 */
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

	/**
	 * 计算单个形状的AABB（合并上一帧和当前帧的AABB）。
	 * 合并AABB可确保碰撞检测覆盖刚体运动的整个过程，避免漏检
	 * @param {Shape} s - 目标形状
	 */
	private _computeShapeAabb(s: Shape) {
		s.geometry.computeAabb(s.aabb, s.ptransform);
		const aabb = s.aabb.elements;
		const minX = aabb[0], minY = aabb[1], minZ = aabb[2];
		const maxX = aabb[3], maxY = aabb[4], maxZ = aabb[5];
		s.geometry.computeAabb(s.aabb, s.transform);
		aabb[0] = minX < aabb[0] ? minX : aabb[0]; aabb[1] = minY < aabb[1] ? minY : aabb[1]; aabb[2] = minZ < aabb[2] ? minZ : aabb[2];
		aabb[3] = maxX > aabb[3] ? maxX : aabb[3]; aabb[4] = maxY > aabb[4] ? maxY : aabb[4]; aabb[5] = maxZ > aabb[5] ? maxZ : aabb[5];
	}

	/**
	 * 将本地逆转动惯量矩阵变换到世界坐标系。
	 * 1. 世界逆转动惯量 = R × I_local⁻¹ × Rᵀ（R为旋转矩阵）
	 * 2. 应用旋转因子（rotFactor）缩放各轴的转动惯性
	 * 3. 转动惯量矩阵是3x3对称矩阵，变换后仍保持对称
	 * @param {Float64Array} transform - 刚体当前的变换矩阵（行优先）
	 */
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

		// 计算 R × I_local⁻¹ × Rᵀ 的第二步：乘以旋转矩阵的转置
		const __tmp__001 = invInertia[0] * transform[3] + invInertia[1] * transform[4] + invInertia[2] * transform[5];
		const __tmp__011 = invInertia[0] * transform[6] + invInertia[1] * transform[7] + invInertia[2] * transform[8];
		const __tmp__021 = invInertia[0] * transform[9] + invInertia[1] * transform[10] + invInertia[2] * transform[11];
		const __tmp__101 = invInertia[3] * transform[3] + invInertia[4] * transform[4] + invInertia[5] * transform[5];
		const __tmp__111 = invInertia[3] * transform[6] + invInertia[4] * transform[7] + invInertia[5] * transform[8];
		const __tmp__121 = invInertia[3] * transform[9] + invInertia[4] * transform[10] + invInertia[5] * transform[11];
		const __tmp__201 = invInertia[6] * transform[3] + invInertia[7] * transform[4] + invInertia[8] * transform[5];
		const __tmp__211 = invInertia[6] * transform[6] + invInertia[7] * transform[7] + invInertia[8] * transform[8];
		const __tmp__221 = invInertia[6] * transform[9] + invInertia[7] * transform[10] + invInertia[8] * transform[11];

		// 更新逆转动惯量矩阵
		invInertia[0] = __tmp__001; invInertia[1] = __tmp__011; invInertia[2] = __tmp__021;
		invInertia[3] = __tmp__101; invInertia[4] = __tmp__111; invInertia[5] = __tmp__121;
		invInertia[6] = __tmp__201; invInertia[7] = __tmp__211; invInertia[8] = __tmp__221;

		// 应用旋转因子缩放各轴的转动惯量
		const rf = this.rotFactor.elements;
		invInertia[0] *= rf[0]; invInertia[1] *= rf[0]; invInertia[2] *= rf[0];
		invInertia[3] *= rf[1]; invInertia[4] *= rf[1]; invInertia[5] *= rf[1];
		invInertia[6] *= rf[2]; invInertia[7] *= rf[2]; invInertia[8] *= rf[2];
	}

	/**
	 * 更新逆转动惯量矩阵（核心物理计算方法）。
	 * 1. 验证质量和转动惯量矩阵的有效性（正定矩阵）
	 * 2. 计算质量的倒数（用于优化除法运算）
	 * 3. 计算本地逆转动惯量矩阵（矩阵求逆）
	 * 4. 应用旋转因子并转换到世界坐标系
	 * 5. 静态刚体或无效惯量矩阵会被重置为0
	 */
	private _updateInvInertia(): void {
		const localInertia = this.localInertia, invLocalInertia = this.invLocalInertia,
			invLocalInertiaWithoutRotFactor = this.invLocalInertiaWithoutRotFactor, invInertia = this.invInertia;
		const transform = this._transform.elements, rf = this.rotFactor.elements;

		// 验证质量和转动惯量矩阵的有效性（必须是正定矩阵）
		if (this._mass > 0 &&
			localInertia[0] * (localInertia[4] * localInertia[8] - localInertia[5] * localInertia[7]) -
			localInertia[1] * (localInertia[3] * localInertia[8] - localInertia[5] * localInertia[6]) +
			localInertia[2] * (localInertia[3] * localInertia[7] - localInertia[4] * localInertia[6]) > 0 &&
			this.type === RIGID_BODY_TYPE.DYNAMIC) {

			// 计算质量倒数（除法转乘法，提升性能）
			this._invMass = 1 / this._mass;

			// 计算3x3矩阵的伴随矩阵元素（用于求逆）
			const d00 = localInertia[4] * localInertia[8] - localInertia[5] * localInertia[7];
			const d01 = localInertia[3] * localInertia[8] - localInertia[5] * localInertia[6];
			const d02 = localInertia[3] * localInertia[7] - localInertia[4] * localInertia[6];

			// 计算矩阵行列式
			let d = localInertia[0] * d00 - localInertia[1] * d01 + localInertia[2] * d02;
			if (d < -1e-32 || d > 1e-32) {
				d = 1 / d; // 行列式非零时计算倒数
			}

			// 计算本地逆转动惯量矩阵（伴随矩阵 / 行列式）
			invLocalInertia[0] = d00 * d;
			invLocalInertia[1] = -(localInertia[1] * localInertia[8] - localInertia[2] * localInertia[7]) * d;
			invLocalInertia[2] = (localInertia[1] * localInertia[5] - localInertia[2] * localInertia[4]) * d;
			invLocalInertia[3] = -d01 * d;
			invLocalInertia[4] = (localInertia[0] * localInertia[8] - localInertia[2] * localInertia[6]) * d;
			invLocalInertia[5] = -(localInertia[0] * localInertia[5] - localInertia[2] * localInertia[3]) * d;
			invLocalInertia[6] = d02 * d;
			invLocalInertia[7] = -(localInertia[0] * localInertia[7] - localInertia[1] * localInertia[6]) * d;
			invLocalInertia[8] = (localInertia[0] * localInertia[4] - localInertia[1] * localInertia[3]) * d;

			// 保存未应用旋转因子的逆惯量矩阵（用于旋转因子修改时快速计算）
			invLocalInertiaWithoutRotFactor[0] = invLocalInertia[0];
			invLocalInertiaWithoutRotFactor[1] = invLocalInertia[1];
			invLocalInertiaWithoutRotFactor[2] = invLocalInertia[2];
			invLocalInertiaWithoutRotFactor[3] = invLocalInertia[3];
			invLocalInertiaWithoutRotFactor[4] = invLocalInertia[4];
			invLocalInertiaWithoutRotFactor[5] = invLocalInertia[5];
			invLocalInertiaWithoutRotFactor[6] = invLocalInertia[6];
			invLocalInertiaWithoutRotFactor[7] = invLocalInertia[7];
			invLocalInertiaWithoutRotFactor[8] = invLocalInertia[8];

			// 应用旋转因子到本地逆惯量矩阵
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
			// 静态刚体或无效惯量矩阵：重置质量倒数和逆惯量矩阵
			this._invMass = 0;
			invLocalInertia.fill(0);
			invLocalInertiaWithoutRotFactor.fill(0);

			// 动态刚体但惯量无效时自动转为静态
			if (this.type === RIGID_BODY_TYPE.DYNAMIC) {
				this.type = RIGID_BODY_TYPE.STATIC;
			}
		}

		// 将本地逆惯量矩阵转换到世界坐标系
		invInertia[0] = transform[3] * invLocalInertia[0] + transform[4] * invLocalInertia[3] + transform[5] * invLocalInertia[6];
		invInertia[1] = transform[3] * invLocalInertia[1] + transform[4] * invLocalInertia[4] + transform[5] * invLocalInertia[7];
		invInertia[2] = transform[3] * invLocalInertia[2] + transform[4] * invLocalInertia[5] + transform[5] * invLocalInertia[8];
		invInertia[3] = transform[6] * invLocalInertia[0] + transform[7] * invLocalInertia[3] + transform[8] * invLocalInertia[6];
		invInertia[4] = transform[6] * invLocalInertia[1] + transform[7] * invLocalInertia[4] + transform[8] * invLocalInertia[7];
		invInertia[5] = transform[6] * invLocalInertia[2] + transform[7] * invLocalInertia[5] + transform[8] * invLocalInertia[8];
		invInertia[6] = transform[9] * invLocalInertia[0] + transform[10] * invLocalInertia[3] + transform[11] * invLocalInertia[6];
		invInertia[7] = transform[9] * invLocalInertia[1] + transform[10] * invLocalInertia[4] + transform[11] * invLocalInertia[7];
		invInertia[8] = transform[9] * invLocalInertia[2] + transform[10] * invLocalInertia[5] + transform[11] * invLocalInertia[8];

		// 完成 R × I_local⁻¹ × Rᵀ 计算
		const __tmp__001 = invInertia[0] * transform[3] + invInertia[1] * transform[4] + invInertia[2] * transform[5];
		const __tmp__011 = invInertia[0] * transform[6] + invInertia[1] * transform[7] + invInertia[2] * transform[8];
		const __tmp__021 = invInertia[0] * transform[9] + invInertia[1] * transform[10] + invInertia[2] * transform[11];
		const __tmp__101 = invInertia[3] * transform[3] + invInertia[4] * transform[4] + invInertia[5] * transform[5];
		const __tmp__111 = invInertia[3] * transform[6] + invInertia[4] * transform[7] + invInertia[5] * transform[8];
		const __tmp__121 = invInertia[3] * transform[9] + invInertia[4] * transform[10] + invInertia[5] * transform[11];
		const __tmp__201 = invInertia[6] * transform[3] + invInertia[7] * transform[4] + invInertia[8] * transform[5];
		const __tmp__211 = invInertia[6] * transform[6] + invInertia[7] * transform[7] + invInertia[8] * transform[8];
		const __tmp__221 = invInertia[6] * transform[9] + invInertia[7] * transform[10] + invInertia[8] * transform[11];

		// 更新世界逆惯量矩阵
		invInertia[0] = __tmp__001; invInertia[1] = __tmp__011; invInertia[2] = __tmp__021;
		invInertia[3] = __tmp__101; invInertia[4] = __tmp__111; invInertia[5] = __tmp__121;
		invInertia[6] = __tmp__201; invInertia[7] = __tmp__211; invInertia[8] = __tmp__221;

		// 再次应用旋转因子（双重应用确保正确性）
		invInertia[0] *= rf[0]; invInertia[1] *= rf[0]; invInertia[2] *= rf[0];
		invInertia[3] *= rf[1]; invInertia[4] *= rf[1]; invInertia[5] *= rf[1];
		invInertia[6] *= rf[2]; invInertia[7] *= rf[2]; invInertia[8] *= rf[2];
	}
}

export type { IObject3D };
export { RigidBody };