import ContactLink from "./contact-link";
import CachedDetectorData from "../../collision-detector/cached-detector-data";
import DetectorResult from "../../collision-detector/detector-result";
import Manifold from "./manifold";
import ManifoldUpdater from "./manifold-updater";
import ContactConstraint from "./contact-constraint";
import { CONSTANT } from "../../constant";
import Shape from "../../shape/shape";
import RigidBody from "../../rigid-body/rigid-body";
import Detector from "../../collision-detector/detector";
import { Nullable } from "../../common/nullable";


export default class Contact {
	public next: Nullable<Contact>;
	public prev: Nullable<Contact>;
	public link1 = new ContactLink();
	public link2 = new ContactLink();
	public shape1: Nullable<Shape>;
	public shape2: Nullable<Shape>;
	public rigidBody1: Nullable<RigidBody>;
	public rigidBody2: Nullable<RigidBody>;
	public detector: Nullable<Detector>;
	public cachedDetectorData = new CachedDetectorData();
	public detectorResult = new DetectorResult();
	public latest = false;
	public shouldBeSkipped = false;
	public manifold = new Manifold();
	public updater: ManifoldUpdater;
	public contactConstraint: ContactConstraint;
	public touching = false;

	constructor() {
		this.updater = new ManifoldUpdater(this.manifold);
		this.contactConstraint = new ContactConstraint(this.manifold);
	}

	public updateManifold(): void {
		if (!this.detector) {
			return;
		}
		const ptouching = this.touching;
		const result = this.detectorResult;
		this.detector.detect(result, this.shape1!.geometry, this.shape2!.geometry, this.shape1!.transform, this.shape2!.transform, this.cachedDetectorData);
		this.touching = result.numPoints > 0;
		if (this.touching) {
			this.manifold.buildBasis(result.normal);
			if (result.getMaxDepth() > CONSTANT.SETTING_CONTACT_USE_ALTERNATIVE_POSITION_CORRECTION_ALGORITHM_DEPTH_THRESHOLD) {
				this.contactConstraint.positionCorrectionAlgorithm = CONSTANT.SETTING_ALTERNATIVE_CONTACT_POSITION_CORRECTION_ALGORITHM;
			} else {
				this.contactConstraint.positionCorrectionAlgorithm = CONSTANT.SETTING_DEFAULT_CONTACT_POSITION_CORRECTION_ALGORITHM;
			}
			if (result.incremental) {
				this.updater.incrementalUpdate(result, this.rigidBody1!.transform, this.rigidBody2!.transform);
			} else {
				this.updater.totalUpdate(result, this.rigidBody1!.transform, this.rigidBody2!.transform);
			}
		} else {
			this.manifold.clear();
		}
		if (this.touching && !ptouching) {
			const cc1 = this.shape1!.contactCallback;
			let cc2 = this.shape2!.contactCallback;
			if (cc1 === cc2) {
				cc2 = null;
			}
			if (cc1) {
				cc1.beginContact(this);
			}
			if (cc2) {
				cc2.beginContact(this);
			}
		}
		if (!this.touching && ptouching) {
			const cc1 = this.shape1!.contactCallback;
			let cc2 = this.shape2!.contactCallback;
			if (cc1 === cc2) {
				cc2 = null;
			}
			if (cc1) {
				cc1.endContact(this);
			}
			if (cc2) {
				cc2.endContact(this);
			}
		}
		if (this.touching) {
			const cc1 = this.shape1!.contactCallback;
			let cc2 = this.shape2!.contactCallback;
			if (cc1 === cc2) {
				cc2 = null;
			}
			if (cc1) {
				cc1.preSolve(this);
			}
			if (cc2) {
				cc2.preSolve(this);
			}
		}
	}
	public postSolve(): void {
		const cc1 = this.shape1!.contactCallback;
		let cc2 = this.shape2!.contactCallback;
		if (cc1 === cc2) {
			cc2 = null;
		}
		if (cc1) {
			cc1.postSolve(this);
		}
		if (cc2) {
			cc2.postSolve(this);
		}
	}

}