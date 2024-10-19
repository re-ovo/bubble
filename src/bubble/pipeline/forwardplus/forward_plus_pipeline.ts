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
        console.log("Render MeshRendererComponent", mesh, material);
    }
}
