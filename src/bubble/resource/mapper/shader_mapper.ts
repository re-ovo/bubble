import type {ResourceMapper} from "@/bubble/resource/resource_mapper";
import {type Shader} from "@/bubble/shader/shader";
import {type RenderContext} from "@/bubble/pipeline/context";
import {VersionedCache} from "@/bubble/resource/versioned";

export interface ShaderGPUResources {
    module: GPUShaderModule;
}

export class ShaderResourceMapper implements ResourceMapper<Shader, ShaderGPUResources> {
    private context: RenderContext;

    private cache = new Map<String, GPUShaderModule>()

    constructor(context: RenderContext) {
        this.context = context
    }

    sync(resource: Shader): ShaderGPUResources {
        let cacheValue = this.cache.get(resource.code)
        if (!cacheValue) {
            cacheValue = this.context.device.createShaderModule({
                code: resource.code
            })
            this.cache.set(resource.code, cacheValue)
        }
        return {
            module: cacheValue
        }
    }

    create(resource: Shader): ShaderGPUResources {
        throw new Error("Method not implemented.");
    }

    update(resource: Shader, gpuResources: ShaderGPUResources): ShaderGPUResources {
        throw new Error("Method not implemented.");
    }

    dispose(object: Shader, gpuResource: ShaderGPUResources): void {
        throw new Error("Method not implemented.");
    }
}
