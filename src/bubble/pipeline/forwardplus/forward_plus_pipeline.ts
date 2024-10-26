import {ScriptablePipeline} from "@/bubble/pipeline/pipeline";
import type {Camera} from "@/bubble/node/camera/camera";
import type {RenderContext} from "@/bubble/pipeline/context";
import {MeshRendererComponent} from "@/bubble/node/renderer/mesh_renderer";
import {Material} from "@/bubble/node/material/material";
import type {Entity} from "@/bubble/core/system";

export class ForwardPlusPipeline extends ScriptablePipeline {
    render(context: RenderContext, cameras: Camera[]): void {
        for (let i = 0; i < cameras.length; i++) {
            this.renderCamera(context, cameras[i]);
        }
        context.submit();
    }

    dispose(): void {
    }

    depthTexture: GPUTexture | null = null;

    renderCamera(context: RenderContext, camera: Camera): void {
        context.setupCamera(camera);

        if (!this.depthTexture) {
            this.depthTexture = context.device.createTexture({
                size: context.targetSize,
                format: 'depth24plus',
                usage: GPUTextureUsage.RENDER_ATTACHMENT
            })
        }
        if(this.depthTexture.width != context.targetSize.width || this.depthTexture.height != context.targetSize.height) {
            this.depthTexture.destroy();
            this.depthTexture = context.device.createTexture({
                size: context.targetSize,
                format: 'depth24plus',
                usage: GPUTextureUsage.RENDER_ATTACHMENT
            })
        }

        context.beginRenderPass({
            colorAttachments: [{
                view: context.target,
                loadOp: 'clear',
                storeOp: 'store',
            }],
            depthStencilAttachment: {
                view: this.depthTexture.createView(),
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
                depthClearValue: 1.0
            }
        });

        this.renderEntities(context, context.scene.objects);

        context.endRenderPass();
    }

    renderEntities(context: RenderContext, entities: Entity[]) {
        // render opaque first
        entities.forEach((entity) => {
            let renderer = entity.getComponent(MeshRendererComponent);
            if (renderer && renderer.material?.blendMode == 'OPAQUE') {
                this.renderMeshRenderer(context, renderer);
            }
        })

        // render transparent
        entities.forEach((entity) => {
            let renderer = entity.getComponent(MeshRendererComponent);
            if (renderer && renderer.material?.blendMode != 'OPAQUE') {
                this.renderMeshRenderer(context, renderer);
            }
        })
    }

    pipeline: Map<GPUShaderModule, {
        pipeline: GPURenderPipeline,
        bindingGroupLayouts: GPUBindGroupLayout[],
    }> = new Map();

    bindGroups: Map<Material, GPUBindGroup[]> = new Map();

    renderMeshRenderer(context: RenderContext, renderer: MeshRendererComponent) {
        let mesh = renderer.mesh!;
        let material = renderer.material!;
        let passEncoder = context.renderPassEncoder;

        const {module: shaderModule} = context.resourceManager.syncShader(material.shader);

        const vertexBufferLayouts: GPUVertexBufferLayout[] = material.shader.attributes
            .map((attribute) => {
                return {
                    arrayStride: attribute.type.size,
                    attributes: [{
                        format: attribute.attributeDesc.format,
                        shaderLocation: attribute.location,
                        offset: 0,
                    }],
                }
            })

        let pipelineCache = this.pipeline.get(shaderModule);
        if (!pipelineCache) {
            const layouts: GPUBindGroupLayout[] = material.shader.bindingGroups.map(group => {
                return context.device.createBindGroupLayout({
                    entries: group.bindings.map(binding => {
                        return binding.layout
                    })
                })
            })
            const pipeline = context.device.createRenderPipeline({
                layout: context.device.createPipelineLayout({
                    bindGroupLayouts: layouts
                }),
                vertex: {
                    module: shaderModule,
                    buffers: vertexBufferLayouts,
                },
                fragment: {
                    module: shaderModule,
                    targets: [{
                        format: context.targetFormat,
                        blend: {
                            color: {
                                srcFactor: 'src-alpha',
                                dstFactor: 'one-minus-src-alpha',
                                operation: 'add',
                            },
                            alpha: {
                                srcFactor: 'one',
                                dstFactor: 'one',
                                operation: 'add',
                            }
                        }
                    }]
                },
                primitive: {
                    topology: 'triangle-list',
                    cullMode: material.doubleSided ? 'none' : 'back',
                },
                depthStencil: {
                    depthWriteEnabled: material.blendMode == 'OPAQUE',
                    depthCompare: 'less',
                    format: 'depth24plus',
                },
            })
            pipelineCache = {
                pipeline,
                bindingGroupLayouts: layouts,
            }
            this.pipeline.set(shaderModule, pipelineCache);
        }

        // setup pipeline
        passEncoder.setPipeline(pipelineCache.pipeline);

        // setup attributes
        material.shader.attributes.forEach((attributeMeta) => {
            if (!mesh.attributes.has(attributeMeta.name)) {
                console.warn(`Attribute ${attributeMeta.name} not found in mesh`);
            }
            const buffer = context.resourceManager.syncBuffer(mesh.attributes.get(attributeMeta.name)!)
            passEncoder.setVertexBuffer(attributeMeta.location, buffer.buffer)
        })

        // setup binding resource
        let bindGroups = this.bindGroups.get(material);
        const bindGroupDescs: GPUBindGroupDescriptor[] = material.shader.bindingGroups.map((bindingGroup, index) => {
            return {
                layout: pipelineCache.bindingGroupLayouts[index],
                entries: bindingGroup.bindings.map((bindingMeta) => {
                    if (bindingMeta.name == 'camera') {
                        return {
                            binding: bindingMeta.binding,
                            resource: context.resourceManager.syncBuffer(context.cameraBuffer),
                        }
                    }
                    if (bindingMeta.name == "modelInfo") {
                        return {
                            binding: bindingMeta.binding,
                            resource: context.resourceManager.syncBuffer(context.setupModel(renderer.entity!)),
                        }
                    }

                    // 其实这里也可能是贴图/Sampler之类的
                    const type = bindingMeta.type
                    switch (type) {
                        case 'sampler': {
                            const sampleName = bindingMeta.name.slice(0, -7) // remove 'Sampler'
                            const textureResource = material.textures.get(sampleName)
                            if (!textureResource) {
                                throw new Error(`Texture ${sampleName} not found in material`);
                            }
                            return {
                                binding: bindingMeta.binding,
                                resource: context.resourceManager.syncTexture(textureResource).sampler,
                            }
                        }

                        case 'texture_2d': {
                            const textureResource = material.textures.get(bindingMeta.name)
                            if (!textureResource) {
                                throw new Error(`Texture ${bindingMeta.name} not found in material`);
                            }
                            return {
                                binding: bindingMeta.binding,
                                resource: context.resourceManager.syncTexture(textureResource).view,
                            }
                        }
                        default: {
                            const bufferResource = material.buffers.get(bindingMeta.name)
                            if (!bufferResource) {
                                throw new Error(`Buffer ${bindingMeta.name} not found in material`);
                            }
                            return {
                                binding: bindingMeta.binding,
                                resource: context.resourceManager.syncBuffer(bufferResource),
                            }
                        }
                    }
                })
            }
        })
        if(!bindGroups) {
            bindGroups = bindGroupDescs.map((desc) => {
                return context.device.createBindGroup(desc)
            })
            this.bindGroups.set(material, bindGroups)
        }
        bindGroups.forEach((bindGroup, index) => {
            passEncoder.setBindGroup(index, bindGroup);
        })

        // draw
        if (mesh.indices) {
            const buffer = context.resourceManager.syncBuffer(mesh.indices)
            passEncoder.setIndexBuffer(buffer.buffer, 'uint16', buffer.offset, buffer.size)
            passEncoder.drawIndexed(mesh.drawCount)
        } else {
            passEncoder.draw(mesh.drawCount)
        }
    }
}
