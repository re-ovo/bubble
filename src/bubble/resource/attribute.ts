import type {TypedArray} from "@/bubble/core/types";
import type {DirtyObject} from "@/bubble/core/dirty";

class VertexAttribute implements DirtyObject<VertexAttributeDirtyFlag> {
    data: TypedArray;
    itemSize: number;

    _dirtyFlag: number = VertexAttributeDirtyFlag.DATA;

    constructor(
        data: TypedArray,
        itemSize: number
    ) {
        this.data = data;
        this.itemSize = itemSize;
    }

    isDirty(flag: VertexAttributeDirtyFlag) {
        return (this._dirtyFlag & flag) !== 0;
    }

    clearDirty(flag: VertexAttributeDirtyFlag) {
        this._dirtyFlag &= ~flag;
    }

    setDirty(flag: VertexAttributeDirtyFlag) {
        this._dirtyFlag |= flag;
    }
}

class IndexBuffer implements DirtyObject<IndexBufferDirtyFlag> {
    data: Uint16Array | Uint32Array;
    count: number;

    _dirtyFlag: number = IndexBufferDirtyFlag.ALL;

    constructor(
        data: Uint16Array | Uint32Array,
        count: number = data.length
    ) {
        this.data = data;
        this.count = count;

        // resize index buffer (Number of bytes to write must be a multiple of 4)
        if (data instanceof Uint16Array && data.byteLength % 4 !== 0) {
            const newSize = Math.ceil(data.byteLength / 4) * 4;
            const newIndices = new Uint16Array(newSize);
            newIndices.set(data);
            this.data = newIndices;
        }
    }

    get isUint16() {
        return this.data instanceof Uint16Array;
    }

    get isUint32() {
        return this.data instanceof Uint32Array;
    }

    isDirty(flag: IndexBufferDirtyFlag) {
        return (this._dirtyFlag & flag) !== 0;
    }

    clearDirty(flag: IndexBufferDirtyFlag) {
        this._dirtyFlag &= ~flag;
    }

    setDirty(flag: IndexBufferDirtyFlag) {
        this._dirtyFlag |= flag;
    }
}

enum VertexAttributeDirtyFlag {
    DATA = 1 << 0, // Data has changed
}

enum IndexBufferDirtyFlag {
    DATA = 1 << 0, // Data has changed
    COUNT = 1 << 1, // Count has changed
    ALL = DATA | COUNT,
}

export {VertexAttribute, IndexBuffer, VertexAttributeDirtyFlag, IndexBufferDirtyFlag};
