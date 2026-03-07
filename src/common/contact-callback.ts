import Contact from "../constraint/contact/contact";

/**
 * 碰撞接触回调抽象类。
 * 物理引擎中碰撞接触事件的核心回调接口，定义了碰撞生命周期的四个关键阶段，
 * 需由业务层实现具体逻辑（如碰撞音效、伤害计算、触发机关等）；
 * 所有方法均为抽象方法，必须全部实现后才能实例化。
 */
export default abstract class ContactCallback {

    /**
     * 碰撞开始回调。
     * 当两个碰撞体**首次产生接触**时触发，仅执行一次；
     * 典型用途：播放碰撞音效、记录碰撞开始时间、触发一次性机关。
     * @param {Contact} c - 碰撞接触信息（包含接触点、法向量、穿透深度等核心数据）
     * @returns {void}
     */
    public abstract beginContact(c: Contact): void;

    /**
     * 碰撞预求解回调。
     * 在物理引擎**求解碰撞约束前**触发（每帧执行）；
     * 典型用途：动态修改摩擦/恢复系数、禁用当前碰撞约束、自定义接触响应规则。
     * @param {Contact} c - 碰撞接触信息
     * @returns {void}
     */
    public abstract preSolve(c: Contact): void;

    /**
     * 碰撞后求解回调。
     * 在物理引擎**求解碰撞约束后**触发（每帧执行）；
     * 典型用途：获取碰撞冲量、计算碰撞能量损失、更新持续接触的状态。
     * @param {Contact} c - 碰撞接触信息
     * @returns {void}
     */
    public abstract postSolve(c: Contact): void;

    /**
     * 碰撞结束回调。
     * 当两个碰撞体**完全分离**时触发，仅执行一次；
     * 典型用途：停止碰撞音效、重置碰撞状态、清理接触相关的临时数据。
     * @param {Contact} c - 碰撞接触信息
     * @returns {void}
     */
    public abstract endContact(c: Contact): void;
}

export { ContactCallback };