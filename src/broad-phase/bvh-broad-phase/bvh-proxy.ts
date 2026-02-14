import { Nullable } from "../../common/nullable";
import PhysicsProxy from "../physics-proxy";
import BvhNode from "./bvh-node";


export default class BvhProxy extends PhysicsProxy {
	public leaf: Nullable<BvhNode>;
	public moved = false;
}