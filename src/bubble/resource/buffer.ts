import {type Resource, resourceVersionSymbol} from "@/bubble/resource/tracker";

export class Buffer implements Resource {
    [resourceVersionSymbol]: number = 0;

    private readonly buffer: ArrayBuffer;

    private constructor(buffer: ArrayBuffer) {
        this.buffer = buffer;

        if(buffer.byteLength % 4 !== 0) {
            throw new Error("Buffer must be aligned to 4 bytes");
        }
    }

    static from(buffer: ArrayBuffer) {
        return new Buffer(buffer);
    }

    static withSize(size: number) {
        return new Buffer(new ArrayBuffer(size));
    }

    get byteLength() {
        return this.buffer.byteLength;
    }

    getArrayBuffer() {
        return this.buffer;
    }
}
