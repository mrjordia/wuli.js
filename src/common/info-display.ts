import { BROAD_PHASE_TYPE } from "../constant";
import { World } from "../world";

/**
 * 物理引擎性能信息展示类。
 * 实时采集并计算物理引擎的核心性能指标（FPS、各阶段耗时、刚体/接触数量等），
 * 支持格式化文本输出和数值数组输出，用于调试面板/性能分析工具展示；
 * 核心监控维度：宽/窄相位耗时、约束求解耗时、FPS、刚体/接触/岛屿数量等。
 */
export default class InfoDisplay {
    /** 关联的物理世界实例（必选） */
    private _parent!: World;
    /** 性能指标数值数组（供外部数值分析使用），索引对应关系：
     * 0: 宽相位类型 | 1: 刚体数量 | 2: 接触数量 | 3: 配对检测次数 | 4: 接触数量（冗余） |
     * 5: 岛屿数量 | 6: 宽相位耗时 | 7: 窄相位耗时 | 8: 求解耗时 | 9: 更新耗时 |
     * 10: 总耗时 | 11: FPS | 12: 预留位
     */
    private _infos = new Float32Array(13);
    /** FPS计算临时变量 [上次统计时间, 当前时间, 帧计数] */
    private _f = [0, 0, 0];
    /** 时间戳临时数组 [总开始, 宽相位开始, 宽相位结束, 窄相位结束, 求解结束, 总结束] */
    private _times = [0, 0, 0, 0];
    /** 当前宽相位类型（如AABB树/网格） */
    private _broadPhase!: BROAD_PHASE_TYPE;
    /** 实时FPS值（每秒帧数） */
    private _fps = 0;
    /** 统计周期计数器（用于重置最大耗时） */
    private _tt = 0;
    /** 宽相位检测耗时（毫秒） */
    private _broadPhaseTime = 0;
    /** 窄相位检测耗时（毫秒） */
    private _narrowPhaseTime = 0;
    /** 约束求解耗时（毫秒） */
    private _solvingTime = 0;
    /** 物理帧总耗时（毫秒） */
    private _totalTime = 0;
    /** 世界更新耗时（毫秒） */
    private _updateTime = 0;
    /** 宽相位最大耗时（毫秒，统计周期内） */
    private _MaxBroadPhaseTime = 0;
    /** 窄相位最大耗时（毫秒，统计周期内） */
    private _MaxNarrowPhaseTime = 0;
    /** 约束求解最大耗时（毫秒，统计周期内） */
    private _MaxSolvingTime = 0;
    /** 物理帧最大总耗时（毫秒，统计周期内） */
    private _MaxTotalTime = 0;
    /** 世界更新最大耗时（毫秒，统计周期内） */
    private _MaxUpdateTime = 0;

    /**
     * 构造函数：初始化性能监控实例
     * @param {World} world - 待监控的物理世界实例
     */
    constructor(world: World) {
        this._init(world);
    }

    /**
     * 记录指定阶段的时间戳。
     * 用于标记物理引擎各阶段的开始/结束时间，index默认0
     * @param {number} index - 时间戳索引（对应_times数组）
     */
    public setTime(index: number): void {
        this._times[index || 0] = performance.now();
    }

    /**
     * 重置所有阶段的最大耗时统计。
     * 统计周期（100帧）结束时自动调用，重置最大耗时为0
     */
    public resetMax(): void {
        this._MaxBroadPhaseTime = 0;
        this._MaxNarrowPhaseTime = 0;
        this._MaxSolvingTime = 0;
        this._MaxTotalTime = 0;
        this._MaxUpdateTime = 0;
    }

    /**
     * 计算宽相位检测耗时。
     * 标记宽相位结束时间，并计算宽相位阶段耗时（结束-开始）
     */
    public calcBroadPhase(): void {
        this.setTime(2);
        this._broadPhaseTime = this._times[2] - this._times[1];
    }

    /**
     * 计算窄相位检测耗时。
     * 标记窄相位结束时间，并计算窄相位阶段耗时（结束-宽相位结束）
     */
    public calcNarrowPhase(): void {
        this.setTime(3);
        this._narrowPhaseTime = this._times[3] - this._times[2];
    }

    /**
     * 计算物理帧最终耗时并更新最大耗时统计。
     * 标记物理帧结束时间，计算求解/总/更新耗时；
     * 统计周期（>100帧）内更新各阶段最大耗时，周期>500帧时重置计数器；
     * 自动更新FPS并递增统计计数器。
     */
    public calcEnd(): void {
        this.setTime(5);
        this._solvingTime = this._times[4] - this._times[3];
        this._totalTime = this._times[5] - this._times[0];
        this._updateTime = this._times[5] - this._times[4];
        if (this._tt === 100) this.resetMax();
        if (this._tt > 100) {
            if (this._broadPhaseTime > this._MaxBroadPhaseTime) this._MaxBroadPhaseTime = this._broadPhaseTime;
            if (this._narrowPhaseTime > this._MaxNarrowPhaseTime) this._MaxNarrowPhaseTime = this._narrowPhaseTime;
            if (this._solvingTime > this._MaxSolvingTime) this._MaxSolvingTime = this._solvingTime;
            if (this._totalTime > this._MaxTotalTime) this._MaxTotalTime = this._totalTime;
            if (this._updateTime > this._MaxUpdateTime) this._MaxUpdateTime = this._updateTime;
        }
        this.upFps();
        this._tt++;
        if (this._tt > 500) this._tt = 0;
    }

    /**
     * 更新FPS（每秒帧数）统计。
     * 每帧调用，每秒重置一次帧计数，计算实时FPS值；
     * 临时变量_f[0]=上次统计时间，_f[1]=当前时间，_f[2]=帧计数。
     */
    public upFps(): void {
        this._f[1] = performance.now();
        if (this._f[1] - 1000 > this._f[0]) {
            this._f[0] = this._f[1];
            this._fps = this._f[2];
            this._f[2] = 0;
        }
        this._f[2]++;
    }

    /**
     * 获取格式化的性能信息文本（HTML兼容）。
     * @returns {string} 返回包含宽相位类型、FPS、刚体/接触/岛屿数量、各阶段耗时（当前|最大）的HTML文本
     */
    public get information(): string {
        return [
            "BroadPhaseType:" + this._broadPhase + "<br><br>",
            "FPS:" + this._fps + " fps<br><br>",
            "rigid-body:" + this._parent.numRigidBodies + "<br>",
            "contact:" + this._parent.contactManager.numContacts + "<br>",
            "pairCheck: " + this._parent.broadPhase.testCount + "<br>",
            "island:" + this._parent.numIslands + "<br><br>",
            "Time in milliseconds<br><br>",
            "broadPhase:" + (this._broadPhaseTime.toFixed(3)) + " | " + (this._MaxBroadPhaseTime.toFixed(3)) + "<br>",
            "narrowPhase:" + (this._narrowPhaseTime.toFixed(3)) + " | " + (this._MaxNarrowPhaseTime.toFixed(3)) + "<br>",
            "solving:" + (this._solvingTime.toFixed(3)) + " | " + (this._MaxSolvingTime.toFixed(3)) + "<br>",
            "total:" + (this._totalTime.toFixed(3)) + " | " + (this._MaxTotalTime.toFixed(3)) + "<br>",
            "updating:" + (this._updateTime.toFixed(3)) + " | " + (this._MaxUpdateTime.toFixed(3)) + "<br>"
        ].join("\n");
    }

    /**
     * 获取性能指标数值数组（供数值分析/可视化）。
     * 实时更新数组值，索引对应关系见_infos属性注释；
     * 适用于外部工具（如图表插件）读取数值进行可视化展示。
     * @returns {Float32Array} 13长度的浮点数组，包含所有核心性能指标
     */
    public toArray(): Float32Array {
        this._infos[0] = this._parent.broadPhase.type;
        this._infos[1] = this._parent.numRigidBodies;
        this._infos[2] = this._parent.contactManager.numContacts;
        this._infos[3] = this._parent.broadPhase.testCount;
        this._infos[4] = this._parent.contactManager.numContacts;
        this._infos[5] = this._parent.numIslands;
        this._infos[6] = this._broadPhaseTime;
        this._infos[7] = this._narrowPhaseTime;
        this._infos[8] = this._solvingTime;
        this._infos[9] = this._updateTime;
        this._infos[10] = this._totalTime;
        this._infos[11] = this._fps;
        return this._infos;
    }

    /**
     * 初始化方法：绑定物理世界并记录宽相位类型。
     * @param {World} world - 物理世界实例
     */
    private _init(world: World): void {
        this._parent = world;
        this._broadPhase = this._parent.broadPhase.type;
    }
}

export { InfoDisplay };