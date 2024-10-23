import {type Mat4, type Quat, type RotationOrder, vec3, type Vec3} from "wgpu-matrix";

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

export function isMatrixOrthogonal(matrix: Mat4): boolean {
    const epsilon = 1e-6;

    const transpose = [
        matrix[0], matrix[4], matrix[8],
        matrix[1], matrix[5], matrix[9],
        matrix[2], matrix[6], matrix[10]
    ];

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            let dotProduct = 0;
            for (let k = 0; k < 3; k++) {
                dotProduct += matrix[i * 4 + k] * transpose[k * 3 + j];
            }
            if (i === j) {
                if (Math.abs(dotProduct - 1) > epsilon) {
                    return false;
                }
            } else {
                if (Math.abs(dotProduct) > epsilon) {
                    return false;
                }
            }
        }
    }

    return true;
}
