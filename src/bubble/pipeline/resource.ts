export class Texture2DResource {
    texture: GPUTexture;

    constructor(texture: GPUTexture) {
        this.texture = texture;
    }

    get size() {
        return [this.texture.width, this.texture.height];
    }

    get format() {
        return this.texture.format;
    }
}

export class BufferResource {
    buffer: GPUBuffer;

    constructor(buffer: GPUBuffer) {
        this.buffer = buffer;
    }
}
