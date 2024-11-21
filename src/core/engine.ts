import type {Camera} from "@/node/camera/camera";
import {ScriptablePipeline} from "@/pipeline/pipeline";
import {ForwardPlusPipeline} from "@/pipeline/forwardplus/forward_plus_pipeline";
import RenderContext from "@/pipeline/context";
import type {Scene} from "@/core/entity";

export interface EngineOptions {
    // RequestAdapter options
    adapterOptions?: GPURequestAdapterOptions;

    // Pipeline Provider
    pipelineProvider?: () => ScriptablePipeline;
}

export class RenderEngine {
    // WebGPU device and canvas context
    private _device: GPUDevice | null = null;
    private _canvasContext: GPUCanvasContext | null = null;
    private _canvasSize: GPUExtent3DDict | null = null;

    // SRP
    private _renderContext: RenderContext | null = null;
    private _renderPipeline: ScriptablePipeline | null = null;

    // misc
    private readonly preferredFormat: GPUTextureFormat;
    private readonly clock = new Clock();

    constructor() {
        this.preferredFormat = navigator.gpu.getPreferredCanvasFormat();
    }

    private get device(): GPUDevice {
        if (!this._device) throw new Error("WebGPU device not initialized.");
        return this._device;
    }

    private get canvasContext(): GPUCanvasContext {
        if (!this._canvasContext) throw new Error("WebGPU context not initialized.");
        return this._canvasContext;
    }

    async init(
        canvas: HTMLCanvasElement,
        options: EngineOptions
    ) {
        this._device = await this.getDevice(options.adapterOptions);
        this._canvasContext = canvas.getContext("webgpu");
        this._canvasSize = {
            width: canvas.width,
            height: canvas.height,
            depthOrArrayLayers: 1
        }
        this.canvasContext.configure({
            device: this._device!,
            format: this.preferredFormat,
            alphaMode: 'opaque',
        })
        this._renderContext = new RenderContext(this.device);
        this._renderPipeline = options.pipelineProvider?.() ?? new ForwardPlusPipeline();
        console.log("WebGPU initialized.");
        console.log("Preferred format: ", this.preferredFormat);
        // console.table(this.device.limits)
    }

    resize(width: number, height: number) {
        this._canvasSize = {
            width: width,
            height: height,
            depthOrArrayLayers: 1
        }
        this.canvasContext.configure({
            device: this.device,
            format: this.preferredFormat,
        })
    }

    async getDevice(options?: GPURequestAdapterOptions) {
        if (!navigator.gpu) throw new Error("WebGPU not supported on this browser.");
        const adapter = await navigator.gpu.requestAdapter(options);
        if (!adapter) throw new Error("No appropriate GPUAdapter found.");
        return await adapter.requestDevice();
    }

    // 执行渲染
    render(scene: Scene, camera: Camera | Camera[]) {
        this.updateScene(scene);
        this._renderContext?.setup(
            this.canvasContext.getCurrentTexture().createView(),
            this.preferredFormat,
            this._canvasSize!,
            scene
        )
        if (Array.isArray(camera)) {
            this._renderPipeline?.render(this._renderContext!, camera);
        } else {
            this._renderPipeline?.render(this._renderContext!, [camera]);
        }
    }

    // 更新场景
    private updateScene(scene: Scene) {
        // 更新Clock
        this.clock.tick();

        // 更新Entity / Component
        scene.traverse(entity => {
            entity.components.forEach(component => {
                component.update?.(this.clock.deltaTime);
            })
        });
    }

    destroy() {
        this.device.destroy();
        this._canvasContext?.unconfigure();
    }
}

export class Clock {
    private _lastTime = 0;
    private _deltaTime = 0;

    get deltaTime() {
        return this._deltaTime;
    }

    tick() {
        const time = performance.now();
        this._deltaTime = (time - this._lastTime);
        this._lastTime = time;
    }
}
