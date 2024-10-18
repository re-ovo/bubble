export class BufferAttribute<T extends ArrayBufferView> {
    data: T;
    format: GPUVertexFormat;
    stepMode: GPUVertexStepMode;

    constructor(
        data: T,
        format: GPUVertexFormat,
        stepMode?: GPUVertexStepMode
    ) {
        this.data = data;
        this.format = format;
        this.stepMode = stepMode || 'vertex'
    }
}
