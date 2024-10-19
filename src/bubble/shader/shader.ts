import {TemplateInfo, TypeInfo, VariableInfo, WgslReflect} from "wgsl_reflect";
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
    private _attributes: ShaderAttributeMetadata[] = [];
    private _bindingGroups: BindingGroupMetadata[] = [];

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
        this._bindingGroups = computeBindingGroups(this._metadata);
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

    get attributes(): ShaderAttributeMetadata[] {
        return this._attributes;
    }

    get bindingGroups(): BindingGroupMetadata[] {
        return this._bindingGroups;
    }
}

export interface ShaderAttributeMetadata {
    name: string;
    location: number;
    type: {
        name: string;
        size: number;
    },
    attributeDesc: GPUVertexAttribute
}

// 代表一个绑定组的元数据
export interface BindingGroupMetadata {
    bindings: BindingGroupEntryMetadata[],
}

export interface BindingGroupEntryMetadata {
    name: string;
    binding: number;
    // layout: GPUBindGroupLayoutEntry;
}

function computeShaderAttribute(metadata: WgslReflect): ShaderAttributeMetadata[] {
    if (metadata.entry.vertex.length !== 1) {
        throw new Error('Shader must have exactly one vertex entry point');
    }
    const vertexFn = metadata.entry.vertex[0]
    const result: ShaderAttributeMetadata[] = [];
    vertexFn.inputs
        .filter((input) => input.locationType == 'location') // ignore builtin inputs
        .forEach((input) => {
            if (typeof input.location !== 'number') throw new Error(`Location of shader attribute ${input.name} must be a number`);
            if (!input.type) throw new Error(`Type of shader attribute ${input.name} must be defined`);
            let type = input.type;
            result.push({
                name: input.name,
                location: input.location as number,
                type: {
                    name: type.name,
                    size: type.size
                },
                attributeDesc: {
                    shaderLocation: input.location,
                    offset: 0,
                    format: assumeGPUVertexFormat(type)
                }
            });
        })
    return result;
}

function assumeGPUVertexFormat(type: TemplateInfo | TypeInfo): GPUVertexFormat {
    let typeHint = type.name
    if (type instanceof TemplateInfo && type.format) {
        typeHint += `<${type.format.name}>`
    }
    switch (typeHint) {
        case 'f32':
            return 'float32';
        case 'vec2<f32>':
            return 'float32x2';
        case 'vec3<f32>':
            return 'float32x3';
        case 'vec4<f32>':
            return 'float32x4';
        case 'u32':
            return 'uint32';
        case 'vec2<u32>':
            return 'uint32x2';
        case 'vec3<u32>':
            return 'uint32x3';
        case 'vec4<u32>':
            return 'uint32x4';
        case 'i32':
            return 'sint32';
        case 'vec2<i32>':
            return 'sint32x2';
        case 'vec3<i32>':
            return 'sint32x3';
        case 'vec4<i32>':
            return 'sint32x4';
        default:
            throw new Error(`Unsupported type ${typeHint}`);
    }
}

function computeBindingGroups(metadata: WgslReflect): BindingGroupMetadata[] {
    const result: BindingGroupMetadata[] = [];

    metadata.getBindGroups().forEach((group) => {
        group.forEach((entry) => {
            // generate binding group metadata
            let groupIndex = entry.group
            if (!result[groupIndex]) {
                result[groupIndex] = {bindings: []}
            }

            // generate binding entry metadata
            let groupMetadata = result[groupIndex]
            let bindingIndex = entry.binding
            groupMetadata.bindings[bindingIndex] = {
                name: entry.name,
                binding: bindingIndex,
            }
            // TODO: Maybe reflect more layout information?
        })
    })

    return result;
}

function isInStage(stages: GPUShaderStageFlags, stage: GPUFlagsConstant): boolean {
    return (stages & stage) === stage;
}

function findUsageStage(metadata: WgslReflect, v: VariableInfo): GPUShaderStageFlags {
    let usage: GPUShaderStageFlags = 0;
    if (metadata.entry.vertex.some((fn) => fn.resources.includes(v))) {
        usage |= GPUShaderStage.VERTEX;
    }
    if (metadata.entry.fragment.some((fn) => fn.resources.includes(v))) {
        usage |= GPUShaderStage.FRAGMENT;
    }
    if (metadata.entry.compute.some((fn) => fn.resources.includes(v))) {
        usage |= GPUShaderStage.COMPUTE;
    }
    // console.log(`Usage of ${v.name}: ${usage} (vertex: ${isInStage(usage, GPUShaderStage.VERTEX)}, fragment: ${isInStage(usage, GPUShaderStage.FRAGMENT)}, compute: ${isInStage(usage, GPUShaderStage.COMPUTE)})`)
    return usage;
}
