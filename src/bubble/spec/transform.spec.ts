import {describe, expect, it} from "vitest";
import {mat4, quat, vec3} from "wgpu-matrix";
import {isMatrixOrthogonal, quatToEuler} from "@/bubble/math/maths";

describe("transform", () => {
    it("should convert quaternion to euler angles correctly", () => {
        const q = quat.create(
            0, 0.4478093385696411, 0, 0.8941290974617004
        );

        const q_xyz = quatToEuler(q, 'xyz');
        const q_xyz_expected = vec3.create(0, 0.928627610206604, 0)
        const q_xyz_angle = vec3.angle(q_xyz, q_xyz_expected);
        expect(q_xyz_angle).toBeLessThan(0.0001);

        const q_yxz = quatToEuler(q, 'yxz');
        const q_yxz_expected = vec3.create(0, 0.928627610206604, 0)
        const q_yxz_angle = vec3.angle(q_yxz, q_yxz_expected);
        expect(q_yxz_angle).toBeLessThan(0.0001);
    })

    it("test matrix orthogonality", () => {
        const matrix = mat4.create(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        )
        expect(isMatrixOrthogonal(matrix)).toBeTruthy()

        const matrix2 = mat4.create(
            1, 0.2, 0, 0,
            0, 1, 0, 0.1,
            0, 0, 1, 0,
            0, 0, 0, 1
        )
        expect(isMatrixOrthogonal(matrix2)).toBeFalsy()
    })
})
