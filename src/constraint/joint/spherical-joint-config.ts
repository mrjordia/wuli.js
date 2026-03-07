import JointConfig from "./joint-config";
import SpringDamper from "./spring-damper";
import RigidBody from "../../rigid-body/rigid-body";
import Vec3 from "../../common/vec3";

/**
 * 球关节配置类。
 * 继承自JointConfig，是球关节（Spherical Joint）的专属配置容器，
 *              球关节允许两个刚体绕共同锚点做全三维旋转（无平移自由度），仅限制锚点位置偏移，
 *              常用于模拟肩关节、髋关节、万向节、球头连杆等场景，可通过弹簧阻尼添加旋转缓冲/复位效果，
 *              是刚体物理模拟中实现全向旋转连接的核心配置载体
 */
export default class SphericalJointConfig extends JointConfig {
    /**
     * 旋转弹簧阻尼器配置。
     * 球关节旋转运动的弹簧阻尼参数，默认初始化空实例（无弹性约束）；
     *              用于为全向旋转添加弹性/阻尼效果（如肩关节的复位缓冲、球头连杆的减震），
     *              无配置时关节仅限制锚点偏移，旋转无弹性约束
     */
    public springDamper = new SpringDamper();

    /**
     * 初始化球关节配置。
     * 核心初始化逻辑：
     *              1. 调用父类initialize方法，完成刚体关联、锚点等基础配置的初始化；
     *              2. 返回自身以支持链式调用（如init(rb1, rb2, anchor).setSolverType(...)）；
     *              球关节无特定旋转轴配置，仅需指定锚点即可实现全向旋转约束
     * @param {RigidBody} rigidBody1 关节关联的第一个刚体（如人体上臂）
     * @param {RigidBody} rigidBody2 关节关联的第二个刚体（如人体前臂）
     * @param {Vec3} _worldAnchor 关节锚点的世界坐标（球关节的旋转中心点，如肩关节位置）
     * @returns {SphericalJointConfig} 当前配置实例（支持链式调用）
     */
    public init(rigidBody1: RigidBody, rigidBody2: RigidBody, _worldAnchor: Vec3): SphericalJointConfig {
        this.initialize(rigidBody1, rigidBody2, _worldAnchor);
        return this;
    }
}

export { SphericalJointConfig };