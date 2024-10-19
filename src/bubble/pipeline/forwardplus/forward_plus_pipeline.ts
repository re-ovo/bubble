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

    renderCamera(context: RenderContext, camera: Camera): void {
        context.beginRenderPass({
            colorAttachments: [{
                view: context.target,
                loadOp: 'clear',
                storeOp: 'store',
            }],
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

    renderEntity(context: RenderContext, renderer: RendererComponent) {
        if (renderer instanceof MeshRendererComponent) {
            this.renderMeshRenderer(context, renderer);
        }
    }

    renderMeshRenderer(context: RenderContext, renderer: MeshRendererComponent) {
        let mesh = renderer.mesh!;
        let material = renderer.material!;
        let passEncoder = context.renderPassEncoder;

        const {module: shaderModule} = context.resourceManager.syncShader(material.shader);

        const vertexBufferLayouts: GPUVertexBufferLayout[] = material.shader.attributes.map((attribute) => {
            return {
                arrayStride: attribute.type.size,
                attributes: [{
                    format: attribute.attributeDesc.format,
                    shaderLocation: attribute.location,
                    offset: 0,
                }],
            }
        })

        const pipeline = context.device.createRenderPipeline({
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
        })

        passEncoder.setPipeline(pipeline);
        mesh.attributes.forEach((bufferAttribute, name) => {
            const {buffer} = context.resourceManager.syncBuffer(bufferAttribute);
            const location = material.shader.attributes
                .find((attribute) => attribute.name === name)?.location;
            if (location !== undefined) {
                passEncoder.setVertexBuffer(location, buffer);
            } else {
                console.warn(`Attribute ${name} not found in shader`);
            }
        })

        if (mesh.indices) {
            // TODO: draw indexed
        } else {
            passEncoder.draw(mesh.drawCount)
        }
    }
}
