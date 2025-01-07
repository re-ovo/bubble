import { ShaderManager } from '@/shader/shader_lib';
import standard from '@/shader/sources/mesh/standard.wgsl?raw';
import { describe, it } from 'vitest';

describe('Shader', () => {
  it('should process shader correctly', () => {
    try {
      const shaderManager = ShaderManager.getInstance();
      const code = shaderManager.process(standard, {});
      console.log(code);
    } catch (e) {
      console.error(e);
    }
  });
});
