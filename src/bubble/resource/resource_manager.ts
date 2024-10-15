import type {Shader} from "@/bubble/shader/shader";
import type {Disposable} from "@/bubble/core/dispose";
import type {RenderContext} from "@/bubble/pipeline/context";

export class ResourceManager implements Disposable {
    private context: RenderContext;

    private shaders: Map<Shader, ShaderGPUResources> = new Map();

    constructor(context: RenderContext) {
        this.context = context
    }

    syncShader(shader: Shader): ShaderGPUResources {
        let resources = this.shaders.get(shader)
        if (!resources) {
            resources = this.createShaderResources(shader)
            this.shaders.set(shader, resources)
        }
        // TODO: update shader resources if it's changed(dirty flag)
        return resources
    }

    private createShaderResources(shader: Shader): ShaderGPUResources {
        // create shader module
        let module = this.context.device.createShaderModule({
            code: shader.code
        })
        // TODO: create bind group layouts via reflection wgsl
        let bindGroupLayouts: GPUBindGroupLayout[] = []
        // create pipeline layout
        let pipelineLayout = this.context.device.createPipelineLayout({
            bindGroupLayouts: bindGroupLayouts
        })
        return  {
            module,
            pipelineLayout,
            bindGroupLayouts
        }
    }

    private updateShaderResources(shader: Shader, resources: ShaderGPUResources) {
        // TODO: update shader resources
        throw new Error("Method not implemented.")
    }

    disposeShaderResources(shader: Shader) {
        let resources = this.shaders.get(shader)
        if (resources) {
            this.shaders.delete(shader)
        } else {
            console.warn(`Shader not found in resource manager, cannot dispose`)
        }
    }

    dispose() {
        // dispose shaders
        // 这些资源不需要destroy，只需要释放引用即可
        this.shaders.clear()
    }
}

export interface ShaderGPUResources {
    module: GPUShaderModule;
    pipelineLayout: GPUPipelineLayout;
    bindGroupLayouts: GPUBindGroupLayout[];
}
