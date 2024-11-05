import type {TypedArray} from "@/bubble/core/types";

export class VertexAttribute  {
    data: TypedArray;
    itemSize: number;

    constructor(
        data: TypedArray,
        itemSize: number
    ) {
        this.data = data;
        this.itemSize = itemSize;
    }
}

export class IndexAttribute extends VertexAttribute {
    count: number;

    constructor(
        data: Uint16Array | Uint32Array,
        count: number = data.length
    ) {
        super(data, 1);
        this.count = count;

        // resize index buffer (Number of bytes to write must be a multiple of 4)
        if (data instanceof Uint16Array && data.byteLength % 4 !== 0) {
            const newSize = Math.ceil(data.byteLength / 4) * 4;
            const newIndices = new Uint16Array(newSize);
            newIndices.set(data);
            this.data = newIndices;
        }
    }
}
