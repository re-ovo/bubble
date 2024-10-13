import {type Mat4, mat4} from "wgpu-matrix";
import {angleToRadians} from "@/bubble/math/maths";
import type {Updatable} from "@/bubble/core/updatable";
import {Component} from "@/bubble/core/component";

export class CameraComponent extends Component {
    camera: Camera | null = null;

    update(deltaTime: number) {
        if(this.camera && this.camera.needsUpdate) {
            this.camera.update()
        }
    }
}

export interface Camera extends Updatable {
    projectionMatrix: Mat4;
}

export class PerspectiveCamera implements Camera {
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
        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;

        this.projectionMatrix = mat4.create();
        this.update();
    }

    update() {
        this.needsUpdate = false;
        this.projectionMatrix = mat4.perspective(
            angleToRadians(this.fov),
            this.aspect,
            this.near,
            this.far,
            this.projectionMatrix, // avoid memory allocation
        )
    }
}

export class OrthographicCamera implements Camera {
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
        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;
        this.near = near;
        this.far = far;

        this.projectionMatrix = mat4.create();
        this.update();
    }

    update() {
        this.needsUpdate = false;
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

