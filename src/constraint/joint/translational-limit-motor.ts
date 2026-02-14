
export default class TranslationalLimitMotor {

	public lowerLimit = 1;
	public upperLimit = 0;
	public motorForce = 0;
	public motorSpeed = 0;

	public setLimits(lower : number, upper : number) : TranslationalLimitMotor {
		this.lowerLimit = lower;
		this.upperLimit = upper;
		return this;
	}
	public setMotor(speed : number, force : number) : TranslationalLimitMotor {
		this.motorSpeed = speed;
		this.motorForce = force;
		return this;
	}
	public clone() : TranslationalLimitMotor {
		const lm = new TranslationalLimitMotor();
		lm.lowerLimit = this.lowerLimit;
		lm.upperLimit = this.upperLimit;
		lm.motorSpeed = this.motorSpeed;
		lm.motorForce = this.motorForce;
		return lm;
	}
}