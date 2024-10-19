import {wgsl} from "@/bubble/shader/processor";

export default () => wgsl`
const gamma = 2.2;

fn gamma_correct(linear_color: vec4<f32>) -> vec4<f32> {
    return pow(linear_color, vec4<f32>(1.0 / gamma));
}
`
