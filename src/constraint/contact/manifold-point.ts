import ContactImpulse from "./contact-impulse";

/**
 * 碰撞流形点类。
 * 用于存储物理碰撞中单个接触点的完整信息，包括接触点坐标、穿透深度、冲量、状态标识等，是碰撞检测与物理响应的核心数据结构
 */
export default class ManifoldPoint {
    /**
     * 第一个碰撞物体的局部坐标系下的接触点坐标。
     * 长度为3的浮点数组，格式 [x, y, z]，单位为米(m)，基于第一个物体的局部空间
     */
    public localPos1 = new Float64Array(3);

    /**
     * 第二个碰撞物体的局部坐标系下的接触点坐标。
     * 长度为3的浮点数组，格式 [x, y, z]，单位为米(m)，基于第二个物体的局部空间
     */
    public localPos2 = new Float64Array(3);

    /**
     * 第一个碰撞物体的相对接触点坐标（通常相对于质心）。
     * 长度为3的浮点数组，格式 [x, y, z]，单位为米(m)，表示接触点相对于第一个物体质心的位置
     */
    public relPos1 = new Float64Array(3);

    /**
     * 第二个碰撞物体的相对接触点坐标（通常相对于质心）。
     * 长度为3的浮点数组，格式 [x, y, z]，单位为米(m)，表示接触点相对于第二个物体质心的位置
     */
    public relPos2 = new Float64Array(3);

    /**
     * 世界坐标系下第一个碰撞物体的接触点坐标。
     * 长度为3的浮点数组，格式 [x, y, z]，单位为米(m)，基于全局世界空间
     */
    public pos1 = new Float64Array(3);

    /**
     * 世界坐标系下第二个碰撞物体的接触点坐标。
     * 长度为3的浮点数组，格式 [x, y, z]，单位为米(m)，基于全局世界空间
     */
    public pos2 = new Float64Array(3);

    /**
     * 接触点的穿透深度。
     * 单位为米(m)，正值表示两个物体相互穿透的深度，用于计算碰撞响应的冲量大小
     * @default 0
     */
    public depth = 0;

    /**
     * 该接触点的碰撞冲量信息。
     * 包含法向、切向、副法向等方向的冲量分量，以及冲量作用线的坐标
     */
    public impulse = new ContactImpulse();

    /**
     * 热启动状态标识。
     * 标记该接触点是否启用了物理冲量的热启动（Warm Starting）优化，true表示已启用，可提升物理仿真的稳定性和收敛速度
     * @default false
     */
    public warmStarted = false;

    /**
     * 接触点禁用状态标识。
     * true表示该接触点被禁用，不会参与碰撞响应计算；false表示启用，正常参与物理计算
     * @default false
     */
    public disabled = false;

    /**
     * 接触点唯一标识ID。
     * 用于区分不同的接触点，-1表示未分配有效ID，通常在碰撞检测阶段赋值
     * @default -1
     */
    public id = -1;
}

export { ManifoldPoint };