import type {Shader} from "@/bubble/shader/shader";
import tgpu from "typegpu";

export class Material {
    shader: Shader | null;
    blendMode: BlendMode;

    constructor(shader: Shader | null) {
        this.shader = shader;
        this.blendMode = BlendMode.Opaque;
    }
}

export enum BlendMode {
    Opaque, // 不透明
    AlphaBlend, // 半透明
    Additive, // 加法混合
    Multiply // 乘法混合
}
