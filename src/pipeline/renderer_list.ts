import { Camera, RendererComponent } from "@/node";
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

        // Sort the renderers based on their distance to the camera
        this._renderers.sort((a, b) => {
            const aPosition = a.entity.transform.worldPosition
            const bPosition = b.entity.transform.worldPosition

            const aDistance = vec3.distance(
                this._camera.parent!.entity.transform.worldPosition,
                aPosition
            )
            const bDistance = vec3.distance(
                this._camera.parent!.entity.transform.worldPosition,
                bPosition
            )

            return aDistance - bDistance // Sort in ascending order (closest first)
        })

        // Sort the renderers based on their material blend mode
        this._renderers.sort((a, b) => {
            const aMaterial = a.material
            const bMaterial = b.material

            return aMaterial.blendMode - bMaterial.blendMode // Sort in ascending order (opaque first)
        })
    }

    get renderObjects() {
        return this._renderers;
    }
}
