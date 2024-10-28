import {notifyUpdate, type Versioned} from "@/bubble/resource/versioned";

export abstract class Texture implements Versioned {
    version: number = 0;

    usage: GPUTextureUsageFlags;
    format: GPUTextureFormat;
    minFilter: GPUFilterMode = 'linear';
    magFilter: GPUFilterMode = 'linear';

    protected constructor(
        format?: GPUTextureFormat,
        usage?: GPUTextureUsageFlags,
    ) {
        this.usage = usage ?? GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST;
        this.format = format ?? 'rgba8unorm';
    }

    setNeedsUpdate() {
        this.version++;
        notifyUpdate(this);
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
        usage?: GPUTextureUsageFlags,
    ) {
        super(format, usage);
        this.width = width;
        this.height = height;
        this.data = data;
    }
}
