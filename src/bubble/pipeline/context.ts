import {ResourceManager} from "@/bubble/resource/resource_manager";

/**
 * 可编程渲染上下文
 *
 * 提供了一系列的方法来操作渲染流程
 */
export class RenderContext {
    public readonly device: GPUDevice;
    public readonly targetView: GPUTextureView;
    public readonly resourceManager: ResourceManager;

    private _commandEncoder: GPUCommandEncoder | null = null;
    private _renderPassEncoder: GPURenderPassEncoder | null = null;
    private _computePassEncoder: GPUComputePassEncoder | null = null;

    constructor(device: GPUDevice, targetView: GPUTextureView) {
        this.device = device
        this.targetView = targetView;
        this.resourceManager = new ResourceManager(this);
        this._commandEncoder = this.device.createCommandEncoder();
    }

    get encoder() {
        if (!this._commandEncoder) {
            throw new Error("No encoder");
        }
        return this._commandEncoder;
    }

    get renderPassEncoder() {
        if (!this._renderPassEncoder) {
            throw new Error("No render pass encoder");
        }
        return this._renderPassEncoder;
    }

    get computePassEncoder() {
        if (!this._computePassEncoder) {
            throw new Error("No compute pass encoder");
        }
        return this._computePassEncoder;
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
