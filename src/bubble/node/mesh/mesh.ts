import {BufferAttribute} from "@/bubble/resource/primitive/attribute";

export class Mesh {
    readonly attributes: Map<string, BufferAttribute<any>> = new Map();
    indices: BufferAttribute<Uint16Array|Uint32Array> | null = null;
    drawCount: number = 0;

    addAttribute<T extends BufferAttribute<any>>(name: string, attribute: T) {
        if (this.attributes.has(name)) {
            throw new Error(`Attribute ${name} already exists.`);
        }
        this.attributes.set(name, attribute);
        this.computeVertexCount();
    }

    removeAttribute(name: string) {
        this.attributes.delete(name);
    }

    getAttribute<T extends BufferAttribute<any>>(name: string): T | null {
        return this.attributes.get(name) as T;
    }

    hasAttribute(name: string): boolean {
        return this.attributes.has(name);
    }

    setIndices(indices: Uint16Array | Uint32Array) {
        this.indices = new BufferAttribute(indices, 1, GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST);
        // resize index buffer (Number of bytes to write must be a multiple of 4)
        if (indices instanceof Uint16Array && indices.byteLength % 4 !== 0) {
            const newSize = Math.ceil(indices.byteLength / 4) * 4;
            const newIndices = new Uint16Array(newSize);
            newIndices.set(indices);
            this.indices.data = newIndices;
        }
        this.computeVertexCount();
    }

    computeVertexCount() {
        if (this.indices) {
            this.drawCount = this.indices.data.length;
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
    mesh.addAttribute('position', new BufferAttribute(
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
