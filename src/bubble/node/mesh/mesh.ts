import {BufferAttribute} from "@/bubble/resource/primitive/attribute";

export class Mesh {
    readonly attributes: Map<string, BufferAttribute<any>> = new Map();
    indices: BufferAttribute<Uint16Array> | null = null;

    addAttribute<T extends BufferAttribute<any>>(name: string, attribute: T) {
        if (this.attributes.has(name)) {
            throw new Error(`Attribute ${name} already exists.`);
        }
        this.attributes.set(name, attribute);
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

    setIndices(indices: BufferAttribute<Uint16Array>) {
        this.indices = indices;
    }
}

export function createBasicMesh(): Mesh {
    const mesh = new Mesh();
    mesh.addAttribute('position', new BufferAttribute(
        new Float32Array([
            -0.5, -0.5, 0.0,
            0.5, -0.5, 0.0,
            0.0, 0.5, 0.0
        ]),
        'float32x3'
    ));
    return mesh;
}
