import {WgslReflect} from "wgsl_reflect";
import type {Streamable} from "@/bubble/resource/streamer";

export class Shader<P> implements Streamable {
    needSync = false;

    private readonly provider: ShaderSourceProvider<P>;
    private _code: string = '';
    private _metadata: WgslReflect | null = null;

    constructor(sourceProvider: ShaderSourceProvider<P>) {
        this.provider = sourceProvider;
    }

    compile(params: P) {
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

export type ShaderSourceProvider<P> = string | ((params: P) => string);
