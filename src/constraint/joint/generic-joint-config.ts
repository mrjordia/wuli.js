import JointConfig from "./joint-config";
import Mat3 from "../../common/mat3";
import TranslationalLimitMotor from "./translational-limit-motor";
import RotationalLimitMotor from "./rotational-limit-motor";
import SpringDamper from "./spring-damper";
import Method from "../../common/method";
import RigidBody from "../../rigid-body/rigid-body";
import Vec3 from "../../common/vec3";

/**
 * 通用关节配置类。
 * 继承自JointConfig，是通用关节（Generic Joint）的专属配置容器，
 *              通用关节是物理引擎中最灵活的关节类型，支持自定义3个平移轴+3个旋转轴的约束规则，
 *              可通过配置不同的限位驱动、弹簧阻尼参数，模拟圆柱、球铰、棱柱等各类关节效果，
 *              是创建通用约束的核心配置载体
 */
export default class GenericJointConfig extends JointConfig {
    /**
     * 第一个刚体的本地基向量矩阵。
     * 相对于rigidBody1本地坐标系的3x3基向量矩阵，每行对应一个约束轴（X/Y/Z）；
     *              初始化时由世界基向量矩阵转换而来，决定第一个刚体的约束坐标系方向，默认初始化为单位矩阵
     */
    public localBasis1 = new Mat3();

    /**
     * 第二个刚体的本地基向量矩阵。
     * 相对于rigidBody2本地坐标系的3x3基向量矩阵，每行对应一个约束轴（X/Y/Z）；
     *              初始化时由世界基向量矩阵转换而来，需与localBasis1配合保证约束坐标系对齐，默认初始化为单位矩阵
     */
    public localBasis2 = new Mat3();

    /**
     * 平移限位驱动配置数组（3个轴）。
     * 依次对应X/Y/Z轴的平移限位驱动配置，默认初始化3个实例且限位范围为(0,0)（固定约束）；
     *              每个轴可独立配置限位范围、驱动速度、最大驱动力，实现不同轴的差异化平移约束
     */
    public translationalLimitMotors = [
        new TranslationalLimitMotor().setLimits(0, 0),
        new TranslationalLimitMotor().setLimits(0, 0),
        new TranslationalLimitMotor().setLimits(0, 0)
    ];

    /**
     * 旋转限位驱动配置数组（3个轴）。
     * 依次对应X/Y/Z轴的旋转限位驱动配置，默认初始化3个实例且限位范围为(0,0)（固定约束）；
     *              每个轴可独立配置限位角度、驱动速度、最大驱动力矩，实现不同轴的差异化旋转约束
     */
    public rotationalLimitMotors = [
        new RotationalLimitMotor().setLimits(0, 0),
        new RotationalLimitMotor().setLimits(0, 0),
        new RotationalLimitMotor().setLimits(0, 0)
    ];

    /**
     * 平移弹簧阻尼器配置数组（3个轴）。
     * 依次对应X/Y/Z轴的平移弹簧阻尼参数，默认初始化3个空实例（无弹性约束）；
     *              每个轴可独立配置频率、阻尼比，为不同轴的平移运动添加差异化弹性/阻尼效果
     */
    public translationalSpringDampers = [new SpringDamper(), new SpringDamper(), new SpringDamper()];

    /**
     * 旋转弹簧阻尼器配置数组（3个轴）。
     * 依次对应X/Y/Z轴的旋转弹簧阻尼参数，默认初始化3个空实例（无弹性约束）；
     *              每个轴可独立配置频率、阻尼比，为不同轴的旋转运动添加差异化弹性/阻尼效果
     */
    public rotationalSpringDampers = [new SpringDamper(), new SpringDamper(), new SpringDamper()];

    /**
     * 初始化通用关节配置。
     * 核心初始化逻辑：
     *              1. 调用父类initialize方法，初始化刚体关联、锚点等基础配置；
     *              2. 将世界坐标系的基向量矩阵转换为两个刚体的本地坐标系矩阵（localBasis1/localBasis2）；
     *              3. 返回自身以支持链式调用（如init(rb1, rb2, anchor, b1, b2).setSolverType(...)）；
     *              是创建通用关节的标准初始化入口
     * @param {RigidBody} rigidBody1 关节关联的第一个刚体
     * @param {RigidBody} rigidBody2 关节关联的第二个刚体
     * @param {Vec3} _worldAnchor 关节锚点的世界坐标
     * @param {Mat3} _worldBasis1 第一个刚体的约束基向量矩阵（世界坐标）
     * @param {Mat3} _worldBasis2 第二个刚体的约束基向量矩阵（世界坐标）
     * @returns {GenericJointConfig} 当前配置实例（链式调用）
     */
    public init(rigidBody1: RigidBody, rigidBody2: RigidBody, _worldAnchor: Vec3, _worldBasis1: Mat3, _worldBasis2: Mat3): GenericJointConfig {
        this.initialize(rigidBody1, rigidBody2, _worldAnchor);
        Method.inverseTransformM3(rigidBody1.transform.elements, _worldBasis1.elements, this.localBasis1.elements);
        Method.inverseTransformM3(rigidBody2.transform.elements, _worldBasis2.elements, this.localBasis2.elements);
        return this;
    }
}

export { GenericJointConfig };