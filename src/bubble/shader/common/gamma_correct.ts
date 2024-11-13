import {wgsl} from "@/bubble/shader/utils/processor";

export default () => wgsl`
const gamma = 2.2;

fn gamma_correct(linear_color: vec3<f32>) -> vec3<f32> {
    return pow(linear_color, vec3<f32>(1.0 / gamma));
}
`
