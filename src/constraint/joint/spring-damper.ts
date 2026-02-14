
export default class SpringDamper {
	public frequency = 0;
	public dampingRatio = 0;
	public useSymplecticEuler = false;

	public clone() : SpringDamper {
		const sd = new SpringDamper();
		sd.frequency = this.frequency;
		sd.dampingRatio = this.dampingRatio;
		sd.useSymplecticEuler = this.useSymplecticEuler;
		return sd;
	}
}