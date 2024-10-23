import type {Disposable} from "@/bubble/core/dispose";
import {notifyUpdate, type Versioned} from "@/bubble/resource/versioned";
import {mat4, type Mat4, type Quat, quat, vec3, type Vec3} from "wgpu-matrix";
import {isMatrixOrthogonal, quatToEuler} from "@/bubble/math/maths";

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
}

export class Transform extends Component implements Versioned {
    version: number = 0;

    parentTransform: Transform | null = null;

    position: Vec3; // this is local position
    rotation: Vec3;
    scale: Vec3;

    positionMatrix: Mat4;
    rotationMatrix: Mat4;
    scaleMatrix: Mat4;

    transformMatrix: Mat4;
    localTransformMatrix: Mat4;
    transformMatrixInverse: Mat4;

    constructor(parent?: ComponentHolder) {
        super(parent);
        this.position = vec3.create(0, 0, 0);
        this.rotation = vec3.create(0, 0, 0);
        this.scale = vec3.create(1, 1, 1);
        this.positionMatrix = mat4.create();
        this.rotationMatrix = mat4.create();
        this.scaleMatrix = mat4.create();
        this.localTransformMatrix = mat4.create();
        this.transformMatrix = mat4.create();
        this.transformMatrixInverse = mat4.create();
        this.updateMatrix();
    }

    private _rotationCache = quat.create();

    updateMatrix() {
        mat4.translation(this.position, this.positionMatrix);

        quat.fromEuler(
            this.rotation[0],
            this.rotation[1],
            this.rotation[2],
            'yxz',
            this._rotationCache
        );
        quat.normalize(this._rotationCache, this._rotationCache);
        mat4.fromQuat(this._rotationCache, this.rotationMatrix);

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

    setNeedsUpdate() {
        this.version++;
        notifyUpdate(this);
    }

    get forwardDirection(): Vec3 {
        return vec3.transformMat4(vec3.create(0, 0, -1), this.rotationMatrix);
    }

    get rightDirection(): Vec3 {
        return vec3.transformMat4(vec3.create(1, 0, 0), this.rotationMatrix);
    }

    get upDirection(): Vec3 {
        return vec3.transformMat4(vec3.create(0, 1, 0), this.rotationMatrix);
    }

    lookAt(target: Vec3): Transform {
        const matrix = mat4.lookAt(this.position, target, vec3.create(0, 1, 0));
        quat.fromMat(matrix, this.rotation)
        this.setNeedsUpdate()
        return this;
    }

    setPosition(position: Vec3): Transform {
        vec3.copy(position, this.position);
        this.setNeedsUpdate()
        return this;
    }

    setTranslation(translation: Vec3): Transform {
        vec3.copy(translation, this.position);
        this.setNeedsUpdate()
        return this;
    }

    setRotation(rotation: Vec3): Transform {
        if (rotation.length !== 3) throw new Error("Invalid rotation length");
        vec3.copy(rotation, this.rotation);
        this.setNeedsUpdate()
        return this;
    }

    setRotationByQuaternion(quaternion: Quat): Transform {
        if (quaternion.length !== 4) throw new Error("Invalid quaternion length");
        quat.normalize(quaternion, quaternion);
        quatToEuler(quaternion, 'yxz', this.rotation);
        this.setNeedsUpdate()
        return this
    }

    setScale(scale: Vec3): Transform {
        vec3.copy(scale, this.scale);
        this.setNeedsUpdate()
        return this;
    }

    rotateEulerAngles(eulerAngles: Vec3): Transform {
        vec3.add(this.rotation, eulerAngles, this.rotation);
        this.setNeedsUpdate()
        this.updateMatrix()
        return this;
    }

    // yaw/pitch is in radians
    rotateYawPitch(yaw: number, pitch: number) {
        this.rotation[1] += yaw;
        this.rotation[0] += pitch;
        this.rotation[0] = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation[0]));
        this.setNeedsUpdate()
    }

    translate(translation: Vec3): Transform {
        vec3.add(this.position, translation, this.position);
        this.setNeedsUpdate()
        return this;
    }

    setByMatrix(matrix: Mat4): Transform {
        const copy = mat4.clone(matrix);

        // extract position
        mat4.getTranslation(copy, this.position);
        copy[12] = 0;
        copy[13] = 0;
        copy[14] = 0;

        // extract scale
        mat4.getScaling(copy, this.scale);

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

        const newQuat = quat.create(0, 0, 0, 1);
        quat.fromMat(copy, newQuat);
        // const trace = copy[0] + copy[5] + copy[10];
        // if (trace > 0) {
        //     // |w| > 1/2, may as well choose w > 1/2
        //     const root = Math.sqrt(trace + 1);  // 2w
        //     newQuat[3] = 0.5 * root; // w
        //     const invRoot = 0.5 / root;
        //     newQuat[0] = (copy[6] - copy[9]) * invRoot;
        //     newQuat[1] = (copy[8] - copy[2]) * invRoot;
        //     newQuat[2] = (copy[1] - copy[4]) * invRoot;
        // } else {
        //     if (copy[0] > copy[5] && copy[0] > copy[10]) {
        //         const s = 2.0 * Math.sqrt(1.0 + copy[0] - copy[5] - copy[10]);
        //         newQuat[3] = (copy[9] - copy[6]) / s;
        //         newQuat[0] = 0.25 * s;
        //         newQuat[1] = (copy[1] + copy[4]) / s;
        //         newQuat[2] = (copy[8] + copy[2]) / s;
        //     } else if (copy[5] > copy[10]) {
        //         const s = 2.0 * Math.sqrt(1.0 + copy[5] - copy[0] - copy[10]);
        //         newQuat[3] = (copy[2] - copy[8]) / s;
        //         newQuat[0] = (copy[1] + copy[4]) / s;
        //         newQuat[1] = 0.25 * s;
        //         newQuat[2] = (copy[6] + copy[9]) / s;
        //     } else {
        //         const s = 2.0 * Math.sqrt(1.0 + copy[10] - copy[0] - copy[5]);
        //         newQuat[3] = (copy[4] - copy[1]) / s;
        //         newQuat[0] = (copy[8] + copy[2]) / s;
        //         newQuat[1] = (copy[6] + copy[9]) / s;
        //         newQuat[2] = 0.25 * s;
        //     }
        // }
        quatToEuler(newQuat, 'yxz', this.rotation);
        this.setNeedsUpdate()
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
