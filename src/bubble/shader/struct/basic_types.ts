export interface WebGPUBasicType<T> {
    size: number; // 字节大小
    alignment: number; // 对齐字节

    write(view: DataView, value: T, offset: number): void;

    read(view: DataView, offset: number): T;
}

export const i32: WebGPUBasicType<number> = {
    size: 4,
    alignment: 4,
    write(view, value, offset) {
        view.setInt32(offset, value, true);
    },
    read(view: DataView, offset: number): number {
        return view.getInt32(offset, true);
    }
}


export const u32: WebGPUBasicType<number> = {
    size: 4,
    alignment: 4,
    write(view, value, offset) {
        view.setUint32(offset, value, true);
    },
    read(view: DataView, offset: number): number {
        return view.getUint32(offset, true);
    }
}

export const f32: WebGPUBasicType<number> = {
    size: 4,
    alignment: 4,
    write(view, value, offset) {
        view.setFloat32(offset, value, true);
    },
    read(view: DataView, offset: number): number {
        return view.getFloat32(offset, true);
    }
}

export const vec2f: WebGPUBasicType<Float32Array> = {
    size: 8,
    alignment: 8,
    write(view, value, offset) {
        view.setFloat32(offset, value[0], true);
        view.setFloat32(offset + 4, value[1], true);
    },
    read(view: DataView, offset: number): Float32Array {
        return new Float32Array(view.buffer, offset, 2);
    },
}

export const vec3f: WebGPUBasicType<Float32Array> = {
    size: 12,
    alignment: 16,
    write(view, value, offset) {
        view.setFloat32(offset, value[0], true);
        view.setFloat32(offset + 4, value[1], true);
        view.setFloat32(offset + 8, value[2], true);
    },
    read(view: DataView, offset: number): Float32Array {
        return new Float32Array(view.buffer, offset, 3);
    },
}

export const vec4f: WebGPUBasicType<Float32Array> = {
    size: 16,
    alignment: 16,
    write(view, value, offset) {
        view.setFloat32(offset, value[0], true);
        view.setFloat32(offset + 4, value[1], true);
        view.setFloat32(offset + 8, value[2], true);
        view.setFloat32(offset + 12, value[3], true);
    },
    read(view: DataView, offset: number): Float32Array {
        return new Float32Array(view.buffer, offset, 4);
    },
}
