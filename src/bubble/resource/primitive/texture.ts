import {notifyUpdate, type Versioned} from "@/bubble/resource/versioned";

export abstract class Texture implements Versioned {
    version: number = 0;

    usage: GPUTextureUsageFlags;

    protected constructor(usage?: GPUTextureUsageFlags) {
        this.usage = usage ?? GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST;
    }

    setNeedsUpdate() {
        this.version++;
        notifyUpdate(this);
    }
}

export class Texture2D extends Texture {
    data: ImageBitmap;
    width: number;
    height: number;

    constructor(data: ImageBitmap, width: number, height: number, usage?: GPUTextureUsageFlags) {
        super(usage);
        this.width = width;
        this.height = height;
        this.data = data;
    }
}
