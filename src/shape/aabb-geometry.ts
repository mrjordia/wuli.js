import ConvexGeometry from "./convex-geometry";
import Vec3 from "../common/vec3";
import { GEOMETRY_TYPE } from "../constant";
import Aabb from "../common/aabb";
import Transform from "../common/transform";

/**
 * 轴对齐包围盒凸几何体类。
 * 实现基于轴对齐包围盒的凸几何体，是物理引擎中最基础、高效的碰撞检测几何体。
 * AABB 由局部坐标系下的最小/最大顶点定义，所有边均与坐标轴平行，适用于快速包围盒检测、
 * 粗碰撞筛选和简单刚体的物理属性计算。
 */
export default class AabbGeometry extends ConvexGeometry {
	/**
	 * AABB 局部坐标系的最小顶点。
	 * 该顶点定义了 AABB 在 x/y/z 轴上的最小值边界
	 * @default 初始化为零向量 (0, 0, 0)
	 */
	public min = new Vec3();

	/**
	 * AABB 局部坐标系的最大顶点。
	 * 该顶点定义了 AABB 在 x/y/z 轴上的最大值边界
	 * @default 初始化为零向量 (0, 0, 0)
	 */
	public max = new Vec3();

	/**
	 * 构造函数：创建 AABB 几何体实例。
	 * 初始化 AABB 几何体，父类类型暂设为 GEOMETRY_TYPE.NULL，
	 * 可根据业务需求替换为专属的 AABB 类型枚举值。
	 */
	constructor() {
		super(GEOMETRY_TYPE.NULL);
	}

	public computeLocalSupportingVertex(dir: Vec3, out: Vec3): void {
		const oe = out.elements, de = dir.elements, ae = this.max.elements, ie = this.min.elements;
		oe[0] = de[0] > 0 ? ae[0] : ie[0];
		oe[1] = de[1] > 0 ? ae[1] : ie[1];
		oe[2] = de[2] > 0 ? ae[2] : ie[2];
	}

	public computeAabb(aabb: Aabb, tf: Transform): void {
	}

	public updateMass(): void {
	}
}

export { AabbGeometry };