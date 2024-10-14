import {Object3D} from "@/bubble/core/object3d";
import type {Camera} from "@/bubble/node/camera/camera";
import {RendererComponent} from "@/bubble/node/renderer/renderer";
import {MeshRenderer} from "@/bubble/node/renderer/mesh_renderer";
import type {Scene} from "@/bubble/core/scene";
import {ScriptablePipeline} from "@/bubble/pipeline/pipeline";
import {ForwardPlusPipeline} from "@/bubble/pipeline/forwardplus/forward_plus_pipeline";
import {RenderContext} from "@/bubble/pipeline/context";

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

    // 更新场景
    private updateScene(scene: Scene) {
        // 更新Clock
        this.clock.tick();

        // 更新Objects
        for (let object of scene.objects) {
            // 更新Object的所有Component
            for (let [_, component] of object.components) {
                component.update?.(this.clock.deltaTime);
            }

            // 更新Object的Transform
            if (object.transform.needsUpdate) {
                object.transform.update();
                // 同时还需要更新其子节点
                scene.getChildren(object, true).forEach(child => child.transform.update());
            }
        }
    }

    private _drawableSortCache: [Object3D, RendererComponent][] = [];

    // 获取所有有RendererComponent的Object，并按照Material的BlendMode排序
    private getSortedDrawables(scene: Scene) {
        this._drawableSortCache.length = 0; // clear

        // filter objects with renderer component
        for (let object of scene.objects) {
            const renderComponent = object.getComponent(RendererComponent);
            if (renderComponent) {
                this._drawableSortCache.push([object, renderComponent]);
            }
        }

        // sort by material blend mode
        this._drawableSortCache.sort((a, b) => {
            const [, aRenderer] = a
            const [, bRenderer] = b

            if (aRenderer instanceof MeshRenderer && bRenderer instanceof MeshRenderer) {
                const aMaterial = aRenderer.material
                const bMaterial = bRenderer.material

                if (aMaterial && bMaterial) {
                    return aMaterial.blendMode - bMaterial.blendMode
                }
            }

            return 0;
        })

        return this._drawableSortCache;
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
