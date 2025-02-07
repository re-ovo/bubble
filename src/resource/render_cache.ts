import type RenderContext from '@/pipeline/context';
import {
  RenderTexture,
  type Texture,
  Texture2D,
  TextureDirtyFlag,
} from '@/resource/texture';
import {
  IndexBuffer,
  IndexBufferDirtyFlag,
  VertexAttribute,
  VertexAttributeDirtyFlag,
} from '@/resource/attribute';
import {
  BufferDirtyFlag,
  BufferResource,
  UniformBuffer,
} from '@/resource/buffer';
import type { Shader } from '@/shader/shader';
import { RenderPipelineBuilder } from '@/pipeline/builder/render_pipeline_builder';
import { Material, MaterialBlendMode } from '@/material/material';
import type { Mesh } from '@/mesh/mesh';
import { RendererComponent } from '@/node';
import { TransformDirtyFlag } from '@/core';
import { generateMipmap, numMipLevels } from 'webgpu-utils';

class RenderCache {
  private readonly _context: RenderContext;

  private _vertexBufferCache: WeakMap<
    VertexAttribute | IndexBuffer,
    AllocatedVertexAttribute
  >;
  private _textureCache: WeakMap<Texture, AllocatedTexture>;
  private _bufferCache: WeakMap<BufferResource, AllocatedBuffer>;
  private _shaderCache: WeakMap<Shader, GPUShaderModule>;
  private _bindGroupLayoutCache: WeakMap<Shader, AllocatedLayout>;
  private _renderPipelineCache: WeakMap<Shader, GPURenderPipeline>;
  private _bindGroupsCache: WeakMap<
    Material,
    { groupId: number; groupVal: GPUBindGroup }[]
  >;
  private _uniformBufferCache: WeakMap<Material, Map<string, UniformBuffer>>;
  private _modelBindingDataCache: WeakMap<RendererComponent, UniformBuffer>;

  constructor(context: RenderContext) {
    this._context = context;
    this._vertexBufferCache = new WeakMap();
    this._textureCache = new WeakMap();
    this._bufferCache = new WeakMap();
    this._shaderCache = new WeakMap();
    this._bindGroupLayoutCache = new WeakMap();
    this._renderPipelineCache = new WeakMap();
    this._bindGroupsCache = new WeakMap();
    this._uniformBufferCache = new WeakMap();
    this._modelBindingDataCache = new WeakMap();
  }

  private get device() {
    return this._context.device;
  }

  requestVertexBuffer(
    attribute: VertexAttribute | IndexBuffer,
  ): AllocatedVertexAttribute {
    let allocated = this._vertexBufferCache.get(attribute);
    if (!allocated) {
      const usage =
        attribute instanceof IndexBuffer
          ? GPUBufferUsage.INDEX
          : GPUBufferUsage.VERTEX;
      const buffer = this.device.createBuffer({
        size: attribute.byteLength,
        usage: usage | GPUBufferUsage.COPY_DST,
      });
      allocated = {
        buffer,
        offset: 0,
        size: attribute.byteLength,
        stride: attribute instanceof VertexAttribute ? attribute.itemSize : 0, // only for vertex buffer
      };
      this._vertexBufferCache.set(attribute, allocated);
    }
    if (attribute instanceof VertexAttribute) {
      if (attribute.isDirty(VertexAttributeDirtyFlag.DATA)) {
        this.device.queue.writeBuffer(allocated.buffer, 0, attribute.data);
        attribute.clearDirty(VertexAttributeDirtyFlag.DATA);
      }
    } else {
      if (attribute.isDirty(IndexBufferDirtyFlag.DATA)) {
        this.device.queue.writeBuffer(allocated.buffer, 0, attribute.data);
        attribute.clearDirty(IndexBufferDirtyFlag.DATA);
      }
    }
    return allocated;
  }

  requestTexture(texture: Texture): AllocatedTexture {
    if (texture instanceof Texture2D) {
      return this.allocateTexture2d(texture);
    } else if (texture instanceof RenderTexture) {
      return this.allocateRenderTexture(texture);
    }
    throw new Error('Unsupported texture type: ' + texture);
  }

  private allocateTexture2d(texture2d: Texture2D): AllocatedTexture {
    let allocated = this._textureCache.get(texture2d);
    if (!allocated) {
      const texture = this.device.createTexture({
        size: texture2d.size,
        format: texture2d.format,
        usage:
          GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.COPY_DST |
          GPUTextureUsage.RENDER_ATTACHMENT,
        mipLevelCount: numMipLevels(texture2d.size),
      });
      const view = texture.createView();

      const sampler = this.device.createSampler(texture2d.sampler);
      texture2d.clearDirty(TextureDirtyFlag.SAMPLER);

      allocated = {
        texture,
        view,
        sampler,
      };

      this._textureCache.set(texture2d, allocated);
    }

    if (texture2d.isDirty(TextureDirtyFlag.DATA)) {
      this.device.queue.copyExternalImageToTexture(
        { source: texture2d.data },
        { texture: allocated.texture },
        texture2d.size,
      );
      generateMipmap(this._context.device, allocated.texture);
      texture2d.clearDirty(TextureDirtyFlag.DATA);
    }

    if (texture2d.isDirty(TextureDirtyFlag.SAMPLER)) {
      allocated.sampler = this.device.createSampler(texture2d.sampler);
      texture2d.clearDirty(TextureDirtyFlag.SAMPLER);
    }

    return allocated;
  }

  private allocateRenderTexture(
    renderTexture: RenderTexture,
  ): AllocatedTexture {
    let allocated = this._textureCache.get(renderTexture);
    if (!allocated) {
      const texture = this.device.createTexture({
        size: renderTexture.size,
        format: renderTexture.format,
        usage:
          GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.COPY_SRC |
          GPUTextureUsage.RENDER_ATTACHMENT,
      });
      const view = texture.createView();

      const sampler = this.device.createSampler(renderTexture.sampler);
      renderTexture.clearDirty(TextureDirtyFlag.SAMPLER);

      allocated = {
        texture,
        view,
        sampler,
      };

      this._textureCache.set(renderTexture, allocated);
    }

    if (renderTexture.isDirty(TextureDirtyFlag.SAMPLER)) {
      allocated.sampler = this.device.createSampler(renderTexture.sampler);
      renderTexture.clearDirty(TextureDirtyFlag.SAMPLER);
    }

    return allocated;
  }

  requestBuffer(buffer: BufferResource): AllocatedBuffer {
    let allocated = this._bufferCache.get(buffer);
    if (!allocated) {
      const gpuBuffer = this.device.createBuffer({
        size: buffer.byteLength,
        usage: buffer.usage | GPUBufferUsage.COPY_DST,
      });
      allocated = {
        buffer: gpuBuffer,
        offset: 0,
        size: buffer.byteLength,
      };
      this._bufferCache.set(buffer, allocated);
    }
    if (buffer.isDirty(BufferDirtyFlag.DATA)) {
      this.device.queue.writeBuffer(allocated.buffer, 0, buffer.data);
      buffer.clearDirty(BufferDirtyFlag.DATA);
    }
    return allocated;
  }

  requestShaderModule(shader: Shader): GPUShaderModule {
    let module = this._shaderCache.get(shader);
    if (!module) {
      module = this.device.createShaderModule({
        code: shader.code,
      });
      this._shaderCache.set(shader, module);
    }
    return module;
  }

  requestLayout(shader: Shader): AllocatedLayout {
    let layout = this._bindGroupLayoutCache.get(shader);
    if (!layout) {
      const bindGroupLayouts = shader.bindingGroups.map((group) => {
        return this.device.createBindGroupLayout({
          entries: group.bindings.map((bindingInfo) => {
            return bindingInfo.layout;
          }),
        });
      });
      const pipelineLayout = this.device.createPipelineLayout({
        bindGroupLayouts: bindGroupLayouts,
      });
      layout = {
        bindGroupLayouts,
        pipelineLayout,
      };
      this._bindGroupLayoutCache.set(shader, layout);
    }
    return layout;
  }

  requestRenderPipeline(material: Material, mesh: Mesh): GPURenderPipeline {
    let pipeline = this._renderPipelineCache.get(material.shader);
    if (!pipeline) {
      const layout = this.requestLayout(material.shader).pipelineLayout;
      const blend: GPUBlendState = {
        color: {
          srcFactor: 'src-alpha',
          dstFactor: 'one-minus-src-alpha',
          operation: 'add',
        },
        alpha: {
          srcFactor: 'src-alpha',
          dstFactor: 'one-minus-src-alpha',
          operation: 'add',
        },
      };
      pipeline = new RenderPipelineBuilder()
        .setShader(material.shader)
        .addRenderTarget(this._context.targetFormat, blend)
        .setDepthStencil({
          format: 'depth24plus',
          depthWriteEnabled: material.blendMode === MaterialBlendMode.OPAQUE, // disable depth write for transparent objects
          depthCompare: 'less',
        })
        .setCullMode(material.cullMode)
        .setVertexAttributes(mesh.attributes)
        .setPipelineLayout(layout)
        .build(this._context);
      this._renderPipelineCache.set(material.shader, pipeline);
    }
    return pipeline;
  }

  requestUniformBufferFromMaterial(
    material: Material,
    variableName: string,
  ): UniformBuffer | null {
    let materialBuffers = this._uniformBufferCache.get(material);
    if (!materialBuffers) {
      materialBuffers = new Map();
      this._uniformBufferCache.set(material, materialBuffers);
    }
    let buffer = materialBuffers.get(variableName);
    if (!buffer) {
      const variable = material.shader.uniforms[variableName];
      const value = material.getUniform(variableName);
      if (value === undefined) {
        return null; // no value for this uniform
      }
      buffer = UniformBuffer.ofSize(variable.size);
      buffer.writeStructuredData(value, variable);
      materialBuffers.set(variableName, buffer);
    }
    return buffer;
  }

  requestBindGroup(
    renderer: RendererComponent,
    cameraProperties: UniformBuffer,
  ): { groupId: number; groupVal: GPUBindGroup }[] {
    const material = renderer.material;

    let bindGroups = this._bindGroupsCache.get(material);

    const groupDesc = material.shader.bindingGroups.map(
      (groupMeta, groupIndex) => {
        return {
          groupId: groupIndex,
          groupVal: groupMeta.bindings.map((bindingMeta, bindingIndex) => {
            const bindingVarName = bindingMeta.name;
            let resource: GPUBindingResource;
            if (bindingMeta.type.startsWith('texture')) {
              resource = this.requestTexture(
                material.getTexture(bindingVarName),
              ).view;
            } else if (bindingMeta.type.startsWith('sampler')) {
              const textureName = bindingVarName.slice(0, -7); // remove 'Sampler' suffix
              resource = this.requestTexture(
                material.getTexture(textureName),
              ).sampler;
            } else if (bindingVarName === 'modelInfo') {
              resource = this.requestBuffer(
                this._requestModelBindingData(renderer),
              );
            } else {
              // buffer (uniform, storage)
              let uniformBuffer = this.requestUniformBufferFromMaterial(
                material,
                bindingVarName,
              );
              if (!uniformBuffer && bindingVarName === 'camera') {
                uniformBuffer = cameraProperties;
              }
              if (!uniformBuffer)
                throw new Error(`No buffer found for ${bindingVarName}`);
              resource = this.requestBuffer(uniformBuffer);
            }
            return {
              binding: bindingIndex,
              resource: resource,
            };
          }),
        };
      },
    );

    if (!bindGroups) {
      const allocatedLayout = this.requestLayout(material.shader);
      bindGroups = groupDesc.map((group) => {
        return {
          groupId: group.groupId,
          groupVal: this.device.createBindGroup({
            layout: allocatedLayout.bindGroupLayouts[group.groupId],
            entries: group.groupVal.map((binding) => {
              return {
                binding: binding.binding,
                resource: binding.resource,
              };
            }),
          }),
        };
      });
      this._bindGroupsCache.set(material, bindGroups);
    }

    return bindGroups;
  }

  private _requestModelBindingData(renderer: RendererComponent): UniformBuffer {
    const transform = renderer.entity.transform;
    let data = this._modelBindingDataCache.get(renderer);
    if (!data) {
      const variable = renderer.material.shader.uniforms['modelInfo'];
      const uniformBuffer = UniformBuffer.ofSize(variable.size);
      this._modelBindingDataCache.set(renderer, uniformBuffer);
      data = uniformBuffer;
    }
    if (transform.isDirty(TransformDirtyFlag.UPLOAD_DATA)) {
      const variable = renderer.material.shader.uniforms['modelInfo'];
      data.writeStructuredData(
        {
          modelMatrix: transform.transformMatrix,
          modelMatrixInverse: transform.transformMatrixInverse,
        },
        variable,
      );
      transform.clearDirty(TransformDirtyFlag.UPLOAD_DATA);
    }
    return data;
  }
}

export default RenderCache;

export type AllocatedTexture = {
  texture: GPUTexture;
  view: GPUTextureView;
  sampler: GPUSampler;
};

export type AllocatedVertexAttribute = {
  buffer: GPUBuffer;
  offset: number;
  size: number;
  stride: number; // only for vertex buffer
};

export type AllocatedBuffer = {
  buffer: GPUBuffer;
  offset: number;
  size: number;
};

export type AllocatedLayout = {
  bindGroupLayouts: GPUBindGroupLayout[];
  pipelineLayout: GPUPipelineLayout;
};
