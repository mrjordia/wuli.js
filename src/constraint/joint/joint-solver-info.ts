import JointSolverInfoRow from "./joint-solver-info-row";
import { CONSTANT } from '../../constant';
import RigidBody from "../../rigid-body/rigid-body";
import { Nullable } from "../../common/nullable";

export default class JointSolverInfo {
	public rigidBody1: Nullable<RigidBody>;
	public rigidBody2: Nullable<RigidBody>;
	public numRows = 0;
	public rows: Array<JointSolverInfoRow> = new Array(CONSTANT.SETTING_MAX_JACOBIAN_ROWS);
	constructor() {
		let _g = 0;
		const _g1 = this.rows.length;
		while (_g < _g1) this.rows[_g++] = new JointSolverInfoRow();
	}
}