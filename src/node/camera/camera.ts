import { type Mat4, mat4 } from 'wgpu-matrix';
import { angleToRadians } from '@/math/maths';
import { Component } from '@/core/component';
import { DirtyObject } from '@/core';

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
    if (!this._camera)
      throw new Error(
        'Camera not set in CameraComponent, did you forget to add?',
      );
  }
}

export abstract class Camera implements DirtyObject<CameraDirtyFlag> {
  private _dirtyFlag: CameraDirtyFlag = CameraDirtyFlag.ALL;
  parent: CameraComponent | null = null;

  abstract readonly projectionMatrix: Mat4;

  abstract updateProjectionMatrix(): void;

  setDirty(flag: CameraDirtyFlag) {
    this._dirtyFlag |= flag;
  }

  clearDirty(flag: CameraDirtyFlag) {
    this._dirtyFlag &= ~flag;
  }

  isDirty(flag: CameraDirtyFlag): boolean {
    return (this._dirtyFlag & flag) !== 0;
  }
}

export class PerspectiveCamera extends Camera {
  fov: number;
  aspect: number;
  near: number;
  far: number;

  readonly projectionMatrix: Mat4;

  constructor(fov: number, aspect: number, near: number, far: number) {
    super();

    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;

    this.projectionMatrix = mat4.create();
    this.updateProjectionMatrix();
  }

  updateProjectionMatrix() {
    mat4.perspective(
      angleToRadians(this.fov),
      this.aspect,
      this.near,
      this.far,
      this.projectionMatrix, // avoid memory allocation
    );
    this.setDirty(CameraDirtyFlag.PROJECTION_MATRIX);
  }
}

export class OrthographicCamera extends Camera {
  left: number;
  right: number;
  bottom: number;
  top: number;
  near: number;
  far: number;

  readonly projectionMatrix: Mat4;

  constructor(
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number,
    far: number,
  ) {
    super();

    this.left = left;
    this.right = right;
    this.bottom = bottom;
    this.top = top;
    this.near = near;
    this.far = far;

    this.projectionMatrix = mat4.create();
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
    );
    this.setDirty(CameraDirtyFlag.PROJECTION_MATRIX);
  }
}

export enum CameraDirtyFlag {
  PROJECTION_MATRIX = 1 << 0,
  ALL = PROJECTION_MATRIX,
}
