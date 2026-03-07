import Vec3 from "../../common/vec3";
import Method from "../../common/method";
import EpaTriangle from "./epa-triangle";
import { Nullable } from "../../common/nullable";

/**
 * EPA顶点类。
 * 用于表示EPA算法中扩展多面体的顶点数据结构，存储顶点的核心几何信息和拓扑关联关系；
 * EPA算法是GJK算法的扩展，用于计算两个凸几何体之间的精确碰撞法线和穿透深度，该类是算法的核心数据单元。
 */
export default class EpaVertex {
    /** 顶点随机ID，用于调试/标识，避免顶点重复或混淆（取整随机数） */
    public randId = Math.random() * 100000 | 0;
    /** 顶点在Minkowski差空间中的坐标（核心几何属性） */
    public v = new Vec3();
    /** 该顶点对应的第一个凸几何体的支撑点坐标（世界坐标系） */
    public w1 = new Vec3();
    /** 该顶点对应的第二个凸几何体的支撑点坐标（世界坐标系） */
    public w2 = new Vec3();

    /** 顶点在边环中的下一个顶点引用（拓扑关联） */
    public next: Nullable<EpaVertex>;
    /** 临时边环的下一个顶点引用（算法过程中临时使用） */
    public tmpEdgeLoopNext: Nullable<EpaVertex>;
    /** 临时边环所属的外部三角形引用（算法过程中临时拓扑关联） */
    public tmpEdgeLoopOuterTriangle: Nullable<EpaTriangle>;

    /**
     * 初始化EPA顶点的核心数据。
     * 核心逻辑：
     * 1. 拷贝传入的坐标数据到顶点内部属性；
     * 2. 重置所有拓扑关联引用为null，保证顶点初始状态干净；
     * 3. 返回自身实例，支持链式调用。
     * @param {Vec3} v - Minkowski差空间中的顶点坐标
     * @param {Vec3} w1 - 第一个凸几何体的支撑点坐标
     * @param {Vec3} w2 - 第二个凸几何体的支撑点坐标
     * @returns {EpaVertex} 初始化后的当前顶点实例（链式调用）
     */
    public init(v: Vec3, w1: Vec3, w2: Vec3): EpaVertex {
        // 拷贝Minkowski差空间顶点坐标
        Method.copyElements(v.elements, this.v.elements, 0, 0, 3);
        // 拷贝第一个凸几何体支撑点坐标
        Method.copyElements(w1.elements, this.w1.elements, 0, 0, 3);
        // 拷贝第二个凸几何体支撑点坐标
        Method.copyElements(w2.elements, this.w2.elements, 0, 0, 3);
        // 重置拓扑关联引用
        this.next = null;
        this.tmpEdgeLoopNext = null;
        this.tmpEdgeLoopOuterTriangle = null;
        return this;
    }

    /**
     * 移除顶点的所有拓扑关联引用。
     * 核心作用：
     * 1. 将所有顶点关联的引用（next/tmpEdgeLoopNext/tmpEdgeLoopOuterTriangle）置为null；
     * 2. 避免内存泄漏，同时保证顶点可被复用或销毁时的状态干净。
     * @returns {void}
     */
    public removeReferences(): void {
        this.next = null;
        this.tmpEdgeLoopNext = null;
        this.tmpEdgeLoopOuterTriangle = null;
    }
}

export { EpaVertex };