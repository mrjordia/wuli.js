import { Nullable } from "../../common/nullable";
import JacobianRow from "../solver/jacobian-row";
import JointImpulse from "./joint-impulse";

/**
 * 关节求解器单行约束信息类。
 * 物理引擎中关节约束求解的核心单行约束数据容器，存储单条约束行的雅可比矩阵、约束参数、驱动参数、冲量限制等完整信息，
 *              每个约束维度（如平移/旋转约束）对应一个该类实例，是速度/位置约束求解过程中单行约束计算的核心数据单元
 */
export default class JointSolverInfoRow {
    /**
     * 约束行的雅可比矩阵行。
     * 描述当前约束行的雅可比矩阵数据，包含刚体速度/位置与约束的映射关系，是约束求解的核心数学基础，
     *              用于计算约束方程的系数矩阵
     */
    public jacobian = new JacobianRow();

    /**
     * 约束方程右侧值（Right Hand Side）。
     * 约束方程 $J \cdot v = rhs$ 中的右侧目标值，默认值0，用于定义约束的目标状态（如速度约束的目标相对速度），
     *              直接决定冲量计算的方向和大小
     */
    public rhs = 0;

    /**
     * 约束力混合系数（Constraint Force Mixing）。
     * 用于软化约束的系数，默认值0；非零值可让约束具备“弹性”（允许微小穿透/偏移），
     *              平衡约束的刚性要求与求解稳定性，值越大约束越“软”
     */
    public cfm = 0;

    /**
     * 冲量下限。
     * 当前约束行允许的最小冲量值，默认值0，与maxImpulse配合限定冲量范围，
     *              防止冲量过小/过大导致刚体运动异常（如铰链关节的最小扭矩限制）
     */
    public minImpulse = 0;

    /**
     * 冲量上限。
     * 当前约束行允许的最大冲量值，默认值0，与minImpulse共同限制约束冲量的取值区间，
     *              常见于有最大受力/力矩限制的关节（如滑块关节的最大驱动力限制）
     */
    public maxImpulse = 0;

    /**
     * 驱动目标速度。
     * 关节约束驱动的目标速度，默认值0；仅在motorMaxImpulse>0时生效，
     *              用于控制关节按指定速度旋转/平移（如门铰链的自动开合速度）
     */
    public motorSpeed = 0;

    /**
     * 驱动最大冲量。
     * 关节约束驱动允许输出的最大冲量值，默认值0；值为0时表示禁用驱动功能，
     *              非零值限制驱动的最大作用力/力矩，防止驱动过载导致刚体运动失控
     */
    public motorMaxImpulse = 0;

    /**
     * 约束行的冲量数据引用。
     * 关联的冲量存储实例，可为null（未初始化/无冲量数据时）；用于记录当前约束行的速度约束、驱动、位置约束冲量值，
     *              是约束求解过程中冲量累计和更新的核心关联对象
     */
    public impulse: Nullable<JointImpulse>;
}

export { JointSolverInfoRow };