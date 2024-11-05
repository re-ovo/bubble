import {type Texture, Texture2D} from "@/bubble/resource/texture";
import {getResourceVersion} from "@/bubble/resource/tracker";
import {IndexAttribute, type VertexAttribute} from "@/bubble/resource/attribute";
import type RenderContext from "@/bubble/pipeline/context";

class Allocator {
    private context: RenderContext;

    private textureMap: WeakMap<Texture, AllocatedTexture> = new WeakMap<Texture, AllocatedTexture>();
    private textureVersionMap: WeakMap<Texture, number> = new WeakMap<Texture, number>();

    private vertexAttributeMap: WeakMap<VertexAttribute, AllocatedVertexAttribute> = new WeakMap<VertexAttribute, AllocatedVertexAttribute>();
    private vertexAttributeVersionMap: WeakMap<VertexAttribute, number> = new WeakMap<VertexAttribute, number>();

    private bufferMap: WeakMap<Buffer, AllocatedBuffer> = new WeakMap<Buffer, AllocatedBuffer>();
    private bufferVersionMap: WeakMap<Buffer, number> = new WeakMap<Buffer, number>();

    constructor(context: RenderContext) {
        this.context = context;
    }

    private get device() {
        return this.context.device
    }

    allocateTexture(texture: Texture): AllocatedTexture {
        let allocated = this.textureMap.get(texture);

        if (!allocated) {
            let gpuTexture: GPUTexture;
            if (texture instanceof Texture2D) {
                gpuTexture = this.device.createTexture({
                    size: [texture.width, texture.height, 1],
                    format: texture.format,
                    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST, // TODO: 只读提升性能，通过一个中间纹理来实现写入
                });
            } else {
                throw new Error("Unsupported texture type");
            }
            allocated = {
                texture: gpuTexture,
                view: gpuTexture.createView(),
                sampler: this.device.createSampler({
                    minFilter: texture.minFilter,
                    magFilter: texture.magFilter,
                    mipmapFilter: 'linear',
                    addressModeU: texture.addressModeU,
                    addressModeV: texture.addressModeV,
                    addressModeW: 'repeat',
                })
            }
            this.textureMap.set(texture, allocated);
        }

        const textureVersion = getResourceVersion(texture);
        const allocatedVersion = this.textureVersionMap.get(texture);

        if (textureVersion !== allocatedVersion) {
            // Update texture data
            if (texture instanceof Texture2D) {
                this.device.queue.copyExternalImageToTexture(
                    {
                        source: texture.data,
                        // flipY: false,
                    }, {
                        texture: allocated.texture,
                    },
                    [texture.width, texture.height, 1],
                );
            } else {
                throw new Error("Unsupported texture type");
            }
            this.textureVersionMap.set(texture, textureVersion);
        }

        return allocated;
    }

    releaseTexture(texture: Texture) {
        const allocated = this.textureMap.get(texture);
        if (allocated) {
            allocated.texture.destroy();
            this.textureMap.delete(texture);
            this.textureVersionMap.delete(texture);
        }
    }

    allocateVertexOrIndex(attr: VertexAttribute | IndexAttribute): AllocatedVertexAttribute {
        let allocated = this.vertexAttributeMap.get(attr);

        if (!allocated) {
            const buffer = this.device.createBuffer({
                size: attr.data.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            });
            this.context.device.queue.writeBuffer(buffer, 0, attr.data);

            allocated = {
                buffer,
                offset: 0,
                size: attr.data.byteLength,
                stride: attr.itemSize * attr.data.BYTES_PER_ELEMENT,
            }
            this.vertexAttributeMap.set(attr, allocated);
        }

        const version = getResourceVersion(attr);
        const allocatedVersion = this.vertexAttributeVersionMap.get(attr);

        if (version !== allocatedVersion) {
            this.device.queue.writeBuffer(allocated.buffer, 0, attr.data);
            this.vertexAttributeVersionMap.set(attr, version);
        }

        return allocated;
    }

    releaseVertexOrIndex(attr: VertexAttribute | IndexAttribute) {
        const allocated = this.vertexAttributeMap.get(attr);
        if (allocated) {
            allocated.buffer.destroy();
            this.vertexAttributeMap.delete(attr);
            this.vertexAttributeVersionMap.delete(attr);
        }
    }

    allocateBuffer(buffer: Buffer) {
        let allocated = this.bufferMap.get(buffer);

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
