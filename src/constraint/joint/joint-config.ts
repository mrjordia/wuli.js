import Vec3 from "../../common/vec3";
import { CONSTANT } from '../../constant';
import Method from "../../common/method";
import RigidBody from "../../rigid-body/rigid-body";

/**
 * 关节配置类。
 * 物理引擎中所有关节的基础配置容器，定义关节的核心参数（关联刚体、锚点、约束规则、断裂阈值等），
 *              是创建各类关节（如球铰、铰链、滑块关节）的基础配置模板，提供锚点坐标转换的核心初始化逻辑
 */
export default class JointConfig {
    /**
     * 关节关联的第一个刚体。
     * 关节约束的第一个目标刚体，非可选（通过!断言确保赋值），与rigidBody2共同构成关节约束的两个主体
     */
    public rigidBody1 !: RigidBody;

    /**
     * 关节关联的第二个刚体。
     * 关节约束的第二个目标刚体，非可选（通过!断言确保赋值），若为静态刚体则作为关节的固定端
     */
    public rigidBody2 !: RigidBody;

    /**
     * 第一个刚体的本地锚点坐标。
     * 相对于rigidBody1本地坐标系的关节锚点，初始值为零向量，通过initialize方法从世界锚点转换而来
     */
    public localAnchor1 = new Vec3();

    /**
     * 第二个刚体的本地锚点坐标。
     * 相对于rigidBody2本地坐标系的关节锚点，初始值为零向量，通过initialize方法从世界锚点转换而来
     */
    public localAnchor2 = new Vec3();

    /**
     * 是否允许关联的两个刚体碰撞。
     * 关节约束下刚体的碰撞开关，默认值false（禁止碰撞），避免关节锚点处的穿透和异常碰撞反馈
     */
    public allowCollision = false;

    /**
     * 关节约束求解器类型。
     * 指定关节约束的求解算法类型，默认值为CONSTANT.SETTING_DEFAULT_JOINT_CONSTRAINT_SOLVER_TYPE，
     *              不同类型对应不同的约束求解策略（如直接求解、迭代求解）
     */
    public solverType = CONSTANT.SETTING_DEFAULT_JOINT_CONSTRAINT_SOLVER_TYPE;

    /**
     * 位置修正算法类型。
     * 指定关节位置误差的修正算法，默认值为CONSTANT.SETTING_DEFAULT_JOINT_POSITION_CORRECTION_ALGORITHM，
     *              可选值包括Baumgarte、分离冲量、NGS等算法，用于消除关节穿透
     */
    public positionCorrectionAlgorithm = CONSTANT.SETTING_DEFAULT_JOINT_POSITION_CORRECTION_ALGORITHM;

    /**
     * 关节断裂的力阈值。
     * 触发关节断裂的合外力阈值，默认值0（永不因受力断裂），当关节承受的力超过该值时关节会断开
     */
    public breakForce = 0;

    /**
     * 关节断裂的力矩阈值。
     * 触发关节断裂的合外力矩阈值，默认值0（永不因力矩断裂），当关节承受的力矩超过该值时关节会断开
     */
    public breakTorque = 0;

    /**
     * 初始化关节锚点（核心方法）。
     * 核心逻辑：
     *              1. 绑定关节的两个关联刚体（赋值给rigidBody1/rigidBody2）；
     *              2. 将世界坐标系下的锚点分别转换为两个刚体的本地坐标系坐标；
     *              3. 结果分别存入localAnchor1和localAnchor2，确保锚点随刚体运动同步更新
     * @param {RigidBody} rb1 第一个关联刚体
     * @param {RigidBody} rb2 第二个关联刚体
     * @param {Vec3} _worldAnchor 世界坐标系下的关节锚点
     */
    protected initialize(rb1: RigidBody, rb2: RigidBody, _worldAnchor: Vec3): void {
        const worldAnchor = _worldAnchor.elements;
        this.rigidBody1 = rb1;
        this.rigidBody2 = rb2;
        const tf1 = this.rigidBody1.transform.elements, localPoint = this.localAnchor1.elements;
        Method.inverseTransformVec3(tf1, worldAnchor, 0, localPoint);
        const tf2 = this.rigidBody2.transform.elements, localPoint1 = this.localAnchor2.elements;
        Method.inverseTransformVec3(tf2, worldAnchor, 0, localPoint1);
    }
}

export { JointConfig };