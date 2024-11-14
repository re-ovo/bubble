import {wgsl} from "@/bubble/shader/utils/processor";

const GAMMA = 2.2;

export default () => wgsl`
fn gamma_correct(linear_color: vec3<f32>) -> vec3<f32> {
    return pow(linear_color, vec3<f32>(1.0 / ${GAMMA}));
}
`
