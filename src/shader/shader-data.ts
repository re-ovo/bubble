import { Texture } from '@/resource';

interface ShaderTextureData {
  setTexture(name: string, texture: Texture): void;

  getTexture(name: string): Texture | undefined;

  hasTexture(name: string): boolean;

  removeTexture(name: string): void;

  getTextures(): Map<string, Texture>;
}

interface ShaderUniformData {
  setUniform(name: string, value: any): void;

  getUniform(name: string): any;

  hasUniform(name: string): boolean;

  removeUniform(name: string): void;

  getUniforms(): Map<string, any>;
}

interface ShaderDefinitionData {
  addDefinition(name: string, definition: string): void;

  removeDefinition(name: string): void;
}

export type ShaderData = ShaderTextureData &
  ShaderUniformData &
  ShaderDefinitionData;

export function createShaderData(): ShaderData {
  const textures = new Map<string, Texture>();
  const uniforms = new Map<string, any>();
  const definitions = new Map<string, string>();

  return Object.freeze({
    setTexture: (name: string, texture: Texture) => {
      textures.set(name, texture);
    },
    getTexture: (name: string): Texture | undefined => {
      return textures.get(name);
    },
    hasTexture: (name: string) => {
      return textures.has(name);
    },
    removeTexture: (name: string) => {
      textures.delete(name);
    },
    getTextures: () => {
      return textures;
    },
    setUniform: (name: string, value: any) => {
      uniforms.set(name, value);
    },
    getUniform: (name: string) => {
      return uniforms.get(name);
    },
    hasUniform: (name: string) => {
      return uniforms.has(name);
    },
    removeUniform: (name: string) => {
      uniforms.delete(name);
    },
    getUniforms: () => {
      return uniforms;
    },
    addDefinition: (name: string, definition: string) => {
      definitions.set(name, definition);
    },
    removeDefinition: (name: string) => {
      definitions.delete(name);
    },
  });
}
