import {notifyUpdate, type Versioned} from "@/bubble/resource/versioned";
import type {Shader} from "@/bubble/shader/shader";

// BufferResource -> GPUBuffer/GPUBufferView
export class BufferResource implements Versioned {
    readonly structName: string;
    readonly usage: GPUBufferUsageFlags;
    shader: Shader | null;
    bufferSize: number;
    data: ArrayBuffer;
    dataView: DataView;

    version: number = 0;

    constructor(
        structName: string,
        usage: GPUBufferUsageFlags
    ) {
        this.structName = structName
        this.usage = usage | GPUBufferUsage.COPY_DST; // Add COPY_DST flag to all usages
        this.bufferSize = 0;
        this.data = new ArrayBuffer(0);
        this.shader = null;
        this.dataView = new DataView(this.data);
    }

    setNeedsUpdate() {
        this.version++;
        notifyUpdate(this);
    }

    setShader(shader: Shader) {
        this.shader = shader;
        this.computeBufferSize()
    }

    computeBufferSize() {
        let struct = this.shader?.metadata.structs?.find((struct) => struct.name === this.structName)
        if(!struct) {
            throw new Error(`Struct ${this.structName} not found in shader`)
        }
        this.bufferSize = struct.size
        this.data = new ArrayBuffer(this.bufferSize)
        this.dataView = new DataView(this.data)
        this.setNeedsUpdate()
    }

    setData(data: ArrayBuffer) {
        if(data.byteLength !== this.bufferSize) {
            throw new Error(`Data size ${data.byteLength} does not match buffer size ${this.bufferSize}`)
        }
        this.data = data
        this.dataView = new DataView(this.data)
        this.setNeedsUpdate()
    }
}
