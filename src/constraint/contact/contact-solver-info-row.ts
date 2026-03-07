import { Nullable } from "../../common/nullable";
import JacobianRow from "../solver/jacobian-row";
import ContactImpulse from "./contact-impulse";

/**
 * 接触约束求解信息行类。
 * 物理引擎中接触约束求解的核心数据结构，存储单个接触点在法向/切向/副法向三个方向的雅克比矩阵、约束参数、冲量数据等，
 *              是约束求解器（Solver）计算接触冲量的基础数据单元
 */
export default class ContactSolverInfoRow {
    /**
     * 法向方向的雅克比矩阵行。
     * 对应接触点法向（Normal）方向的约束雅克比矩阵，用于计算法向冲量（分离力），
     *              是约束方程 J·v = b 中的核心矩阵行
     */
    public jacobianN = new JacobianRow();

    /**
     * 切向方向的雅克比矩阵行。
     * 对应接触点切向（Tangent）方向的约束雅克比矩阵，用于计算切向冲量（摩擦力）
     */
    public jacobianT = new JacobianRow();

    /**
     * 副法向方向的雅克比矩阵行。
     * 对应接触点副法向（Binormal）方向的约束雅克比矩阵，用于计算副切向冲量（侧向摩擦力），
     *              与jacobianT共同构成二维切平面的摩擦约束
     */
    public jacobianB = new JacobianRow();

    /**
     * 约束方程右侧值（Right Hand Side）。
     * 约束方程 J·v = rhs 中的右侧常数项，通常由穿透深度、恢复系数、速度偏差等计算得到，
     *              决定了约束需要修正的速度目标
     * @default 0
     */
    public rhs = 0;

    /**
     * 约束力混合系数（Constraint Force Mixing）。
     * 用于软化约束的参数，数值越小约束越硬，数值越大约束越软（允许微小穿透），
     *              可避免约束求解时的数值不稳定问题
     * @default 0
     */
    public cfm = 0;

    /**
     * 摩擦系数。
     * 接触点的动/静摩擦系数，用于计算切向冲量的上限（库仑摩擦模型），
     *              取值范围通常为 0 ~ 1，0表示无摩擦，1表示最大静摩擦
     * @default 0
     */
    public friction = 0;

    /**
     * 关联的接触冲量实例。
     * 指向该接触点的冲量数据实例，存储求解得到的法向/切向冲量值，
     *              是约束求解的输出结果存储载体
     * @default null
     */
    public impulse: Nullable<ContactImpulse>;
}

export { ContactSolverInfoRow };