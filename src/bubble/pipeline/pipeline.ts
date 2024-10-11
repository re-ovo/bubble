import type {Camera} from "@/bubble/core/camera";

export interface ScriptableRenderPass {
    execute(context: ScriptableRenderContext, commandEncoder: GPUCommandEncoder): void;
}

export class ScriptableRenderContext {
    device: GPUDevice;
    targetView: GPUTextureView;

    constructor(device: GPUDevice, targetView: GPUTextureView) {
        this.device = device
        this.targetView = targetView;
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

/**
 * 可编程渲染管线
 *
 * 可以在管线中自定义渲染流程, 类似于Unity的SRP
 */
export class ScriptablePipeline {
    render(context: ScriptableRenderContext, cameras: Camera[]) {
        // Dummy implementation
        throw new Error("Not implemented");
    }
}
