import type {Camera} from "@/bubble/node/camera/camera";
import type {Scene} from "@/bubble/core/scene";
import {ScriptablePipeline} from "@/bubble/pipeline/pipeline";
import {ForwardPlusPipeline} from "@/bubble/pipeline/forwardplus/forward_plus_pipeline";
import {RenderContext} from "@/bubble/pipeline/context";
import {VersionedCache} from "@/bubble/resource/versioned";
import type {Transform} from "@/bubble/math/transform";

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
        this.canvasContext.configure({
            device: this._device!,
            format: this.preferredFormat,
            alphaMode: 'opaque',
        })
        this._renderContext = new RenderContext(
            this.device,
            this.canvasContext.getCurrentTexture().createView()
        );
        this._renderPipeline = options.pipelineProvider?.() ?? new ForwardPlusPipeline();
        console.log("WebGPU initialized.");
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
        if (Array.isArray(camera)) {
            this._renderPipeline?.render(this._renderContext!, camera);
        } else {
            this._renderPipeline?.render(this._renderContext!, [camera]);
        }
    }

    private transformVersionMap = new VersionedCache<Transform, void>()

    // 更新场景
    private updateScene(scene: Scene) {
        // 更新Clock
        this.clock.tick();

        // 更新Entity / Component
        for (let entity of scene.objects) {
            // 更新Object的所有Component
            for (let [_, component] of entity.components) {
                component.update?.(this.clock.deltaTime);
            }

            // 更新Object的Transform(Component), 特殊Component
            if (this.transformVersionMap.get(entity.transform)?.version !== entity.transform.version) {
                this.transformVersionMap.set(entity.transform, undefined); // mark as updated
                entity.transform.updateMatrix()
                // 同时还需要更新其子节点
                scene.getChildren(entity, true).forEach(child => child.transform.updateMatrix());
            }
        }
    }

    destroy() {
        this._canvasContext?.unconfigure();
        this.device.destroy();
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
