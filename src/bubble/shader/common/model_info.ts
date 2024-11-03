import {wgsl} from "@/bubble/resource/shader/processor";
import {autoBinding} from "@/bubble/resource/shader/shader_counter";

export default () => wgsl`
struct ModelInfo {
    modelMatrix: mat4x4<f32>,
    modelMatrixInverse: mat4x4<f32>,
}

@group(0) @binding(${autoBinding(0)}) var<uniform> modelInfo: ModelInfo;
`
