import {Entity} from "@/bubble/core/entity";
import type {Disposable} from "@/bubble/core/dispose";
import type {Component, ComponentConstructor, ComponentHolder, NotTransformComponent} from "@/bubble/core/component";
import {Transform} from "@/bubble/math/transform";

export class Scene implements ComponentHolder, Disposable {
    readonly objects: Entity[];

    readonly transform: Transform = new Transform(this);
    readonly components: Map<ComponentConstructor<any>, Component> = new Map();

    constructor() {
        this.objects = [];
    }

    addObject(object: Entity) {
        this.objects.push(object);
        object.scene = this;
        object.transform.parentTransform = this.transform;
        return object;
    }

    removeObject(object: Entity) {
        const index = this.objects.indexOf(object);
        if (index > -1) {
            this.objects.splice(index, 1);
            object.scene = null;
        }
    }

    getChildren(object: Entity, recursive: boolean = false, dst?: Entity[]): Entity[] {
        const newDst = dst || [];
        for (let child of this.objects) {
            if (child.transform.parentTransform === object.transform) {
                newDst.push(child);
                if (recursive) {
                    this.getChildren(child, recursive, newDst);
                }
            }
        }
        return newDst;
    }

    addComponent<T extends Component>(type: NotTransformComponent<T>): T {
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

    getComponent<T extends Component>(type: NotTransformComponent<T>): T | null {
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
