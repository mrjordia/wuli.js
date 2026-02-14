/**
 * elements:
 *      [
 *         invMLin1X,invMLin1Y,invMLin1Z,              0
 *         invMLin2X,invMLin2Y,invMLin2Z,              3
 *         invMAng1X,invMAng1Y,invMAng1Z,              6
 *         invMAng2X,invMAng2Y,invMAng2Z,              9
 *         mass,massWithoutCfm                         12
 *      ];
 */
export default class JointSolverMassDataRow {

	public elements = new Float64Array(14);

	public get mass() : number { return this.elements[12]; }
	public set mass(n : number) { this.elements[12] = n; }
}