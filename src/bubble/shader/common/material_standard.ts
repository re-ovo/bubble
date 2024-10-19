import {wgsl} from "@/bubble/shader/processor";
import {autoBinding} from "@/bubble/shader/counter";

export default () => wgsl`
struct MaterialInfo {
    color: vec4<f32>,
    roughness: f32,
    metallic: f32,
}

@group(0) @binding(${autoBinding(0)}) var<uniform> material: MaterialInfo;
`;
