import RenderCache from "@/resource/render_cache";
import type {Scene} from "@/core/entity";

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
        this.device = device
        this.renderCache = new RenderCache(this)
        this._commandEncoder = this.device.createCommandEncoder();
    }

    setup(
        view: GPUTextureView,
        format: GPUTextureFormat,
        size: GPUExtent3DDict,
        scene: Scene
    ) {
        this._targetView = view;
        this._targetFormat = format;
        this._targetSize = size;
        this._scene = scene;
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

    get target(): GPUTextureView {
        if (!this._targetView) {
            throw new Error("No target view");
        }
        return this._targetView;
    }

    get targetFormat(): GPUTextureFormat {
        if (!this._targetFormat) {
            throw new Error("No target format");
        }
        return this._targetFormat;
    }

    get targetSize(): GPUExtent3DDict {
        if (!this._targetSize) {
            throw new Error("No target size");
        }
        return this._targetSize;
    }

    get scene(): Scene {
        if (!this._scene) {
            throw new Error("No scene");
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
        this.renderPassEncoder.end()
    }

    beginComputePass(descriptor?: GPUComputePassDescriptor) {
        this._computePassEncoder = this.encoder.beginComputePass(descriptor);
    }

    endComputePass() {
        this.computePassEncoder.end();
    }

    // private _cameraCache = new VersionedCache<Camera, BufferResource>()
    // private _cameraBuffer: BufferResource | null = null
    // get cameraBuffer() {
    //     if (!this._cameraBuffer) {
    //         throw new Error("Camera buffer not set, did you forget to setup camera?");
    //     }
    //     return this._cameraBuffer
    // }
    //
    // setupCamera(camera: Camera) {
    //     let buffer = this._cameraCache.get(camera)
    //     const entity = camera.parent!.entity!
    //     let transform = entity.getComponent(Transform)!
    //     if (!buffer) {
    //         const buf = new BufferResource(
    //             "CameraInput",
    //             GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    //         )
    //         buf.setSize(192) // 64(mat4) + 64(mat4) + 64(vec3, padding)
    //         buf.setFloat32Array(0, camera.projectionMatrix)
    //         buf.setFloat32Array(64, transform.transformMatrixInverse)
    //         buf.setFloat32Array(128, transform.position)
    //         buffer = {
    //             value: buf,
    //             version: [camera.version, transform.version]
    //         }
    //         this._cameraCache.set(camera, buf, buffer.version)
    //     }
    //     const currentVersion = buffer.version as number[]
    //     if (currentVersion[0] !== camera.version || currentVersion[1] !== transform.version) {
    //         buffer.value.setFloat32Array(0, camera.projectionMatrix)
    //         buffer.value.setFloat32Array(64, transform.transformMatrixInverse)
    //         buffer.value.setFloat32Array(128, transform.position)
    //         buffer.version = [camera.version, transform.version]
    //     }
    //     this._cameraBuffer = buffer.value
    //     return buffer.value
    // }
    //
    // private _transformCache = new VersionedCache<Transform, BufferResource>()
    //
    // setupModel(entity: Entity) {
    //     const transform = entity.getComponent(Transform)!
    //     let cached = this._transformCache.get(transform)
    //     if (!cached) {
    //         const buf = new BufferResource(
    //             "ModelInfo",
    //             GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    //         )
    //         buf.setSize(128)
    //         buf.setFloat32Array(0, transform.transformMatrix) // model matrix in MVP
    //         buf.setFloat32Array(64, transform.transformMatrixInverse) // model matrix inverse
    //         cached = {
    //             value: buf,
    //             version: transform.version
    //         }
    //         this._transformCache.set(transform, buf, cached.version)
    //     }
    //     if (cached.version !== transform.version) {
    //         cached.value.setFloat32Array(0, transform.transformMatrix)
    //         cached.value.setFloat32Array(64, transform.transformMatrixInverse)
    //         cached.version = transform.version
    //     }
    //     return cached.value
    // }
}

export default RenderContext;
