import type {Disposable} from "@/bubble/core/dispose";
import type {Scene} from "@/bubble/core/scene";
import {Transform} from "@/bubble/math/transform";
import type {Component, ComponentConstructor, ComponentHolder, NotTransformComponent} from "@/bubble/core/component";

export class Entity implements ComponentHolder, Disposable {
    label: string;
    scene: Scene | null = null;

    readonly transform: Transform = new Transform(this);
    readonly components: Map<ComponentConstructor<any>, Component> = new Map();

    constructor(label?: string) {
        this.label = label || "Entity";
    }

    setParent(parent: Entity) {
        this.transform.parentTransform = parent.transform;
    }

    getChildren(recursive: boolean = false, dst?: Entity[]): Entity[] {
        if (!this.scene) {
            return [];
        }
        return this.scene.getChildren(this, recursive, dst);
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
        if (this.scene) {
            this.scene.removeEntity(this);
        }
    }
}
