import { Nullable } from "../../common/nullable";
import BvhProxy from "./bvh-proxy";

/**
 * size:
 *      [
 *          aabbMinX,aabbMinY,aabbMinZ,              0
 *          aabbMaxX,aabbMaxY,aabbMaxZ,              3
 *      ]
 */
export default class BvhNode {
	public next: Nullable<BvhNode>;
	public prevLeaf: Nullable<BvhNode>;
	public nextLeaf: Nullable<BvhNode>;
	public children: Array<Nullable<BvhNode>> = new Array(2);
	public childIndex = 0;
	public parent: Nullable<BvhNode>;
	public height = 0;
	public proxy: Nullable<BvhProxy>;
	public size = new Float64Array(6);
	public tmp = new Float64Array(3);
}