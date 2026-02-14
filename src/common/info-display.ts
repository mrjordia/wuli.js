import { BROAD_PHASE_TYPE } from "../constant";
import { World } from "../world";

export default class InfoDisplay {
	private _parent!: World;
	private _infos = new Float32Array(13);
	private _f = [0, 0, 0];
	private _times = [0, 0, 0, 0];
	private _broadPhase!: BROAD_PHASE_TYPE;
	private _fps = 0;
	private _tt = 0;
	private _broadPhaseTime = 0;
	private _narrowPhaseTime = 0;
	private _solvingTime = 0;
	private _totalTime = 0;
	private _updateTime = 0;
	private _MaxBroadPhaseTime = 0;
	private _MaxNarrowPhaseTime = 0;
	private _MaxSolvingTime = 0;
	private _MaxTotalTime = 0;
	private _MaxUpdateTime = 0;

	constructor(world: World) {
		this._init(world);
	}

	public setTime(index: number): void {
		this._times[index || 0] = performance.now();
	}

	public resetMax(): void {
		this._MaxBroadPhaseTime = 0;
		this._MaxNarrowPhaseTime = 0;
		this._MaxSolvingTime = 0;
		this._MaxTotalTime = 0;
		this._MaxUpdateTime = 0;
	}

	public calcBroadPhase(): void {
		this.setTime(2);
		this._broadPhaseTime = this._times[2] - this._times[1];
	}

	public calcNarrowPhase(): void {
		this.setTime(3);
		this._narrowPhaseTime = this._times[3] - this._times[2];
	}

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

	public upFps(): void {
		this._f[1] = performance.now();
		if (this._f[1] - 1000 > this._f[0]) {
			this._f[0] = this._f[1];
			this._fps = this._f[2];
			this._f[2] = 0;
		}
		this._f[2]++;
	}

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

	private _init(world: World): void {
		this._parent = world;
		this._broadPhase = this._parent.broadPhase.type;
	}

}