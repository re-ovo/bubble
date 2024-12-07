import type { TypedArray } from '@/core/types';
import type { DirtyObject } from '@/core/dirty';
import {
  makeShaderDataDefinitions,
  makeStructuredView,
  type StructDefinition,
  type VariableDefinition,
} from 'webgpu-utils';
import { providerWGSLCounterScope } from '@/shader';

class BufferResource implements DirtyObject<BufferDirtyFlag> {
  private _data: ArrayBuffer;
  private readonly _usage: GPUBufferUsageFlags;
  private _dirtyFlags: BufferDirtyFlag = BufferDirtyFlag.ALL;

  constructor(data: ArrayBuffer, usage: GPUBufferUsageFlags) {
    this._data = data;
    this._usage = usage;
  }

  get data(): ArrayBuffer {
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
    offset: number = 0,
  ): void {
    const view = makeStructuredView(def, this._data, offset);
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
  DATA = 1, // the data need to be uploaded to the GPUBuffer
  SIZE = 2, // the size of the buffer has changed, need to recreate the GPUBuffer
  ALL = DATA | SIZE,
}

class UniformBuffer extends BufferResource {
  constructor(data: ArrayBuffer) {
    super(data, GPUBufferUsage.UNIFORM);
  }

  static ofSize(size: number): UniformBuffer {
    return new UniformBuffer(new ArrayBuffer(size));
  }

  static ofDefinition(def: () => string): UniformBuffer {
    const defs = providerWGSLCounterScope(() => {
      return makeShaderDataDefinitions(def());
    });
    const variable = defs.uniforms[Object.keys(defs.uniforms)[0]];
    const size = variable.size;
    return UniformBuffer.ofSize(size);
  }
}

class StorageBuffer extends BufferResource {
  constructor(data: ArrayBuffer) {
    super(data, GPUBufferUsage.STORAGE);
  }
}

export { BufferResource, BufferDirtyFlag, UniformBuffer, StorageBuffer };
