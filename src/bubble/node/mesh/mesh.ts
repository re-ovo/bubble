import type {Attribute} from "@/bubble/node/mesh/attribute";

export class Mesh {
    attributes: Attribute[];
    indices?: Uint16Array;

    constructor(
        vertices: Attribute,
        normals: Attribute,
        uvs: Attribute,
        indices?: Uint16Array
    ) {
        this.attributes = [vertices, normals, uvs];
        this.indices = indices
    }

    get vertices() {
        return this.attributes[0];
    }

    get normals() {
        return this.attributes[1];
    }

    get uvs() {
        return this.attributes[2];
    }
}
