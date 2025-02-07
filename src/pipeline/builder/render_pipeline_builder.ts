import type { Shader } from '@/shader/shader';
import { uuid_v4 } from '@/math/maths';
import type { VertexAttribute } from '@/resource/attribute';
import RenderContext from '@/pipeline/context';
import { c } from 'vite/dist/node/types.d-aGj9QkWt';

export class RenderPipelineBuilder {
  private _label: string;

  private _shader: Shader | null = null;
  private _vertexBuffers: GPUVertexBufferLayout[] = [];
  private _fragmentTargets: GPUColorTargetState[] = [];
  private _pipelineLayout: GPUPipelineLayout | null = null;

  // primitive state
  private _primitive: GPUPrimitiveState = {};

  // depth stencil state
  private _depthStencil: GPUDepthStencilState | undefined;

  constructor(label?: string) {
    this._label = label ?? `RenderPipeline[${uuid_v4()}]`;
  }

  setLabel(label: string) {
    this._label = label;
    return this;
  }

  setShader(shader: Shader) {
    this._shader = shader;
    return this;
  }

  addRenderTarget(format: GPUTextureFormat, blend?: GPUBlendState) {
    this._fragmentTargets.push({
      format,
      blend,
    });
    return this;
  }

  setVertexAttribute(name: string, buffer: VertexAttribute) {
    if (!this._shader) {
      throw new Error('Shader is not set');
    }

    // Find the attribute in the shader, make sure it exists (avoid runtime errors)
    const reflectionAttribute = this._shader.attributes.find(
      (attribute) => attribute.name === name,
    );

    if (reflectionAttribute) {
      // Each attribute is a vertex buffer, maybe we can merge them into one buffer in the future
      this._vertexBuffers[reflectionAttribute.location] = {
        arrayStride: buffer.stride,
        stepMode: buffer.stepMode,
        attributes: [reflectionAttribute.attributeDesc],
      };
    } else {
      console.warn(`Attribute ${name} not found in shader`);
    }
    return this;
  }

  setVertexAttributes(attributes: Map<string, VertexAttribute>) {
    attributes.forEach((buffer, name) => {
      this.setVertexAttribute(name, buffer);
    });
    return this;
  }

  setCullMode(cullMode: GPUCullMode) {
    this._primitive.cullMode = cullMode;
    return this;
  }

  setFrontFace(frontFace: GPUFrontFace) {
    this._primitive.frontFace = frontFace;
    return this;
  }

  setPolygonMode(topology: GPUPrimitiveTopology) {
    this._primitive.topology = topology;
    return this;
  }

  setDepthStencil(depthStencil: GPUDepthStencilState) {
    this._depthStencil = depthStencil;
    return this;
  }

  setPipelineLayout(pipelineLayout: GPUPipelineLayout) {
    this._pipelineLayout = pipelineLayout;
    return this;
  }

  build(context: RenderContext): GPURenderPipeline {
    if (!this._shader) {
      throw new Error('Shader is not set');
    }
    if (this._fragmentTargets.length === 0) {
      throw new Error('No render target is set');
    }
    if (this._vertexBuffers.length === 0) {
      throw new Error('No vertex buffer is set');
    }
    if (this._vertexBuffers.find((buffer) => !buffer)) {
      throw new Error('Some vertex buffer is missing: ' + this._vertexBuffers);
    }
    if (!this._pipelineLayout) {
      throw new Error('Pipeline layout is not set');
    }
    const shaderModule = context.renderCache.requestShaderModule(this._shader);
    const descriptor: GPURenderPipelineDescriptor = {
      label: this._label,
      vertex: {
        module: shaderModule,
        buffers: this._vertexBuffers,
      },
      fragment: {
        module: shaderModule,
        targets: this._fragmentTargets,
      },
      layout: this._pipelineLayout,
      primitive: this._primitive,
      depthStencil: this._depthStencil,
    };
    // console.log(descriptor);
    return context.device.createRenderPipeline(descriptor);
  }
}
