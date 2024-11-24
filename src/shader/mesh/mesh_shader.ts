import {wgsl} from "@/shader/utils/processor";
import {autoBinding, autoLocation, textureAndSampler} from "@/shader/utils/binding_counter";
import material_standard from "@/shader/material/material_standard";
import gamma_correct from "@/shader/common/gamma_correct";
import camera_input from "@/shader/common/camera_input";
import model_info from "@/shader/common/model_info";

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

struct FragmentInput {
    @location(0) normal: vec3f,
    @location(1) uv: vec2f,
    @location(2) fragPos: vec3f,
    @builtin(front_facing) isFrontFacing: bool,
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

${textureAndSampler('albedoMap', 'texture_2d<f32>')}
${textureAndSampler('normalMap', 'texture_2d<f32>')}
${textureAndSampler('pbrMap', 'texture_2d<f32>')}

fn get_normal(input: FragmentInput) -> vec3f {
    return select(-normalize(input.normal), normalize(input.normal), input.isFrontFacing);
}

@fragment
fn fs(input: FragmentInput) -> @location(0) vec4f {
    let lightDirection = vec3<f32>(-0.5, 0.5, 0.5);
    let lightRadiance = vec3<f32>(2.0);
    
    let N = get_normal(input);
    let V = normalize(camera.cameraPosition - input.fragPos);
    let L = normalize(lightDirection);
    let H = normalize(V + L);

    let metallic = material.metallic * textureSample(pbrMap, pbrMapSampler, input.uv).b;
    let roughness = material.roughness * textureSample(pbrMap, pbrMapSampler, input.uv).g;
    
    var albedo = textureSample(albedoMap, albedoMapSampler, input.uv).xyz;
    albedo *= material.color.rgb; // multiply by color factor
    
    let F0 = mix(vec3<f32>(0.04), albedo, metallic);
    var Lo = calculateBRDF(N, V, L, H, F0, roughness, metallic, albedo);
    Lo *= lightRadiance;
    
    let ambient = vec3<f32>(0.1) * albedo;
    let color = ambient + Lo;
    let alpha = material.color.a * textureSample(albedoMap, albedoMapSampler, input.uv).a;
  
    return vec4<f32>(gamma_correct(vec3f(color)), alpha);
}
`
