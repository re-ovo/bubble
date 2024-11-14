import {wgsl} from "@/bubble/shader/utils/processor";
import {autoBinding} from "@/bubble/shader/utils/binding_counter";
import {BindGroupId} from "@/bubble/shader/groups";

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

@group(${BindGroupId.PASS}) @binding(${autoBinding(BindGroupId.PASS)}) var<uniform> directionalLight: DirectionalLight;
@group(${BindGroupId.PASS}) @binding(${autoBinding(BindGroupId.PASS)}) var<uniform> ambientLight: AmbientLight;
@group(${BindGroupId.PASS}) @binding(${autoBinding(BindGroupId.PASS)}) var<storage> pointLights: array<PointLight>;
@group(${BindGroupId.PASS}) @binding(${autoBinding(BindGroupId.PASS)}) var<storage> spotLights: array<SpotLight>;
`;
