import type {Component} from "@/core/component";
import {Transform} from "@/core/transform";

class Entity {
    name: string;
    transform: Transform;

    private _children: Entity[] = [];
    private _parent: Entity | null = null;

    private _components: Component[] = [];

    constructor(name: string) {
        this.name = name;
        this.transform = new Transform(this);
    }

    get parent(): Entity | null {
        return this._parent;
    }

    get children(): Entity[] {
        return this._children;
    }

    addChild(child: Entity) {
        if (child._parent) {
            // console.warn(`Entity ${child.name} already has a parent ${this.name}, removing it from the previous parent.`);
            child._parent.removeChild(child);
        }

        child._parent = this;
        this._children.push(child);
        return child;
    }

    removeChild(child: Entity) {
        const index = this._children.indexOf(child);
        if (index > -1) {
            child._parent = null;
            this._children.splice(index, 1);
        }
    }

    setParent(parent: Entity) {
        parent.addChild(this);
    }

    findEntityByName(name: string): Entity | null {
        if (this.name === name) {
            return this;
        }

        for (const child of this.children) {
            const entity = child.findEntityByName(name);
            if (entity) {
                return entity;
            }
        }

        return null;
    }

    traverse(callback: (entity: Entity) => void) {
        callback(this);
        this.children.forEach(child => child.traverse(callback));
    }

    get components(): Component[] {
        return this._components;
    }

    getComponent<T extends Component>(type: ComponentConstructor<T>): T | null {
        for (const component of this._components) {
            if (component instanceof type) {
                return component as T;
            }
        }
        return null;
    }

    addComponent<T extends Component>(type: ComponentConstructor<T>): T {
        const component = new type(this);
        this._components.push(component);
        return component;
    }

    removeComponent(type: ComponentConstructor<Component>) {
        const component = this.getComponent(type);
        if (component) {
            const index = this._components.indexOf(component);
            if (index > -1) {
                this._components.splice(index, 1);
            }
        }
    }
}

class Scene extends Entity {
    constructor() {
        super("Scene");
    }

    get root(): Entity {
        return this;
    }
}

export type ComponentConstructor<T extends Component> = { new(entity: Entity): T };

export { Entity, Scene };
