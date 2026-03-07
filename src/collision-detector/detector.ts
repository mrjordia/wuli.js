import Transform from "../common/transform";
import Geometry from "../shape/geometry";
import DetectorResult from "./detector-result";
import CachedDetectorData from './cached-detector-data';

/**
 * 碰撞检测器抽象类。
 * 物理引擎几何碰撞检测的核心抽象类，定义两个几何形状碰撞检测的通用逻辑；
 * 需由业务层实现具体的detectImpl方法，支持处理几何形状的碰撞点、法线等核心数据，
 * 内置swapped标记支持交换检测对象顺序，适配不同场景的碰撞检测需求。
 * @template T1 - 第一个几何形状类型（默认Geometry）
 * @template T2 - 第二个几何形状类型（默认Geometry）
 */
export default abstract class Detector<T1 = Geometry, T2 = Geometry> {

    /**
     * 是否交换检测对象顺序标记。
     * 标记为true时：
     * 1. 交换geom1/geom2、transform1/transform2的检测顺序；
     * 2. 法线向量取反；
     * 3. 碰撞点的position1/position2坐标交换；
     * 用于适配“反向检测”场景（如B-A碰撞等效于A-B碰撞）。
     */
    public swapped: boolean;

    /**
     * 碰撞检测器构造函数
     * @param {boolean} swapped - 是否交换检测对象顺序
     */
    constructor(swapped: boolean) {
        this.swapped = swapped;
    }

    /**
     * 设置碰撞检测结果的法线向量。
     * 自动根据swapped标记决定是否对法线向量取反，保证法线方向符合检测顺序。
     * @param {DetectorResult} result - 碰撞检测结果实例（存储法线、碰撞点等数据）
     * @param {number} nX - 法线向量X分量
     * @param {number} nY - 法线向量Y分量
     * @param {number} nZ - 法线向量Z分量
     * @returns {void}
     */
    public setNormal(result: DetectorResult, nX: number, nY: number, nZ: number): void {
        const v = result.normal.elements;
        v[0] = nX; v[1] = nY; v[2] = nZ;
        if (this.swapped) {
            v[0] = -v[0]; v[1] = -v[1]; v[2] = -v[2];
        }
    }

    /**
     * 向检测结果添加碰撞点信息。
     * 自动根据swapped标记交换position1/position2坐标，保证坐标与检测顺序一致。
     * @param {DetectorResult} result - 碰撞检测结果实例
     * @param {number} pos1X - 第一个几何对象碰撞点X坐标
     * @param {number} pos1Y - 第一个几何对象碰撞点Y坐标
     * @param {number} pos1Z - 第一个几何对象碰撞点Z坐标
     * @param {number} pos2X - 第二个几何对象碰撞点X坐标
     * @param {number} pos2Y - 第二个几何对象碰撞点Y坐标
     * @param {number} pos2Z - 第二个几何对象碰撞点Z坐标
     * @param {number} depth - 碰撞点深度（穿透深度）
     * @param {number} id - 碰撞点唯一标识ID
     * @returns {void}
     */
    public addPoint(
        result: DetectorResult,
        pos1X: number, pos1Y: number, pos1Z: number,
        pos2X: number, pos2Y: number, pos2Z: number,
        depth: number, id: number
    ): void {
        const p = result.points[result.numPoints++];
        p.depth = depth;
        p.id = id;
        let v = null;
        if (this.swapped) {
            v = p.position1.elements;
            v[0] = pos2X; v[1] = pos2Y; v[2] = pos2Z;
            v = p.position2.elements;
            v[0] = pos1X; v[1] = pos1Y; v[2] = pos1Z;
        } else {
            v = p.position1.elements;
            v[0] = pos1X; v[1] = pos1Y; v[2] = pos1Z;
            v = p.position2.elements;
            v[0] = pos2X; v[1] = pos2Y; v[2] = pos2Z;
        }
    }

    /**
     * 执行碰撞检测的入口方法。
     * 执行流程：
     * 1. 清空检测结果的碰撞点、法线等数据；
     * 2. 根据swapped标记决定检测顺序，调用具体检测实现；
     * 核心作用：封装通用的检测前置/后置逻辑，子类仅需实现detectImpl即可。
     * @param {DetectorResult} result - 碰撞检测结果实例（输出参数）
     * @param {T1} geom1 - 第一个几何对象
     * @param {T2} geom2 - 第二个几何对象
     * @param {Transform} transform1 - 第一个几何对象的变换矩阵（位置/旋转/缩放）
     * @param {Transform} transform2 - 第二个几何对象的变换矩阵（位置/旋转/缩放）
     * @param {CachedDetectorData} cachedData - 检测器缓存数据（优化重复检测性能）
     * @returns {void}
     */
    public detect(
        result: DetectorResult,
        geom1: T1,
        geom2: T2,
        transform1: Transform,
        transform2: Transform,
        cachedData: CachedDetectorData
    ): void {
        result.numPoints = 0;
        let _g = 0, v = null, _g1 = result.points;
        while (_g < _g1.length) {
            let p = _g1[_g];
            ++_g;
            v = p.position1.elements;
            v[0] = v[1] = v[2] = 0;
            v = p.position2.elements;
            v[0] = v[1] = v[2] = 0;
            p.depth = 0;
            p.id = 0;
        }
        v = result.normal.elements;
        v[0] = v[1] = v[2] = 0;

        if (this.swapped) {
            this.detectImpl(result, geom2, geom1, transform2, transform1, cachedData);
        } else {
            this.detectImpl(result, geom1, geom2, transform1, transform2, cachedData);
        }
    }

    /**
     * 碰撞检测具体实现抽象方法（必须实现）。
     * 子类需实现具体的几何碰撞检测逻辑：
     * 1. 计算碰撞点、法线、穿透深度等核心数据；
     * 2. 通过setNormal/addPoint方法写入result；
     * 注意：geom1/geom2类型可能互换，需兼容T1/T2类型。
     * @param {DetectorResult} result - 碰撞检测结果实例（输出参数）
     * @param {T1 | T2} geom1 - 第一个几何对象（检测顺序由swapped决定）
     * @param {T2 | T1} geom2 - 第二个几何对象（检测顺序由swapped决定）
     * @param {Transform} tf1 - 第一个几何对象的变换矩阵
     * @param {Transform} tf2 - 第二个几何对象的变换矩阵
     * @param {CachedDetectorData} cachedData - 检测器缓存数据
     * @returns {void}
     */
    protected abstract detectImpl(
        result: DetectorResult,
        geom1: T1 | T2,
        geom2: T2 | T1,
        tf1: Transform,
        tf2: Transform,
        cachedData: CachedDetectorData
    ): void;
}

export { Detector };