import { Nullable } from "./nullable";

/**
 * 默认3x3单位矩阵（行主序）。
 * 用于初始化旋转/变换矩阵的基础值，无旋转、无缩放的恒等变换状态：
 * 数组结构 [1,0,0, 0,1,0, 0,0,1] 对应3x3单位矩阵的行主序存储，是矩阵运算的基准状态。
 */
const DEFAULT_33 = [1, 0, 0, 0, 1, 0, 0, 0, 1];

let tf0 = new Float64Array(16);
let tv0 = new Float64Array(4);

/**
 * 变换操作选项枚举。
 * 控制向量/矩阵变换时的操作范围，适配物理引擎中不同坐标空间转换场景：
 * - 平移+旋转：完整的空间变换（默认）；
 * - 仅旋转：剔除平移的纯姿态变换；
 * - 仅平移：剔除旋转的纯位置变换。
 */
enum TRANSFORM_OPTION {
	/** 同时执行平移+旋转变换（默认），适配局部→世界空间的完整转换 */
	TRANSLATE_ROTATE,
	/** 仅执行旋转变换，适配纯姿态调整（如刚体朝向修改） */
	ROTATE,
	/** 仅执行平移变换，适配纯位置调整（如刚体平移） */
	TRANSLATE,
}

/**
 * 物理引擎核心工具方法类。
 * 物理引擎的底层数值计算核心类，封装所有通用的高性能数值操作，核心定位：
 * 1. 统一管理矩阵/向量/四元数/AABB/变换的基础运算，保证计算逻辑的一致性；
 * 2. 基于Float64Array实现双精度浮点运算，避免物理计算的精度丢失；
 * 3. 采用「out参数输出」「复用临时数组」等设计，最小化内存分配开销；
 * 核心设计原则：
 * - 无状态：所有方法均为静态方法，无需实例化，避免对象创建开销；
 * - 行主序：矩阵/变换数据统一采用行主序存储，与引擎其他模块保持一致；
 * - 高性能：避免冗余计算，优先使用逐元素遍历、直接数组操作等高效逻辑；
 * 主要应用场景：刚体动力学计算、碰撞检测、约束求解、坐标空间转换。
 */
export default class Method {

	/**
	 * 计算数组元素的绝对值并缩放。
	 * 核心逻辑：遍历数组指定范围，先取元素绝对值，再乘以缩放因子后写入输出数组。
	 * @param {Float64Array} a - 输入数组（原始数值）
	 * @param {Float64Array} out - 输出数组（结果写入此数组，避免新建数组）
	 * @param {number} [aStart=0] - 输入数组起始索引，默认从0开始
	 * @param {number} [outStart=0] - 输出数组起始索引，默认从0开始
	 * @param {number} [length=3] - 计算长度，默认3（适配Vec3的3元素结构）
	 * @param {number} [fac=1] - 缩放因子，绝对值计算后乘以该值，默认1（无缩放）
	 * @returns {Float64Array} 输出数组out（与入参out指向同一数组）
	 */
	public static absArray(a: Float64Array, out: Float64Array, aStart = 0, outStart = 0, length = 3, fac = 1): Float64Array {
		for (let i = 0; i < length; i++) {
			const va = a[aStart + i];
			out[outStart + i] = (va > 0 ? va : -va) * fac;
		}
		return out;
	}

	/**
	 * 两个数组逐元素相加。
	 * 核心逻辑：遍历指定长度，将a[i] + b[i]的结果写入out[i]，支持不同起始索引的数组片段相加。
	 * @param {Float64Array} a - 第一个输入数组
	 * @param {Float64Array} b - 第二个输入数组
	 * @param {Float64Array} out - 输出数组（结果写入此数组）
	 * @param {number} [startA=0] - 数组a的起始索引
	 * @param {number} [startB=0] - 数组b的起始索引
	 * @param {number} [startOut=0] - 输出数组的起始索引
	 * @param {number} [length=3] - 计算长度，默认3（适配Vec3）
	 * @returns {Float64Array} 输出数组out
	 */
	public static addArray(a: Float64Array, b: Float64Array, out: Float64Array, startA = 0, startB = 0, startOut = 0, length = 3): Float64Array {
		const sa = startA || 0;
		const sb = startB || 0;
		const so = startOut || 0;
		const len = length || Math.min(a.length, b.length);
		for (let i = 0; i < len; i++) {
			out[i + so] = a[i + sa] + b[i + sb];
		}
		return out;
	}

	/**
	 * 检测两个AABB包围盒是否相交（轴对齐检测）。
	 * 核心逻辑：基于轴对齐包围盒的分离轴定理（SAT），检测三个轴向上是否存在重叠，全部重叠则相交。
	 * @param {Float64Array} b0 - 第一个AABB数组，结构[minX,minY,minZ,maxX,maxY,maxZ]
	 * @param {Float64Array} b1 - 第二个AABB数组，结构同b0
	 * @returns {boolean} 相交返回true，否则false
	 */
	public static boxIntersectsBox(b0: Float64Array, b1: Float64Array): boolean {
		return b0[0] < b1[3] && b0[3] > b1[0] &&
			b0[1] < b1[4] && b0[4] > b1[1] &&
			b0[2] < b1[5] && b0[5] > b1[2];
	}

	/**
	 * 检测第一个AABB是否完全包含第二个AABB。
	 * 核心逻辑：检测b1的所有边界是否都在b0的边界范围内，是则判定为包含。
	 * @param {Float64Array} b0 - 容器AABB数组，结构[minX,minY,minZ,maxX,maxY,maxZ]
	 * @param {Float64Array} b1 - 被检测AABB数组，结构同b0
	 * @returns {boolean} 包含返回true，否则false
	 */
	public static boxContainsBox(b0: Float64Array, b1: Float64Array): boolean {
		return b0[0] <= b1[0] && b0[3] >= b1[3] &&
			b0[1] <= b1[1] && b0[4] >= b1[4] &&
			b0[2] <= b1[2] && b0[5] >= b1[5];
	}

	/**
	 * 计算两个AABB的并集（包围两个AABB的最小AABB）。
	 * 核心逻辑：取两个AABB的最小min值和最大max值，构成新的包围盒。
	 * @param {Float64Array} b1 - 第一个AABB数组，结构[minX,minY,minZ,maxX,maxY,maxZ]
	 * @param {Float64Array} b2 - 第二个AABB数组，结构同b1
	 * @param {Float64Array} out - 输出并集AABB的数组，结构同b1
	 * @returns {Float64Array} 输出数组out
	 */
	public static boxUnionBox(b1: Float64Array, b2: Float64Array, out: Float64Array): Float64Array {
		out[0] = b1[0] < b2[0] ? b1[0] : b2[0]; out[1] = b1[1] < b2[1] ? b1[1] : b2[1]; out[2] = b1[2] < b2[2] ? b1[2] : b2[2];
		out[3] = b1[3] > b2[3] ? b1[3] : b2[3]; out[4] = b1[4] > b2[4] ? b1[4] : b2[4]; out[5] = b1[5] > b2[5] ? b1[5] : b2[5];
		return out;
	}

	/**
	 * 计算两个三维向量的叉乘（向量积）。
	 * 核心公式：叉乘结果 = (y0*z1 - z0*y1, z0*x1 - x0*z1, x0*y1 - y0*x1)，适配物理引擎中法向量、力矩计算场景。
	 * @param {number} x0 - 第一个向量x分量
	 * @param {number} y0 - 第一个向量y分量
	 * @param {number} z0 - 第一个向量z分量
	 * @param {number} x1 - 第二个向量x分量
	 * @param {number} y1 - 第二个向量y分量
	 * @param {number} z1 - 第二个向量z分量
	 * @param {Float64Array} out - 输出叉乘结果的数组
	 * @param {number} [start=0] - 输出数组的起始索引，默认0
	 * @returns {Float64Array} 输出数组out
	 */
	public static crossVectors(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, out: Float64Array, start = 0): Float64Array {
		out[start] = y0 * z1 - z0 * y1;
		out[start + 1] = z0 * x1 - x0 * z1;
		out[start + 2] = x0 * y1 - y0 * x1;
		return out;
	}

	/**
	 * 将Vec3（位置）和Mat3（旋转/缩放）合并为Transform变换数组。
	 * 核心逻辑：将位置向量写入变换数组前3位，3x3矩阵写入后9位，完成平移+旋转的变换整合。
	 * @param {Float64Array} vec3 - 位置向量数组，结构[x,y,z]
	 * @param {Float64Array} mat3 - 3x3矩阵数组（行优先），结构[m00,m01,m02,m10,m11,m12,m20,m21,m22]
	 * @param {Float64Array} transform - 输出变换数组（长度12），结构[x,y,z, m00,m01,m02, m10,m11,m12, m20,m21,m22]
	 */
	public static combineMat3Vec3ToTransform(vec3: Float64Array, mat3: Float64Array, transform: Float64Array): void {
		const m = mat3, v = vec3, t = transform;
		t[0] = v[0]; t[1] = v[1]; t[2] = v[2];
		t[3] = m[0]; t[4] = m[1]; t[5] = m[2];
		t[6] = m[3]; t[7] = m[4]; t[8] = m[5];
		t[9] = m[6]; t[10] = m[7]; t[11] = m[8];
	}

	/**
	 * 拷贝数组元素（支持指定起始索引和长度）。
	 * 核心逻辑：遍历指定长度，将src[startSrc+i]的值直接赋值给dst[startDst+i]，支持数组片段拷贝。
	 * @param {Float64Array} src - 源数组（待拷贝的原始数据）
	 * @param {Float64Array} dst - 目标数组（拷贝结果写入此数组）
	 * @param {number} [startSrc=0] - 源数组起始索引
	 * @param {number} [startDst=0] - 目标数组起始索引
	 * @param {number} [length=0] - 拷贝长度，0则取两数组最小长度
	 * @returns {Float64Array} 目标数组dst
	 */
	public static copyElements(src: Float64Array, dst: Float64Array, startSrc = 0, startDst = 0, length = 0): Float64Array {
		const ss = startSrc;
		const sd = startDst;
		const len = length || Math.min(src.length, dst.length);
		for (let i = 0; i < len; i++) {
			dst[i + sd] = src[i + ss];
		}
		return dst;
	}

	/**
	 * 从Transform变换数组中提取四元数（旋转部分）。
	 * 核心逻辑：从变换数组的3x3旋转矩阵部分，通过矩阵转四元数的标准算法提取旋转信息，忽略平移分量。
	 * @param {Float64Array} transform - 变换数组（长度12），结构[x,y,z, m00,m01,m02, m10,m11,m12, m20,m21,m22]
	 * @param {Float64Array} out - 输出四元数数组，结构[x,y,z,w]
	 */
	public static extractQuatFromTransform(transform: Float64Array, out: Float64Array): void {
		const tq = out, tf = transform;
		const t = tf[3] + tf[7] + tf[11];
		let s: number;
		if (t > 0) {
			s = Math.sqrt(t + 1);
			tq[3] = 0.5 * s;
			s = 0.5 / s;
			tq[0] = (tf[10] - tf[8]) * s; tq[1] = (tf[5] - tf[9]) * s; tq[2] = (tf[6] - tf[4]) * s;
		} else if (tf[3] > tf[7]) {
			if (tf[3] > tf[11]) {
				s = Math.sqrt(tf[3] - tf[7] - tf[11] + 1);
				tq[0] = 0.5 * s;
				s = 0.5 / s;
				tq[1] = (tf[4] + tf[6]) * s; tq[2] = (tf[5] + tf[9]) * s; tq[3] = (tf[10] - tf[8]) * s;
			} else {
				s = Math.sqrt(tf[11] - tf[3] - tf[7] + 1);
				tq[2] = 0.5 * s;
				s = 0.5 / s;
				tq[0] = (tf[5] + tf[9]) * s; tq[1] = (tf[8] + tf[10]) * s; tq[3] = (tf[6] - tf[4]) * s;
			}
		} else if (tf[7] > tf[11]) {
			s = Math.sqrt(tf[7] - tf[11] - tf[3] + 1);
			tq[1] = 0.5 * s;
			s = 0.5 / s;
			tq[0] = (tf[4] + tf[6]) * s; tq[2] = (tf[8] + tf[10]) * s; tq[3] = (tf[5] - tf[9]) * s;
		} else {
			s = Math.sqrt(tf[11] - tf[3] - tf[7] + 1);
			tq[2] = 0.5 * s;
			s = 0.5 / s;
			tq[0] = (tf[5] + tf[9]) * s; tq[1] = (tf[8] + tf[10]) * s; tq[3] = (tf[6] - tf[4]) * s;
		}
	}

	/**
	 * 按指定缩放值扩展AABB包围盒（各方向同时扩展）。
	 * 核心逻辑：min分量减去scale，max分量加上scale，实现包围盒各方向的均匀扩展/收缩。
	 * @param {Float64Array} box - AABB数组，结构[minX,minY,minZ,maxX,maxY,maxZ]
	 * @param {number} scale - 扩展值（正数向外扩展，负数向内收缩）
	 */
	public static expandBoxByScale(box: Float64Array, scale: number): void {
		box[0] -= scale; box[1] -= scale; box[2] -= scale;
		box[3] += scale; box[4] += scale; box[5] += scale;
	}

	/**
	 * 按指定点扩展AABB包围盒（仅扩展到包含该点）。
	 * 核心逻辑：仅当点超出当前AABB范围时，调整对应min/max值，保证包围盒最小且包含该点。
	 * @param {Float64Array} box - AABB数组，结构[minX,minY,minZ,maxX,maxY,maxZ]
	 * @param {number} x - 点的x坐标
	 * @param {number} y - 点的y坐标
	 * @param {number} z - 点的z坐标
	 */
	public static expandBoxByPoint(box: Float64Array, x: number, y: number, z: number): void {
		const addToMinX = x > 0 ? 0 : x, addToMinY = y > 0 ? 0 : y, addToMinZ = z > 0 ? 0 : z;
		const addToMaxX = x < 0 ? 0 : x, addToMaxY = y < 0 ? 0 : y, addToMaxZ = z < 0 ? 0 : z;
		box[0] += addToMinX; box[1] += addToMinY; box[2] += addToMinZ;
		box[3] += addToMaxX; box[4] += addToMaxY; box[5] += addToMaxZ;
	}

	/**
	 * 填充数组指定范围的元素为指定值。
	 * 核心逻辑：遍历数组从start到end的索引，将所有元素赋值为指定value，超出数组长度则终止。
	 * @template T 数组类型（默认Float64Array）
	 * @template E 元素类型（默认number）
	 * @param {T} tar - 目标数组
	 * @param {number} start - 起始索引
	 * @param {number} end - 结束索引（包含）
	 * @param {E} value - 填充值
	 * @returns {T} 填充后的目标数组
	 */
	public static fillValue<T = Float64Array, E = number>(tar: T, start: number, end: number, value: E): T {
		for (let i = start; i < (tar as any).length; i++) {
			if (i > end) break;
			(tar as any[])[i] = value;
		}
		return tar;
	}

	/**
	 * 计算惯性张量的逆值（物理引擎中刚体旋转惯性计算）。
	 * 核心逻辑：基于刚体的惯性轴、旋转速度和质量，计算旋转惯性的逆值，适配刚体旋转动力学求解。
	 * @param {number} axisX - 惯性轴x分量
	 * @param {number} axisY - 惯性轴y分量
	 * @param {number} axisZ - 惯性轴z分量
	 * @param {Float64Array} rv - 旋转速度向量，结构[x,y,z]
	 * @param {Float64Array} ra - 旋转轴向量，结构[x,y,z]
	 * @param {number} invMass - 质量的倒数（1/质量）
	 * @param {number} mass - 刚体质量
	 * @returns {number} 惯性张量逆值
	 */
	public static inverseInertia(axisX: number, axisY: number, axisZ: number, rv: Float64Array, ra: Float64Array, invMass: number, mass: number): number {
		let invI1 = rv[0] * axisX + rv[1] * axisY + rv[2] * axisZ;
		if (invI1 > 0) {
			const dot = axisX * ra[0] + axisY * ra[1] + axisZ * ra[2];
			const projsq = ra[0] * ra[0] + ra[1] * ra[1] + ra[2] * ra[2] - dot * dot;
			if (projsq > 0) {
				if (invMass > 0) {
					invI1 = 1 / (1 / invI1 + mass * projsq);
				} else {
					invI1 = 0;
				}
			}
		}
		return invI1;
	}

	/**
	 * 对3x3矩阵执行变换的逆操作（物理引擎中坐标空间转换）。
	 * 核心逻辑：基于变换数组的旋转矩阵部分，对输入3x3矩阵执行逆变换，适配世界→局部空间的矩阵转换。
	 * @param {Float64Array} tf - 变换数组（长度12），结构[x,y,z, m00,m01,m02, m10,m11,m12, m20,m21,m22]
	 * @param {Float64Array} wb - 输入3x3矩阵（行优先），结构[m00,m01,m02,m10,m11,m12,m20,m21,m22]
	 * @param {Nullable<Float64Array>} [out] - 输出数组（默认新建Float64Array(9)）
	 */
	public static inverseTransformM3(tf: Float64Array, wb: Float64Array, out?: Float64Array): void {
		const tf1 = tf;
		const wb1 = wb;
		const o = out || new Float64Array(9);
		o[0] = tf1[3] * wb1[0] + tf1[6] * wb1[3] + tf1[9] * wb1[6];
		o[1] = tf1[3] * wb1[1] + tf1[6] * wb1[4] + tf1[9] * wb1[7];
		o[2] = tf1[3] * wb1[2] + tf1[6] * wb1[5] + tf1[9] * wb1[8];
		o[3] = tf1[4] * wb1[0] + tf1[7] * wb1[3] + tf1[10] * wb1[6];
		o[4] = tf1[4] * wb1[1] + tf1[7] * wb1[4] + tf1[10] * wb1[7];
		o[5] = tf1[4] * wb1[2] + tf1[7] * wb1[5] + tf1[10] * wb1[8];
		o[6] = tf1[5] * wb1[0] + tf1[8] * wb1[3] + tf1[11] * wb1[6];
		o[7] = tf1[5] * wb1[1] + tf1[8] * wb1[4] + tf1[11] * wb1[7];
		o[8] = tf1[5] * wb1[2] + tf1[8] * wb1[5] + tf1[11] * wb1[8];
	}

	/**
	 * 判断对象是否为数组（兼容Float64Array等类数组对象）。
	 * 核心逻辑：先判断是否为对象类型，再通过Array.isArray或索引访问特性判定是否为数组/类数组。
	 * @param {any} obj - 待判断对象
	 * @returns {boolean} 是数组/类数组返回true，否则false
	 */
	public static isArray(obj: any): boolean {
		if (typeof obj !== 'object') {
			return false;
		}
		if (Array.isArray(obj)) return true;
		if (obj[0] !== undefined) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * 对三维向量执行逆旋转变换。
	 * 核心逻辑：通过旋转矩阵的转置（逆）对向量执行旋转变换，适配局部→世界空间的逆旋转。
	 * @param {Float64Array} _v - 输入/输出向量数组（直接修改原数组），结构[x,y,z]
	 * @param {Float64Array} _rot - 3x3旋转矩阵（行优先），结构[m00,m01,m02,m10,m11,m12,m20,m21,m22]
	 */
	public static inverseRotateVec3(_v: Float64Array, _rot: Float64Array): void {
		const v = _v, rot = _rot;
		const __tmp__X = rot[0] * v[0] + rot[3] * v[1] + rot[6] * v[2];
		const __tmp__Y = rot[1] * v[0] + rot[4] * v[1] + rot[7] * v[2];
		const __tmp__Z = rot[2] * v[0] + rot[5] * v[1] + rot[8] * v[2];
		v[0] = __tmp__X; v[1] = __tmp__Y; v[2] = __tmp__Z;
	}

	/**
	 * 对三维向量执行逆变换（从世界空间转换到局部空间）。
	 * 核心逻辑：先扣除平移分量（可选），再执行逆旋转变换，完成世界→局部空间的向量转换。
	 * @param {Float64Array} _tf - 变换数组（长度12），结构[x,y,z, m00,m01,m02, m10,m11,m12, m20,m21,m22]
	 * @param {Float64Array} vec3 - 输入向量数组，结构[x,y,z]
	 * @param {0 | 1} op - 变换选项：0=平移+旋转，1=仅旋转
	 * @param {Float64Array} out - 输出向量数组
	 * @param {number} [vecStart=0] - 输入向量起始索引
	 * @param {number} [outStart=0] - 输出向量起始索引
	 */
	public static inverseTransformVec3(_tf: Float64Array, vec3: Float64Array, op: 0 | 1, out: Float64Array, vecStart = 0, outStart = 0): void {
		const v = vec3, tf = _tf;
		let vX = v[vecStart], vY = v[vecStart + 1], vZ = v[vecStart + 2];
		if (op === 0) {
			vX -= tf[0]; vY -= tf[1]; vZ -= tf[2];
		}
		const __tmp__X = tf[3] * vX + tf[6] * vY + tf[9] * vZ;
		const __tmp__Y = tf[4] * vX + tf[7] * vY + tf[10] * vZ;
		const __tmp__Z = tf[5] * vX + tf[8] * vY + tf[11] * vZ;
		vX = __tmp__X;
		vY = __tmp__Y;
		vZ = __tmp__Z;
		const es = out;
		es[outStart] = __tmp__X; es[outStart + 1] = __tmp__Y; es[outStart + 2] = __tmp__Z;
	}

	/**
	 * 合并两个变换数组（src变换应用到m变换上）。
	 * 核心逻辑：先计算旋转矩阵的乘积，再计算平移分量的变换，完成两个变换的复合运算。
	 * @param {Float64Array} _src - 源变换数组（长度12）
	 * @param {Float64Array} _m - 目标变换数组（长度12）
	 * @param {Float64Array} _dst - 输出变换数组（长度12）
	 */
	public static multiplyTransform(_src: Float64Array, _m: Float64Array, _dst: Float64Array): void {
		const src = _src;
		const m = _m;
		const dst = _dst;
		dst[3] = m[3] * src[3] + m[4] * src[6] + m[5] * src[9];
		dst[4] = m[3] * src[4] + m[4] * src[7] + m[5] * src[10];
		dst[5] = m[3] * src[5] + m[4] * src[8] + m[5] * src[11];
		dst[6] = m[6] * src[3] + m[7] * src[6] + m[8] * src[9];
		dst[7] = m[6] * src[4] + m[7] * src[7] + m[8] * src[10];
		dst[8] = m[6] * src[5] + m[7] * src[8] + m[8] * src[11];
		dst[9] = m[9] * src[3] + m[10] * src[6] + m[11] * src[9];
		dst[10] = m[9] * src[4] + m[10] * src[7] + m[11] * src[10];
		dst[11] = m[9] * src[5] + m[10] * src[8] + m[11] * src[11];
		dst[0] = m[3] * src[0] + m[4] * src[1] + m[5] * src[2];
		dst[1] = m[6] * src[0] + m[7] * src[1] + m[8] * src[2];
		dst[2] = m[9] * src[0] + m[10] * src[1] + m[11] * src[2];
		dst[0] += m[0];
		dst[1] += m[1];
		dst[2] += m[2];
	}

	/**
	 * 将3x3旋转矩阵转换为四元数。
	 * 核心逻辑：基于矩阵的迹（对角线元素和）选择最优计算路径，将旋转矩阵转换为四元数，避免数值不稳定。
	 * @param {Float64Array} m3 - 3x3矩阵数组（行优先），结构[m00,m01,m02,m10,m11,m12,m20,m21,m22]
	 * @param {Float64Array} out - 输出四元数数组，结构[x,y,z,w]
	 */
	public static mat3ToQuat(m3: Float64Array, out: Float64Array): void {
		const tm = m3;
		const oe = out;
		const relRot00 = tm[0], relRot01 = tm[1], relRot02 = tm[2];
		const relRot10 = tm[3], relRot11 = tm[4], relRot12 = tm[5];
		const relRot20 = tm[6], relRot21 = tm[7], relRot22 = tm[8];
		let relQX: number, relQY: number, relQZ: number, relQW: number;
		const t = relRot00 + relRot11 + relRot22;
		let s: number;
		if (t > 0) {
			s = Math.sqrt(t + 1);
			relQW = 0.5 * s;
			s = 0.5 / s;
			relQX = (relRot21 - relRot12) * s;
			relQY = (relRot02 - relRot20) * s;
			relQZ = (relRot10 - relRot01) * s;
		} else if (relRot00 > relRot11) {
			if (relRot00 > relRot22) {
				s = Math.sqrt(relRot00 - relRot11 - relRot22 + 1);
				relQX = 0.5 * s;
				s = 0.5 / s;
				relQY = (relRot01 + relRot10) * s;
				relQZ = (relRot02 + relRot20) * s;
				relQW = (relRot21 - relRot12) * s;
			} else {
				s = Math.sqrt(relRot22 - relRot00 - relRot11 + 1);
				relQZ = 0.5 * s;
				s = 0.5 / s;
				relQX = (relRot02 + relRot20) * s;
				relQY = (relRot12 + relRot21) * s;
				relQW = (relRot10 - relRot01) * s;
			}
		} else if (relRot11 > relRot22) {
			s = Math.sqrt(relRot11 - relRot22 - relRot00 + 1);
			relQY = 0.5 * s;
			s = 0.5 / s;
			relQX = (relRot01 + relRot10) * s;
			relQZ = (relRot12 + relRot21) * s;
			relQW = (relRot02 - relRot20) * s;
		} else {
			s = Math.sqrt(relRot22 - relRot00 - relRot11 + 1);
			relQZ = 0.5 * s;
			s = 0.5 / s;
			relQX = (relRot02 + relRot20) * s;
			relQY = (relRot12 + relRot21) * s;
			relQW = (relRot10 - relRot01) * s;
		}
		oe[0] = relQX; oe[1] = relQY; oe[2] = relQZ; oe[3] = relQW;
	}

	/**
	 * 将3x3旋转矩阵转换为欧拉角（弧度）。
	 * 核心逻辑：从旋转矩阵中提取各轴旋转角度，处理边界情况（如万向锁），转换为欧拉角表示。
	 * @param {Float64Array} bs - 3x3矩阵数组（行优先）
	 * @param {Float64Array} out - 输出欧拉角数组，结构[x,y,z]（俯仰、偏航、滚转）
	 */
	public static mat3ToVec3(bs: Float64Array, out: Float64Array): void {
		const ot = out, tm = bs;
		const relRot00 = tm[0];
		const relRot01 = tm[1];
		const relRot02 = tm[2];
		const relRot11 = tm[4];
		const relRot12 = tm[5];
		const relRot21 = tm[7];
		const relRot22 = tm[8];
		const sy = relRot02;
		if (sy <= -1) {
			const xSubZ = Math.atan2(relRot21, relRot11);
			ot[0] = xSubZ * 0.5;
			ot[1] = -1.570796326794895;
			ot[2] = -xSubZ * 0.5;
		} else if (sy >= 1) {
			const xAddZ = Math.atan2(relRot21, relRot11);
			ot[0] = xAddZ * 0.5;
			ot[1] = 1.570796326794895;
			ot[2] = xAddZ * 0.5;
		} else {
			ot[0] = Math.atan2(-relRot12, relRot22);
			ot[1] = Math.asin(sy);
			ot[2] = Math.atan2(-relRot01, relRot00);
		}
	}

	/**
	 * 从两个轴向量创建正交基矩阵（归一化）。
	 * 核心逻辑：通过叉乘生成正交轴，归一化后构建正交基矩阵，适配刚体局部坐标系创建场景。
	 * @param {number} x0 - 第一个轴x分量
	 * @param {number} y0 - 第一个轴y分量
	 * @param {number} z0 - 第一个轴z分量
	 * @param {number} x1 - 第二个轴x分量
	 * @param {number} y1 - 第二个轴y分量
	 * @param {number} z1 - 第二个轴z分量
	 * @param {Float64Array} outElements - 输出3x3基矩阵（行优先）
	 */
	public static makeBasis(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, outElements: Float64Array): void {
		const ax = outElements;
		const aaXX = x0, aaXY = y0, aaXZ = z0;
		const aaZX = x1, aaZY = y1, aaZZ = z1;
		const aaYX = aaZY * aaXZ - aaZZ * aaXY, aaYY = aaZZ * aaXX - aaZX * aaXZ, aaYZ = aaZX * aaXY - aaZY * aaXX;
		ax[0] = aaYY * aaZZ - aaYZ * aaZY;
		ax[1] = aaYZ * aaZX - aaYX * aaZZ;
		ax[2] = aaYX * aaZY - aaYY * aaZX;
		ax[3] = aaYX;
		ax[4] = aaYY;
		ax[5] = aaYZ;
		ax[6] = aaXY * aaYZ - aaXZ * aaYY;
		ax[7] = aaXZ * aaYX - aaXX * aaYZ;
		ax[8] = aaXX * aaYY - aaXY * aaYX;
		let l = ax[0] * ax[0] + ax[1] * ax[1] + ax[2] * ax[2];
		if (l > 0) l = 1 / Math.sqrt(l);
		ax[0] *= l; ax[1] *= l; ax[2] *= l;
		l = ax[3] * ax[3] + ax[4] * ax[4] + ax[5] * ax[5];
		if (l > 0) l = 1 / Math.sqrt(l);
		ax[3] *= l; ax[4] *= l; ax[5] *= l;
		l = ax[6] * ax[6] + ax[7] * ax[7] + ax[8] * ax[8];
		if (l > 0) l = 1 / Math.sqrt(l);
		ax[6] *= l; ax[7] *= l; ax[8] *= l;
	}

	/**
	 * 两个3x3矩阵相乘（b0 * b1）。
	 * 核心逻辑：按矩阵乘法规则，计算行×列的点积，生成乘积矩阵，适配旋转矩阵复合运算。
	 * @param {Float64Array} b0 - 第一个3x3矩阵（行优先）
	 * @param {Float64Array} b1 - 第二个3x3矩阵（行优先）
	 * @param {Float64Array} out - 输出乘积矩阵（行优先）
	 */
	public static multiplyBasis(b0: Float64Array, b1: Float64Array, out: Float64Array): void {
		const b2 = out;
		b2[0] = b0[0] * b1[0] + b0[1] * b1[1] + b0[2] * b1[2];
		b2[1] = b0[3] * b1[0] + b0[4] * b1[1] + b0[5] * b1[2];
		b2[2] = b0[6] * b1[0] + b0[7] * b1[1] + b0[8] * b1[2];
		b2[3] = b0[0] * b1[3] + b0[1] * b1[4] + b0[2] * b1[5];
		b2[4] = b0[3] * b1[3] + b0[4] * b1[4] + b0[5] * b1[5];
		b2[5] = b0[6] * b1[3] + b0[7] * b1[4] + b0[8] * b1[5];
		b2[6] = b0[0] * b1[6] + b0[1] * b1[7] + b0[2] * b1[8];
		b2[7] = b0[3] * b1[6] + b0[4] * b1[7] + b0[5] * b1[8];
		b2[8] = b0[6] * b1[6] + b0[7] * b1[7] + b0[8] * b1[8];
	}

	/**
	 * 两个数组逐元素相乘并返回累加和（点积计算）。
	 * 核心逻辑：遍历数组计算a[i]*b[i]，可选写入输出数组，同时累加结果得到点积，适配向量点积、矩阵行×列计算。
	 * @param {Float64Array} a - 第一个数组
	 * @param {Float64Array} b - 第二个数组
	 * @param {number} [startA=0] - 数组a起始索引
	 * @param {number} [startB=0] - 数组b起始索引
	 * @param {number} [length=3] - 计算长度，默认3（适配Vec3）
	 * @param {Nullable<Float64Array>} [out=null] - 输出逐元素乘积的数组（可选）
	 * @param {number} [outStart=0] - 输出数组起始索引
	 * @returns {number} 逐元素乘积的累加和（点积结果）
	 */
	public static multiplyArray(a: Float64Array, b: Float64Array, startA = 0, startB = 0, length = 3, out: Nullable<Float64Array> = null, outStart = 0): number {
		const sa = startA || 0;
		const sb = startB || 0;
		const so = outStart || 0;
		let s = 0;
		const len = length || Math.min(a.length, b.length);
		for (let i = 0; i < len; i++) {
			const t = a[i + sa] * b[i + sb];
			if (out) out[i + so] = t;
			s += t;
		}
		return s;
	}

	/**
	 * 归一化数组（向量）为单位长度。
	 * 核心逻辑：先计算向量模长，再将每个元素除以模长（非零），得到单位向量，适配方向向量标准化。
	 * @param {Float64Array} ary - 输入数组（向量）
	 * @param {number} start - 起始索引
	 * @param {number} length - 计算长度
	 * @param {number} [scale=1] - 归一化后的缩放因子，默认1（单位长度）
	 */
	public static normalize(ary: Float64Array, start: number, length: number, scale = 1): void {
		let l = 0;
		const end = start + length;
		for (let i = start; i < end; i++) {
			l += ary[i] * ary[i];
		}
		if (l > 0) l = 1 / Math.sqrt(l);
		for (let i = start; i < end; i++) {
			ary[i] *= l * scale;
		}
	}

	/**
	 * 将四元数转换为3x3旋转矩阵。
	 * 核心逻辑：通过四元数转旋转矩阵的标准公式，将四元数的旋转信息转换为矩阵表示，适配旋转计算。
	 * @param {number} x - 四元数x分量
	 * @param {number} y - 四元数y分量
	 * @param {number} z - 四元数z分量
	 * @param {number} w - 四元数w分量
	 * @param {Float64Array} out - 输出3x3矩阵（行优先）
	 */
	public static quatToMat3(x: number, y: number, z: number, w: number, out: Float64Array): void {
		const o = out;
		const x2 = 2 * x, y2 = 2 * y, z2 = 2 * z;
		const xx = x * x2, yy = y * y2, zz = z * z2;
		const xy = x * y2, yz = y * z2, xz = x * z2;
		const wx = w * x2, wy = w * y2, wz = w * z2;
		o[0] = 1 - yy - zz;
		o[1] = xy - wz;
		o[2] = xz + wy;
		o[3] = xy + wz;
		o[4] = 1 - xx - zz;
		o[5] = yz - wx;
		o[6] = xz - wy;
		o[7] = yz + wx;
		o[8] = 1 - xx - yy;
	}

	/**
	 * 对变换数组执行旋转变换（更新旋转矩阵部分）。
	 * 核心逻辑：将旋转矩阵与变换数组的现有旋转矩阵相乘，更新变换的旋转部分，平移部分保持不变。
	 * @param {Float64Array} _tf - 变换数组（长度12）
	 * @param {Float64Array} _rot - 3x3旋转矩阵（行优先）
	 */
	public static rotateTransform(_tf: Float64Array, _rot: Float64Array): void {
		const tf = _tf, rot = _rot;
		const __tmp__00 = rot[0] * tf[3] + rot[1] * tf[6] + rot[2] * tf[9];
		const __tmp__01 = rot[0] * tf[4] + rot[1] * tf[7] + rot[2] * tf[10];
		const __tmp__02 = rot[0] * tf[5] + rot[1] * tf[8] + rot[2] * tf[11];
		const __tmp__10 = rot[3] * tf[3] + rot[4] * tf[6] + rot[5] * tf[9];
		const __tmp__11 = rot[3] * tf[4] + rot[4] * tf[7] + rot[5] * tf[10];
		const __tmp__12 = rot[3] * tf[5] + rot[4] * tf[8] + rot[5] * tf[11];
		const __tmp__20 = rot[6] * tf[3] + rot[7] * tf[6] + rot[8] * tf[9];
		const __tmp__21 = rot[6] * tf[4] + rot[7] * tf[7] + rot[8] * tf[10];
		const __tmp__22 = rot[6] * tf[5] + rot[7] * tf[8] + rot[8] * tf[11];
		tf[3] = __tmp__00;
		tf[4] = __tmp__01;
		tf[5] = __tmp__02;
		tf[6] = __tmp__10;
		tf[7] = __tmp__11;
		tf[8] = __tmp__12;
		tf[9] = __tmp__20;
		tf[10] = __tmp__21;
		tf[11] = __tmp__22;
	}

	/**
	 * 对三维向量执行旋转变换。
	 * 核心逻辑：将向量与旋转矩阵相乘，完成向量的旋转变换，适配局部→世界空间的方向转换。
	 * @param {Float64Array} _v - 输入/输出向量数组（直接修改原数组），结构[x,y,z]
	 * @param {Float64Array} _rot - 3x3旋转矩阵（行优先）
	 */
	public static rotateVec3(_v: Float64Array, _rot: Float64Array): void {
		const v = _v, rot = _rot;
		const __tmp__X = rot[0] * v[0] + rot[1] * v[1] + rot[2] * v[2];
		const __tmp__Y = rot[3] * v[0] + rot[4] * v[1] + rot[5] * v[2];
		const __tmp__Z = rot[6] * v[0] + rot[7] * v[1] + rot[8] * v[2];
		v[0] = __tmp__X; v[1] = __tmp__Y; v[2] = __tmp__Z;
	}

	/**
	 * 将向量按指定旋转矩阵旋转后输出。
	 * 核心逻辑：与rotateVec3逻辑一致，区别为输入是独立分量，输出到新数组，不修改原数据。
	 * @param {number} x - 输入向量x分量
	 * @param {number} y - 输入向量y分量
	 * @param {number} z - 输入向量z分量
	 * @param {Float64Array} rot - 3x3旋转矩阵（行优先）
	 * @param {Float64Array} out - 输出旋转后的向量数组，结构[x,y,z]
	 */
	public static rotateVecTo(x: number, y: number, z: number, rot: Float64Array, out: Float64Array): void {
		const o = out;
		const rx = rot[0] * x + rot[1] * y + rot[2] * z;
		const ry = rot[3] * x + rot[4] * y + rot[5] * z;
		const rz = rot[6] * x + rot[7] * y + rot[8] * z;
		o[0] = rx; o[1] = ry; o[2] = rz;
	}

	/**
	 * 设置对象的x/y/z属性。
	 * 核心逻辑：直接赋值对象的x/y/z属性，返回原对象，适配向量对象的属性快速设置。
	 * @param {{ x: number, y: number, z: number }} obj - 目标对象（如Vec3实例）
	 * @param {number} x - x值
	 * @param {number} y - y值
	 * @param {number} z - z值
	 * @returns {{ x: number, y: number, z: number }} 修改后的对象
	 */
	public static setXYZ(obj: { x: number, y: number, z: number }, x: number, y: number, z: number): { x: number, y: number, z: number } {
		obj.x = x; obj.y = y; obj.z = z;
		return obj;
	}

	/**
	 * 设置对象的x/y/z/w属性（适配四元数对象）。
	 * 核心逻辑：直接赋值对象的x/y/z/w属性，适配四元数对象的属性快速设置。
	 * @param {{ x: number, y: number, z: number, w: number }} obj - 目标对象（如Quat实例）
	 * @param {number} x - x值
	 * @param {number} y - y值
	 * @param {number} z - z值
	 * @param {number} w - w值
	 */
	public static setXYZW(obj: { x: number, y: number, z: number, w: number }, x: number, y: number, z: number, w: number): void {
		obj.x = x; obj.y = y; obj.z = z; obj.w = w;
	}

	/**
	 * 批量设置数组元素值。
	 * 核心逻辑：从start索引开始，依次将es中的值赋值给数组元素，适配多元素快速赋值场景。
	 * @template T 数组类型（默认Float64Array）
	 * @template E 元素类型（默认number）
	 * @param {T} ele - 目标数组
	 * @param {number} start - 起始索引
	 * @param  {...E} es - 要设置的元素值列表
	 * @returns {T} 修改后的数组
	 */
	public static setElements<T = Float64Array, E = number>(ele: T, start: number, ...es: E[]): T {
		for (let i = 0; i < es.length; i++) {
			(ele as any)[start + i] = es[i];
		}
		return ele;
	}

	/**
	 * 设置入射顶点数据（碰撞检测专用）。
	 * 核心逻辑：按「坐标+法向量」的结构批量设置顶点数据，适配碰撞检测中入射顶点的存储。
	 * @param {Float64Array} obj - 顶点数据数组
	 * @param {number} x - 点的x坐标
	 * @param {number} y - 点的y坐标
	 * @param {number} wx - 法向量x分量
	 * @param {number} wy - 法向量y分量
	 * @param {number} wz - 法向量z分量
	 * @param {number} [start=0] - 起始索引
	 */
	public static setIncidentVertex(obj: Float64Array, x: number, y: number, wx: number, wy: number, wz: number, start = 0): void {
		obj[start] = x;
		obj[start + 1] = y;
		obj[start + 2] = wx;
		obj[start + 3] = wy;
		obj[start + 4] = wz;
	}

	/**
	 * 设置3x3矩阵元素（行优先）。
	 * 核心逻辑：按行优先顺序，将9个矩阵元素批量赋值到数组指定位置，适配矩阵快速初始化。
	 * @param {Float64Array} obj - 矩阵数组
	 * @param {number} e00 - 第一行第一列
	 * @param {number} e01 - 第一行第二列
	 * @param {number} e02 - 第一行第三列
	 * @param {number} e10 - 第二行第一列
	 * @param {number} e11 - 第二行第二列
	 * @param {number} e12 - 第二行第三列
	 * @param {number} e20 - 第三行第一列
	 * @param {number} e21 - 第三行第二列
	 * @param {number} e22 - 第三行第三列
	 * @param {number} [start=0] - 起始索引
	 */
	public static setM3X3(obj: Float64Array, e00: number, e01: number, e02: number, e10: number, e11: number, e12: number, e20: number, e21: number, e22: number, start = 0): void {
		obj[start] = e00; obj[start + 1] = e01; obj[start + 2] = e02;
		obj[start + 3] = e10; obj[start + 4] = e11; obj[start + 5] = e12;
		obj[start + 6] = e20; obj[start + 7] = e21; obj[start + 8] = e22;
	}

	/**
	 * 设置变换数组的旋转部分（替换3x3矩阵）。
	 * 核心逻辑：将旋转矩阵直接赋值到变换数组的3-11索引位，替换原有旋转信息，平移部分保持不变。
	 * @param {Float64Array} tf - 变换数组（长度12）
	 * @param {Float64Array} rt - 3x3旋转矩阵（行优先）
	 */
	public static setTransformRotation(tf: Float64Array, rt: Float64Array): void {
		const t = tf, r = rt;
		t[3] = r[0]; t[4] = r[1]; t[5] = r[2];
		t[6] = r[3]; t[7] = r[4]; t[8] = r[5];
		t[9] = r[6]; t[10] = r[7]; t[11] = r[8];
	}

	/**
	 * 设置变换数组的朝向（从四元数转换为旋转矩阵）。
	 * 核心逻辑：先将四元数转换为旋转矩阵（复用全局临时数组tf0），再赋值到变换数组的旋转部分。
	 * @param {Float64Array} _tf - 变换数组（长度12）
	 * @param {Float64Array} _quat - 四元数数组，结构[x,y,z,w]
	 */
	public static setTransformOrientation(_tf: Float64Array, _quat: Float64Array): void {
		const tf = _tf, qt = _quat;
		const x = qt[0], y = qt[1], z = qt[2], w = qt[3];
		Method.quatToMat3(x, y, z, w, tf0);
		tf[3] = tf0[0];
		tf[4] = tf0[1];
		tf[5] = tf0[2];
		tf[6] = tf0[3];
		tf[7] = tf0[4];
		tf[8] = tf0[5];
		tf[9] = tf0[6];
		tf[10] = tf0[7];
		tf[11] = tf0[8];
	}

	/**
	 * 两个数组逐元素相减。
	 * 核心逻辑：遍历指定长度，将a[i] - b[i]的结果写入out[i]，支持不同起始索引的数组片段相减。
	 * @param {Float64Array} a - 被减数数组
	 * @param {Float64Array} b - 减数数组
	 * @param {Float64Array} out - 输出数组（结果写入此数组）
	 * @param {number} [startA=0] - 数组a起始索引
	 * @param {number} [startB=0] - 数组b起始索引
	 * @param {number} [startOut=0] - 输出数组起始索引
	 * @param {number} [length=3] - 计算长度，默认3（适配Vec3）
	 * @returns {Float64Array} 输出数组out
	 */
	public static subArray(a: Float64Array, b: Float64Array, out: Float64Array, startA = 0, startB = 0, startOut = 0, length = 3): Float64Array {
		const len = length || Math.min(a.length, b.length);
		for (let i = 0; i < len; i++) {
			out[i + startOut] = a[i + startA] - b[i + startB];
		}
		return out;
	}

	/**
	 * 设置雅可比矩阵（约束求解专用）。
	 * 核心逻辑：基于约束基向量和刚体位置向量，构建雅可比矩阵，适配物理引擎的约束求解（如接触约束、关节约束）。
	 * @param {number} basisX - 基向量x分量
	 * @param {number} basisY - 基向量y分量
	 * @param {number} basisZ - 基向量z分量
	 * @param {Float64Array} vec1Elements - 第一个向量数组
	 * @param {Float64Array} vec2Elements - 第二个向量数组
	 * @param {Float64Array} outElements - 输出雅可比矩阵数组（长度12）
	 */
	public static setJacobian(basisX: number, basisY: number, basisZ: number, vec1Elements: Float64Array, vec2Elements: Float64Array, outElements: Float64Array): void {
		const j = outElements, vec1 = vec1Elements, vec2 = vec2Elements;
		j[0] = basisX;
		j[1] = basisY;
		j[2] = basisZ;
		j[3] = basisX;
		j[4] = basisY;
		j[5] = basisZ;
		j[6] = vec1[1] * basisZ - vec1[2] * basisY;
		j[7] = vec1[2] * basisX - vec1[0] * basisZ;
		j[8] = vec1[0] * basisY - vec1[1] * basisX;
		j[9] = vec2[1] * basisZ - vec2[2] * basisY;
		j[10] = vec2[2] * basisX - vec2[0] * basisZ;
		j[11] = vec2[0] * basisY - vec2[1] * basisX;
	}

	/**
	 * 批量设置雅可比矩阵元素（约束求解专用）。
	 * 核心逻辑：按「线性项+角向项」的结构，批量赋值雅可比矩阵的12个元素，适配约束求解的矩阵初始化。
	 * @param {Float64Array} jab - 雅可比矩阵数组（长度12）
	 * @param {number} l1x - 第一个线性项x分量
	 * @param {number} l1y - 第一个线性项y分量
	 * @param {number} l1z - 第一个线性项z分量
	 * @param {number} l2x - 第二个线性项x分量
	 * @param {number} l2y - 第二个线性项y分量
	 * @param {number} l2z - 第二个线性项z分量
	 * @param {number} a1x - 第一个角向项x分量
	 * @param {number} a1y - 第一个角向项y分量
	 * @param {number} a1z - 第一个角向项z分量
	 * @param {number} a2x - 第二个角向项x分量
	 * @param {number} a2y - 第二个角向项y分量
	 * @param {number} a2z - 第二个角向项z分量
	 */
	public static setJacobianElements(jab: Float64Array, l1x: number, l1y: number, l1z: number, l2x: number, l2y: number, l2z: number, a1x: number, a1y: number, a1z: number, a2x: number, a2y: number, a2z: number): void {
		const j = jab;
		j[0] = l1x; j[1] = l1y; j[2] = l1z;
		j[3] = l2x; j[4] = l2y; j[5] = l2z;
		j[6] = a1x; j[7] = a1y; j[8] = a1z;
		j[9] = a2x; j[10] = a2y; j[11] = a2z;
	}

	/**
	 * 数组元素缩放（乘以指定因子）。
	 * 核心逻辑：遍历数组指定范围，将每个元素乘以缩放因子后写入输出数组，适配向量缩放、矩阵缩放场景。
	 * @param {Float64Array} a - 输入数组
	 * @param {number} s - 缩放因子
	 * @param {Float64Array} out - 输出数组（结果写入此数组）
	 * @param {number} [startA=0] - 输入数组起始索引
	 * @param {number} [startOut=0] - 输出数组起始索引
	 * @param {number} [length=3] - 计算长度，默认3（适配Vec3）
	 * @returns {Float64Array} 输出数组out
	 */
	public static scaleArray(a: Float64Array, s: number, out: Float64Array, startA = 0, startOut = 0, length = 3): Float64Array {
		const sa = startA;
		const so = startOut;
		const len = length || a.length;
		for (let i = 0; i < len; i++) {
			out[i + so] = a[i + sa] * s;
		}
		return out;
	}

	/**
	 * 从两个三维向量计算旋转（输出四元数和3x3旋转矩阵）。
	 * 算法原理：通过向量点积计算夹角，叉积计算旋转轴，处理共线特殊情况
	 * @param {number} axis1X 第一个轴x分量 - 源向量X轴分量
	 * @param {number} axis1Y 第一个轴y分量 - 源向量Y轴分量
	 * @param {number} axis1Z 第一个轴z分量 - 源向量Z轴分量
	 * @param {number} axis2X 第二个轴x分量 - 目标向量X轴分量
	 * @param {number} axis2Y 第二个轴y分量 - 目标向量Y轴分量
	 * @param {number} axis2Z 第二个轴z分量 - 目标向量Z轴分量
	 * @param {Float64Array} outQuat 输出四元数数组 [x,y,z,w] - 存储计算出的旋转四元数，需长度为4
	 * @param {Float64Array} outMat3 输出3x3旋转矩阵（行优先） - 存储对应的旋转矩阵，需长度为9
	 * @throws {RangeError} 当输出数组长度不足时抛出
	 */
	public static setRotFromTwoVec3(axis1X: number, axis1Y: number, axis1Z: number, axis2X: number, axis2Y: number, axis2Z: number, outQuat: Float64Array, outMat3: Float64Array): void {
		if (outQuat.length < 4 || outMat3.length < 9) {
			throw new RangeError("输出数组长度不足：outQuat需至少4个元素，outMat3需至少9个元素");
		}

		const ot = outMat3;
		const oq = outQuat;
		// 计算向量点积（余弦值）
		let d = axis1X * axis2X + axis1Y * axis2Y + axis1Z * axis2Z;

		// 处理向量反向共线的特殊情况（夹角180度）
		if (d < -0.999999999) {
			Method.vecToQuat(axis1X, axis1Y, axis1Z, tv0);
		} else {
			// 计算叉积得到旋转轴
			Method.crossVectors(axis1X, axis1Y, axis1Z, axis2X, axis2Y, axis2Z, tv0);
			// 计算四元数w分量（角度相关）
			const w = Math.sqrt((1 + d) * 0.5);
			d = 0.5 / w;
			// 缩放旋转轴得到四元数xyz分量
			Method.scaleArray(tv0, d, tv0, 0, 0, 3);
			tv0[3] = w;
		}
		// 将计算结果写入输出四元数
		Method.setElements(oq, 0, tv0[0], tv0[1], tv0[2], tv0[3]);
		// 四元数转换为旋转矩阵
		Method.quatToMat3(tv0[0], tv0[1], tv0[2], tv0[3], ot);
	}

	/**
	 * 创建AABB轴对齐包围盒（从两个对角点坐标）。
	 * AABB包围盒是轴对齐的，通过比较两个点的坐标得到最小/最大值
	 * @param {number} x1 第一个点x坐标 - 包围盒对角点1的X坐标
	 * @param {number} y1 第一个点y坐标 - 包围盒对角点1的Y坐标
	 * @param {number} z1 第一个点z坐标 - 包围盒对角点1的Z坐标
	 * @param {number} x2 第二个点x坐标 - 包围盒对角点2的X坐标
	 * @param {number} y2 第二个点y坐标 - 包围盒对角点2的Y坐标
	 * @param {number} z2 第二个点z坐标 - 包围盒对角点2的Z坐标
	 * @param {Float64Array} out 输出AABB数组 [minX,minY,minZ,maxX,maxY,maxZ] - 存储包围盒的最小/最大坐标，需长度为6
	 * @throws {RangeError} 当输出数组长度小于6时抛出
	 */
	public static setBox(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, out: Float64Array): void {
		if (out.length < 6) {
			throw new RangeError("输出AABB数组长度需至少6个元素");
		}

		let ot = out;
		// 计算各轴最小值
		ot[0] = x1 < x2 ? x1 : x2;
		ot[1] = y1 < y2 ? y1 : y2;
		ot[2] = z1 < z2 ? z1 : z2;
		// 计算各轴最大值
		ot[3] = x1 < x2 ? x2 : x1;
		ot[4] = y1 < y2 ? y2 : y1;
		ot[5] = z1 < z2 ? z2 : z1;
	}

	/**
	 * 对三维向量执行空间变换（从局部空间转换到世界空间）。
	 * 变换公式：
	 *              仅旋转: v' = R * v
	 *              仅平移: v' = v + T
	 *              两者都有: v' = R * v + T
	 * @param {Float64Array} _tf 变换数组（长度12） - 变换矩阵 [tx,ty,tz, r00,r01,r02, r10,r11,r12, r20,r21,r22]
	 *                          前3个元素是平移分量，后9个是3x3旋转矩阵（行优先）
	 * @param {Float64Array} vec3 输入向量数组 [x,y,z] - 待变换的局部空间向量
	 * @param {TRANSFORM_OPTION} [op=TRANSFORM_OPTION.TRANSLATE_ROTATE] 变换选项 - 控制应用的变换类型
	 * @param {Float64Array} out 输出向量数组 - 存储变换后的世界空间向量，需长度至少3
	 * @param {number} [vecStart=0] 输入向量起始索引 - 输入向量在数组中的起始位置
	 * @param {number} [outStart=0] 输出向量起始索引 - 输出向量在数组中的起始位置
	 * @throws {TypeError} 当变换数组/向量数组不是Float64Array类型时抛出
	 * @throws {RangeError} 当变换数组长度不足12或向量数组长度不足3时抛出
	 */
	public static transformVec3(_tf: Float64Array, vec3: Float64Array, op: TRANSFORM_OPTION = TRANSFORM_OPTION.TRANSLATE_ROTATE, out: Float64Array, vecStart = 0, outStart = 0): void {
		// 参数校验
		if (!(_tf instanceof Float64Array) || !(vec3 instanceof Float64Array) || !(out instanceof Float64Array)) {
			throw new TypeError("变换数组和向量数组必须是Float64Array类型");
		}
		if (_tf.length < 12 || vec3.length < vecStart + 3 || out.length < outStart + 3) {
			throw new RangeError("数组长度不足：_tf需至少12个元素，vec3/out需至少包含3个连续元素");
		}

		const v = vec3, tf = _tf;
		let vX = v[vecStart], vY = v[vecStart + 1], vZ = v[vecStart + 2];

		// 应用旋转变换（矩阵乘法）
		if (op !== TRANSFORM_OPTION.TRANSLATE) {
			vX = tf[3] * v[vecStart] + tf[4] * v[vecStart + 1] + tf[5] * v[vecStart + 2];
			vY = tf[6] * v[vecStart] + tf[7] * v[vecStart + 1] + tf[8] * v[vecStart + 2];
			vZ = tf[9] * v[vecStart] + tf[10] * v[vecStart + 1] + tf[11] * v[vecStart + 2];
		}

		// 应用平移变换（向量加法）
		if (op !== TRANSFORM_OPTION.ROTATE) {
			vX += tf[0];
			vY += tf[1];
			vZ += tf[2];
		}

		// 写入结果
		const es = out;
		es[outStart] = vX;
		es[outStart + 1] = vY;
		es[outStart + 2] = vZ;
	}

	/**
	 * 对3x3矩阵执行旋转变换操作（矩阵乘法）。
	 * 算法：使用变换数组中的旋转部分（后9个元素）与输入矩阵进行矩阵乘法
	 * @param {Float64Array} tf 变换数组（长度12） - 变换矩阵 [tx,ty,tz, r00,r01,r02, r10,r11,r12, r20,r21,r22]
	 * @param {Float64Array} lb 输入3x3矩阵（行优先） - 待变换的源矩阵，长度需为9
	 * @param {Float64Array} out 输出变换后的3x3矩阵（行优先） - 存储变换结果的矩阵，长度需为9
	 * @throws {RangeError} 当输入/输出矩阵长度不足9或变换数组长度不足12时抛出
	 */
	public static transformM3(tf: Float64Array, lb: Float64Array, out: Float64Array): void {
		if (tf.length < 12 || lb.length < 9 || out.length < 9) {
			throw new RangeError("数组长度不足：tf需12个元素，lb/out需9个元素");
		}

		const tf1 = tf;
		const bs1 = lb;
		const b1 = out;

		// 矩阵乘法：tf(旋转部分) * lb
		b1[0] = tf1[3] * bs1[0] + tf1[4] * bs1[1] + tf1[5] * bs1[2];
		b1[1] = tf1[6] * bs1[0] + tf1[7] * bs1[1] + tf1[8] * bs1[2];
		b1[2] = tf1[9] * bs1[0] + tf1[10] * bs1[1] + tf1[11] * bs1[2];

		b1[3] = tf1[3] * bs1[3] + tf1[4] * bs1[4] + tf1[5] * bs1[5];
		b1[4] = tf1[6] * bs1[3] + tf1[7] * bs1[4] + tf1[8] * bs1[5];
		b1[5] = tf1[9] * bs1[3] + tf1[10] * bs1[4] + tf1[11] * bs1[5];

		b1[6] = tf1[3] * bs1[6] + tf1[4] * bs1[7] + tf1[5] * bs1[8];
		b1[7] = tf1[6] * bs1[6] + tf1[7] * bs1[7] + tf1[8] * bs1[8];
		b1[8] = tf1[9] * bs1[6] + tf1[10] * bs1[7] + tf1[11] * bs1[8];
	}

	/**
	 * 3x3矩阵转置（行优先转列优先）。
	 * 矩阵转置：将矩阵的行和列互换，M[i][j] = M[j][i]
	 * @param {Float64Array} src 输入3x3矩阵（行优先） - 源矩阵，长度需为9
	 * @param {Float64Array} dst 输出转置后的3x3矩阵（行优先） - 存储转置结果的矩阵，长度需为9
	 * @returns {Float64Array} 转置后的矩阵（即dst） - 便于链式调用
	 * @throws {RangeError} 当输入/输出矩阵长度不足9时抛出
	 */
	public static transposeM33(src: Float64Array, dst: Float64Array): Float64Array {
		if (src.length < 9 || dst.length < 9) {
			throw new RangeError("输入和输出矩阵长度需至少9个元素");
		}

		// 矩阵转置核心逻辑
		dst[0] = src[0];  // (0,0)
		dst[1] = src[3];  // (1,0)
		dst[2] = src[6];  // (2,0)
		dst[3] = src[1];  // (0,1)
		dst[4] = src[4];  // (1,1)
		dst[5] = src[7];  // (2,1)
		dst[6] = src[2];  // (0,2)
		dst[7] = src[5];  // (1,2)
		dst[8] = src[8];  // (2,2)

		return dst;
	}

	/**
	 * 将三维向量转换为四元数（用于表示旋转轴，无旋转角度）。
	 * 算法原理：找到与输入向量垂直的向量作为旋转轴，用于处理180度旋转的特殊情况
	 *              输出四元数的w分量为0，表示旋转角度为180度
	 * @param {number} x 向量x分量 - 输入向量的X轴分量
	 * @param {number} y 向量y分量 - 输入向量的Y轴分量
	 * @param {number} z 向量z分量 - 输入向量的Z轴分量
	 * @param {Float64Array} out 输出四元数数组 [x,y,z,w] - 存储转换结果的四元数，长度需为4
	 * @throws {RangeError} 当输出数组长度不足4时抛出
	 */
	public static vecToQuat(x: number, y: number, z: number, out: Float64Array): void {
		if (out.length < 4) {
			throw new RangeError("输出四元数数组长度需至少4个元素");
		}

		const o = out;
		let vX: number, vY: number, vZ: number;
		const x2 = x * x, y2 = y * y, z2 = z * z;
		let d: number;

		// 找到最小分量轴，构造垂直向量
		if (x2 < y2) {
			if (x2 < z2) {
				// X分量最小，绕X轴旋转
				d = 1 / Math.sqrt(y2 + z2);
				vX = 0;
				vY = z * d;
				vZ = -y * d;
			} else {
				// Z分量最小，绕Z轴旋转
				d = 1 / Math.sqrt(x2 + y2);
				vX = y * d;
				vY = -x * d;
				vZ = 0;
			}
		} else if (y2 < z2) {
			// Y分量最小，绕Y轴旋转
			d = 1 / Math.sqrt(z2 + x2);
			vX = -z * d;
			vY = 0;
			vZ = x * d;
		} else {
			// Z分量最小（备用分支），绕Z轴旋转
			d = 1 / Math.sqrt(x2 + y2);
			vX = y * d;
			vY = -x * d;
			vZ = 0;
		}

		// 写入四元数（w=0表示180度旋转）
		o[0] = vX;
		o[1] = vY;
		o[2] = vZ;
		o[3] = 0;
	}

}

export {
	DEFAULT_33,
	Method,
	TRANSFORM_OPTION,
};