import {wgsl} from "@/bubble/shader/processor";
import {autoLocation} from "@/bubble/shader/counter";
import material_standard from "@/bubble/shader/material/material_standard";
import gamma_correct from "@/bubble/shader/common/gamma_correct";

export default () => wgsl`
${material_standard()}

struct VertexInput {
  @location(${autoLocation()}) position: vec3f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
}

@vertex
fn vs(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    
    output.position = vec4(input.position, 1.0);
    
    return output;
}

${gamma_correct()}

@fragment
fn fs(input: VertexOutput) -> @location(0) vec4f {
    return gamma_correct(material.color);
}
`
