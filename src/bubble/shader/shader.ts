import {WgslReflect} from "wgsl_reflect";
import type {Streamable} from "@/bubble/resource/streamer";

export class Shader implements Streamable {
    needSync = false;

    private readonly provider: ShaderSourceProvider;
    private _code: string = '';
    private _metadata: WgslReflect | null = null;

    constructor(sourceProvider: ShaderSourceProvider) {
        this.provider = sourceProvider;
    }

    compile(params: any) {
        const source = typeof this.provider === 'function' ? this.provider(params) : this.provider;
        this._code = source;
        this._metadata = new WgslReflect(source);
    }

    get code(): string {
        if (!this._code) {
            throw new Error('Shader code not compiled');
        }
        return this._code;
    }

    get metadata(): WgslReflect {
        if (!this._metadata) {
            throw new Error('Shader metadata not compiled');
        }
        return this._metadata
    }
}

export type ShaderSourceProvider = string | ((params: any) => string);
