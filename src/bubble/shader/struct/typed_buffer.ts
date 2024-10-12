import type {WebGPUDataType, WebGPUDataValue, WebGPUStructType} from "@/bubble/shader/struct/struct";
import type {WebGPUBasicType} from "@/bubble/shader/struct/basic_types";

type OffsetMap = {
    [key: string]: number | OffsetMap
};

export class TypedBuffer<T extends WebGPUDataType> {
    private readonly definition: T;
    readonly size: number;
    private readonly offsets: OffsetMap;

    constructor(definition: T) {
        this.definition = definition;
        const {size, offsets} = this.calculateSizeAndOffsets(definition);
        this.size = size;
        this.offsets = offsets;
    }

    isBasicType(definition?: WebGPUDataType): boolean {
        if (!definition) return this.isBasicType(this.definition);
        return 'size' in definition && 'alignment' in definition;
    }

    private calculateSizeAndOffsets(definition: WebGPUDataType, baseOffset = 0): {
        size: number,
        alignment: number,
        offsets: OffsetMap
    } {
        if (this.isBasicType(definition)) {
            const basicType = definition as WebGPUBasicType<any>;
            return {
                size: basicType.size,
                offsets: {},
                alignment: basicType.alignment,
            };
        } else {
            const structType = definition as WebGPUStructType;

            let size = 0;
            let maxAlignment = 0;
            let currentOffset = baseOffset;
            const offsets: OffsetMap = {};

            for (const key in structType) {
                const field = structType[key];

                if (this.isBasicType(field)) {
                    const basicType = field as WebGPUBasicType<any>;
                    const offset = align(currentOffset, basicType.alignment);
                    offsets[key] = offset;
                    size = offset + basicType.size;
                    currentOffset = size;
                    maxAlignment = Math.max(maxAlignment, basicType.alignment);
                } else {
                    const {
                        size: fieldSize,
                        offsets: fieldOffsets,
                        alignment
                    } = this.calculateSizeAndOffsets(field, currentOffset);
                    offsets[key] = fieldOffsets;
                    size = fieldSize;
                    currentOffset = size;
                    maxAlignment = Math.max(maxAlignment, alignment);
                }
            }

            size = align(size, maxAlignment);

            return {size, offsets, alignment: maxAlignment};
        }
    }

    write(
        device: GPUDevice,
        buffer: GPUBuffer,
        data: WebGPUDataValue<T>,
        offset: number = 0
    ) {
        const bufferData = new ArrayBuffer(this.size);
        const dataView = new DataView(bufferData);

        const writeField = (field: WebGPUDataType, value: any, fieldOffset: number | OffsetMap) => {
            if (this.isBasicType(field)) {
                const basicType = field as WebGPUBasicType<any>;
                basicType.write(dataView, value, <number>fieldOffset);
            } else {
                const structType = field as WebGPUStructType;
                for (const key in structType) {
                    const field = structType[key];
                    const offsetMap = fieldOffset as OffsetMap;
                    writeField(field, value[key], offsetMap[key]);
                }
            }
        }

        for (const key in this.definition) {
            const field = this.definition[key] as WebGPUDataType;
            writeField(field, data[key], this.offsets[key]);
        }

        device.queue.writeBuffer(buffer, offset, bufferData);
    }

    read(buffer: ArrayBuffer, offset: number = 0): WebGPUDataValue<T> {
        const dataView = new DataView(buffer, offset, this.size);
        const data: WebGPUDataValue<T> = {} as WebGPUDataValue<T>;

        const readField = (field: WebGPUDataType, fieldOffset: number | OffsetMap): any => {
            if (this.isBasicType(field)) {
                const basicType = field as WebGPUBasicType<any>;
                return  basicType.read(dataView, <number>fieldOffset);
            } else {
                const structType = field as WebGPUStructType;
                const result: any = {};
                for (const key in structType) {
                    const field = structType[key];
                    const offsetMap = fieldOffset as OffsetMap;
                    result[key] = readField(field, offsetMap[key]);
                }
                return result;
            }
        }

        for (const key in this.definition) {
            const field = this.definition[key] as WebGPUDataType;
            data[key] = readField(field, this.offsets[key]);
        }

        return data;
    }

    getOffset(key: keyof T): number | OffsetMap {
        return this.offsets[key];
    }
}

function align(offset: number, alignment: number): number {
    return Math.ceil(offset / alignment) * alignment;
}
