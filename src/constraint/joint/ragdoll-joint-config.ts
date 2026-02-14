import JointConfig from "./joint-config";
import Vec3 from "../../common/vec3";
import SpringDamper from "./spring-damper";
import RotationalLimitMotor from "./rotational-limit-motor";
import Method from "../../common/method";
import RigidBody from "../../rigid-body/rigid-body";

export default class RagdollJointConfig extends JointConfig {

	public localTwistAxis1 = new Vec3(1, 0, 0);
	public localTwistAxis2 = new Vec3(1, 0, 0);
	public localSwingAxis1 = new Vec3(0, 1, 0);
	public twistSpringDamper = new SpringDamper();
	public swingSpringDamper = new SpringDamper();
	public twistLimitMotor = new RotationalLimitMotor();
	public maxSwingAngle1 = 3.14159265358979;
	public maxSwingAngle2 = 3.14159265358979;

	public init(rigidBody1 : RigidBody, rigidBody2 : RigidBody, _worldAnchor : Vec3, _worldTwistAxis : Vec3, _worldSwingAxis : Vec3) : RagdollJointConfig {
		this.initialize(rigidBody1, rigidBody2, _worldAnchor);
		Method.inverseTransformVec3(rigidBody1.transform.elements, _worldTwistAxis.elements, 1, this.localTwistAxis1.elements);
		Method.inverseTransformVec3(rigidBody2.transform.elements, _worldTwistAxis.elements, 1, this.localTwistAxis2.elements);
		Method.inverseTransformVec3(rigidBody1.transform.elements, _worldSwingAxis.elements, 1, this.localSwingAxis1.elements);
		return this;
	}
}