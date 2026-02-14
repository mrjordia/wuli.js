import ContactImpulse from "./contact-impulse";

export default class ManifoldPoint {
	public localPos1 = new Float64Array(3);
	public localPos2 = new Float64Array(3);
	public relPos1 = new Float64Array(3);
	public relPos2 = new Float64Array(3);
	public pos1 = new Float64Array(3);
	public pos2 = new Float64Array(3);
	public depth = 0;
	public impulse = new ContactImpulse();
	public warmStarted = false;
	public disabled = false;
	public id = -1;

}