import type {Disposable} from "@/bubble/core/dispose";
import type {RenderContext} from "@/bubble/pipeline/context";
import {ShaderResourceMapper} from "@/bubble/resource/mapper/shader_mapper";
import type {Shader} from "@/bubble/shader/shader";

export class ResourceManager implements Disposable {
    private context: RenderContext;

    private shaderMapper: ShaderResourceMapper;

    constructor(context: RenderContext) {
        this.context = context;

        this.shaderMapper = new ShaderResourceMapper(context);
    }

    syncShader(shader: Shader) {
        return this.shaderMapper.sync(shader);
    }

    syncBuffer() {

    }

    dispose() {}
}
