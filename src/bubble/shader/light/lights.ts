import {wgsl} from "@/bubble/resource/shader/processor";
import {autoBinding} from "@/bubble/resource/shader/shader_counter";

export default () => wgsl`
struct DirectionalLight {
    direction: vec3<f32>,
    color: vec3<f32>,
    intensity: f32,
};

struct PointLight {
    position: vec3<f32>,
    color: vec3<f32>,
    intensity: f32,
    range: f32,
};

struct SpotLight {
    position: vec3<f32>,
    direction: vec3<f32>,
    color: vec3<f32>,
    intensity: f32,
    range: f32,
    spotAngle: f32,
    spotBlend: f32,
};

struct AmbientLight {
    color: vec3<f32>,
    intensity: f32,
};

@group(0) @binding(${autoBinding(0)}) var<uniform> directionalLight: DirectionalLight;
@group(0) @binding(${autoBinding(0)}) var<uniform> ambientLight: AmbientLight;
@group(0) @binding(${autoBinding(0)}) var<storage> pointLights: array<PointLight>;
@group(0) @binding(${autoBinding(0)}) var<storage> spotLights: array<SpotLight>;
`;
