import {notifyUpdate, type Versioned} from "@/bubble/resource/versioned";

export class BufferAttribute<T extends ArrayBufferView> implements Versioned {
    data: T;
    itemSize: number;
    stepMode: GPUVertexStepMode;

    version: number = 0;

    constructor(
        data: T,
        itemSize: number,
        stepMode?: GPUVertexStepMode
    ) {
        this.data = data;
        this.itemSize = itemSize;
        this.stepMode = stepMode || 'vertex'
    }

    setNeedsUpdate() {
        this.version++;
        notifyUpdate(this);
    }
}
