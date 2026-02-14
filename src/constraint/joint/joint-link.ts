import { Nullable } from "../../common/nullable";
import RigidBody from "../../rigid-body/rigid-body";
import Joint from "./joint";

export default class JointLink {
	public joint: Joint;
	public other: Nullable<RigidBody>;
	public prev: Nullable<JointLink>;
	public next: Nullable<JointLink>;

	constructor(joint: Joint) {
		this.joint = joint;
	}

}