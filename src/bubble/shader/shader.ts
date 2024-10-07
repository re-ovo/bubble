import type {Object3D} from "@/bubble/core/object3d";

export interface Shader {
    properties: ShaderProperties;
    source?: (ctx: Object3D) => string;
}

export interface ShaderProperties {
    [key: string]: ShaderProperty<any>;
}

export interface ShaderProperty<T> {
    value: T;
    type: ShaderPropertyType;
}

export type ShaderPropertyType = "int" | "float" | "vec2" | "vec3" | "vec4" | "mat4" | "sampler2D";
