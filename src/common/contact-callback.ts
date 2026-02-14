import Contact from "../constraint/contact/contact";

export default abstract class ContactCallback {

	public abstract beginContact(c : Contact) : void;
	public abstract preSolve(c : Contact) : void;
	public abstract postSolve(c : Contact) : void;
	public abstract endContact(c : Contact) : void;
}