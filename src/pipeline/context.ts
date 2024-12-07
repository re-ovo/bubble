import RenderCache from '@/resource/render_cache';
import type { Scene } from '@/core/entity';

/**
 * 可编程渲染上下文
 *
 * 提供了一系列的方法来操作渲染流程
 */
class RenderContext {
  public readonly device: GPUDevice;
  public readonly renderCache: RenderCache;

  private _targetView: GPUTextureView | null = null;
  private _targetFormat: GPUTextureFormat | null = null;
  private _targetSize: GPUExtent3DDict | null = null;
  private _scene: Scene | null = null;

  private _commandEncoder: GPUCommandEncoder | null = null;
  private _renderPassEncoder: GPURenderPassEncoder | null = null;
  private _computePassEncoder: GPUComputePassEncoder | null = null;

  constructor(device: GPUDevice) {
    this.device = device;
    this.renderCache = new RenderCache(this);
    this._commandEncoder = this.device.createCommandEncoder();
  }

  setup(
    view: GPUTextureView,
    format: GPUTextureFormat,
    size: GPUExtent3DDict,
    scene: Scene,
  ) {
    this._targetView = view;
    this._targetFormat = format;
    this._targetSize = size;
    this._scene = scene;
  }

  get encoder() {
    if (!this._commandEncoder) {
      throw new Error('No encoder');
    }
    return this._commandEncoder;
  }

  get renderPassEncoder() {
    if (!this._renderPassEncoder) {
      throw new Error('No render pass encoder');
    }
    return this._renderPassEncoder;
  }

  get computePassEncoder() {
    if (!this._computePassEncoder) {
      throw new Error('No compute pass encoder');
    }
    return this._computePassEncoder;
  }

  get target(): GPUTextureView {
    if (!this._targetView) {
      throw new Error('No target view');
    }
    return this._targetView;
  }

  get targetFormat(): GPUTextureFormat {
    if (!this._targetFormat) {
      throw new Error('No target format');
    }
    return this._targetFormat;
  }

  get targetSize(): GPUExtent3DDict {
    if (!this._targetSize) {
      throw new Error('No target size');
    }
    return this._targetSize;
  }

  get scene(): Scene {
    if (!this._scene) {
      throw new Error('No scene');
    }
    return this._scene;
  }

  submit() {
    this.device.queue.submit([this.encoder.finish()]);
    this._commandEncoder = this.device.createCommandEncoder(); // reset encoder
  }

  beginRenderPass(passDescriptor: GPURenderPassDescriptor) {
    this._renderPassEncoder = this.encoder.beginRenderPass(passDescriptor);
  }

  endRenderPass() {
    this.renderPassEncoder.end();
  }

  beginComputePass(descriptor?: GPUComputePassDescriptor) {
    this._computePassEncoder = this.encoder.beginComputePass(descriptor);
  }

  endComputePass() {
    this.computePassEncoder.end();
  }
}

export default RenderContext;
