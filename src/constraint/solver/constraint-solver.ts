import { Nullable } from "../../common/nullable";
import TimeStep from "../../common/time-step";
import RigidBody from "../../rigid-body/rigid-body";

/**
 * 约束求解器抽象基类。
 * 物理引擎中所有约束求解器的统一抽象接口，定义了约束求解全生命周期的标准化方法，
 *              涵盖速度约束、位置约束的求解流程，是物理约束（接触/关节）求解的核心抽象层，
 *              所有具体求解器（如PGS/NGS）需实现此类的抽象方法
 */
export default abstract class ConstraintSolver {
    protected _b1: Nullable<RigidBody>;
    protected _b2: Nullable<RigidBody>;

    /**
     * 是否已加入求解岛标记。
     * 用于物理引擎的岛屿法（Island Method）优化：标记约束是否已被加入当前求解岛，
     *              避免重复处理，提升大规模约束求解的性能
     * @default false
     */
    public addedToIsland = false;

    /**
     * 速度约束求解前置处理（抽象方法）。
     * 速度求解前的初始化逻辑，通常用于：
     *              1. 读取刚体最新的速度/角速度数据
     *              2. 计算约束方程的RHS（右侧值）
     *              3. 初始化求解器内部状态
     * @param {TimeStep} timeStep 时间步实例 - 包含帧时间、逆时间步等时间相关参数
     */
    public abstract preSolveVelocity(timeStep: TimeStep): void;

    /**
     * 约束热启动（抽象方法）。
     * 利用上一帧的冲量数据预热当前帧求解，核心作用：
     *              1. 复用历史冲量值，避免求解器从零开始迭代
     *              2. 大幅提升约束求解的收敛速度和稳定性
     *              3. 减少帧间约束响应的抖动
     * @param {TimeStep} timeStep 时间步实例
     */
    public abstract warmStart(timeStep: TimeStep): void;

    /**
     * 速度约束求解（抽象方法）。
     * 约束求解的核心方法，用于计算满足约束的速度修正量，通常实现：
     *              1. 构建约束雅克比矩阵
     *              2. 求解冲量（J^T·λ = M·Δv）
     *              3. 应用冲量到刚体，更新速度/角速度
     *              注：速度约束是约束求解的核心，决定刚体的运动响应
     */
    public abstract solveVelocity(): void;

    /**
     * 速度约束求解后置处理（抽象方法）。
     * 速度求解后的收尾逻辑，通常用于：
     *              1. 缓存当前帧的冲量数据（用于下一帧热启动）
     *              2. 校验速度修正的合法性（如防止速度溢出）
     *              3. 更新求解器内部状态
     * @param {TimeStep} timeStep 时间步实例
     */
    public abstract postSolveVelocity(timeStep: TimeStep): void;

    /**
     * 位置约束求解前置处理（抽象方法）。
     * 位置求解前的初始化逻辑，通常用于：
     *              1. 计算刚体的位置误差（如穿透深度、关节偏移）
     *              2. 构建位置约束的雅克比矩阵
     *              3. 初始化位置求解的参数
     * @param {TimeStep} timeStep 时间步实例
     */
    public abstract preSolvePosition(timeStep: TimeStep): void;

    /**
     * 分离冲量位置求解（抽象方法）。
     * 基于分离冲量（Split Impulse）的位置修正方法，核心作用：
     *              1. 独立于速度约束处理位置误差，避免速度/位置耦合导致的不稳定
     *              2. 修正刚体的位置偏移（如碰撞穿透、关节错位）
     *              3. 保持速度约束的稳定性，仅调整位置
     */
    public abstract solvePositionSplitImpulse(): void;

    /**
     * NGS位置约束求解（抽象方法）。
     * 基于高斯-塞德尔迭代（NGS）的位置约束求解，核心特点：
     *              1. 迭代求解位置约束，逐步修正位置误差
     *              2. 适用于高精度位置修正场景
     *              3. 收敛速度慢但精度高，常与PGS速度求解配合使用
     * @param {TimeStep} timeStep 时间步实例
     */
    public abstract solvePositionNgs(timeStep: TimeStep): void;

    /**
     * 约束求解后置回调（抽象方法）。
     * 整个约束求解流程的最终收尾逻辑，通常用于：
     *              1. 触发约束相关的回调事件（如碰撞后效、关节回调）
     *              2. 清理求解器临时数据
     *              3. 更新约束的持久化状态
     */
    public abstract postSolve(): void;
}

export { ConstraintSolver };