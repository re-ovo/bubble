export class Mesh {
    vertices: Float32Array;
    indices: Uint16Array;
    normals: Float32Array;
    uvs: Float32Array;

    constructor(vertices: Float32Array, indices: Uint16Array, normals: Float32Array, uvs: Float32Array) {
        this.vertices = vertices;
        this.indices = indices;
        this.normals = normals;
        this.uvs = uvs;
    }
}
