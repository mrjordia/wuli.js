import RayCastHit from "../shape/ray-cast-hit";
import Shape from "../shape/shape";


export default abstract class RayCastCallback {

	public abstract process(shape : Shape, hit ?: RayCastHit) : void;

}