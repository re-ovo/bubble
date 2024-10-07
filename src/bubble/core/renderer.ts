import {Object3D, type Scene} from "@/bubble/core/node";
import type {Camera} from "@/bubble/core/camera";
import {RendererComponent} from "@/bubble/components/renderer/renderer";
import {MeshRenderer} from "@/bubble/components/renderer/mesh_renderer";
import {wgsl} from "@/bubble/shader/lang";

export class WebGPURenderer {
    private _device: GPUDevice | null = null;
    private _context: GPUCanvasContext | null = null;
    private _targetView: GPUTextureView | null = null;
    private readonly preferredFormat: GPUTextureFormat;
    private readonly clock = new Clock();

    constructor() {
        this.preferredFormat = navigator.gpu.getPreferredCanvasFormat();
    }

    private get device(): GPUDevice {
        if (!this._device) throw new Error("WebGPU device not initialized.");
        return this._device;
    }

    private get context(): GPUCanvasContext {
        if (!this._context) throw new Error("WebGPU context not initialized.");
        return this._context;
    }

    private get targetView(): GPUTextureView {
        if (!this._targetView) throw new Error("WebGPU target view not initialized.");
        return this._targetView;
    }

    async init(canvas: HTMLCanvasElement) {
        this._device = await this.getDevice();
        this._context = canvas.getContext("webgpu");
        this.context.configure({
            device: this._device!,
            format: this.preferredFormat,
            alphaMode: 'opaque',
        })
        this._targetView = this.context.getCurrentTexture().createView();
        console.log("WebGPU initialized.");
    }

    async getDevice() {
        if (!navigator.gpu) throw new Error("WebGPU not supported on this browser.");
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) throw new Error("No appropriate GPUAdapter found.");
        return await adapter.requestDevice();
    }

    // 执行渲染
    render(scene: Scene, camera: Camera) {
        this.updateScene(scene);
        this.drawScene(scene, camera);
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

    // 绘制场景
    private drawScene(scene: Scene, camera: Camera) {
        const drawables = this.getSortedDrawables(scene);
        const commandEncoder = this.device.createCommandEncoder();
        const passEncoder = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: this.targetView,
                loadOp: 'clear',
                clearValue: {r: 0, g: 0, b: 0, a: 1},
                storeOp: 'store',
            }],
        });
        for (let [object, renderer] of drawables) {
            if (renderer instanceof MeshRenderer) {
                this.drawMesh(object, renderer, camera, passEncoder);
            }
        }
        passEncoder.end()
        this.device.queue.submit([commandEncoder.finish()])
    }

    private drawMesh(object: Object3D, renderer: MeshRenderer, camera: Camera, passEncoder: GPURenderPassEncoder) {

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
        this._context?.unconfigure();
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
