import {
  TemplateInfo,
  TypeInfo,
  VariableInfo,
  WgslReflect,
} from 'wgsl_reflect';
import { providerWGSLCounterScope } from '@/utils/binding_counter';
import {
  makeShaderDataDefinitions,
  type VariableDefinitions,
} from 'webgpu-utils';

/**
 * Shader source provider
 */
export type ShaderSourceProvider =
  | string
  | ((params: Record<any, any>) => string);

export class Shader {
  private _provider: ShaderSourceProvider;
  private readonly _definitions: Record<string, any> = {}; // macro definitions

  private _code: string = ''; // evaluated shader code

  private _metadata: WgslReflect | null = null;
  private _attributes: ShaderAttributeMetadata[] = [];
  private _bindingGroups: BindingGroupMetadata[] = [];
  private _uniforms: VariableDefinitions = {};
  private _storages: VariableDefinitions = {};

  constructor(
    sourceProvider: ShaderSourceProvider,
    params: Record<string, any> = {},
  ) {
    this._provider = sourceProvider;
    this._definitions = params;
    this.evaluate();
  }

  addDefinition(key: string, value: any) {
    this._definitions[key] = value;
    this.evaluate();
  }

  setShaderSourceProvider(provider: ShaderSourceProvider) {
    this._provider = provider;
    this.evaluate();
  }

  evaluate() {
    const source = providerWGSLCounterScope(() => {
      return typeof this._provider === 'function'
        ? this._provider(this._definitions)
        : this._provider;
    });
    this._code = source;
    this._metadata = new WgslReflect(source);
    this._attributes = computeShaderAttribute(this._metadata);
    this._bindingGroups = computeBindingGroups(this._metadata);
    const shaderData = makeShaderDataDefinitions(this._code);
    this._uniforms = shaderData.uniforms;
    this._storages = shaderData.storages;
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
    return this._metadata;
  }

  get attributes(): ShaderAttributeMetadata[] {
    return this._attributes;
  }

  get bindingGroups(): BindingGroupMetadata[] {
    return this._bindingGroups;
  }

  get uniforms(): VariableDefinitions {
    return this._uniforms;
  }

  get storages(): VariableDefinitions {
    return this._storages;
  }

  get uniformByteLength(): number {
    return Object.values(this._uniforms).reduce((acc, v) => acc + v.size, 0);
  }
}

export interface ShaderAttributeMetadata {
  name: string;
  location: number;
  type: {
    name: string;
    size: number;
  };
  attributeDesc: GPUVertexAttribute;
}

// 代表一个绑定组的元数据
export interface BindingGroupMetadata {
  bindings: BindingGroupEntryMetadata[];
}

export interface BindingGroupEntryMetadata {
  name: string;
  binding: number;
  type: string;
  layout: GPUBindGroupLayoutEntry;
}

function computeShaderAttribute(
  metadata: WgslReflect,
): ShaderAttributeMetadata[] {
  if (metadata.entry.vertex.length !== 1) {
    throw new Error('Shader must have exactly one vertex entry point');
  }
  const vertexFn = metadata.entry.vertex[0];
  const result: ShaderAttributeMetadata[] = [];
  vertexFn.inputs
    .filter((input) => input.locationType == 'location') // ignore builtin inputs
    .forEach((input) => {
      if (typeof input.location !== 'number')
        throw new Error(
          `Location of shader attribute ${input.name} must be a number`,
        );
      if (!input.type)
        throw new Error(
          `Type of shader attribute ${input.name} must be defined`,
        );
      let type = input.type;
      result.push({
        name: input.name,
        location: input.location as number,
        type: {
          name: type.name,
          size: type.size,
        },
        attributeDesc: {
          shaderLocation: input.location,
          offset: 0,
          format: assumeGPUVertexFormat(type),
        },
      });
    });
  return result;
}

function assumeGPUVertexFormat(type: TemplateInfo | TypeInfo): GPUVertexFormat {
  let typeHint = type.name;
  if (type instanceof TemplateInfo && type.format) {
    typeHint += `<${type.format.name}>`;
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
    case 'vec2f':
      return 'float32x2';
    case 'vec3f':
      return 'float32x3';
    case 'vec4f':
      return 'float32x4';
    case 'u32':
      return 'uint32';
    case 'vec2<u32>':
      return 'uint32x2';
    case 'vec3<u32>':
      return 'uint32x3';
    case 'vec4<u32>':
      return 'uint32x4';
    case 'vec2u':
      return 'uint32x2';
    case 'vec3u':
      return 'uint32x3';
    case 'vec4u':
      return 'uint32x4';
    case 'i32':
      return 'sint32';
    case 'vec2<i32>':
      return 'sint32x2';
    case 'vec3<i32>':
      return 'sint32x3';
    case 'vec4<i32>':
      return 'sint32x4';
    case 'vec2i':
      return 'sint32x2';
    case 'vec3i':
      return 'sint32x3';
    case 'vec4i':
      return 'sint32x4';
    default:
      throw new Error(`Unsupported type ${typeHint}`);
  }
}

function computeBindingGroups(metadata: WgslReflect): BindingGroupMetadata[] {
  const result: BindingGroupMetadata[] = [];

  metadata.getBindGroups().forEach((group) => {
    group.forEach((variable) => {
      // generate binding group metadata
      let groupIndex = variable.group;
      if (!result[groupIndex]) {
        result[groupIndex] = { bindings: [] };
      }

      // generate binding entry metadata
      let groupMetadata = result[groupIndex];
      let bindingIndex = variable.binding;
      let type = variable.type.name;
      let layout: GPUBindGroupLayoutEntry = {
        binding: bindingIndex,
        visibility: findUsageStage(metadata, variable),
      };
      inferBindingResourceType(metadata, variable, layout);
      groupMetadata.bindings[bindingIndex] = {
        name: variable.name,
        binding: bindingIndex,
        type: type,
        layout: layout,
      };
    });
  });

  return result;
}

function isInStage(
  stages: GPUShaderStageFlags,
  stage: GPUFlagsConstant,
): boolean {
  return (stages & stage) === stage;
}

function findUsageStage(
  metadata: WgslReflect,
  v: VariableInfo,
): GPUShaderStageFlags {
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

function inferBindingResourceType(
  metadata: WgslReflect,
  variableInfo: VariableInfo,
  entry: GPUBindGroupLayoutEntry,
) {
  const typeName = variableInfo.type.name;

  if (typeName === 'texture_2d') {
    entry.texture = {};
    return;
  }
  if (variableInfo.type.name === 'sampler') {
    entry.sampler = {};
    return;
  }

  // still not match, so it's a buffer
  entry.buffer = {
    type: metadata.uniforms.find((uni) => uni.name === variableInfo.name)
      ? 'uniform'
      : 'storage',
  };
}
