/**
 * 组件接口
 */
export class Component {
    readonly parent: ComponentHolder;

    constructor(parent: ComponentHolder) {
        this.parent = parent;
    }

    /**
     * 每帧更新逻辑
     *
     * @param deltaTime 两帧之间的时间间隔
     */
    update?(deltaTime: number): void;
}

/**
 * 组件构造器
 *
 * @param T 组件类型
 * @param P 组件持有者类型
 */
export type ComponentConstructor<T extends Component> = { new(holder: ComponentHolder): T };

export abstract class ComponentHolder {
    readonly components: Map<ComponentConstructor<any>, Component> = new Map();

    addComponent<T extends Component>(type: ComponentConstructor<T>): T {
        if (this.getComponent(type)) {
            throw new Error(`Component of type ${type.name} already exists.`);
        }
        const component = new type(this);
        this.components.set(type, component);
        return component;
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
        return null;
    }
}
