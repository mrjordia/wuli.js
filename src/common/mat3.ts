import { CONSTANT } from "../constant";

/**
 * 3x3 双精度浮点矩阵类。
 * 物理引擎核心数学工具类，专为3维空间变换设计，
 * 主要用于旋转表示、缩放变换、惯性张量计算等物理场景，采用双精度浮点保证计算精度，
 * 内置性能优化机制（实例复用、创建计数），符合物理引擎对精度和性能的双重要求。
 * 
 * 矩阵元素采用**行主序**的一维 Float64Array 存储，索引对应关系：
 * [
 *   0: e00, 1: e01, 2: e02,  // 第一行（对应X轴方向）
 *   3: e10, 4: e11, 5: e12,  // 第二行（对应Y轴方向）
 *   6: e20, 7: e21, 8: e22   // 第三行（对应Z轴方向）
 * ]
 */
export default class Mat3 {
    /** 
     * 矩阵元素存储数组（行主序）。
     * 默认初始化为单位矩阵（无旋转/缩放）。
     */
    public elements = new Float64Array(9);

    /**
     * 构造函数。
     * 初始化3x3矩阵，默认创建单位矩阵（物理引擎中最常用的初始状态）
     * @param {number} [e00=1] 第一行第一列元素（X轴X分量）
     * @param {number} [e01=0] 第一行第二列元素（X轴Y分量）
     * @param {number} [e02=0] 第一行第三列元素（X轴Z分量）
     * @param {number} [e10=0] 第二行第一列元素（Y轴X分量）
     * @param {number} [e11=1] 第二行第二列元素（Y轴Y分量）
     * @param {number} [e12=0] 第二行第三列元素（Y轴Z分量）
     * @param {number} [e20=0] 第三行第一列元素（Z轴X分量）
     * @param {number} [e21=0] 第三行第二列元素（Z轴Y分量）
     * @param {number} [e22=1] 第三行第三列元素（Z轴Z分量）
     */
    constructor(
        e00 = 1, e01 = 0, e02 = 0,
        e10 = 0, e11 = 1, e12 = 0,
        e20 = 0, e21 = 0, e22 = 1
    ) {
        const es = this.elements;
        es[0] = e00;
        es[1] = e01;
        es[2] = e02;
        es[3] = e10;
        es[4] = e11;
        es[5] = e12;
        es[6] = e20;
        es[7] = e21;
        es[8] = e22;
        // 统计Mat3实例创建数量（用于性能分析/内存监控）。
        // 可通过CONSTANT.MAT3_NUM_CREATIONS查看总创建数，定位内存泄漏/性能瓶颈
        CONSTANT.MAT3_NUM_CREATIONS++;
    }

    /**
     * 重新初始化矩阵元素。
     * 
     * 物理引擎高性能优化方法：
     * 1. 复用已有Mat3实例，避免频繁new创建/GC回收，降低内存开销；
     * 2. 链式调用设计（return this），简化代码书写；
     * 3. 直接修改内部elements数组，无额外内存分配。
     * @param {number} e00 第一行第一列元素
     * @param {number} e01 第一行第二列元素
     * @param {number} e02 第一行第三列元素
     * @param {number} e10 第二行第一列元素
     * @param {number} e11 第二行第二列元素
     * @param {number} e12 第二行第三列元素
     * @param {number} e20 第三行第一列元素
     * @param {number} e21 第三行第二列元素
     * @param {number} e22 第三行第三列元素
     * @returns {Mat3} 当前矩阵实例（支持链式调用）
     */
    public init(
        e00: number, e01: number, e02: number,
        e10: number, e11: number, e12: number,
        e20: number, e21: number, e22: number
    ): Mat3 {
        const es = this.elements;
        es[0] = e00; es[1] = e01; es[2] = e02;
        es[3] = e10; es[4] = e11; es[5] = e12;
        es[6] = e20; es[7] = e21; es[8] = e22;
        return this;
    }
}

export { Mat3 };