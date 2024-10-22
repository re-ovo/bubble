import {describe, expect, it} from "vitest";
import {mat4, quat, vec3} from "wgpu-matrix";
import {getTransformByMatrix, quatToEuler} from "@/bubble/math/maths";

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

    it("should convert matrix to transform correctly", () => {
        const matrix = mat4.create(...[
            -0.18572000000000002,
            -0.025710000000000004,
            0,
            0,
            0.025710000000000004,
            -0.18572000000000002,
            0,
            0,
            0,
            0,
            0.11421000000000002,
            0,
            -1.0091899999999998,
            -8.847480000000001,
            4.344519999999999,
            1
        ])
        const transform = getTransformByMatrix(matrix, 'column');
        const mvp = mat4.translation(transform.translation)
        mat4.multiply(
            mvp,
            mat4.fromQuat(transform.rotation),
            mvp
        )
        mat4.mul(mvp, mat4.scaling(transform.scale), mvp)
        // convert mvp to column major
        const mvp_column = mat4.transpose(mvp)
        const mvp_column_transform = getTransformByMatrix(mvp_column, 'column')

        console.log(transform, '\n', mvp_column_transform)
    })
})
