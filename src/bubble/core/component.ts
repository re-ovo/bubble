import {Scene} from "@/bubble/core/scene";
import {Entity} from "@/bubble/core/entity";
import {Transform} from "@/bubble/math/transform";

/**
 * 组件接口
 */
export class Component {
    readonly parent: ComponentHolder;

    constructor(parent: ComponentHolder) {
        this.parent = parent;
    }

    // get scene parent
    get scene(): Scene {
        if (this.parent instanceof Scene) {
            return this.parent;
        } else {
            // maybe object3d
            let parent = this.parent as Entity;
            return parent.scene!;
        }
    }

    // get entity parent
    get entity(): Entity | null {
        if (this.parent instanceof Entity) {
            return this.parent;
        } else {
            return null;
        }
    }

    /**
     * 每帧更新逻辑
     *
     * @param deltaTime 两帧之间的时间间隔
     */
    update?(deltaTime: number): void;
}

export type ComponentConstructor<T extends Component> = { new(holder: ComponentHolder): T };

export type NotTransformComponent<T extends Component> = T extends Transform ? never : ComponentConstructor<T>;

export interface ComponentHolder {
    readonly transform: Transform
    readonly components: Map<ComponentConstructor<any>, Component>

    addComponent<T extends Component>(type: NotTransformComponent<T>): T

    removeComponent<T extends Component>(type: ComponentConstructor<T>): void

    getComponent<T extends Component>(type: NotTransformComponent<T>): T | null
}
