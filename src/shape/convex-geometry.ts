import Geometry from "./geometry";
import { CONSTANT, GEOMETRY_TYPE } from "../constant";
import GjkEpa from "../collision-detector/gjk-epa-detector/gjk-epa";
import Vec3 from "../common/vec3";
import RayCastHit from "./ray-cast-hit";
import Transform from "../common/transform";

/**
 * 凸几何体抽象基类。
 * 所有凸几何体的公共抽象基类，封装了凸几何体的核心属性和通用方法，
 * 是 GJK/EPA 碰撞检测算法的核心依赖，所有子类需实现支撑顶点计算接口。
 * 凸几何体的定义：几何体中任意两点的连线都完全包含在几何体内部。
 */
export default abstract class ConvexGeometry extends Geometry {
	/**
	 * GJK 算法的边缘容差（碰撞检测margin）。 用于解决 GJK 算法中几何体边缘的精度问题，避免因浮点误差导致的碰撞检测失效，
	 * 该值通常为极小的正数（如 0.001）。
	 * @default 初始化为 CONSTANT.SETTING_DEFAULT_GJK_MARGIN
	 */
	public gjkMargin: number;

	protected _useGjkRayCast = false;

	/**
	 * 构造函数：初始化凸几何体基类。
	 * 初始化 GJK 边缘容差为默认值，继承父类的几何体类型初始化逻辑。
	 * @param {GEOMETRY_TYPE} type - 几何体类型枚举值
	 */
	constructor(type: GEOMETRY_TYPE) {
		super(type);
		this.gjkMargin = CONSTANT.SETTING_DEFAULT_GJK_MARGIN;
	}

	/**
	 * 计算局部坐标系下沿指定方向的支撑顶点（抽象方法）。
	 * 支撑顶点是凸几何体在指定方向上的最远顶点，是 GJK/EPA 算法的核心接口，
	 * 每个具体的凸几何体（如 AABB、球体、胶囊体）都需实现该方法的具体逻辑。
	 * @param {Vec3} dir - 采样方向向量（局部坐标系，无需归一化）
	 * @param {Vec3} out - 输出参数，用于存储计算得到的支撑顶点
	 * @returns {void}
	 */
	public abstract computeLocalSupportingVertex(dir: Vec3, out: Vec3): void;

	public rayCast(begin: Vec3, end: Vec3, transform: Transform, hit: RayCastHit): boolean {
		if (this._useGjkRayCast) {
			return GjkEpa.instance.rayCast(this, transform, begin, end, hit);
		} else {
			return super.rayCast(begin, end, transform, hit);
		}
	}
}

export { ConvexGeometry };