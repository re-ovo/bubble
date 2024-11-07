export abstract class Texture {
    format: GPUTextureFormat;
    size: GPUExtent3D;
    sampler: GPUSamplerDescriptor;

    protected constructor(
        size: GPUExtent3D,
        format?: GPUTextureFormat,
        sampler?: GPUSamplerDescriptor,
    ) {
        this.size = size;
        this.format = format ?? 'rgba8unorm-srgb';
        this.sampler = sampler ?? {
            addressModeU: 'repeat',
            addressModeV: 'repeat',
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear',
        };
    }
}

export class Texture2D extends Texture {
    data: ImageBitmap | ImageData;

    constructor(
        data: ImageBitmap | ImageData,
        size: GPUExtent3D,
        format?: GPUTextureFormat,
        sampler?: GPUSamplerDescriptor,
    ) {
        super(size, format, sampler);
        this.data = data;
    }
}

