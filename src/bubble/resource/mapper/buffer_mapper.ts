import type {ResourceMapper} from "@/bubble/resource/resource_mapper";
import {BufferResource} from "@/bubble/resource/primitive/buffer";
import {VersionedCache} from "@/bubble/resource/versioned";
import type {RenderContext} from "@/bubble/pipeline/context";
import type {VertexAttribute} from "@/bubble/resource/primitive/attribute";

export interface BufferResources {
    buffer: GPUBuffer;
    offset: number;
    size: number;
}

export class BufferResourceMapper implements ResourceMapper<VertexAttribute | BufferResource, BufferResources> {
    private context: RenderContext;
    private cache = new VersionedCache<VertexAttribute | BufferResource, BufferResources>()

    constructor(context: RenderContext) {
        this.context = context;
    }

    sync(resource: VertexAttribute | BufferResource): BufferResources {
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


    create(resource: VertexAttribute | BufferResource): BufferResources {
        // console.log('create buffer for', resource)
        if (resource instanceof BufferResource) {
            let buffer = this.context.device.createBuffer({
                size: resource.bufferSize,
                usage: resource.usage | GPUBufferUsage.COPY_SRC,
            })
            this.context.device.queue.writeBuffer(buffer, 0, resource.view)
            return {
                buffer: buffer,
                offset: 0,
                size: resource.bufferSize
            }
        } else {
            let buffer = this.context.device.createBuffer({
                size: resource.data.byteLength,
                usage: resource.usage | GPUBufferUsage.COPY_SRC,
            })
            this.context.device.queue.writeBuffer(buffer, 0, resource.data)
            return {
                buffer: buffer,
                offset: 0,
                size: resource.data.byteLength
            }
        }
    }

    update(resource: VertexAttribute | BufferResource, gpu: BufferResources): BufferResources {
        // console.log('update buffer for', resource)
        this.context.device.queue.writeBuffer(gpu.buffer, 0, resource instanceof BufferResource ? resource.view : resource.data);
        return gpu;
    }

    dispose(resource: VertexAttribute | BufferResource, gpu: BufferResources): void {
        gpu.buffer.destroy();
    }
}
