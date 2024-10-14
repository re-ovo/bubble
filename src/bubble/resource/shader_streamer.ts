import {ResourceStreamer} from "@/bubble/resource/streamer";
import {Shader} from "@/bubble/shader/shader";

export class ShaderStreamer extends ResourceStreamer<Shader, GPUShaderModule> {
    protected create(resource: Shader): GPUShaderModule {
        return this.context.device.createShaderModule({
            code: resource.code
        })
    }

    protected update(resource: Shader): GPUShaderModule {
        let cache = this.getCache(resource)
        if (cache) {
            this.disposeResource(cache)
        }
        return this.create(resource)
    }

    protected disposeResource(resource: GPUShaderModule) {}
}
