import {Material} from "@/node/material/material";
import {Shader} from "@/shader/shader";
import mesh_shader from "@/shader/mesh/mesh_shader";
import colors, {type Color3f, type Color4f} from "@/math/colors";
import {createSolidColorTexture} from "@/loader/texture_loader";
import {Texture2D} from "@/resource/texture";

export class StandardMaterial extends Material {
    constructor() {
        super(new Shader(mesh_shader));

        // default textures
        this.setTexture("albedoMap", defaultBaseColor);
        this.setTexture("normalMap", defaultNormalMap);
        this.setTexture("pbrMap", defaultMetallicMap);
        this.setTexture("emissiveMap", defaultEmissiveMap);
        this.setTexture("occlusionMap", defaultOcclusionMap);

        // default uniform values
        this.setUniform("material", {
            color: colors.White,
            roughness: 1.0, // 1.0 x any = any
            metallic: 1.0, // 1.0 x any = any
        })
    }

    get color(): Color4f {
        const materialInfo = this.getUniform("material");
        return materialInfo.baseColorFactor;
    }

    set color(value: Color4f) {
        const materialInfo = this.getUniform("material");
        materialInfo.baseColorFactor = value;
        this.setUniform("material", materialInfo);
    }

    get metallic(): number {
        const materialInfo = this.getUniform("material");
        return materialInfo.metallicFactor;
    }

    set metallic(value: number) {
        const materialInfo = this.getUniform("material");
        materialInfo.metallicFactor = value;
        this.setUniform("material", materialInfo);
    }

    get roughness(): number {
        const materialInfo = this.getUniform("material");
        return materialInfo.roughnessFactor;
    }

    set roughness(value: number) {
        const materialInfo = this.getUniform("material");
        materialInfo.roughnessFactor = value;
        this.setUniform("material", materialInfo);
    }

    get emissive(): Color3f {
        const materialInfo = this.getUniform("material");
        return materialInfo.emissiveFactor;
    }

    set emissive(value: Color3f) {
        if (value.length !== 3) {
            throw new Error("Emissive factor must be a 3-component array.");
        }
        const materialInfo = this.getUniform("material");
        materialInfo.emissiveFactor = value;
        this.setUniform("material", materialInfo);
    }
}

const defaultBaseColor = new Texture2D(
    createSolidColorTexture(1, 1, '#FFFFFF'),
    [1, 1],
    'rgba8unorm',
)

const defaultNormalMap = new Texture2D(
    createSolidColorTexture(1, 1, '#8080FF'),
    [1, 1],
    'rgba8unorm',
)

const defaultMetallicMap = new Texture2D(
    createSolidColorTexture(1, 1, '#FFFFFF'),
    [1, 1],
    'rgba8unorm',
)

const defaultRoughnessMap = new Texture2D(
    createSolidColorTexture(1, 1, '#FFFFFF'),
    [1, 1],
    'rgba8unorm',
)

const defaultEmissiveMap = new Texture2D(
    createSolidColorTexture(1, 1, '#000000'),
    [1, 1],
    'rgba8unorm',
)

const defaultOcclusionMap = new Texture2D(
    createSolidColorTexture(1, 1, '#FFFFFF'),
    [1, 1],
    'rgba8unorm',
)
