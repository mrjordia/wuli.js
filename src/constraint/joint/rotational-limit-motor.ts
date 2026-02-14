
export default class RotationalLimitMotor {

	public lowerLimit = 1;
	public upperLimit = 0;
	public motorTorque = 0;
	public motorSpeed = 0;

	public setLimits(lower : number, upper : number) : RotationalLimitMotor {
		this.lowerLimit = lower;
		this.upperLimit = upper;
		return this;
	}
	public setMotor(speed : number, torque : number) : RotationalLimitMotor {
		this.motorSpeed = speed;
		this.motorTorque = torque;
		return this;
	}
	public clone() : RotationalLimitMotor {
		const lm = new RotationalLimitMotor();
		lm.lowerLimit = this.lowerLimit;
		lm.upperLimit = this.upperLimit;
		lm.motorSpeed = this.motorSpeed;
		lm.motorTorque = this.motorTorque;
		return lm;
	}
}