import {wgsl} from "@/bubble/shader/processor";
import {autoBinding} from "@/bubble/shader/counter";

export default () => wgsl`
struct CameraInput {
    projectionMatrix: mat4x4<f32>,
    viewMatrixInverse: mat4x4<f32>,
    cameraPosition: vec3<f32>,
}

@group(0) @binding(${autoBinding(0)}) var<uniform> camera: CameraInput;
`
