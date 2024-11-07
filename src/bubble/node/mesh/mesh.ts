import {IndexAttribute, VertexAttribute} from "@/bubble/resource/attribute";
import {track, type Tracked, unwrapTracked} from "@/bubble/resource/tracker";

export class Mesh {
    private readonly _attributes: Map<string, VertexAttribute>
    private _indices: IndexAttribute | null = null;
    drawCount: number = 0;

    constructor() {
        this._attributes = unwrapTracked(track(new Map()));
    }

    addAttribute<T extends VertexAttribute>(name: string, attribute: T) {
        if (this._attributes.has(name)) {
            throw new Error(`Attribute ${name} already exists.`);
        }
        this._attributes.set(name, attribute);
        this.computeVertexCount();
    }

    removeAttribute(name: string) {
        this._attributes.delete(name);
    }

    getAttribute<T extends VertexAttribute>(name: string): T | null {
        return this._attributes.get(name) as T;
    }

    hasAttribute(name: string): boolean {
        return this._attributes.has(name);
    }

    setIndices(indices: Uint16Array | Uint32Array) {
        this._indices = unwrapTracked(track(new IndexAttribute(indices)));
        this.computeVertexCount();
    }

    get indices(): IndexAttribute | null {
        return this._indices;
    }

    computeVertexCount() {
        if (this.indices) {
            this.drawCount = this.indices.count;
        } else {
            const firstAttribute = this._attributes.values().next().value
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
