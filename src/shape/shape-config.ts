import { CONSTANT, GEOMETRY_TYPE } from "../constant";
import Mat3 from "../common/mat3";
import Geometry from "./geometry";
import Vec3 from "../common/vec3";
import ContactCallback from "../common/contact-callback";
import { Nullable } from "../common/nullable";
import Method from "../common/method";

/**
 * 形状配置项接口。
 * 定义创建ShapeConfig实例的可选配置参数，涵盖碰撞体的位置、旋转、物理属性、碰撞规则、几何体和接触回调等核心配置，
 * 所有参数均为可选（未配置时会使用引擎默认值）。
 */
interface IShapeConfigOptions {
	/**
	 * 碰撞体初始位置（局部坐标系）。
	 * 仅对非地形几何体生效，地形几何体的位置由变换矩阵单独控制，忽略该配置。
	 */
	position?: { x: number, y: number, z: number };
	/**
	 * 碰撞体初始旋转四元数。
	 * 仅对非地形几何体生效，内部会转换为3x3旋转矩阵；
	 * 四元数格式：x/y/z为虚部，w为实部，需保证归一化（长度为1）。
	 */
	rotation?: { x: number, y: number, z: number, w: number };
	/**
	 * 摩擦系数。
	 * 取值范围通常为0~1：0表示无摩擦（光滑表面），1表示最大静摩擦；
	 * 决定碰撞体接触时的滑动阻力，如球体在地面滚动的减速程度。
	 */
	friction?: number;
	/**
	 * 恢复系数（弹性系数）。
	 * 取值范围通常为0~1：0表示完全非弹性碰撞（无反弹），1表示完全弹性碰撞（无能量损失）；
	 * 决定碰撞体碰撞后的反弹程度，如皮球落地后的弹起高度。
	 */
	restitution?: number;
	/**
	 * 密度。
	 * 单位体积的质量，用于计算碰撞体的总质量（质量=密度×几何体体积）；
	 * 静态几何体（如地形）会忽略密度配置，质量始终为0。
	 */
	density?: number;
	/**
	 * 碰撞组。
	 * 碰撞分层标识，用于碰撞过滤：只有满足 collisionGroup & collisionMask != 0 的两个碰撞体才会检测碰撞；
	 * 通常用二进制位表示不同分组（如0x01表示玩家层，0x02表示敌人层）。
	 */
	collisionGroup?: number;
	/**
	 * 碰撞掩码。
	 * 碰撞检测的目标分组掩码，与collisionGroup配合实现碰撞过滤；
	 * 例如：collisionMask=0x03 表示检测与0x01、0x02分组的碰撞体的碰撞。
	 */
	collisionMask?: number;
	/**
	 * 碰撞体关联的几何体。
	 * 碰撞体的几何形状定义，支持球体、地形、圆柱体等所有继承自Geometry的几何体类型；
	 * 几何体类型决定碰撞检测的算法和精度（如地形使用逐三角形射线检测，球体使用几何公式检测）。
	 */
	geometry: Geometry;
	/**
	 * 接触回调函数。
	 * 碰撞接触时的自定义回调，可用于处理碰撞事件（如播放音效、扣血、触发机关）；
	 * 回调函数会在碰撞体开始接触、持续接触、结束接触时被调用。
	 */
	contactCallback?: ContactCallback;
}

/**
 * 碰撞体配置类。
 * 物理引擎中碰撞体的核心配置类，封装碰撞体的几何形状、物理属性、碰撞规则和回调逻辑，
 * 是创建碰撞体（Shape）的核心入参，支持动态配置不同物理特性的碰撞体（如刚体、静态体、传感器）。
 */
export default class ShapeConfig {
	/**
	 * 碰撞体局部位置。
	 * 碰撞体相对于父物体的局部位置，地形几何体默认忽略该属性（位置由变换矩阵控制）；
	 * 初始值为Vec3(0,0,0)，可通过配置项position覆盖。
	 */
	public position: Vec3;

	/**
	 * 碰撞体局部旋转矩阵（3x3）。
	 * 碰撞体相对于父物体的局部旋转，由四元数转换而来，地形几何体默认忽略该属性；
	 * 初始值为单位矩阵（无旋转），可通过配置项rotation覆盖。
	 */
	public rotation: Mat3;

	/**
	 * 摩擦系数。
	 * 碰撞体表面摩擦系数，默认值为CONSTANT.SETTING_DEFAULT_FRICTION；
	 * 影响碰撞体接触时的滑动行为，如物体在斜面上是否会下滑。
	 */
	public friction: number;

	/**
	 * 恢复系数（弹性）。
	 * 碰撞体的弹性系数，默认值为CONSTANT.SETTING_DEFAULT_RESTITUTION；
	 * 决定碰撞后的反弹力度，如钢球比皮球的恢复系数更高。
	 */
	public restitution: number;

	/**
	 * 密度。
	 * 碰撞体的密度值，默认值为CONSTANT.SETTING_DEFAULT_DENSITY；
	 * 结合几何体体积计算总质量（mass = density × volume），静态几何体无质量。
	 */
	public density: number;

	/**
	 * 碰撞组。
	 * 碰撞体所属的分组标识，默认值为CONSTANT.SETTING_DEFAULT_COLLISION_GROUP；
	 * 用于碰撞过滤，仅与collisionMask匹配的碰撞体进行碰撞检测。
	 */
	public collisionGroup: number;

	/**
	 * 碰撞掩码。
	 * 碰撞体的碰撞检测目标掩码，默认值为CONSTANT.SETTING_DEFAULT_COLLISION_MASK；
	 * 与collisionGroup配合实现精细化碰撞控制（如玩家不与友方单位碰撞）。
	 */
	public collisionMask: number;

	/**
	 * 碰撞体的几何形状定义。
	 * 关联的几何体实例，决定碰撞体的形状和碰撞检测算法；
	 * 支持SphereGeometry、TerrainGeometry等所有Geometry子类。
	 */
	public geometry: Geometry;

	/**
	 * 碰撞接触回调函数。
	 * 自定义碰撞接触回调，默认值为null（无回调）；
	 * 可在碰撞发生时执行自定义逻辑，如检测到与地面接触时播放脚步声。
	 */
	public contactCallback: Nullable<ContactCallback>;

	/**
	 * 构造函数：创建碰撞体配置实例。
	 * 核心逻辑：
	 * 1. 必选参数校验：确保geometry已配置（几何体是碰撞体的核心）；
	 * 2. 地形特殊处理：地形几何体忽略position/rotation配置（静态地形位置由全局变换控制）；
	 * 3. 默认值填充：未配置的物理属性/碰撞规则使用引擎常量默认值；
	 * 4. 数据转换：将四元数旋转转换为3x3旋转矩阵，适配物理引擎的旋转表示。
	 * @param {IShapeConfigOptions} optional - 碰撞体配置项（geometry为必选，其余可选）
	 */
	constructor(optional: IShapeConfigOptions) {
		this.geometry = optional.geometry;
		this.position = new Vec3();
		this.rotation = new Mat3();
		if (this.geometry.type !== GEOMETRY_TYPE.TERRAIN) {
			if (optional.position) {
				Method.setXYZ(this.position, optional.position.x, optional.position.y, optional.position.z);
			}
			if (optional.rotation) {
				Method.quatToMat3(optional.rotation.x, optional.rotation.y, optional.rotation.z, optional.rotation.w, this.rotation.elements);
			}
		}
		this.friction = optional.friction || CONSTANT.SETTING_DEFAULT_FRICTION;
		this.restitution = optional.restitution || CONSTANT.SETTING_DEFAULT_RESTITUTION;
		this.density = optional.density || CONSTANT.SETTING_DEFAULT_DENSITY;
		this.collisionGroup = optional.collisionGroup || CONSTANT.SETTING_DEFAULT_COLLISION_GROUP;
		this.collisionMask = optional.collisionMask || CONSTANT.SETTING_DEFAULT_COLLISION_MASK;
		this.contactCallback = optional.contactCallback;
	}
}

export type { IShapeConfigOptions };
export { ShapeConfig };