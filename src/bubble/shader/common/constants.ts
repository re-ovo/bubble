import {wgsl} from "@/bubble/shader/utils/processor";

export default () => wgsl`
const PI: f32 = 3.14159265359;

fn mat4fToMat3f(m: mat4x4<f32>) -> mat3x3<f32> {
    return mat3x3<f32>(
        vec3<f32>(m[0].xyz),
        vec3<f32>(m[1].xyz),
        vec3<f32>(m[2].xyz)
    );
}
`;
