import {type Resource, resourceVersionSymbol} from "@/bubble/resource/tracker";

export abstract class Texture implements Resource {
    [resourceVersionSymbol]: number = 0;

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
