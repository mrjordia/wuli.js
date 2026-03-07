/**
 * 平移限位驱动配置类。
 * 物理引擎中平移关节（如滑块、棱柱关节）的限位与驱动配置容器，定义平移运动的上下限位范围、驱动速度和最大驱动力，
 *              用于限制刚体平移范围并提供可控的平移驱动，是平移约束的核心参数配置类
 */
export default class TranslationalLimitMotor {
    /**
     * 平移下限。
     * 平移运动的最小位移限制，默认值1；与upperLimit配合定义平移范围，
     *              若lowerLimit > upperLimit（默认状态），表示禁用平移限位约束
     */
    public lowerLimit = 1;

    /**
     * 平移上限。
     * 平移运动的最大位移限制，默认值0；与lowerLimit配合定义平移范围，
     *              仅当lowerLimit <= upperLimit时，限位约束才会生效
     */
    public upperLimit = 0;

    /**
     * 驱动最大作用力。
     * 平移驱动允许输出的最大作用力，默认值0；值为0时禁用驱动功能，
     *              非零值限制驱动的最大推力/拉力，防止驱动过载导致刚体运动失控
     */
    public motorForce = 0;

    /**
     * 驱动目标速度。
     * 平移驱动的目标速度，默认值0；仅在motorForce>0时生效，
     *              正数表示向平移上限方向运动，负数表示向平移下限方向运动
     */
    public motorSpeed = 0;

    /**
     * 设置平移限位范围。
     * 批量设置平移上下限位，返回自身以支持链式调用（如setLimits(0, 10).setMotor(2, 50)），
     *              需保证lower <= upper才能启用限位约束
     * @param {number} lower 平移下限
     * @param {number} upper 平移上限
     * @returns {TranslationalLimitMotor} 当前实例（链式调用）
     */
    public setLimits(lower: number, upper: number): TranslationalLimitMotor {
        this.lowerLimit = lower;
        this.upperLimit = upper;
        return this;
    }

    /**
     * 设置平移驱动参数。
     * 批量设置驱动速度和最大作用力，返回自身以支持链式调用，
     *              force设为0可快速禁用驱动功能
     * @param {number} speed 驱动目标速度
     * @param {number} force 驱动最大作用力
     * @returns {TranslationalLimitMotor} 当前实例（链式调用）
     */
    public setMotor(speed: number, force: number): TranslationalLimitMotor {
        this.motorSpeed = speed;
        this.motorForce = force;
        return this;
    }

    /**
     * 克隆当前平移限位驱动配置。
     * 深度克隆（值类型拷贝）当前配置的所有参数，返回独立的新实例，
     *              避免多个平移关节共享同一配置实例导致的参数联动修改问题
     * @returns {TranslationalLimitMotor} 新的TranslationalLimitMotor实例，与当前实例参数完全一致
     */
    public clone(): TranslationalLimitMotor {
        const lm = new TranslationalLimitMotor();
        lm.lowerLimit = this.lowerLimit;
        lm.upperLimit = this.upperLimit;
        lm.motorSpeed = this.motorSpeed;
        lm.motorForce = this.motorForce;
        return lm;
    }
}

export { TranslationalLimitMotor };