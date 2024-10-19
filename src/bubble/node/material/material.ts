import type {Shader} from "@/bubble/shader/shader";
import {notifyUpdate, type Versioned} from "@/bubble/resource/versioned";
import {BufferResource} from "@/bubble/resource/primitive/buffer";

// Material -> ShaderModule/Pipeline/BindingGroups
export class Material implements Versioned {
    version: number = 0;

    shader: Shader | null;
    buffers: Map<string, BufferResource>;

    constructor(shader: Shader) {
        this.shader = shader;
        this.buffers = new Map();
    }

    setNeedsUpdate() {
        this.version++;
        notifyUpdate(this);
    }

    addBuffer(variableName: string, buffer: BufferResource) {
        buffer.setShader(this.shader!);
        this.buffers.set(variableName, buffer);
    }

    removeBuffer(name: string) {
        this.buffers.delete(name);
    }

    getBuffer(name: string): BufferResource {
        let buf = this.buffers.get(name);
        if (buf) {
            return buf;
        }
        throw new Error(`Buffer ${name} not found.`);
    }

    getBufferView(name: string): DataView {
        let buffer = this.getBuffer(name);
        return buffer.dataView;
    }
}
