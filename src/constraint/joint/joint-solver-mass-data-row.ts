/**
 * 关节求解器质量数据单行类。
 * 物理引擎中关节约束求解的单行质量数据容器，存储单个约束行对应的刚体逆质量/逆惯性张量、约束质量等核心物理参数，
 *              所有参数按固定索引存储在Float64Array数组中，保证高精度和内存连续性，是冲量计算的核心质量数据载体
 */
export default class JointSolverMassDataRow {
    /**
     * 质量数据数组（Float64Array类型）。
     * 长度为14的浮点数组，按固定索引存储单行约束的所有质量相关参数，索引定义如下：
     *              [
     *                  invMLin1X, invMLin1Y, invMLin1Z,  // 0-2: 刚体1的线性逆质量分量
     *                  invMLin2X, invMLin2Y, invMLin2Z,  // 3-5: 刚体2的线性逆质量分量
     *                  invMAng1X, invMAng1Y, invMAng1Z,  // 6-8: 刚体1的角逆质量（逆惯性张量）分量
     *                  invMAng2X, invMAng2Y, invMAng2Z,  // 9-11: 刚体2的角逆质量（逆惯性张量）分量
     *                  mass,                             // 12: 当前约束行的综合质量值（核心计算参数）
     *                  massWithoutCfm                    // 13: 不含CFM（约束软化）的综合质量值
     *              ]
     *              采用Float64Array保证物理计算的高精度，固定索引布局提升内存访问效率
     */
    public elements = new Float64Array(14);

    /**
     * 当前约束行的综合质量值。
     * 获取elements[12]存储的综合质量值，该值是约束冲量计算的核心参数，
     *              由刚体逆质量/逆惯性张量和雅可比矩阵共同计算得出
     */
    public get mass(): number { return this.elements[12]; }

    /**
     * 当前约束行的综合质量值。
     * 设置elements[12]存储的综合质量值，直接影响约束冲量的计算结果，
     *              需在质量矩阵计算完成后赋值
     */
    public set mass(n: number) { this.elements[12] = n; }
}

export { JointSolverMassDataRow };