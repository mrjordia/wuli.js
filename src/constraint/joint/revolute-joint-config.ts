import JointConfig from "./joint-config";
import Vec3 from "../../common/vec3";
import SpringDamper from "./spring-damper";
import RotationalLimitMotor from "./rotational-limit-motor";
import Method from "../../common/method";
import RigidBody from "../../rigid-body/rigid-body";

/**
 * 旋转关节配置类。
 * 继承自JointConfig，是旋转关节（Revolute Joint）的专属配置容器，
 *              旋转关节仅允许两个刚体绕指定轴做纯旋转运动（无平移自由度），常用于模拟门轴、车轮、铰链、机械臂关节等场景，
 *              此类封装了旋转轴配置、旋转限位驱动、弹簧阻尼等核心参数，是创建旋转关节的核心配置载体
 */
export default class RevoluteJointConfig extends JointConfig {
    /**
     * 第一个刚体的本地旋转轴。
     * 相对于rigidBody1本地坐标系的旋转关节轴，默认值(1, 0, 0)（X轴）；
     *              刚体仅能绕该轴做旋转运动，无平移自由度，需与localAxis2配合保证旋转轴严格对齐
     */
    public localAxis1 = new Vec3(1, 0, 0);

    /**
     * 第二个刚体的本地旋转轴。
     * 相对于rigidBody2本地坐标系的旋转关节轴，默认值(1, 0, 0)（X轴）；
     *              初始化时会通过世界旋转轴转换为刚体本地轴，确保两个刚体绕同一轴旋转
     */
    public localAxis2 = new Vec3(1, 0, 0);

    /**
     * 旋转弹簧阻尼器配置。
     * 旋转关节旋转运动的弹簧阻尼参数，默认初始化空实例（无弹性约束）；
     *              用于为旋转运动添加弹性/阻尼效果（如门的缓冲回弹、车轮的减震）
     */
    public springDamper = new SpringDamper();

    /**
     * 旋转限位驱动配置。
     * 旋转关节旋转运动的限位范围、驱动速度、最大驱动力矩配置，默认初始化空实例（无限位/驱动）；
     *              可通过该配置限制旋转角度范围（如门的开合角度）或添加可控的旋转驱动（如电机带动机械臂）
     */
    public limitMotor = new RotationalLimitMotor();

    /**
     * 初始化旋转关节配置。
     * 核心初始化逻辑：
     *              1. 调用父类initialize方法，完成刚体关联、锚点等基础配置的初始化；
     *              2. 将世界坐标系的旋转轴转换为两个刚体的本地坐标系轴（localAxis1/localAxis2），保证旋转轴对齐；
     *              3. 返回自身以支持链式调用（如init(rb1, rb2, anchor, axis).setSolverType(...)）；
     *              该方法是创建旋转关节的标准入口，确保旋转轴在不同刚体坐标系下的一致性
     * @param {RigidBody} rigidBody1 关节关联的第一个刚体（如门框）
     * @param {RigidBody} rigidBody2 关节关联的第二个刚体（如门体）
     * @param {Vec3} _worldAnchor 关节锚点的世界坐标（旋转轴的参考原点，如门轴位置）
     * @param {Vec3} _worldAxis 关节旋转轴的世界坐标（如门轴的延伸方向）
     * @returns {RevoluteJointConfig} 当前配置实例（支持链式调用）
     */
    public init(rigidBody1: RigidBody, rigidBody2: RigidBody, _worldAnchor: Vec3, _worldAxis: Vec3): RevoluteJointConfig {
        this.initialize(rigidBody1, rigidBody2, _worldAnchor);
        Method.inverseTransformVec3(rigidBody1.transform.elements, _worldAxis.elements, 1, this.localAxis1.elements);
        Method.inverseTransformVec3(rigidBody2.transform.elements, _worldAxis.elements, 1, this.localAxis2.elements);
        return this;
    }
}

export { RevoluteJointConfig };