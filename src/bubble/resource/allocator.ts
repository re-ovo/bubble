import type RenderContext from "@/bubble/pipeline/context";
import type {VertexAttribute} from "@/bubble/resource/attribute";

class Allocator {
    private context: RenderContext;

    private vertexBufferCache: Map<VertexAttribute,AllocatedBuffer> = new WeakMap();
    private vertexBuffer

    constructor(context: RenderContext) {
        this.context = context;
    }

    private get device() {
        return this.context.device
    }

    allocateVertexBuffer()
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
