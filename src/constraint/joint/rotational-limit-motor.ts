/**
 * 旋转限位驱动类。
 * 用于控制旋转关节的角度限位和驱动特性的核心配置类，
 *              可同时设置旋转角度的上下限范围、驱动电机的转速和力矩，
 *              广泛应用于旋转关节（Revolute）、布娃娃关节（Ragdoll）等需要旋转约束的场景，
 *              既能限制关节旋转范围（如门的开合角度），也能提供主动旋转驱动力（如电机带动机械臂）
 */
export default class RotationalLimitMotor {

    /**
     * 旋转下限角度。
     * 关节允许旋转的最小角度（弧度），默认值1；
     *              当lowerLimit > upperLimit时，限位功能失效（无角度限制）；
     *              示例：门的最小开合角度设为0（完全关闭）
     */
    public lowerLimit = 1;

    /**
     * 旋转上限角度。
     * 关节允许旋转的最大角度（弧度），默认值0；
     *              当upperLimit < lowerLimit时，限位功能失效（无角度限制）；
     *              示例：门的最大开合角度设为Math.PI/2（90度打开）
     */
    public upperLimit = 0;

    /**
     * 电机驱动力矩。
     * 驱动关节旋转的最大力矩（N·m），默认值0（无驱动力）；
     *              力矩越大，关节旋转的动力越强，可模拟电机/肌肉的驱动力；
     *              设为0时，关节仅受外部力/限位约束，无主动旋转动力
     */
    public motorTorque = 0;

    /**
     * 电机目标转速。
     * 驱动关节旋转的目标角速度（弧度/秒），默认值0（无主动旋转）；
     *              正数为顺时针旋转，负数为逆时针旋转；
     *              电机将尽力以该转速旋转，直到达到力矩上限或角度限位
     */
    public motorSpeed = 0;

    /**
     * 设置旋转角度限位。
     * 批量设置旋转角度的上下限，返回自身以支持链式调用；
     *              示例：lm.setLimits(0, Math.PI/2) → 限制关节在0~90度范围内旋转
     * @param {number} lower 旋转下限角度（弧度）
     * @param {number} upper 旋转上限角度（弧度）
     * @returns {RotationalLimitMotor} 当前实例（支持链式调用）
     */
    public setLimits(lower: number, upper: number): RotationalLimitMotor {
        this.lowerLimit = lower;
        this.upperLimit = upper;
        return this;
    }

    /**
     * 设置电机驱动参数。
     * 批量设置电机的目标转速和最大力矩，返回自身以支持链式调用；
     *              示例：lm.setMotor(1.0, 10.0) → 以1弧度/秒的速度旋转，最大力矩10N·m
     * @param {number} speed 目标转速（弧度/秒）
     * @param {number} torque 最大驱动力矩（N·m）
     * @returns {RotationalLimitMotor} 当前实例（支持链式调用）
     */
    public setMotor(speed: number, torque: number): RotationalLimitMotor {
        this.motorSpeed = speed;
        this.motorTorque = torque;
        return this;
    }

    /**
     * 克隆当前实例。
     * 创建并返回一个与当前实例参数完全相同的新实例，
     *              避免多个关节共享同一配置实例导致的参数联动问题
     * @returns {RotationalLimitMotor} 新的RotationalLimitMotor实例
     */
    public clone(): RotationalLimitMotor {
        const lm = new RotationalLimitMotor();
        lm.lowerLimit = this.lowerLimit;
        lm.upperLimit = this.upperLimit;
        lm.motorSpeed = this.motorSpeed;
        lm.motorTorque = this.motorTorque;
        return lm;
    }
}

export { RotationalLimitMotor };