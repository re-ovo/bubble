import {Transform} from "@/bubble/math/transform";
import type {Disposable} from "@/bubble/core/dispose";
import {ComponentHolder} from "@/bubble/core/component";
import type {Scene} from "@/bubble/core/scene";

export class Object3D extends ComponentHolder implements Disposable {
    readonly label: string;
    scene: Scene | null = null;
    readonly transform: Transform;

    constructor(label?: string) {
        super();
        this.label = label || "Object3D";
        this.transform = new Transform();
    }

    get parentTransform(): Transform | null {
        return this.transform.parent;
    }

    getChildren(recursive: boolean = false, dst?: Object3D[]): Object3D[] {
        if (!this.scene) {
            return [];
        }

        return this.scene.getChildren(this, recursive, dst);
    }

    dispose() {
        if (this.scene) {
            this.scene.removeObject(this);
        }
    }
}
