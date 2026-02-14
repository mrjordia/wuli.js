import { Nullable } from "../../common/nullable";
import RigidBody from "../../rigid-body/rigid-body";
import Contact from "./contact";

export default class ContactLink {
	public prev: Nullable<ContactLink>;
	public next: Nullable<ContactLink>;
	public contact: Nullable<Contact>;
	public other: Nullable<RigidBody>;
}