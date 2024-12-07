export type TypedIntArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array;

export type TypedFloatArray = Uint16Array | Float32Array | Float64Array;

export type TypedArray = TypedIntArray | TypedFloatArray;

export type BigTypedArray = TypedArray | BigInt64Array | BigUint64Array;

export type TypedArrayConstructor =
  | Int8ArrayConstructor
  | Uint8ArrayConstructor
  | Int16ArrayConstructor
  | Uint16ArrayConstructor
  | Int32ArrayConstructor
  | Uint32ArrayConstructor
  | Float32ArrayConstructor
  | Float64ArrayConstructor;
