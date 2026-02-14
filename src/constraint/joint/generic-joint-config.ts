import JointConfig from "./joint-config";
import Mat3 from "../../common/mat3";
import TranslationalLimitMotor from "./translational-limit-motor";
import RotationalLimitMotor from "./rotational-limit-motor";
import SpringDamper from "./spring-damper";
import Method from "../../common/method";
import RigidBody from "../../rigid-body/rigid-body";
import Vec3 from "../../common/vec3";

export default class GenericJointConfig extends JointConfig {
	public localBasis1 = new Mat3();
	public localBasis2 = new Mat3();
	public translationalLimitMotors = [
		new TranslationalLimitMotor().setLimits(0, 0),
		new TranslationalLimitMotor().setLimits(0, 0),
		new TranslationalLimitMotor().setLimits(0, 0)
	];
	public rotationalLimitMotors = [
		new RotationalLimitMotor().setLimits(0, 0),
		new RotationalLimitMotor().setLimits(0, 0),
		new RotationalLimitMotor().setLimits(0, 0)
	];
	public translationalSpringDampers = [new SpringDamper(), new SpringDamper(), new SpringDamper()];
	public rotationalSpringDampers = [new SpringDamper(), new SpringDamper(), new SpringDamper()];

	public init(rigidBody1 : RigidBody, rigidBody2 : RigidBody, _worldAnchor : Vec3, _worldBasis1 : Mat3, _worldBasis2 : Mat3) : GenericJointConfig {
		this.initialize(rigidBody1, rigidBody2, _worldAnchor);
		Method.inverseTransformM3(rigidBody1.transform.elements, _worldBasis1.elements, this.localBasis1.elements);
		Method.inverseTransformM3(rigidBody2.transform.elements, _worldBasis2.elements, this.localBasis2.elements);
		return this;
	}
}