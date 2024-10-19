import type {Disposable} from "@/bubble/core/dispose";
import type {RenderContext} from "@/bubble/pipeline/context";
import {ShaderResourceMapper} from "@/bubble/resource/mapper/shader_mapper";
import type {Shader} from "@/bubble/shader/shader";
import type {BufferResource} from "@/bubble/resource/primitive/buffer";
import {BufferResourceMapper} from "@/bubble/resource/mapper/buffer_mapper";
import type {BufferAttribute} from "@/bubble/resource/primitive/attribute";

export class ResourceManager implements Disposable {
    private context: RenderContext;

    private shaderMapper: ShaderResourceMapper;
    private bufferMapper: BufferResourceMapper;

    constructor(context: RenderContext) {
        this.context = context;

        this.shaderMapper = new ShaderResourceMapper(context);
        this.bufferMapper = new BufferResourceMapper(context);
    }

    syncShader(shader: Shader) {
        return this.shaderMapper.sync(shader);
    }

    syncBuffer(buffer: BufferAttribute<any> | BufferResource) {
        return this.bufferMapper.sync(buffer);
    }

    dispose() {}
}
