import {VertexAttribute} from "@/resource/attribute";
import {Mesh} from "@/node/mesh/mesh";

export function createCubeMesh(): Mesh {
    const mesh = new Mesh();
    mesh.addAttribute('position', new VertexAttribute(
        new Float32Array([
            // front
            -1, -1, 1,
            1, -1, 1,
            1, 1, 1,

            -1, -1, 1,
            1, 1, 1,
            -1, 1, 1,

            // back
            -1, -1, -1,
            1, -1, -1,
            1, 1, -1,

            -1, -1, -1,
            1, 1, -1,
            -1, 1, -1,

            // left
            -1, -1, -1,
            -1, -1, 1,
            -1, 1, 1,

            -1, -1, -1,
            -1, 1, 1,
            -1, 1, -1,

            // right
            1, -1, -1,
            1, -1, 1,
            1, 1, 1,

            1, -1, -1,
            1, 1, 1,
            1, 1, -1,

            // top
            -1, 1, -1,
            1, 1, -1,
            1, 1, 1,

            -1, 1, -1,
            1, 1, 1,
            -1, 1, 1,

            // bottom
            -1, -1, -1,
            1, -1, -1,
            1, -1, 1,

            -1, -1, -1,
            1, -1, 1,
            -1, -1, 1,
        ]),
        3
    ));
    return mesh;
}
