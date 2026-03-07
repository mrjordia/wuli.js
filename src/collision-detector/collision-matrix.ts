import { GEOMETRY_TYPE } from '../constant';
import SphereSphereDetector from "./sphere-sphere-detector";
import GjkEpaDetector from "./gjk-epa-detector/gjk-epa-detector";
import BoxBoxDetector from "./box-box-detector/box-box-detector";
import SphereBoxDetector from "./sphere-box-detector";
import CapsuleCapsuleDetector from "./capsule-capsule-detector";
import SphereCapsuleDetector from "./sphere-capsule-detector";
import Detector from './detector';
import ConvexTerrainDetector from './convex-terrain-detector';

/**
 * 碰撞检测器矩阵类。
 * 物理引擎的碰撞检测器映射矩阵，核心作用是根据两个几何形状的类型（GEOMETRY_TYPE），
 * 快速匹配对应的专用碰撞检测器（Detector），避免运行时动态判断类型，提升检测效率；
 * 矩阵维度为 8x8，覆盖所有支持的几何类型组合，部分组合复用通用GJK-EPA检测器。
 */
export default class CollisionMatrix {
    /**
     * 碰撞检测器二维矩阵。
     * 行/列索引对应几何类型（GEOMETRY_TYPE）转换后的数值，
     * 每个元素存储对应几何类型组合的碰撞检测器实例，初始化时填充所有支持的检测器组合。
     */
    public detectors: Array<Array<Detector>> = [];

    /**
     * 碰撞矩阵构造函数。
     * 初始化时自动调用私有方法_init()，完成检测器矩阵的初始化，
     * 预先填充所有几何类型组合对应的检测器实例，确保后续可直接获取使用。
     */
    constructor() {
        this._init();
    }

    /**
     * 获取指定几何类型组合的碰撞检测器。
     * 核心逻辑：
     * 1. 将GEOMETRY_TYPE枚举值转换为矩阵索引（减去NULL类型偏移并修正）；
     * 2. 从二维矩阵中获取对应位置的检测器实例；
     * 注意：索引转换确保枚举值与矩阵索引一一对应，避免越界。
     * @param {GEOMETRY_TYPE} geomType1 - 第一个几何形状的类型（如球体、盒子、胶囊体等）
     * @param {GEOMETRY_TYPE} geomType2 - 第二个几何形状的类型
     * @returns {Detector} 匹配的碰撞检测器实例
     */
    public getDetector(geomType1: GEOMETRY_TYPE, geomType2: GEOMETRY_TYPE): Detector {
        // 转换几何类型枚举值为矩阵索引（修正NULL类型偏移）
        let t1 = geomType1 - GEOMETRY_TYPE.NULL - 1;
        let t2 = geomType2 - GEOMETRY_TYPE.NULL - 1;
        return this.detectors[t1][t2];
    }

    /**
     * 初始化碰撞检测器矩阵（私有方法）。
     * 核心初始化逻辑：
     * 1. 创建8x8的二维矩阵，覆盖所有支持的几何类型组合；
     * 2. 为专用几何类型组合（如球-球、盒-盒）分配专用检测器，保证检测效率；
     * 3. 为无专用检测器的组合分配通用GJK-EPA检测器，保证兼容性；
     * 4. 处理几何类型顺序互换的场景（如球-盒 vs 盒-球），通过swapped参数适配；
     * 几何类型索引映射（示例）：
     * - 0: 球体(Sphere)
     * - 1: 盒子(Box)
     * - 2: 通用凸形1
     * - 3: 通用凸形2
     * - 4: 胶囊体(Capsule)
     * - 5: 通用凸形3
     * - 6: 地形(Terrain)
     * @returns {void}
     */
    private _init(): void {
        // 初始化8行的检测器矩阵
        this.detectors = new Array(8);
        const detectors = this.detectors;
        detectors[0] = new Array(8);
        detectors[1] = new Array(8);
        detectors[2] = new Array(8);
        detectors[3] = new Array(8);
        detectors[4] = new Array(8);
        detectors[5] = new Array(8);
        detectors[6] = new Array(8);

        // 创建通用GJK-EPA检测器实例（复用减少内存占用）
        const gjkEpaDetector = new GjkEpaDetector();

        // 填充球体(0)相关检测器组合
        detectors[0][0] = new SphereSphereDetector();       // 球-球
        detectors[0][1] = new SphereBoxDetector(false);     // 球-盒（未交换）
        detectors[0][2] = gjkEpaDetector;                   // 球-通用凸形1
        detectors[0][3] = gjkEpaDetector;                   // 球-通用凸形2
        detectors[0][4] = new SphereCapsuleDetector(false); // 球-胶囊体（未交换）
        detectors[0][5] = gjkEpaDetector;                   // 球-通用凸形3
        detectors[0][6] = new ConvexTerrainDetector(false); // 球-地形（未交换）

        // 填充盒子(1)相关检测器组合
        detectors[1][0] = new SphereBoxDetector(true);      // 盒-球（已交换）
        detectors[1][1] = new BoxBoxDetector();             // 盒-盒
        detectors[1][2] = gjkEpaDetector;                   // 盒-通用凸形1
        detectors[1][3] = gjkEpaDetector;                   // 盒-通用凸形2
        detectors[1][4] = gjkEpaDetector;                   // 盒-胶囊体
        detectors[1][5] = gjkEpaDetector;                   // 盒-通用凸形3
        detectors[1][6] = new ConvexTerrainDetector(false); // 盒-地形（未交换）

        // 填充通用凸形1(2)相关检测器组合
        detectors[2][0] = gjkEpaDetector;                   // 通用凸形1-球
        detectors[2][1] = gjkEpaDetector;                   // 通用凸形1-盒
        detectors[2][2] = gjkEpaDetector;                   // 通用凸形1-通用凸形1
        detectors[2][3] = gjkEpaDetector;                   // 通用凸形1-通用凸形2
        detectors[2][4] = gjkEpaDetector;                   // 通用凸形1-胶囊体
        detectors[2][5] = gjkEpaDetector;                   // 通用凸形1-通用凸形3
        detectors[2][6] = new ConvexTerrainDetector(false); // 通用凸形1-地形（未交换）

        // 填充通用凸形2(3)相关检测器组合
        detectors[3][0] = gjkEpaDetector;                   // 通用凸形2-球
        detectors[3][1] = gjkEpaDetector;                   // 通用凸形2-盒
        detectors[3][2] = gjkEpaDetector;                   // 通用凸形2-通用凸形1
        detectors[3][3] = gjkEpaDetector;                   // 通用凸形2-通用凸形2
        detectors[3][4] = gjkEpaDetector;                   // 通用凸形2-胶囊体
        detectors[3][5] = gjkEpaDetector;                   // 通用凸形2-通用凸形3
        detectors[3][6] = new ConvexTerrainDetector(false); // 通用凸形2-地形（未交换）

        // 填充胶囊体(4)相关检测器组合
        detectors[4][0] = new SphereCapsuleDetector(true);  // 胶囊体-球（已交换）
        detectors[4][1] = gjkEpaDetector;                   // 胶囊体-盒
        detectors[4][2] = gjkEpaDetector;                   // 胶囊体-通用凸形1
        detectors[4][3] = gjkEpaDetector;                   // 胶囊体-通用凸形2
        detectors[4][4] = new CapsuleCapsuleDetector();     // 胶囊体-胶囊体
        detectors[4][5] = gjkEpaDetector;                   // 胶囊体-通用凸形3
        detectors[4][6] = new ConvexTerrainDetector(false); // 胶囊体-地形（未交换）

        // 填充通用凸形3(5)相关检测器组合
        detectors[5][0] = gjkEpaDetector;                   // 通用凸形3-球
        detectors[5][1] = gjkEpaDetector;                   // 通用凸形3-盒
        detectors[5][2] = gjkEpaDetector;                   // 通用凸形3-通用凸形1
        detectors[5][3] = gjkEpaDetector;                   // 通用凸形3-通用凸形2
        detectors[5][4] = gjkEpaDetector;                   // 通用凸形3-胶囊体
        detectors[5][5] = gjkEpaDetector;                   // 通用凸形3-通用凸形3
        detectors[5][6] = new ConvexTerrainDetector(false); // 通用凸形3-地形（未交换）

        // 填充地形(6)相关检测器组合（与其他类型互换）
        detectors[6][0] = new ConvexTerrainDetector(true);  // 地形-球（已交换）
        detectors[6][1] = new ConvexTerrainDetector(true);  // 地形-盒（已交换）
        detectors[6][2] = new ConvexTerrainDetector(true);  // 地形-通用凸形1（已交换）
        detectors[6][3] = new ConvexTerrainDetector(true);  // 地形-通用凸形2（已交换）
        detectors[6][4] = new ConvexTerrainDetector(true);  // 地形-胶囊体（已交换）
        detectors[6][5] = new ConvexTerrainDetector(true);  // 地形-通用凸形3（已交换）
    }
}

export { CollisionMatrix };