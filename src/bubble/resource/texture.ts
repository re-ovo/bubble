export abstract class Texture {
    format: GPUTextureFormat;
    minFilter: GPUFilterMode = 'linear';
    magFilter: GPUFilterMode = 'linear';

    protected constructor(
        format?: GPUTextureFormat,
    ) {
        this.format = format ?? 'rgba8unorm';
    }
}

export class Texture2D extends Texture {
    data: ImageBitmap | ImageData;

    width: number;
    height: number;

    addressModeU: GPUAddressMode = 'repeat';
    addressModeV: GPUAddressMode = 'repeat';

    constructor(
        data: ImageBitmap | ImageData,
        width: number, height: number,
        format?: GPUTextureFormat,
    ) {
        super(format);
        this.width = width;
        this.height = height;
        this.data = data;
    }
}
