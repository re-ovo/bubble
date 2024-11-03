import {IndexAttribute, VertexAttribute} from "@/bubble/resource/attribute";

export class Mesh {
    readonly attributes: Map<string, VertexAttribute> = new Map();
    indices: IndexAttribute | null = null;
    drawCount: number = 0;

    addAttribute<T extends VertexAttribute>(name: string, attribute: T) {
        if (this.attributes.has(name)) {
            throw new Error(`Attribute ${name} already exists.`);
        }
        this.attributes.set(name, attribute);
        this.computeVertexCount();
    }

    removeAttribute(name: string) {
        this.attributes.delete(name);
    }

    getAttribute<T extends VertexAttribute>(name: string): T | null {
        return this.attributes.get(name) as T;
    }

    hasAttribute(name: string): boolean {
        return this.attributes.has(name);
    }

    setIndices(indices: Uint16Array | Uint32Array) {
        this.indices = new IndexAttribute(indices);

        this.computeVertexCount();
    }

    computeVertexCount() {
        if (this.indices) {
            this.drawCount = this.indices.count;
        } else {
            const firstAttribute = this.attributes.values().next().value
            this.drawCount = firstAttribute.data.length / firstAttribute.itemSize;
        }
    }

    setVertexCount(count: number) {
        this.drawCount = count;
    }
}

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
