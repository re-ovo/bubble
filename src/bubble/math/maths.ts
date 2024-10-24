import {type Mat4} from "wgpu-matrix";

export function angleToRadians(angle: number): number {
    return angle * Math.PI / 180;
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
