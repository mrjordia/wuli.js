import { Nullable } from "../../common/nullable";
import JacobianRow from "../solver/jacobian-row";
import JointImpulse from "./joint-impulse";

export default class JointSolverInfoRow {
	public jacobian = new JacobianRow();
	public rhs = 0;
	public cfm = 0;
	public minImpulse = 0;
	public maxImpulse = 0;
	public motorSpeed = 0;
	public motorMaxImpulse = 0;
	public impulse: Nullable<JointImpulse>;
}