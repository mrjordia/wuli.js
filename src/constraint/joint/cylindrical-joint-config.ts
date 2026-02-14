import JointConfig from "./joint-config";
import Vec3 from "../../common/vec3";
import TranslationalLimitMotor from "./translational-limit-motor";
import SpringDamper from "./spring-damper";
import RotationalLimitMotor from "./rotational-limit-motor";
import Method from "../../common/method";
import RigidBody from "../../rigid-body/rigid-body";

export default class CylindricalJointConfig extends JointConfig {
	public localAxis1 = new Vec3(1, 0, 0);
	public localAxis2 = new Vec3(1, 0, 0);
	public translationalLimitMotor = new TranslationalLimitMotor();
	public translationalSpringDamper = new SpringDamper();
	public rotationalLimitMotor = new RotationalLimitMotor();
	public rotationalSpringDamper = new SpringDamper();

	public init(rigidBody1 : RigidBody, rigidBody2 : RigidBody, _worldAnchor : Vec3, _worldAxis : Vec3) : CylindricalJointConfig {
		this.initialize(rigidBody1, rigidBody2, _worldAnchor);
		Method.inverseTransformVec3(rigidBody1.transform.elements, _worldAxis.elements, 1, this.localAxis1.elements);
		Method.inverseTransformVec3(rigidBody2.transform.elements, _worldAxis.elements, 1, this.localAxis2.elements);
		return this;
	}
}