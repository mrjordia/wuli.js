import Vec3 from "../../common/vec3";
import { CONSTANT } from '../../constant';
import Method from "../../common/method";
import RigidBody from "../../rigid-body/rigid-body";

export default class JointConfig {
	public rigidBody1 !: RigidBody;
	public rigidBody2 !: RigidBody;
	public localAnchor1 = new Vec3();
	public localAnchor2 = new Vec3();
	public allowCollision = false;
	public solverType = CONSTANT.SETTING_DEFAULT_JOINT_CONSTRAINT_SOLVER_TYPE;
	public positionCorrectionAlgorithm = CONSTANT.SETTING_DEFAULT_JOINT_POSITION_CORRECTION_ALGORITHM;
	public breakForce = 0;
	public breakTorque = 0;

	protected initialize(rb1: RigidBody, rb2: RigidBody, _worldAnchor: Vec3): void {
		const worldAnchor = _worldAnchor.elements;
		this.rigidBody1 = rb1;
		this.rigidBody2 = rb2;
		const tf1 = this.rigidBody1.transform.elements, localPoint = this.localAnchor1.elements;
		Method.inverseTransformVec3(tf1, worldAnchor, 0, localPoint);
		const tf2 = this.rigidBody2.transform.elements, localPoint1 = this.localAnchor2.elements;
		Method.inverseTransformVec3(tf2, worldAnchor, 0, localPoint1);
	}
}