import ConvexGeometry from "./convex-geometry";
import Vec3 from "../common/vec3";
import { GEOMETRY_TYPE } from '../constant';
import Aabb from "../common/aabb";
import Transform from "../common/transform";
import { Nullable } from "../common/nullable";

export default class ConvexSweepGeometry extends ConvexGeometry {
	public c: Nullable<ConvexGeometry>;
	public localTranslation: Nullable<Vec3>;
	constructor() {
		super(GEOMETRY_TYPE.NULL);
	}
	public init(c: ConvexGeometry, _transform: Transform, _translation: Vec3): void {
		const translation = _translation.elements, transform = _transform.elements;
		this.c = c;
		const trX = translation[0], trY = translation[1], trZ = translation[2];
		const localTrX = transform[3] * trX + transform[6] * trY + transform[9] * trZ;
		const localTrY = transform[4] * trX + transform[7] * trY + transform[10] * trZ;
		const localTrZ = transform[5] * trX + transform[8] * trY + transform[11] * trZ;
		this.localTranslation = new Vec3();
		const v = this.localTranslation.elements;
		v[0] = localTrX; v[1] = localTrY; v[2] = localTrZ;
		this.gjkMargin = c.gjkMargin;
	}
	public computeLocalSupportingVertex(_dir: Vec3, _out: Vec3): void {
		this.c!.computeLocalSupportingVertex(_dir, _out);
		const dir = _dir.elements, out = _out.elements;
		const v = this.localTranslation!.elements;
		if (dir[0] * v[0] + dir[1] * v[1] + dir[2] * v[2] > 0) {
			out[0] += v[0]; out[1] += v[1]; out[2] += v[2];
		}
	}
	public computeAabb(aabb: Aabb, tf: Transform): void {
	}
	public updateMass(): void {
	}
}