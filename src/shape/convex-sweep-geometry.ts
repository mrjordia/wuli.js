import ConvexGeometry from "./convex-geometry";
import Vec3 from "../common/vec3";
import { GEOMETRY_TYPE } from '../constant';
import Aabb from "../common/aabb";
import Transform from "../common/transform";
import { Nullable } from "../common/nullable";

/**
 * 凸扫掠几何体类。
 * 实现用于「凸体扫掠检测（Convex Sweep Test）」的封装几何体，
 * 核心功能是将目标凸几何体与平移向量结合，模拟几何体在空间中移动的扫掠过程，
 * 为GJK/EPA扫掠碰撞检测提供支撑顶点计算能力。
 * 注意：该类仅实现核心扫掠支撑顶点逻辑，AABB计算和质量更新方法暂未实现。
 */
export default class ConvexSweepGeometry extends ConvexGeometry {
	/**
	 * 被扫掠的目标凸几何体。
	 * 待执行扫掠检测的原始凸几何体（如Box/Capsule/Cone），
	 * 初始化前为null，调用init()后指向有效几何体实例
	 */
	public c: Nullable<ConvexGeometry>;

	/**
	 * 局部坐标系下的扫掠平移向量。
	 * 几何体扫掠的位移向量（已转换到局部坐标系），
	 * 初始化前为null，调用init()后赋值
	 */
	public localTranslation: Nullable<Vec3>;

	/**
	 * 构造函数：创建凸扫掠几何体实例。
	 * 初始化父类并设置几何体类型为NULL，
	 * 初始状态下目标几何体和扫掠向量均为null，需调用init()完成初始化。
	 */
	constructor() {
		super(GEOMETRY_TYPE.NULL);
	}

	/**
	 * 初始化扫掠几何体。
	 * 核心逻辑：
	 * 1. 绑定目标凸几何体，继承其GJK容差（margin）；
	 * 2. 将世界坐标系的扫掠平移向量转换为局部坐标系；
	 * 3. 存储局部坐标系平移向量，为支撑顶点计算提供数据。
	 * @param {ConvexGeometry} c - 待扫掠的目标凸几何体（非null）
	 * @param {Transform} _transform - 坐标变换矩阵（用于将世界坐标系平移向量转换到局部坐标系）
	 * @param {Vec3} _translation - 世界坐标系下的扫掠平移向量
	 * @returns {void}
	 */
	public init(c: ConvexGeometry, _transform: Transform, _translation: Vec3): void {
		const translation = _translation.elements, transform = _transform.elements;
		this.c = c;
		const trX = translation[0], trY = translation[1], trZ = translation[2];
		const localTrX = transform[3] * trX + transform[6] * trY + transform[9] * trZ;
		const localTrY = transform[4] * trX + transform[7] * trY + transform[10] * trZ;
		const localTrZ = transform[5] * trX + transform[8] * trY + transform[11] * trZ;
		this.localTranslation = new Vec3();
		const v = this.localTranslation.elements;
		v[0] = localTrX; v[1] = localTrY; v[2] = localTrZ;
		this.gjkMargin = c.gjkMargin; // 继承目标几何体的GJK容差
	}

	/**
	 * 计算局部坐标系下沿指定方向的扫掠支撑顶点。
	 * 扫掠支撑顶点核心计算逻辑：
	 * 1. 先计算目标几何体在指定方向的原始支撑顶点；
	 * 2. 判断扫掠向量与采样方向的点积符号：若为正，说明扫掠方向与采样方向同向，
	 *    则将支撑顶点叠加扫掠向量，得到扫掠后的最远顶点；
	 * 3. 该逻辑是GJK扫掠碰撞检测的核心，确保检测覆盖几何体移动的整个路径。
	 * @param {Vec3} _dir - 采样方向向量（局部坐标系，无需归一化）
	 * @param {Vec3} _out - 输出参数，存储计算得到的扫掠支撑顶点
	 * @returns {void}
	 */
	public computeLocalSupportingVertex(_dir: Vec3, _out: Vec3): void {
		this.c!.computeLocalSupportingVertex(_dir, _out);
		const dir = _dir.elements, out = _out.elements;
		const v = this.localTranslation!.elements;
		if (dir[0] * v[0] + dir[1] * v[1] + dir[2] * v[2] > 0) {
			out[0] += v[0]; out[1] += v[1]; out[2] += v[2];
		}
	}

	public computeAabb(aabb: Aabb, tf: Transform): void {
	}

	public updateMass(): void {
	}
}

export { ConvexSweepGeometry };