import {type Quat, vec3, type Vec3} from "wgpu-matrix";

export function angleToRadians(angle: number): number {
    return angle * Math.PI / 180;
}

export function quatToEulerYXZ(q: Quat): Vec3 {
    if(q.length !== 4) throw new Error('Quaternion must have 4 components');

    const sinp = 2 * (q[3] * q[0] - q[2] * q[1]);
    let pitch;
    if (Math.abs(sinp) >= 1) {
        pitch = Math.sign(sinp) * Math.PI / 2;
    } else {
        pitch = Math.asin(sinp);
    }

    const siny_cosp = 2 * (q[3] * q[1] + q[0] * q[2]);
    const cosy_cosp = 1 - 2 * (q[0] * q[0] + q[1] * q[1]);
    const yaw = Math.atan2(siny_cosp, cosy_cosp);

    const sinr_cosp = 2 * (q[3] * q[2] + q[1] * q[0]);
    const cosr_cosp = 1 - 2 * (q[0] * q[0] + q[2] * q[2]);
    const roll = Math.atan2(sinr_cosp, cosr_cosp);

    return vec3.create(yaw, pitch, roll);
}
