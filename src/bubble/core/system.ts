import type {Disposable} from "@/bubble/core/dispose";
import {notifyUpdate, type Versioned} from "@/bubble/resource/versioned";
import {mat4, type Mat4, quat, vec3, type Vec3} from "wgpu-matrix";
import {angleToRadians} from "@/bubble/math/maths";

export class Scene implements ComponentHolder, Disposable {
    readonly objects: Entity[];
    readonly components: Map<ComponentConstructor<any>, Component> = new Map();

    constructor() {
        this.objects = [];
        this.addComponent(Transform);
    }

    addEntity(entity: Entity) {
        this.objects.push(entity);
        entity.scene = this;
        entity.getComponent(Transform)!.parentTransform = this.getComponent(Transform);
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
    readonly holder: ComponentHolder;

    constructor(holder: ComponentHolder) {
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
    transformMatrixInverse: Mat4;

    constructor(parent: ComponentHolder) {
        super(parent);
        this.position = vec3.create(0, 0, 0);
        this.rotation = vec3.create(0, 0, 0);
        this.scale = vec3.create(1, 1, 1);
        this.positionMatrix = mat4.create();
        this.rotationMatrix = mat4.create();
        this.scaleMatrix = mat4.create();
        this.transformMatrix = mat4.create();
        this.transformMatrixInverse = mat4.create();
        this.updateMatrix();
    }

    private _rotationCache = quat.create();

    updateMatrix() {
        this.positionMatrix = mat4.translation(this.position, this.positionMatrix);

        quat.fromEuler(
            angleToRadians(this.rotation[0]),
            angleToRadians(this.rotation[1]),
            angleToRadians(this.rotation[2]),
            'yxz',
            this._rotationCache
        );
        quat.normalize(this._rotationCache, this._rotationCache);
        this.rotationMatrix = mat4.fromQuat(this._rotationCache, this.rotationMatrix);

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
        if (this.parentTransform) {
            this.transformMatrix = mat4.mul(
                this.parentTransform.transformMatrix,
                this.transformMatrix,
                this.transformMatrix,
            );
        }
        this.transformMatrixInverse = mat4.inverse(this.transformMatrix, this.transformMatrixInverse);
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

    setRotation(rotation: Vec3): Transform {
        vec3.copy(rotation, this.rotation);
        this.setNeedsUpdate()
        return this;
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
        this.setNeedsUpdate()
    }

    translate(translation: Vec3): Transform {
        vec3.add(this.position, translation, this.position);
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
