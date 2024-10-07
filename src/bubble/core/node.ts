import {Transform} from "@/bubble/math/transform";
import type {Component} from "@/bubble/core/core";

export class Object3D {
    readonly label: string;
    readonly transform: Transform;
    readonly components: Map<{ new(object3d: Object3D): Component }, Component> = new Map();

    constructor(label?: string) {
        this.label = label || "Object3D";
        this.transform = new Transform();
    }

    get parentTransform(): Transform | null {
        return this.transform.parent;
    }

    addComponent<T extends Component>(type: { new(object3d: Object3D): T }): T {
        if (this.getComponent(type)) {
            throw new Error(`Component of type ${type.name} already exists.`);
        }

        const component = new type(this);
        this.components.set(type, component);
        return component;
    }

    removeComponent<T extends Component>(type: { new(object3d: Object3D): T }) {
        this.components.delete(type);
    }

    getComponent<T extends Component>(type: { new(object3d: Object3D): T }): T | null {
        for (let [key, value] of this.components) {
            if (key === type || key.prototype instanceof type) {
                return value as T;
            }
        }
        return null;
    }
}


export class Scene {
    readonly objects: Object3D[];

    constructor() {
        this.objects = [];
    }

    addObject(object: Object3D) {
        this.objects.push(object);
        return object;
    }

    removeObject(object: Object3D) {
        const index = this.objects.indexOf(object);
        if (index > -1) {
            this.objects.splice(index, 1);
        }
    }

    getChildren(object: Object3D, recursive: boolean = false, dst?: Object3D[]): Object3D[] {
        const newDst = dst || [];
        for (let child of this.objects) {
            if (child.transform.parent === object.transform) {
                newDst.push(child);
                if (recursive) {
                    this.getChildren(child, recursive, newDst);
                }
            }
        }
        return newDst;
    }
}
