export class Attribute {
    name: string;
    type: string;
    buffer: ArrayBuffer;
    stride: number;
    offset: number;

    constructor(name: string, type: string, buffer: ArrayBuffer, stride: number, offset: number) {
        this.name = name;
        this.type = type;
        this.buffer = buffer;
        this.stride = stride;
        this.offset = offset;
    }
}