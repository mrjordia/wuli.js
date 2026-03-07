import JointConfig from "./joint-config";
import Vec3 from "../../common/vec3";
import TranslationalLimitMotor from "./translational-limit-motor";
import SpringDamper from "./spring-damper";
import Method from "../../common/method";
import RigidBody from "../../rigid-body/rigid-body";

/**
 * 棱柱关节配置类。
 * 继承自JointConfig，是棱柱关节（Prismatic Joint）的专属配置容器，
 *              棱柱关节仅允许两个刚体沿指定轴做纯平移运动（无旋转自由度），此类封装了该关节的轴配置、平移限位驱动、弹簧阻尼等核心参数，
 *              是创建棱柱关节（如滑轨、活塞等线性约束）的核心配置载体
 */
export default class PrismaticJointConfig extends JointConfig {
    /**
     * 第一个刚体的本地棱柱轴（平移轴）。
     * 相对于rigidBody1本地坐标系的棱柱关节平移轴，默认值(1,0,0)（X轴）；
     *              刚体仅能沿该轴做线性平移，无旋转自由度，需与localAxis2配合保证平移方向一致
     */
    public localAxis1 = new Vec3(1, 0, 0);

    /**
     * 第二个刚体的本地棱柱轴（平移轴）。
     * 相对于rigidBody2本地坐标系的棱柱关节平移轴，默认值(1,0,0)（X轴）；
     *              初始化时会通过世界轴转换为刚体本地轴，保证两个刚体的平移轴严格对齐
     */
    public localAxis2 = new Vec3(1, 0, 0);

    /**
     * 平移限位驱动配置。
     * 棱柱关节平移运动的限位范围、驱动速度、最大驱动力配置，默认初始化空实例（无限位/驱动）；
     *              可通过该配置限制平移范围（如滑轨行程）或添加可控的平移驱动（如活塞推力）
     */
    public limitMotor = new TranslationalLimitMotor();

    /**
     * 平移弹簧阻尼器配置。
     * 棱柱关节平移运动的弹簧阻尼参数，默认初始化空实例（无弹性约束）；
     *              用于为平移运动添加弹性/阻尼效果（如滑轨缓冲、弹簧复位）
     */
    public springDamper = new SpringDamper();

    /**
     * 初始化棱柱关节配置。
     * 核心初始化逻辑：
     *              1. 调用父类initialize方法，初始化刚体关联、锚点等基础配置；
     *              2. 将世界坐标系的平移轴转换为两个刚体的本地坐标系轴（localAxis1/localAxis2）；
     *              3. 返回自身以支持链式调用（如init(rb1, rb2, anchor, axis).setSolverType(...)）；
     *              是创建棱柱关节的标准初始化入口，保证平移轴的本地坐标系对齐
     * @param {RigidBody} rigidBody1 关节关联的第一个刚体
     * @param {RigidBody} rigidBody2 关节关联的第二个刚体
     * @param {Vec3} _worldAnchor 关节锚点的世界坐标（平移轴的参考原点）
     * @param {Vec3} _worldAxis 关节平移轴的世界坐标
     * @returns {PrismaticJointConfig} 当前配置实例（链式调用）
     */
    public init(rigidBody1: RigidBody, rigidBody2: RigidBody, _worldAnchor: Vec3, _worldAxis: Vec3): PrismaticJointConfig {
        this.initialize(rigidBody1, rigidBody2, _worldAnchor);
        Method.inverseTransformVec3(rigidBody1.transform.elements, _worldAxis.elements, 1, this.localAxis1.elements);
        Method.inverseTransformVec3(rigidBody2.transform.elements, _worldAxis.elements, 1, this.localAxis2.elements);
        return this;
    }
}

export { PrismaticJointConfig };