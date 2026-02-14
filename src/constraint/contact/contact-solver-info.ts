import ContactSolverInfoRow from "./contact-solver-info-row";
import { CONSTANT } from '../../constant';
import RigidBody from "../../rigid-body/rigid-body";
import { Nullable } from "../../common/nullable";

export default class ContactSolverInfo {
	public rigidBody1: Nullable<RigidBody>;
	public rigidBody2: Nullable<RigidBody>;
	public numRows = 0;
	public rows: Array<ContactSolverInfoRow> = new Array(CONSTANT.SETTING_MAX_MANIFOLD_POINTS);
	constructor() {
		let _g = 0, _g1 = this.rows.length;
		while (_g < _g1) this.rows[_g++] = new ContactSolverInfoRow();
	}
}