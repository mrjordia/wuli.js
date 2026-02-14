import Vec3 from "../../common/vec3";
import Method from "../../common/method";
import EpaTriangle from "./epa-triangle";
import { Nullable } from "../../common/nullable";

export default class EpaVertex {
	public randId = Math.random() * 100000 | 0;
	public v = new Vec3();
	public w1 = new Vec3();
	public w2 = new Vec3();

	public next: Nullable<EpaVertex>;
	public tmpEdgeLoopNext: Nullable<EpaVertex>;
	public tmpEdgeLoopOuterTriangle: Nullable<EpaTriangle>;

	public init(v: Vec3, w1: Vec3, w2: Vec3): EpaVertex {
		Method.copyElements(v.elements, this.v.elements, 0, 0, 3);
		Method.copyElements(w1.elements, this.w1.elements, 0, 0, 3);
		Method.copyElements(w2.elements, this.w2.elements, 0, 0, 3);
		this.next = null;
		this.tmpEdgeLoopNext = null;
		this.tmpEdgeLoopOuterTriangle = null;
		return this;
	}
	public removeReferences(): void {
		this.next = null;
		this.tmpEdgeLoopNext = null;
		this.tmpEdgeLoopOuterTriangle = null;
	}
}