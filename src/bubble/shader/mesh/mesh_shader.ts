import {wgsl} from "@/bubble/shader/processor";
import {autoBinding, autoLocation, textureAndSampler} from "@/bubble/shader/counter";
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
  @location(${autoLocation()}) uv: vec2f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) normal: vec3f,
  @location(1) uv: vec2f,
  @location(2) fragPos: vec3f,
}

@vertex
fn vs(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    
    output.position = camera.projectionMatrix * camera.viewMatrixInverse * modelInfo.modelMatrix * vec4<f32>(input.position, 1.0);
    output.uv = input.uv;
    output.fragPos = (modelInfo.modelMatrix * vec4<f32>(input.position, 1.0)).xyz;
    
    // normal
    output.normal = mat4fToMat3f(transpose(modelInfo.modelMatrixInverse)) * input.normal;
    
    return output;
}

${gamma_correct()}

${textureAndSampler('baseColorTexture', 'texture_2d<f32>')}
${textureAndSampler('normalTexture', 'texture_2d<f32>')}

@fragment
fn fs(input: VertexOutput) -> @location(0) vec4f {
    let lightPosition = vec3<f32>(9.0, 15.0, 1.6);
    let lightRadiance = vec3<f32>(2.0);
    
    let N = normalize(input.normal);
    let V = normalize(camera.cameraPosition - input.fragPos);
    let L = normalize(lightPosition - input.fragPos);
    let H = normalize(V + L);
    
    let aa = material.metallic;
    let newfd = textureSample(normalTexture, normalTextureSampler, input.uv).xyz;
    
    let metallic = material.metallic;
    let roughness = material.roughness;
    
    let albedo = textureSample(baseColorTexture, baseColorTextureSampler, input.uv).xyz;
    let F0 = mix(vec3<f32>(0.04), albedo, metallic);
    var Lo = calculateBRDF(N, V, L, H, F0, roughness, metallic, albedo);
    Lo *= lightRadiance;
    
    let ambient = vec3<f32>(0.01) * albedo;
    let color = ambient + Lo;
    return vec4<f32>(gamma_correct(color), 1.0);
}
`
