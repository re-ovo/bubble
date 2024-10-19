import {WgslReflect} from "wgsl_reflect";
import type {Versioned} from "@/bubble/resource/versioned";
import {providerWGSLCounterScope} from "@/bubble/shader/counter";

/**
 * Shader source provider
 */
export type ShaderSourceProvider = string | ((params: Record<any, any>) => string);

export class Shader implements Versioned {
    private provider: ShaderSourceProvider;
    private params: Record<string, any> = {};

    private _code: string = '';
    private _metadata: WgslReflect | null = null;
    private _attributes: ShaderAttribute[] = [];

    version: number = 0;

    setNeedsUpdate() {
        this.version++;
    }

    constructor(sourceProvider: ShaderSourceProvider, params: Record<string, any> = {}) {
        this.provider = sourceProvider;
        this.params = params;
        this.evaluate();
    }

    addParams(params: Record<string, any>) {
        this.params = {...this.params, ...params};
        this.evaluate();
    }

    addParam(key: string, value: any) {
        this.params[key] = value;
        this.evaluate();
    }

    getParam(key: string): any {
        return this.params[key];
    }

    setShaderSourceProvider(provider: ShaderSourceProvider) {
        this.provider = provider;
        this.evaluate();
    }

    evaluate() {
        const source = providerWGSLCounterScope(() => {
            return typeof this.provider === 'function' ? this.provider(this.params) : this.provider;
        });
        this._code = source;
        this._metadata = new WgslReflect(source);
        this._attributes = computeShaderAttribute(this._metadata);
        this.setNeedsUpdate(); // need to recompile shader module
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

    get attributes(): ShaderAttribute[] {
        return this._attributes;
    }
}

export interface ShaderAttribute {
    name: string;
    location: number;
    type: {
        name: string;
        size: number;
    }
}

function computeShaderAttribute(metadata: WgslReflect): ShaderAttribute[] {
    if (metadata.entry.vertex.length !== 1) {
        throw new Error('Shader must have exactly one vertex entry point');
    }
    const vertexFn = metadata.entry.vertex[0]
    const result: ShaderAttribute[] = [];
    vertexFn.inputs
        .filter((input) => input.locationType == 'location') // ignore builtin inputs
        .forEach((input) => {
            if(typeof input.location !== 'number') throw new Error(`Location of shader attribute ${input.name} must be a number`);
            if(!input.type) throw new Error(`Type of shader attribute ${input.name} must be defined`);
            let type = input.type;
            result.push({
                name: input.name,
                location: input.location as number,
                type: {
                    name: type.name,
                    size: type.size
                },
            });
        })
    return result;
}
