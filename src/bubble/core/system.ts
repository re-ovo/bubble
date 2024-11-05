import type {Disposable} from "@/bubble/core/dispose";
import {mat4, type Mat4, type Quat, quat, type RotationOrder, vec3, type Vec3} from "wgpu-matrix";
import {track, type Tracked, Tracker, TrackState} from "@/bubble/resource/tracker";

export class Scene implements ComponentHolder, Disposable {
    readonly objects: Entity[];
    readonly components: Map<ComponentConstructor<any>, Component> = new Map();

    constructor() {
        this.objects = [];
    }

    addEntity(entity: Entity) {
        this.objects.push(entity);
        entity.scene = this;
        return entity;
    }

    removeEntity(entity: Entity) {
        const index = this.objects.indexOf(entity);
        if (index > -1) {
            this.objects.splice(index, 1);
            entity.scene = null;
            entity.getComponent(Transform)!.parentTransform = null;
        }
    }

    getChildren(entity: Entity, recursive: boolean = false, dst?: Entity[]): Entity[] {
        const newDst = dst || [];
        for (let child of this.objects) {
            if (child.getComponent(Transform)!.parentTransform === entity.getComponent(Transform)!) {
                newDst.push(child);
                if (recursive) {
                    this.getChildren(child, recursive, newDst);
                }
            }
        }
        return newDst;
    }

    addComponent<T extends Component>(type: ComponentConstructor<T>): T {
        if (this.getComponent(type)) {
            throw new Error(`Component of type ${type.name} already exists.`);
        }
        const component = new type(this);
        this.components.set(type, component);
        return component as T;
    }

    removeComponent<T extends Component>(type: ComponentConstructor<T>) {
        this.components.delete(type);
    }

    getComponent<T extends Component>(type: ComponentConstructor<T>): T | null {
        for (let [key, value] of this.components) {
            if (key === type || key.prototype instanceof type) {
                return value as T;
            }
        }
        return null
    }

    dispose() {
        for (let object of this.objects) {
            object.dispose();
        }
    }
}

export class Entity implements ComponentHolder, Disposable {
    label: string;
    scene: Scene | null = null;

    readonly components: Map<ComponentConstructor<any>, Component> = new Map();

    constructor(label?: string) {
        this.label = label || "Entity";
        this.addComponent(Transform);
    }

    setParent(parent: Entity) {
        let currentParent: Entity | null = parent;
        while (currentParent) {
            if (currentParent === this) {
                throw new Error("Cannot set parent: would create a circular dependency.");
            }
            currentParent = currentParent.parent;
        }
        let transform = this.getComponent(Transform)!;
        transform.parentTransform = parent.getComponent(Transform);
    }

    get parent(): Entity | null {
        let transform = this.getComponent(Transform)!;
        let parentTransform = transform.parentTransform;
        if (!parentTransform) {
            return null;
        }
        return getComponentEntity(parentTransform);
    }

    getChildren(recursive: boolean = false, dst?: Entity[]): Entity[] {
        if (!this.scene) {
            return [];
        }
        return this.scene.getChildren(this, recursive, dst);
    }

    addComponent<T extends Component>(type: ComponentConstructor<T>): T {
        if (this.getComponent(type)) {
            throw new Error(`Component of type ${type.name} already exists.`);
        }
        const component = new type(this);
        this.components.set(type, component);
        return component as T;
    }

    removeComponent<T extends Component>(type: ComponentConstructor<T>) {
        this.components.delete(type);
    }

    getComponent<T extends Component>(type: ComponentConstructor<T>): T | null {
        for (let [key, value] of this.components) {
            if (key === type || key.prototype instanceof type) {
                return value as T;
            }
        }
        return null
    }

    dispose() {
        if (this.scene) {
            this.scene.removeEntity(this);
        }
    }
}

export class Component {
    readonly holder?: ComponentHolder;

    constructor(holder?: ComponentHolder) {
        this.holder = holder;
    }

    get scene(): Scene {
        return getComponentScene(this);
    }

    get entity(): Entity | null {
        return getComponentEntity(this);
    }

    /**
     * 每帧更新逻辑
     *
     * @param deltaTime 两帧之间的时间间隔
     */
    update?(deltaTime: number): void;


    /**
     * 更新逻辑之后
     *
     * 这里通常执行一些dirty数据的更新操作，不应该再产生新的dirty数据了
     */
    postUpdate?(): void;
}

export class Transform extends Component {
    parentTransform: Transform | null = null;

    position: Tracked<Vec3>; // this is local position
    rotation: Tracked<Quat>;
    scale: Tracked<Vec3>;

    positionMatrix: Mat4;
    rotationMatrix: Mat4;
    scaleMatrix: Mat4;

    transformMatrix: Tracked<Mat4>;
    localTransformMatrix: Tracked<Mat4>;
    transformMatrixInverse: Tracked<Mat4>;

    private _tracker = new Tracker<Float32Array>();

    constructor(parent?: ComponentHolder) {
        super(parent);

        this.position = track(vec3.create(0, 0, 0));
        this.rotation = track(quat.identity());
        this.scale = track(vec3.create(1, 1, 1));

        this.positionMatrix = mat4.create();
        this.rotationMatrix = mat4.create();
        this.scaleMatrix = mat4.create();

        this.localTransformMatrix = track(mat4.create());
        this.transformMatrix = track(mat4.create());
        this.transformMatrixInverse = track(mat4.create());

        this.updateMatrix();
    }


    postUpdate() {
        const [positionState, rotationState, scaleState] = this._tracker.getTrackStates(this.position, this.rotation, this.scale);

        if (positionState !== TrackState.FRESH || rotationState !== TrackState.FRESH || scaleState !== TrackState.FRESH) {
            this.updateMatrix();
            this.entity?.getChildren(true).forEach(child => {
                // update children transform recursively
                child.getComponent(Transform)!.updateMatrix();
            })
            this._tracker.markFresh(this.position, this.rotation, this.scale);
            console.log("update matrix due to transform change");
        }
    }

    updateMatrix() {
        mat4.translation(this.position, this.positionMatrix);
        mat4.fromQuat(this.rotation, this.rotationMatrix);
        mat4.scaling(this.scale, this.scaleMatrix);

        mat4.mul(
            this.positionMatrix,
            this.rotationMatrix,
            this.transformMatrix,
        ); // transformMatrix = position * rotation
        mat4.mul(
            this.transformMatrix,
            this.scaleMatrix,
            this.transformMatrix,
        ); // transformMatrix = position * rotation * scale
        mat4.copy(this.transformMatrix, this.localTransformMatrix);
        if (this.parentTransform) {
            mat4.mul(
                this.parentTransform.transformMatrix,
                this.transformMatrix,
                this.transformMatrix,
            );
        }
        mat4.inverse(this.transformMatrix, this.transformMatrixInverse);
    }

    // 返回指向摄像机前方的向量，不受旋转影响
    get forwardDirection(): Vec3 {
        // 默认指向z轴负方向
        const forward = vec3.create(0, 0, -1);
        // 旋转
        vec3.transformQuat(forward, this.rotation, forward);
        // 此时forward可能受到摄像机的旋转影响，需要将y轴的旋转置为0
        forward[1] = 0;
        // 归一化
        vec3.normalize(forward, forward);
        return forward;
    }

    get rightDirection(): Vec3 {
        const right = vec3.create(1, 0, 0);
        vec3.transformQuat(right, this.rotation, right);
        right[1] = 0;
        vec3.normalize(right, right);
        return right;
    }

    setPosition(position: Vec3): Transform {
        vec3.copy(position, this.position);
        return this;
    }

    setEulerAngle(rotation: Vec3, order: RotationOrder): Transform {
        if (rotation.length !== 3) throw new Error("Invalid rotation length");
        quat.fromEuler(rotation[0], rotation[1], rotation[2], order, this.rotation);
        return this;
    }

    setRotation(quaternion: Quat): Transform {
        if (quaternion.length !== 4) throw new Error("Invalid quaternion length");
        quat.copy(quaternion, this.rotation);
        return this
    }

    setScale(scale: Vec3): Transform {
        vec3.copy(scale, this.scale);
        return this;
    }


    private _rotationYaw = quat.identity();
    private _rotationPitch = quat.identity();

    rotateYawPitch(yaw: number, pitch: number) {
        quat.fromAxisAngle(vec3.create(0, 1, 0), yaw, this._rotationYaw);
        quat.fromAxisAngle(vec3.create(1, 0, 0), pitch, this._rotationPitch);

        quat.mul(this._rotationYaw, this.rotation, this.rotation);
        quat.mul(this.rotation, this._rotationPitch, this.rotation);
    }

    translate(translation: Vec3): Transform {
        vec3.add(this.position, translation, this.position);
        return this;
    }

    setByMatrix(matrix: Mat4): Transform {
        const copy = mat4.clone(matrix);

        // extract scale
        mat4.getScaling(copy, this.scale);
        if (mat4.determinant(copy) < 0) {
            this.scale[0] *= -1;
        }

        // extract position
        mat4.getTranslation(copy, this.position);
        copy[12] = 0;
        copy[13] = 0;
        copy[14] = 0;

        // remove scale
        const invScaleX = 1 / this.scale[0];
        const invScaleY = 1 / this.scale[1];
        const invScaleZ = 1 / this.scale[2];
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
        quat.fromMat(copy, this.rotation);

        return this;
    }
}

export type ComponentConstructor<T extends Component> = { new(holder: ComponentHolder): T };

export interface ComponentHolder {
    readonly components: Map<ComponentConstructor<any>, Component>

    addComponent<T extends Component>(type: ComponentConstructor<T>): T

    removeComponent<T extends Component>(type: ComponentConstructor<T>): void

    getComponent<T extends Component>(type: ComponentConstructor<T>): T | null
}

function getComponentScene(component: Component): Scene {
    if (component.holder instanceof Scene) {
        return component.holder;
    } else {
        // maybe object3d
        let parent = component.holder as any;
        return parent.scene!;
    }
}

function getComponentEntity(component: Component): Entity | null {
    if (component.holder instanceof Entity) {
        return component.holder;
    } else {
        return null;
    }
}
