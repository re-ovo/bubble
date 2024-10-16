import type {ResourceMapper} from "@/bubble/resource/resource_mapper";
import type {Camera} from "@/bubble/node/camera/camera";
import type {RenderContext} from "@/bubble/pipeline/context";
import type {Object3D} from "@/bubble/core/object3d";

export interface CameraGPUResources {
    buffer: GPUBuffer;
}

export class CameraMapper implements ResourceMapper<Camera, CameraGPUResources> {
    private context: RenderContext;
    private cameras = new WeakMap<Camera, CameraGPUResources>();

    constructor(context: RenderContext) {
        this.context = context
    }

    sync(resource: Camera): CameraGPUResources {
        let gpu = this.cameras.get(resource)
        if (!gpu) {
            gpu = this.create(resource)
            this.cameras.set(resource, gpu)
        }
        let object3d = resource.parent!.parent as Object3D
        console.log("Camera needs update", resource.needsUpdate, object3d.transform.needsUpdate)
        if(resource.needsUpdate || object3d.transform.needsUpdate) {
            console.log("UPDATED")
            resource.update()
            object3d.transform.update()
            gpu = this.update(resource, gpu)
        }
        return gpu
    }

    create(resource: Camera): CameraGPUResources {
        // TODO: create camera resources
        return {
            buffer: this.context.device.createBuffer({
                size: 0,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            })
        }
    }

    update(resource: Camera, gpu: CameraGPUResources): CameraGPUResources {
        // TODO: update camera resources
        return {
            buffer: gpu.buffer,
        }
    }

    dispose(resource: Camera, gpu: CameraGPUResources): void {
        gpu.buffer.destroy()
    }
}
