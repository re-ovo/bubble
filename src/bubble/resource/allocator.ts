import type RenderContext from "@/bubble/pipeline/context";
import {type Texture, Texture2D, TextureDirtyFlag} from "@/bubble/resource/texture";
import {numMipLevels} from "webgpu-utils";
import {
    IndexBuffer,
    IndexBufferDirtyFlag,
    VertexAttribute,
    VertexAttributeDirtyFlag
} from "@/bubble/resource/attribute";
import {Buffer, BufferDirtyFlag} from "@/bubble/resource/buffer";

class Allocator {
    private _context: RenderContext;

    private _vertexBufferCache: WeakMap<VertexAttribute | IndexBuffer, AllocatedVertexAttribute> = new WeakMap();
    private _textureCache: WeakMap<Texture, AllocatedTexture> = new WeakMap();
    private _bufferCache: WeakMap<Buffer, AllocatedBuffer> = new WeakMap();

    constructor(context: RenderContext) {
        this._context = context;
    }

    private get device() {
        return this._context.device
    }

    allocateVertexBuffer(attribute: VertexAttribute | IndexBuffer): AllocatedVertexAttribute {
        let allocated = this._vertexBufferCache.get(attribute);
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
            this._vertexBufferCache.set(attribute, allocated);
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
        let allocated = this._textureCache.get(texture2d);
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

            this._textureCache.set(texture2d, allocated);
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

    allocateBuffer(buffer: Buffer): AllocatedBuffer {
        let allocated = this._bufferCache.get(buffer);
        if (!allocated) {
            const gpuBuffer = this.device.createBuffer({
                size: buffer.byteLength,
                usage: buffer.usage | GPUBufferUsage.COPY_DST,
            });
            allocated = {
                buffer: gpuBuffer,
                offset: 0,
                size: buffer.data.byteLength,
            };
            this._bufferCache.set(buffer, allocated);
        }
        if (buffer.isDirty(BufferDirtyFlag.DATA)) {
            this.device.queue.writeBuffer(allocated.buffer, 0, buffer.data);
            buffer.clearDirty(BufferDirtyFlag.DATA);
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
