import type {Object3D} from "@/bubble/core/object3d";

/**
 * 组件接口
 */
export class Component {
    readonly parent: Object3D;

    constructor(object3d: Object3D) {
        this.parent = object3d;
    }

    getComponent<T extends Component>(type: { new(object3d: Object3D): T }): T | null {
        return this.parent.getComponent(type);
    }

    /**
     * 每帧更新逻辑
     *
     * @param deltaTime 两帧之间的时间间隔
     */
    update?(deltaTime: number): void;
}
