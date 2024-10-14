import {wgsl} from "@/bubble/shader/processor";

export default () => wgsl`
struct CameraInput {
    projectionMatrix: mat4x4<f32>,
    cameraPosition: vec3<f32>,  
}
`