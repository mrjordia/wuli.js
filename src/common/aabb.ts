import Vec3 from "./vec3";
import Method from "./method";

/**
 * 轴对齐包围盒类。
 * 用于物理引擎的碰撞检测（宽相检测、形状包围盒计算），表示3D空间中与坐标轴对齐的最小包围盒
 * 内部采用 Float64Array 存储，元素索引对应关系：
 * [
 *   0: minX, 1: minY, 2: minZ,  // 包围盒最小点坐标
 *   3: maxX, 4: maxY, 5: maxZ   // 包围盒最大点坐标
 * ]
 */
export default class Aabb {
    /**
     * AABB分量存储数组（双精度浮点）。
     * 索引0-2为最小点(min)，3-5为最大点(max)，直接操作可提升碰撞检测性能
     */
    public elements = new Float64Array(6);

    /**
     * 构造函数。
     * 初始化AABB包围盒，未传参时默认创建空包围盒（所有分量为0）
     * @param {number} [ix=0] 最小点X坐标（minX）
     * @param {number} [iy=0] 最小点Y坐标（minY）
     * @param {number} [iz=0] 最小点Z坐标（minZ）
     * @param {number} [ax=0] 最大点X坐标（maxX）
     * @param {number} [ay=0] 最大点Y坐标（maxY）
     * @param {number} [az=0] 最大点Z坐标（maxZ）
     */
    constructor(ix?: number, iy?: number, iz?: number, ax?: number, ay?: number, az?: number) {
        this.elements[0] = ix || 0;
        this.elements[1] = iy || 0;
        this.elements[2] = iz || 0;
        this.elements[3] = ax || 0;
        this.elements[4] = ay || 0;
        this.elements[5] = az || 0;
    }

    /**
     * 通过最小/最大点向量初始化AABB。
     * 便捷的初始化方式，适配引擎中Vec3向量的使用习惯
     * @param {Vec3} min 最小点向量（x=minX, y=minY, z=minZ）
     * @param {Vec3} max 最大点向量（x=maxX, y=maxY, z=maxZ）
     * @returns {Aabb} 当前AABB实例（支持链式调用）
     */
    public init(min: Vec3, max: Vec3): Aabb {
        const _this = this.elements, i = min.elements, a = max.elements;
        _this[0] = i[0]; _this[1] = i[1]; _this[2] = i[2];
        _this[3] = a[0]; _this[4] = a[1]; _this[5] = a[2];
        return this;
    }

    /**
     * 从另一个AABB复制数据。
     * 用于复用已有AABB实例，避免频繁创建新对象，提升宽相检测性能
     * @param {Aabb} _aabb 源AABB对象
     * @returns {Aabb} 当前AABB实例（支持链式调用）
     */
    public copyFrom(_aabb: Aabb): Aabb {
        const _this = this.elements, aabb = _aabb.elements;
        Method.copyElements(aabb, _this);
        return this;
    }

    /**
     * 克隆当前AABB的分量数组。
     * 返回新的Float64Array（深拷贝），而非引用，避免数据污染
     * @returns {Float64Array} 新的分量数组（包含当前AABB的min/max值）
     */
    public clone(): Float64Array {
        const _aabb = new Aabb();
        const _this = this.elements, aabb = _aabb.elements;
        Method.copyElements(_this, aabb);
        return aabb;
    }
}

export { Aabb };