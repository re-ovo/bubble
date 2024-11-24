import {Camera, MaterialBlendMode, RendererComponent} from "@/node";
import RenderContext from "./context";
import {vec3} from "wgpu-matrix";

/**
 * A list of renderers that are to be rendered in the current frame.
 *
 * This class is responsible for managing the renderers that are to be rendered in the current frame.
 */
export class RendererList {
    private _context: RenderContext;
    private _camera: Camera;

    private _renderers: RendererComponent[];

    constructor(
        context: RenderContext,
        camera: Camera,
    ) {
        this._context = context;
        this._camera = camera;

        this._renderers = [];
    }

    update() {
        const scene = this._context.scene;

        this._renderers = [];

        // Traverse the scene and collect all renderers
        scene.traverse((entity) => {
            const renderer = entity.getComponent(RendererComponent);
            if (renderer) {
                this._renderers.push(renderer);
            }
        })

        const cameraPosition = this._camera.parent!.entity.transform.worldPosition;
        // Sort the renderers based on their material blend mode and distance to the camera
        this._renderers.sort((a, b) => {
            const aMaterial = a.material;
            const bMaterial = b.material;

            // First, sort by blend mode (opaque first)
            if (aMaterial.blendMode !== bMaterial.blendMode) {
                return aMaterial.blendMode - bMaterial.blendMode;
            }

            // If blend mode is the same, sort by distance to the camera (farther first for transparent objects)
            const aPosition = a.entity.transform.worldPosition;
            const bPosition = b.entity.transform.worldPosition;

            const aDistance = vec3.distance(
                cameraPosition,
                aPosition
            );
            const bDistance = vec3.distance(
                cameraPosition,
                bPosition
            );

            return bMaterial.blendMode === MaterialBlendMode.BLEND ? bDistance - aDistance : aDistance - bDistance;
        });

        // console.log(this._renderers.map(item => `${item.material.blendMode} / ${vec3.distance(cameraPosition, item.entity.transform.worldPosition)}`));
    }

    get renderObjects() {
        return this._renderers;
    }
}
