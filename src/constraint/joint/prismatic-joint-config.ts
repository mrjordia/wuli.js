import JointConfig from "./joint-config";
import Vec3 from "../../common/vec3";
import TranslationalLimitMotor from "./translational-limit-motor";
import SpringDamper from "./spring-damper";
import Method from "../../common/method";
import RigidBody from "../../rigid-body/rigid-body";

export default class PrismaticJointConfig extends JointConfig {

	public localAxis1 = new Vec3(1, 0, 0);
	public localAxis2 = new Vec3(1, 0, 0);
	public limitMotor = new TranslationalLimitMotor();
	public springDamper = new SpringDamper();

	public init(rigidBody1 : RigidBody, rigidBody2 : RigidBody, _worldAnchor : Vec3, _worldAxis : Vec3) : PrismaticJointConfig {
		this.initialize(rigidBody1, rigidBody2, _worldAnchor);
		Method.inverseTransformVec3(rigidBody1.transform.elements, _worldAxis.elements, 1, this.localAxis1.elements);
		Method.inverseTransformVec3(rigidBody2.transform.elements, _worldAxis.elements, 1, this.localAxis2.elements);
		return this;
	}
}