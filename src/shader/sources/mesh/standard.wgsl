#import bubble::tonemapping::gamma::gamma_correct
#import bubble::common::camera::{CameraInput}
#import bubble::common::model::{ModelInfo}
#import bubble::common::converts::{mat4fToMat3f}
#import bubble::brdf::cooktorrance::{MaterialInfo, calculateBRDF}

struct VertexInput {
    @location(0) position: vec3f,
    @location(1) normal: vec3f,
    @location(2) uv: vec2f,
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

@group(0) @binding(auto) var<uniform> camera: CameraInput;
@group(1) @binding(auto) var<uniform> modelInfo: ModelInfo;
@group(1) @binding(auto) var<uniform> material: MaterialInfo;

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

fn get_normal(input: FragmentInput) -> vec3f {
    return select(-normalize(input.normal), normalize(input.normal), input.isFrontFacing);
}

@group(1) @binding(auto) var albedoMap: texture_2d<f32>;
@group(1) @binding(auto) var albedoMapSampler: sampler;
@group(1) @binding(auto) var normalMap: texture_2d<f32>;
@group(1) @binding(auto) var normalMapSampler: sampler;
@group(1) @binding(auto) var pbrMap: texture_2d<f32>;
@group(1) @binding(auto) var pbrMapSampler: sampler;
@group(1) @binding(auto) var emissiveMap: texture_2d<f32>;
@group(1) @binding(auto) var emissiveMapSampler: sampler;

@fragment
fn fs(input: FragmentInput) -> @location(0) vec4f {
    let lightDirection = vec3<f32>(-0.5, 0.5, 0.5);
    let lightRadiance = vec3<f32>(10.0);
    
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
    let emissive = textureSample(emissiveMap, emissiveMapSampler, input.uv).rgb * material.emission;
    let color = emissive + ambient + Lo;
    let alpha = material.color.a * textureSample(albedoMap, albedoMapSampler, input.uv).a;
  
    return vec4<f32>(gamma_correct(vec3f(color)), alpha);
}
