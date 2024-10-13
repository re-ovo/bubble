import {ScriptablePipeline, ScriptableRenderContext} from "@/bubble/pipeline/pipeline";
import type {Camera} from "@/bubble/core/camera";

export class ForwardPlusPipeline extends ScriptablePipeline {
    render(context: ScriptableRenderContext, cameras: Camera[]): void {
        for (let i = 0; i < cameras.length; i++) {
            this.renderCamera(context, cameras[i]);
        }
    }

    dispose(): void {

    }

    renderCamera(context: ScriptableRenderContext, camera: Camera): void {
        console.log('ForwardPlusPipeline renderCamera');

    }
}
