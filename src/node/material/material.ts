import type {Shader} from "@/shader/shader";
import type {Texture} from "@/resource/texture";

// Material -> ShaderModule/Pipeline/BindingGroups
export class Material {
    readonly shader: Shader;
    readonly uniforms: Map<string, any>;
    readonly textures: Map<string, Texture>;
    private _cullMode: GPUCullMode = 'back';

    constructor(shader: Shader) {
        this.shader = shader;
        this.uniforms = new Map();
        this.textures = new Map();
        this._cullMode = 'back';
    }

    setTexture(variableName: string, texture: Texture) {
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
        return undefined;
    }

    hasUniform(name: string): boolean {
        return this.uniforms.has(name);
    }

    removeUniform(name: string) {
        this.uniforms.delete(name);
    }

    get cullMode(): GPUCullMode {
        return this._cullMode;
    }
}

export enum MaterialBlendMode {
    OPAQUE = 'OPAQUE',
    BLEND = 'BLEND',
}
