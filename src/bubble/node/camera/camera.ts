import {type Mat4, mat4} from "wgpu-matrix";
import {angleToRadians} from "@/bubble/math/maths";
import type {ResourceHolder} from "@/bubble/resource/resource_holder";
import {Component} from "@/bubble/core/component";

export class CameraComponent extends Component {
    private _camera: Camera | null = null;

    get camera(): Camera | null {
        return this._camera;
    }

    set camera(camera: Camera) {
        this._camera = camera;
        camera.parent = this;
    }

    update(deltaTime: number) {
        if (!this.camera) throw new Error("Camera not set in CameraComponent, did you forget to add?");
        if (this.camera.needsUpdate) {
            this.camera.update()
        }
    }
}

export abstract class Camera implements ResourceHolder {
    parent: CameraComponent | null = null;

    abstract projectionMatrix: Mat4;

    abstract updateProjectionMatrix(): void;

    abstract needsUpdate: boolean;

    abstract update(): void;
}

export class PerspectiveCamera extends Camera {
    needsUpdate: boolean = true;

    fov: number;
    aspect: number;
    near: number;
    far: number;

    projectionMatrix: Mat4;

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

        this.projectionMatrix = mat4.create();
        this.updateProjectionMatrix();
    }

    update() {
        this.needsUpdate = false;
        this.updateProjectionMatrix();
    }

    updateProjectionMatrix() {
        this.projectionMatrix = mat4.perspective(
            angleToRadians(this.fov),
            this.aspect,
            this.near,
            this.far,
            this.projectionMatrix, // avoid memory allocation
        )
    }
}

export class OrthographicCamera extends Camera {
    needsUpdate: boolean = true;

    left: number;
    right: number;
    top: number;
    bottom: number;
    near: number;
    far: number;

    projectionMatrix: Mat4;

    constructor(
        left: number,
        right: number,
        top: number,
        bottom: number,
        near: number,
        far: number
    ) {
        super();

        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;
        this.near = near;
        this.far = far;

        this.projectionMatrix = mat4.create();
        this.updateProjectionMatrix();
    }

    update() {
        this.needsUpdate = false;
        this.updateProjectionMatrix()
    }

    updateProjectionMatrix() {
        this.projectionMatrix = mat4.ortho(
            this.left,
            this.right,
            this.top,
            this.bottom,
            this.near,
            this.far,
            this.projectionMatrix, // avoid memory allocation
        )
    }
}

