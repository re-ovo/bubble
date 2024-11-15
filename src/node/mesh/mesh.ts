import {IndexBuffer, type VertexAttribute} from "@/resource/attribute";

export class Mesh {
    private readonly _attributes: Map<string, VertexAttribute>
    private _indices: IndexBuffer | null = null;
    private _drawCount: number = 0;

    constructor() {
        this._attributes = new Map();
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

    get attributes(): Map<string, VertexAttribute> {
        return this._attributes;
    }

    setIndices(indices: Uint16Array | Uint32Array) {
        this._indices = new IndexBuffer(indices);
        this.computeVertexCount();
    }

    get indices(): IndexBuffer | null {
        return this._indices;
    }

    computeVertexCount() {
        if (this.indices) {
            this._drawCount = this.indices.count;
        } else {
            const firstAttribute = this._attributes.values().next().value
            this._drawCount = firstAttribute.data.length / firstAttribute.itemSize;
        }
    }

    set drawCount(count: number) {
        this._drawCount = count;
    }

    get drawCount(): number {
        return this._drawCount;
    }
}
