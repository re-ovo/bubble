import {notifyUpdate, type Versioned} from "@/bubble/resource/versioned";

export class BufferAttribute<T extends ArrayBufferView> implements Versioned {
    data: T;
    stepMode: GPUVertexStepMode;

    version: number = 0;

    constructor(
        data: T,
        format: GPUVertexFormat,
        stepMode?: GPUVertexStepMode
    ) {
        this.data = data;
        this.stepMode = stepMode || 'vertex'
    }

    setNeedsUpdate() {
        this.version++;
        notifyUpdate(this);
    }
}
