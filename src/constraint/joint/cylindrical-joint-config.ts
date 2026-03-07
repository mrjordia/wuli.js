import JointConfig from "./joint-config";
import Vec3 from "../../common/vec3";
import TranslationalLimitMotor from "./translational-limit-motor";
import SpringDamper from "./spring-damper";
import RotationalLimitMotor from "./rotational-limit-motor";
import Method from "../../common/method";
import RigidBody from "../../rigid-body/rigid-body";

/**
 * 圆柱关节配置类。
 * 继承自JointConfig，是圆柱关节（Cylindrical Joint）的专属配置容器，
 *              圆柱关节允许两个刚体沿指定轴做平移运动+绕该轴做旋转运动，此类封装了该关节的轴配置、平移/旋转限位驱动、弹簧阻尼等核心参数，
 *              是创建圆柱关节的核心配置载体
 */
export default class CylindricalJointConfig extends JointConfig {
    /**
     * 第一个刚体的本地圆柱轴（平移+旋转轴）。
     * 相对于rigidBody1本地坐标系的圆柱关节主轴，默认值(1,0,0)（X轴）；
     *              刚体将沿该轴平移、绕该轴旋转，需与localAxis2配合保证关节约束方向一致
     */
    public localAxis1 = new Vec3(1, 0, 0);

    /**
     * 第二个刚体的本地圆柱轴（平移+旋转轴）。
     * 相对于rigidBody2本地坐标系的圆柱关节主轴，默认值(1,0,0)（X轴）；
     *              初始化时会通过世界轴转换为刚体本地轴，保证两个刚体的关节轴对齐
     */
    public localAxis2 = new Vec3(1, 0, 0);

    /**
     * 平移限位驱动配置。
     * 圆柱关节平移运动的限位范围、驱动速度、最大驱动力配置，默认初始化空实例（无限位/驱动）；
     *              可通过该配置限制平移范围或添加可控的平移驱动
     */
    public translationalLimitMotor = new TranslationalLimitMotor();

    /**
     * 平移弹簧阻尼器配置。
     * 圆柱关节平移运动的弹簧阻尼参数，默认初始化空实例（无弹性约束）；
     *              用于为平移运动添加弹性/阻尼效果（如悬挂系统的弹性）
     */
    public translationalSpringDamper = new SpringDamper();

    /**
     * 旋转限位驱动配置。
     * 圆柱关节旋转运动的限位角度、驱动速度、最大驱动力矩配置，默认初始化空实例（无限位/驱动）；
     *              可通过该配置限制旋转角度或添加可控的旋转驱动
     */
    public rotationalLimitMotor = new RotationalLimitMotor();

    /**
     * 旋转弹簧阻尼器配置。
     * 圆柱关节旋转运动的弹簧阻尼参数，默认初始化空实例（无弹性约束）；
     *              用于为旋转运动添加弹性/阻尼效果（如旋转缓冲、回弹）
     */
    public rotationalSpringDamper = new SpringDamper();

    /**
     * 初始化圆柱关节配置。
     * 核心初始化逻辑：
     *              1. 调用父类initialize方法，初始化刚体关联、锚点等基础配置；
     *              2. 将世界坐标系的关节主轴转换为两个刚体的本地坐标系轴（localAxis1/localAxis2）；
     *              3. 返回自身以支持链式调用（如init(rb1, rb2, anchor, axis).setSolverType(...)）；
     *              是创建圆柱关节的标准初始化入口
     * @param {RigidBody} rigidBody1 关节关联的第一个刚体
     * @param {RigidBody} rigidBody2 关节关联的第二个刚体
     * @param {Vec3} _worldAnchor 关节锚点的世界坐标
     * @param {Vec3} _worldAxis 关节主轴的世界坐标
     * @returns {CylindricalJointConfig} 当前配置实例（链式调用）
     */
    public init(rigidBody1: RigidBody, rigidBody2: RigidBody, _worldAnchor: Vec3, _worldAxis: Vec3): CylindricalJointConfig {
        this.initialize(rigidBody1, rigidBody2, _worldAnchor);
        Method.inverseTransformVec3(rigidBody1.transform.elements, _worldAxis.elements, 1, this.localAxis1.elements);
        Method.inverseTransformVec3(rigidBody2.transform.elements, _worldAxis.elements, 1, this.localAxis2.elements);
        return this;
    }
}

export { CylindricalJointConfig };