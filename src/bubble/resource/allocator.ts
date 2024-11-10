import type RenderContext from "@/bubble/pipeline/context";
import {type Texture, Texture2D, TextureDirtyFlag} from "@/bubble/resource/texture";
import {numMipLevels} from "webgpu-utils";
import {
    IndexBuffer,
    IndexBufferDirtyFlag,
    VertexAttribute,
    VertexAttributeDirtyFlag
} from "@/bubble/resource/attribute";

class Allocator {
    private context: RenderContext;

    private vertexBufferCache: WeakMap<VertexAttribute | IndexBuffer, AllocatedVertexAttribute> = new WeakMap();
    private textureCache: WeakMap<Texture, AllocatedTexture> = new WeakMap();

    constructor(context: RenderContext) {
        this.context = context;
    }

    private get device() {
        return this.context.device
    }

    allocateVertexBuffer(attribute: VertexAttribute | IndexBuffer): AllocatedVertexAttribute {
        let allocated = this.vertexBufferCache.get(attribute);
        if (!allocated) {
            const usage = attribute instanceof IndexBuffer ? GPUBufferUsage.INDEX : GPUBufferUsage.VERTEX;
            const buffer = this.device.createBuffer({
                size: attribute.data.byteLength,
                usage: usage | GPUBufferUsage.COPY_DST,
            });
            allocated = {
                buffer,
                offset: 0,
                size: attribute.data.byteLength,
                stride: attribute instanceof VertexAttribute ? attribute.itemSize : 0, // only for vertex buffer
            };
            this.vertexBufferCache.set(attribute, allocated);
        }
        if (attribute instanceof VertexAttribute) {
            if (attribute.isDirty(VertexAttributeDirtyFlag.DATA)) {
                this.device.queue.writeBuffer(allocated.buffer, 0, attribute.data);
                attribute.clearDirty(VertexAttributeDirtyFlag.DATA);
            }
        } else {
            if (attribute.isDirty(IndexBufferDirtyFlag.DATA)) {
                this.device.queue.writeBuffer(allocated.buffer, 0, attribute.data);
                attribute.clearDirty(IndexBufferDirtyFlag.DATA);
            }
            if (attribute.isDirty(IndexBufferDirtyFlag.COUNT)) {
                allocated.size = attribute.count;
                attribute.clearDirty(IndexBufferDirtyFlag.COUNT);
            }
        }
        return allocated;
    }

    allocateTexture(texture: Texture): AllocatedTexture {
        if (texture instanceof Texture2D) {
            return this.allocateTexture2d(texture);
        }
        throw new Error('Unsupported texture type: ' + texture);
    }

    private allocateTexture2d(texture2d: Texture2D): AllocatedTexture {
        let allocated = this.textureCache.get(texture2d);
        if (!allocated) {
            const texture = this.device.createTexture({
                size: texture2d.size,
                format: texture2d.format,
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
                mipLevelCount: numMipLevels(texture2d.size),
            });
            const view = texture.createView();

            const sampler = this.device.createSampler(texture2d.sampler);
            texture2d.clearDirty(TextureDirtyFlag.SAMPLER);

            allocated = {
                texture,
                view,
                sampler,
            };

            this.textureCache.set(texture2d, allocated);
        }

        if (texture2d.isDirty(TextureDirtyFlag.DATA)) {
            this.device.queue.copyExternalImageToTexture({source: texture2d.data}, {texture: allocated.texture}, texture2d.size);
            texture2d.clearDirty(TextureDirtyFlag.DATA);
        }

        if (texture2d.isDirty(TextureDirtyFlag.SAMPLER)) {
            allocated.sampler = this.device.createSampler(texture2d.sampler);
            texture2d.clearDirty(TextureDirtyFlag.SAMPLER);
        }

        return allocated;
    }


}

export default Allocator;

export type AllocatedTexture = {
    texture: GPUTexture,
    view: GPUTextureView,
    sampler: GPUSampler,
}

export type AllocatedVertexAttribute = {
    buffer: GPUBuffer,
    offset: number,
    size: number,
    stride: number, // only for vertex buffer
}

export type AllocatedBuffer = {
    buffer: GPUBuffer,
    offset: number,
    size: number,
}
