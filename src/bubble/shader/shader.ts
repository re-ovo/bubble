import {WgslReflect} from "wgsl_reflect";
import type {Versioned} from "@/bubble/resource/versioned";

/**
 * Shader source provider
 */
export type ShaderSourceProvider = string | ((params: Record<any, any>) => string);

export class Shader implements Versioned {
    private readonly provider: ShaderSourceProvider;
    private _code: string = '';
    private _metadata: WgslReflect | null = null;

    version: number = 0;
    setNeedsUpdate() {
        this.version++;
    }

    constructor(sourceProvider: ShaderSourceProvider) {
        this.provider = sourceProvider;
    }

    compile(params: Record<string, any>) {
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
