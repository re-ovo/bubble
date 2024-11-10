import type {TypedArray} from "@/bubble/core/types";
import type {DirtyObject} from "@/bubble/core/dirty";
import {makeStructuredView, type StructDefinition, type VariableDefinition} from "webgpu-utils";

class Buffer implements DirtyObject<BufferDirtyFlag> {
    private _data: TypedArray;
    private readonly _usage: GPUBufferUsageFlags;
    private _dirtyFlags: BufferDirtyFlag = BufferDirtyFlag.DATA;

    constructor(data: TypedArray, usage: GPUBufferUsageFlags) {
        this._data = data;
        this._usage = usage;
    }

    get data(): TypedArray {
        return this._data;
    }

    set data(data: TypedArray) {
        this._data = data;
        this.setDirty(BufferDirtyFlag.DATA);
    }

    get usage(): GPUBufferUsageFlags {
        return this._usage;
    }

    get byteLength(): number {
        return this._data.byteLength;
    }

    writeStructuredData<T>(
        data: T,
        def: VariableDefinition | StructDefinition,
        offset: number = 0
    ): void {
        const view = makeStructuredView(
            def,
            this._data,
            offset
        )
        view.set(data);
        this.setDirty(BufferDirtyFlag.DATA);
    }

    setNeedsUpdate(): void {
        this.setDirty(BufferDirtyFlag.DATA);
    }

    isDirty(flag: BufferDirtyFlag): boolean {
        return (this._dirtyFlags & flag) !== 0;
    }

    clearDirty(flag: BufferDirtyFlag): void {
        this._dirtyFlags &= ~flag;
    }

    setDirty(flag: BufferDirtyFlag): void {
        this._dirtyFlags |= flag;
    }
}

enum BufferDirtyFlag {
    DATA = 1,
}

class UniformBuffer extends Buffer {
    constructor(data: TypedArray) {
        super(data, GPUBufferUsage.UNIFORM);
    }
}

class StorageBuffer extends Buffer {
    constructor(data: TypedArray) {
        super(data, GPUBufferUsage.STORAGE);
    }
}

export {Buffer, BufferDirtyFlag, UniformBuffer, StorageBuffer};
