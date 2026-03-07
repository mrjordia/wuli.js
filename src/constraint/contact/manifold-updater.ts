import ManifoldPoint from "./manifold-point";
import { CONSTANT } from '../../constant';
import Manifold from "./manifold";
import Transform from "../../common/transform";
import DetectorResultPoint from "../../collision-detector/detector-result-point";
import DetectorResult from "../../collision-detector/detector-result";

/**
 * 碰撞流形更新器类。
 * 负责碰撞流形（Manifold）的全生命周期更新管理，包括接触点的添加、移除、位置/深度更新、热启动数据继承、
 *              新旧接触点匹配等核心功能，是物理引擎中碰撞响应连续性的关键组件
 */
export default class ManifoldUpdater {
	/**
	 * 待管理的碰撞流形实例。
	 * 指向需要进行接触点更新的Manifold实例，所有操作均基于此实例完成
	 */
	public _manifold: Manifold;

	/**
	 * 旧接触点的数量。
	 * 在全量更新时，用于暂存更新前的有效接触点数量，辅助新旧接触点的数据继承
	 * @default 0
	 */
	public numOldPoints = 0;

	/**
	 * 旧接触点缓存数组。
	 * 预分配固定长度的ManifoldPoint数组，长度与SETTING_MAX_MANIFOLD_POINTS一致，
	 *              用于在更新过程中缓存旧的接触点数据，实现冲量的热启动（Warm Starting）
	 */
	public oldPoints: Array<ManifoldPoint> = new Array(CONSTANT.SETTING_MAX_MANIFOLD_POINTS);

	/**
	 * 构造函数：初始化碰撞流形更新器。
	 * 初始化时创建oldPoints数组的ManifoldPoint实例，避免运行时动态创建，优化内存性能
	 * @param {Manifold} manifold 待管理的碰撞流形实例 - 必须传入有效的Manifold实例，后续所有更新操作均作用于此实例
	 */
	constructor(manifold: Manifold) {
		this._manifold = manifold;
		let _g = 0, _g1 = CONSTANT.SETTING_MAX_MANIFOLD_POINTS;
		while (_g < _g1) this.oldPoints[_g++] = new ManifoldPoint();
	}

	/**
	 * 移除过期/无效的接触点。
	 * 根据接触点的位置和法向关系，判断接触点是否超出有效范围，移除不符合条件的接触点：
	 *              1. 接触点在法向方向的投影超出持久化阈值（CPT）
	 *              2. 接触点在切平面内的偏移距离超出阈值的平方
	 *              移除后会重置该接触点的所有数据，并调整有效接触点数量
	 */
	public removeOutdatedPoints(): void {
		const CPT = CONSTANT.SETTING_CONTACT_PERSISTENCE_THRESHOLD;
		let index = this._manifold.numPoints, normal = this._manifold.normal;
		while (--index >= 0) {
			const p = this._manifold.points[index];
			const pos1 = p.pos1, pos2 = p.pos2;
			let diffX = pos1[0] - pos2[0], diffY = pos1[1] - pos2[1], diffZ = pos1[2] - pos2[2];
			const dotN = normal[0] * diffX + normal[1] * diffY + normal[2] * diffZ;
			if (dotN > CPT) {
				this.removeManifoldPoint(index);
				continue;
			}
			diffX += normal[0] * -dotN; diffY += normal[1] * -dotN; diffZ += normal[2] * -dotN;
			if (diffX * diffX + diffY * diffY + diffZ * diffZ > CPT * CPT) {
				this.removeManifoldPoint(index);
			}
		}
	}

	/**
	 * 移除指定索引的接触点并重置数据。
	 * 核心逻辑：
	 *              1. 将待移除的接触点与最后一个有效接触点交换位置
	 *              2. 减少有效接触点数量（numPoints）
	 *              3. 重置最后一个接触点的所有数据（坐标、深度、冲量、状态等）为初始值
	 *              注：采用交换而非直接删除的方式，避免数组元素移位，提升性能
	 * @param {number} index 待移除的接触点索引 - 需在0 ~ numPoints-1范围内
	 */
	public removeManifoldPoint(index: number): void {
		const lastIndex = --this._manifold.numPoints, points = this._manifold.points;
		if (index !== lastIndex) {
			const tmp = points[index];
			points[index] = points[lastIndex];
			points[lastIndex] = tmp;
		}
		const _this = points[lastIndex];
		const localPos1 = _this.localPos1, relPos1 = _this.relPos1, pos1 = _this.pos1, localPos2 = _this.localPos2, relPos2 = _this.relPos2, pos2 = _this.pos2;
		localPos1[0] = localPos1[1] = localPos1[2] = 0;
		localPos2[0] = localPos2[1] = localPos2[2] = 0;
		relPos1[0] = relPos1[1] = relPos1[2] = 0;
		relPos2[0] = relPos2[1] = relPos2[2] = 0;
		pos1[0] = pos1[1] = pos1[2] = 0;
		pos2[0] = pos2[1] = pos2[2] = 0;
		_this.depth = 0;
		const _this1 = _this.impulse.elements;
		_this1[0] = _this1[1] = _this1[2] = _this1[3] = _this1[4] = _this1[5] = _this1[6] = 0;
		_this.warmStarted = false;
		_this.disabled = false;
		_this.id = -1;
	}

	/**
	 * 向碰撞流形添加新的接触点。
	 * 核心逻辑：
	 *              1. 若接触点数量已达最大值（SETTING_MAX_MANIFOLD_POINTS），则替换最优目标索引的接触点
	 *              2. 若还有剩余空间，则使用最后一个空闲接触点
	 *              3. 将检测结果点的世界坐标转换为物体局部坐标和相对质心坐标
	 *              4. 初始化接触点的深度、冲量、ID等属性
	 * @param {DetectorResultPoint} point 碰撞检测结果点 - 包含接触点的世界坐标、穿透深度、ID等信息
	 * @param {Transform} _tf1 第一个物体的变换信息 - 用于局部/世界坐标转换
	 * @param {Transform} _tf2 第二个物体的变换信息 - 用于局部/世界坐标转换
	 */
	public addManifoldPoint(point: DetectorResultPoint, _tf1: Transform, _tf2: Transform): void {
		let num = this._manifold.numPoints, tf1 = _tf1.elements, tf2 = _tf2.elements;
		if (num === CONSTANT.SETTING_MAX_MANIFOLD_POINTS) {
			const targetIndex = this.computeTargetIndex(point, _tf1, _tf2);
			const mp = this._manifold.points[targetIndex];
			const pos1 = mp.pos1, relPos1 = mp.relPos1, localPos1 = mp.localPos1, pos2 = mp.pos2, relPos2 = mp.relPos2, localPos2 = mp.localPos2;
			let v = point.position1.elements;
			pos1[0] = v[0]; pos1[1] = v[1]; pos1[2] = v[2];
			v = point.position2.elements;
			pos2[0] = v[0]; pos2[1] = v[1]; pos2[2] = v[2];
			relPos1[0] = pos1[0] - tf1[0]; relPos1[1] = pos1[1] - tf1[1]; relPos1[2] = pos1[2] - tf1[2];
			relPos2[0] = pos2[0] - tf2[0]; relPos2[1] = pos2[1] - tf2[1]; relPos2[2] = pos2[2] - tf2[2];
			localPos1[0] = tf1[3] * relPos1[0] + tf1[6] * relPos1[1] + tf1[9] * relPos1[2];
			localPos1[1] = tf1[4] * relPos1[0] + tf1[7] * relPos1[1] + tf1[10] * relPos1[2];
			localPos1[2] = tf1[5] * relPos1[0] + tf1[8] * relPos1[1] + tf1[11] * relPos1[2];
			localPos2[0] = tf2[3] * relPos2[0] + tf2[6] * relPos2[1] + tf2[9] * relPos2[2];
			localPos2[1] = tf2[4] * relPos2[0] + tf2[7] * relPos2[1] + tf2[10] * relPos2[2];
			localPos2[2] = tf2[5] * relPos2[0] + tf2[8] * relPos2[1] + tf2[11] * relPos2[2];
			mp.depth = point.depth;
			const _this1 = mp.impulse.elements;
			_this1[0] = _this1[1] = _this1[2] = _this1[3] = _this1[4] = _this1[5] = _this1[6] = 0;
			mp.id = point.id;
			mp.warmStarted = false;
			mp.disabled = false;
			return;
		}
		const mp = this._manifold.points[num];
		const pos1 = mp.pos1, relPos1 = mp.relPos1, localPos1 = mp.localPos1, pos2 = mp.pos2, relPos2 = mp.relPos2, localPos2 = mp.localPos2;
		let v = point.position1.elements;
		pos1[0] = v[0]; pos1[1] = v[1]; pos1[2] = v[2];
		v = point.position2.elements;
		pos2[0] = v[0]; pos2[1] = v[1]; pos2[2] = v[2];
		relPos1[0] = pos1[0] - tf1[0]; relPos1[1] = pos1[1] - tf1[1]; relPos1[2] = pos1[2] - tf1[2];
		relPos2[0] = pos2[0] - tf2[0]; relPos2[1] = pos2[1] - tf2[1]; relPos2[2] = pos2[2] - tf2[2];
		localPos1[0] = tf1[3] * relPos1[0] + tf1[6] * relPos1[1] + tf1[9] * relPos1[2];
		localPos1[1] = tf1[4] * relPos1[0] + tf1[7] * relPos1[1] + tf1[10] * relPos1[2];
		localPos1[2] = tf1[5] * relPos1[0] + tf1[8] * relPos1[1] + tf1[11] * relPos1[2];
		localPos2[0] = tf2[3] * relPos2[0] + tf2[6] * relPos2[1] + tf2[9] * relPos2[2];
		localPos2[1] = tf2[4] * relPos2[0] + tf2[7] * relPos2[1] + tf2[10] * relPos2[2];
		localPos2[2] = tf2[5] * relPos2[0] + tf2[8] * relPos2[1] + tf2[11] * relPos2[2];
		mp.depth = point.depth;
		const _this1 = mp.impulse.elements;
		_this1[0] = _this1[1] = _this1[2] = _this1[3] = _this1[4] = _this1[5] = _this1[6] = 0;
		mp.id = point.id;
		mp.warmStarted = false;
		mp.disabled = false;
		this._manifold.numPoints++;
	}

	/**
	 * 计算最优替换的接触点索引（当接触点数量达上限时）。
	 * 核心算法：
	 *              1. 找到当前穿透深度最大的接触点（优先保留大深度点，不替换）
	 *              2. 计算新点与现有三个接触点构成的四面体体积（通过叉积模长平方表示）
	 *              3. 分别计算移除不同接触点后的体积，选择体积最大的组合对应的移除索引
	 *              目的：保留能最大化接触区域覆盖的接触点集合，提升碰撞响应的稳定性
	 * @param {DetectorResultPoint} newPoint 新的碰撞检测点 - 待添加的接触点
	 * @param {Transform} _tf1 第一个物体的变换信息 - 用于坐标转换
	 * @param {Transform} _tf2 第二个物体的变换信息 - 用于坐标转换
	 * @returns {number} 最优替换的接触点索引（0~3）
	 */
	public computeTargetIndex(newPoint: DetectorResultPoint, _tf1: Transform, _tf2: Transform): number {
		const tf1 = _tf1.elements;
		const p1 = this._manifold.points[0], p2 = this._manifold.points[1], p3 = this._manifold.points[2], p4 = this._manifold.points[3];
		const relPos11 = p1.relPos1, relPos21 = p2.relPos1, relPos31 = p3.relPos1, relPos41 = p4.relPos1;
		let maxDepth = p1.depth;
		let maxDepthIndex = 0;
		if (p2.depth > maxDepth) {
			maxDepth = p2.depth;
			maxDepthIndex = 1;
		}
		if (p3.depth > maxDepth) {
			maxDepth = p3.depth;
			maxDepthIndex = 2;
		}
		if (p4.depth > maxDepth) {
			maxDepthIndex = 3;
		}
		const v = newPoint.position1.elements;
		let rp1X = v[0], rp1Y = v[1], rp1Z = v[2];
		rp1X -= tf1[0]; rp1Y -= tf1[1]; rp1Z -= tf1[2];
		let p1X = relPos21[0], p1Y = relPos21[1], p1Z = relPos21[2];
		let p2X = relPos31[0], p2Y = relPos31[1], p2Z = relPos31[2];
		let p3X = relPos41[0], p3Y = relPos41[1], p3Z = relPos41[2];
		let v12X = p2X - p1X, v12Y = p2Y - p1Y, v12Z = p2Z - p1Z;
		let v34X = rp1X - p3X, v34Y = rp1Y - p3Y, v34Z = rp1Z - p3Z;
		let v13X = p3X - p1X, v13Y = p3Y - p1Y, v13Z = p3Z - p1Z;
		let v24X = rp1X - p2X, v24Y = rp1Y - p2Y, v24Z = rp1Z - p2Z;
		let v14X = rp1X - p1X, v14Y = rp1Y - p1Y, v14Z = rp1Z - p1Z;
		let v23X = p3X - p2X, v23Y = p3Y - p2Y, v23Z = p3Z - p2Z;
		let cross1X = v12Y * v34Z - v12Z * v34Y, cross1Y = v12Z * v34X - v12X * v34Z, cross1Z = v12X * v34Y - v12Y * v34X;
		let cross2X = v13Y * v24Z - v13Z * v24Y, cross2Y = v13Z * v24X - v13X * v24Z, cross2Z = v13X * v24Y - v13Y * v24X;
		let cross3X = v14Y * v23Z - v14Z * v23Y, cross3Y = v14Z * v23X - v14X * v23Z, cross3Z = v14X * v23Y - v14Y * v23X;
		const a1 = cross1X * cross1X + cross1Y * cross1Y + cross1Z * cross1Z;
		const a2 = cross2X * cross2X + cross2Y * cross2Y + cross2Z * cross2Z;
		const a3 = cross3X * cross3X + cross3Y * cross3Y + cross3Z * cross3Z;

		p1X = relPos11[0]; p1Y = relPos11[1]; p1Z = relPos11[2];
		p2X = relPos31[0]; p2Y = relPos31[1]; p2Z = relPos31[2];
		p3X = relPos41[0]; p3Y = relPos41[1]; p3Z = relPos41[2];
		v12X = p2X - p1X; v12Y = p2Y - p1Y; v12Z = p2Z - p1Z;
		v34X = rp1X - p3X; v34Y = rp1Y - p3Y; v34Z = rp1Z - p3Z;
		v13X = p3X - p1X; v13Y = p3Y - p1Y; v13Z = p3Z - p1Z;
		v24X = rp1X - p2X; v24Y = rp1Y - p2Y; v24Z = rp1Z - p2Z;
		v14X = rp1X - p1X; v14Y = rp1Y - p1Y; v14Z = rp1Z - p1Z;
		v23X = p3X - p2X; v23Y = p3Y - p2Y; v23Z = p3Z - p2Z;
		cross1X = v12Y * v34Z - v12Z * v34Y; cross1Y = v12Z * v34X - v12X * v34Z; cross1Z = v12X * v34Y - v12Y * v34X;
		cross2X = v13Y * v24Z - v13Z * v24Y; cross2Y = v13Z * v24X - v13X * v24Z; cross2Z = v13X * v24Y - v13Y * v24X;
		cross3X = v14Y * v23Z - v14Z * v23Y; cross3Y = v14Z * v23X - v14X * v23Z; cross3Z = v14X * v23Y - v14Y * v23X;
		const a11 = cross1X * cross1X + cross1Y * cross1Y + cross1Z * cross1Z;
		const a21 = cross2X * cross2X + cross2Y * cross2Y + cross2Z * cross2Z;
		const a31 = cross3X * cross3X + cross3Y * cross3Y + cross3Z * cross3Z;
		const a22 = a11 > a21 ? a11 > a31 ? a11 : a31 : a21 > a31 ? a21 : a31;

		p1X = relPos11[0]; p1Y = relPos11[1]; p1Z = relPos11[2];
		p2X = relPos21[0]; p2Y = relPos21[1]; p2Z = relPos21[2];
		p3X = relPos41[0]; p3Y = relPos41[1]; p3Z = relPos41[2];
		v12X = p2X - p1X; v12Y = p2Y - p1Y; v12Z = p2Z - p1Z;
		v34X = rp1X - p3X; v34Y = rp1Y - p3Y; v34Z = rp1Z - p3Z;
		v13X = p3X - p1X; v13Y = p3Y - p1Y; v13Z = p3Z - p1Z;
		v24X = rp1X - p2X; v24Y = rp1Y - p2Y; v24Z = rp1Z - p2Z;
		v14X = rp1X - p1X; v14Y = rp1Y - p1Y; v14Z = rp1Z - p1Z;
		v23X = p3X - p2X; v23Y = p3Y - p2Y; v23Z = p3Z - p2Z;
		cross1X = v12Y * v34Z - v12Z * v34Y; cross1Y = v12Z * v34X - v12X * v34Z; cross1Z = v12X * v34Y - v12Y * v34X;
		cross2X = v13Y * v24Z - v13Z * v24Y; cross2Y = v13Z * v24X - v13X * v24Z; cross2Z = v13X * v24Y - v13Y * v24X;
		cross3X = v14Y * v23Z - v14Z * v23Y; cross3Y = v14Z * v23X - v14X * v23Z; cross3Z = v14X * v23Y - v14Y * v23X;
		const a12 = cross1X * cross1X + cross1Y * cross1Y + cross1Z * cross1Z;
		const a23 = cross2X * cross2X + cross2Y * cross2Y + cross2Z * cross2Z;
		const a32 = cross3X * cross3X + cross3Y * cross3Y + cross3Z * cross3Z;
		const a33 = a12 > a23 ? a12 > a32 ? a12 : a32 : a23 > a32 ? a23 : a32;

		p1X = relPos11[0]; p1Y = relPos11[1]; p1Z = relPos11[2];
		p2X = relPos21[0]; p2Y = relPos21[1]; p2Z = relPos21[2];
		p3X = relPos31[0]; p3Y = relPos31[1]; p3Z = relPos31[2];
		v12X = p2X - p1X; v12Y = p2Y - p1Y; v12Z = p2Z - p1Z;
		v34X = rp1X - p3X; v34Y = rp1Y - p3Y; v34Z = rp1Z - p3Z;
		v13X = p3X - p1X; v13Y = p3Y - p1Y; v13Z = p3Z - p1Z;
		v24X = rp1X - p2X; v24Y = rp1Y - p2Y; v24Z = rp1Z - p2Z;
		v14X = rp1X - p1X; v14Y = rp1Y - p1Y; v14Z = rp1Z - p1Z;
		v23X = p3X - p2X; v23Y = p3Y - p2Y; v23Z = p3Z - p2Z;
		cross1X = v12Y * v34Z - v12Z * v34Y; cross1Y = v12Z * v34X - v12X * v34Z; cross1Z = v12X * v34Y - v12Y * v34X;
		cross2X = v13Y * v24Z - v13Z * v24Y; cross2Y = v13Z * v24X - v13X * v24Z; cross2Z = v13X * v24Y - v13Y * v24X;
		cross3X = v14Y * v23Z - v14Z * v23Y; cross3Y = v14Z * v23X - v14X * v23Z; cross3Z = v14X * v23Y - v14Y * v23X;
		const a13 = cross1X * cross1X + cross1Y * cross1Y + cross1Z * cross1Z;
		const a24 = cross2X * cross2X + cross2Y * cross2Y + cross2Z * cross2Z;
		const a34 = cross3X * cross3X + cross3Y * cross3Y + cross3Z * cross3Z;
		const a4 = a13 > a24 ? a13 > a34 ? a13 : a34 : a24 > a34 ? a24 : a34;

		let max = a1 > a2 ? a1 > a3 ? a1 : a3 : a2 > a3 ? a2 : a3;
		let target = 0;
		if (a22 > max && maxDepthIndex !== 1 || maxDepthIndex === 0) {
			max = a22;
			target = 1;
		}
		if (a33 > max && maxDepthIndex !== 2) {
			max = a33;
			target = 2;
		}
		if (a4 > max && maxDepthIndex !== 3) {
			target = 3;
		}
		return target;
	}

	/**
	 * 计算所有接触点的相对质心坐标。
	 * 核心逻辑：
	 *              1. 将每个接触点的局部坐标通过物体的旋转矩阵转换为相对质心坐标（relPos1/relPos2）
	 *              2. 标记接触点为已热启动（warmStarted=true），表示冲量数据可复用
	 *              注：相对质心坐标 = 旋转矩阵 × 局部坐标
	 * @param {Transform} _tf1 第一个物体的变换信息 - 包含旋转矩阵，用于局部→相对坐标转换
	 * @param {Transform} _tf2 第二个物体的变换信息 - 包含旋转矩阵，用于局部→相对坐标转换
	 */
	public computeRelativePositions(_tf1: Transform, _tf2: Transform): void {
		const tf1 = _tf1.elements, tf2 = _tf2.elements;
		const num = this._manifold.numPoints;
		let _g = 0;
		while (_g < num) {
			let p = this._manifold.points[_g++];
			let relPos1 = p.relPos1, localPos1 = p.localPos1, relPos2 = p.relPos2, localPos2 = p.localPos2;
			relPos1[0] = tf1[3] * localPos1[0] + tf1[4] * localPos1[1] + tf1[5] * localPos1[2];
			relPos1[1] = tf1[6] * localPos1[0] + tf1[7] * localPos1[1] + tf1[8] * localPos1[2];
			relPos1[2] = tf1[9] * localPos1[0] + tf1[10] * localPos1[1] + tf1[11] * localPos1[2];
			relPos2[0] = tf2[3] * localPos2[0] + tf2[4] * localPos2[1] + tf2[5] * localPos2[2];
			relPos2[1] = tf2[6] * localPos2[0] + tf2[7] * localPos2[1] + tf2[8] * localPos2[2];
			relPos2[2] = tf2[9] * localPos2[0] + tf2[10] * localPos2[1] + tf2[11] * localPos2[2];
			p.warmStarted = true;
		}
	}

	/**
	 * 查找与新检测点最近的现有接触点索引。
	 * 匹配逻辑：
	 *              1. 将新点的世界坐标转换为相对质心坐标
	 *              2. 计算新点与每个现有接触点的相对坐标平方距离（分别计算两个物体侧）
	 *              3. 选择最小平方距离小于阈值的接触点作为匹配结果
	 *              用途：增量更新时复用已有接触点的冲量数据，实现热启动
	 * @param {DetectorResultPoint} target 新的碰撞检测点 - 待匹配的接触点
	 * @param {Transform} _tf1 第一个物体的变换信息 - 用于世界→相对坐标转换
	 * @param {Transform} _tf2 第二个物体的变换信息 - 用于世界→相对坐标转换
	 * @returns {number} 最近接触点的索引，无匹配则返回-1
	 */
	public findNearestContactPointIndex(target: DetectorResultPoint, _tf1: Transform, _tf2: Transform): number {
		let nearestSq = CONSTANT.SETTING_CONTACT_PERSISTENCE_THRESHOLD * CONSTANT.SETTING_CONTACT_PERSISTENCE_THRESHOLD;
		const tf1 = _tf1.elements, tf2 = _tf2.elements;
		let idx = -1, _g = 0, _g1 = this._manifold.numPoints;
		while (_g < _g1) {
			const i = _g++;
			const mp = this._manifold.points[i];
			const relPos1 = mp.relPos1, relPos2 = mp.relPos2;
			const v = target.position1.elements, v1 = target.position2.elements;
			let rp1X = v[0], rp1Y = v[1], rp1Z = v[2];
			let rp2X = v1[0], rp2Y = v1[1], rp2Z = v1[2];
			rp1X -= tf1[0]; rp1Y -= tf1[1]; rp1Z -= tf1[2];
			rp2X -= tf2[0]; rp2Y -= tf2[1]; rp2Z -= tf2[2];
			const diff1X = relPos1[0] - rp1X, diff1Y = relPos1[1] - rp1Y, diff1Z = relPos1[2] - rp1Z;
			const diff2X = relPos2[0] - rp2X, diff2Y = relPos2[1] - rp2Y, diff2Z = relPos2[2] - rp2Z;
			const sq1 = diff1X * diff1X + diff1Y * diff1Y + diff1Z * diff1Z;
			const sq2 = diff2X * diff2X + diff2Y * diff2Y + diff2Z * diff2Z;
			const d = sq1 < sq2 ? sq1 : sq2;
			if (d < nearestSq) {
				nearestSq = d;
				idx = i;
			}
		}
		return idx;
	}

	/**
	 * 全量更新碰撞流形（替换所有接触点）。
	 * 全量更新流程：
	 *              1. 缓存当前所有接触点数据到oldPoints（用于冲量继承）
	 *              2. 根据检测结果重置接触点数量，并更新所有接触点的坐标、深度、ID等信息
	 *              3. 匹配新旧接触点的ID，继承冲量数据（热启动）
	 *              注：适用于碰撞状态发生突变的场景（如首次碰撞、碰撞区域大幅变化）
	 * @param {DetectorResult} result 碰撞检测结果 - 包含最新的所有接触点信息
	 * @param {Transform} _tf1 第一个物体的变换信息 - 用于坐标转换
	 * @param {Transform} _tf2 第二个物体的变换信息 - 用于坐标转换
	 */
	public totalUpdate(result: DetectorResult, _tf1: Transform, _tf2: Transform): void {
		const tf1 = _tf1.elements, tf2 = _tf2.elements;
		this.numOldPoints = this._manifold.numPoints;
		let _g = 0, _g1 = this.numOldPoints;
		while (_g < _g1) {
			let i = _g++;
			const _this = this.oldPoints[i];
			const tlp1 = _this.localPos1, tlp2 = _this.localPos2, trp1 = _this.relPos1, trp2 = _this.localPos2, tp1 = _this.pos1, tp2 = _this.pos2;
			const cp = this._manifold.points[i];
			const clp1 = cp.localPos1, clp2 = cp.localPos2, crp1 = cp.relPos1, crp2 = cp.localPos2, cp1 = cp.pos1, cp2 = cp.pos2;
			tlp1[0] = clp1[0]; tlp1[1] = clp1[1]; tlp1[2] = clp1[2];
			tlp2[0] = clp2[0]; tlp2[1] = clp2[1]; tlp2[2] = clp2[2];
			trp1[0] = crp1[0]; trp1[1] = crp1[1]; trp1[2] = crp1[2];
			trp2[0] = crp2[0]; trp2[1] = crp2[1]; trp2[2] = crp2[2];
			tp1[0] = cp1[0]; tp1[1] = cp1[1]; tp1[2] = cp1[2];
			tp2[0] = cp2[0]; tp2[1] = cp2[1]; tp2[2] = cp2[2];
			_this.depth = cp.depth;
			for (let i = 0; i < 7; i++) {
				_this.impulse.elements[i] = cp.impulse.elements[i];
			}
			_this.id = cp.id;
			_this.warmStarted = cp.warmStarted;
			_this.disabled = false;
		}
		const num = result.numPoints;
		this._manifold.numPoints = num;
		let _g2 = 0;
		while (_g2 < num) {
			const i = _g2++;
			const p = this._manifold.points[i];
			const pos1 = p.pos1, pos2 = p.pos2, relPos1 = p.relPos1, relPos2 = p.relPos2, localPos1 = p.localPos1, localPos2 = p.localPos2;
			const ref = result.points[i];
			const v = ref.position1.elements, v1 = ref.position2.elements;
			pos1[0] = v[0]; pos1[1] = v[1]; pos1[2] = v[2];
			pos2[0] = v1[0]; pos2[1] = v1[1]; pos2[2] = v1[2];
			relPos1[0] = pos1[0] - tf1[0]; relPos1[1] = pos1[1] - tf1[1]; relPos1[2] = pos1[2] - tf1[2];
			relPos2[0] = pos2[0] - tf2[0]; relPos2[1] = pos2[1] - tf2[1]; relPos2[2] = pos2[2] - tf2[2];
			localPos1[0] = tf1[3] * relPos1[0] + tf1[6] * relPos1[1] + tf1[9] * relPos1[2];
			localPos1[1] = tf1[4] * relPos1[0] + tf1[7] * relPos1[1] + tf1[10] * relPos1[2];
			localPos1[2] = tf1[5] * relPos1[0] + tf1[8] * relPos1[1] + tf1[11] * relPos1[2];
			localPos2[0] = tf2[3] * relPos2[0] + tf2[6] * relPos2[1] + tf2[9] * relPos2[2];
			localPos2[1] = tf2[4] * relPos2[0] + tf2[7] * relPos2[1] + tf2[10] * relPos2[2];
			localPos2[2] = tf2[5] * relPos2[0] + tf2[8] * relPos2[1] + tf2[11] * relPos2[2];
			p.depth = ref.depth;
			const _this = p.impulse.elements;
			_this[0] = _this[1] = _this[2] = _this[3] = _this[4] = _this[5] = _this[6] = 0;
			p.id = ref.id;
			p.warmStarted = false;
			p.disabled = false;
			let _g = 0, _g1 = this.numOldPoints;
			while (_g < _g1) {
				const ocp = this.oldPoints[_g++];
				if (p.id === ocp.id) {
					for (let k = 0; k < 7; k++) {
						_this[k] = ocp.impulse.elements[k];
					}
					p.warmStarted = true;
					break;
				}
			}
		}
	}

	/**
	 * 增量更新碰撞流形（复用现有接触点，仅更新/添加新点）。
	 * 增量更新流程（适用于连续碰撞帧）：
	 *              1. 更新现有接触点的深度和位置
	 *              2. 标记所有现有接触点为已热启动
	 *              3. 匹配新检测点与现有接触点：
	 *                 - 找到匹配点：更新该点的坐标和深度
	 *                 - 未找到匹配点：添加新接触点
	 *              4. 移除过期的接触点，保持接触点有效性
	 *              注：增量更新能保持碰撞响应的连续性，减少抖动
	 * @param {DetectorResult} result 碰撞检测结果 - 包含最新的单个接触点信息
	 * @param {Transform} _tf1 第一个物体的变换信息 - 用于坐标转换
	 * @param {Transform} _tf2 第二个物体的变换信息 - 用于坐标转换
	 */
	public incrementalUpdate(result: DetectorResult, _tf1: Transform, _tf2: Transform): void {
		const tf1 = _tf1.elements, tf2 = _tf2.elements;
		this._manifold.updateDepthsAndPositions(_tf1, _tf2);
		let _g = 0, _g1 = this._manifold.numPoints;
		while (_g < _g1) this._manifold.points[_g++].warmStarted = true;
		const newPoint = result.points[0];
		const index = this.findNearestContactPointIndex(newPoint, _tf1, _tf2);
		if (index === -1) {
			this.addManifoldPoint(newPoint, _tf1, _tf2);
		} else {
			const cp = this._manifold.points[index];
			const pos1 = cp.pos1, pos2 = cp.pos2, relPos1 = cp.relPos1, relPos2 = cp.relPos2, localPos1 = cp.localPos1, localPos2 = cp.localPos2;
			const v = newPoint.position1.elements, v1 = newPoint.position2.elements;
			pos1[0] = v[0]; pos1[1] = v[1]; pos1[2] = v[2];
			pos2[0] = v1[0]; pos2[1] = v1[1]; pos2[2] = v1[2];
			relPos1[0] = pos1[0] - tf1[0]; relPos1[1] = pos1[1] - tf1[1]; relPos1[2] = pos1[2] - tf1[2];
			relPos2[0] = pos2[0] - tf2[0]; relPos2[1] = pos2[1] - tf2[1]; relPos2[2] = pos2[2] - tf2[2];
			localPos1[0] = tf1[3] * relPos1[0] + tf1[6] * relPos1[1] + tf1[9] * relPos1[2];
			localPos1[1] = tf1[4] * relPos1[0] + tf1[7] * relPos1[1] + tf1[10] * relPos1[2];
			localPos1[2] = tf1[5] * relPos1[0] + tf1[8] * relPos1[1] + tf1[11] * relPos1[2];
			localPos2[0] = tf2[3] * relPos2[0] + tf2[6] * relPos2[1] + tf2[9] * relPos2[2];
			localPos2[1] = tf2[4] * relPos2[0] + tf2[7] * relPos2[1] + tf2[10] * relPos2[2];
			localPos2[2] = tf2[5] * relPos2[0] + tf2[8] * relPos2[1] + tf2[11] * relPos2[2];
			cp.depth = newPoint.depth;
		}
		this.removeOutdatedPoints();
	}
}

export { ManifoldUpdater };