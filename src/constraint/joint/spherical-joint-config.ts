import JointConfig from "./joint-config";
import SpringDamper from "./spring-damper";
import RigidBody from "../../rigid-body/rigid-body";
import Vec3 from "../../common/vec3";


export default class SphericalJointConfig extends JointConfig {

	public springDamper = new SpringDamper();

	public init(rigidBody1 : RigidBody, rigidBody2 : RigidBody, _worldAnchor : Vec3) : SphericalJointConfig {
		this.initialize(rigidBody1, rigidBody2, _worldAnchor);
		return this;
	}
}