import type { Texture } from '@/resource/texture';
import { createShaderData, ShaderData } from '@/shader/shader-data';
import { ShaderSource } from '@/shader/shader_source';
import {
  createRenderState,
  MaterialBlendMode,
  RenderState,
} from './render_state';

/**
 * Material基类
 */
export class Material {
  readonly shaderSource: ShaderSource;
  readonly shaderData: ShaderData;
  readonly renderState: RenderState;

  constructor(shader: ShaderSource) {
    this.shaderSource = shader;
    this.shaderData = createShaderData();
    this.renderState = createRenderState();
  }

  setTexture(variableName: string, texture: Texture) {
    this.shaderData.setTexture(variableName, texture);
  }

  getTexture(name: string): Texture {
    let tex = this.shaderData.getTexture(name);
    if (tex) {
      return tex;
    }
    throw new Error(`Texture ${name} not found.`);
  }

  hasTexture(name: string): boolean {
    return this.shaderData.hasTexture(name);
  }

  removeTexture(name: string) {
    this.shaderData.removeTexture(name);
  }

  setUniform(name: string, value: any) {
    this.shaderData.setUniform(name, value);
  }

  getUniform(name: string): any {
    let uniform = this.shaderData.getUniform(name);
    if (uniform) {
      return uniform;
    }
    return undefined;
  }

  hasUniform(name: string): boolean {
    return this.shaderData.hasUniform(name);
  }

  removeUniform(name: string) {
    this.shaderData.removeUniform(name);
  }

  get cullMode(): GPUCullMode {
    return this.renderState.cullMode;
  }

  set cullMode(value: GPUCullMode) {
    this.renderState.cullMode = value;
  }

  get blendMode(): MaterialBlendMode {
    return this.renderState.blendMode;
  }

  set blendMode(value: MaterialBlendMode) {
    this.renderState.blendMode = value;
  }
}
