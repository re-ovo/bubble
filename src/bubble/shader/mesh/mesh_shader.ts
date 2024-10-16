import {wgsl} from "@/bubble/shader/processor";
import camera_input from "@/bubble/shader/common/camera_input";
import {autoBinding, autoLocation} from "@/bubble/shader/counter";

export default () => wgsl`
${camera_input()}

struct VertexInput {
  @location(${autoLocation()}) position: vec3f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
}

@vertex
fn vs(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    
    output.position = camera.projectionMatrix * camera.viewMatrixInverse * vec4(input.position, 1.0);
    
    return output;
}

@fragment
fn fs(input: VertexOutput) -> @location(0) vec4f {
    return vec4(0.7, 0.7, 0.7, 1.0);
}
`
