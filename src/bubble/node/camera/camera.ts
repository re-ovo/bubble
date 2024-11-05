import {type Mat4, mat4} from "wgpu-matrix";
import {angleToRadians} from "@/bubble/math/maths";
import {Component} from "@/bubble/core/system";
import {type Tracked, Tracker, TrackState} from "@/bubble/resource/tracker";
import {track} from "@/bubble/resource/tracker";

export class CameraComponent extends Component {
    private _camera: Tracked<Camera> | null = null;
    private _cameraTracker = new Tracker<Camera>();

    get camera(): Camera | null {
        return this._camera;
    }

    set camera(camera: Camera) {
        this._camera = track(camera);
        camera.parent = this;
    }

    update(deltaTime: number) {
        if (!this._camera) throw new Error("Camera not set in CameraComponent, did you forget to add?");

        const cameraState = this._cameraTracker.getTrackState(this._camera);
        if (cameraState !== TrackState.FRESH) {
            console.log("Updating camera projection matrix", this._camera.updateProjectionMatrix);
            this._camera.updateProjectionMatrix();
            this._cameraTracker.markFresh(this._camera);
        }
    }
}

export abstract class Camera {
    parent: CameraComponent | null = null;

    abstract readonly projectionMatrix: Tracked<Mat4>;

    abstract updateProjectionMatrix(): void;
}

export class PerspectiveCamera extends Camera {
    fov: number;
    aspect: number;
    near: number;
    far: number;

    readonly projectionMatrix: Tracked<Mat4>;

    constructor(
        fov: number,
        aspect: number,
        near: number,
        far: number
    ) {
        super();

        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;

        this.projectionMatrix = track(mat4.create());
        this.updateProjectionMatrix();
    }

    updateProjectionMatrix() {
        mat4.perspective(
            angleToRadians(this.fov),
            this.aspect,
            this.near,
            this.far,
            this.projectionMatrix, // avoid memory allocation
        )
    }
}

export class OrthographicCamera extends Camera {
    left: number;
    right: number;
    bottom: number;
    top: number;
    near: number;
    far: number;

    readonly projectionMatrix: Tracked<Mat4>;

    constructor(
        left: number,
        right: number,
        bottom: number,
        top: number,
        near: number,
        far: number
    ) {
        super();

        this.left = left;
        this.right = right;
        this.bottom = bottom;
        this.top = top;
        this.near = near;
        this.far = far;

        this.projectionMatrix = track(mat4.create());
        this.updateProjectionMatrix();
    }

    updateProjectionMatrix() {
        mat4.ortho(
            this.left,
            this.right,
            this.bottom,
            this.top,
            this.near,
            this.far,
            this.projectionMatrix, // avoid memory allocation
        )
    }
}

