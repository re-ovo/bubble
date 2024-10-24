import type {ResourceMapper} from "@/bubble/resource/resource_mapper";
import {type Texture, Texture2D} from "@/bubble/resource/primitive/texture";
import type {RenderContext} from "@/bubble/pipeline/context";
import {VersionedCache} from "@/bubble/resource/versioned";
import {bestMipLevelOfTexture, generateMipmap} from "@/bubble/pipeline/shared/mipmap";

export interface TextureResources {
    texture: GPUTexture;
    view: GPUTextureView;
    sampler: GPUSampler;
}

export class TextureResourceMapper implements ResourceMapper<Texture, TextureResources> {
    private context: RenderContext;

    private cache = new VersionedCache<Texture, TextureResources>()

    constructor(context: RenderContext) {
        this.context = context
    }

    sync(resource: Texture): TextureResources {
        let cacheValue = this.cache.get(resource)
        if (!cacheValue) {
            const newValue = this.create(resource)
            cacheValue = {
                version: resource.version,
                value: newValue
            }
            this.cache.set(resource, newValue)
        }
        if (resource.version !== cacheValue.version) {
            cacheValue.value = this.update(resource, cacheValue.value)
            cacheValue.version = resource.version
        }
        return cacheValue.value
    }

    create(resource: Texture): TextureResources {
        if (resource instanceof Texture2D) {
            const sampler = this.context.device.createSampler({
                minFilter: resource.minFilter,
                magFilter: resource.magFilter,
                addressModeU: resource.addressModeU,
                addressModeV: resource.addressModeV,
            })
            const texture = this.context.device.createTexture({
                size: [resource.width, resource.height],
                format: 'rgba8unorm',
                usage: resource.usage | GPUTextureUsage.RENDER_ATTACHMENT,
                mipLevelCount: bestMipLevelOfTexture(resource),
            });

            this.context.device.queue.copyExternalImageToTexture(
                {
                    source: resource.data,
                    // flipY: true,
                },
                {
                    texture: texture,
                },
                {
                    width: resource.width,
                    height: resource.height,
                }
            )
            generateMipmap(this.context.device, texture); // 生成mipmap
            const textureView = texture.createView();
            return {
                texture,
                view: textureView,
                sampler: sampler
            };
        } else {
            throw new Error('Unsupported texture type');
        }
    }

    dispose(resource: Texture, gpu: TextureResources): void {
        gpu.texture.destroy();
    }


    update(resource: Texture, gpu: TextureResources): TextureResources {
        this.dispose(resource, gpu);
        return this.create(resource);
    }
}
