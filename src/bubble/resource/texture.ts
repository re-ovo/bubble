import type {DirtyObject} from "@/bubble/core/dirty";

export abstract class Texture implements DirtyObject<TextureDirtyFlag> {
    format: GPUTextureFormat;
    size: GPUExtent3D;
    sampler: GPUSamplerDescriptor;

    _dirtyFlag: number = TextureDirtyFlag.ALL;

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

    setDirty(flag: TextureDirtyFlag) {
        this._dirtyFlag |= flag;
    }

    clearDirty(flag: TextureDirtyFlag) {
        this._dirtyFlag &= ~flag;
    }

    isDirty(flag: TextureDirtyFlag) {
        return (this._dirtyFlag & flag) !== 0;
    }
}

export enum TextureDirtyFlag {
    DATA = 1 << 0,
    SAMPLER = 1 << 1,
    ALL = DATA | SAMPLER,
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
