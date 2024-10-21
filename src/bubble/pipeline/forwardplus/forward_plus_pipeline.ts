import {ScriptablePipeline} from "@/bubble/pipeline/pipeline";
import type {Camera} from "@/bubble/node/camera/camera";
import type {RenderContext} from "@/bubble/pipeline/context";
import {RendererComponent} from "@/bubble/node/renderer/renderer";
import {MeshRendererComponent} from "@/bubble/node/renderer/mesh_renderer";

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

        context.scene.objects.forEach((object) => {
            let renderer = object.getComponent(RendererComponent);
            if (renderer) {
                this.renderEntity(context, renderer);
            }
        })

        context.endRenderPass();
        context.submit();
    }

    renderEntity(
        context: RenderContext,
        renderer: RendererComponent,
    ) {
        if (renderer instanceof MeshRendererComponent) {
            this.renderMeshRenderer(context, renderer);
        }
    }

    pipeline: GPURenderPipeline | null = null;

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

        if (!this.pipeline) {
            this.pipeline = context.device.createRenderPipeline({
                layout: 'auto',
                vertex: {
                    module: shaderModule,
                    buffers: vertexBufferLayouts,
                },
                fragment: {
                    module: shaderModule,
                    targets: [{
                        format: context.targetFormat,
                    }]
                },
                primitive: {
                    topology: 'triangle-list',
                    cullMode: 'back',
                },
                depthStencil: {
                    depthWriteEnabled: true,
                    depthCompare: 'less',
                    format: 'depth24plus',
                }
            })
        }

        // setup pipeline
        passEncoder.setPipeline(this.pipeline);

        // setup attributes
        material.shader.attributes.forEach((attributeMeta) => {
            if (!mesh.attributes.has(attributeMeta.name)) {
                console.warn(`Attribute ${attributeMeta.name} not found in mesh`);
            }
            const buffer = context.resourceManager.syncBuffer(mesh.attributes.get(attributeMeta.name)!)
            passEncoder.setVertexBuffer(attributeMeta.location, buffer.buffer)
        })

        // setup binding resource
        material.shader.bindingGroups.forEach((bindingGroup, index) => {
            const bindGroup = context.device.createBindGroup({
                layout: this.pipeline!.getBindGroupLayout(index),
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
            })
            passEncoder.setBindGroup(index, bindGroup);
        })

        // draw
        if (mesh.indices) {
            const buffer = context.resourceManager.syncBuffer(mesh.indices).buffer
            passEncoder.setIndexBuffer(buffer, 'uint32')
            passEncoder.drawIndexed(mesh.drawCount)
        } else {
            passEncoder.draw(mesh.drawCount)
        }
    }
}
