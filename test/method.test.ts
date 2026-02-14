import { describe, test } from '@jest/globals';
import Method, { DEFAULT_33 } from "../src/common/method";
import { expectF64ToBeClose } from "./utils/helper";

describe('Method.combineMat3Vec3ToTransform', () => {
    test('单位矩阵+原点位置应生成默认Transform', () => {
        const vec3 = new Float64Array([0, 0, 0]);
        const mat3 = new Float64Array(DEFAULT_33);
        const transform = new Float64Array(12);

        Method.combineMat3Vec3ToTransform(vec3, mat3, transform);
        const expected = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1];
        expectF64ToBeClose(transform, expected, '单位矩阵+原点位置转换错误');
    });

    test('自定义位置和旋转矩阵应正确组合为Transform', () => {
        const transform = new Float64Array(12);
        transform.fill(999);
        const vec3 = new Float64Array([1, -2, 3]);
        const mat3 = new Float64Array([-4, 5, -6, 7, -8, 9, -10, 11, -12]);

        Method.combineMat3Vec3ToTransform(vec3, mat3, transform);
        const expected = [1, -2, 3, -4, 5, -6, 7, -8, 9, -10, 11, -12];
        expectF64ToBeClose(transform, expected, '单位矩阵+原点位置转换错误');
    });
});