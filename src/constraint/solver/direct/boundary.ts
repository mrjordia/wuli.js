import { CONSTANT } from '../../../constant';
import JointSolverInfo from '../../joint/joint-solver-info';
import BoundaryBuildInfo from './boundary-build-info';
import MassMatrix from './mass-matrix';

/**
 * 约束边界类。
 * 物理引擎中MLCP（混合线性互补问题）求解的核心边界模型类，核心作用：
 * 1. 封装单组约束边界的完整状态（有界/无界索引、符号标记、RHS值）；
 * 2. 实现基于质量矩阵的约束冲量计算，验证边界条件的可行性；
 * 3. 支持质量矩阵子矩阵缓存复用，避免重复计算，提升求解性能；
 * 核心特性：
 * - 内存预分配：构造时初始化固定大小的类型化数组，符合物理引擎内存优化策略；
 * - 状态复用：通过init方法重置边界状态，支持多次复用同一实例；
 * - 缓存优化：基于matrixId的质量矩阵子矩阵缓存机制，大幅减少矩阵计算开销；
 * - 精度控制：引入SETTING_DIRECT_MLCP_SOLVER_EPS阈值，适配浮点精度问题；
 * 主要应用场景：PGS/MLCP约束求解的边界条件验证、关节约束冲量计算、约束可行域判断。
 */
export default class Boundary {
    /**
     * 有界约束行索引数组。
     * 存储当前边界中具有明确冲量限制的约束行索引，核心特性：
     * 1. 元素类型为Int8，适配小范围索引值（0~maxRows-1），最小化内存占用；
     * 2. 有效元素数量由numBounded标识，前numBounded个元素为有效索引；
     * 3. 与signs数组一一对应，标识每个有界约束行的符号方向（-1/0/1）；
     * 初始化规则：构造时预分配内存，init方法从BoundaryBuildInfo同步数据。
     */
    public iBounded: Int8Array;

    /**
     * 无界约束行索引数组。
     * 存储当前边界中无冲量限制的约束行索引，核心特性：
     * 1. 元素类型为Int8，内存布局与iBounded一致；
     * 2. 有效元素数量由numUnbounded标识，前numUnbounded个元素为有效索引；
     * 3. 用于构建质量矩阵子矩阵，是MLCP求解的核心维度；
     * 关联属性：matrixId由该数组索引的位掩码生成，用于缓存子矩阵。
     */
    public iUnbounded: Int8Array;

    /**
     * 有界约束行符号标记数组。
     * 标记有界约束行的冲量限制方向，核心取值：
     * - -1：约束行受下边界限制（冲量 ≥ minImpulse）；
     * - 1：约束行受上边界限制（冲量 ≤ maxImpulse）；
     * - 0：约束行冲量固定为0（minImpulse=maxImpulse=0）；
     * 关联关系：与iBounded数组一一对应，长度由maxRows限定。
     */
    public signs: Int8Array;

    /**
     * 约束边界RHS（右手项）数组。
     * 存储MLCP求解的右手项值，核心作用：
     * 1. 每个元素对应约束行的修正后RHS值（含冲量因子、相对速度、CFM项）；
     * 2. 使用Float64Array保证浮点计算精度，适配物理引擎的高精度需求；
     * 计算时机：computeImpulses方法中先更新无界约束行的b值，再用于冲量计算。
     */
    public b: Float64Array;

    /**
     * 有界约束行数量。
     * 标识iBounded数组的有效元素数量，核心特性：
     * 1. init方法中从BoundaryBuildInfo同步，取值范围：0 ≤ numBounded ≤ maxRows；
     * 2. 作为遍历iBounded和signs数组的终止条件，避免无效遍历。
     * @default 0
     */
    public numBounded = 0;

    /**
     * 无界约束行数量。
     * 标识iUnbounded数组的有效元素数量，核心特性：
     * 1. init方法中从BoundaryBuildInfo同步，取值范围：0 ≤ numUnbounded ≤ maxRows；
     * 2. 约束规则：numBounded + numUnbounded ≤ maxRows，保证维度完整性；
     * 3. 作为构建质量矩阵子矩阵的维度基准。
     * @default 0
     */
    public numUnbounded = 0;

    /**
     * 质量矩阵子矩阵缓存ID。
     * 基于无界约束行索引的位掩码标识，核心作用：
     * 1. 通过位运算（1 << idx）生成唯一ID，标识当前无界约束行组合；
     * 2. 作为massMatrix缓存的键值，避免重复计算相同的子矩阵；
     * 3. init方法中重置为0，computeImpulses中可重新计算。
     * 设计价值：大幅减少质量矩阵子矩阵的计算次数，提升MLCP求解性能。
     * @default 0
     */
    public matrixId = 0;

    /**
     * 构造函数：初始化约束边界实例。
     * 核心初始化逻辑：
     * 1. 预分配所有类型化数组缓冲区，长度均为maxRows：
     *    - iBounded/iUnbounded/signs：Int8Array，最小化内存占用；
     *    - b：Float64Array，保证浮点计算精度；
     * 2. 所有状态变量初始化为0，保证初始状态一致性；
     * 工程化设计：预分配连续内存缓冲区，符合物理引擎“空间换时间”的优化思路，避免运行时动态扩容。
     * @param {number} maxRows - 最大约束行数（边界维度上限）
     */
    constructor(maxRows: number) {
        this.iBounded = new Int8Array(maxRows);
        this.iUnbounded = new Int8Array(maxRows);
        this.signs = new Int8Array(maxRows);
        this.b = new Float64Array(maxRows);
    }

    /**
     * 初始化边界状态。
     * 核心初始化逻辑：
     * 1. 同步有界约束状态：从buildInfo拷贝numBounded、iBounded、signs数据；
     * 2. 同步无界约束状态：从buildInfo拷贝numUnbounded、iUnbounded数据；
     * 3. 生成矩阵缓存ID：通过位运算（1 << idx）为当前无界约束组合生成唯一matrixId；
     * 4. 重置matrixId初始值为0，保证位运算准确性；
     * 设计价值：
     * - 支持边界实例复用，避免频繁创建/销毁带来的GC开销；
     * - 一次性拷贝所有状态数据，比逐行赋值更高效；
     * - 预先生成matrixId，为后续质量矩阵缓存做准备。
     * @param {BoundaryBuildInfo} buildInfo - 边界构建信息容器，提供初始化数据源
     */
    public init(buildInfo: BoundaryBuildInfo): void {
        this.numBounded = buildInfo.numBounded;
        let _g = 0, _g1 = this.numBounded;
        while (_g < _g1) {
            let i = _g++;
            this.iBounded[i] = buildInfo.iBounded[i];
            this.signs[i] = buildInfo.signs[i];
        }
        this.numUnbounded = buildInfo.numUnbounded;
        this.matrixId = 0;
        let _g2 = 0, _g3 = this.numUnbounded;
        while (_g2 < _g3) {
            const i = _g2++;
            const idx = buildInfo.iUnbounded[i];
            this.iUnbounded[i] = idx;
            this.matrixId |= 1 << idx;
        }
    }

    /**
     * 计算约束冲量并验证边界可行性。
     * 核心计算流程（分四阶段）：
     * 【阶段1：更新无界约束RHS值】
     * - 遍历无界约束行，计算修正后的b值：b[idx] = row.rhs*factor - relVels[idx] - row.cfm*impulses[idx]；
     * 【阶段2：计算有界约束冲量增量】
     * - 基于符号标记计算有界约束的目标冲量增量dImpulse；
     * - 更新无界约束的b值（扣除有界冲量的影响）；
     * 【阶段3：质量矩阵子矩阵计算/缓存】
     * - 基于无界约束索引生成缓存ID，优先使用缓存的子矩阵，未缓存则计算并缓存；
     * 【阶段4：冲量计算与边界验证】
     * 1. 无界约束冲量验证：计算冲量并检查是否在[minImpulse-MSE, maxImpulse+MSE]范围内；
     * 2. 有界约束误差验证（可选）：计算冲量更新后的约束误差，检查是否满足符号标记的限制；
     * 关键优化点：
     * - 质量矩阵子矩阵缓存：避免重复计算高开销的矩阵求逆/分解操作；
     * - 精度阈值MSE：适配浮点计算误差，防止误判边界可行性；
     * - 类型化数组：全程使用Float64Array保证计算精度，Int8Array减少内存占用；
     * 核心价值：是MLCP求解的核心实现，判断当前边界组合是否为可行解，为约束求解提供决策依据。
     * @param {JointSolverInfo} info - 关节约束求解信息，提供约束行的冲量限制、RHS等参数
     * @param {MassMatrix} mass - 质量矩阵实例，提供子矩阵计算和缓存能力
     * @param {Float64Array} relVels - 相对速度数组，存储各约束行的当前相对速度
     * @param {Float64Array} impulses - 冲量数组，存储各约束行的当前冲量值
     * @param {Float64Array} dImpulses - 冲量增量数组，输出计算得到的冲量变化值
     * @param {number} impulseFactor - 冲量缩放因子，适配时间步长或帧率补偿
     * @param {boolean} noCheck - 是否跳过边界验证（仅计算冲量，不验证可行性）
     * @returns {boolean} 边界是否可行（冲量在限制范围内且误差满足精度要求）
     */
    public computeImpulses(info: JointSolverInfo, mass: MassMatrix, relVels: Float64Array, impulses: Float64Array, dImpulses: Float64Array, impulseFactor: number, noCheck: boolean): boolean {
        const MSE = CONSTANT.SETTING_DIRECT_MLCP_SOLVER_EPS;
        let _g = 0, _g1 = this.numUnbounded;
        while (_g < _g1) {
            const idx = this.iUnbounded[_g++];
            const row = info.rows[idx];
            this.b[idx] = row.rhs * impulseFactor - relVels[idx] - row.cfm * impulses[idx];
        }
        const invMassWithoutCfm = mass.invMassWithoutCfm;
        let _g2 = 0, _g3 = this.numBounded;
        while (_g2 < _g3) {
            const i = _g2++;
            const idx = this.iBounded[i];
            const sign = this.signs[i];
            const row = info.rows[idx];
            const dImpulse = (sign < 0 ? row.minImpulse : sign > 0 ? row.maxImpulse : 0) - impulses[idx];
            dImpulses[idx] = dImpulse;
            if (dImpulse !== 0) {
                let _g = 0, _g1 = this.numUnbounded;
                while (_g < _g1) {
                    let idx2 = this.iUnbounded[_g++];
                    this.b[idx2] -= invMassWithoutCfm[idx][idx2] * dImpulse;
                }
            }
        }
        const indices = this.iUnbounded;
        const n = this.numUnbounded;
        let id = 0;
        let _g4 = 0;
        while (_g4 < n) id |= 1 << indices[_g4++];
        let massMatrix: Float64Array[];
        if (mass.cacheComputed[id]) {
            massMatrix = mass.cachedSubmatrices[id];
        } else {
            mass.computeSubmatrix(id, indices, n);
            mass.cacheComputed[id] = true;
            massMatrix = mass.cachedSubmatrices[id];
        }
        let ok = true;
        let _g5 = 0, _g6 = this.numUnbounded;
        while (_g5 < _g6) {
            const i = _g5++;
            const idx = this.iUnbounded[i];
            const row = info.rows[idx];
            const oldImpulse = impulses[idx];
            let impulse = oldImpulse;
            let _g = 0, _g1 = this.numUnbounded;
            while (_g < _g1) {
                const j = _g++;
                impulse += this.b[this.iUnbounded[j]] * massMatrix[i][j];
            }
            if (impulse < row.minImpulse - MSE || impulse > row.maxImpulse + MSE) {
                ok = false;
                break;
            }
            dImpulses[idx] = impulse - oldImpulse;
        }
        if (noCheck) {
            return true;
        }
        if (!ok) {
            return false;
        }
        let _g7 = 0, _g8 = this.numBounded;
        while (_g7 < _g8) {
            const i = _g7++;
            const idx = this.iBounded[i];
            const row = info.rows[idx];
            const sign = this.signs[i];
            let error = 0;
            const newImpulse = impulses[idx] + dImpulses[idx];
            let relVel = relVels[idx];
            let _g = 0, _g1 = info.numRows;
            while (_g < _g1) {
                let j = _g++;
                relVel += invMassWithoutCfm[idx][j] * dImpulses[j];
            }
            error = row.rhs * impulseFactor - relVel - row.cfm * newImpulse;
            if (sign < 0 && error > MSE || sign > 0 && error < -MSE) {
                ok = false;
                break;
            }
        }
        return ok;
    }
}

export { Boundary };