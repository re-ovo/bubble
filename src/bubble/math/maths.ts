import {type Quat, vec3, type Vec3} from "wgpu-matrix";

export function angleToRadians(angle: number): number {
    return angle * Math.PI / 180;
}


export function toEulerXYZ(q: Quat, dst: Vec3 | null = null): Vec3 {
    const newDst = (dst ?? vec3.create());

    const x = q[0];
    const y = q[1];
    const z = q[2];
    const w = q[3];

    const sinr_cosp = 2 * (w * x + y * z);
    const cosr_cosp = 1 - 2 * (x * x + y * y);
    newDst[0] = Math.atan2(sinr_cosp, cosr_cosp);

    const sinp = 2 * (w * y - z * x);
    if (Math.abs(sinp) >= 1) {
        newDst[1] = Math.sign(sinp) * Math.PI / 2;
    } else {
        newDst[1] = Math.asin(sinp);
    }

    const siny_cosp = 2 * (w * z + x * y);
    const cosy_cosp = 1 - 2 * (y * y + z * z);
    newDst[2] = Math.atan2(siny_cosp, cosy_cosp);

    return newDst;
}
