export abstract class Texture {
    format: GPUTextureFormat;
    size: GPUExtent3D;

    protected constructor(
        size: GPUExtent3D,
        format?: GPUTextureFormat,
    ) {
        this.size = size;
        this.format = format ?? 'rgba8unorm-srgb';
    }
}

export class Texture2D extends Texture {
    data: ImageBitmap | ImageData;

    constructor(
        data: ImageBitmap | ImageData,
        size: GPUExtent3D,
        format?: GPUTextureFormat,
    ) {
        super(size, format);
        this.data = data;
    }
}

