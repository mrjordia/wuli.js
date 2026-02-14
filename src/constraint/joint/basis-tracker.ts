import Joint from "./joint";

/**
 * elements:
 *      [
 *          xX,xY,xZ,                0
 *          yX,yY,yZ,                3
 *          zX,zY,zZ                 6
 *      ]
 */
export default class BasisTracker {
	public joint : Joint;
	public elements = new Float64Array(9);
	constructor(joint : Joint) {
		this.joint = joint;
	}

}