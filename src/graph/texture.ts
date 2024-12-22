import { createImageFromDesc, Image } from "./image";

export interface Texture {
    image: Image;
    sampler: GPUSampler;
}

export function createTextureFromBitmap(
    device: GPUDevice,
    data: ImageBitmap,
    sampler?: GPUSamplerDescriptor;
) : Texture {
    // TODO: Implement
}    
