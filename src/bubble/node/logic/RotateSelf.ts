import {Component, Transform} from "@/bubble/core/system";
import {quat, vec3} from "wgpu-matrix";

export class RotateSelf extends Component {
    update(deltaTime: number) {
        const transform = this.entity!.getComponent(Transform);
        transform!.rotateEulerAngles(vec3.create(0, deltaTime / 10, 0));
    }
}
