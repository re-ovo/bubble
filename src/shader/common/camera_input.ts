import {wgsl} from "@/shader/utils/processor";
import {autoBinding, providerWGSLCounterScope} from "@/shader/utils/binding_counter";
import {BindGroupId} from "@/shader/groups";
import {makeShaderDataDefinitions, VariableDefinition} from "webgpu-utils";

const cameraCode = () => wgsl`
struct CameraInput {
    projectionMatrix: mat4x4<f32>,
    viewMatrixInverse: mat4x4<f32>,
    cameraPosition: vec3<f32>,
}

${autoBinding(BindGroupId.PASS)} var<uniform> camera: CameraInput;
`

export const cameraVariable: VariableDefinition = providerWGSLCounterScope(() => makeShaderDataDefinitions(cameraCode()).uniforms['camera'])

export default cameraCode
