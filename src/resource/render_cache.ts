import type RenderContext from "@/pipeline/context";
import {type Texture, Texture2D, TextureDirtyFlag} from "@/resource/texture";
import {numMipLevels} from "webgpu-utils";
import {IndexBuffer, IndexBufferDirtyFlag, VertexAttribute, VertexAttributeDirtyFlag} from "@/resource/attribute";
import {BufferDirtyFlag, BufferResource, UniformBuffer} from "@/resource/buffer";
import type {Shader} from "@/shader/shader";
import {RenderPipelineBuilder} from "@/pipeline/builder/render_pipeline_builder";
import type {Material} from "@/node/material/material";
import type {Mesh} from "@/node/mesh/mesh";

class RenderCache {
    private _context: RenderContext;

    private _vertexBufferCache: WeakMap<VertexAttribute | IndexBuffer, AllocatedVertexAttribute>;
    private _textureCache: WeakMap<Texture, AllocatedTexture>;
    private _bufferCache: WeakMap<BufferResource, AllocatedBuffer>;
    private _shaderCache: WeakMap<Shader, GPUShaderModule>;
    private _bindGroupLayoutCache: WeakMap<Shader, AllocatedLayout>;
    private _renderPipelineCache: WeakMap<Shader, GPURenderPipeline>;
    private _bindGroupsCache: WeakMap<Material, {groupId: number, groupVal: GPUBindGroup}[]>;
    private _uniformBufferCache: WeakMap<Material, Map<string, UniformBuffer>>;

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
    }

    private get device() {
        return this._context.device
    }

    requestVertexBuffer(attribute: VertexAttribute | IndexBuffer): AllocatedVertexAttribute {
        let allocated = this._vertexBufferCache.get(attribute);
        if (!allocated) {
            const usage = attribute instanceof IndexBuffer ? GPUBufferUsage.INDEX : GPUBufferUsage.VERTEX;
            const buffer = this.device.createBuffer({
                size: attribute.data.byteLength,
                usage: usage | GPUBufferUsage.COPY_DST,
            });
            allocated = {
                buffer,
                offset: 0,
                size: attribute.data.byteLength,
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
            if (attribute.isDirty(IndexBufferDirtyFlag.COUNT)) {
                allocated.size = attribute.count;
                attribute.clearDirty(IndexBufferDirtyFlag.COUNT);
            }
        }
        return allocated;
    }

    requestTexture(texture: Texture): AllocatedTexture {
        if (texture instanceof Texture2D) {
            return this.allocateTexture2d(texture);
        }
        throw new Error('Unsupported texture type: ' + texture);
    }

    private allocateTexture2d(texture2d: Texture2D): AllocatedTexture {
        let allocated = this._textureCache.get(texture2d);
        if (!allocated) {
            const texture = this.device.createTexture({
                size: texture2d.size,
                format: texture2d.format,
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
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
            this.device.queue.copyExternalImageToTexture({source: texture2d.data}, {texture: allocated.texture}, texture2d.size);
            texture2d.clearDirty(TextureDirtyFlag.DATA);
        }

        if (texture2d.isDirty(TextureDirtyFlag.SAMPLER)) {
            allocated.sampler = this.device.createSampler(texture2d.sampler);
            texture2d.clearDirty(TextureDirtyFlag.SAMPLER);
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
                size: buffer.data.byteLength,
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
                        return bindingInfo.layout
                    })
                });
            });
            const pipelineLayout = this.device.createPipelineLayout({
                bindGroupLayouts: bindGroupLayouts,
            })
            layout = {
                bindGroupLayouts,
                pipelineLayout,
            };
            this._bindGroupLayoutCache.set(shader, layout);
        }
        return layout;
    }

    requestRenderPipeline(
        material: Material,
        mesh: Mesh,
    ): GPURenderPipeline {
        let pipeline = this._renderPipelineCache.get(material.shader);
        if (!pipeline) {
            const layout = this.requestLayout(material.shader).pipelineLayout;
            pipeline = new RenderPipelineBuilder()
                .setShader(material.shader)
                .addRenderTarget(this._context.targetFormat)
                .addRenderTarget('depth24plus')
                .setCullMode(material.cullMode)
                .setVertexAttributes(mesh.attributes)
                .setPipelineLayout(layout)
                .build(this._context);
            this._renderPipelineCache.set(
                material.shader,
                pipeline
            );
        }
        return pipeline;
    }

    requestUniformBufferFromMaterial(
        material: Material,
        variableName: string,
    ): UniformBuffer {
        let materialBuffers = this._uniformBufferCache.get(material);
        if(!materialBuffers) {
            materialBuffers = new Map();
            this._uniformBufferCache.set(material, materialBuffers);
        }
        let buffer = materialBuffers.get(variableName);
        if(!buffer) {
            const variable = material.shader.uniforms[variableName];
            const value = material.getUniform(variableName);
            buffer = UniformBuffer.ofSize(variable.size);
            buffer.writeStructuredData(value, variable);
            materialBuffers.set(variableName, buffer);
        }
        return buffer;
    }

    requestBindGroup(
        material: Material,
    ): {groupId: number, groupVal: GPUBindGroup}[] {
        let bindGroups = this._bindGroupsCache.get(material);
        if (!bindGroups) {
            const allocatedLayout = this.requestLayout(material.shader);
            bindGroups = material.shader.bindingGroups.map((groupMeta, groupIndex) => {
                return {
                    groupId: groupIndex,
                    groupVal: this.device.createBindGroup({
                        layout: allocatedLayout.bindGroupLayouts[groupIndex],
                        entries: groupMeta.bindings.map((bindingMeta, bindingIndex) => {
                            const bindingVarName = bindingMeta.name
                            let resource: GPUBindingResource
                            if (bindingMeta.type.startsWith('texture')) {
                                resource = this.requestTexture(material.getTexture(bindingVarName)).view
                            } else if (bindingMeta.type.startsWith('sampler')) {
                                const textureName = bindingVarName.slice(0, -7) // remove 'Sampler' suffix
                                resource = this.requestTexture(material.getTexture(textureName)).sampler
                            } else {
                                // buffer (uniform, storage)
                                const uniformBuffer = this.requestUniformBufferFromMaterial(material, bindingVarName)
                                resource = this.requestBuffer(uniformBuffer)
                            }
                            return {
                                binding: bindingIndex,
                                resource: resource,
                            }
                        })
                    })
                }
            })
            this._bindGroupsCache.set(material, bindGroups);
        }
        return bindGroups;
    }
}

export default RenderCache;

export type AllocatedTexture = {
    texture: GPUTexture,
    view: GPUTextureView,
    sampler: GPUSampler,
}

export type AllocatedVertexAttribute = {
    buffer: GPUBuffer,
    offset: number,
    size: number,
    stride: number, // only for vertex buffer
}

export type AllocatedBuffer = {
    buffer: GPUBuffer,
    offset: number,
    size: number,
}

export type AllocatedLayout = {
    bindGroupLayouts: GPUBindGroupLayout[],
    pipelineLayout: GPUPipelineLayout,
}
