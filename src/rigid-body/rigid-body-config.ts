import Mat3 from "../common/mat3";
import { RIGID_BODY_TYPE } from "../constant";
import Vec3 from "../common/vec3";
import Method from "../common/method";

/**
 * 刚体配置项接口（初始化入参类型）。
 * 用于定义创建RigidBodyConfig时的可选配置参数，所有字段均为可选，未传时使用默认值
 */
interface IRigidBodyConfigOptions {
    /**
     * 刚体初始位置（世界坐标系）
     */
    position?: { x: number, y: number, z: number };
    /**
     * 刚体初始旋转（四元数）。
     * 注：内部会自动转换为3x3旋转矩阵存储
     */
    rotation?: { x: number, y: number, z: number, w: number };
    /**
     * 刚体初始线速度（m/s）
     */
    linearVelocity?: { x: number, y: number, z: number };
    /**
     * 刚体初始角速度（rad/s）
     */
    angularVelocity?: { x: number, y: number, z: number };
    /**
     * 刚体类型（静态/动态/运动学）。
     * 默认为动态刚体（RIGID_BODY_TYPE.DYNAMIC）
     */
    type?: RIGID_BODY_TYPE;
    /**
     * 是否启用自动休眠。
     * 休眠逻辑：刚体速度低于阈值时进入休眠状态，停止物理计算以提升性能。
     * 默认为true（启用）。
     */
    autoSleep?: boolean;
    /**
     * 线性阻尼系数（速度衰减率），取值范围 [0, 1]。
     * 作用：模拟空气阻力、摩擦力等，使刚体线速度逐渐衰减。
     * 0表示无阻尼（速度不衰减），1表示瞬时停止。
     * 默认为0。
     */
    linearDamping?: number;
    /**
     * 角阻尼系数（角速度衰减率），取值范围 [0, 1]。
     * 作用：模拟旋转阻力，使刚体角速度逐渐衰减。
     * 0表示无阻尼，1表示瞬时停止旋转。
     * 默认为0
     */
    angularDamping?: number;
    /**
     * 刚体名称（用于调试/标识）
     * 默认为空字符串
     */
    name?: string;
}

/**
 * 物理引擎刚体配置类。
 * 封装刚体初始化所需的所有配置参数，提供统一的默认值和参数转换逻辑
 * 核心作用：
 * 1. 标准化刚体初始化参数（如四元数转旋转矩阵）
 * 2. 提供合理的默认值，简化刚体创建流程
 * 3. 隔离配置参数与刚体核心逻辑，提升代码可维护性
 */
export default class RigidBodyConfig {
    /**
     * 刚体初始位置（世界坐标系，单位：米/m）。
     * 默认为Vec3(0, 0, 0)（世界原点）
     */
    public position: Vec3;

    /**
     * 刚体初始旋转矩阵（3x3）。
     * 由四元数转换而来，默认为单位矩阵（无旋转）
     */
    public rotation: Mat3;

    /**
     * 刚体初始线速度（单位：米/秒 m/s）。
     * 描述刚体平动的速度，默认为Vec3(0, 0, 0)（静止）
     */
    public linearVelocity: Vec3;

    /**
     * 刚体初始角速度（单位：弧度/秒 rad/s）。
     * 描述刚体旋转的速度，默认为Vec3(0, 0, 0)（无旋转）
     */
    public angularVelocity: Vec3;

    /**
     * 刚体类型。
     * - STATIC：静态刚体（无质量，不受力，位置固定）
     * - DYNAMIC：动态刚体（有质量，受物理力影响）
     * - KINEMATIC：运动学刚体（无质量，可通过代码控制运动）
     * 默认为DYNAMIC（动态刚体）
     */
    public type: RIGID_BODY_TYPE;

    /**
     * 自动休眠开关。
     * 启用时，刚体速度低于阈值会进入休眠状态，暂停物理计算以优化性能
     * 默认为true（启用）
     */
    public autoSleep: boolean;

    /**
     * 线性阻尼系数（速度衰减率）。
     * 用于模拟平动过程中的阻力，取值范围 [0, 1]
     * 计算公式：新速度 = 原速度 × (1 - linearDamping)
     * 默认为0（无阻尼）
     */
    public linearDamping: number;

    /**
     * 角阻尼系数（角速度衰减率）。
     * 用于模拟旋转过程中的阻力，取值范围 [0, 1]
     * 计算公式：新角速度 = 原角速度 × (1 - angularDamping)
     * 默认为0（无阻尼）
     */
    public angularDamping: number;

    /**
     * 刚体名称（调试用）。
     * 可用于日志输出、调试工具标识刚体，无物理意义
     * 默认为空字符串
     */
    public name: string;

    /**
     * 构造函数：创建刚体配置实例
     * @param {IRigidBodyConfigOptions} [optional={}] 可选配置参数，未传字段使用默认值
     */
    constructor(optional: IRigidBodyConfigOptions = {}) {
        // 初始化位置（默认原点）
        this.position = optional.position 
            ? new Vec3(optional.position.x, optional.position.y, optional.position.z) 
            : new Vec3();
        
        // 初始化旋转矩阵（默认单位矩阵），传入四元数则转换为矩阵
        this.rotation = new Mat3();
        if (optional.rotation) {
            Method.quatToMat3(
                optional.rotation.x, 
                optional.rotation.y, 
                optional.rotation.z, 
                optional.rotation.w, 
                this.rotation.elements
            );
        }

        // 初始化线速度（默认静止）
        this.linearVelocity = optional.linearVelocity 
            ? new Vec3(optional.linearVelocity.x, optional.linearVelocity.y, optional.linearVelocity.z) 
            : new Vec3();

        // 初始化角速度（默认无旋转）
        this.angularVelocity = optional.angularVelocity 
            ? new Vec3(optional.angularVelocity.x, optional.angularVelocity.y, optional.angularVelocity.z) 
            : new Vec3();

        // 初始化刚体类型（默认动态）
        this.type = optional.type || RIGID_BODY_TYPE.DYNAMIC;
        
        // 初始化自动休眠（默认启用）
        this.autoSleep = optional.autoSleep !== undefined ? optional.autoSleep : true;
        
        // 初始化线性阻尼（默认0）
        this.linearDamping = optional.linearDamping || 0;
        
        // 初始化角阻尼（默认0）
        this.angularDamping = optional.angularDamping || 0;
        
        // 初始化名称（默认空）
        this.name = optional.name || '';
    }
}

export type { IRigidBodyConfigOptions };
export { RigidBodyConfig };