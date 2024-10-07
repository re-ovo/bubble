import {type Mat4, mat4, type Quat, type Vec3} from "wgpu-matrix";
import type {Updatable} from "@/bubble/core/core";
import {angleToRadians} from "@/bubble/math/maths";
import {Transform} from "@/bubble/math/transform";

export interface Camera extends Updatable {
    transform: Transform;
}

export class PerspectiveCamera implements Camera {
    needsUpdate: boolean = true;

    transform: Transform;

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
        this.transform = new Transform();

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

    transform: Transform;

    left: number;
    right: number;
    top: number;
    bottom: number;
    near: number;
    far: number;

    projectionMatrix: Mat4;

    constructor(
        position: Vec3,
        rotation: Quat,
        left: number,
        right: number,
        top: number,
        bottom: number,
        near: number,
        far: number
    ) {
        this.transform = new Transform();

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

