import type RenderContext from "@/bubble/pipeline/context";
import {IndexAttribute, VertexAttribute} from "@/bubble/resource/attribute";
import {Tracker, TrackState} from "@/bubble/resource/tracker";
import {type Texture, Texture2D} from "@/bubble/resource/texture";
import {generateMipmap, numMipLevels} from "webgpu-utils";

class Allocator {
    private context: RenderContext;

    private vertexBufferCache: WeakMap<VertexAttribute | IndexAttribute, AllocatedVertexAttribute> = new WeakMap();
    private vertexBufferTracker = new Tracker<VertexAttribute | IndexAttribute>();

    private textureCache: WeakMap<Texture, AllocatedTexture> = new WeakMap();
    private textureTracker = new Tracker<Texture>();

    constructor(context: RenderContext) {
        this.context = context;
    }

    private get device() {
        return this.context.device
    }

    allocateVertexBuffer(attribute: VertexAttribute | IndexAttribute): AllocatedVertexAttribute {
        let allocated = this.vertexBufferCache.get(attribute);
        if (!allocated) {
            const usage = attribute instanceof IndexAttribute ? GPUBufferUsage.INDEX : GPUBufferUsage.VERTEX;
            const buffer = this.device.createBuffer({
                size: attribute.data.byteLength,
                usage: usage | GPUBufferUsage.COPY_DST,
            });
            allocated = {
                buffer,
                offset: 0,
                size: attribute.data.byteLength,
                stride: attribute.data.BYTES_PER_ELEMENT * attribute.itemSize,
            };
            this.vertexBufferCache.set(attribute, allocated);
        }
        const state = this.vertexBufferTracker.getTrackState(attribute);
        if (state != TrackState.FRESH) {
            this.device.queue.writeBuffer(allocated.buffer, allocated.offset, attribute.data);
            this.vertexBufferTracker.markFresh(attribute);
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
            allocated = {
                texture,
                view,
                sampler,
            };
            this.textureCache.set(texture2d, allocated);
        }

        const state = this.textureTracker.getTrackState(texture2d);
        if (state != TrackState.FRESH) {
            this.device.queue.copyExternalImageToTexture(
                {
                    source: texture2d.data
                },
                {
                    texture: allocated.texture,
                    mipLevel: 0,
                },
                texture2d.size,
            )
            generateMipmap(this.device, allocated.texture)
            this.textureTracker.markFresh(texture2d);
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
