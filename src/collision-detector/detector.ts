import Transform from "../common/transform";
import Geometry from "../shape/geometry";
import DetectorResult from "./detector-result";
import CachedDetectorData from './cached-detector-data';

export default abstract class Detector<T1 = Geometry, T2 = Geometry>{
	public swapped : boolean;
	constructor(swapped : boolean) {
		this.swapped = swapped;
	}
	public setNormal(result : DetectorResult, nX : number, nY : number, nZ : number) : void {
		const v = result.normal.elements;
		v[0] = nX; v[1] = nY; v[2] = nZ;
		if (this.swapped) {
			v[0] = -v[0]; v[1] = -v[1]; v[2] = -v[2];
		}
	}
	public addPoint(result : DetectorResult, pos1X : number, pos1Y : number, pos1Z : number, pos2X : number, pos2Y : number, pos2Z : number, depth : number, id : number) : void {
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
	public detect(result : DetectorResult, geom1 : T1, geom2 : T2, transform1 : Transform, transform2 : Transform, cachedData : CachedDetectorData) : void {
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

	protected abstract detectImpl(result : DetectorResult, geom1 : T1 | T2, geom2 : T2 | T1, tf1 : Transform, tf2 : Transform, cachedData : CachedDetectorData) : void;

}