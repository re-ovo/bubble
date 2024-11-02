import type {Disposable} from "@/bubble/core/dispose";
import type {RenderContext} from "@/bubble/pipeline/context";
import {ShaderResourceMapper} from "@/bubble/resource/mapper/shader_mapper";
import type {Shader} from "@/bubble/shader/shader";
import type {BufferResource} from "@/bubble/resource/primitive/buffer";
import {BufferResourceMapper} from "@/bubble/resource/mapper/buffer_mapper";
import type {VertexAttribute} from "@/bubble/resource/primitive/attribute";
import {TextureResourceMapper} from "@/bubble/resource/mapper/texture_mapper";
import type {Texture} from "@/bubble/resource/primitive/texture";

export class ResourceManager implements Disposable {
    private shaderMapper: ShaderResourceMapper;
    private bufferMapper: BufferResourceMapper;
    private textureMapper: TextureResourceMapper;

    constructor(context: RenderContext) {
        this.shaderMapper = new ShaderResourceMapper(context);
        this.bufferMapper = new BufferResourceMapper(context);
        this.textureMapper = new TextureResourceMapper(context);
    }

    syncShader(shader: Shader) {
        return this.shaderMapper.sync(shader);
    }

    syncBuffer(buffer: VertexAttribute<any> | BufferResource) {
        return this.bufferMapper.sync(buffer);
    }

    syncTexture(texture: Texture) {
        return this.textureMapper.sync(texture);
    }

    dispose() {}
}
