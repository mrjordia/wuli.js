import JointConfig from "./joint-config";
import Vec3 from "../../common/vec3";
import SpringDamper from "./spring-damper";
import RotationalLimitMotor from "./rotational-limit-motor";
import Method from "../../common/method";
import RigidBody from "../../rigid-body/rigid-body";

/**
 * 万向节配置类。
 * 继承自JointConfig，是万向节（Universal Joint）的专属配置容器，
 *              万向节允许两个刚体绕两个正交的旋转轴做二维旋转（2个旋转自由度），完全限制平移自由度，
 *              可分别为两个旋转轴配置弹簧阻尼（缓冲/复位）和限位驱动（角度限制/主动旋转），
 *              常用于模拟汽车传动轴、十字轴万向节、机器人关节等需要双轴旋转的机械场景，
 *              是连接旋转关节（单轴）和球关节（全轴）的中间型关节配置
 */
export default class UniversalJointConfig extends JointConfig {
    /**
     * 第一个刚体的本地旋转轴1。
     * 相对于rigidBody1本地坐标系的第一个旋转轴，默认值(1, 0, 0)（X轴）；
     *              该轴与localAxis2需保持正交，是万向节双轴旋转的核心参数之一
     */
    public localAxis1 = new Vec3(1, 0, 0);

    /**
     * 第二个刚体的本地旋转轴2。
     * 相对于rigidBody2本地坐标系的第二个旋转轴，默认值(1, 0, 0)（X轴）；
     *              该轴需与localAxis1正交，共同构成万向节的双旋转轴约束
     */
    public localAxis2 = new Vec3(1, 0, 0);

    /**
     * 旋转轴1的弹簧阻尼器配置。
     * 为绕localAxis1的旋转运动配置的弹簧阻尼参数，默认初始化空实例（无弹性约束）；
     *              用于为该轴旋转添加缓冲/复位效果（如传动轴的减震）
     */
    public springDamper1 = new SpringDamper();

    /**
     * 旋转轴2的弹簧阻尼器配置。
     * 为绕localAxis2的旋转运动配置的弹簧阻尼参数，默认初始化空实例（无弹性约束）；
     *              用于为该轴旋转添加缓冲/复位效果，可独立于springDamper1配置
     */
    public springDamper2 = new SpringDamper();

    /**
     * 旋转轴1的限位驱动配置。
     * 为绕localAxis1的旋转运动配置的限位驱动参数，默认初始化空实例（无限位/无驱动）；
     *              可限制该轴旋转角度范围，或提供主动旋转驱动力（如电机带动传动轴）
     */
    public limitMotor1 = new RotationalLimitMotor();

    /**
     * 旋转轴2的限位驱动配置。
     * 为绕localAxis2的旋转运动配置的限位驱动参数，默认初始化空实例（无限位/无驱动）；
     *              可独立于limitMotor1配置，实现双轴差异化的旋转约束/驱动
     */
    public limitMotor2 = new RotationalLimitMotor();

    /**
     * 初始化万向节配置。
     * 核心初始化逻辑：
     *              1. 调用父类initialize方法，完成刚体关联、锚点等基础配置的初始化；
     *              2. 将世界坐标系的两个旋转轴转换为对应刚体的本地坐标系轴（保证旋转轴在本地空间的一致性）；
     *              3. 返回自身以支持链式调用（如init(rb1, rb2, anchor, axis1, axis2).setSolverType(...)）；
     *              注意：传入的_worldAxis1和_worldAxis2需保证正交，否则会导致万向节约束异常
     * @param {RigidBody} rigidBody1 关节关联的第一个刚体（如汽车传动轴输入端）
     * @param {RigidBody} rigidBody2 关节关联的第二个刚体（如汽车传动轴输出端）
     * @param {Vec3} _worldAnchor 关节锚点的世界坐标（万向节的旋转中心点，如十字轴中心）
     * @param {Vec3} _worldAxis1 第一个旋转轴的世界坐标（相对于rigidBody1的旋转轴）
     * @param {Vec3} _worldAxis2 第二个旋转轴的世界坐标（相对于rigidBody2的旋转轴）
     * @returns {UniversalJointConfig} 当前配置实例（支持链式调用）
     */
    public init(rigidBody1: RigidBody, rigidBody2: RigidBody, _worldAnchor: Vec3, _worldAxis1: Vec3, _worldAxis2: Vec3): UniversalJointConfig {
        this.initialize(rigidBody1, rigidBody2, _worldAnchor);
        Method.inverseTransformVec3(rigidBody1.transform.elements, _worldAxis1.elements, 1, this.localAxis1.elements);
        Method.inverseTransformVec3(rigidBody2.transform.elements, _worldAxis2.elements, 1, this.localAxis2.elements);
        return this;
    }
}

export { UniversalJointConfig };