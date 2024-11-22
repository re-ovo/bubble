import {wgsl} from "@/shader/utils/processor";
import {autoBinding} from "@/shader/utils/binding_counter";
import constants from "@/shader/common/constants";
import {BindGroupId} from "@/shader/groups";

export default () => wgsl`
${constants()}

struct MaterialInfo {
    color: vec4<f32>,
    roughness: f32,
    metallic: f32,
    emission: vec3<f32>,
}

${autoBinding(BindGroupId.MATERIAL)} var<uniform> material: MaterialInfo;

// Cook-Torrance BRDF

const EPSILON: f32 = 0.001;

fn fresnelSchlick(cosTheta: f32, F0: vec3<f32>) -> vec3<f32> {
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

fn distributionGGX(N: vec3<f32>, H: vec3<f32>, roughness: f32) -> f32 {
    let a: f32 = roughness * roughness;
    let a2: f32 = a * a;
    let NdotH: f32 = max(dot(N, H), 0.0);
    let NdotH2: f32 = NdotH * NdotH;

    let num: f32 = a2;
    let denom: f32 = (NdotH2 * (a2 - 1.0) + 1.0);
    return num / (PI * denom * denom);
}

fn geometrySchlickGGX(NdotV: f32, roughness: f32) -> f32 {
    let r: f32 = (roughness + 1.0);
    let k: f32 = (r * r) / 8.0;

    let num: f32 = NdotV;
    let denom: f32 = NdotV * (1.0 - k) + k;
    return num / denom;
}

fn geometrySmith(N: vec3<f32>, V: vec3<f32>, L: vec3<f32>, roughness: f32) -> f32 {
    let NdotV: f32 = max(dot(N, V), 0.0);
    let NdotL: f32 = max(dot(N, L), 0.0);
    let ggx2: f32 = geometrySchlickGGX(NdotV, roughness);
    let ggx1: f32 = geometrySchlickGGX(NdotL, roughness);
    return ggx1 * ggx2;
}

fn calculateBRDF(N: vec3<f32>, V: vec3<f32>, L: vec3<f32>, H: vec3<f32>, F0: vec3<f32>, roughness: f32, metallic: f32, albedo: vec3<f32>) -> vec3<f32> {
    let NDF: f32 = distributionGGX(N, H, roughness);
    let G: f32 = geometrySmith(N, V, L, roughness);
    let F: vec3<f32> = fresnelSchlick(max(dot(H, V), 0.0), F0);

    let nominator: vec3<f32> = NDF * G * F;
    let denominator: f32 = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + EPSILON;
    let specular: vec3<f32> = nominator / vec3<f32>(denominator);

    let kS: vec3<f32> = F;
    var kD: vec3<f32> = vec3<f32>(1.0) - kS;
    kD *= 1.0 - metallic;

    let NdotL: f32 = max(dot(N, L), 0.0);
    return (kD * albedo / PI + specular) * NdotL;
}
`;
