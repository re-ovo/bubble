import {WgslReflect} from "wgsl_reflect";

export class Buffer {
    readonly definition: string;
    readonly structName: string;
    readonly usage: GPUBufferUsageFlags;
    readonly bufferSize: number;
    readonly data: ArrayBuffer;

    constructor(
        definition: string,
        structName: string,
        usage: GPUBufferUsageFlags
    ) {
        this.definition = definition;
        this.structName = structName
        this.usage = usage;

        const meta = new WgslReflect(definition);
        const entryStruct = meta.structs.find(s => s.name === structName);
        if (!entryStruct) {
            throw new Error(`Entry point ${structName} not found in buffer definition`);
        }
        this.bufferSize = entryStruct.size;
        this.data = new ArrayBuffer(this.bufferSize);
    }
}
