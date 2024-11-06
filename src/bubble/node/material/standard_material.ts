import {Material} from "@/bubble/node/material/material";
import {Shader} from "@/bubble/resource/shader";
import mesh_shader from "@/bubble/shader/mesh/mesh_shader";
import colors, {type Color3f, type Color4f} from "@/bubble/math/colors";
import {createImageBitmapOfColor} from "@/bubble/loader/texture_loader";
import {Texture2D} from "@/bubble/resource/texture";

export class StandardMaterial extends Material {
    constructor() {
        super(new Shader(mesh_shader));

        // default textures
        this.addTexture("albedoMap", defaultBaseColor);
        this.addTexture("normalMap", defaultNormalMap);
        this.addTexture("metallicMap", defaultMetallicMap);
        this.addTexture("roughnessMap", defaultRoughnessMap);
        this.addTexture("emissiveMap", defaultEmissiveMap);
        this.addTexture("occlusionMap", defaultOcclusionMap);

        // default uniform values
        this.setUniform("materialInfo", {
            baseColorFactor: colors.newColor4f(1, 1, 1, 1),
            metallicFactor: 0,
            roughnessFactor: 0.5,
            emissiveFactor: colors.newColor3f(0, 0, 0),
            occlusionStrength: 1,
        })
    }

    get color(): Color4f {
        const materialInfo = this.getUniform("materialInfo");
        return materialInfo.baseColorFactor;
    }

    set color(value: Color4f) {
        const materialInfo = this.getUniform("materialInfo");
        materialInfo.baseColorFactor = value;
        this.setUniform("materialInfo", materialInfo);
    }

    get metallic(): number {
        const materialInfo = this.getUniform("materialInfo");
        return materialInfo.metallicFactor;
    }

    set metallic(value: number) {
        const materialInfo = this.getUniform("materialInfo");
        materialInfo.metallicFactor = value;
        this.setUniform("materialInfo", materialInfo);
    }

    get roughness(): number {
        const materialInfo = this.getUniform("materialInfo");
        return materialInfo.roughnessFactor;
    }

    set roughness(value: number) {
        const materialInfo = this.getUniform("materialInfo");
        materialInfo.roughnessFactor = value;
        this.setUniform("materialInfo", materialInfo);
    }

    get emissive(): Color3f {
        const materialInfo = this.getUniform("materialInfo");
        return materialInfo.emissiveFactor;
    }

    set emissive(value: Color3f) {
        if (value.length !== 3) {
            throw new Error("Emissive factor must be a 3-component array.");
        }
        const materialInfo = this.getUniform("materialInfo");
        materialInfo.emissiveFactor = value;
        this.setUniform("materialInfo", materialInfo);
    }
}

const defaultBaseColor = new Texture2D(
    createImageBitmapOfColor(1, 1, '#FFFFFF'),
    [1, 1],
    'rgba8unorm',
)

const defaultNormalMap = new Texture2D(
    createImageBitmapOfColor(1, 1, '#8080FF'),
    [1, 1],
    'rgba8unorm',
)

const defaultMetallicMap = new Texture2D(
    createImageBitmapOfColor(1, 1, '#FFFFFF'),
    [1, 1],
    'rgba8unorm',
)

const defaultRoughnessMap = new Texture2D(
    createImageBitmapOfColor(1, 1, '#FFFFFF'),
    [1, 1],
    'rgba8unorm',
)

const defaultEmissiveMap = new Texture2D(
    createImageBitmapOfColor(1, 1, '#000000'),
    [1, 1],
    'rgba8unorm',
)

const defaultOcclusionMap = new Texture2D(
    createImageBitmapOfColor(1, 1, '#FFFFFF'),
    [1, 1],
    'rgba8unorm',
)
