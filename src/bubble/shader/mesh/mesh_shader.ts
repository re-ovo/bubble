import {wgsl} from "@/bubble/shader/processor";
import {autoLocation} from "@/bubble/shader/counter";
import material_standard from "@/bubble/shader/material/material_standard";
import gamma_correct from "@/bubble/shader/common/gamma_correct";
import camera_input from "@/bubble/shader/common/camera_input";
import model_info from "@/bubble/shader/common/model_info";

export default () => wgsl`
${camera_input()}
${model_info()}
${material_standard()}

struct VertexInput {
  @location(${autoLocation()}) position: vec3f,
  @location(${autoLocation()}) normal: vec3f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) normal: vec3f,
}

@vertex
fn vs(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    
    output.position = camera.projectionMatrix * camera.viewMatrixInverse * modelInfo.modelMatrix * vec4<f32>(input.position, 1.0);
    output.normal = normalize((modelInfo.modelMatrix * vec4<f32>(input.normal, 0.0)).xyz);
    
    return output;
}

${gamma_correct()}

@fragment
fn fs(input: VertexOutput) -> @location(0) vec4f {
    let lightDirection = normalize(vec3<f32>(0.5, 0.5, 0.5));
        
    let normal = normalize(input.normal);
    
    let NdotL = dot(normal, lightDirection);
    
    let lightColor = vec3<f32>(1.0, 1.0, 1.0);
    
    let color = material.color.rgb * lightColor * max(NdotL, 0.1);
    return gamma_correct(vec4<f32>(color, material.color.a));
}
`
