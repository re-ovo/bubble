import type {Mat4, Quat, Vec3} from "wgpu-matrix";
import {mat4, quat, vec3} from "wgpu-matrix";
import {Component} from "@/bubble/core/component";
import type {Entity} from "@/bubble/core/entity";

class Transform extends Component {
    private readonly _localPosition: Vec3;
    private readonly _localRotation: Quat;
    private readonly _localScale: Vec3;

    private readonly _positionMatrix: Mat4;
    private readonly _rotationMatrix: Mat4;
    private readonly _scaleMatrix: Mat4;

    private readonly _transformMatrix: Mat4;
    private readonly _localTransformMatrix: Mat4;
    private readonly _transformMatrixInverse: Mat4;

    private _dirtyFlag: TransformDirtyFlag = TransformDirtyFlag.All;

    // cache for fps camera control, avoid creating new quaternion every frame
    private readonly _rotationYaw = quat.identity();
    private readonly _rotationPitch = quat.identity();

    constructor(entity: Entity) {
        super(entity);

        this._localPosition = vec3.create(0, 0, 0);
        this._localRotation = quat.identity();
        this._localScale = vec3.create(1, 1, 1);

        this._positionMatrix = mat4.create();
        this._rotationMatrix = mat4.create();
        this._scaleMatrix = mat4.create();

        this._localTransformMatrix = mat4.create();
        this._transformMatrix = mat4.create();
        this._transformMatrixInverse = mat4.create();

        this.updateLocalMatrix()
        this.updateWorldMatrix()
    }

    get localPosition(): Vec3 {
        return this._localPosition;
    }

    get localRotation(): Quat {
        return this._localRotation;
    }

    get localScale(): Vec3 {
        return this._localScale;
    }

    get transformMatrix(): Mat4 {
        this.updateWorldMatrix();
        return this._transformMatrix;
    }

    get transformMatrixInverse(): Mat4 {
        this.updateWorldMatrix();
        return this._transformMatrixInverse;
    }

    get localTransformMatrix(): Mat4 {
        this.updateLocalMatrix();
        return this._localTransformMatrix;
    }

    set localPosition(value: Vec3) {
        vec3.copy(value, this._localPosition);
        this.setDirty(TransformDirtyFlag.LocalMatrix);
        this.setNeedsUpdateWorldMatrix()
    }

    set localRotation(value: Quat) {
        quat.copy(value, this._localRotation);
        this.setDirty(TransformDirtyFlag.LocalMatrix);
        this.setNeedsUpdateWorldMatrix()
    }

    set localScale(value: Vec3) {
        vec3.copy(value, this._localScale);
        this.setDirty(TransformDirtyFlag.LocalMatrix);
        this.setNeedsUpdateWorldMatrix()
    }

    // 返回指向摄像机前方的向量，不受旋转影响
    get forwardDirection(): Vec3 {
        // 默认指向z轴负方向
        const forward = vec3.create(0, 0, -1);
        // 旋转
        vec3.transformQuat(forward, this._localRotation, forward);
        // 此时forward可能受到摄像机的旋转影响，需要将y轴的旋转置为0
        forward[1] = 0;
        // 归一化
        vec3.normalize(forward, forward);
        return forward;
    }

    get rightDirection(): Vec3 {
        const right = vec3.create(1, 0, 0);
        vec3.transformQuat(right, this._localRotation, right);
        right[1] = 0;
        vec3.normalize(right, right);
        return right;
    }

    rotateYawPitch(yaw: number, pitch: number) {
        quat.fromAxisAngle(vec3.create(0, 1, 0), yaw, this._rotationYaw);
        quat.fromAxisAngle(vec3.create(1, 0, 0), pitch, this._rotationPitch);

        quat.mul(this._rotationYaw, this._localRotation, this._localRotation);
        quat.mul(this._localRotation, this._rotationPitch, this._localRotation);

        this.setDirty(TransformDirtyFlag.LocalMatrix);
        this.setNeedsUpdateWorldMatrix();
    }

    translate(translation: Vec3): Transform {
        vec3.add(this._localPosition, translation, this._localPosition);

        this.setDirty(TransformDirtyFlag.LocalMatrix);
        this.setNeedsUpdateWorldMatrix();

        return this;
    }

    updateLocalMatrix(force: boolean = false) {
        if(this.isDirty(TransformDirtyFlag.LocalMatrix) || force) {
            mat4.translation(this._localPosition, this._positionMatrix);
            mat4.fromQuat(this._localRotation, this._rotationMatrix);
            mat4.scale(this._localScale, this._scaleMatrix);

            mat4.mul(this._positionMatrix, this._rotationMatrix, this._localTransformMatrix);
            mat4.mul(this._localTransformMatrix, this._scaleMatrix, this._localTransformMatrix);
            this.clearDirty(TransformDirtyFlag.LocalMatrix);
        }
    }

    updateWorldMatrix(force: boolean = false) {
        if(this.isDirty(TransformDirtyFlag.WorldMatrix) || force) {
            if (this.entity.parent) {
                mat4.mul(
                    this.entity.parent.transform.transformMatrix,
                    this.localTransformMatrix,
                    this._transformMatrix
                );
            } else {
                mat4.copy(this.localTransformMatrix, this._transformMatrix);
            }
            mat4.inverse(this._transformMatrix, this._transformMatrixInverse);
            this.clearDirty(TransformDirtyFlag.WorldMatrix);
        }
    }

    setByMatrix(matrix: Mat4): Transform {
        const copy = mat4.clone(matrix);

        // extract scale
        mat4.getScaling(copy, this._localScale);
        if (mat4.determinant(copy) < 0) {
            this._localScale[0] *= -1;
        }

        // extract position
        mat4.getTranslation(copy, this._localPosition);
        copy[12] = 0;
        copy[13] = 0;
        copy[14] = 0;

        // remove scale
        const invScaleX = 1 / this._localScale[0];
        const invScaleY = 1 / this._localScale[1];
        const invScaleZ = 1 / this._localScale[2];
        copy[0] *= invScaleX;
        copy[1] *= invScaleX;
        copy[2] *= invScaleX;
        copy[4] *= invScaleY;
        copy[5] *= invScaleY;
        copy[6] *= invScaleY;
        copy[8] *= invScaleZ;
        copy[9] *= invScaleZ;
        copy[10] *= invScaleZ;

        // extract rotation
        quat.fromMat(copy, this._localRotation);

        this.setDirty(TransformDirtyFlag.LocalMatrix);
        this.setNeedsUpdateWorldMatrix();

        return this;
    }

    isDirty(flag: TransformDirtyFlag): boolean {
        return (this._dirtyFlag & flag) !== 0;
    }

    clearDirty(flag: TransformDirtyFlag) {
        this._dirtyFlag &= ~flag;
    }

    setDirty(flag: TransformDirtyFlag) {
        this._dirtyFlag |= flag;
    }

    setNeedsUpdateWorldMatrix() {
        this.entity.traverse((entity) => {
            // world matrix need to be updated
            entity.transform.setDirty(TransformDirtyFlag.WorldMatrix);
        })
    }
}

enum TransformDirtyFlag {
    None = 0,
    LocalMatrix = 1 << 0,
    WorldMatrix = 1 << 1,
    All = LocalMatrix | WorldMatrix,
}

export {Transform, TransformDirtyFlag};
