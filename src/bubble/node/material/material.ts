import type {Shader} from "@/bubble/shader/shader";
import {notifyUpdate, type Versioned} from "@/bubble/resource/versioned";
import {BufferResource} from "@/bubble/resource/primitive/buffer";
import type {Texture} from "@/bubble/resource/primitive/texture";

// Material -> ShaderModule/Pipeline/BindingGroups
export class Material implements Versioned {
    version: number = 0;

    shader: Shader;
    uniforms: Map<string, any> = new Map();
    textures: Map<string, Texture>;

    blendMode: MaterialBlendMode = MaterialBlendMode.OPAQUE;
    doubleSided: boolean = false;

    constructor(shader: Shader) {
        this.shader = shader;
        this.uniforms = new Map();
        this.textures = new Map();
    }

    setNeedsUpdate() {
        this.version++;
        notifyUpdate(this);
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

    setUniform(name: string, value: any) {
        this.uniforms.set(name, value);
    }

    getUniform(name: string): any {
        let uniform = this.uniforms.get(name);
        if (uniform) {
            return uniform;
        }
        throw new Error(`Uniform ${name} not found.`);
    }

    hasUniform(name: string): boolean {
        return this.uniforms.has(name);
    }

    removeUniform(name: string) {
        this.uniforms.delete(name);
    }
}

export enum MaterialBlendMode {
    OPAQUE = 'OPAQUE',
    BLEND = 'BLEND',
    MASK = 'MASK',
}
