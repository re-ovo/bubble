export class BufferAttribute<T extends ArrayBufferView> {
    data: T;
    stepMode: GPUVertexStepMode;

    constructor(
        data: T,
        format: GPUVertexFormat,
        stepMode?: GPUVertexStepMode
    ) {
        this.data = data;
        this.stepMode = stepMode || 'vertex'
    }
}
