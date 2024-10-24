import {describe, expect, it} from "vitest";
import {mat4} from "wgpu-matrix";
import {isMatrixOrthogonal} from "@/bubble/math/maths";

describe("transform", () => {
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
