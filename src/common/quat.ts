import { CONSTANT } from "../constant";

/**
 * 双精度浮点四元数类（x, y, z, w）。
 * 用于物理引擎中高效表示3维空间旋转（避免欧拉角万向锁问题）
 * 内部采用 Float64Array 存储以保证物理计算精度，元素索引对应标准四元数格式：
 * [0] -> x 分量（虚部）
 * [1] -> y 分量（虚部）
 * [2] -> z 分量（虚部）
 * [3] -> w 分量（实部）
 * 单位四元数（0, 0, 0, 1）表示无旋转状态
 */
export default class Quat {
	/**
	 * 四元数分量存储数组（双精度浮点）。
	 * 直接操作此数组可提升计算性能，也可通过x/y/z/w访问器便捷操作
	 */
	public elements = new Float64Array(4);

	/**
	 * 构造函数。
	 * 初始化四元数，默认创建单位四元数 (0, 0, 0, 1)（无旋转）
	 * @param {number} [x=0] 虚部x分量
	 * @param {number} [y=0] 虚部y分量
	 * @param {number} [z=0] 虚部z分量
	 * @param {number} [w=1] 实部w分量
	 */
	constructor(x = 0, y = 0, z = 0, w = 1) {
		this.elements[0] = x;
		this.elements[1] = y;
		this.elements[2] = z;
		this.elements[3] = w;
		// 统计Quat实例创建数量（用于性能分析/内存监控）
		CONSTANT.QUAT_NUM_CREATIONS++;
	}

	/**
	 * x分量访问器。
	 * 便捷操作elements[0]（虚部x），兼顾易用性与性能
	 * @returns {number} 当前x分量值
	 */
	public get x(): number {
		return this.elements[0];
	}

	/**
	 * x分量设置器。
	 * @param {number} num 要设置的x分量值
	 */
	public set x(num: number) {
		this.elements[0] = num;
	}

	/**
	 * y分量访问器。
	 * 便捷操作elements[1]（虚部y），兼顾易用性与性能
	 * @returns {number} 当前y分量值
	 */
	public get y(): number {
		return this.elements[1];
	}

	/**
	 * y分量设置器。
	 * @param {number} num 要设置的y分量值
	 */
	public set y(num: number) {
		this.elements[1] = num;
	}

	/**
	 * z分量访问器。
	 * 便捷操作elements[2]（虚部z），兼顾易用性与性能
	 * @returns {number} 当前z分量值
	 */
	public get z(): number {
		return this.elements[2];
	}

	/**
	 * z分量设置器。
	 * @param {number} num 要设置的z分量值
	 */
	public set z(num: number) {
		this.elements[2] = num;
	}

	/**
	 * w分量访问器。
	 * 便捷操作elements[3]（实部w），兼顾易用性与性能
	 * @returns {number} 当前w分量值
	 */
	public get w(): number {
		return this.elements[3];
	}

	/**
	 * w分量设置器。
	 * @param {number} num 要设置的w分量值
	 */
	public set w(num: number) {
		this.elements[3] = num;
	}

	/**
	 * 重新初始化四元数分量。
	 * 用于复用已有Quat实例，避免频繁创建新对象，提升物理模拟性能
	 * @param {number} x 虚部x分量
	 * @param {number} y 虚部y分量
	 * @param {number} z 虚部z分量
	 * @param {number} w 实部w分量
	 * @returns {Quat} 当前四元数实例（支持链式调用）
	 */
	public init(x: number, y: number, z: number, w: number): Quat {
		const es = this.elements;
		es[0] = x;
		es[1] = y;
		es[2] = z;
		es[3] = w;
		return this;
	}
}

export { Quat };