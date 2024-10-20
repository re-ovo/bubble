import {notifyUpdate, type Versioned} from "@/bubble/resource/versioned";
import type {Shader} from "@/bubble/shader/shader";

// BufferResource -> GPUBuffer/GPUBufferView
export class BufferResource implements Versioned {
    readonly structName: string;
    readonly usage: GPUBufferUsageFlags;
    shader: Shader | null;
    bufferSize: number;
    _data: ArrayBuffer;
    _dataView: DataView;

    version: number = 0;

    constructor(
        structName: string,
        usage: GPUBufferUsageFlags
    ) {
        this.structName = structName
        this.usage = usage | GPUBufferUsage.COPY_DST; // Add COPY_DST flag to all usages
        this.bufferSize = 0;
        this.shader = null;
        this._data = new ArrayBuffer(0);
        this._dataView = new DataView(this._data);
    }

    get view(): DataView {
        if(this.bufferSize === 0) throw new Error("BufferResource is not initialized yet (shader: " + this.shader + ")");
        return this._dataView;
    }

    get data(): ArrayBuffer {
        if(this.bufferSize === 0) throw new Error("BufferResource is not initialized yet (shader: " + this.shader + ")");
        return this._data;
    }

    setNeedsUpdate() {
        this.version++;
        notifyUpdate(this);
    }

    setShader(shader: Shader) {
        this.shader = shader;
        this.computeBufferSize()
    }

    setSize(size: number) {
        this.bufferSize = size
        this._data = new ArrayBuffer(this.bufferSize)
        this._dataView = new DataView(this._data)
        this.setNeedsUpdate()
    }

    computeBufferSize() {
        let struct = this.shader?.metadata.structs?.find((struct) => struct.name === this.structName)
        if(!struct) {
            throw new Error(`Struct ${this.structName} not found in shader`)
        }
        this.bufferSize = struct.size
        this._data = new ArrayBuffer(this.bufferSize)
        this._dataView = new DataView(this._data)
        this.setNeedsUpdate()
    }

    setFloat32Array(offset: number, data: Float32Array) {
        const view = new Float32Array(this._data, offset, data.length)
        view.set(data)
        this.setNeedsUpdate()
    }
}
