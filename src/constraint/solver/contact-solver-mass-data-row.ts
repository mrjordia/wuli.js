/**
 * elements:
 *     [invMLinN1X ,invMLinN1Y ,invMLinN1Z ,          0
 *      invMLinN2X ,invMLinN2Y ,invMLinN2Z ,          3
 *      invMAngN1X ,invMAngN1Y ,invMAngN1Z ,          6
 *      invMAngN2X ,invMAngN2Y ,invMAngN2Z ,          9
 *      invMLinT1X ,invMLinT1Y ,invMLinT1Z ,          12
 *      invMLinT2X ,invMLinT2Y ,invMLinT2Z ,          15
 *      invMAngT1X ,invMAngT1Y ,invMAngT1Z ,          18
 *      invMAngT2X ,invMAngT2Y ,invMAngT2Z ,          21
 *      invMLinB1X ,invMLinB1Y ,invMLinB1Z ,          24
 *      invMLinB2X ,invMLinB2Y ,invMLinB2Z ,          27
 *      invMAngB1X ,invMAngB1Y ,invMAngB1Z ,          30
 *      invMAngB2X ,invMAngB2Y ,invMAngB2Z ,          33
 *      massN ,                                       36
 *      massTB00 ,massTB01 ,massTB10 ,massTB11];      37
 */
export default class ContactSolverMassDataRow {
	public elements = new Float64Array(41);
}