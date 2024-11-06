import type {Shader} from "@/bubble/resource/shader";
import type {Texture} from "@/bubble/resource/texture";
import type {Tracked} from "@/bubble/resource/tracker";
import {track} from "@/bubble/resource/tracker";

// Material -> ShaderModule/Pipeline/BindingGroups
export class Material {
    readonly shader: Tracked<Shader>;
    readonly uniforms: Tracked<Map<string, any>>;
    readonly textures: Tracked<Map<string, Texture>>;
    readonly options: Tracked<MaterialOptions>;

    constructor(shader: Shader) {
        this.shader = track(shader);
        this.uniforms = track(new Map());
        this.textures = track(new Map());
        this.options = track(new MaterialOptions());
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

export class MaterialOptions {
    blendMode: MaterialBlendMode = MaterialBlendMode.OPAQUE;
    cullMode: GPUCullMode = 'back';
    depthWrite: boolean = true;
}

export enum MaterialBlendMode {
    OPAQUE = 'OPAQUE',
    BLEND = 'BLEND',
    MASK = 'MASK',
}
