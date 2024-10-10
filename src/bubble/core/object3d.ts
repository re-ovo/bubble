import {Transform} from "@/bubble/math/transform";
import type {Component} from "@/bubble/core/component";
import type {Disposable} from "@/bubble/core/dispose";
import type {Scene} from "@/bubble/core/scene";

export class Object3D implements Disposable {
    readonly label: string;
    readonly scene: Scene | null = null;
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

    dispose() {} // dispose 只负责是否资源托管的资源，子对象的销毁交给它自己完成
}
