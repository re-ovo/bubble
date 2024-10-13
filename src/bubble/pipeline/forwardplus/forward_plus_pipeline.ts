import {ScriptablePipeline, ScriptableRenderContext} from "@/bubble/pipeline/pipeline";
import type {Camera} from "@/bubble/node/camera/camera";

export class ForwardPlusPipeline extends ScriptablePipeline {
    render(context: ScriptableRenderContext, cameras: Camera[]): void {
        for (let i = 0; i < cameras.length; i++) {
            this.renderCamera(context, cameras[i]);
        }
        context.submit();
    }

    dispose(): void {

    }

    renderCamera(context: ScriptableRenderContext, camera: Camera): void {

    }
}
