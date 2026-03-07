import Vec3 from "../../common/vec3";
import { CONSTANT } from "../../constant";
import Method from "../../common/method";
import EpaVertex from "./epa-vertex";
import { Nullable } from "../../common/nullable";

/**
 * EPA三角面类。
 * 属于EPA（扩展多面体算法）核心数据结构，用于表示碰撞检测中多面体的三角面，
 *              存储三角面的顶点、相邻三角面、法向量、距离等关键几何信息，
 *              支持三角面初始化、相邻关系管理、引用清理等核心操作，是EPA算法求解碰撞穿透深度的基础组件
 */
export default class EpaTriangle {
	/**
	 * 三角面唯一标识ID。
	 * 自增ID，通过全局EPA_TRIANGLE_COUNT生成，用于区分不同三角面实例
	 */
	public id = ++CONSTANT.EPA_TRIANGLE_COUNT;

	/**
	 * 链表下一个三角面。
	 * 用于三角面链表管理的指针，指向链表中当前三角面的下一个节点
	 */
	public next: Nullable<EpaTriangle>;

	/**
	 * 链表上一个三角面。
	 * 用于三角面链表管理的指针，指向链表中当前三角面的上一个节点
	 */
	public prev: Nullable<EpaTriangle>;

	/**
	 * 三角面法向量。
	 * 三角面的单位法向量（指向外部），用于判断三角面朝向和计算距离
	 */
	public normal = new Vec3();

	/**
	 * 原点到三角面的距离平方。
	 * 优化计算用的缓存值，避免重复开平方，核心用于筛选最近三角面
	 */
	public distanceSq = 0;

	/**
	 * DFS遍历临时ID。
	 * 深度优先搜索（DFS）时的临时标记ID，用于遍历过程中区分已访问/未访问三角面
	 */
	public tmpDfsId = 0;

	/**
	 * DFS遍历可见性标记。
	 * 深度优先搜索（DFS）时的临时可见性标记，标记三角面是否朝向原点（可见）
	 */
	public tmpDfsVisible = false;

	/**
	 * 三角面的三个顶点。
	 * 长度为3的数组，存储构成三角面的三个EPA顶点实例，索引0/1/2对应三角面的三个顶点
	 */
	public vertices: Array<Nullable<EpaVertex>> = new Array(3);

	/**
	 * 相邻三角面数组。
	 * 长度为3的数组，存储与当前三角面共享边的三个相邻三角面，
	 *              索引与vertices一一对应（索引i对应顶点i和i+1组成的边的相邻三角面）
	 */
	public adjacentTriangles: Array<Nullable<EpaTriangle>> = new Array(3);

	/**
	 * 相邻三角面对应的边索引。
	 * 长度为3的数组，存储相邻三角面中对应共享边的索引，用于快速定位相邻边
	 */
	public adjacentPairIndex = new Int8Array(3);

	/**
	 * 临时向量存储。
	 * 用于计算的临时向量，避免频繁创建新Vec3实例，优化内存开销
	 */
	public tmp = new Vec3();

	/**
	 * 下一个顶点索引映射。
	 * 预定义的顶点索引循环映射：[0,1,2,0]，用于快速获取当前顶点的下一个顶点索引
	 */
	public nextIndex = Method.setElements(new Int8Array(3) as any, 0, 1, 2, 0);

	private _ev0 = new Float64Array(3);
	private _ev1 = new Float64Array(3);
	private _ev2 = new Float64Array(3);
	private _ev3 = new Float64Array(3);
	private _ev4 = new Float64Array(3);
	private _ev5 = new Float64Array(3);
	private _ev6 = new Float64Array(3);
	private _ev7 = new Float64Array(3);
	private _ev8 = new Float64Array(3);
	private _ev9 = new Float64Array(3);
	private _ev10 = new Float64Array(3);
	private _evv0 = new Float64Array(3);
	private _evv1 = new Float64Array(3);
	private _evv2 = new Float64Array(3);

	/**
	 * 初始化EPA三角面。
	 * 核心初始化逻辑：
	 *              1. 复制顶点和中心点坐标到临时缓存，计算边向量和法向量；
	 *              2. 判断法向量朝向：若朝向与中心点相反，autoCheck=true时交换顶点修正朝向，否则标记为反转；
	 *              3. 计算三角面到原点的最近点和距离平方（distanceSq），优先取边/顶点的最近点，无则取法向量投影点；
	 *              4. 初始化相邻三角面数组为null，相邻边索引为-1；
	 *              该方法是三角面几何属性初始化的核心，保证法向量朝向和距离计算的准确性
	 * @param {EpaVertex} vertex1 第一个顶点
	 * @param {EpaVertex} vertex2 第二个顶点
	 * @param {EpaVertex} vertex3 第三个顶点
	 * @param {Vec3} center 参考中心点（通常为原点）
	 * @param {boolean} autoCheck 是否自动修正三角面朝向
	 * @returns {boolean} 三角面是否未被反转（true=朝向正确，false=已反转）
	 */
	public init(vertex1: EpaVertex, vertex2: EpaVertex, vertex3: EpaVertex, center: Vec3, autoCheck: boolean): boolean {
		if (!autoCheck) {
			autoCheck = false;
		}
		const vertices = this.vertices;
		const v1 = Method.copyElements(vertex1.v.elements, this._ev0, 0, 0, 3);
		const v2 = Method.copyElements(vertex2.v.elements, this._ev1, 0, 0, 3);
		const v3 = Method.copyElements(vertex3.v.elements, this._ev2, 0, 0, 3);
		const vc = Method.copyElements(center.elements, this._ev3, 0, 0, 3);
		const v12 = Method.subArray(v2, v1, this._ev4, 0, 0, 0, 3);
		const v13 = Method.subArray(v3, v1, this._ev5, 0, 0, 0, 3);
		const vc1 = Method.subArray(v1, vc, this._ev6, 0, 0, 0, 3);
		const inr = Method.crossVectors(v12[0], v12[1], v12[2], v13[0], v13[1], v13[2], this._ev7, 0);
		let inverted = false;
		if (Method.multiplyArray(vc1, inr, 0, 0, 3) < 0) {
			if (autoCheck) {
				const tmp = vertex2;
				vertex2 = vertex3;
				vertex3 = tmp;
				inr[0] *= -1; inr[1] *= -1; inr[2] *= -1;
			} else {
				inverted = true;
			}
		}
		Method.setElements(vertices, 0, vertex1, vertex2, vertex3);
		Method.copyElements(inr, this.normal.elements, 0, 0, 3);
		const vec1 = vertex1.v.elements;
		const vec2 = vertex2.v.elements;
		const vec3 = vertex3.v.elements;
		const out = this.tmp.elements;
		const v11 = Method.copyElements(vec1, this._ev0, 0, 0, 3);
		const v21 = Method.copyElements(vec2, this._ev1, 0, 0, 3);
		const v31 = Method.copyElements(vec3, this._ev2, 0, 0, 3);
		const v121 = Method.subArray(v21, v11, this._ev3, 0, 0, 0, 3);
		const v23 = Method.subArray(v31, v21, this._ev4, 0, 0, 0, 3);
		const v311 = Method.subArray(v11, v31, this._ev5, 0, 0, 0, 3);
		const n = Method.crossVectors(v121[0], v121[1], v121[2], v23[0], v23[1], v23[2], this._ev6, 0);
		const n12 = Method.crossVectors(v121[0], v121[1], v121[2], n[0], n[1], n[2], this._ev7, 0);
		const n23 = Method.crossVectors(v23[0], v23[1], v23[2], n[0], n[1], n[2], this._ev8, 0);
		const n31 = Method.crossVectors(v311[0], v311[1], v311[2], n[0], n[1], n[2], this._ev9, 0);
		let mind = -1;
		const miv = Method.setElements(this._ev10, 0, 0, 0, 0);
		if (Method.multiplyArray(v11, n12, 0, 0, 3) < 0) {
			mind = this._getMiv(vec1, vec2, out);
			Method.copyElements(out, miv, 0, 0, 3);
		}
		if (Method.multiplyArray(v21, n23, 0, 0, 3) < 0) {
			const d = this._getMiv(vec2, vec3, out);
			if (mind < 0 || d < mind) {
				mind = d;
				Method.copyElements(out, miv, 0, 0, 3);
			}
		}
		if (Method.multiplyArray(v31, n31, 0, 0, 3) < 0) {
			const d = this._getMiv(vec1, vec3, out);
			if (mind < 0 || d < mind) {
				mind = d;
				Method.copyElements(out, miv, 0, 0, 3);
			}
		}
		if (mind > 0) {
			Method.copyElements(miv, out, 0, 0, 3);
		} else {
			let l = Method.multiplyArray(n, n, 0, 0, 3);
			if (l > 0) l = 1 / Math.sqrt(l);
			Method.scaleArray(n, l, n, 0, 0, 3);
			let l2 = Method.multiplyArray(n, n, 0, 0, 3);
			l2 = Method.multiplyArray(v11, n, 0, 0, 3) / l2;
			Method.scaleArray(n, l2, miv, 0, 0, 3);
			Method.copyElements(miv, out, 0, 0, 3);
		}
		const tmp = this.tmp.elements;
		this.distanceSq = Method.multiplyArray(tmp, tmp, 0, 0, 3);
		Method.fillValue(this.adjacentTriangles, 0, 2, null);
		Method.fillValue(this.adjacentPairIndex, 0, 2, -1);
		return !inverted;
	}

	/**
	 * 设置相邻三角面。
	 * 核心逻辑：
	 *              1. 遍历当前三角面和目标三角面的所有边组合（共9种），查找共享边；
	 *              2. 找到唯一共享边时，双向绑定相邻三角面和边索引；
	 *              3. 返回是否仅找到一条共享边（保证关联的唯一性）；
	 *              该方法是EPA算法中构建多面体拓扑结构的核心，确保三角面间的边关联正确
	 * @param {EpaTriangle} triangle 待关联的相邻三角面
	 * @returns {boolean} 是否成功关联（true=找到唯一共享边并关联，false=未找到/找到多条共享边）
	 */
	public setAdjacentTriangle(triangle: EpaTriangle): boolean {
		const hv = this.vertices, hat = this.adjacentTriangles, hai = this.adjacentPairIndex, ni = this.nextIndex;
		const tv = triangle.vertices, tat = triangle.adjacentTriangles, tai = triangle.adjacentPairIndex;
		let count = 0;
		if (hv[0] === tv[ni[0]] && hv[ni[0]] === tv[0]) {
			hat[0] = triangle;
			hai[0] = 0;
			tat[0] = this;
			tai[0] = 0;
			count = 1;
		}
		if (hv[0] === tv[ni[1]] && hv[ni[0]] === tv[1]) {
			hat[0] = triangle;
			hai[0] = 1;
			tat[1] = this;
			tai[1] = 0;
			++count;
		}
		if (hv[0] === tv[ni[2]] && hv[ni[0]] === tv[2]) {
			hat[0] = triangle;
			hai[0] = 2;
			tat[2] = this;
			tai[2] = 0;
			++count;
		}
		if (hv[1] === tv[ni[0]] && hv[ni[1]] === tv[0]) {
			hat[1] = triangle;
			hai[1] = 0;
			tat[0] = this;
			tai[0] = 1;
			++count;
		}
		if (hv[1] === tv[ni[1]] && hv[ni[1]] === tv[1]) {
			hat[1] = triangle;
			hai[1] = 1;
			tat[1] = this;
			tai[1] = 1;
			++count;
		}
		if (hv[1] === tv[ni[2]] && hv[ni[1]] === tv[2]) {
			hat[1] = triangle;
			hai[1] = 2;
			tat[2] = this;
			tai[2] = 1;
			++count;
		}
		if (hv[2] === tv[ni[0]] && hv[ni[2]] === tv[0]) {
			hat[2] = triangle;
			hai[2] = 0;
			tat[0] = this;
			tai[0] = 2;
			++count;
		}
		if (hv[2] === tv[ni[1]] && hv[ni[2]] === tv[1]) {
			hat[2] = triangle;
			hai[2] = 1;
			tat[1] = this;
			tai[1] = 2;
			++count;
		}
		if (hv[2] === tv[ni[2]] && hv[ni[2]] === tv[2]) {
			hat[2] = triangle;
			hai[2] = 2;
			tat[2] = this;
			tai[2] = 2;
			++count;
		}
		return count === 1;
	}

	/**
	 * 移除所有相邻三角面关联。
	 * 核心逻辑：
	 *              1. 遍历当前三角面的三个相邻三角面；
	 *              2. 若相邻三角面存在，双向清除关联（当前三角面置null，相邻三角面对应位置也置null）；
	 *              3. 重置相邻边索引为-1；
	 *              该方法用于三角面从多面体中移除时，清理拓扑关联，避免内存泄漏和计算错误
	 */
	public removeAdjacentTriangles(): void {
		const adt = this.adjacentTriangles, adi = this.adjacentPairIndex;
		const triangle = adt[0];
		if (triangle) {
			const pairIndex = adi[0];
			triangle.adjacentTriangles[pairIndex] = null;
			triangle.adjacentPairIndex[pairIndex] = -1;
			adt[0] = null;
			adi[0] = -1;
		}
		const triangle1 = adt[1];
		if (triangle1) {
			const pairIndex = adi[1];
			triangle1.adjacentTriangles[pairIndex] = null;
			triangle1.adjacentPairIndex[pairIndex] = -1;
			adt[1] = null;
			adi[1] = -1;
		}
		const triangle2 = adt[2];
		if (triangle2) {
			const pairIndex = adi[2];
			triangle2.adjacentTriangles[pairIndex] = null;
			triangle2.adjacentPairIndex[pairIndex] = -1;
			adt[2] = null;
			adi[2] = -1;
		}
	}

	/**
	 * 移除所有引用（清理内存）。
	 * 核心逻辑：
	 *              1. 清空链表指针（next/prev）、DFS临时标记、距离平方；
	 *              2. 清空顶点数组、相邻三角面数组、相邻边索引数组；
	 *              该方法是三角面销毁前的核心清理操作，避免循环引用导致的内存泄漏
	 */
	public removeReferences(): void {
		this.next = null;
		this.prev = null;
		this.tmpDfsId = 0;
		this.tmpDfsVisible = false;
		this.distanceSq = 0;
		Method.fillValue(this.vertices, 0, 2, null);
		Method.fillValue(this.adjacentTriangles, 0, 2, null);
		Method.fillValue(this.adjacentPairIndex, 0, 2, 0);
	}

	/**
	 * 计算两点线段到原点的最近点（私有）。
	 * 核心逻辑：
	 *              1. 计算线段向量和投影参数t（t∈[0,1]表示点在线段上，否则在端点）；
	 *              2. t<0时取起点为最近点，t>1时取终点为最近点，否则取线段上投影点；
	 *              3. 返回最近点的距离平方，结果存入out数组；
	 *              该方法是三角面距离计算的核心辅助函数，优化碰撞检测的精度
	 * @param {Float64Array} vec1 线段起点向量
	 * @param {Float64Array} vec2 线段终点向量
	 * @param {Float64Array} out 输出最近点向量
	 * @returns {number} 最近点到原点的距离平方
	 */
	private _getMiv(vec1: Float64Array, vec2: Float64Array, out: Float64Array): number {
		const v1 = Method.copyElements(vec1, this._evv0, 0, 0, 3);
		const v2 = Method.copyElements(vec2, this._evv1, 0, 0, 3);
		const v12 = Method.subArray(v2, v1, this._evv2, 0, 0, 0, 3);
		let t = Method.multiplyArray(v12, v1, 0, 0, 3);
		t = -t / Method.multiplyArray(v12, v12, 0, 0, 3);
		if (t < 0) {
			Method.copyElements(v1, out, 0, 0, 3);
		} else if (t > 1) {
			Method.copyElements(v2, out, 0, 0, 3);
		} else {
			Method.scaleArray(v12, t, v12, 0, 0, 3);
			Method.addArray(v1, v12, out, 0, 0, 0, 3);
		}
		return Method.multiplyArray(out, out, 0, 0, 3);
	}
}

export { EpaTriangle };