import {Object3D} from "@/bubble/core/object3d";
import type {Disposable} from "@/bubble/core/dispose";

export class Scene implements Disposable {
    readonly objects: Object3D[];

    constructor() {
        this.objects = [];
    }

    addObject(object: Object3D) {
        this.objects.push(object);
        object.scene = this;
        return object;
    }

    removeObject(object: Object3D) {
        const index = this.objects.indexOf(object);
        if (index > -1) {
            this.objects.splice(index, 1);
            object.scene = null;
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

    dispose() {
        for (let object of this.objects) {
            object.dispose();
        }
    }
}
