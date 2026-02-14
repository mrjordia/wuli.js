import GjkCache from "./gjk-epa-detector/gjk-cache";


export default class CachedDetectorData {
	public gjkCache ?: GjkCache;

	public clear() : void {
		if (this.gjkCache) {
			this.gjkCache.clear();
		}
	}
}