import type {ResourceMapper} from "@/bubble/resource/resource_mapper";
import {type Shader} from "@/bubble/shader/shader";
import {type RenderContext} from "@/bubble/pipeline/context";
import {VersionedCache} from "@/bubble/resource/versioned";

export interface ShaderGPUResources {
    module: GPUShaderModule;
    pipelineLayout: GPUPipelineLayout;
    bindGroupLayouts: GPUBindGroupLayout[];
}

export class ShaderResourceMapper implements ResourceMapper<Shader, ShaderGPUResources> {
    private context: RenderContext;

    private cache = new VersionedCache<Shader, ShaderGPUResources>()

    constructor(context: RenderContext) {
        this.context = context
    }

    sync(resource: Shader): ShaderGPUResources {
        let cacheValue = this.cache.get(resource)
        if (!cacheValue) {
            const newValue = this.create(resource)
            cacheValue = {
                version: resource.version,
                value: newValue
            }
            this.cache.set(resource, newValue)
        }
        if(resource.version !== cacheValue.version) {
            cacheValue.value = this.update(resource, cacheValue.value)
            cacheValue.version = resource.version
        }
        return cacheValue.value
    }

    create(resource: Shader): ShaderGPUResources {
        // create shader module
        let module = this.context.device.createShaderModule({
            code: resource.code
        })
        // TODO: create bind group layouts via reflection wgsl
        let bindGroupLayouts: GPUBindGroupLayout[] = []
        // create pipeline layout
        let pipelineLayout = this.context.device.createPipelineLayout({
            bindGroupLayouts: bindGroupLayouts
        })
        return {
            module,
            pipelineLayout,
            bindGroupLayouts
        }
    }

    update(resource: Shader, gpuResources: ShaderGPUResources): ShaderGPUResources {
        this.dispose(resource, gpuResources)
        return this.create(resource)
    }

    dispose(object: Shader, gpuResource: ShaderGPUResources): void {}
}
