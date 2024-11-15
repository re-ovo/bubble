import {wgsl} from "@/shader/utils/processor";
import {autoBinding} from "@/shader/utils/binding_counter";
import {BindGroupId} from "@/shader/groups";

export default () => wgsl`
struct CameraInput {
    projectionMatrix: mat4x4<f32>,
    viewMatrixInverse: mat4x4<f32>,
    cameraPosition: vec3<f32>,
}

@group(${BindGroupId.PASS}) @binding(${autoBinding(BindGroupId.PASS)}) var<uniform> camera: CameraInput;
`
