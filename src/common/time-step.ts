export default class TimeStep {
	public dt : number;
	public invDt : number;
	public dtRatio : number;
	constructor(dt = 0, invDt = 0, dtRatio = 1) {
		this.dt = dt;
		this.invDt = invDt;
		this.dtRatio = dtRatio;
	}
}