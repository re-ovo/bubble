import type {ResourceMapper} from "@/bubble/resource/resource_mapper";
import  {type Shader} from "@/bubble/shader/shader";
import  {type RenderContext} from "@/bubble/pipeline/context";

export interface ShaderGPUResources {
    module: GPUShaderModule;
    pipelineLayout: GPUPipelineLayout;
    bindGroupLayouts: GPUBindGroupLayout[];
}

export class ShaderResourceMapper implements ResourceMapper<Shader, ShaderGPUResources> {
    private context: RenderContext;

    private shaders = new WeakMap<Shader, ShaderGPUResources>();

    constructor(context: RenderContext) {
        this.context = context
    }

    sync(resource: Shader): ShaderGPUResources {
        let resources = this.shaders.get(resource)
        if (!resources) {
            resources = this.create(resource)
            this.shaders.set(resource, resources)
        }
        // TODO: update shader resources if it's changed(dirty flag)
        return resources
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
