import {notifyUpdate, type Versioned} from "@/bubble/resource/versioned";
import type {TypedArray} from "@/bubble/core/types";

export class VertexAttribute implements Versioned {
    data: TypedArray;
    itemSize: number;
    stepMode: GPUVertexStepMode;
    usage: GPUBufferUsageFlags = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;

    version: number = 0;

    constructor(
        data: TypedArray,
        itemSize: number,
        usage?: GPUBufferUsageFlags,
        stepMode?: GPUVertexStepMode
    ) {
        this.data = data;
        this.itemSize = itemSize;
        this.usage = usage ?? this.usage
        this.stepMode = stepMode ?? 'vertex'
    }

    setNeedsUpdate() {
        this.version++;
        notifyUpdate(this);
    }
}

export class IndexAttribute extends VertexAttribute {
    count: number;

    constructor(
        data: Uint16Array | Uint32Array,
        count: number = data.length
    ) {
        super(data, 1, GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST);
        this.count = count;

        // resize index buffer (Number of bytes to write must be a multiple of 4)
        if (data instanceof Uint16Array && data.byteLength % 4 !== 0) {
            const newSize = Math.ceil(data.byteLength / 4) * 4;
            const newIndices = new Uint16Array(newSize);
            newIndices.set(data);
            this.data = newIndices;
        }
    }
}
