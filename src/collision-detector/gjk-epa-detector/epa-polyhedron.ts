import Vec3 from "../../common/vec3";
import { CONSTANT } from "../../constant";
import EpaTriangle from "./epa-triangle";
import Method from "../../common/method";
import EpaVertex from "./epa-vertex";
import { Nullable } from "../../common/nullable";

/**
 * EPA多面体类。
 * 属于EPA（扩展多面体算法）核心数据结构，用于表示碰撞检测中动态扩展的凸多面体，
 *              管理多面体的顶点集合、三角面链表、三角面/顶点对象池，提供多面体初始化、顶点添加、边环查找、
 *              拓扑校验等核心操作，是EPA算法求解两个凸体碰撞穿透深度的核心容器
 */
export default class EpaPolyhedron {
	/**
	 * 多面体顶点数组。
	 * 存储多面体所有顶点的数组，长度由SETTING_MAX_EPA_VERTICES限制，
	 *              索引对应顶点编号，numVertices标记实际有效顶点数量
	 */
	public vertices = new Array(CONSTANT.SETTING_MAX_EPA_VERTICES);

	/**
	 * 多面体中心点。
	 * 多面体的几何中心点，用于三角面初始化时的朝向判断和法向量计算
	 */
	public center = new Vec3();

	/**
	 * 有效顶点数量。
	 * 记录vertices数组中实际有效的顶点个数，随顶点添加动态递增
	 */
	public numVertices = 0;

	/**
	 * 三角面链表头节点。
	 * 指向多面体三角面双向链表的第一个节点，用于遍历所有三角面
	 */
	public triangleList: Nullable<EpaTriangle>;

	/**
	 * 三角面链表尾节点。
	 * 指向多面体三角面双向链表的最后一个节点，用于快速添加新三角面
	 */
	public triangleListLast: Nullable<EpaTriangle>;

	/**
	 * 有效三角面数量。
	 * 记录多面体中实际有效的三角面个数，随三角面添加/移除动态更新
	 */
	public numTriangles = 0;

	/**
	 * 三角面对象池。
	 * 三角面复用池，存储已销毁的三角面实例，避免频繁创建/销毁对象，优化内存性能
	 */
	public trianglePool: Nullable<EpaTriangle>;

	/**
	 * 顶点对象池。
	 * 顶点复用池（当前代码未实际使用，预留用于顶点复用优化）
	 */
	public vertexPool: Nullable<EpaVertex>;

	/**
	 * 状态码。
	 * 多面体操作的状态标记，不同数值对应不同错误/正常状态：
	 *              - 0: 正常
	 *              - 1: 三角面初始化失败
	 *              - 2: 相邻边索引无效（-1）
	 *              - 3: 相邻三角面为空
	 *              - 4: 边环下一个顶点为空
	 *              - 5: 边环外部三角面为空
	 *              - 6: 三角面不可见（朝向错误）
	 */
	public status: Nullable<number>;

	/**
	 * 校验多面体拓扑结构的合法性。
	 * 核心校验逻辑：
	 *              1. 遍历所有三角面，重置顶点的边环临时标记；
	 *              2. 检查每个三角面的3个相邻边索引（adjacentPairIndex）是否为-1（非法）；
	 *              3. 检查每个三角面的3个相邻三角面（adjacentTriangles）是否为空（非法）；
	 *              4. 检测到非法状态时设置对应status并返回false，全部合法则返回true；
	 *              该方法是保证多面体拓扑完整性的关键，避免后续EPA扩展计算出错
	 * @returns {boolean} 拓扑结构是否合法（true=合法，false=非法）
	 */
	public validate(): boolean {
		let t: Nullable<EpaTriangle> = this.triangleList!;
		const tv = t.vertices, tai = t.adjacentPairIndex, tat = t.adjacentTriangles;
		while (t) {
			tv[0]!.tmpEdgeLoopOuterTriangle = null;
			tv[0]!.tmpEdgeLoopNext = null;
			if (tai[0] === -1) {
				this.status = 2;
				return false;
			}
			if (!tat[0]) {
				this.status = 3;
				return false;
			}
			tv[1]!.tmpEdgeLoopOuterTriangle = null;
			tv[1]!.tmpEdgeLoopNext = null;
			if (tai[1] === -1) {
				this.status = 2;
				return false;
			}
			if (!tat[1]) {
				this.status = 3;
				return false;
			}
			tv[2]!.tmpEdgeLoopOuterTriangle = null;
			tv[2]!.tmpEdgeLoopNext = null;
			if (tai[2] === -1) {
				this.status = 2;
				return false;
			}
			if (!tat[2]) {
				this.status = 3;
				return false;
			}
			t = t.next;
		}
		return true;
	}

	/**
	 * 查找多面体的边环（递归DFS）。
	 * 核心逻辑（EPA扩展的核心步骤）：
	 *              1. 标记当前三角面为已遍历（tmpDfsId=id），避免重复处理；
	 *              2. 计算参考点到三角面的向量，判断三角面是否「可见」（法向量与该向量点积>0）；
	 *              3. 三角面不可见时设置status=6并返回，终止遍历；
	 *              4. 遍历当前三角面的3个相邻三角面，递归判断可见性：
	 *                 - 相邻三角面可见：继续递归遍历；
	 *                 - 相邻三角面不可见：标记顶点的边环信息（tmpEdgeLoopNext/tmpEdgeLoopOuterTriangle）；
	 *              5. 移除当前三角面的所有相邻关联，将其从链表中删除并回收至对象池；
	 *              该方法用于EPA扩展时，移除不可见的三角面并标记新边环，为添加新顶点做准备
	 * @param {number} id DFS遍历唯一标识ID（避免重复遍历）
	 * @param {EpaTriangle} base 起始三角面
	 * @param {Vec3} _from 参考点（通常为新增顶点）
	 */
	public findEdgeLoop(id: number, base: EpaTriangle, _from: Vec3): void {
		if (base.tmpDfsId === id) return;
		base.tmpDfsId = id;
		const from = _from.elements;
		const bse = base.tmp.elements, v = base.vertices[0]!.v.elements, v1 = base.normal.elements;
		Method.copyElements(from, bse, 0, 0, 3);
		Method.subArray(bse, v, bse, 0, 0, 0, 3);
		let vis = base.tmpDfsVisible = Method.multiplyArray(bse, v1, 0, 0, 3) > 0;
		if (!vis) {
			this.status = 6;
			return;
		}
		let _g = 0;
		while (_g < 3) {
			const i = _g++;
			const t = base.adjacentTriangles[i];
			if (!t) continue;
			const tes = t.tmp.elements, v = t.vertices[0]!.v.elements, v1 = t.normal.elements;
			Method.copyElements(from, tes, 0, 0, 3);
			Method.subArray(tes, v, tes, 0, 0, 0, 3);
			vis = t.tmpDfsVisible = Method.multiplyArray(tes, v1, 0, 0, 3) > 0;
			if (vis) {
				this.findEdgeLoop(id, t, _from);
			} else {
				const v1 = base.vertices[i]!;
				v1.tmpEdgeLoopNext = base.vertices[base.nextIndex[i]];
				v1.tmpEdgeLoopOuterTriangle = t;
			}
		}
		let triangle = base.adjacentTriangles[0];
		if (triangle) {
			const pairIndex = base.adjacentPairIndex[0];
			triangle.adjacentTriangles[pairIndex] = null;
			triangle.adjacentPairIndex[pairIndex] = -1;
			base.adjacentTriangles[0] = null;
			base.adjacentPairIndex[0] = -1;
		}
		triangle = base.adjacentTriangles[1];
		if (triangle) {
			const pairIndex = base.adjacentPairIndex[1];
			triangle.adjacentTriangles[pairIndex] = null;
			triangle.adjacentPairIndex[pairIndex] = -1;
			base.adjacentTriangles[1] = null;
			base.adjacentPairIndex[1] = -1;
		}
		triangle = base.adjacentTriangles[2];
		if (triangle) {
			const pairIndex = base.adjacentPairIndex[2];
			triangle.adjacentTriangles[pairIndex] = null;
			triangle.adjacentPairIndex[pairIndex] = -1;
			base.adjacentTriangles[2] = null;
			base.adjacentPairIndex[2] = -1;
		}
		this.numTriangles--;
		const prev = base.prev, next = base.next;
		if (prev) prev.next = next;
		if (next) next.prev = prev;
		if (base === this.triangleList) this.triangleList = this.triangleList.next;
		if (base === this.triangleListLast) this.triangleListLast = this.triangleListLast.prev;
		base.next = null;
		base.prev = null;
		base.removeReferences();
		base.next = this.trianglePool;
		this.trianglePool = base;
	}

	/**
	 * 初始化四面体（EPA多面体的初始状态）。
	 * 核心初始化逻辑：
	 *              1. 初始化状态码为0，设置有效顶点数为4，将4个顶点存入vertices数组；
	 *              2. 计算4个顶点的几何中心点（center），用于三角面朝向判断；
	 *              3. 从对象池获取4个三角面，初始化四面体的4个三角面（每个面3个顶点）；
	 *              4. 建立4个三角面之间的相邻关联（拓扑结构）；
	 *              5. 将4个三角面加入多面体的三角面链表；
	 *              6. 返回初始化状态（status=0表示成功）；
	 *              该方法是EPA算法的起点，构建初始四面体多面体
	 * @param {EpaVertex} v1 第一个顶点
	 * @param {EpaVertex} v2 第二个顶点
	 * @param {EpaVertex} v3 第三个顶点
	 * @param {EpaVertex} v4 第四个顶点
	 * @returns {boolean} 初始化是否成功（true=成功，false=失败）
	 */
	public init(v1: EpaVertex, v2: EpaVertex, v3: EpaVertex, v4: EpaVertex): boolean {
		this.status = 0;
		this.numVertices = 4;
		Method.setElements<Array<EpaVertex>, EpaVertex>(this.vertices, 0, v1, v2, v3, v4);
		const ces = this.center.elements;
		const v = v1.v.elements, v5 = v2.v.elements, v6 = v3.v.elements, v7 = v4.v.elements;
		Method.setElements(ces, v[0] + v5[0] + v6[0] + v7[0], v[1] + v5[1] + v6[1] + v7[1], v[2] + v5[2] + v6[2] + v7[2]);
		Method.scaleArray(ces, 0.25, ces, 0, 0, 3);
		const t1 = this._getTriangle();
		const t2 = this._getTriangle();
		const t3 = this._getTriangle();
		const t4 = this._getTriangle();
		if (!t1.init(v1, v2, v3, this.center, true)) this.status = 1;
		if (!t2.init(v1, v2, v4, this.center, true)) this.status = 1;
		if (!t3.init(v1, v3, v4, this.center, true)) this.status = 1;
		if (!t4.init(v2, v3, v4, this.center, true)) this.status = 1;
		if (!t1.setAdjacentTriangle(t2)) this.status = 1;
		if (!t1.setAdjacentTriangle(t3)) this.status = 1;
		if (!t1.setAdjacentTriangle(t4)) this.status = 1;
		if (!t2.setAdjacentTriangle(t3)) this.status = 1;
		if (!t2.setAdjacentTriangle(t4)) this.status = 1;
		if (!t3.setAdjacentTriangle(t4)) this.status = 1;
		this._setTriangleList(t1);
		this._setTriangleList(t2);
		this._setTriangleList(t3);
		this._setTriangleList(t4);
		return this.status === 0;
	}

	/**
	 * 向多面体添加新顶点（EPA扩展核心操作）。
	 * 核心扩展逻辑：
	 *              1. 将新顶点加入vertices数组，有效顶点数+1；
	 *              2. 调用findEdgeLoop移除不可见三角面，标记新边环；
	 *              3. 遍历边环顶点，为每个边环边创建新三角面（复用对象池或新建）；
	 *              4. 初始化新三角面，建立与边环外部三角面、相邻新三角面的拓扑关联；
	 *              5. 将新三角面加入多面体三角面链表；
	 *              6. 校验多面体拓扑结构，返回操作结果；
	 *              该方法是EPA算法的核心扩展步骤，通过添加新顶点扩展多面体，逼近碰撞穿透方向
	 * @param {EpaVertex} vertex 待添加的新顶点
	 * @param {EpaTriangle} base 扩展起始三角面
	 * @returns {boolean} 顶点添加是否成功（true=成功，false=失败）
	 */
	public addVertex(vertex: EpaVertex, base: EpaTriangle): boolean {
		this.vertices[this.numVertices++] = vertex;
		const v1 = base.vertices[0]!;
		this.findEdgeLoop(this.numVertices, base, vertex.v);
		if (this.status !== 0) return false;
		let v = v1;
		let prevT = null, firstT = null;
		while (true) {
			if (!v.tmpEdgeLoopNext) {
				this.status = 4;
				return false;
			}
			if (!v.tmpEdgeLoopOuterTriangle) {
				this.status = 5;
				return false;
			}
			let first = this.trianglePool;
			if (first) {
				this.trianglePool = first.next;
				first.next = null;
			} else {
				first = new EpaTriangle();
			}
			const t = first;
			if (!firstT) firstT = t;
			if (!t.init(v, v.tmpEdgeLoopNext, vertex, this.center, false)) this.status = 1;
			if (this.status !== 0) return false;
			this._setTriangleList(t);
			if (!t.setAdjacentTriangle(v.tmpEdgeLoopOuterTriangle)) this.status = 1;
			if (prevT) {
				if (!t.setAdjacentTriangle(prevT)) this.status = 1;
			}
			prevT = t;
			v = v.tmpEdgeLoopNext;
			if (!(v !== v1)) break;
		}
		if (!prevT.setAdjacentTriangle(firstT)) this.status = 1;
		if (this.status === 0) {
			return this.validate();
		} else {
			return false;
		}
	}

	/**
	 * 从对象池获取三角面实例（私有）。
	 * 核心逻辑：
	 *              1. 优先从trianglePool对象池获取已回收的三角面实例；
	 *              2. 对象池为空时，新建EpaTriangle实例；
	 *              3. 重置实例的链表指针，返回可用实例；
	 *              该方法通过对象复用减少内存分配开销，优化EPA算法性能
	 * @returns {EpaTriangle} 三角面实例
	 */
	private _getTriangle(): EpaTriangle {
		let t = this.trianglePool;
		if (t) {
			this.trianglePool = t.next;
			t.next = null;
		} else {
			t = new EpaTriangle();
		}
		return t;
	}

	/**
	 * 将三角面添加到多面体的三角面链表（私有）。
	 * 核心逻辑：
	 *              1. 有效三角面数量numTriangles+1；
	 *              2. 链表为空时：将t1设为头节点和尾节点；
	 *              3. 链表非空时：将t1添加到链表尾部，更新尾节点指针；
	 *              该方法是三角面链表管理的核心辅助函数
	 * @param {EpaTriangle} t1 待添加的三角面
	 */
	private _setTriangleList(t1: EpaTriangle): void {
		this.numTriangles++;
		if (!this.triangleList) {
			this.triangleList = this.triangleListLast = t1;
		} else {
			this.triangleListLast!.next = t1;
			t1.prev = this.triangleListLast;
			this.triangleListLast = t1;
		}
	}
}

export { EpaPolyhedron };