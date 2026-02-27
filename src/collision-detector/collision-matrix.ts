import { GEOMETRY_TYPE } from '../constant';
import SphereSphereDetector from "./sphere-sphere-detector";
import GjkEpaDetector from "./gjk-epa-detector/gjk-epa-detector";
import BoxBoxDetector from "./box-box-detector/box-box-detector";
import SphereBoxDetector from "./sphere-box-detector";
import CapsuleCapsuleDetector from "./capsule-capsule-detector";
import SphereCapsuleDetector from "./sphere-capsule-detector";
import Detector from './detector';
import ConvexTerrainDetector from './convex-terrain-detector';

export default class CollisionMatrix {
	public detectors: Array<Array<Detector>> = [];
	constructor() {
		this._init();
	}

	public getDetector(geomType1: GEOMETRY_TYPE, geomType2: GEOMETRY_TYPE): Detector {
		let t1 = geomType1 - GEOMETRY_TYPE.NULL - 1;
		let t2 = geomType2 - GEOMETRY_TYPE.NULL - 1;
		return this.detectors[t1][t2];
	}

	private _init(): void {
		this.detectors = new Array(8);
		const detectors = this.detectors;
		detectors[0] = new Array(8);
		detectors[1] = new Array(8);
		detectors[2] = new Array(8);
		detectors[3] = new Array(8);
		detectors[4] = new Array(8);
		detectors[5] = new Array(8);
		detectors[6] = new Array(8);
		const gjkEpaDetector = new GjkEpaDetector();
		detectors[0][0] = new SphereSphereDetector();
		detectors[0][1] = new SphereBoxDetector(false);
		detectors[0][2] = gjkEpaDetector;
		detectors[0][3] = gjkEpaDetector;
		detectors[0][4] = new SphereCapsuleDetector(false);
		detectors[0][5] = gjkEpaDetector;
		detectors[1][0] = new SphereBoxDetector(true);
		detectors[1][1] = new BoxBoxDetector();
		detectors[1][2] = gjkEpaDetector;
		detectors[1][3] = gjkEpaDetector;
		detectors[1][4] = gjkEpaDetector;
		detectors[1][5] = gjkEpaDetector;
		detectors[2][0] = gjkEpaDetector;
		detectors[2][1] = gjkEpaDetector;
		detectors[2][2] = gjkEpaDetector;
		detectors[2][3] = gjkEpaDetector;
		detectors[2][4] = gjkEpaDetector;
		detectors[2][5] = gjkEpaDetector;
		detectors[3][0] = gjkEpaDetector;
		detectors[3][1] = gjkEpaDetector;
		detectors[3][2] = gjkEpaDetector;
		detectors[3][3] = gjkEpaDetector;
		detectors[3][4] = gjkEpaDetector;
		detectors[3][5] = gjkEpaDetector;
		detectors[4][0] = new SphereCapsuleDetector(true);
		detectors[4][1] = gjkEpaDetector;
		detectors[4][2] = gjkEpaDetector;
		detectors[4][3] = gjkEpaDetector;
		detectors[4][4] = new CapsuleCapsuleDetector();
		detectors[4][5] = gjkEpaDetector;
		detectors[5][0] = gjkEpaDetector;
		detectors[5][1] = gjkEpaDetector;
		detectors[5][2] = gjkEpaDetector;
		detectors[5][3] = gjkEpaDetector;
		detectors[5][4] = gjkEpaDetector;
		detectors[5][5] = gjkEpaDetector;

		detectors[0][6] = new ConvexTerrainDetector(false);
		detectors[1][6] = new ConvexTerrainDetector(false);
		detectors[2][6] = new ConvexTerrainDetector(false);
		detectors[3][6] = new ConvexTerrainDetector(false);
		detectors[4][6] = new ConvexTerrainDetector(false);
		detectors[5][6] = new ConvexTerrainDetector(false);
		detectors[6][0] = new ConvexTerrainDetector(true);
		detectors[6][1] = new ConvexTerrainDetector(true);
		detectors[6][2] = new ConvexTerrainDetector(true);
		detectors[6][3] = new ConvexTerrainDetector(true);
		detectors[6][4] = new ConvexTerrainDetector(true);
		detectors[6][5] = new ConvexTerrainDetector(true);
	}
}