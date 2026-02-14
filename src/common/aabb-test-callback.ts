import Shape from "../shape/shape";


export default abstract class AabbTestCallback {

	public abstract process(shape : Shape) : void;

}