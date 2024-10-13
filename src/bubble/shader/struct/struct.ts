import {type WebGPUBasicType} from "@/bubble/shader/struct/basic_types";
import {TypedBuffer} from "@/bubble/shader/struct/typed_buffer";

/**
 * WebGPU结构体类型定义
 */
export interface WebGPUStructType {
    [key: string]: WebGPUDataType;
}

/**
 * WebGPU数组类型定义
 */
export interface WebGPUArrayType<T extends WebGPUDataType> {
    length: number;
}

/**
 * WebGPU数据类型TS定义
 *
 * 可以是基础类型，也可以是结构体类型
 */
export type WebGPUDataType = WebGPUBasicType<any> | WebGPUStructType;

/**
 * WebGPU数据"值"类型定义, 用于描述WebGPUDataType对应的值类型
 */
export type WebGPUDataValue<T> = T extends WebGPUBasicType<infer U>
    ? U
    : T extends WebGPUStructType
        ? { [K in keyof T]: WebGPUDataValue<T[K]> }
        : never;

/**
 * 定义WebGPU结构体类型
 *
 * @param definition 结构体定义
 * @returns WebGPUDataType
 */
export function struct<T extends WebGPUDataType>(definition: T): TypedBuffer<T> {
    return new TypedBuffer(definition);
}

/**
 * 定义WebGPU基础类型
 *
 * @param type 基础类型
 * @returns WebGPUDataType
 */
export function basic<T extends WebGPUBasicType<V>, V>(type: T): TypedBuffer<T>  {
    return new TypedBuffer(type);
}
