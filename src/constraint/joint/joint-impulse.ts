/**
 * 关节冲量存储类。
 * 物理引擎中关节约束求解的核心冲量数据容器，集中存储速度约束、驱动约束、位置约束对应的冲量值，
 *              是关节约束迭代求解过程中冲量累计、更新和复用（预热启动）的核心载体
 */
export default class JointImpulse {
    /**
     * 速度约束冲量。
     * 用于满足关节速度约束的核心冲量值，默认值0；在速度约束求解阶段（solveVelocity）迭代更新，
     *              直接修正刚体的线速度/角速度，是保证关节速度约束的核心数据
     */
    public impulse = 0;

    /**
     * 驱动约束冲量（impulseM = impulse Motor）。
     * 关节约束驱动对应的冲量值，默认值0；仅在关节启用驱动（motorMaxImpulse>0）时生效，
     *              用于控制关节按指定速度（motorSpeed）旋转/平移，是驱动功能的核心冲量数据
     */
    public impulseM = 0;

    /**
     * 位置约束冲量（impulseP = impulse Position）。
     * 用于修正关节位置误差的冲量值，默认值0；在位置约束求解阶段（solvePosition）更新，
     *              基于分离冲量/NGS算法消除刚体穿透、修正关节位置偏移，保证关节位置约束
     */
    public impulseP = 0;
}

export { JointImpulse };