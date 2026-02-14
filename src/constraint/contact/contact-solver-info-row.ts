import { Nullable } from "../../common/nullable";
import JacobianRow from "../solver/jacobian-row";
import ContactImpulse from "./contact-impulse";

export default class ContactSolverInfoRow {
	public jacobianN = new JacobianRow();
	public jacobianT = new JacobianRow();
	public jacobianB = new JacobianRow();
	public rhs = 0;
	public cfm = 0;
	public friction = 0;
	public impulse: Nullable<ContactImpulse>;
}