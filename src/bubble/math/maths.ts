import {mat3, mat4, quat, type Quat, type RotationOrder, vec3, type Vec3} from "wgpu-matrix";
import type {Transform} from "@/bubble/core/system";

export function angleToRadians(angle: number): number {
    return angle * Math.PI / 180;
}


export function quatToEuler(q: Quat, order: RotationOrder, dst?: Vec3): Vec3 {
    const newDst = dst || vec3.create();
    const [x, y, z, w] = q;

    switch (order) {
        case 'xyz': {
            const sinr_cosp = 2 * (w * x + y * z);
            const cosr_cosp = 1 - 2 * (x * x + y * y);
            newDst[0] = Math.atan2(sinr_cosp, cosr_cosp);

            const sinp = 2 * (w * y - z * x);
            if (Math.abs(sinp) >= 1) {
                newDst[1] = Math.sign(sinp) * Math.PI / 2; // use 90 degrees if out of range
            } else {
                newDst[1] = Math.asin(sinp);
            }

            const siny_cosp = 2 * (w * z + x * y);
            const cosy_cosp = 1 - 2 * (y * y + z * z);
            newDst[2] = Math.atan2(siny_cosp, cosy_cosp);
            break;
        }
        case 'yxz': {
            const sinp = 2 * (w * y - x * z);
            if (Math.abs(sinp) >= 1) {
                newDst[1] = Math.sign(sinp) * Math.PI / 2; // use 90 degrees if out of range
            } else {
                newDst[1] = Math.asin(sinp);
            }

            const sinr_cosp = 2 * (w * x + y * z);
            const cosr_cosp = 1 - 2 * (x * x + y * y);
            newDst[0] = Math.atan2(sinr_cosp, cosr_cosp);

            const siny_cosp = 2 * (w * z + x * y);
            const cosy_cosp = 1 - 2 * (y * y + z * z);
            newDst[2] = Math.atan2(siny_cosp, cosy_cosp);
            break;
        }
        default:
            throw new Error('Unsupported rotation order');
    }

    return newDst;
}

export type MatrixMajor = 'row' | 'column';

export function getTransformByMatrix(values: number[] | Float32Array, major: MatrixMajor): {
    translation: Vec3,
    scale: Vec3,
    rotation: Quat,
} {
    if (values.length !== 16) throw new Error('Matrix must have 16 components');
    const mat = mat4.create(...values)
    if (major === 'column') {
        // make it row-major
        mat4.transpose(mat, mat);
    }

    const translation = mat4.getTranslation(mat);
    const scale = mat4.getScaling(mat);
    const rot = quat.fromMat(mat);

    return {
        translation: translation,
        scale: scale,
        rotation: rot
    }
}
