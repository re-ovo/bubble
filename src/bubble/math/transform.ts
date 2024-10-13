import type {Updatable} from "@/bubble/core/updatable";
import {mat4, type Mat4, quat, type Quat, type RotationOrder, vec3, type Vec3} from "wgpu-matrix";
import {angleToRadians} from "@/bubble/math/maths";

export class Transform implements Updatable {
    needsUpdate: boolean = true;

    parent: Transform | null = null;

    position: Vec3; // this is local position
    rotation: Quat;
    scale: Vec3;

    positionMatrix: Mat4;
    rotationMatrix: Mat4;
    scaleMatrix: Mat4;

    transformMatrix: Mat4;
    transformMatrixInverse: Mat4;

    constructor() {
        this.position = vec3.create(0, 0, 0);
        this.rotation = quat.create(0, 0, 0);
        this.scale = vec3.create(1, 1, 1);
        this.positionMatrix = mat4.create();
        this.rotationMatrix = mat4.create();
        this.scaleMatrix = mat4.create();
        this.transformMatrix = mat4.create();
        this.transformMatrixInverse = mat4.create();
        this.update()
    }

    update() {
        this.needsUpdate = false;

        this.positionMatrix = mat4.translation(this.position, this.positionMatrix);
        this.rotationMatrix = mat4.fromQuat(this.rotation, this.rotationMatrix);
        this.scaleMatrix = mat4.scaling(this.scale, this.scaleMatrix);

        this.transformMatrix = mat4.mul(
            this.positionMatrix,
            this.rotationMatrix,
            this.transformMatrix,
        );
        this.transformMatrix = mat4.mul(
            this.transformMatrix,
            this.scaleMatrix,
            this.transformMatrix,
        );
        if (this.parent) {
            this.transformMatrix = mat4.mul(
                this.parent.transformMatrix,
                this.transformMatrix,
                this.transformMatrix,
            );
        }
        this.transformMatrixInverse = mat4.inverse(this.transformMatrix, this.transformMatrixInverse);
    }

    lookAt(target: Vec3) {
        const matrix = mat4.lookAt(this.position, target, vec3.create(0, 1, 0));
        quat.fromMat(matrix, this.rotation)
        this.needsUpdate = true;
    }

    setPosition(position: Vec3) {
        vec3.copy(position, this.position);
        this.needsUpdate = true;
    }

    setRotation(rotation: Quat) {
        quat.copy(rotation, this.rotation);
        this.needsUpdate = true;
    }

    setEulerAngles(eulerAngles: Vec3, order: RotationOrder = "xyz") {
        quat.fromEuler(
            angleToRadians(eulerAngles[0]),
            angleToRadians(eulerAngles[1]),
            angleToRadians(eulerAngles[2]),
            order,
            this.rotation
        );
        this.needsUpdate = true;
    }

    rotateEulerAngles(eulerAngles: Vec3, order: RotationOrder = "xyz") {
        quat.mul(
            this.rotation,
            quat.fromEuler(
                angleToRadians(eulerAngles[0]),
                angleToRadians(eulerAngles[1]),
                angleToRadians(eulerAngles[2]),
                order,
                quat.create()
            ),
            this.rotation
        );
        this.needsUpdate = true;
    }

    setScale(scale: Vec3) {
        vec3.copy(scale, this.scale);
        this.needsUpdate = true;
    }

    translate(translation: Vec3) {
        vec3.add(this.position, translation, this.position);
        this.needsUpdate = true;
    }

    rotate(rotation: Quat) {
        quat.mul(this.rotation, rotation, this.rotation);
        this.needsUpdate = true;
    }

    scaleBy(scale: Vec3) {
        vec3.mul(this.scale, scale, this.scale);
        this.needsUpdate = true;
    }
}
