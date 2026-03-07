/**
 * 入射顶点（IncidentVertex）类。
 * 用于表示碰撞检测中接触点的入射顶点数据，存储顶点的二维坐标和三维法向量信息
 */
export default class IncidentVertex {
    /**
     * 顶点数据存储数组，采用Float64Array保证高精度计算。
     * 数组结构（索引对应含义）：
     * - 索引 0: x - 顶点的二维X坐标
     * - 索引 1: y - 顶点的二维Y坐标
     * - 索引 2: wx - 法向量/权重的X分量（三维）
     * - 索引 3: wy - 法向量/权重的Y分量（三维）
     * - 索引 4: wz - 法向量/权重的Z分量（三维）
     */
    public elements = new Float64Array(5);
}

export { IncidentVertex };