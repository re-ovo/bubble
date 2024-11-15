import {wgsl} from "@/shader/utils/processor";
import {autoBinding} from "@/shader/utils/binding_counter";
import {BindGroupId} from "@/shader/groups";

export default () => wgsl`
struct ModelInfo {
    modelMatrix: mat4x4<f32>,
    modelMatrixInverse: mat4x4<f32>,
}

@group(${BindGroupId.MODEL}) @binding(${autoBinding(BindGroupId.MODEL)}) var<uniform> modelInfo: ModelInfo;
`
