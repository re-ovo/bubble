import type {Shader} from "@/bubble/shader/shader";
import {notifyUpdate, type Versioned} from "@/bubble/resource/versioned";
import {BufferResource} from "@/bubble/resource/primitive/buffer";
import type {Texture} from "@/bubble/resource/primitive/texture";

// Material -> ShaderModule/Pipeline/BindingGroups
export class Material implements Versioned {
    version: number = 0;

    shader: Shader;
    buffers: Map<string, BufferResource>;
    textures: Map<string, Texture>;

    blendMode: MaterialBlendMode = MaterialBlendMode.OPAQUE;
    doubleSided: boolean = false;

    constructor(shader: Shader) {
        this.shader = shader;
        this.buffers = new Map();
        this.textures = new Map();
    }

    setNeedsUpdate() {
        this.version++;
        notifyUpdate(this);
    }

    addBuffer(variableName: string, buffer: BufferResource) {
        buffer.setShader(this.shader!);
        this.buffers.set(variableName, buffer);
    }

    removeBuffer(name: string) {
        this.buffers.delete(name);
    }

    getBuffer(name: string): BufferResource {
        let buf = this.buffers.get(name);
        if (buf) {
            return buf;
        }
        throw new Error(`Buffer ${name} not found.`);
    }

    getBufferView(name: string): DataView {
        let buffer = this.getBuffer(name);
        return buffer.view;
    }

    addTexture(variableName: string, texture: Texture) {
        this.textures.set(variableName, texture);
    }

    getTexture(name: string): Texture {
        let tex = this.textures.get(name);
        if (tex) {
            return tex;
        }
        throw new Error(`Texture ${name} not found.`);
    }

    hasTexture(name: string): boolean {
        return this.textures.has(name);
    }

    removeTexture(name: string) {
        this.textures.delete(name);
    }
}

export enum MaterialBlendMode {
    OPAQUE = 'OPAQUE',
    BLEND = 'BLEND',
    MASK = 'MASK',
}
