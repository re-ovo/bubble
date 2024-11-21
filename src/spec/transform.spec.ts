import {describe, expect, it} from "vitest";
import {mat4, vec3} from "wgpu-matrix";
import {isMatrixOrthogonal} from "@/math/maths";
import {Transform} from "@/core/transform";
import {Entity} from "@/core/entity";

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

    it("set by matrix", () => {
        const entity = new Entity("test")
        const transform = new Transform(entity)
        const matrix = mat4.create(
            -1.2818495035171509, 0, -1.5698129109401933e-16, 0,
            -1.4997597572211942e-32, 1, 1.2246468525851679e-16, 0,
            -9.386046203907787e-17, -9.386046203907787e-17, 0.7664288282394409, 0,
            74.0130615234375, 0, -60.345088958740234, 1
        )
        transform.setByMatrix(matrix)
        //expect(mat4.equalsApproximately(transform.localTransformMatrix, matrix)).toBeTruthy()
    })

    it('test entity hierarchy', () => {
        const a = new Entity('a')
        const b = new Entity('b')
        const c = new Entity('c')

        a.addChild(b)
        b.addChild(c)

        a.transform.localPosition = vec3.create(1, 0, 0)
        b.transform.localPosition = vec3.create(0, 1, 0)
        c.transform.localPosition = vec3.create(0, 0, 1)

        expect(vec3.equalsApproximately(a.transform.localPosition, vec3.create(1, 0, 0))).toBeTruthy()
        expect(vec3.equalsApproximately(b.transform.localPosition, vec3.create(0, 1, 0))).toBeTruthy()
        expect(vec3.equalsApproximately(c.transform.localPosition, vec3.create(0, 0, 1))).toBeTruthy()

        expect(vec3.equalsApproximately(a.transform.worldPosition, vec3.create(1, 0, 0))).toBeTruthy()
        expect(vec3.equalsApproximately(b.transform.worldPosition, vec3.create(1, 1, 0))).toBeTruthy()
        expect(vec3.equalsApproximately(c.transform.worldPosition, vec3.create(1, 1, 1))).toBeTruthy()
    })
})
