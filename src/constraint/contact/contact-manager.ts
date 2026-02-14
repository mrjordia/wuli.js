import CollisionMatrix from "../../collision-detector/collision-matrix";
import Contact from "./contact";
import { RIGID_BODY_TYPE } from "../../constant";
import BroadPhase from "../../broad-phase/broad-phase";
import ContactLink from "./contact-link";
import Shape from "../../shape/shape";
import JointLink from "../joint/joint-link";
import RigidBody from "../../rigid-body/rigid-body";
import { Nullable } from "../../common/nullable";

export default class ContactManager {
	public broadPhase: BroadPhase;
	public collisionMatrix = new CollisionMatrix();
	public numContacts = 0;
	public contactList!: Contact;
	public contactListLast!: Contact
	public contactPool!: Contact;
	constructor(broadPhase: BroadPhase) {
		this.broadPhase = broadPhase;
	}

	public createContacts(): void {
		let pp = this.broadPhase.proxyPairList;
		while (pp) {
			const n = pp.next;
			let s1: Shape, s2: Shape;
			if (pp.proxy1!.id < pp.proxy2!.id) {
				s1 = pp.proxy1!.userData!;
				s2 = pp.proxy2!.userData!;
			} else {
				s1 = pp.proxy2!.userData!;
				s2 = pp.proxy1!.userData!;
			}
			if (this.shouldCollide(s1, s2)) {
				const b1 = s1.rigidBody!, b2 = s2.rigidBody!;
				let l: Nullable<ContactLink>;
				if (b1.numContactLinks < b2.numContactLinks) {
					l = b1.contactLinkList;
				} else {
					l = b2.contactLinkList;
				}
				const id1 = s1.id, id2 = s2.id;
				let found = false;
				while (l) {
					const c = l.contact!;
					if (c.shape1!.id === id1 && c.shape2!.id === id2) {
						c.latest = true;
						found = true;
						break;
					}
					l = l.next;
				}
				if (!found) {
					let first = this.contactPool;
					if (first) {
						this.contactPool = first.next!;
						first.next = null;
					} else {
						first = new Contact();
					}
					const c = first;
					if (!this.contactList) {
						this.contactList = this.contactListLast = c;
					} else {
						this.contactListLast.next = c;
						c.prev = this.contactListLast;
						this.contactListLast = c;
					}
					c.latest = true;
					const detector = this.collisionMatrix.getDetector(s1.geometry.type, s2.geometry.type);
					c.shape1 = s1;
					c.shape2 = s2;
					c.rigidBody1 = s1.rigidBody;
					c.rigidBody2 = s2.rigidBody;
					c.touching = false;
					if (!c.rigidBody1!.contactLinkList) {
						c.rigidBody1!.contactLinkList = c.rigidBody1!.contactLinkListLast = c.link1;
					} else {
						c.rigidBody1!.contactLinkListLast!.next = c.link1;
						c.link1.prev = c.rigidBody1!.contactLinkListLast;
						c.rigidBody1!.contactLinkListLast = c.link1;
					}
					if (!c.rigidBody2!.contactLinkList) {
						c.rigidBody2!.contactLinkList = c.rigidBody2!.contactLinkListLast = c.link2;
					} else {
						c.rigidBody2!.contactLinkListLast!.next = c.link2;
						c.link2.prev = c.rigidBody2!.contactLinkListLast;
						c.rigidBody2!.contactLinkListLast = c.link2;
					}
					c.rigidBody1!.numContactLinks++;
					c.rigidBody2!.numContactLinks++;
					c.link1.other = c.rigidBody2;
					c.link2.other = c.rigidBody1;
					c.link1.contact = c.link2.contact = c;
					c.detector = detector;
					const _this = c.contactConstraint;
					_this.shape1 = s1;
					_this.shape2 = s2;
					_this.rigidBody1 = _this.shape1.rigidBody;
					_this.rigidBody2 = _this.shape2.rigidBody;
					_this.transform1 = _this.rigidBody1!.transform;
					_this.transform2 = _this.rigidBody2!.transform;
					this.numContacts++;
				}
			}
			pp = n;
		}
	}
	public destroyOutdatedContacts(): void {
		const RBS = RIGID_BODY_TYPE.STATIC;
		const incremental = this.broadPhase.incremental;
		let c: Nullable<Contact> = this.contactList;
		while (c) {
			let n: Nullable<Contact> = c.next;
			if (c.latest) {
				c.latest = c.shouldBeSkipped = false;
			} else {
				if (!incremental) {
					const prev = c.prev, next = c.next;
					if (prev) prev.next = next;
					if (next) next.prev = prev;
					if (c === this.contactList) this.contactList = this.contactList.next!;
					if (c === this.contactListLast) this.contactListLast = this.contactListLast.prev!;
					c.next = c.prev = null;
					if (c.touching) {
						let cc1 = c.shape1!.contactCallback, cc2 = c.shape2!.contactCallback;
						if (cc1 === cc2) cc2 = null;
						if (cc1) cc1.endContact(c);
						if (cc2) cc2.endContact(c);
					}
					const prev1 = c.link1.prev, next1 = c.link1.next;
					if (prev1) prev1.next = next1;
					if (next1) next1.prev = prev1;
					if (c.link1 === c.rigidBody1!.contactLinkList) c.rigidBody1!.contactLinkList = c.rigidBody1!.contactLinkList.next;
					if (c.link1 === c.rigidBody1!.contactLinkListLast) c.rigidBody1!.contactLinkListLast = c.rigidBody1!.contactLinkListLast.prev;
					c.link1.next = c.link1.prev = null;
					const prev2 = c.link2.prev, next2 = c.link2.next;
					if (prev2) prev2.next = next2;
					if (next2) next2.prev = prev2;
					if (c.link2 === c.rigidBody2!.contactLinkList) c.rigidBody2!.contactLinkList = c.rigidBody2!.contactLinkList.next;
					if (c.link2 === c.rigidBody2!.contactLinkListLast) c.rigidBody2!.contactLinkListLast = c.rigidBody2!.contactLinkListLast.prev;
					c.link2.next = c.link2.prev = null;
					c.rigidBody1!.numContactLinks--;
					c.rigidBody2!.numContactLinks--;
					c.link1.other = c.link2.other = null;
					c.link1.contact = c.link2.contact = null;
					c.shape1 = c.shape2 = null;
					c.rigidBody1 = c.rigidBody2 = null;
					c.touching = false;
					c.cachedDetectorData.clear();
					c.manifold.clear();
					c.detector = null;
					const _this = c.contactConstraint;
					_this.shape1 = _this.shape2 = null;
					_this.rigidBody1 = _this.rigidBody2 = null;
					_this.transform1 = _this.transform2 = null;
					c.next = this.contactPool;
					this.contactPool = c;
					this.numContacts--;
				} else {
					const s1 = c.shape1!, s2 = c.shape2!;
					const r1 = s1.rigidBody!, r2 = s2.rigidBody!;
					if (!(!r1.sleeping && r1.type !== RBS) && !(!r2.sleeping && r2.type !== RBS)) {
						c.shouldBeSkipped = true;
					} else {
						const ab1 = s1.aabb.elements, ab2 = s2.aabb.elements;
						const px1 = s1.proxy!.size, px2 = s2.proxy!.size;
						if (!(px1[0] < px2[3] && px1[3] > px2[0] && px1[1] < px2[4] && px1[4] > px2[1] && px1[2] < px2[5] && px1[5] > px2[2]) ||
							!this.shouldCollide(s1, s2)) {
							const prev = c.prev, next = c.next;
							if (prev) prev.next = next;
							if (next) next.prev = prev;
							if (c === this.contactList) this.contactList = this.contactList.next!;
							if (c === this.contactListLast) this.contactListLast = this.contactListLast.prev!;
							c.next = c.prev = null;
							if (c.touching) {
								let cc1 = c.shape1!.contactCallback, cc2 = c.shape2!.contactCallback;
								if (cc1 === cc2) cc2 = null;
								if (cc1) cc1.endContact(c);
								if (cc2) cc2.endContact(c);
							}
							const prev1 = c.link1.prev, next1 = c.link1.next;
							if (prev1) prev1.next = next1;
							if (next1) next1.prev = prev1;
							if (c.link1 === c.rigidBody1!.contactLinkList) c.rigidBody1!.contactLinkList = c.rigidBody1!.contactLinkList.next;
							if (c.link1 === c.rigidBody1!.contactLinkListLast) c.rigidBody1!.contactLinkListLast = c.rigidBody1!.contactLinkListLast.prev;
							c.link1.next = c.link1.prev = null;
							const prev2 = c.link2.prev, next2 = c.link2.next;
							if (prev2) prev2.next = next2;
							if (next2) next2.prev = prev2;
							if (c.link2 === c.rigidBody2!.contactLinkList) c.rigidBody2!.contactLinkList = c.rigidBody2!.contactLinkList.next;
							if (c.link2 === c.rigidBody2!.contactLinkListLast) c.rigidBody2!.contactLinkListLast = c.rigidBody2!.contactLinkListLast.prev;
							c.link2.next = c.link2.prev = null;
							c.rigidBody1!.numContactLinks--;
							c.rigidBody2!.numContactLinks--;
							c.link1.other = c.link2.other = null;
							c.link1.contact = c.link2.contact = null;
							c.shape1 = c.shape2 = null;
							c.rigidBody1 = c.rigidBody2 = null;
							c.touching = false;
							c.cachedDetectorData.clear();
							c.manifold.clear();
							c.detector = null;
							const _this = c.contactConstraint;
							_this.shape1 = _this.shape2 = null;
							_this.rigidBody1 = _this.rigidBody2 = null;
							_this.transform1 = _this.transform2 = null;
							c.next = this.contactPool;
							this.contactPool = c;
							this.numContacts--;
						} else {
							c.shouldBeSkipped = !(ab1[0] < ab2[3] && ab1[3] > ab2[0] && ab1[1] < ab2[4] && ab1[4] > ab2[1] && ab1[2] < ab2[5] && ab1[5] > ab2[2]);
						}
					}
				}
			}
			c = n;
		}
	}
	public shouldCollide(s1: Shape, s2: Shape): boolean {
		const RBD = RIGID_BODY_TYPE.DYNAMIC;
		const r1 = s1.rigidBody!, r2 = s2.rigidBody!;
		if (r1 === r2) {
			return false;
		}
		if (r1.type !== RBD && r2.type !== RBD) {
			return false;
		}
		if ((s1.collisionGroup & s2.collisionMask) === 0 || (s2.collisionGroup & s1.collisionMask) === 0) {
			return false;
		}
		let jl: JointLink, other: RigidBody;
		if (r1.numJointLinks < r2.numJointLinks) {
			jl = r1.jointLinkList!;
			other = r2;
		} else {
			jl = r2.jointLinkList!;
			other = r1;
		}
		while (jl) {
			if (jl.other === other && !jl.joint.allowCollision) {
				return false;
			}
			jl = jl.next!;
		}
		return true;
	}

	public updateContacts(): void {
		this.broadPhase.collectPairs();
		this.createContacts();
		this.destroyOutdatedContacts();
	}
	public postSolve(): void {
		let c: Nullable<Contact> = this.contactList;
		while (c) {
			const n: Nullable<Contact> = c.next;
			if (c.touching) {
				c.postSolve();
			}
			c = n;
		}
	}
}