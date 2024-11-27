import {Entity, RenderEngine} from "@/core";
import {CameraComponent, PerspectiveCamera} from "@/node";
import {vec3} from "wgpu-matrix";
import {FPSController, OrbitController} from "@/helper/controller";
import {Pane} from "tweakpane";

export function setupFpsCamera(
    canvas: HTMLCanvasElement,
    engine: RenderEngine,
    pane: Pane
): {
    cameraEntity: Entity,
    cameraComponent: CameraComponent,
} {
    let cameraEntity = new Entity('Camera')
    let cameraComponent = cameraEntity.addComponent(CameraComponent)
    cameraComponent.camera = new PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        5000
    )
    cameraEntity.transform.localPosition = vec3.create(0, 0, 5)
    cameraEntity.addComponent(OrbitController).init(canvas)

    // Pane
    const cameraFolder = pane.addFolder({
        title: 'Camera',
    })
    // cameraFolder.addBinding(cameraEntity.getComponent(FPSController)!, 'moveSpeed', {
    //     min: 0,
    //     max: 10,
    // })
    const cameraTransformDelegate = {
        get worldPos() {
            const pos = cameraEntity.transform.worldPosition
            return `${pos[0].toFixed(2)}, ${pos[1].toFixed(2)}, ${pos[2].toFixed(2)}`
        }
    }
    cameraFolder.addBinding(cameraTransformDelegate, 'worldPos', {
        readonly: true,
    })

    // Resize Observer
    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            let {width, height} = entry.contentRect;
            width = Math.floor(width);
            height = Math.floor(height);
            canvas.width = width;
            canvas.height = height;

            engine.resize(width, height);

            if (cameraComponent.camera) {
                if(cameraComponent.camera instanceof PerspectiveCamera) {
                    cameraComponent.camera.aspect = width / height
                }
                cameraComponent.camera.updateProjectionMatrix()
            }
        }
    });
    resizeObserver.observe(canvas);

    return {
        cameraEntity: cameraEntity,
        cameraComponent: cameraComponent,
    }
}
