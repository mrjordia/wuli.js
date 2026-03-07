import JointConfig from "./joint-config";
import Vec3 from "../../common/vec3";
import SpringDamper from "./spring-damper";
import RotationalLimitMotor from "./rotational-limit-motor";
import Method from "../../common/method";
import RigidBody from "../../rigid-body/rigid-body";

/**
 * 布娃娃关节配置类。
 * 继承自JointConfig，是布娃娃关节（Ragdoll Joint）的专属配置容器，
 *              布娃娃关节专为角色物理模拟设计，支持「扭转（Twist）+ 双轴摆动（Swing）」的人体关节运动约束，
 *              可精准模拟肩膀、髋关节、膝关节等人体关节的旋转范围和弹性效果，
 *              是创建角色布娃娃物理系统的核心配置载体
 */
export default class RagdollJointConfig extends JointConfig {
    /**
     * 第一个刚体的本地扭转轴。
     * 相对于rigidBody1本地坐标系的扭转旋转轴（如人体关节的前后旋转轴），默认值(1,0,0)（X轴）；
     *              扭转轴是布娃娃关节的主旋转轴，对应人体关节的「拧转」动作（如胳膊绕上臂轴旋转）
     */
    public localTwistAxis1 = new Vec3(1, 0, 0);

    /**
     * 第二个刚体的本地扭转轴。
     * 相对于rigidBody2本地坐标系的扭转旋转轴，默认值(1,0,0)（X轴）；
     *              初始化时由世界扭转轴转换而来，需与localTwistAxis1对齐，保证扭转旋转的一致性
     */
    public localTwistAxis2 = new Vec3(1, 0, 0);

    /**
     * 第一个刚体的本地摆动轴。
     * 相对于rigidBody1本地坐标系的摆动参考轴（如人体关节的左右摆动轴），默认值(0,1,0)（Y轴）；
     *              摆动轴作为双轴摆动的基准，结合maxSwingAngle1/2限制摆动范围（如肩膀的上下/左右摆动）
     */
    public localSwingAxis1 = new Vec3(0, 1, 0);

    /**
     * 扭转运动弹簧阻尼器。
     * 扭转轴旋转运动的弹簧阻尼参数，默认初始化空实例（无弹性约束）；
     *              用于为扭转运动添加弹性/阻尼效果（如关节复位、摆动缓冲），模拟人体关节的肌肉弹性
     */
    public twistSpringDamper = new SpringDamper();

    /**
     * 摆动运动弹簧阻尼器。
     * 摆动轴旋转运动的弹簧阻尼参数，默认初始化空实例（无弹性约束）；
     *              用于为摆动运动添加弹性/阻尼效果，模拟人体关节的韧带缓冲
     */
    public swingSpringDamper = new SpringDamper();

    /**
     * 扭转限位驱动。
     * 扭转轴旋转的限位范围、驱动速度、最大驱动力矩配置，默认初始化空实例（无限位/驱动）；
     *              用于限制扭转角度范围（如肘关节的扭转限制）或添加可控的扭转驱动（如角色主动摆臂）
     */
    public twistLimitMotor = new RotationalLimitMotor();

    /**
     * 第一摆动轴最大角度。
     * 沿摆动参考轴的第一方向最大摆动角度，默认值π（180°）；
     *              用于限制关节单侧摆动范围（如肩关节向上摆动的最大角度），单位为弧度
     */
    public maxSwingAngle1 = 3.14159265358979;

    /**
     * 第二摆动轴最大角度。
     * 沿摆动参考轴垂直方向的第二方向最大摆动角度，默认值π（180°）；
     *              与maxSwingAngle1配合形成双轴摆动范围（如肩关节的上下+左右摆动限制），单位为弧度
     */
    public maxSwingAngle2 = 3.14159265358979;

    /**
     * 初始化布娃娃关节配置。
     * 核心初始化逻辑：
     *              1. 调用父类initialize方法，初始化刚体关联、锚点等基础配置；
     *              2. 将世界坐标系的扭转轴转换为两个刚体的本地坐标系轴（localTwistAxis1/localTwistAxis2）；
     *              3. 将世界坐标系的摆动轴转换为第一个刚体的本地坐标系轴（localSwingAxis1）；
     *              4. 返回自身以支持链式调用（如init(rb1, rb2, anchor, twist, swing).setSolverType(...)）；
     *              是创建布娃娃关节的标准初始化入口，保证关节轴与人体骨骼坐标系对齐
     * @param {RigidBody} rigidBody1 关节关联的第一个刚体（如人体上臂）
     * @param {RigidBody} rigidBody2 关节关联的第二个刚体（如人体前臂）
     * @param {Vec3} _worldAnchor 关节锚点的世界坐标（如肘关节位置）
     * @param {Vec3} _worldTwistAxis 扭转轴的世界坐标（如胳膊的长度方向轴）
     * @param {Vec3} _worldSwingAxis 摆动参考轴的世界坐标（如胳膊的左右摆动轴）
     * @returns {RagdollJointConfig} 当前配置实例（链式调用）
     */
    public init(rigidBody1: RigidBody, rigidBody2: RigidBody, _worldAnchor: Vec3, _worldTwistAxis: Vec3, _worldSwingAxis: Vec3): RagdollJointConfig {
        this.initialize(rigidBody1, rigidBody2, _worldAnchor);
        Method.inverseTransformVec3(rigidBody1.transform.elements, _worldTwistAxis.elements, 1, this.localTwistAxis1.elements);
        Method.inverseTransformVec3(rigidBody2.transform.elements, _worldTwistAxis.elements, 1, this.localTwistAxis2.elements);
        Method.inverseTransformVec3(rigidBody1.transform.elements, _worldSwingAxis.elements, 1, this.localSwingAxis1.elements);
        return this;
    }
}

export { RagdollJointConfig };