/**
 * 可编程渲染上下文
 *
 * 提供了一系列的方法来操作渲染流程
 */
export class RenderContext {
    device: GPUDevice;
    targetView: GPUTextureView;

    constructor(device: GPUDevice, targetView: GPUTextureView) {
        this.device = device
        this.targetView = targetView;
        this._commandEncoder = this.device.createCommandEncoder();
    }

    private _commandEncoder: GPUCommandEncoder | null = null;
    get encoder() {
        if (!this._commandEncoder) {
            throw new Error("No encoder");
        }
        return this._commandEncoder;
    }

    private _renderPassEncoder: GPURenderPassEncoder | null = null;
    get renderPassEncoder() {
        if (!this._renderPassEncoder) {
            throw new Error("No render pass encoder");
        }
        return this._renderPassEncoder;
    }

    private _computePassEncoder: GPUComputePassEncoder | null = null;
    get computePassEncoder() {
        if (!this._computePassEncoder) {
            throw new Error("No compute pass encoder");
        }
        return this._computePassEncoder;
    }

    prepareEncoder() {
        this._commandEncoder = this.device.createCommandEncoder();
    }

    submit() {
        this.device.queue.submit([this.encoder.finish()]);
        this._commandEncoder = this.device.createCommandEncoder(); // reset encoder
    }

    beginRenderPass(passDescriptor: GPURenderPassDescriptor) {
        this.encoder.beginRenderPass(passDescriptor);
    }

    endRenderPass() {
        this.renderPassEncoder.end()
    }

    beginComputePass(descriptor?: GPUComputePassDescriptor) {
        this._computePassEncoder = this.encoder.beginComputePass(descriptor);
    }

    endComputePass() {
        this.computePassEncoder.end();
    }
}
