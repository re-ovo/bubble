import {ScriptablePipeline} from "@/bubble/pipeline/pipeline";
import type {Camera} from "@/bubble/node/camera/camera";
import type {RenderContext} from "@/bubble/pipeline/context";

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

    }
}
