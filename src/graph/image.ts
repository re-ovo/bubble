
export interface Image {
    texture: GPUTexture;
    view: GPUTextureView;
    desc: GPUTextureDescriptor;
    debugName: string;
}

export function createImageFromDesc(
    device: GPUDevice,
    desc: GPUTextureDescriptor,
) {
    const texture = device.createTexture(desc);
    const view = texture.createView();
    return { texture, view, desc, debugName: desc.label };
}

export function createImageFromGPUTexture(
    texture: GPUTexture,
    desc: GPUTextureDescriptor,
) {
    const view = texture.createView();
    return { texture, view, desc, debugName: desc.label };
}