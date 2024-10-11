import {type Vec3} from "wgpu-matrix";
import {struct, vec3f} from "typegpu/data";
import tgpu from "typegpu";

export class AABB {
    private readonly _min: Vec3;
    private readonly _max: Vec3;

    constructor(min: Vec3, max: Vec3) {
        this._min = min;
        this._max = max;
    }

    get min() {
        return this._min;
    }

    get max() {
        return this._max;
    }
}

const test = struct({
    min: vec3f,
    max: vec3f
});

struct({
    oo: test
})