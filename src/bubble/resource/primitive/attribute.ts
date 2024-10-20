import {notifyUpdate, type Versioned} from "@/bubble/resource/versioned";

export class BufferAttribute<T extends ArrayBufferView> implements Versioned {
    data: T;
    itemSize: number;
    stepMode: GPUVertexStepMode;
    usage: GPUBufferUsageFlags = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;

    version: number = 0;

    constructor(
        data: T,
        itemSize: number,
        usage?: GPUBufferUsageFlags,
        stepMode?: GPUVertexStepMode
    ) {
        this.data = data;
        this.itemSize = itemSize;
        this.usage = usage || this.usage
        this.stepMode = stepMode || 'vertex'
    }

    setNeedsUpdate() {
        this.version++;
        notifyUpdate(this);
    }
}
